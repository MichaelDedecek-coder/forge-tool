# ✅ VERCEL API KEY UPDATE - QUICK CHECKLIST

**Project**: forge-tool
**Vercel URL**: https://vercel.com/michaeldedecek-coders-projects/forge-tool/settings/environment-variables
**Date**: March 8, 2026
**Urgency**: 🔴 CRITICAL

---

## 🚨 PRIORITY 1: EXPOSED KEYS (Rotate IMMEDIATELY)

### [ ] 1. GEMINI_API_KEY
- **Current**: `AIzaSyBt-iHVWDOIdjAyg-yAegznEN-QnZyMgs8` ❌ EXPOSED
- **Action**:
  1. Create new key at https://console.cloud.google.com/apis/credentials
  2. Restrict to "Generative Language API" only
  3. Update in Vercel
  4. Delete old key
- **Status**: ⏳ PENDING

### [ ] 2. GOOGLE_API_KEY (Verify if duplicate)
- **Current**: `AIzaSyBt-iHVWDOIdjAyg-yAegznEN-QnZyMgs8` ❌ EXPOSED (same as GEMINI_API_KEY)
- **Action**:
  1. Check if same value as GEMINI_API_KEY
  2. If YES → DELETE this variable (redundant)
  3. If NO → Rotate like GEMINI_API_KEY
- **Status**: ⏳ PENDING

---

## ⚠️ PRIORITY 2: VERIFY & ROTATE (Precautionary)

### [ ] 3. GOOGLE_CLIENT_SECRET
- **Last Updated**: Jan 13
- **Action**: Rotate via Google Cloud Console
- **Status**: ⏳ PENDING

### [ ] 4. GOOGLE_CLIENT_ID
- **Last Updated**: Jan 13
- **Action**: Create new OAuth client
- **Status**: ⏳ PENDING

### [ ] 5. SUPABASE_SERVICE_ROLE_KEY
- **Last Updated**: Jan 13
- **Action**: Regenerate in Supabase Dashboard
- **Status**: ⏳ PENDING

### [ ] 6. NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Last Updated**: Dec 29, 2025
- **Action**: Contact Supabase if rotation needed
- **Status**: ⏳ PENDING

### [ ] 7. E2B_API_KEY
- **Last Updated**: Dec 14, 2025
- **Action**: Create new key at https://e2b.dev/dashboard
- **Status**: ⏳ PENDING

### [ ] 8. RESEND_API_KEY
- **Last Updated**: Dec 29, 2025
- **Action**: Create new key at https://resend.com/api-keys
- **Status**: ⏳ PENDING

---

## 🔍 PRIORITY 3: AUDIT & CLEANUP

### [ ] 9. ENCRYPTION_KEY
- **Last Updated**: Jan 19
- **Action**:
  1. Search codebase for usage
  2. If NOT used → DELETE from Vercel
  3. If used → Rotate with `openssl rand -base64 32`
- **Status**: ⏳ PENDING

### [ ] 10. NEXT_PUBLIC_SUPABASE_URL
- **Last Updated**: Jan 13
- **Action**: No rotation needed (public URL)
- **Status**: ✅ OK (public value)

### [ ] 11. NEXT_PUBLIC_APP_URL
- **Last Updated**: Jan 13
- **Action**: Verify correct production domain
- **Status**: ⏳ PENDING

---

## 📝 AFTER ALL ROTATIONS

### [ ] 12. Redeploy Vercel
- Go to: Deployments → Latest → Redeploy
- Reason: Load new environment variables
- **Status**: ⏳ PENDING

### [ ] 13. Test All Features
- [ ] Google OAuth sign-in
- [ ] DataWizard AI analysis
- [ ] Data processing (E2B)
- [ ] Database queries (Supabase)
- **Status**: ⏳ PENDING

### [ ] 14. Monitor for 24 Hours
- Check error logs in Vercel
- Check API usage in provider dashboards
- Monitor for unusual activity
- **Status**: ⏳ PENDING

### [ ] 15. Update Local Environment
- Update .env.local with new keys
- Test local development
- **Status**: ⏳ PENDING

### [ ] 16. Document Rotation
- Fill in rotation dates in SECURITY_API_KEY_ROTATION.md
- Set calendar reminder for next rotation (3 months)
- **Status**: ⏳ PENDING

---

## 🎯 QUICK START COMMANDS

```bash
# 1. Generate new encryption key (if needed)
openssl rand -base64 32

# 2. Test local environment
npm run dev

# 3. Check for key usage in codebase
grep -r "ENCRYPTION_KEY" .
grep -r "GOOGLE_API_KEY" .

# 4. Deploy to Vercel (after updating keys)
vercel --prod
```

---

## ⏱️ TIME ESTIMATES

- **Gemini API Key**: 5 min
- **Google OAuth**: 10 min
- **Supabase Keys**: 5 min
- **E2B + Resend**: 5 min each
- **Testing**: 15 min
- **Total**: ~45 minutes

---

## 🆘 IF YOU GET STUCK

1. **API Key Not Working**
   - Wait 2-3 minutes for propagation
   - Redeploy Vercel
   - Clear browser cache

2. **OAuth Redirect Error**
   - Verify redirect URI includes: `/api/auth/callback/google`
   - Check domain matches NEXT_PUBLIC_APP_URL

3. **Database Access Denied**
   - Verify Supabase URL is correct
   - Check Row Level Security (RLS) policies

4. **Still Having Issues?**
   - Check full guide: SECURITY_API_KEY_ROTATION.md
   - Contact: michael@forgecreative.cz

---

**Start Here**: Rotate GEMINI_API_KEY first (most critical)
**End State**: All checkboxes marked ✅, app working normally
