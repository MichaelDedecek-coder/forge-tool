/**
 * Auth Context Provider
 * Manages user authentication state across the app
 */

'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from './supabase-client';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Skip auth if Supabase not configured
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Use onAuthStateChange as the SINGLE source of truth.
    // Calling getSession() separately causes a lock race condition:
    // "Lock broken by another request with the 'steal' option"
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] Event:', event);

        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);

          // Add new signups to Mailchimp for welcome email automation
          if (event === 'SIGNED_IN') {
            // Check if this is a brand-new user (created within last 30 seconds)
            const createdAt = new Date(session.user.created_at);
            const now = new Date();
            const isNewUser = (now - createdAt) < 30000;

            if (isNewUser) {
              fetch('/api/auth/welcome', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: session.user.email,
                  name: session.user.user_metadata?.full_name || '',
                }),
              }).catch(err => console.error('[Auth] Welcome email error:', err));
            }
          }
        } else {
          setUser(null);
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId) => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[Auth] Profile query error:', error.message, error.code);
        throw error;
      }

      if (data) {
        setProfile(data);
      } else {
        // Query succeeded but returned no data — set fallback
        console.warn('[Auth] Profile query returned null data for', userId);
        setProfile(prev => prev || { id: userId, tier: 'free' });
      }
    } catch (error) {
      console.error('[Auth] Error fetching profile:', error);
      // Set a minimal fallback profile so downstream code doesn't break.
      // The sync-tier effect on /datapalo will correct the tier from Stripe.
      setProfile(prev => prev || { id: userId, tier: 'free' });
    }
  };

  const signUp = async (email, password) => {
    if (!supabase) throw new Error('Authentication not configured');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    return data;
  };

  const signIn = async (email, password) => {
    if (!supabase) throw new Error('Authentication not configured');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  };

  const signInWithGoogle = async (redirectTo) => {
    if (!supabase) throw new Error('Authentication not configured');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo || `${window.location.origin}/datapalo`,
      },
    });

    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    if (!supabase) throw new Error('Authentication not configured');

    // 1. Server-side sign-out: properly clears SSR cookies that client JS can't access
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch (e) {
      console.error('[Auth] Server signout error:', e);
    }

    // 2. Client-side sign-out: revokes session globally (default scope)
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[Auth] Client signout error:', error);
    }

    // 3. Clear any remaining client-accessible cookies as a fallback
    document.cookie.split(';').forEach((c) => {
      const name = c.trim().split('=')[0];
      if (name.startsWith('sb-')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
    });

    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
