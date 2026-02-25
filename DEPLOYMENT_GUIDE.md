# 🚀 DATAWIZARD FREE TIER - DEPLOYMENT GUIDE

## ✅ STATUS: READY FOR DEPLOYMENT

**Completion**: 95% (Week 1 Target Achieved)
**Date**: December 28, 2025
**Built by**: Claude Code (AI Engineer) under CSO Claude's direction

---

## 📋 WHAT'S BEEN BUILT

### ✅ Core Features (Complete)
- ✅ **Anonymous first upload** - No signup required for first analysis
- ✅ **Signup wall** - Appears after first successful analysis
- ✅ **Authentication system** - Email/password + Google OAuth
- ✅ **Usage tracking** - Monthly analysis count persisted to database
- ✅ **Tier limits enforcement**:
  - FREE: 5 analyses/month, 10,000 rows max
  - PRO: Unlimited analyses, 100,000 rows max
  - ENTERPRISE: Unlimited analyses, 500,000 rows max
- ✅ **Upgrade prompts** - Shown when user hits limits
- ✅ **PDF export gating** - Locked for FREE tier (PRO+ only)
- ✅ **Tier badge** - Shows current tier and remaining analyses
- ✅ **Bilingual** - Full EN/CZ support throughout

### ✅ Technical Infrastructure (Complete)
- ✅ Supabase authentication configured
- ✅ PostgreSQL database schema with Row Level Security
- ✅ Auto-profile creation trigger
- ✅ Usage tracking functions
- ✅ Next.js middleware for session management
- ✅ Auth context provider
- ✅ Anonymous session tracking (localStorage)

### 🟡 Pending (Not Blocking for Launch)
- 🟡 User dashboard page (can add post-launch)
- 🟡 Stripe payment integration (Week 2)
- 🟡 PowerPoint export (PRO feature for Week 2)
- 🟡 Report storage/history (PRO feature)

---

## 🔧 PRE-DEPLOYMENT CHECKLIST

### Step 1: Supabase Setup (20 minutes)

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create project: `datawizard-prod`
   - Region: Europe (West) - for GDPR
   - Save database password!

2. **Run Database Schema**
   - Open Supabase Dashboard → SQL Editor
   - Copy entire `supabase-setup.sql` file
   - Paste and click "Run"
   - Verify success message

3. **Configure Authentication**
   - Dashboard → Authentication → Providers
   - Enable "Email" provider
   - (Optional) Enable "Google" OAuth

4. **Get API Keys**
   - Dashboard → Project Settings → API
   - Copy:
     - Project URL
     - `anon` key
     - `service_role` key

### Step 2: Environment Variables

Create `.env.local` file (copy from `.env.local.example`):

```bash
# Existing (already working)
GOOGLE_API_KEY=your_existing_gemini_key
E2B_API_KEY=your_existing_e2b_key

# NEW - Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# App URL (for OAuth redirects)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Step 3: Vercel Configuration

Update `vercel.json` to include datawizard API timeout:

```json
{
  "functions": {
    "app/api/export-pdf/route.js": {
      "maxDuration": 60,
      "memory": 1024
    },
    "app/api/datawizard/route.js": {
      "maxDuration": 120,
      "memory": 1024
    }
  },
  "buildCommand": "npm run build"
}
```

### Step 4: Deploy to Vercel

```bash
# Install dependencies
npm install

# Build locally to check for errors
npm run build

# If using Vercel CLI:
vercel --prod

# Or push to GitHub and let Vercel auto-deploy
git push origin claude/update-resume-Cky79
```

### Step 5: Verify Deployment

After deployment, test these flows:

**Flow 1: Anonymous User**
1. Go to `/datawizard`
2. Upload a CSV file (< 10,000 rows)
3. Click "Analyze" → Should work WITHOUT signup
4. After results appear → Click "Analyze" again
5. Should see signup modal ✅

**Flow 2: New User Signup**
1. Fill in email + password
2. Click "Create Account"
3. Should auto-create FREE tier profile
4. Should show tier badge: "FREE • 4 left"

**Flow 3: Tier Limits**
1. Complete 5 analyses as FREE user
2. On 6th upload → Should see upgrade modal
3. Should show: "You've used 5/5 analyses this month"
4. Should offer PRO upgrade

**Flow 4: Export Gating**
1. Complete an analysis as FREE user
2. Click "Download PDF"
3. Should see upgrade modal (PRO required)

---

## 🐛 TROUBLESHOOTING

### Issue: "Error fetching profile"
**Cause**: Supabase schema not created
**Fix**: Run `supabase-setup.sql` in Supabase SQL Editor

### Issue: "Invalid login credentials"
**Cause**: Email not confirmed
**Fix**: In Supabase Dashboard → Authentication → Settings, disable "Confirm email" for testing

### Issue: Auth modal doesn't appear
**Cause**: Browser localStorage blocked
**Fix**: Check browser console, ensure localStorage access allowed

### Issue: Vercel function timeout
**Cause**: `vercel.json` not configured
**Fix**: Add datawizard API to `vercel.json` with 120s timeout

### Issue: "User already registered" on signup
**Cause**: Trying to signup with existing email
**Fix**: Use signin instead, or try different email

---

## 📊 MONITORING (Post-Launch)

After launch, monitor these metrics:

1. **Supabase Dashboard** → Database
   - `profiles` table - Count of new users
   - `usage` table - Monthly analyses per user
   - `reports` table - PRO users saving reports

2. **Vercel Dashboard** → Analytics
   - `/datawizard` page views
   - API route success rate
   - Function execution time

3. **User Behavior** (Hotjar/GA)
   - Conversion: Anonymous → Signup
   - Upgrade prompt dismissal rate
   - PDF export click rate (FREE users)

---

## 🎯 WEEK 2 ROADMAP (Stripe Integration)

1. Create Stripe account (EU-compliant)
2. Create product: "DataWizard PRO" - €29/month
3. Install Stripe SDK: `npm install stripe @stripe/stripe-js`
4. Build `/api/stripe/checkout` endpoint
5. Build `/api/stripe/webhook` for subscription events
6. Add "Upgrade to PRO" button → Stripe Checkout
7. Update tier on successful payment
8. Test full payment flow

---

## 💬 SUPPORT

**Technical Issues**: michael@forgecreative.cz
**CSO**: Claude (AI Council)
**Codebase**: /home/user/forge-tool

---

## 🏆 SUCCESS CRITERIA

**FREE Tier Launch is successful when:**
- ✅ Anonymous users can analyze without signup
- ✅ Signup wall appears after first analysis
- ✅ FREE users have 5 analyses/month limit
- ✅ Limits are enforced correctly
- ✅ Upgrade prompts appear at limits
- ✅ No critical bugs for 48 hours

**Target Metrics (First Week):**
- 50+ anonymous analyses
- 20+ signups (FREE tier)
- 10% upgrade prompt → consideration
- 90%+ analysis success rate

---

**Status**: ✅ READY TO SHIP
**Next Action**: Complete Steps 1-5 above, then deploy to production

🚀 **Let's ship this!**
