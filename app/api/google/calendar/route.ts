import { NextResponse } from 'next/server';
import { getUpcomingEvents, getTodaysEvents, getEventsInRange } from '@/lib/google/calendar';

/**
 * Google Calendar API Endpoint
 *
 * Fetches calendar events for a user
 *
 * Query Parameters:
 * - email: User's email (required)
 * - view: 'upcoming' | 'today' | 'range' (default: 'upcoming')
 * - maxResults: Number of events to return (default: 10)
 * - timeMin: Start time for 'range' view (ISO string)
 * - timeMax: End time for 'range' view (ISO string)
 *
 * Examples:
 * - /api/google/calendar?email=user@example.com
 * - /api/google/calendar?email=user@example.com&view=today
 * - /api/google/calendar?email=user@example.com&view=upcoming&maxResults=20
 * - /api/google/calendar?email=user@example.com&view=range&timeMin=2024-01-01T00:00:00Z&timeMax=2024-01-31T23:59:59Z
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const view = searchParams.get('view') || 'upcoming';
    const maxResults = parseInt(searchParams.get('maxResults') || '10');
    const timeMin = searchParams.get('timeMin');
    const timeMax = searchParams.get('timeMax');

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter required' },
        { status: 400 }
      );
    }

    console.log(`[Calendar Endpoint] Request from ${email}, view: ${view}`);

    let events;

    // Fetch events based on view
    switch (view) {
      case 'today':
        events = await getTodaysEvents(email);
        break;

      case 'range':
        if (!timeMin || !timeMax) {
          return NextResponse.json(
            { error: 'timeMin and timeMax required for range view' },
            { status: 400 }
          );
        }
        events = await getEventsInRange(email, timeMin, timeMax);
        break;

      case 'upcoming':
      default:
        events = await getUpcomingEvents(email, maxResults);
        break;
    }

    console.log(`[Calendar Endpoint] ✅ Returning ${events.length} events`);

    return NextResponse.json({
      success: true,
      email,
      view,
      count: events.length,
      events,
    });

  } catch (error) {
    console.error('[Calendar Endpoint] ❌ Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Failed to fetch calendar events',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
