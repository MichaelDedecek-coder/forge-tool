import { NextResponse } from 'next/server';
import { generateMorningPulse, generateStructuredPulse } from '@/lib/ai/morning-pulse';

/**
 * Morning Pulse API Endpoint
 *
 * Generates AI-powered daily briefing by synthesizing Calendar, Gmail, and Tasks data
 *
 * Query Parameters:
 * - email: User's email (required)
 * - format: 'text' | 'structured' (default: 'text')
 *
 * Examples:
 * - /api/focusmate/morning-pulse?email=user@example.com
 * - /api/focusmate/morning-pulse?email=user@example.com&format=structured
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const format = searchParams.get('format') || 'text';

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter required' },
        { status: 400 }
      );
    }

    console.log(`[Morning Pulse API] Generating briefing for ${email} (format: ${format})`);

    // Generate briefing
    if (format === 'structured') {
      const pulse = await generateStructuredPulse(email);

      return NextResponse.json({
        success: true,
        email,
        format: 'structured',
        data: pulse,
      });
    } else {
      const briefing = await generateMorningPulse(email);

      return NextResponse.json({
        success: true,
        email,
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
