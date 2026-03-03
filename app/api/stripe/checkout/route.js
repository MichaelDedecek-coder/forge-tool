import { NextResponse } from 'next/server';
import { createCheckoutSession } from '@/app/lib/stripe';
import { createClient } from '@/app/lib/supabase-server';

/**
 * POST /api/stripe/checkout
 * Create a Stripe checkout session for PRO subscription
 */
export async function POST(request) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's current subscription (if any)
    const { data: subscription } = await supabase
      .from('users_subscriptions')
      .select('stripe_customer_id, tier')
      .eq('user_id', user.id)
      .single();

    // Check if already PRO
    if (subscription?.tier === 'pro') {
      return NextResponse.json(
        { error: 'Already subscribed to PRO' },
        { status: 400 }
      );
    }

    // Create checkout session
    const checkoutUrl = await createCheckoutSession(
      user.id,
      user.email,
      subscription?.stripe_customer_id || null
    );

    return NextResponse.json({ url: checkoutUrl });

  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
