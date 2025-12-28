/**
 * Client-side Providers
 * Wraps the app with necessary context providers
 */

'use client';

import { AuthProvider } from './lib/auth-context';

export function Providers({ children }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
