/**
 * Supabase Client Configuration
 * DataWizard Tier System
 */

import { createBrowserClient } from '@supabase/ssr';

/**
 * Client-side Supabase client
 * Use this in React components
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * Get the current user session
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
}

/**
 * Get user profile with tier information
 */
export async function getUserProfile(userId) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}

/**
 * Get current month's usage for a user
 */
export async function getCurrentUsage(userId) {
  const supabase = createClient();

  // Call the database function
  const { data, error } = await supabase.rpc('get_current_usage', {
    p_user_id: userId
  });

  if (error) {
    console.error('Error fetching usage:', error);
    return { analysis_count: 0, total_rows_processed: 0 };
  }

  // data is an array with one row
  return data && data.length > 0
    ? data[0]
    : { analysis_count: 0, total_rows_processed: 0 };
}

/**
 * Increment usage counter after analysis
 */
export async function incrementUsage(userId, rowCount) {
  const supabase = createClient();

  const { error } = await supabase.rpc('increment_usage', {
    p_user_id: userId,
    p_row_count: rowCount
  });

  if (error) {
    console.error('Error incrementing usage:', error);
    throw error;
  }
}

/**
 * Save a report for PRO+ users
 */
export async function saveReport(userId, reportData) {
  const supabase = createClient();

  // Get user tier to determine expiry
  const profile = await getUserProfile(userId);
  if (!profile) throw new Error('Profile not found');

  const storageDays = profile.tier === 'enterprise' ? null : 30;
  const expiresAt = storageDays
    ? new Date(Date.now() + storageDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data, error } = await supabase
    .from('reports')
    .insert({
      user_id: userId,
      title: reportData.title,
      file_name: reportData.fileName,
      row_count: reportData.rowCount,
      analysis_result: reportData.result,
      expires_at: expiresAt
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving report:', error);
    throw error;
  }

  return data;
}

/**
 * Get user's saved reports
 */
export async function getUserReports(userId, limit = 10) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching reports:', error);
    return [];
  }

  return data || [];
}

/**
 * Delete a report
 */
export async function deleteReport(reportId) {
  const supabase = createClient();

  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('id', reportId);

  if (error) {
    console.error('Error deleting report:', error);
    throw error;
  }
}
