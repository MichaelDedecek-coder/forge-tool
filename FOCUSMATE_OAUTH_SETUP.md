# FocusMate OAuth Setup Guide

## Day 1 Goal: Working Google OAuth with Refresh Token

This guide documents the setup required to enable Google Workspace OAuth for FocusMate MVP.

---

## Prerequisites

- ✅ Google Cloud Project: `focusmate-484114`
- ✅ Project URL: https://console.cloud.google.com/home/dashboard?project=focusmate-484114
- ✅ Supabase Project: `focusmate-mvp` (to be created)
- ✅ Domain: `getfocusmate.app`

---

## Step 1: Enable Required Google APIs

Navigate to: https://console.cloud.google.com/apis/library?project=focusmate-484114

Enable these APIs:
1. **Google Calendar API** - `calendar-json.googleapis.com`
2. **Gmail API** - `gmail.googleapis.com`
3. **Google Tasks API** - `tasks.googleapis.com`

```bash
# Or via gcloud CLI:
gcloud services enable calendar-json.googleapis.com --project=focusmate-484114
gcloud services enable gmail.googleapis.com --project=focusmate-484114
gcloud services enable tasks.googleapis.com --project=focusmate-484114
```

---

## Step 2: Configure OAuth Consent Screen

Navigate to: https://console.cloud.google.com/apis/credentials/consent?project=focusmate-484114

### OAuth Consent Screen Configuration

**User Type:** External (for pilot testing)

**App Information:**
- App name: `FocusMate`
- User support email: `support@getfocusmate.app`
- App logo: Upload FocusMate logo (optional)

**App Domain:**
- Application home page: `https://getfocusmate.app`
- Application privacy policy: `https://getfocusmate.app/privacy`
- Application terms of service: `https://getfocusmate.app/terms`

**Authorized Domains:**
```
getfocusmate.app
vercel.app
```

**Developer Contact:**
- Email: `michael@forgecreative.cz`

### Required Scopes

Add these **sensitive scopes**:

1. **Calendar (Read-only)**
   - `https://www.googleapis.com/auth/calendar.readonly`
   - Justification: "Read user's calendar events to generate morning briefing"

2. **Gmail (Read-only)**
   - `https://www.googleapis.com/auth/gmail.readonly`
   - Justification: "Read user's emails to identify action items and important messages"

3. **Tasks (Read-only)**
   - `https://www.googleapis.com/auth/tasks.readonly`
   - Justification: "Read user's task lists to include in daily briefing"

4. **User Info (Basic)**
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
   - Justification: "Identify user and personalize briefing emails"

**Important:** Since these are sensitive scopes, Google will require:
- Privacy policy published at domain
- Terms of service published at domain
- OAuth verification (for production)

For **pilot phase**, use "Testing" mode and add pilot users manually.

---

## Step 3: Create OAuth 2.0 Credentials

Navigate to: https://console.cloud.google.com/apis/credentials?project=focusmate-484114

**Create Credentials → OAuth client ID**

**Application Type:** Web application

**Name:** `FocusMate Production`

**Authorized JavaScript origins:**
```
https://getfocusmate.app
https://forge-tool-beta.vercel.app
http://localhost:3000
```

**Authorized redirect URIs:**
```
https://getfocusmate.app/api/auth/google/callback
https://forge-tool-beta.vercel.app/api/auth/google/callback
http://localhost:3000/api/auth/google/callback
```

**Click Create** → Save credentials

You'll receive:
- **Client ID**: `XXXXXXXXX.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-XXXXXXXXX`

⚠️ **NEVER commit these to git!**

---

## Step 4: Create Supabase Project

Navigate to: https://supabase.com/dashboard

1. **Create New Project**
   - Name: `focusmate-mvp`
   - Database Password: Generate strong password
   - Region: Choose closest to target users (Europe West recommended)

2. **Create Database Table**

```sql
-- FocusMate Users Table
CREATE TABLE focusmate_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  google_id TEXT UNIQUE NOT NULL,
  name TEXT,
  picture TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  scopes TEXT NOT NULL,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_briefing_at TIMESTAMPTZ,
  briefing_time TIME DEFAULT '08:00:00',
  timezone TEXT DEFAULT 'Europe/Prague',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_focusmate_users_email ON focusmate_users(email);
CREATE INDEX idx_focusmate_users_google_id ON focusmate_users(google_id);

-- Enable Row Level Security (RLS)
ALTER TABLE focusmate_users ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do anything (for backend)
CREATE POLICY "Service role full access" ON focusmate_users
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

3. **Get Supabase Credentials**
   - Navigate to Project Settings → API
   - Copy:
     - Project URL: `https://xxxxx.supabase.co`
     - `anon` key (public): `eyJhbG...`
     - `service_role` key (secret): `eyJhbG...`

---

## Step 5: Configure Environment Variables

Create `.env.local` in project root:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID="XXXXXXXXX.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-XXXXXXXXX"

# Supabase Configuration (FocusMate MVP)
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbG..."

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # Change to production URL when deploying

# Resend Email Configuration (Day 2)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="briefing@getfocusmate.app"
```

**For Vercel Deployment:**

Add these as **Environment Variables** in Vercel dashboard:
- Settings → Environment Variables
- Add each variable for Production, Preview, and Development

---

## Step 6: Test OAuth Flow Locally

1. **Start development server:**
```bash
npm run dev
```

2. **Test OAuth initiation:**
```
http://localhost:3000/api/auth/google
```

3. **Expected flow:**
   - Redirects to Google consent screen
   - Shows required scopes (Calendar, Gmail, Tasks)
   - User approves
   - Redirects to callback: `/api/auth/google/callback?code=...`
   - Callback exchanges code for tokens
   - Stores tokens in Supabase
   - Redirects to success page: `/focusmate/connected?email=user@example.com`

4. **Verify in Supabase:**
   - Open Table Editor → `focusmate_users`
   - Check that user row exists with `refresh_token` populated

---

## Step 7: Add Test Users (Pilot Phase)

Since we're using sensitive scopes, the app must be in "Testing" mode initially.

**Add test users:**
1. Go to OAuth consent screen
2. Scroll to "Test users"
3. Add pilot user emails:
   - `michael@forgecreative.cz`
   - (Add 4 more pilot users as selected)

⚠️ **Only these users can OAuth during testing mode.**

---

## Success Criteria (Day 1)

- ✅ Google APIs enabled (Calendar, Gmail, Tasks)
- ✅ OAuth consent screen configured with correct scopes
- ✅ OAuth credentials created with proper redirect URIs
- ✅ Supabase project created with `focusmate_users` table
- ✅ Environment variables configured locally
- ✅ OAuth flow tested end-to-end
- ✅ **Refresh token received and stored in Supabase**
- ✅ Success page displays after OAuth completion

---

## Important Notes

### Refresh Token Requirements

For Google to issue a refresh token, you **MUST**:
1. Set `access_type=offline` in OAuth URL (✅ Implemented)
2. Set `prompt=consent` to force consent screen (✅ Implemented)
3. Use this on **first authorization** per user

If refresh token is missing:
- User must revoke app access: https://myaccount.google.com/permissions
- Re-authorize to trigger new consent

### Security Considerations

- ✅ Tokens stored in Supabase with service role key (server-side only)
- ✅ No tokens exposed to client-side JavaScript
- ✅ RLS enabled on Supabase table
- ✅ Read-only scopes minimize risk
- ✅ HTTPS-only in production

### Common Issues

**Issue:** "Access blocked: Authorization Error"
- **Fix:** Add user to test users list in OAuth consent screen

**Issue:** "Invalid redirect_uri"
- **Fix:** Ensure exact match in Google Console authorized redirect URIs

**Issue:** "No refresh token received"
- **Fix:** Check that `access_type=offline` and `prompt=consent` are set. User may need to revoke and re-auth.

---

## Next Steps (Day 2)

1. Implement token refresh logic
2. Build daily briefing generation system
3. Configure Resend for email delivery
4. Create email template for morning briefing
5. Set up cron job to trigger daily briefings at 8am

---

**Built by:** Claude Code (AI Developer)
**Date:** January 12, 2026
**Status:** 🚀 Ready for OAuth Testing
