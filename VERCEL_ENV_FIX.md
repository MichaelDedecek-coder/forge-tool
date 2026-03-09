# 🔧 Vercel Environment Variables Fix

## Problem Summary
Your DataWizard API is failing because:
1. **ANTHROPIC_API_KEY** is set to "Production" only (should be "All Environments")
2. **GEMINI_API_KEY** might be invalid or hitting rate limits
3. When Gemini fails, Claude fallback doesn't work in Preview deployments

## Solution: Update Vercel Environment Variables

### Step 1: Fix ANTHROPIC_API_KEY Scope
Go to: https://vercel.com/michaeldedecek-coders-projects/forge-tool/settings/environment-variables

1. Find `ANTHROPIC_API_KEY` (currently set to "Production")
2. Click the **three dots (⋯)** → **Edit**
3. Change from "Production" to **"All Environments"** ✅
4. Click **Save**

### Step 2: Verify GEMINI_API_KEY
The key was updated 2h ago. Verify it's valid:

1. Go to https://console.cloud.google.com/apis/credentials
2. Check if the API key is:
   - ✅ Not expired
   - ✅ Has "Generative Language API" enabled
   - ✅ No quota exhausted
   - ✅ No IP/domain restrictions blocking Vercel

### Step 3: Redeploy
After updating environment variables:
```bash
git commit --allow-empty -m "Trigger redeployment after env var fix"
git push origin claude/update-resume-Cky79
```

Or use Vercel UI:
- Go to your deployment
- Click **"Redeploy"**

## Why This Happened

### Vercel Environment Scopes
Vercel has 3 environment scopes:
- **Production**: `main` branch only
- **Preview**: All other branches (like `claude/update-resume-Cky79`)
- **Development**: Local development

Your `ANTHROPIC_API_KEY` was only available in Production, so any preview branch deployment couldn't fall back to Claude when Gemini failed.

## Testing After Fix

Test on preview deployment:
```bash
# Check if all keys are available
curl https://your-preview-url.vercel.app/api/test-env
```

## Quick Check: Current .env.local
Your local file has:
```
ANTHROPIC_API_KEY=sk-ant-api03-vSBBFJzT3Zo... ✅
GEMINI_API_KEY=# commented out (invalid) ⚠️
EXA_API_KEY=a72c7341-60cb-4ae5-b17c... ✅
E2B_API_KEY=e2b_66bf1957c108af12230a... ✅
```

**Recommendation**: Get a valid GEMINI_API_KEY or remove it entirely and rely on Claude only.

## Alternative: Claude-Only Configuration

If Gemini keeps causing issues, you can disable it entirely:

### Option A: Remove GEMINI_API_KEY from Vercel
Just delete the `GEMINI_API_KEY` environment variable. The code will automatically use Claude only.

### Option B: Force Claude Priority (Code Change)
Want me to update the code to try Claude first, then Gemini as fallback?
