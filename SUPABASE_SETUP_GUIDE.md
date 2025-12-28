# 📘 SUPABASE SETUP GUIDE
## DataWizard Tier System - Week 1

Follow these steps to set up Supabase for authentication and database.

---

## ✅ STEP 1: CREATE SUPABASE PROJECT

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create account
3. Click **"New Project"**
4. Fill in:
   - **Name**: `datawizard-prod` (or `datawizard-dev` for testing)
   - **Database Password**: Generate a strong password (SAVE IT!)
   - **Region**: Europe (West) - for GDPR compliance
   - **Pricing Plan**: Free (sufficient for FREE tier launch)
5. Click **"Create new project"** (takes ~2 minutes)

---

## ✅ STEP 2: RUN DATABASE SCHEMA

1. In Supabase Dashboard, go to **"SQL Editor"** (left sidebar)
2. Click **"New query"**
3. Copy the entire contents of `supabase-setup.sql` from this repo
4. Paste into SQL Editor
5. Click **"Run"** (bottom right)
6. You should see success messages in the Results panel:
   ```
   ✅ DataWizard database schema created successfully!
   📊 Tables: profiles, usage, reports, subscriptions
   🔒 Row Level Security: ENABLED
   ```

---

## ✅ STEP 3: CONFIGURE AUTHENTICATION

### Enable Email/Password Auth
1. Go to **"Authentication"** → **"Providers"** (left sidebar)
2. Find **"Email"** provider
3. Toggle **"Enable Email provider"** to ON
4. **Confirm email**: Set to OFF for now (enable later for production)
5. Click **"Save"**

### (Optional) Enable Google OAuth
1. Still in **"Authentication"** → **"Providers"**
2. Find **"Google"** provider
3. Toggle **"Enable"** to ON
4. You'll need:
   - **Google Client ID** (from Google Cloud Console)
   - **Google Client Secret**
5. Click **"Save"**

**For Week 1, we can skip Google OAuth and just use email/password.**

---

## ✅ STEP 4: GET YOUR API KEYS

1. Go to **"Project Settings"** (gear icon, bottom left)
2. Click **"API"** in left sidebar
3. You'll see:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6...` (long string)
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6...` (different long string)

4. Copy these values!

---

## ✅ STEP 5: UPDATE .env.local

1. In your project root, create `.env.local` (copy from `.env.local.example`)
2. Fill in:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
   ```
3. Keep your existing `GOOGLE_API_KEY` and `E2B_API_KEY`
4. Save the file

---

## ✅ STEP 6: INSTALL SUPABASE CLIENT

Run in terminal:
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

---

## ✅ STEP 7: VERIFY SETUP

You can test the connection by running this in the Supabase SQL Editor:

```sql
-- Should return your 4 tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- Should show: profiles, usage, reports, subscriptions
```

---

## 🎯 NEXT STEPS

Once Supabase is configured, we'll build:
- Day 3-4: Auth components (signup/signin modal)
- Day 5-6: Tier logic and limits
- Day 7: Dashboard and deploy

---

## 🆘 TROUBLESHOOTING

**Problem**: SQL script fails with "permission denied"
- **Solution**: Make sure you're using the SQL Editor in Supabase Dashboard, not psql

**Problem**: "relation auth.users does not exist"
- **Solution**: Supabase creates auth.users automatically. Try refreshing and running again.

**Problem**: Can't find API keys
- **Solution**: Go to Project Settings → API. Keys are there.

---

## 📚 USEFUL LINKS

- Supabase Docs: https://supabase.com/docs
- Next.js + Supabase Guide: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
- Authentication: https://supabase.com/docs/guides/auth

---

**Questions? Tag Michael or Claude (CSO).**

🚀 Let's ship this!
