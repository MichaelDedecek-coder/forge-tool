/**
 * Feedback Button Component
 * Floating button (bottom-left) that opens feedback modal
 * Bilingual EN/CZ support
 */

'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import FeedbackModal from './FeedbackModal';

export default function FeedbackButton({ language = 'en' }) {
  const [showModal, setShowModal] = useState(false);

  const content = {
    en: {
      buttonText: 'Send Feedback'
    },
    cs: {
      buttonText: 'Odeslat zpětnou vazbu'
    }
  };

  const t = content[language] || content.en;

  return (
    <>
      {/* Floating Feedback Button */}
      <button
        onClick={() => setShowModal(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 20px',
          background: 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '50px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
          transition: 'all 0.2s',
          zIndex: 1000
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.4)';
        }}
      >
        <MessageCircle size={18} />
        <span>{t.buttonText}</span>
      </button>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        language={language}
      />
    </>
  );
}
