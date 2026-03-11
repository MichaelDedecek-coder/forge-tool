import { NextResponse } from 'next/server';
import { stripe } from '@/app/lib/stripe';
import { createServerClient } from '@/app/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/stripe/debug-tier
 * Diagnostic endpoint to trace the full tier-sync chain.
 * Shows every step: auth, Stripe lookup, DB state.
 * REMOVE THIS ROUTE BEFORE PRODUCTION LAUNCH.
 */
export async function GET(request) {
  const steps = [];

  try {
    // Step 1: Get authenticated user from SSR cookies
    steps.push({ step: 1, name: 'Auth check', status: 'starting' });
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      steps.push({ step: 1, name: 'Auth check', status: 'FAILED', error: authError.message });
      return NextResponse.json({ steps, result: 'Auth failed' });
    }
    if (!user) {
      steps.push({ step: 1, name: 'Auth check', status: 'FAILED', error: 'No user - not signed in' });
      return NextResponse.json({ steps, result: 'Not signed in' });
    }
    steps.push({ step: 1, name: 'Auth check', status: 'OK', userId: user.id, email: user.email });

    // Step 2: Check current profile in DB
    steps.push({ step: 2, name: 'DB profile check', status: 'starting' });
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      steps.push({ step: 2, name: 'DB profile check', status: 'FAILED', error: profileError.message });
    } else {
      steps.push({
        step: 2, name: 'DB profile check', status: 'OK',
        tier: profile.tier,
        stripe_customer_id: profile.stripe_customer_id,
        email: profile.email,
        updated_at: profile.updated_at
      });
    }

    // Step 3: Check users_subscriptions table
    steps.push({ step: 3, name: 'DB subscriptions check', status: 'starting' });
    const { data: subData, error: subError } = await supabaseAdmin
      .from('users_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (subError) {
      steps.push({ step: 3, name: 'DB subscriptions check', status: 'NO_ROW', error: subError.message });
    } else {
      steps.push({
        step: 3, name: 'DB subscriptions check', status: 'OK',
        tier: subData.tier,
        stripe_customer_id: subData.stripe_customer_id,
        stripe_subscription_id: subData.stripe_subscription_id,
        subscription_status: subData.subscription_status
      });
    }

    // Step 4: Look up Stripe customer by email
    steps.push({ step: 4, name: 'Stripe customer lookup', status: 'starting', email: user.email });
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 5,
    });

    if (customers.data.length === 0) {
      steps.push({ step: 4, name: 'Stripe customer lookup', status: 'NOT_FOUND', message: 'No Stripe customer with this email' });
      return NextResponse.json({ steps, result: 'No Stripe customer found for ' + user.email });
    }

    const allCustomers = customers.data.map(c => ({
      id: c.id,
      email: c.email,
      name: c.name,
      created: new Date(c.created * 1000).toISOString()
    }));
    steps.push({
      step: 4, name: 'Stripe customer lookup', status: 'OK',
      customersFound: customers.data.length,
      customers: allCustomers
    });

    // Step 5: Check subscriptions for EACH customer found
    for (const customer of customers.data) {
      steps.push({ step: 5, name: `Subscriptions for ${customer.id}`, status: 'starting' });

      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'all',
        limit: 10,
      });

      const subDetails = subscriptions.data.map(sub => ({
        id: sub.id,
        status: sub.status,
        plan: sub.items.data[0]?.price?.id,
        current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
        trial_start: sub.trial_start ? new Date(sub.trial_start * 1000).toISOString() : null,
        trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
        metadata: sub.metadata
      }));

      steps.push({
        step: 5,
        name: `Subscriptions for ${customer.id}`,
        status: subscriptions.data.length > 0 ? 'OK' : 'NONE',
        count: subscriptions.data.length,
        subscriptions: subDetails
      });
    }

    // Step 6: Find active subscription
    const activeSub = customers.data.reduce((found, customer) => {
      if (found) return found;
      // We need to re-check, but let's use the data we already have
      return null;
    }, null);

    // Re-do the active check properly
    steps.push({ step: 6, name: 'Active subscription search', status: 'starting' });
    let foundActive = null;
    let foundCustomer = null;

    for (const customer of customers.data) {
      const subs = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'all',
        limit: 10,
      });
      const active = subs.data.find(s => s.status === 'active' || s.status === 'trialing');
      if (active) {
        foundActive = active;
        foundCustomer = customer;
        break;
      }
    }

    if (foundActive) {
      steps.push({
        step: 6, name: 'Active subscription search', status: 'FOUND',
        subscriptionId: foundActive.id,
        subscriptionStatus: foundActive.status,
        customerId: foundCustomer.id,
        customerEmail: foundCustomer.email
      });
    } else {
      steps.push({ step: 6, name: 'Active subscription search', status: 'NOT_FOUND', message: 'No active/trialing subscription found' });
    }

    // Step 7: SUPABASE_SERVICE_ROLE_KEY check
    steps.push({
      step: 7, name: 'Env vars check',
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'SET (' + process.env.STRIPE_SECRET_KEY.substring(0, 7) + '...)' : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET (starts with: ' + process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10) + '...)' : 'MISSING',
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'MISSING',
    });

    return NextResponse.json({
      steps,
      result: foundActive ? `PRO subscription found (${foundActive.status})` : 'No active subscription',
      recommendation: foundActive
        ? 'Run POST /api/stripe/sync-tier to fix the profile'
        : 'User needs to subscribe or subscription is not active'
    });

  } catch (error) {
    steps.push({ step: 'ERROR', name: 'Unhandled error', message: error.message, stack: error.stack?.split('\n').slice(0, 3) });
    return NextResponse.json({ steps, result: 'Error: ' + error.message }, { status: 500 });
  }
}
