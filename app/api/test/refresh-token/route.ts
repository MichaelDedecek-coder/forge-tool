import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getValidAccessToken, isTokenExpired } from '@/lib/google/token-refresh';
import { decrypt } from '@/lib/encryption';

/**
 * Test Endpoint: Token Refresh
 *
 * Tests the token refresh functionality with real user tokens
 * Usage: GET /api/test/refresh-token?email=user@example.com
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter required' },
        { status: 400 }
      );
    }

    console.log(`[Test Refresh] Testing token refresh for: ${email}`);

    // Initialize Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch user
    const { data: user, error: fetchError } = await supabase
      .from('focusmate_users')
      .select('email, access_token, refresh_token, token_expires_at')
      .eq('email', email)
      .single();

    if (fetchError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check current token status
    const tokenExpired = isTokenExpired(user.token_expires_at);
    console.log(`[Test Refresh] Token expired: ${tokenExpired}`);
    console.log(`[Test Refresh] Expires at: ${user.token_expires_at}`);

    // Get valid token (will refresh if needed)
    const result = await getValidAccessToken(
      user.access_token,
      user.refresh_token,
      user.token_expires_at
    );

    // If token was refreshed, update database
    if (result.encryptedAccessToken !== user.access_token) {
      console.log('[Test Refresh] Token was refreshed, updating database...');

      const { error: updateError } = await supabase
        .from('focusmate_users')
        .update({
          access_token: result.encryptedAccessToken,
          token_expires_at: result.expiresAt,
        })
        .eq('email', email);

      if (updateError) {
        throw new Error(`Failed to update token: ${updateError.message}`);
      }

      console.log('[Test Refresh] ✅ Database updated with new token');
    }

    // Decrypt token to show first/last characters (for verification)
    const decryptedToken = decrypt(result.encryptedAccessToken);
    const tokenPreview = `${decryptedToken.substring(0, 10)}...${decryptedToken.substring(decryptedToken.length - 10)}`;

    return NextResponse.json({
      success: true,
      email: user.email,
      wasExpired: tokenExpired,
      wasRefreshed: result.encryptedAccessToken !== user.access_token,
      oldExpiresAt: user.token_expires_at,
      newExpiresAt: result.expiresAt,
      tokenPreview,
      message: result.encryptedAccessToken !== user.access_token
        ? 'Token was expired and has been refreshed'
        : 'Token is still valid, no refresh needed'
    });

  } catch (error) {
    console.error('[Test Refresh] ❌ Failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Token refresh test failed', details: errorMessage },
      { status: 500 }
    );
  }
}
