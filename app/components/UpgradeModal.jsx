"use client";
import { useRouter } from "next/navigation";

export default function UpgradeModal({ isOpen, onClose, reason, message, language = "cs" }) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    router.push('/pricing');
  };

  const texts = {
    cs: {
      title: "🚀 Čas upgradovat!",
      rowLimitTitle: "📊 Příliš velký soubor",
      analysisLimitTitle: "⚡ Vyčerpali jste FREE limit",
      upgradeButton: "Přejít na PRO za €49/měs",
      closeButton: "Možná později",
      proFeatures: [
        "∞ Neomezené analýzy",
        "∞ Neomezený počet řádků",
        "🎁 7 dní zdarma na vyzkoušení",
        "📄 PDF + PPT export",
        "💾 Historie 90 dní",
        "⚡ Prioritní zpracování"
      ]
    },
    en: {
      title: "🚀 Time to Upgrade!",
      rowLimitTitle: "📊 File Too Large",
      analysisLimitTitle: "⚡ FREE Limit Reached",
      upgradeButton: "Upgrade to PRO €49/mo",
      closeButton: "Maybe Later",
      proFeatures: [
        "∞ Unlimited analyses",
        "∞ Unlimited rows",
        "🎁 7-day free trial",
        "📄 PDF + PPT export",
        "💾 90-day history",
        "⚡ Priority processing"
      ]
    }
  };

  const t = texts[language] || texts.cs;

  const getTitle = () => {
    if (reason === 'row_limit') return t.rowLimitTitle;
    if (reason === 'analysis_limit') return t.analysisLimitTitle;
    return t.title;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        border: '2px solid #0ea5e9',
        borderRadius: '20px',
        maxWidth: '500px',
        width: '100%',
        padding: '40px',
        boxShadow: '0 20px 60px rgba(14, 165, 233, 0.3)',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'none',
            border: 'none',
            color: '#64748b',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '5px',
            lineHeight: '1'
          }}
        >
          ×
        </button>

        {/* Header */}
        <h2 style={{
          fontSize: '1.8rem',
          color: 'white',
          marginBottom: '15px',
          textAlign: 'center'
        }}>
          {getTitle()}
        </h2>

        {/* Message */}
        <p style={{
          color: '#94a3b8',
          fontSize: '16px',
          textAlign: 'center',
          marginBottom: '30px',
          lineHeight: '1.6'
        }}>
          {message}
        </p>

        {/* PRO Features */}
        <div style={{
          background: 'rgba(14, 165, 233, 0.1)',
          border: '1px solid rgba(14, 165, 233, 0.3)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '30px'
        }}>
          <h3 style={{
            color: '#0ea5e9',
            fontSize: '1.1rem',
            marginBottom: '15px',
            textAlign: 'center'
          }}>
            DataWizard PRO
          </h3>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0
          }}>
            {t.proFeatures.map((feature, idx) => (
              <li key={idx} style={{
                color: 'white',
                fontSize: '14px',
                padding: '8px 0',
                borderBottom: idx < t.proFeatures.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none'
              }}>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
          <button
            onClick={handleUpgrade}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            {t.upgradeButton}
          </button>

          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '12px',
              background: 'transparent',
              color: '#64748b',
              border: '1px solid #334155',
              borderRadius: '12px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.target.style.borderColor = '#475569';
              e.target.style.color = '#94a3b8';
            }}
            onMouseOut={(e) => {
              e.target.style.borderColor = '#334155';
              e.target.style.color = '#64748b';
            }}
          >
            {t.closeButton}
          </button>
        </div>
      </div>
    </div>
  );
}
