-- DataWizard Subscription & Usage Tracking Schema
-- Run this in Supabase SQL Editor

-- 1. Users Subscriptions Table
CREATE TABLE IF NOT EXISTS public.users_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL DEFAULT 'free', -- 'free' or 'pro'
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_price_id TEXT,
    subscription_status TEXT, -- 'active', 'trialing', 'canceled', 'past_due', 'incomplete'
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id),
    UNIQUE(stripe_customer_id),
    UNIQUE(stripe_subscription_id)
);

-- 2. Usage Tracking Table
CREATE TABLE IF NOT EXISTS public.users_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month TEXT NOT NULL, -- Format: 'YYYY-MM'
    analyses_count INTEGER DEFAULT 0,
    total_rows_processed BIGINT DEFAULT 0,
    last_analysis_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, month)
);

-- 3. Analysis History Table (for PRO users with storage)
CREATE TABLE IF NOT EXISTS public.analysis_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT,
    row_count INTEGER,
    report_data JSONB, -- Store the parsed report
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ -- Based on tier storage days
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_subscriptions_user_id ON public.users_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_users_subscriptions_stripe_customer ON public.users_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_usage_user_month ON public.users_usage(user_id, month);
CREATE INDEX IF NOT EXISTS idx_analysis_history_user_id ON public.analysis_history(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_history_expires ON public.analysis_history(expires_at);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_users_subscriptions_updated_at BEFORE UPDATE ON public.users_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_usage_updated_at BEFORE UPDATE ON public.users_usage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to initialize FREE tier for new users
CREATE OR REPLACE FUNCTION initialize_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users_subscriptions (user_id, tier)
    VALUES (NEW.id, 'free')
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create subscription when user signs up
CREATE TRIGGER on_user_created AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION initialize_user_subscription();

-- Function to get current month usage
CREATE OR REPLACE FUNCTION get_user_usage(p_user_id UUID)
RETURNS TABLE (
    analyses_count INTEGER,
    total_rows_processed BIGINT,
    month TEXT
) AS $$
DECLARE
    current_month TEXT := TO_CHAR(NOW(), 'YYYY-MM');
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(u.analyses_count, 0)::INTEGER,
        COALESCE(u.total_rows_processed, 0)::BIGINT,
        current_month
    FROM public.users_usage u
    WHERE u.user_id = p_user_id AND u.month = current_month;

    -- If no record exists, return zeros
    IF NOT FOUND THEN
        RETURN QUERY SELECT 0::INTEGER, 0::BIGINT, current_month;
    END IF;
END;
$$ language 'plpgsql';

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_user_usage(
    p_user_id UUID,
    p_rows_processed INTEGER
)
RETURNS VOID AS $$
DECLARE
    current_month TEXT := TO_CHAR(NOW(), 'YYYY-MM');
BEGIN
    INSERT INTO public.users_usage (user_id, month, analyses_count, total_rows_processed, last_analysis_at)
    VALUES (p_user_id, current_month, 1, p_rows_processed, NOW())
    ON CONFLICT (user_id, month)
    DO UPDATE SET
        analyses_count = users_usage.analyses_count + 1,
        total_rows_processed = users_usage.total_rows_processed + p_rows_processed,
        last_analysis_at = NOW();
END;
$$ language 'plpgsql';

-- Function to check if user can analyze
CREATE OR REPLACE FUNCTION can_user_analyze(
    p_user_id UUID,
    p_row_count INTEGER
)
RETURNS JSONB AS $$
DECLARE
    v_tier TEXT;
    v_subscription_status TEXT;
    v_usage_count INTEGER;
    v_max_rows INTEGER;
    v_max_analyses INTEGER;
BEGIN
    -- Get user tier and status
    SELECT tier, subscription_status INTO v_tier, v_subscription_status
    FROM public.users_subscriptions
    WHERE user_id = p_user_id;

    -- If no subscription found, assume FREE
    IF v_tier IS NULL THEN
        v_tier := 'free';
        v_subscription_status := 'active';
    END IF;

    -- Get current usage
    SELECT analyses_count INTO v_usage_count
    FROM get_user_usage(p_user_id);

    -- Set limits based on tier
    IF v_tier = 'free' THEN
        v_max_rows := 10000;
        v_max_analyses := 5;
    ELSE -- pro
        v_max_rows := 999999999; -- Effectively unlimited
        v_max_analyses := 999999999;
    END IF;

    -- Check subscription status (only for PRO)
    IF v_tier = 'pro' AND v_subscription_status NOT IN ('active', 'trialing') THEN
        RETURN jsonb_build_object(
            'allowed', FALSE,
            'reason', 'subscription_inactive',
            'message', 'Your PRO subscription is not active. Please update your payment method.'
        );
    END IF;

    -- Check row limit
    IF p_row_count > v_max_rows THEN
        RETURN jsonb_build_object(
            'allowed', FALSE,
            'reason', 'row_limit',
            'message', format('Your %s plan supports up to %s rows. This file has %s rows.',
                UPPER(v_tier), v_max_rows, p_row_count),
            'upgrade_tier', 'pro'
        );
    END IF;

    -- Check monthly analysis limit
    IF v_usage_count >= v_max_analyses THEN
        RETURN jsonb_build_object(
            'allowed', FALSE,
            'reason', 'analysis_limit',
            'message', format('You have used %s/%s analyses this month.', v_usage_count, v_max_analyses),
            'upgrade_tier', 'pro'
        );
    END IF;

    -- All checks passed
    RETURN jsonb_build_object(
        'allowed', TRUE,
        'tier', v_tier,
        'usage_count', v_usage_count,
        'usage_limit', v_max_analyses
    );
END;
$$ language 'plpgsql';

-- RLS Policies
ALTER TABLE public.users_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;

-- Users can only read their own subscription
CREATE POLICY "Users can view own subscription" ON public.users_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only read their own usage
CREATE POLICY "Users can view own usage" ON public.users_usage
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only read their own analysis history
CREATE POLICY "Users can view own analysis history" ON public.analysis_history
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can do anything (for API routes)
CREATE POLICY "Service role has full access to subscriptions" ON public.users_subscriptions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to usage" ON public.users_usage
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to history" ON public.analysis_history
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Cleanup function for expired analysis history
CREATE OR REPLACE FUNCTION cleanup_expired_analyses()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.analysis_history
    WHERE expires_at < NOW();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ language 'plpgsql';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_user_analyze(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_user_usage(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_analyses() TO service_role;

-- Comments
COMMENT ON TABLE public.users_subscriptions IS 'Stores user subscription information and Stripe data';
COMMENT ON TABLE public.users_usage IS 'Tracks monthly usage per user for tier limits';
COMMENT ON TABLE public.analysis_history IS 'Stores analysis reports for PRO users';
COMMENT ON FUNCTION can_user_analyze IS 'Checks if user can perform analysis based on tier limits';
COMMENT ON FUNCTION increment_user_usage IS 'Increments user usage after successful analysis';
