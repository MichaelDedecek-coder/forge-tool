/**
 * Feedback Modal Component
 * Allows users to submit feedback, bug reports, feature requests
 * Bilingual EN/CZ support
 */

'use client';

import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { useAuth } from '../lib/auth-context';

export default function FeedbackModal({ isOpen, onClose, language = 'en' }) {
  const { user } = useAuth();
  const [feedbackType, setFeedbackType] = useState('general');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const content = {
    en: {
      title: 'Send Feedback',
      subtitle: 'Help us improve DataWizard with your feedback.',
      typeLabel: 'Feedback Type',
      types: {
        bug: 'Bug Report',
        feature: 'Feature Request',
        general: 'General Feedback',
        question: 'Question'
      },
      messageLabel: 'Message',
      messagePlaceholder: 'Tell us what you think...',
      emailLabel: 'Email (optional)',
      emailPlaceholder: 'your@email.com',
      emailHelper: 'So we can follow up if needed',
      submitButton: 'Send Feedback',
      submitting: 'Sending...',
      successMessage: 'Thank you for your feedback!',
      successSubtext: 'We appreciate your input and will review it shortly.',
      errorMessage: 'Failed to send feedback. Please try again.',
      closeButton: 'Close'
    },
    cs: {
      title: 'Odeslat zpětnou vazbu',
      subtitle: 'Pomozte nám vylepšit DataWizard vaší zpětnou vazbou.',
      typeLabel: 'Typ zpětné vazby',
      types: {
        bug: 'Hlášení chyby',
        feature: 'Návrh funkce',
        general: 'Obecná zpětná vazba',
        question: 'Otázka'
      },
      messageLabel: 'Zpráva',
      messagePlaceholder: 'Řekněte nám, co si myslíte...',
      emailLabel: 'Email (volitelné)',
      emailPlaceholder: 'vas@email.cz',
      emailHelper: 'Abychom vás mohli kontaktovat',
      submitButton: 'Odeslat zpětnou vazbu',
      submitting: 'Odesílám...',
      successMessage: 'Děkujeme za vaši zpětnou vazbu!',
      successSubtext: 'Vážíme si vašeho názoru a brzy jej posoudíme.',
      errorMessage: 'Nepodařilo se odeslat zpětnou vazbu. Zkuste to prosím znovu.',
      closeButton: 'Zavřít'
    }
  };

  const t = content[language] || content.en;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback_type: feedbackType,
          message: message.trim(),
          email: email.trim() || null,
          page_url: window.location.href,
          user_agent: navigator.userAgent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setSuccess(true);

      // Reset form after 2 seconds and close
      setTimeout(() => {
        setMessage('');
        setFeedbackType('general');
        setSuccess(false);
        onClose();
      }, 2000);

    } catch (err) {
      console.error('Feedback submission error:', err);
      setError(t.errorMessage);
    } finally {
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
          maxWidth: '500px',
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

        {/* Success State */}
        {success ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>✓</div>
            <h2 style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '12px' }}>
              {t.successMessage}
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              {t.successSubtext}
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ color: '#fff', fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '8px' }}>
                {t.title}
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                {t.subtitle}
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
              {/* Feedback Type */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.875rem', marginBottom: '8px' }}>
                  {t.typeLabel}
                </label>
                <select
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="general">{t.types.general}</option>
                  <option value="bug">{t.types.bug}</option>
                  <option value="feature">{t.types.feature}</option>
                  <option value="question">{t.types.question}</option>
                </select>
              </div>

              {/* Message */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.875rem', marginBottom: '8px' }}>
                  {t.messageLabel}
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={5}
                  placeholder={t.messagePlaceholder}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Email */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.875rem', marginBottom: '8px' }}>
                  {t.emailLabel}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
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
                />
                <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '6px' }}>
                  {t.emailHelper}
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !message.trim()}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: loading || !message.trim()
                    ? '#475569'
                    : 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: loading || !message.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Send size={18} />
                {loading ? t.submitting : t.submitButton}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
