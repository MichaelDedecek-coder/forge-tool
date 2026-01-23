import { NextResponse } from 'next/server';
import { sendMorningPulseEmail } from '@/lib/ai/email-delivery';

/**
 * Send Morning Pulse Email API Endpoint
 *
 * Generates and emails AI-powered daily briefing
 *
 * Query Parameters:
 * - email: User's email for data source (required)
 * - to: Email address to send to (optional, defaults to same as email)
 *
 * Examples:
 * - /api/focusmate/send-pulse?email=user@example.com
 * - /api/focusmate/send-pulse?email=user@example.com&to=recipient@example.com
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const toEmail = searchParams.get('to');

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter required' },
        { status: 400 }
      );
    }

    console.log(`[Send Pulse API] Processing request for ${email}`);

    // Send email
    const result = await sendMorningPulseEmail(email, toEmail || undefined);

    console.log(`[Send Pulse API] ✅ Email sent successfully`);

    return NextResponse.json({
      success: true,
      email,
      sentTo: toEmail || email,
      emailId: result.id,
      message: 'Morning Pulse email sent successfully',
    });

  } catch (error) {
    console.error('[Send Pulse API] ❌ Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Failed to send Morning Pulse email',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * GET method for convenience (also triggers email send)
 */
export async function GET(request: Request) {
  return POST(request);
}
