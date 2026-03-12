/**
 * Email utilities for DataPalo
 * Uses Resend for transactional emails
 */

import { Resend } from 'resend';

/**
 * Lazy-init Resend client — doesn't break build if env var is missing
 */
function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not configured — emails disabled');
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

/**
 * Send PRO welcome email after successful checkout
 * @param {string} email - User's email address
 * @param {boolean} isTrial - Whether this is a 14-day trial
 */
export async function sendProWelcomeEmail(email, isTrial = true) {
  const resend = getResendClient();
  if (!resend) {
    console.log('[Email] PRO welcome email skipped (Resend not configured)');
    return;
  }

  const trialNote = isTrial
    ? `<p style="margin:0 0 20px 0;color:#94a3b8;font-size:15px;line-height:1.6;">
        Your <strong style="color:#fbbf24;">14-day free trial</strong> starts now.
        You won't be charged until the trial ends. Cancel anytime from your account settings.
      </p>`
    : '';

  try {
    const { data, error } = await resend.emails.send({
      from: 'DataPalo <onboarding@resend.dev>',
      to: [email],
      subject: 'Welcome to DataPalo PRO',
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:40px;">
      <h1 style="margin:0;font-size:28px;">
        <span style="color:#ec4899;">Data</span><span style="color:#fff;">Palo</span>
      </h1>
    </div>

    <!-- Main Card -->
    <div style="background:#1e293b;border-radius:16px;padding:40px;border:1px solid #334155;">

      <!-- PRO Badge -->
      <div style="text-align:center;margin-bottom:30px;">
        <span style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#10b981);color:#fff;padding:6px 20px;border-radius:20px;font-size:13px;font-weight:700;letter-spacing:1px;">
          PRO
        </span>
      </div>

      <h2 style="margin:0 0 16px 0;color:#fff;font-size:24px;text-align:center;font-weight:700;">
        Welcome to DataPalo PRO
      </h2>

      <p style="margin:0 0 24px 0;color:#94a3b8;font-size:15px;line-height:1.6;text-align:center;">
        You just unlocked the full power of your data.
      </p>

      ${trialNote}

      <!-- What's Unlocked -->
      <div style="background:#0f172a;border-radius:12px;padding:24px;margin-bottom:24px;">
        <p style="margin:0 0 16px 0;color:#fff;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">
          What you now have access to:
        </p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#10b981;font-size:15px;width:28px;vertical-align:top;">&#10003;</td>
            <td style="padding:8px 0;color:#e2e8f0;font-size:15px;">Unlimited analyses &amp; unlimited rows</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#10b981;font-size:15px;width:28px;vertical-align:top;">&#10003;</td>
            <td style="padding:8px 0;color:#e2e8f0;font-size:15px;">Exa neural search — live market intelligence &amp; citations</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#10b981;font-size:15px;width:28px;vertical-align:top;">&#10003;</td>
            <td style="padding:8px 0;color:#e2e8f0;font-size:15px;">Industry benchmarks — see how your numbers compare</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#10b981;font-size:15px;width:28px;vertical-align:top;">&#10003;</td>
            <td style="padding:8px 0;color:#e2e8f0;font-size:15px;">PDF &amp; PPT export — reports ready for your team</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#10b981;font-size:15px;width:28px;vertical-align:top;">&#10003;</td>
            <td style="padding:8px 0;color:#e2e8f0;font-size:15px;">90-day report storage &amp; priority processing</td>
          </tr>
        </table>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:24px;">
        <a href="https://www.datapalo.app/datapalo" style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#10b981);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:16px;font-weight:600;">
          Start Analyzing &rarr;
        </a>
      </div>

      <!-- Manage subscription -->
      <p style="margin:0;text-align:center;color:#64748b;font-size:13px;">
        Manage your subscription anytime at
        <a href="https://www.datapalo.app/datapalo" style="color:#0ea5e9;text-decoration:none;">datapalo.app</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:32px;padding-top:24px;">
      <p style="margin:0 0 8px 0;color:#64748b;font-size:13px;">
        FORGE CREATIVE | AI Job Agency
      </p>
      <p style="margin:0;color:#475569;font-size:12px;">
        Questions? <a href="mailto:michael@forgecreative.cz" style="color:#0ea5e9;text-decoration:none;">michael@forgecreative.cz</a>
      </p>
    </div>

  </div>
</body>
</html>
      `
    });

    if (error) {
      console.error('[Email] Resend error:', error);
      return;
    }

    console.log(`[Email] PRO welcome sent to ${email} (ID: ${data.id})`);
  } catch (error) {
    console.error('[Email] Failed to send PRO welcome:', error);
  }
}
