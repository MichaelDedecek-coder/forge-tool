import { NextResponse } from 'next/server';
import { createPortalSession } from '@/app/lib/stripe';
import { createServerClient } from '@/app/lib/supabase-server';

/**
 * POST /api/stripe/portal
 * Create a Stripe billing portal session for subscription management
 */
export async function POST(request) {
  try {
    const supabase = await createServerClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's subscription with Stripe customer ID
    const { data: subscription, error: subError } = await supabase
      .from('users_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (subError || !subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Create portal session
    const portalUrl = await createPortalSession(subscription.stripe_customer_id);

    return NextResponse.json({ url: portalUrl });

  } catch (error) {
    console.error('Portal error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
