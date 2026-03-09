# How to Check if EXA is Active

## The Problem
You're not seeing research sections because **EXA might not be configured**!

The code I wrote WILL show research sections, but **ONLY if EXA_API_KEY is set**.

---

## ✅ Quick Check (Do this NOW!)

### Step 1: Open your browser console
Press `F12` or right-click → Inspect → Console

### Step 2: Load the DataWizard page
Visit: `http://localhost:3000/datawizard`

### Step 3: Look for this message

**If EXA is ACTIVE, you'll see:**
```
═══════════════════════════════════════
🔍 CHECKING EXA CONFIGURATION...
═══════════════════════════════════════
Status: ✅ ACTIVE
Message: EXA Research is ACTIVE. Your analyses will be enriched with industry insights!
═══════════════════════════════════════
✅ EXA IS ACTIVE - Research sections will appear!
```

**If EXA is NOT ACTIVE, you'll see:**
```
═══════════════════════════════════════
🔍 CHECKING EXA CONFIGURATION...
═══════════════════════════════════════
Status: ❌ NOT CONFIGURED
Message: EXA Research is NOT configured. Set EXA_API_KEY in your environment to enable research-augmented analysis.
═══════════════════════════════════════
⚠️  WARNING: EXA IS NOT ACTIVE!
⚠️  Research sections will NOT appear in your reports.
⚠️  To enable: Add EXA_API_KEY to your .env.local file
⚠️  Get API key from: https://exa.ai
```

---

## If EXA is NOT ACTIVE:

### 1. Check if you have `.env.local` file
```bash
cat .env.local | grep EXA_API_KEY
```

### 2. If missing, add it:
```bash
echo "EXA_API_KEY=your_actual_api_key_here" >> .env.local
```

### 3. Restart your dev server:
```bash
npm run dev
```

### 4. Get an API key from:
**https://exa.ai**

---

## Alternative: Check via API

Visit this URL in your browser:
```
http://localhost:3000/api/exa-status
```

You'll see JSON response showing if EXA is configured.

---

## What the code does:

1. ✅ **On page load**: Checks if EXA_API_KEY is set and logs to console
2. ✅ **During analysis**: If EXA is active, fetches research data
3. ✅ **After AI response**: Guarantees research sections are added (if EXA data exists)
4. ✅ **In the report**: Shows research badge + 3 sections

**BUT** - if `EXA_API_KEY` is not set, there's NO data to show, so sections won't appear!

---

## Next Steps:

1. **Run the console check above**
2. **Report back what you see**
3. If EXA is NOT active → Set up the API key
4. If EXA IS active but sections still missing → We have a different bug to fix
