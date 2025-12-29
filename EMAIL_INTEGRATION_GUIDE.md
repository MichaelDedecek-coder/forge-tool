# 📧 EMAIL INTEGRATION GUIDE - FEEDBACK SYSTEM

## Current Status

The feedback system is **LIVE and WORKING**, but email notifications are currently logged to console only.

**What works NOW:**
- ✅ Users can submit feedback
- ✅ Feedback is saved to Supabase database
- ✅ Email content is generated and logged
- ✅ You can view feedback in Supabase dashboard

**What needs setup (5-10 minutes):**
- 📧 Actual email delivery to michael@forgecreative.cz

---

## OPTION 1: Supabase Database Webhooks (RECOMMENDED - FREE)

**Pros:** Free, no API keys needed, works immediately
**Cons:** Requires Zapier/Make.com/n8n for forwarding

### Setup Steps:

1. **Go to Supabase Dashboard** → Database → Webhooks
2. **Create new webhook:**
   - Name: "Feedback Email Notification"
   - Table: `feedback`
   - Events: `INSERT`
   - Type: HTTP Request
   - URL: Your Zapier/Make.com webhook URL

3. **Set up Zapier/Make.com:**
   - Trigger: Webhook (Catch Hook)
   - Action: Send Email (Gmail/Outlook)
   - To: michael@forgecreative.cz
   - Subject: `[DataWizard Feedback] {{feedback_type}}`
   - Body: Use feedback data from webhook

**Time to set up:** 10 minutes
**Cost:** Free (Zapier free tier or Make.com free tier)

---

## OPTION 2: Resend (Modern, Developer-Friendly)

**Pros:** Free tier (100 emails/day), simple API, great DX
**Cons:** Requires API key

### Setup Steps:

1. **Sign up:** https://resend.com
2. **Get API key:** Dashboard → API Keys → Create
3. **Add to .env.local:**
   ```bash
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```

4. **Install package:**
   ```bash
   npm install resend
   ```

5. **Update `/app/api/feedback/route.js`:**
   ```javascript
   import { Resend } from 'resend';

   const resend = new Resend(process.env.RESEND_API_KEY);

   async function sendEmailNotification({ feedback_type, message, email, page_url, user_id, feedback_id }) {
     await resend.emails.send({
       from: 'DataWizard <feedback@yourdomain.com>',
       to: 'michael@forgecreative.cz',
       subject: `[DataWizard Feedback] ${getTypeLabel(feedback_type)}`,
       html: `
         <h2>New feedback received</h2>
         <p><strong>Type:</strong> ${getTypeLabel(feedback_type)}</p>
         <p><strong>Message:</strong></p>
         <p>${message}</p>
         ${email ? `<p><strong>Contact:</strong> ${email}</p>` : ''}
         <p><strong>Page:</strong> ${page_url}</p>
         <p><strong>Time:</strong> ${new Date().toISOString()}</p>
       `
     });
   }
   ```

**Time to set up:** 5 minutes
**Cost:** Free (100 emails/day)

---

## OPTION 3: SendGrid (Enterprise-Ready)

**Pros:** Reliable, scales well, good deliverability
**Cons:** More complex setup

### Setup Steps:

1. **Sign up:** https://sendgrid.com
2. **Get API key:** Settings → API Keys → Create
3. **Verify sender:** Settings → Sender Authentication
4. **Add to .env.local:**
   ```bash
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
   ```

5. **Install package:**
   ```bash
   npm install @sendgrid/mail
   ```

6. **Update `/app/api/feedback/route.js`:**
   ```javascript
   import sgMail from '@sendgrid/mail';

   sgMail.setApiKey(process.env.SENDGRID_API_KEY);

   async function sendEmailNotification({ feedback_type, message, email, page_url, user_id, feedback_id }) {
     await sgMail.send({
       to: 'michael@forgecreative.cz',
       from: 'feedback@yourdomain.com', // Must be verified
       subject: `[DataWizard Feedback] ${getTypeLabel(feedback_type)}`,
       text: `
         New feedback received
         Type: ${getTypeLabel(feedback_type)}
         Message: ${message}
         ${email ? `Contact: ${email}` : ''}
         Page: ${page_url}
       `
     });
   }
   ```

**Time to set up:** 15 minutes
**Cost:** Free (100 emails/day)

---

## OPTION 4: Console Logs + Manual Check (Current)

**Pros:** Works NOW, no setup needed
**Cons:** Have to manually check Supabase dashboard

### How to View Feedback:

1. Go to Supabase Dashboard
2. Click "Table Editor"
3. Select `feedback` table
4. Sort by `created_at` DESC
5. Review new feedback

**OR**

Check server logs (Vercel dashboard) for email notifications.

---

## MY RECOMMENDATION

**For immediate use:** Option 1 (Supabase Webhook → Zapier/Make.com)
**For long-term:** Option 2 (Resend)

**Why?**
- Option 1 works in 10 minutes, no code changes needed
- Option 2 is cleaner, more reliable, better DX
- Option 3 is overkill for this use case

---

## CURRENT STATUS

The feedback button is **LIVE ON ALL PAGES**. Users can submit feedback right now.

**Michael's action items:**
1. ✅ Feedback is being collected (works NOW)
2. ⏳ Choose email option above (5-10 min setup)
3. ✅ Done!

---

## TESTING THE FEEDBACK SYSTEM

1. Go to https://yourdomain.com/datawizard
2. Click "Send Feedback" button (bottom-left)
3. Fill out form
4. Submit
5. Check Supabase dashboard → feedback table
6. Email should arrive (once integrated)

---

**Questions? Tag me in Slack/Discord.**

— Claude Code
Built: December 29, 2025
