import { NextResponse } from 'next/server';
import { constructWebhookEvent } from '@/app/lib/stripe';
import { sendProWelcomeEmail } from '@/app/lib/email';
import { createClient } from '@supabase/supabase-js';

// Helper to get Supabase admin client
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhook events
 *
 * IMPORTANT: Configure this URL in Stripe Dashboard:
 * https://dashboard.stripe.com/webhooks
 *
 * Events to listen for:
 * - checkout.session.completed
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 */
export async function POST(request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  try {
    // Initialize Supabase admin client
    const supabaseAdmin = getSupabaseAdmin();

    // Verify webhook signature
    const event = await constructWebhookEvent(body, signature);

    console.log(`[Webhook] Received: ${event.type}`);

    // Handle different event types — pass supabaseAdmin to each handler
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object, supabaseAdmin);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object, supabaseAdmin);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, supabaseAdmin);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object, supabaseAdmin);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object, supabaseAdmin);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('[Webhook] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

/**
 * Handle successful checkout session
 */
async function handleCheckoutCompleted(session, supabaseAdmin) {
  const userId = session.client_reference_id || session.metadata?.userId;
  const customerId = session.customer;
  const subscriptionId = session.subscription;

  console.log(`[Webhook] Checkout completed for user: ${userId}`);

  if (!userId) {
    console.error('[Webhook] No user ID in session');
    return;
  }

  // Update or create subscription record
  await supabaseAdmin
    .from('users_subscriptions')
    .upsert({
      user_id: userId,
      tier: 'pro',
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscription_status: 'trialing',
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });

  // Also update the profiles table (used by client-side auth)
  await supabaseAdmin
    .from('profiles')
    .update({
      tier: 'pro',
      stripe_customer_id: customerId,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  // Send PRO welcome email (non-blocking — don't fail the webhook if email fails)
  const customerEmail = session.customer_details?.email || session.customer_email;
  if (customerEmail) {
    sendProWelcomeEmail(customerEmail, /* isTrial */ true).catch(err =>
      console.error('[Webhook] Welcome email error (non-blocking):', err)
    );
  }
}

/**
 * Handle subscription created/updated
 */
async function handleSubscriptionUpdate(subscription, supabaseAdmin) {
  const customerId = subscription.customer;
  const subscriptionId = subscription.id;
  const status = subscription.status;
  const priceId = subscription.items.data[0].price.id;

  console.log(`[Webhook] Subscription ${subscriptionId} status: ${status}`);

  // Get user by customer ID
  const { data: userSub } = await supabaseAdmin
    .from('users_subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!userSub) {
    console.error('[Webhook] No user found for customer:', customerId);
    return;
  }

  // Determine tier based on status
  const tier = (status === 'active' || status === 'trialing') ? 'pro' : 'free';

  // Update subscription
  await supabaseAdmin
    .from('users_subscriptions')
    .update({
      tier: tier,
      stripe_subscription_id: subscriptionId,
      stripe_price_id: priceId,
      subscription_status: status,
      trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userSub.user_id);

  // Sync tier to profiles table
  await supabaseAdmin
    .from('profiles')
    .update({ tier: tier, updated_at: new Date().toISOString() })
    .eq('id', userSub.user_id);
}

/**
 * Handle subscription cancellation/deletion
 */
async function handleSubscriptionDeleted(subscription, supabaseAdmin) {
  const subscriptionId = subscription.id;

  console.log(`[Webhook] Subscription deleted: ${subscriptionId}`);

  // Downgrade user to FREE
  const { data: subRecord } = await supabaseAdmin
    .from('users_subscriptions')
    .update({
      tier: 'free',
      subscription_status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscriptionId)
    .select('user_id')
    .single();

  // Sync tier to profiles table
  if (subRecord?.user_id) {
    await supabaseAdmin
      .from('profiles')
      .update({ tier: 'free', updated_at: new Date().toISOString() })
      .eq('id', subRecord.user_id);
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(invoice, supabaseAdmin) {
  const subscriptionId = invoice.subscription;

  console.log(`[Webhook] Payment succeeded for subscription: ${subscriptionId}`);

  // Ensure subscription is marked as active
  const { data: activeSub } = await supabaseAdmin
    .from('users_subscriptions')
    .update({
      subscription_status: 'active',
      tier: 'pro',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscriptionId)
    .select('user_id')
    .single();

  // Sync tier to profiles table
  if (activeSub?.user_id) {
    await supabaseAdmin
      .from('profiles')
      .update({ tier: 'pro', updated_at: new Date().toISOString() })
      .eq('id', activeSub.user_id);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice, supabaseAdmin) {
  const subscriptionId = invoice.subscription;

  console.log(`[Webhook] Payment failed for subscription: ${subscriptionId}`);

  // Mark subscription as past_due
  await supabaseAdmin
    .from('users_subscriptions')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscriptionId);
}
