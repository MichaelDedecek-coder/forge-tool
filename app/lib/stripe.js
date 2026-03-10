/**
 * Stripe Configuration & Helper Functions
 */
import Stripe from 'stripe';

// Initialize Stripe with secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2024-11-20.acacia',
});

/**
 * Create a Stripe checkout session for PRO subscription
 * @param {string} userId - User ID from Supabase
 * @param {string} email - User email
 * @param {string} customerId - Existing Stripe customer ID (optional)
 * @returns {Promise<string>} - Checkout session URL
 */
export async function createCheckoutSession(userId, email, customerId = null) {
  const priceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;

  if (!priceId) {
    throw new Error('Stripe Price ID not configured');
  }

  const sessionParams = {
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/datapalo?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?canceled=true`,
    client_reference_id: userId,
    metadata: {
      userId: userId,
    },
    subscription_data: {
      trial_period_days: 14, // 14-day free trial
      metadata: {
        userId: userId,
      },
    },
    allow_promotion_codes: true, // Allow discount codes
  };

  // Use existing customer or create new one
  if (customerId) {
    sessionParams.customer = customerId;
  } else {
    sessionParams.customer_email = email;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return session.url;
}

/**
 * Create a Stripe billing portal session
 * @param {string} customerId - Stripe customer ID
 * @returns {Promise<string>} - Portal session URL
 */
export async function createPortalSession(customerId) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/datapalo`,
  });
  return session.url;
}

/**
 * Get subscription details
 * @param {string} subscriptionId - Stripe subscription ID
 * @returns {Promise<Object>} - Subscription object
 */
export async function getSubscription(subscriptionId) {
  return await stripe.subscriptions.retrieve(subscriptionId);
}

/**
 * Cancel subscription at period end
 * @param {string} subscriptionId - Stripe subscription ID
 * @returns {Promise<Object>} - Updated subscription
 */
export async function cancelSubscription(subscriptionId) {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Resume canceled subscription
 * @param {string} subscriptionId - Stripe subscription ID
 * @returns {Promise<Object>} - Updated subscription
 */
export async function resumeSubscription(subscriptionId) {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

/**
 * Parse Stripe webhook event
 * @param {string} body - Raw request body
 * @param {string} signature - Stripe signature header
 * @returns {Promise<Object>} - Stripe event object
 */
export async function constructWebhookEvent(body, signature) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error('Stripe webhook secret not configured');
  }

  return stripe.webhooks.constructEvent(body, signature, webhookSecret);
}
