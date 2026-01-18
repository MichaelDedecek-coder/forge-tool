import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { encrypt } from '../../../../../lib/encryption';

/**
 * OAuth Callback Handler
 * Receives authorization code from Google and exchanges it for tokens
 * Stores refresh token in Supabase for future API calls
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('[OAuth Callback] Error from Google:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/focusmate?error=oauth_failed`
      );
    }

    if (!code) {
      console.error('[OAuth Callback] No authorization code received');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/focusmate?error=no_code`
      );
    }

    console.log('[OAuth Callback] Authorization code received');

    // Decode state to get user info (if provided)
    let userId = null;
    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
        userId = decoded.userId;
      } catch (e) {
        console.warn('[OAuth Callback] Could not decode state:', e);
      }
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('[OAuth Callback] Token exchange failed:', errorData);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/focusmate?error=token_exchange_failed`
      );
    }

    const tokens = await tokenResponse.json();
    console.log('[OAuth Callback] Tokens received');

    // CRITICAL CHECK: Verify refresh token exists
    if (!tokens.refresh_token) {
      console.error('[OAuth Callback] ⚠️  NO REFRESH TOKEN RECEIVED');
      console.error('[OAuth Callback] This should not happen with access_type=offline and prompt=consent');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/focusmate?error=no_refresh_token`
      );
    }

    console.log('[OAuth Callback] ✅ Refresh token received');

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      console.error('[OAuth Callback] Failed to fetch user info');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/focusmate?error=user_info_failed`
      );
    }

    const userInfo = await userInfoResponse.json();
    console.log('[OAuth Callback] User info retrieved:', userInfo.email);

    // Store tokens in Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[OAuth Callback] Supabase not configured');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/focusmate?error=storage_not_configured`
      );
    }

    // Store user and tokens in Supabase using official client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Encrypt tokens before storing (AES-256-GCM)
    console.log('[OAuth Callback] Encrypting tokens for secure storage');
    const encryptedAccessToken = encrypt(tokens.access_token);
    const encryptedRefreshToken = encrypt(tokens.refresh_token);

    const { data, error: dbError } = await supabase
      .from('focusmate_users')
      .upsert({
        email: userInfo.email,
        google_id: userInfo.id,
        name: userInfo.name,
        picture: userInfo.picture,
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        scopes: tokens.scope,
        connected_at: new Date().toISOString(),
      }, { onConflict: 'email' });

    if (dbError) {
      console.error('[OAuth Callback] Failed to store tokens:', dbError.message || dbError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/focusmate?error=storage_failed`
      );
    }

    console.log('[OAuth Callback] ✅ Tokens encrypted and stored in Supabase');
    console.log('[OAuth Callback] User connected:', userInfo.email);

    // Success! Redirect to success page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/focusmate/connected?email=${encodeURIComponent(userInfo.email)}`
    );

  } catch (error) {
    console.error('[OAuth Callback] Unexpected error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/focusmate?error=unexpected_error`
    );
  }
}
