/**
 * Auth Modal Component
 * Handles user signup and signin
 * Bilingual (EN/CZ)
 */

'use client';

import { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { X } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, language = 'en' }) {
  const [mode, setMode] = useState('signup'); // 'signup' or 'signin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { signUp, signIn, signInWithGoogle } = useAuth();

  const content = {
    en: {
      signupTitle: 'Create Free Account',
      signinTitle: 'Welcome Back',
      signupSubtitle: 'Continue analyzing your data — 5 analyses/month free',
      signinSubtitle: 'Sign in to access your account',
      emailLabel: 'Email',
      passwordLabel: 'Password',
      signupButton: 'Create Account',
      signinButton: 'Sign In',
      googleButton: 'Continue with Google',
      switchToSignin: 'Already have an account? Sign in',
      switchToSignup: "Don't have an account? Sign up",
      terms: 'By signing up, you agree to our Terms of Service and Privacy Policy',
      error: {
        generic: 'Something went wrong. Please try again.',
        invalidEmail: 'Please enter a valid email address',
        weakPassword: 'Password must be at least 6 characters',
        userExists: 'An account with this email already exists',
        invalidCredentials: 'Invalid email or password',
      }
    },
    cz: {
      signupTitle: 'Vytvořit Bezplatný Účet',
      signinTitle: 'Vítejte zpět',
      signupSubtitle: 'Pokračujte v analýze dat — 5 analýz/měsíc zdarma',
      signinSubtitle: 'Přihlaste se ke svému účtu',
      emailLabel: 'Email',
      passwordLabel: 'Heslo',
      signupButton: 'Vytvořit Účet',
      signinButton: 'Přihlásit se',
      googleButton: 'Pokračovat s Google',
      switchToSignin: 'Už máte účet? Přihlásit se',
      switchToSignup: 'Nemáte účet? Zaregistrovat se',
      terms: 'Registrací souhlasíte s našimi Podmínkami služby a Zásadami ochrany osobních údajů',
      error: {
        generic: 'Něco se pokazilo. Zkuste to prosím znovu.',
        invalidEmail: 'Zadejte platnou emailovou adresu',
        weakPassword: 'Heslo musí mít alespoň 6 znaků',
        userExists: 'Účet s tímto emailem již existuje',
        invalidCredentials: 'Neplatný email nebo heslo',
      }
    }
  };

  const t = content[language];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        await signUp(email, password);
        // Success - profile will be auto-created by trigger
        onClose();
      } else {
        await signIn(email, password);
        // Success
        onClose();
      }
    } catch (err) {
      console.error('Auth error:', err);

      // Map error codes to friendly messages
      if (err.message?.includes('Invalid login credentials')) {
        setError(t.error.invalidCredentials);
      } else if (err.message?.includes('User already registered')) {
        setError(t.error.userExists);
      } else if (err.message?.includes('Password should be')) {
        setError(t.error.weakPassword);
      } else if (err.message?.includes('Invalid email')) {
        setError(t.error.invalidEmail);
      } else {
        setError(t.error.generic);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);

    try {
      await signInWithGoogle();
      // Redirect will happen automatically
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError(t.error.generic);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#1e293b',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '440px',
          width: '100%',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#fff', fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '8px' }}>
            {mode === 'signup' ? t.signupTitle : t.signinTitle}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            {mode === 'signup' ? t.signupSubtitle : t.signinSubtitle}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              backgroundColor: '#ef444420',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              color: '#fca5a5',
              fontSize: '0.875rem'
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.875rem', marginBottom: '8px' }}>
              {t.emailLabel}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none'
              }}
              placeholder="you@example.com"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.875rem', marginBottom: '8px' }}>
              {t.passwordLabel}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none'
              }}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: loading ? '#475569' : 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)',
              background: loading ? '#475569' : 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '16px'
            }}
          >
            {loading ? '...' : (mode === 'signup' ? t.signupButton : t.signinButton)}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#334155' }} />
          <span style={{ padding: '0 12px', color: '#64748b', fontSize: '0.875rem' }}>or</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#334155' }} />
        </div>

        {/* Google Sign In */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: '#fff',
            color: '#1e293b',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            marginBottom: '20px'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {t.googleButton}
        </button>

        {/* Switch Mode */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => {
              setMode(mode === 'signup' ? 'signin' : 'signup');
              setError(null);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#3b82f6',
              fontSize: '0.875rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {mode === 'signup' ? t.switchToSignin : t.switchToSignup}
          </button>
        </div>

        {/* Terms (for signup only) */}
        {mode === 'signup' && (
          <p style={{ marginTop: '24px', fontSize: '0.75rem', color: '#64748b', textAlign: 'center', lineHeight: '1.5' }}>
            {t.terms}
          </p>
        )}
      </div>
    </div>
  );
}
