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

    // TODO: In the future, loop through all users from a database
    // For now, send to the primary user
    const primaryUserEmail = process.env.PRIMARY_USER_EMAIL || 'michael@agentforge.tech';

    console.log(`[Cron] Sending Morning Pulse to ${primaryUserEmail}`);

    const result = await sendMorningPulseEmail(
      primaryUserEmail, // data source email
      primaryUserEmail  // recipient email
    );

    return NextResponse.json({
      success: true,
      message: 'Morning Pulse sent successfully',
      emailId: result.id,
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
