"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TIER_LIMITS } from "../lib/tier-config";
import { useAuth } from "../lib/auth-context";
import AuthModal from "../components/AuthModal";

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [language, setLanguage] = useState('en');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(false);

  const t = {
    en: {
      back: '← Back',
      title: 'DataPalo',
      subtitle: 'Your first AI employee — a data analyst at a fraction of the cost',
      freeBadge: 'FREE',
      proBadge: 'PRO',
      recommended: '⭐ RECOMMENDED',
      perMonth: '/month',
      freeDesc: 'Try it out',
      trialDesc: '🎁 14 days free trial',
      freeFeatures: [
        `${TIER_LIMITS.free.analysesPerMonth} analyses per month`,
        `Max ${TIER_LIMITS.free.maxRows.toLocaleString()} rows`,
        'Basic AI analysis',
        'Text export',
        'Email support'
      ],
      freeDisabled: ['PDF export', 'Analysis history', 'Priority processing'],
      proFeatures: [
        '∞ Unlimited analyses',
        '∞ Unlimited rows',
        '🔬 Exa neural search + citations',
        '📊 Industry benchmarks',
        'PDF + PPT export',
        '90-day history',
        'Priority processing'
      ],
      freeCta: 'Start free',
      proCta: '🚀 Start PRO trial',
      proCtaLoading: '⏳ Loading...',
      whyTitle: '💰 Why it\'s a great deal',
      humanTitle: '👨‍💼 Human analyst',
      humanDesc: 'Average salary: <strong>€2,000 – €3,200/month</strong><br/>+ health insurance, holidays, training...',
      aiTitle: '🤖 DataPalo PRO',
      aiDesc: 'Price: <strong>€29/month</strong><br/>= <strong>70x cheaper</strong> than a human employee<br/>✓ Available 24/7 ✓ Instant results ✓ No errors',
      footer: '✅ Cancel anytime | 🔒 Secure payments via Stripe | 🇪🇺 VAT included',
      question: 'Questions? Email',
      company: 'FORGE CREATIVE | AI Job Agency'
    },
    cz: {
      back: '← Zpět',
      title: 'DataPalo',
      subtitle: 'Váš první AI zaměstnanec – datový analytik za zlomek ceny lidského zaměstnance',
      freeBadge: 'FREE',
      proBadge: 'PRO',
      recommended: '⭐ DOPORUČENO',
      perMonth: '/měsíc',
      freeDesc: 'Pro vyzkoušení',
      trialDesc: '🎁 14 dní zdarma na vyzkoušení',
      freeFeatures: [
        `${TIER_LIMITS.free.analysesPerMonth} analýz měsíčně`,
        `Max ${TIER_LIMITS.free.maxRows.toLocaleString()} řádků`,
        'Základní analýzy',
        'Textový export',
        'Email podpora'
      ],
      freeDisabled: ['PDF export', 'Historie analýz', 'Prioritní zpracování'],
      proFeatures: [
        '∞ Neomezené analýzy',
        '∞ Neomezený počet řádků',
        '🔬 Exa neural search + citace',
        '📊 Industry benchmarky',
        'PDF + PPT export',
        'Historie 90 dní',
        'Prioritní zpracování'
      ],
      freeCta: 'Začít zdarma',
      proCta: '🚀 Začít PRO trial',
      proCtaLoading: '⏳ Načítám...',
      whyTitle: '💰 Proč je to výhodné?',
      humanTitle: '👨‍💼 Lidský analytik',
      humanDesc: 'Průměrná mzda: <strong>50 000 - 80 000 Kč/měsíc</strong><br/>+ zdravotní pojištění, dovolená, školení...',
      aiTitle: '🤖 DataPalo PRO',
      aiDesc: 'Cena: <strong>725 Kč/měsíc (€29)</strong><br/>= <strong>70x levnější</strong> než lidský zaměstnanec<br/>✓ Dostupný 24/7 ✓ Okamžité výsledky ✓ Žádné chyby',
      footer: '✅ Zrušit kdykoliv | 🔒 Bezpečné platby přes Stripe | 🇪🇺 Včetně DPH',
      question: 'Máte otázky? Napište na',
      company: 'FORGE CREATIVE | AI Job Agency'
    }
  };

  const c = t[language];

  // Auto-proceed to checkout after sign-in if user was trying to upgrade
  useEffect(() => {
    if (user && pendingCheckout) {
      setPendingCheckout(false);
      startCheckout();
    }
  }, [user, pendingCheckout]);

  const startCheckout = async () => {
    setLoading(true);
    setSelectedPlan('pro');

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        setLoading(false);
        setSelectedPlan(null);
        return;
      }

      window.location.href = data.url;

    } catch (error) {
      console.error('Checkout error:', error);
      alert('Error creating checkout session');
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const handleUpgrade = async (tier) => {
    if (tier === 'free') {
      router.push('/datapalo');
      return;
    }

    // If not signed in, show auth modal first
    if (!user) {
      setPendingCheckout(true);
      setShowAuthModal(true);
      return;
    }

    await startCheckout();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '60px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', marginBottom: '60px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {c.back}
          </button>

          {/* Language Toggle */}
          <div style={{ display: 'flex', gap: '4px', fontSize: '0.8rem', fontWeight: '500' }}>
            {['en', 'cz'].map((lang) => (
              <span
                key={lang}
                onClick={() => setLanguage(lang)}
                style={{
                  cursor: 'pointer',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  color: language === lang ? 'white' : 'rgba(255,255,255,0.4)',
                  background: language === lang ? 'rgba(14, 165, 233, 0.2)' : 'transparent',
                  border: language === lang ? '1px solid rgba(14, 165, 233, 0.3)' : '1px solid transparent',
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase',
                }}
              >{lang}</span>
            ))}
          </div>
        </div>

        <h1 style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          color: 'white',
          marginBottom: '20px'
        }}>
          <span style={{ color: '#0ea5e9' }}>Data</span>Palo
        </h1>
        <p style={{
          fontSize: '1.3rem',
          color: '#94a3b8',
          maxWidth: '700px',
          margin: '0 auto'
        }}>
          {c.subtitle}
        </p>
      </div>

      {/* Pricing Cards */}
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '30px',
        alignItems: 'stretch'
      }}>

        {/* FREE Plan */}
        <div style={{
          background: '#1e293b',
          border: '2px solid #334155',
          borderRadius: '20px',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              display: 'inline-block',
              padding: '6px 16px',
              background: '#334155',
              color: '#94a3b8',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '600',
              marginBottom: '15px'
            }}>
              {c.freeBadge}
            </div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', margin: '10px 0' }}>
              €0<span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 'normal' }}>{c.perMonth}</span>
            </h2>
            <p style={{ color: '#64748b', fontSize: '15px' }}>{c.freeDesc}</p>
          </div>

          <div style={{ flex: 1, marginBottom: '30px' }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {c.freeFeatures.map((feature, idx) => (
                <li key={idx} style={{
                  padding: '12px 0',
                  color: '#94a3b8',
                  fontSize: '15px',
                  borderBottom: '1px solid #334155',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{ color: '#10b981' }}>✓</span> {feature}
                </li>
              ))}
              {c.freeDisabled.map((feature, idx) => (
                <li key={idx} style={{
                  padding: '12px 0',
                  color: '#475569',
                  fontSize: '15px',
                  borderBottom: '1px solid #334155',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{ color: '#475569' }}>✗</span> {feature}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => handleUpgrade('free')}
            style={{
              width: '100%',
              padding: '16px',
              background: '#334155',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = '#475569'}
            onMouseOut={(e) => e.target.style.background = '#334155'}
          >
            {c.freeCta}
          </button>
        </div>

        {/* PRO Plan */}
        <div style={{
          background: 'linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)',
          border: 'none',
          borderRadius: '20px',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(14, 165, 233, 0.4)',
          transform: 'scale(1.05)'
        }}>
          <div style={{
            position: 'absolute',
            top: '-15px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#fbbf24',
            color: '#000',
            padding: '6px 20px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '700',
            boxShadow: '0 4px 12px rgba(251, 191, 36, 0.4)'
          }}>
            {c.recommended}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{
              display: 'inline-block',
              padding: '6px 16px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '600',
              marginBottom: '15px'
            }}>
              {c.proBadge}
            </div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', margin: '10px 0' }}>
              €29<span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.8)', fontWeight: 'normal' }}>{c.perMonth}</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '15px', fontWeight: '600' }}>
              {c.trialDesc}
            </p>
          </div>

          <div style={{ flex: 1, marginBottom: '30px' }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {c.proFeatures.map((feature, idx) => (
                <li key={idx} style={{
                  padding: '12px 0',
                  color: 'white',
                  fontSize: '15px',
                  borderBottom: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontWeight: '500'
                }}>
                  <span style={{ fontSize: '18px' }}>✓</span> {feature}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => handleUpgrade('pro')}
            disabled={loading && selectedPlan === 'pro'}
            style={{
              width: '100%',
              padding: '16px',
              background: 'white',
              color: '#0ea5e9',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: loading && selectedPlan === 'pro' ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: loading && selectedPlan === 'pro' ? 0.7 : 1
            }}
            onMouseOver={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            {loading && selectedPlan === 'pro' ? c.proCtaLoading : c.proCta}
          </button>
        </div>
      </div>

      {/* FAQ / Benefits */}
      <div style={{
        maxWidth: '900px',
        margin: '80px auto 0',
        background: '#1e293b',
        padding: '40px',
        borderRadius: '20px',
        border: '1px solid #334155'
      }}>
        <h3 style={{ color: 'white', fontSize: '1.8rem', marginBottom: '30px', textAlign: 'center' }}>
          {c.whyTitle}
        </h3>

        <div style={{ display: 'grid', gap: '20px' }}>
          <div style={{ background: '#0f172a', padding: '20px', borderRadius: '12px' }}>
            <h4 style={{ color: '#10b981', marginBottom: '10px' }}>{c.humanTitle}</h4>
            <p style={{ color: '#94a3b8', margin: 0 }} dangerouslySetInnerHTML={{ __html: c.humanDesc }} />
          </div>

          <div style={{ background: '#0f172a', padding: '20px', borderRadius: '12px', border: '2px solid #10b981' }}>
            <h4 style={{ color: '#0ea5e9', marginBottom: '10px' }}>{c.aiTitle}</h4>
            <p style={{ color: '#94a3b8', margin: 0 }} dangerouslySetInnerHTML={{ __html: c.aiDesc }} />
          </div>
        </div>

        <div style={{ marginTop: '30px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
          <p>{c.footer}</p>
        </div>
      </div>

      {/* Footer CTA */}
      <div style={{ textAlign: 'center', marginTop: '60px', color: '#64748b' }}>
        <p style={{ fontSize: '14px', marginBottom: '10px' }}>
          {c.question}{' '}
          <a href="mailto:michael@forgecreative.cz" style={{ color: '#0ea5e9', textDecoration: 'none' }}>
            michael@forgecreative.cz
          </a>
        </p>
        <p style={{ fontSize: '12px', color: '#475569' }}>
          {c.company}
        </p>
      </div>

      {/* Auth Modal - shows when user tries to upgrade without being signed in */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          if (!user) {
            setPendingCheckout(false);
          }
        }}
        language={language === 'cz' ? 'cs' : 'en'}
        defaultMode="signin"
      />
    </div>
  );
}
