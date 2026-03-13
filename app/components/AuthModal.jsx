/**
 * Auth Modal Component — Trust-First Design
 * Goal: Convert visitors to signups by reducing fear and showing value
 * Bilingual (EN/CZ)
 */

'use client';

import { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { X } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, language = 'en', defaultMode = 'signup', googleRedirectTo }) {
  const [mode, setMode] = useState(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const { signUp, signIn, signInWithGoogle } = useAuth();

  const content = {
    en: {
      signupTitle: 'Continue for Free',
      signinTitle: 'Welcome Back',
      signupSubtitle: 'Unlock unlimited insights from your data',
      signinSubtitle: 'Sign in to your account',
      // Value props
      val1: '5 free analyses every month',
      val2: 'Beautiful charts & summaries',
      val3: 'No credit card required — ever',
      // Trust badges
      badge1: 'No credit card',
      badge2: 'No spam',
      badge3: 'GDPR compliant',
      badge4: 'Delete anytime',
      // Form
      emailLabel: 'Email',
      passwordLabel: 'Password',
      signupButton: 'Create Free Account',
      signinButton: 'Sign In',
      googleButton: 'Continue with Google',
      emailButton: 'Continue with Email',
      backToOptions: 'Back to sign in options',
      switchToSignin: 'Already have an account? Sign in',
      switchToSignup: "Don't have an account? Sign up free",
      terms: 'Your data is analyzed in memory and never stored. Hosted in the EU.',
      or: 'or',
      error: {
        generic: 'Something went wrong. Please try again.',
        invalidEmail: 'Please enter a valid email address',
        weakPassword: 'Password must be at least 6 characters',
        userExists: 'An account with this email already exists',
        invalidCredentials: 'Invalid email or password',
      }
    },
    cs: {
      signupTitle: 'Pokračujte zdarma',
      signinTitle: 'Vítejte zpět',
      signupSubtitle: 'Odemkněte neomezené přehledy z vašich dat',
      signinSubtitle: 'Přihlaste se ke svému účtu',
      // Value props
      val1: '5 analýz zdarma každý měsíc',
      val2: 'Přehledné grafy a shrnutí',
      val3: 'Žádná kreditní karta — nikdy',
      // Trust badges
      badge1: 'Bez kreditky',
      badge2: 'Žádný spam',
      badge3: 'GDPR',
      badge4: 'Smazat kdykoliv',
      // Form
      emailLabel: 'Email',
      passwordLabel: 'Heslo',
      signupButton: 'Vytvořit bezplatný účet',
      signinButton: 'Přihlásit se',
      googleButton: 'Pokračovat přes Google',
      emailButton: 'Pokračovat s emailem',
      backToOptions: 'Zpět na možnosti přihlášení',
      switchToSignin: 'Už máte účet? Přihlásit se',
      switchToSignup: 'Nemáte účet? Registrujte se zdarma',
      terms: 'Vaše data se analyzují v paměti a nikdy se neukládají. Hostováno v EU.',
      or: 'nebo',
      error: {
        generic: 'Něco se pokazilo. Zkuste to prosím znovu.',
        invalidEmail: 'Zadejte platnou emailovou adresu',
        weakPassword: 'Heslo musí mít alespoň 6 znaků',
        userExists: 'Účet s tímto emailem již existuje',
        invalidCredentials: 'Neplatný email nebo heslo',
      }
    }
  };

  const t = content[language] || content.en;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        await signUp(email, password);
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'sign_up', { method: 'email' });
        }
        onClose();
      } else {
        await signIn(email, password);
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'login', { method: 'email' });
        }
        onClose();
      }
    } catch (err) {
      console.error('Auth error:', err);
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
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', mode === 'signup' ? 'sign_up' : 'login', { method: 'google' });
      }
      await signInWithGoogle(googleRedirectTo);
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError(t.error.generic);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isSignup = mode === 'signup';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#1e293b',
          borderRadius: '20px',
          padding: '36px',
          maxWidth: '420px',
          width: '100%',
          position: 'relative',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.6)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            padding: '4px',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.color = '#fff'}
          onMouseLeave={(e) => e.target.style.color = '#64748b'}
        >
          <X size={20} />
        </button>

        {/* ─── HEADER ─── */}
        <div style={{ marginBottom: isSignup && !showEmailForm ? '20px' : '24px', textAlign: 'center' }}>
          {/* Logo */}
          <img
            src="/datapalo-logo.svg"
            alt="DataPalo"
            style={{ width: '48px', height: '48px', marginBottom: '16px' }}
          />
          <h2 style={{
            color: '#fff',
            fontSize: '1.5rem',
            fontWeight: '700',
            marginBottom: '6px',
            letterSpacing: '-0.02em',
          }}>
            {isSignup ? t.signupTitle : t.signinTitle}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.4' }}>
            {isSignup ? t.signupSubtitle : t.signinSubtitle}
          </p>
        </div>

        {/* ─── VALUE PROPS (signup only) ─── */}
        {isSignup && !showEmailForm && (
          <div style={{
            marginBottom: '24px',
            padding: '14px 16px',
            background: 'rgba(16, 185, 129, 0.06)',
            borderRadius: '12px',
            border: '1px solid rgba(16, 185, 129, 0.12)',
          }}>
            {[t.val1, t.val2, t.val3].map((val, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '5px 0',
                color: '#e2e8f0',
                fontSize: '0.875rem',
              }}>
                <span style={{ color: '#10b981', fontSize: '1rem', flexShrink: 0 }}>✓</span>
                <span>{val}</span>
              </div>
            ))}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '12px 14px',
            marginBottom: '16px',
            color: '#fca5a5',
            fontSize: '0.85rem',
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        {/* ─── SIGN-IN OPTIONS ─── */}
        {!showEmailForm ? (
          <>
            {/* Google Button — PRIMARY ACTION */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px 16px',
                backgroundColor: '#fff',
                color: '#1e293b',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                marginBottom: '12px',
                transition: 'transform 0.15s, box-shadow 0.15s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.25)'; }}}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'; }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t.googleButton}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#334155' }} />
              <span style={{ padding: '0 14px', color: '#475569', fontSize: '0.8rem' }}>{t.or}</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#334155' }} />
            </div>

            {/* Email Option — SECONDARY */}
            <button
              onClick={() => setShowEmailForm(true)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px 16px',
                backgroundColor: 'transparent',
                color: '#94a3b8',
                border: '1px solid #334155',
                borderRadius: '10px',
                fontSize: '0.9rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#475569'; e.currentTarget.style.color = '#e2e8f0'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#94a3b8'; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="M22 7l-10 7L2 7"/>
              </svg>
              {t.emailButton}
            </button>
          </>
        ) : (
          /* ─── EMAIL FORM ─── */
          <>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '6px', fontWeight: '500' }}>
                  {t.emailLabel}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = '#334155'}
                  placeholder="you@example.com"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '6px', fontWeight: '500' }}>
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
                    padding: '12px 14px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = '#334155'}
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '13px',
                  background: loading ? '#475569' : 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginBottom: '12px',
                  transition: 'transform 0.15s, opacity 0.15s',
                }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.opacity = '0.9'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
              >
                {loading ? '...' : (isSignup ? t.signupButton : t.signinButton)}
              </button>
            </form>

            {/* Back to options */}
            <button
              onClick={() => { setShowEmailForm(false); setError(null); }}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '0.8rem',
                cursor: 'pointer',
                padding: '4px',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => e.target.style.color = '#94a3b8'}
              onMouseLeave={(e) => e.target.style.color = '#64748b'}
            >
              ← {t.backToOptions}
            </button>
          </>
        )}

        {/* ─── TRUST BADGES (signup only) ─── */}
        {isSignup && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '6px',
            flexWrap: 'wrap',
            marginTop: '20px',
            marginBottom: '4px',
          }}>
            {[
              { icon: '💳', label: t.badge1 },
              { icon: '🔇', label: t.badge2 },
              { icon: '🇪🇺', label: t.badge3 },
              { icon: '🗑️', label: t.badge4 },
            ].map((badge, i) => (
              <span key={i} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '20px',
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: '#64748b',
                fontSize: '0.7rem',
                fontWeight: '500',
                whiteSpace: 'nowrap',
              }}>
                <span style={{ fontSize: '0.75rem' }}>{badge.icon}</span>
                {badge.label}
              </span>
            ))}
          </div>
        )}

        {/* ─── SWITCH MODE ─── */}
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            onClick={() => {
              setMode(mode === 'signup' ? 'signin' : 'signup');
              setShowEmailForm(false);
              setError(null);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => e.target.style.color = '#10b981'}
            onMouseLeave={(e) => e.target.style.color = '#64748b'}
          >
            {isSignup ? t.switchToSignin : t.switchToSignup}
          </button>
        </div>

        {/* ─── PRIVACY NOTE ─── */}
        <p style={{
          marginTop: '16px',
          fontSize: '0.7rem',
          color: '#475569',
          textAlign: 'center',
          lineHeight: '1.5',
        }}>
          🔒 {t.terms}
        </p>
      </div>
    </div>
  );
}
