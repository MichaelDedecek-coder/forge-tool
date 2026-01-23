/**
 * Morning Pulse Email Delivery
 *
 * Sends AI-generated Morning Pulse briefings via email using Resend
 */

import { Resend } from 'resend';
import { generateMorningPulse } from './morning-pulse';

// Initialize Resend client lazily to avoid build-time errors
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }
  return new Resend(apiKey);
}

/**
 * Convert plain text briefing to simple HTML
 */
function briefingToHtml(briefing: string): string {
  // Convert markdown-style formatting to HTML
  let html = briefing
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **bold** → <strong>
    .replace(/\n\n/g, '</p><p>') // Double newline → paragraph
    .replace(/\n/g, '<br>') // Single newline → line break
    .replace(/• /g, '&bull; '); // Bullet points

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Morning Pulse</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #2563eb;
      font-size: 24px;
      margin-bottom: 20px;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 10px;
    }
    p {
      margin: 15px 0;
    }
    strong {
      color: #1f2937;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>☀️ Your Morning Pulse</h1>
    <p>${html}</p>
    <div class="footer">
      <p>Powered by FocusMate AI • ${new Date().toLocaleDateString()}</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Send Morning Pulse email
 * @param email Recipient's email address
 * @param toEmail Email address to send to (can be different from data source)
 * @returns Resend response
 */
export async function sendMorningPulseEmail(
  email: string,
  toEmail?: string
): Promise<{ id: string; success: boolean }> {
  console.log(`[Email Delivery] Generating Morning Pulse for ${email}`);

  // Generate the briefing
  const briefing = await generateMorningPulse(email);

  // Convert to HTML
  const htmlContent = briefingToHtml(briefing);

  // Send email
  const recipientEmail = toEmail || email;

  console.log(`[Email Delivery] Sending to ${recipientEmail}`);

  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: 'Morning Pulse <morning-pulse@updates.agentforge.tech>',
      to: [recipientEmail],
      subject: `☀️ Your Morning Pulse - ${new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      })}`,
      html: htmlContent,
      text: briefing, // Fallback to plain text
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log(`[Email Delivery] ✅ Email sent! ID: ${data?.id}`);

    return {
      id: data?.id || '',
      success: true,
    };

  } catch (error) {
    console.error('[Email Delivery] ❌ Failed to send email:', error);
    throw new Error(`Email delivery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
