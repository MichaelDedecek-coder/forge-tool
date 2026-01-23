import { NextResponse } from 'next/server';
import { sendMorningPulseEmail } from '@/lib/ai/email-delivery';

/**
 * Send Morning Pulse Email API Endpoint
 *
 * Generates and emails AI-powered daily briefing
 *
 * Query Parameters:
 * - email: User's primary email for data source (required) - used for Calendar and Tasks
 * - to: Email address to send to (optional, defaults to same as email)
 * - additionalEmails: Comma-separated additional Gmail accounts (optional)
 *
 * Examples:
 * - /api/focusmate/send-pulse?email=user@example.com
 * - /api/focusmate/send-pulse?email=user@example.com&to=recipient@example.com
 * - /api/focusmate/send-pulse?email=user@example.com&additionalEmails=other@gmail.com
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const toEmail = searchParams.get('to');
    const additionalEmailsParam = searchParams.get('additionalEmails');

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter required' },
        { status: 400 }
      );
    }

    // Parse additional email accounts
    const additionalEmails = additionalEmailsParam
      ? additionalEmailsParam.split(',').map(e => e.trim()).filter(Boolean)
      : [];

    console.log(`[Send Pulse API] Processing request for ${email}${additionalEmails.length > 0 ? ` + ${additionalEmails.length} additional account(s)` : ''}`);

    // Send email
    const result = await sendMorningPulseEmail(
      email,
      toEmail || undefined,
      additionalEmails.length > 0 ? additionalEmails : undefined
    );

    console.log(`[Send Pulse API] ✅ Email sent successfully`);

    return NextResponse.json({
      success: true,
      email,
      additionalEmails,
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
