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

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] Event:', event);

        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
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

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
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
