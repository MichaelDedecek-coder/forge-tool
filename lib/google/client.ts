/**
 * Google API Client Helper
 *
 * Provides convenient functions for making Google API calls
 * Automatically handles token refresh when needed
 */

import { createClient } from '@supabase/supabase-js';
import { getValidAccessToken } from './token-refresh';
import { decrypt } from '@/lib/encryption';

interface GoogleClientOptions {
  email: string;
}

interface UserTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string | null;
}

/**
 * Get a valid, decrypted access token for a user
 * Automatically refreshes if expired
 * @param email User's email address
 * @returns Decrypted access token ready to use
 */
export async function getGoogleAccessToken(email: string): Promise<string> {
  // Initialize Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase not configured');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch user tokens
  const { data: user, error: fetchError } = await supabase
    .from('focusmate_users')
    .select('email, access_token, refresh_token, token_expires_at')
    .eq('email', email)
    .single();

  if (fetchError || !user) {
    throw new Error(`User not found: ${email}`);
  }

  // Get valid token (refreshes if needed)
  const result = await getValidAccessToken(
    user.access_token,
    user.refresh_token,
    user.token_expires_at
  );

  // If token was refreshed, update database
  if (result.encryptedAccessToken !== user.access_token) {
    console.log(`[Google Client] Token refreshed for ${email}, updating database...`);

    const { error: updateError } = await supabase
      .from('focusmate_users')
      .update({
        access_token: result.encryptedAccessToken,
        token_expires_at: result.expiresAt,
      })
      .eq('email', email);

    if (updateError) {
      console.error('[Google Client] Failed to update refreshed token:', updateError);
      // Don't throw - we still have a valid token to use
    }
  }

  // Decrypt and return the access token
  return decrypt(result.encryptedAccessToken);
}

/**
 * Make an authenticated request to Google APIs
 * Automatically handles token refresh
 * @param email User's email address
 * @param url Google API endpoint URL
 * @param options Fetch options (method, body, etc.)
 * @returns Fetch response
 */
export async function googleApiRequest(
  email: string,
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get valid access token
  const accessToken = await getGoogleAccessToken(email);

  // Make request with authorization header
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  return response;
}

/**
 * Convenience wrapper for JSON responses from Google APIs
 * @param email User's email address
 * @param url Google API endpoint URL
 * @param options Fetch options
 * @returns Parsed JSON response
 */
export async function googleApiJson<T = any>(
  email: string,
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await googleApiRequest(email, url, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google API request failed: ${response.status} ${errorText}`);
  }

  return await response.json();
}
