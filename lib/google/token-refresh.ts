/**
 * Google OAuth Token Refresh Utility
 *
 * Handles automatic token refresh for expired access tokens
 * Ensures uninterrupted access to Google APIs
 */

import { decrypt, encrypt } from '@/lib/encryption';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

interface RefreshTokenResponse {
  access_token: string;
  expires_in: number; // seconds
  scope: string;
  token_type: string;
}

interface RefreshResult {
  encryptedAccessToken: string;
  expiresAt: string; // ISO timestamp
}

/**
 * Check if a token is expired or about to expire
 * @param expiresAt ISO timestamp string
 * @param bufferMinutes Minutes before expiry to consider token expired (default: 5)
 * @returns true if token is expired or about to expire
 */
export function isTokenExpired(expiresAt: string | null, bufferMinutes: number = 5): boolean {
  if (!expiresAt) {
    return true; // No expiry time means we should refresh
  }

  const expiryTime = new Date(expiresAt).getTime();
  const now = Date.now();
  const bufferMs = bufferMinutes * 60 * 1000;

  return now >= (expiryTime - bufferMs);
}

/**
 * Refresh an expired access token using the refresh token
 * @param encryptedRefreshToken Encrypted refresh token from database
 * @returns New encrypted access token and expiry timestamp
 * @throws Error if refresh fails
 */
export async function refreshAccessToken(
  encryptedRefreshToken: string
): Promise<RefreshResult> {
  console.log('[Token Refresh] Starting token refresh...');

  // Decrypt the refresh token
  let refreshToken: string;
  try {
    refreshToken = decrypt(encryptedRefreshToken);
  } catch (error) {
    throw new Error('Failed to decrypt refresh token');
  }

  // Load OAuth credentials
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing Google OAuth credentials');
  }

  // Make refresh request to Google
  console.log('[Token Refresh] Requesting new access token from Google...');

  try {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Token Refresh] Google API error:', errorData);
      throw new Error(`Token refresh failed: ${errorData.error || response.statusText}`);
    }

    const data: RefreshTokenResponse = await response.json();

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

    // Encrypt the new access token
    const encryptedAccessToken = encrypt(data.access_token);

    console.log('[Token Refresh] ✅ Token refreshed successfully');
    console.log(`[Token Refresh] New token expires at: ${expiresAt}`);

    return {
      encryptedAccessToken,
      expiresAt,
    };

  } catch (error) {
    if (error instanceof Error) {
      console.error('[Token Refresh] ❌ Failed:', error.message);
      throw error;
    }
    throw new Error('Token refresh failed with unknown error');
  }
}

/**
 * Get a valid access token, refreshing if necessary
 * @param encryptedAccessToken Current encrypted access token
 * @param encryptedRefreshToken Encrypted refresh token
 * @param expiresAt Current token expiry timestamp
 * @returns Valid encrypted access token and expiry (refreshed if needed)
 */
export async function getValidAccessToken(
  encryptedAccessToken: string,
  encryptedRefreshToken: string,
  expiresAt: string | null
): Promise<RefreshResult> {
  // Check if token is still valid
  if (!isTokenExpired(expiresAt)) {
    console.log('[Token Refresh] Token still valid, no refresh needed');
    return {
      encryptedAccessToken,
      expiresAt: expiresAt!,
    };
  }

  // Token expired or about to expire, refresh it
  console.log('[Token Refresh] Token expired or expiring soon, refreshing...');
  return await refreshAccessToken(encryptedRefreshToken);
}
