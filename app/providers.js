/**
 * Client-side Providers
 * Wraps the app with necessary context providers
 *
 * NOTE: AuthProvider removed for datawizard-2026 deployment
 * This project is auth-free - DataWizard is completely public
 */

'use client';

export function Providers({ children }) {
  // No auth provider - DataWizard is public
  return <>{children}</>;
}
