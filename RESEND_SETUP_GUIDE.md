# Resend Email Integration Setup

## Quick Setup (5 minutes)

### Step 1: Get Resend API Key

1. Go to https://resend.com/signup
2. Sign up with your email
3. Verify email
4. Go to **API Keys** in dashboard
5. Click **Create API Key**
6. Copy the key (starts with `re_...`)

### Step 2: Add to Environment Variables

Add to `.env.local`:

```bash
RESEND_API_KEY=re_your_api_key_here
```

### Step 3: Install Resend Package

```bash
npm install resend
```

### Step 4: Update Feedback Route

Replace the `sendEmailNotification` function in `app/api/feedback/route.js` with:

```javascript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmailNotification({ feedback_type, message, email, page_url, user_id, feedback_id }) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'DataWizard <noreply@yourdomain.com>', // Change to your verified domain
      to: ['michael@forgecreative.cz'],
      subject: `[DataWizard Feedback] ${getTypeLabel(feedback_type)}`,
      html: `
        <h2>New feedback received on DataWizard</h2>

        <p><strong>TYPE:</strong> ${getTypeLabel(feedback_type)}</p>
        <p><strong>MESSAGE:</strong></p>
        <p style="background: #f5f5f5; padding: 15px; border-radius: 5px;">${message}</p>

        ${email ? `<p><strong>CONTACT EMAIL:</strong> ${email}</p>` : '<p><em>No contact email provided</em></p>'}
        ${user_id ? `<p><strong>USER ID:</strong> ${user_id}</p>` : '<p><em>Anonymous user</em></p>'}

        <p><strong>PAGE:</strong> ${page_url}</p>
        <p><strong>FEEDBACK ID:</strong> ${feedback_id}</p>
        <p><strong>TIME:</strong> ${new Date().toISOString()}</p>

        <hr/>
        <p><small>Reply to this email to respond to the user (if email provided).<br/>
        View all feedback in your Supabase dashboard.</small></p>
      `
    });

    if (error) {
      console.error('Resend error:', error);
      return;
    }

    console.log('✅ Email sent successfully:', data);
  } catch (error) {
    console.error('Email error:', error);
  }
}
```

### Step 5: Verify Domain (Optional but Recommended)

For production, verify your domain in Resend:
1. Go to **Domains** in Resend dashboard
2. Add your domain (e.g., `datawizard.com`)
3. Add DNS records (SPF, DKIM, DMARC)
4. Change `from` field to `noreply@yourdomain.com`

**For testing:** Use `onboarding@resend.dev` (works immediately, no verification needed)

---

## Alternative Options

### Option 2: Supabase Edge Function + Email Service
- More complex, requires Edge Function deployment
- Good if you want everything in Supabase

### Option 3: Supabase Database Webhook
- Set up webhook in Supabase to trigger on INSERT to feedback table
- Point to external email service (Zapier, Make.com)

### Option 4: SendGrid
- Requires more setup than Resend
- Free tier: 100 emails/day
- More enterprise features

---

## Testing

After setup, test by:
1. Running `npm run dev`
2. Opening DataWizard
3. Clicking feedback button
4. Submitting test feedback
5. Check Michael's email inbox

Expected result: Email arrives within seconds with formatted feedback.

---

## Recommendation

**Use Resend** - it's the fastest path to production and most reliable for transactional emails in Next.js apps.
