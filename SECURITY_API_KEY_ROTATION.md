# 🔐 API KEY ROTATION GUIDE

## ⚠️ SECURITY ALERT

**Status**: API keys exposed in Vercel dashboard screenshot
**Date**: March 8, 2026
**Action Required**: Immediate rotation of all exposed keys

---

## 🚨 EXPOSED KEYS IDENTIFIED

The following API keys were visible in the Vercel dashboard:

1. **GOOGLE_API_KEY**: `AIzaSyBt-iHVWDOIdjAyg-yAegznEN-QnZyMgs8` ❌ COMPROMISED
2. **GEMINI_API_KEY**: `AIzaSyBt-iHVWDOIdjAyg-yAegznEN-QnZyMgs8` ❌ COMPROMISED (same as GOOGLE_API_KEY)

**NOTE**: These keys appear to be the same value. Google Gemini API uses Google Cloud API keys.

### Other Keys to Verify (Hidden but Rotate for Safety)
- ENCRYPTION_KEY
- SUPABASE_SERVICE_ROLE_KEY
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- GOOGLE_CLIENT_SECRET
- RESEND_API_KEY
- E2B_API_KEY

---

## 📋 STEP-BY-STEP ROTATION PROCESS

### 1. GOOGLE GEMINI API KEY (CRITICAL)

**Current Status**: Exposed in screenshot
**Used For**: AI analysis via Google Gemini Flash model

#### Steps to Rotate:

1. **Go to Google Cloud Console**
   - URL: https://console.cloud.google.com/apis/credentials
   - Login with your Google account

2. **Create New API Key**
   - Click "Create Credentials" → "API Key"
   - Copy the new key immediately
   - Add it to your .env.local: `GEMINI_API_KEY=YOUR_NEW_KEY_HERE`

3. **Restrict the New Key (IMPORTANT)**
   - Click "Edit API key"
   - Under "API restrictions":
     - Select "Restrict key"
     - Enable only: "Generative Language API" (Gemini)
   - Under "Application restrictions":
     - Set "HTTP referrers" to your domain
     - Add: `https://your-production-domain.com/*`
   - Save restrictions

4. **Update Vercel Environment Variable**
   - Go to: https://vercel.com/michaeldedecek-coders-projects/forge-tool/settings/environment-variables
   - Find `GEMINI_API_KEY`
   - Click "Edit"
   - Paste new key
   - Click "Save"
   - **Redeploy**: Go to Deployments → Latest → Redeploy

5. **Delete Old Key (After Verification)**
   - Back in Google Cloud Console
   - Find the old key (`AIzaSyBt-iHVWDOIdjAyg-yAegznEN-QnZyMgs8`)
   - Click "Delete"
   - Confirm deletion

6. **Remove GOOGLE_API_KEY (if it's a duplicate)**
   - In Vercel, check if `GOOGLE_API_KEY` and `GEMINI_API_KEY` have the same value
   - If yes, delete `GOOGLE_API_KEY` (it's redundant)
   - The app should only use `GEMINI_API_KEY`

---

### 2. GOOGLE OAUTH CREDENTIALS

**Used For**: Google Sign-In authentication

#### Steps to Rotate:

1. **Go to Google Cloud Console**
   - URL: https://console.cloud.google.com/apis/credentials
   - Find your OAuth 2.0 Client ID

2. **Create New OAuth 2.0 Client**
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "DataWizard Production"
   - Authorized redirect URIs:
     - `https://your-domain.com/api/auth/callback/google`
     - `http://localhost:3000/api/auth/callback/google` (for local dev)
   - Click "Create"

3. **Update Environment Variables**
   ```env
   GOOGLE_CLIENT_ID=new_client_id_here.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=new_secret_here
   ```

4. **Update in Vercel**
   - Update both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
   - Redeploy

5. **Delete Old OAuth Client**
   - After verifying new credentials work
   - Delete the old OAuth client from Google Cloud Console

---

### 3. SUPABASE KEYS

**Used For**: Authentication and database access

#### Steps to Rotate:

1. **Go to Supabase Dashboard**
   - URL: https://app.supabase.com
   - Select your project

2. **Rotate Service Role Key**
   - Go to: Settings → API
   - Scroll to "Service Role Key"
   - Click "Regenerate"
   - Copy new key immediately
   - Update `SUPABASE_SERVICE_ROLE_KEY` in Vercel

3. **Anon Key Rotation**
   - The `NEXT_PUBLIC_SUPABASE_ANON_KEY` changes less frequently
   - If you suspect compromise, contact Supabase support
   - Alternative: Create a new Supabase project and migrate

4. **Update URL if Project Changed**
   - If you created a new project:
   - Update `NEXT_PUBLIC_SUPABASE_URL`
   - Run database migration script

---

### 4. E2B API KEY

**Used For**: Python code interpreter for data processing

#### Steps to Rotate:

1. **Go to E2B Dashboard**
   - URL: https://e2b.dev/dashboard
   - Navigate to API Keys

2. **Create New API Key**
   - Click "Create API Key"
   - Name: "DataWizard Production"
   - Copy the key

3. **Update Vercel**
   - Update `E2B_API_KEY`
   - Redeploy

4. **Revoke Old Key**
   - Delete the old key from E2B dashboard

---

### 5. RESEND API KEY

**Used For**: Transactional emails (if enabled)

#### Steps to Rotate:

1. **Go to Resend Dashboard**
   - URL: https://resend.com/api-keys

2. **Create New API Key**
   - Click "Create API Key"
   - Name: "DataWizard Production"
   - Copy the key

3. **Update Vercel**
   - Update `RESEND_API_KEY`
   - Redeploy

4. **Delete Old Key**
   - Remove old key from Resend dashboard

---

### 6. ENCRYPTION_KEY (if used)

**Purpose**: Unclear - verify if this key is actually used in the codebase

#### Steps:

1. **Search Codebase**
   - Check if `process.env.ENCRYPTION_KEY` is referenced anywhere
   - If NOT used: Delete from Vercel

2. **If Used**
   - Generate new random key: `openssl rand -base64 32`
   - Update in Vercel
   - Redeploy

---

## ✅ POST-ROTATION CHECKLIST

After rotating all keys:

- [ ] All new keys updated in Vercel
- [ ] Vercel project redeployed
- [ ] Test authentication (Google OAuth)
- [ ] Test data analysis (Gemini API)
- [ ] Test code interpreter (E2B)
- [ ] Test database access (Supabase)
- [ ] Old keys deleted from provider dashboards
- [ ] Monitor error logs for 24 hours
- [ ] Update local .env.local with new keys

---

## 🔒 FUTURE PREVENTION

### Best Practices:

1. **Never Show API Keys in Screenshots**
   - Always blur sensitive values before sharing
   - Use "Hidden" status for all secret keys in Vercel

2. **Use API Key Restrictions**
   - Google Cloud: Restrict by API and domain
   - Supabase: Use Row Level Security (RLS)
   - E2B: Set up IP whitelisting if available

3. **Rotate Keys Regularly**
   - Schedule quarterly rotation (every 3 months)
   - Use a password manager to track rotation dates

4. **Monitor API Usage**
   - Set up billing alerts
   - Check for unusual spikes in usage
   - Enable API quota limits

5. **Use Environment Variable Naming**
   - `NEXT_PUBLIC_*` = Safe to expose (client-side)
   - No prefix = MUST be secret (server-side only)

---

## 🚨 IF KEYS ARE ALREADY COMPROMISED

### Immediate Actions:

1. **Disable Keys ASAP**
   - Delete/revoke compromised keys immediately
   - Don't wait for replacement

2. **Check Usage Logs**
   - Google Cloud: Check API usage for unusual activity
   - Supabase: Check database logs
   - E2B: Review sandbox execution logs

3. **Monitor Billing**
   - Check for unexpected charges
   - Set up billing alerts

4. **Report if Necessary**
   - If unauthorized usage detected:
   - Contact provider support
   - File incident report
   - Consider GDPR/privacy implications

---

## 📞 SUPPORT

**Technical Issues**: michael@forgecreative.cz
**Google Cloud Support**: https://cloud.google.com/support
**Supabase Support**: https://supabase.com/support
**E2B Support**: https://e2b.dev/docs

---

## 📝 ROTATION LOG

| Key | Last Rotated | Next Rotation | Status |
|-----|--------------|---------------|--------|
| GEMINI_API_KEY | [TO BE DONE] | [+3 months] | ❌ EXPOSED |
| GOOGLE_CLIENT_SECRET | [TO BE DONE] | [+3 months] | ⚠️ VERIFY |
| SUPABASE_SERVICE_ROLE_KEY | [TO BE DONE] | [+3 months] | ⚠️ VERIFY |
| E2B_API_KEY | [TO BE DONE] | [+3 months] | ⚠️ VERIFY |
| RESEND_API_KEY | [TO BE DONE] | [+3 months] | ⚠️ VERIFY |

---

**Priority**: 🔴 CRITICAL - Rotate immediately
**Estimated Time**: 30-45 minutes for all keys
**Next Action**: Start with Google Gemini API key (most critical)
