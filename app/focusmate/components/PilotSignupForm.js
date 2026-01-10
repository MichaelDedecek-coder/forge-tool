"use client";

import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

export default function PilotSignupForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setStatus('error');
      setErrorMessage('Email is required');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('https://formspree.io/f/xreezlqr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name }),
      });

      if (response.ok) {
        setStatus('success');
        setEmail('');
        setName('');
      } else {
        setStatus('error');
        setErrorMessage('Something went wrong. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Network error. Please check your connection and try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-teal-600/10 border border-teal-600/30 rounded-2xl p-8 text-center">
        <CheckCircle2 className="w-16 h-16 text-teal-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">You're on the list!</h3>
        <p className="text-gray-300">
          We'll reach out when your spot opens. Check your inbox for confirmation.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
        <div className="space-y-4">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white text-slate-900 rounded-lg border-2 border-gray-300 focus:border-teal-500 focus:outline-none transition-colors"
              placeholder="you@company.com"
              disabled={status === 'loading'}
            />
          </div>

          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-white text-slate-900 rounded-lg border-2 border-gray-300 focus:border-teal-500 focus:outline-none transition-colors"
              placeholder="Jane Smith"
              disabled={status === 'loading'}
            />
          </div>

          {/* Error Message */}
          {status === 'error' && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-400 text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full px-8 py-4 bg-teal-600 text-white font-bold rounded-full hover:bg-teal-700 transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Joining...
              </>
            ) : (
              'Join the Pilot'
            )}
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-4 text-center">
          By joining, you'll receive updates about FocusMate. We respect your privacy and won't spam you.
        </p>
      </div>
    </form>
  );
}
