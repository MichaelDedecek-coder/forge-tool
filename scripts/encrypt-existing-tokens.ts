/**
 * Migration Script: Encrypt Existing Tokens
 *
 * This script encrypts all plain-text tokens in the database
 * Run once after deploying encryption functionality
 *
 * Usage: npm run encrypt-tokens
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { encrypt, isEncrypted } from '../lib/encryption';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function migrateTokens() {
  console.log('🔐 Starting token encryption migration...\n');

  // Load environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('Missing ENCRYPTION_KEY environment variable');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch all users with tokens
  console.log('Fetching users from Supabase...');
  const { data: users, error: fetchError } = await supabase
    .from('focusmate_users')
    .select('id, email, access_token, refresh_token');

  if (fetchError) {
    console.error('Fetch error details:', fetchError);
    throw new Error(`Failed to fetch users: ${fetchError.message || JSON.stringify(fetchError)}`);
  }

  if (!users || users.length === 0) {
    console.log('✅ No users found in database');
    return;
  }

  console.log(`Found ${users.length} user(s) in database\n`);

  let encryptedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const user of users) {
    console.log(`Processing user: ${user.email}`);

    try {
      let needsUpdate = false;
      let encryptedAccessToken = user.access_token;
      let encryptedRefreshToken = user.refresh_token;

      // Check and encrypt access_token
      if (user.access_token && !isEncrypted(user.access_token)) {
        console.log('  ⚠️  access_token is plain text, encrypting...');
        encryptedAccessToken = encrypt(user.access_token);
        needsUpdate = true;
      } else if (user.access_token) {
        console.log('  ✅ access_token already encrypted');
      }

      // Check and encrypt refresh_token
      if (user.refresh_token && !isEncrypted(user.refresh_token)) {
        console.log('  ⚠️  refresh_token is plain text, encrypting...');
        encryptedRefreshToken = encrypt(user.refresh_token);
        needsUpdate = true;
      } else if (user.refresh_token) {
        console.log('  ✅ refresh_token already encrypted');
      }

      // Update if needed
      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from('focusmate_users')
          .update({
            access_token: encryptedAccessToken,
            refresh_token: encryptedRefreshToken,
          })
          .eq('id', user.id);

        if (updateError) {
          throw new Error(`Failed to update user: ${updateError.message}`);
        }

        console.log('  ✅ Tokens encrypted and updated');
        encryptedCount++;
      } else {
        console.log('  ⏭️  No encryption needed');
        skippedCount++;
      }

      console.log('');

    } catch (error) {
      console.error(`  ❌ Error processing user ${user.email}:`, error);
      errorCount++;
      console.log('');
    }
  }

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Migration Summary:');
  console.log(`  Total users: ${users.length}`);
  console.log(`  ✅ Encrypted: ${encryptedCount}`);
  console.log(`  ⏭️  Skipped (already encrypted): ${skippedCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (errorCount > 0) {
    throw new Error(`Migration completed with ${errorCount} error(s)`);
  }

  console.log('\n🎉 Migration completed successfully!');
}

// Run migration
migrateTokens()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  });
