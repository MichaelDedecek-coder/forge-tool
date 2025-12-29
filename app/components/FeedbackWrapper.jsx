/**
 * Feedback Wrapper Component
 * Client component that wraps FeedbackButton with language detection
 */

'use client';

import { useState, useEffect } from 'react';
import FeedbackButton from './FeedbackButton';

export default function FeedbackWrapper() {
  const [language, setLanguage] = useState('en');

  // Detect language from localStorage or browser
  useEffect(() => {
    // Try to get language from localStorage (set by datawizard page)
    const savedLang = localStorage.getItem('datawizard_language');
    if (savedLang) {
      setLanguage(savedLang);
    } else {
      // Fallback to browser language
      const browserLang = navigator.language?.startsWith('cs') ? 'cs' : 'en';
      setLanguage(browserLang);
    }
  }, []);

  return <FeedbackButton language={language} />;
}
