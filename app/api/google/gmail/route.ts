import { NextResponse } from 'next/server';
import { getRecentEmails, getUnreadCount, searchEmails, getProfile } from '@/lib/google/gmail';

/**
 * Gmail API Endpoint
 *
 * Fetches Gmail data for a user
 *
 * Query Parameters:
 * - email: User's email (required)
 * - view: 'recent' | 'unread' | 'search' | 'profile' (default: 'recent')
 * - maxResults: Number of emails to return (default: 10)
 * - query: Search query for 'search' view (e.g., 'from:example@gmail.com')
 *
 * Examples:
 * - /api/google/gmail?email=user@example.com
 * - /api/google/gmail?email=user@example.com&view=unread
 * - /api/google/gmail?email=user@example.com&view=search&query=subject:invoice
 * - /api/google/gmail?email=user@example.com&view=profile
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const view = searchParams.get('view') || 'recent';
    const maxResults = parseInt(searchParams.get('maxResults') || '10');
    const query = searchParams.get('query');

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter required' },
        { status: 400 }
      );
    }

    console.log(`[Gmail Endpoint] Request from ${email}, view: ${view}`);

    // Handle different views
    switch (view) {
      case 'unread': {
        const unreadCount = await getUnreadCount(email);
        const unreadEmails = await getRecentEmails(email, maxResults, 'is:unread');

        console.log(`[Gmail Endpoint] ✅ Returning ${unreadEmails.length} unread emails`);

        return NextResponse.json({
          success: true,
          email,
          view,
          unreadCount,
          count: unreadEmails.length,
          emails: unreadEmails,
        });
      }

      case 'search': {
        if (!query) {
          return NextResponse.json(
            { error: 'Query parameter required for search view' },
            { status: 400 }
          );
        }

        const searchResults = await searchEmails(email, query, maxResults);

        console.log(`[Gmail Endpoint] ✅ Returning ${searchResults.length} search results`);

        return NextResponse.json({
          success: true,
          email,
          view,
          query,
          count: searchResults.length,
          emails: searchResults,
        });
      }

      case 'profile': {
        const profile = await getProfile(email);

        console.log(`[Gmail Endpoint] ✅ Returning profile`);

        return NextResponse.json({
          success: true,
          email,
          view,
          profile,
        });
      }

      case 'recent':
      default: {
        const recentEmails = await getRecentEmails(email, maxResults);

        console.log(`[Gmail Endpoint] ✅ Returning ${recentEmails.length} recent emails`);

        return NextResponse.json({
          success: true,
          email,
          view,
          count: recentEmails.length,
          emails: recentEmails,
        });
      }
    }

  } catch (error) {
    console.error('[Gmail Endpoint] ❌ Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Failed to fetch Gmail data',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
