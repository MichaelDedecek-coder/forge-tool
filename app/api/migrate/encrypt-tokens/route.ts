import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { encrypt, isEncrypted } from '../../../../lib/encryption';

/**
 * Migration API Endpoint: Encrypt Existing Tokens
 *
 * ONE-TIME USE: Encrypts all plain-text tokens in the database
 * Protected by MIGRATION_SECRET environment variable
 *
 * Usage: POST /api/migrate/encrypt-tokens
 * Headers: { "Authorization": "Bearer YOUR_MIGRATION_SECRET" }
 */
export async function POST(request: Request) {
  try {
    // Security: Require migration secret
    const authHeader = request.headers.get('authorization');
    const migrationSecret = process.env.MIGRATION_SECRET;

    if (!migrationSecret) {
      return NextResponse.json(
        { error: 'Migration not configured' },
        { status: 500 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${migrationSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔐 [Migration] Starting token encryption...');

    // Initialize Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all users
    const { data: users, error: fetchError } = await supabase
      .from('focusmate_users')
      .select('id, email, access_token, refresh_token');

    if (fetchError) {
      throw new Error(`Failed to fetch users: ${fetchError.message}`);
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users found',
        stats: { total: 0, encrypted: 0, skipped: 0, errors: 0 }
      });
    }

    const stats = {
      total: users.length,
      encrypted: 0,
      skipped: 0,
      errors: 0,
      details: [] as Array<{ email: string; status: string }>
    };

    // Process each user
    for (const user of users) {
      try {
        let needsUpdate = false;
        let encryptedAccessToken = user.access_token;
        let encryptedRefreshToken = user.refresh_token;

        // Encrypt access_token if plain text
        if (user.access_token && !isEncrypted(user.access_token)) {
          encryptedAccessToken = encrypt(user.access_token);
          needsUpdate = true;
        }

        // Encrypt refresh_token if plain text
        if (user.refresh_token && !isEncrypted(user.refresh_token)) {
          encryptedRefreshToken = encrypt(user.refresh_token);
          needsUpdate = true;
        }

        if (needsUpdate) {
          // Update tokens in database
          const { error: updateError } = await supabase
            .from('focusmate_users')
            .update({
              access_token: encryptedAccessToken,
              refresh_token: encryptedRefreshToken,
            })
            .eq('id', user.id);

          if (updateError) {
            throw new Error(`Update failed: ${updateError.message}`);
          }

          stats.encrypted++;
          stats.details.push({ email: user.email, status: 'encrypted' });
          console.log(`[Migration] ✅ Encrypted tokens for ${user.email}`);
        } else {
          stats.skipped++;
          stats.details.push({ email: user.email, status: 'already_encrypted' });
          console.log(`[Migration] ⏭️  Tokens already encrypted for ${user.email}`);
        }
      } catch (error) {
        stats.errors++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        stats.details.push({ email: user.email, status: `error: ${errorMsg}` });
        console.error(`[Migration] ❌ Error processing ${user.email}:`, errorMsg);
      }
    }

    console.log('[Migration] ✅ Migration completed');
    console.log('[Migration] Stats:', { total: stats.total, encrypted: stats.encrypted, skipped: stats.skipped, errors: stats.errors });

    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      stats: {
        total: stats.total,
        encrypted: stats.encrypted,
        skipped: stats.skipped,
        errors: stats.errors
      },
      details: stats.details
    });

  } catch (error) {
    console.error('[Migration] ❌ Failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Migration failed', details: errorMessage },
      { status: 500 }
    );
  }
}
