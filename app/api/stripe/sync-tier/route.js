import { NextResponse } from 'next/server';
import { stripe } from '@/app/lib/stripe';
import { createServerClient } from '@/app/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * POST /api/stripe/sync-tier
 * Check Stripe for active subscription and sync profile tier.
 * Called client-side as a fallback when webhook may not have fired.
 */
export async function POST(request) {
  try {
    // Get authenticated user
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Look up Stripe customer by email
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return NextResponse.json({ tier: 'free', reason: 'No Stripe customer found' });
    }

    const customer = customers.data[0];

    // Check for active or trialing subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      limit: 5,
    });

    const activeSub = subscriptions.data.find(
      sub => sub.status === 'active' || sub.status === 'trialing'
    );

    if (!activeSub) {
      return NextResponse.json({ tier: 'free', reason: 'No active subscription' });
    }

    // Active subscription found — update profile to PRO
    const supabaseAdmin = getSupabaseAdmin();

    await supabaseAdmin
      .from('profiles')
      .update({
        tier: 'pro',
        stripe_customer_id: customer.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    // Also sync users_subscriptions table
    await supabaseAdmin
      .from('users_subscriptions')
      .upsert({
        user_id: user.id,
        tier: 'pro',
        stripe_customer_id: customer.id,
        stripe_subscription_id: activeSub.id,
        subscription_status: activeSub.status,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    return NextResponse.json({ tier: 'pro', synced: true });

  } catch (error) {
    console.error('[sync-tier] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
