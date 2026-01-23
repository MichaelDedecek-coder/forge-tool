import { NextResponse } from 'next/server';
import { generateMorningPulse, generateStructuredPulse } from '@/lib/ai/morning-pulse';

/**
 * Morning Pulse API Endpoint
 *
 * Generates AI-powered daily briefing by synthesizing Calendar, Gmail, and Tasks data
 *
 * Query Parameters:
 * - email: User's primary email (required) - used for Calendar and Tasks
 * - additionalEmails: Comma-separated additional Gmail accounts (optional)
 * - format: 'text' | 'structured' (default: 'text')
 *
 * Examples:
 * - /api/focusmate/morning-pulse?email=user@example.com
 * - /api/focusmate/morning-pulse?email=user@example.com&additionalEmails=other@gmail.com
 * - /api/focusmate/morning-pulse?email=user@example.com&format=structured
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const additionalEmailsParam = searchParams.get('additionalEmails');
    const format = searchParams.get('format') || 'text';

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

    console.log(`[Morning Pulse API] Generating briefing for ${email}${additionalEmails.length > 0 ? ` + ${additionalEmails.length} additional account(s)` : ''} (format: ${format})`);

    // Generate briefing
    if (format === 'structured') {
      const pulse = await generateStructuredPulse(email, additionalEmails);

      return NextResponse.json({
        success: true,
        email,
        additionalEmails,
        format: 'structured',
        data: pulse,
      });
    } else {
      const briefing = await generateMorningPulse(email, additionalEmails);

      return NextResponse.json({
        success: true,
        email,
        additionalEmails,
        format: 'text',
        briefing,
      });
    }

  } catch (error) {
    console.error('[Morning Pulse API] ❌ Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Failed to generate Morning Pulse',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
