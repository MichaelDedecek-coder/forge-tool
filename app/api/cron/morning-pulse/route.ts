import { NextResponse } from 'next/server';
import { sendMorningPulseEmail } from '@/lib/ai/email-delivery';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds timeout for cron job

/**
 * Cron endpoint for sending daily Morning Pulse emails
 * Triggered by Vercel Cron at scheduled time (9 AM daily)
 */
export async function GET(request: Request) {
  try {
    // Verify the request is coming from Vercel Cron
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Optional: Add cron secret verification for security
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Data source: primary user email (for Calendar and Tasks)
    const primaryUserEmail = process.env.PRIMARY_USER_EMAIL || 'michael@agentforge.tech';

    // Additional Gmail accounts to pull email data from
    const additionalGmailAccounts = ['dedecekm@gmail.com'];

    // Recipients: send to both email addresses
    const recipients = [
      'michael@agentforge.tech',
      'dedecekm@gmail.com'
    ];

    console.log(`[Cron] Generating Morning Pulse with Gmail from: ${[primaryUserEmail, ...additionalGmailAccounts].join(', ')}`);
    console.log(`[Cron] Sending to: ${recipients.join(', ')}`);

    // Send Morning Pulse to both email addresses
    // Both will receive the SAME briefing with combined Gmail data from both accounts
    const results = await Promise.all(
      recipients.map(recipientEmail =>
        sendMorningPulseEmail(
          primaryUserEmail,           // Primary email (Calendar + Tasks + Gmail)
          recipientEmail,              // Recipient email
          additionalGmailAccounts      // Additional Gmail accounts to include
        )
      )
    );

    return NextResponse.json({
      success: true,
      message: `Morning Pulse sent successfully to ${recipients.length} recipients`,
      emailIds: results.map(r => r.id),
      recipients: recipients,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Cron] Error sending Morning Pulse:', error);

    return NextResponse.json(
      {
        error: 'Failed to send Morning Pulse',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
