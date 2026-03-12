/**
 * Anonymous Session Tracking
 * Tracks uploads for non-authenticated users
 * Triggers signup wall after first upload
 */

const STORAGE_KEY = 'datapalo_anonymous_uploads';

/**
 * Check if user has uploaded before (anonymous)
 * @returns {boolean}
 */
export function hasAnonymousUpload() {
  if (typeof window === 'undefined') return false;

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return false;

    const parsed = JSON.parse(data);
    return parsed.count > 0;
  } catch (error) {
    console.error('Error reading anonymous session:', error);
    return false;
  }
}

/**
 * Increment anonymous upload count
 * @returns {number} - New count
 */
export function incrementAnonymousUpload() {
  if (typeof window === 'undefined') return 0;

  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    const data = existing ? JSON.parse(existing) : { count: 0, firstUpload: Date.now() };

    data.count += 1;
    data.lastUpload = Date.now();

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    return data.count;
  } catch (error) {
    console.error('Error incrementing anonymous uploads:', error);
    return 0;
  }
}

/**
 * Get anonymous upload count
 * @returns {number}
 */
export function getAnonymousUploadCount() {
  if (typeof window === 'undefined') return 0;

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return 0;

    const parsed = JSON.parse(data);
    return parsed.count || 0;
  } catch (error) {
    console.error('Error getting anonymous count:', error);
    return 0;
  }
}

/**
 * Clear anonymous session (called after signup)
 */
export function clearAnonymousSession() {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing anonymous session:', error);
  }
}

/**
 * How many free analyses an anonymous visitor gets before the signup wall blocks.
 * They see the full results each time — the wall only appears AFTER the Nth analysis.
 */
export const ANONYMOUS_FREE_LIMIT = 2;

/**
 * Check if user should see signup wall (blocks further analysis)
 * Logic: Allow ANONYMOUS_FREE_LIMIT analyses with full results,
 *        then block on the next attempt until they sign up.
 * @param {boolean} isAuthenticated - Is user logged in?
 * @returns {boolean}
 */
export function shouldShowSignupWall(isAuthenticated) {
  if (isAuthenticated) return false;
  return getAnonymousUploadCount() >= ANONYMOUS_FREE_LIMIT;
}
