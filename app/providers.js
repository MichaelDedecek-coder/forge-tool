/**
 * Client-side Providers
 * Wraps the app with necessary context providers
 *
 * NOTE: AuthProvider removed for datapalo-2026 deployment
 * This project is auth-free - DataPalo is completely public
 */

'use client';

export function Providers({ children }) {
  // No auth provider - DataPalo is public
  return <>{children}</>;
}
