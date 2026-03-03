# 💰 DataWizard Monetization Setup Guide

This guide will help you set up the complete monetization system for DataWizard with Stripe payments, user subscriptions, and usage tracking.

## 📋 What Has Been Implemented

✅ **Tier System**
- FREE: 5 analyses/month, max 10,000 rows
- PRO: €49/month, unlimited analyses, unlimited rows, 7-day free trial

✅ **Stripe Integration**
- Checkout sessions with trial period
- Subscription management
- Webhook handling for subscription events

✅ **Supabase Database Schema**
- User subscriptions tracking
- Monthly usage tracking
- Analysis history storage (for PRO users)

✅ **Frontend Components**
- Pricing page (`/pricing`)
- User dashboard (`/dashboard`)
- Upgrade modals
- Usage limits enforcement in DataWizard

---

## 🚀 Setup Steps

### 1. Supabase Database Setup

Run the SQL schema to create all necessary tables and functions:

```bash
# Open Supabase SQL Editor and run:
cat supabase-subscription-schema.sql
```

This will create:
- `users_subscriptions` - User tier and Stripe data
- `users_usage` - Monthly usage tracking
- `analysis_history` - Saved reports (PRO users)
- Helper functions for limits checking

### 2. Stripe Configuration

#### Create Stripe Account
1. Go to https://dashboard.stripe.com
2. Create an account or log in
3. Switch to **Test Mode** for development

#### Create Product & Price
1. Go to **Products** → **Add Product**
2. Name: "DataWizard PRO"
3. Description: "Unlimited data analysis with AI"
4. Price: €49.00 EUR (recurring monthly)
5. Click **Save product**
6. Copy the **Price ID** (starts with `price_...`)

#### Get API Keys
1. Go to **Developers** → **API keys**
2. Copy:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`)

#### Configure Webhook
1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://YOUR_DOMAIN/api/stripe/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_...`)

### 3. Environment Variables

Add these to your `.env.local` file:

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_YOUR_PRICE_ID
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Site URL (for Stripe redirects)
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # or your production URL

# Supabase (you should already have these)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Other existing keys (Anthropic, E2B, etc.)
ANTHROPIC_API_KEY=your_key
E2B_API_KEY=your_key
```

### 4. Deploy & Test

#### Local Testing
```bash
npm install
npm run dev
```

#### Test the Flow
1. **Register a new user** at `/`
2. **Navigate to `/pricing`** - see pricing plans
3. **Click "Začít PRO trial"** - should redirect to Stripe checkout
4. **Use Stripe test card**: `4242 4242 4242 4242`, any future date, any CVC
5. **Complete checkout** - should redirect to `/dashboard?success=true`
6. **Check dashboard** - should show PRO tier with 7-day trial
7. **Go to `/datawizard`** - upload a file and analyze
8. **Check usage** - should increment in dashboard

#### Test Webhooks Locally
Use Stripe CLI for local webhook testing:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS
# or download from https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# This will give you a webhook secret (whsec_...) - add it to .env.local
```

#### Production Deployment
1. Deploy to Vercel/your hosting
2. Update `NEXT_PUBLIC_SITE_URL` to your production domain
3. Update Stripe webhook URL to `https://your-domain.com/api/stripe/webhook`
4. Switch Stripe to **Live Mode**
5. Replace all test keys with live keys

---

## 🧪 Testing Checklist

- [ ] User can register/login
- [ ] FREE user sees 5 analyses/month limit
- [ ] FREE user can't analyze files >10k rows
- [ ] Upgrade modal appears when limits exceeded
- [ ] Clicking "Upgrade" opens Stripe checkout
- [ ] After checkout, user is redirected to dashboard
- [ ] Dashboard shows PRO tier with trial info
- [ ] PRO user can analyze unlimited files
- [ ] Usage tracking increments correctly
- [ ] Trial countdown shows correct days remaining
- [ ] After trial ends, payment is charged
- [ ] User can manage subscription via Stripe portal
- [ ] Cancellation downgrades user to FREE

---

## 📊 Key Files Reference

### Frontend
- `/app/pricing/page.js` - Pricing page with plans
- `/app/dashboard/page.js` - User dashboard
- `/app/datawizard/page.js` - Main app (with limits)
- `/app/components/UpgradeModal.jsx` - Upgrade prompt

### Backend
- `/app/api/stripe/checkout/route.js` - Create checkout session
- `/app/api/stripe/portal/route.js` - Billing portal
- `/app/api/stripe/webhook/route.js` - Handle Stripe events
- `/app/api/datawizard/route.js` - Analysis API (with limits)

### Configuration
- `/app/lib/tier-config.js` - Tier limits & prices
- `/app/lib/stripe.js` - Stripe helper functions
- `/supabase-subscription-schema.sql` - Database schema

---

## 💡 Customization

### Change Pricing
Edit `/app/lib/tier-config.js`:
```javascript
export const TIER_LIMITS = {
  free: {
    analysesPerMonth: 10,  // Change limit
    maxRows: 20000,        // Change row limit
    ...
  },
  pro: {
    price: 29,  // Change price (EUR)
    ...
  }
}
```

### Add New Tier (e.g., ENTERPRISE)
1. Add tier to `TIER_LIMITS` in `tier-config.js`
2. Create new Stripe product & price
3. Add checkout logic in `/app/api/stripe/checkout/route.js`
4. Update webhook handler to recognize new tier
5. Add to pricing page

### Customize Trial Period
In `/app/lib/stripe.js`:
```javascript
subscription_data: {
  trial_period_days: 14,  // Change from 7 to 14 days
  ...
}
```

---

## 🐛 Troubleshooting

### Webhook Not Working
- Check webhook secret in `.env.local`
- Verify endpoint URL in Stripe dashboard
- Check webhook logs in Stripe dashboard
- Use `stripe listen` for local testing

### User Not Upgraded After Payment
- Check webhook events in Stripe dashboard
- Look for errors in server logs
- Verify `users_subscriptions` table in Supabase
- Check RLS policies allow service role access

### Usage Not Tracking
- Verify Supabase functions are created
- Check `users_usage` table exists
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set
- Look for errors in API logs

### Limits Not Enforcing
- Check user authentication is working
- Verify `can_user_analyze` function returns correct data
- Ensure frontend handles 403 status codes
- Check that usage increments after analysis

---

## 📈 Next Steps

- [ ] Set up email notifications (trial ending, payment failed)
- [ ] Add analytics tracking (Mixpanel, PostHog)
- [ ] Implement referral program
- [ ] Add annual billing with discount
- [ ] Create admin dashboard for monitoring
- [ ] Set up customer support integration (Intercom, Crisp)

---

## 🎯 Revenue Estimates

**Conservative (100 users)**
- FREE users: 70 (no revenue)
- PRO users: 30 × €49 = **€1,470/month**
- Annual: **€17,640**

**Optimistic (500 users)**
- FREE users: 350 (no revenue)
- PRO users: 150 × €49 = **€7,350/month**
- Annual: **€88,200**

**Growth Strategy:**
1. Start with FREE to build user base
2. Optimize conversion rate (target 10-15%)
3. Add features that justify PRO pricing
4. Consider usage-based pricing for large datasets

---

## 🔒 Security Checklist

- [x] Webhook signature verification
- [x] Row Level Security (RLS) on Supabase tables
- [x] Service role key for admin operations only
- [x] User authentication before analysis
- [x] Stripe test mode for development
- [ ] Rate limiting on API routes (TODO)
- [ ] CAPTCHA on registration (TODO)
- [ ] Email verification (TODO)

---

## 📞 Support

Questions? Contact: michael@forgecreative.cz

---

**Built with ❤️ for AgentForge.Tech x AI LAB**
