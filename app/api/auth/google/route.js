import { NextResponse } from 'next/server';

/**
 * OAuth Initiation Route
 * Redirects user to Google OAuth consent screen with proper scopes
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id'); // Optional: track which user is connecting

    // OAuth 2.0 Configuration
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

    if (!clientId) {
      return NextResponse.json(
        { error: 'OAuth client not configured' },
        { status: 500 }
      );
    }

    // Required scopes for FocusMate
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/tasks.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    // Build OAuth URL with CRITICAL parameters
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes.join(' '));
    authUrl.searchParams.set('access_type', 'offline'); // NON-NEGOTIABLE: Get refresh token
    authUrl.searchParams.set('prompt', 'consent');      // NON-NEGOTIABLE: Force consent to ensure refresh token

    // Optional: Pass state for CSRF protection and user tracking
    if (userId) {
      const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
      authUrl.searchParams.set('state', state);
    }

    console.log('[OAuth] Initiating Google OAuth flow');
    console.log('[OAuth] Redirect URI:', redirectUri);
    console.log('[OAuth] Scopes:', scopes.join(', '));

    // Redirect to Google OAuth consent screen
    return NextResponse.redirect(authUrl.toString());

  } catch (error) {
    console.error('[OAuth] Error initiating OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}
