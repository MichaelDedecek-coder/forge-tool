"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { TIER_LIMITS } from "../lib/tier-config";

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const handleUpgrade = async (tier) => {
    if (tier === 'free') {
      // Redirect to datapalo
      router.push('/datapalo');
      return;
    }

    setLoading(true);
    setSelectedPlan(tier);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        setLoading(false);
        return;
      }

      // Redirect to Stripe checkout
      window.location.href = data.url;

    } catch (error) {
      console.error('Checkout error:', error);
      alert('Error creating checkout session');
      setLoading(false);
      setSelectedPlan(null);
    }
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
        <button
          onClick={() => router.push('/')}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ← Zpět
        </button>

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
          Váš první AI zaměstnanec – datový analytik za zlomek ceny lidského zaměstnance
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
              FREE
            </div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', margin: '10px 0' }}>
              €0<span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 'normal' }}>/měsíc</span>
            </h2>
            <p style={{ color: '#64748b', fontSize: '15px' }}>Pro vyzkoušení</p>
          </div>

          <div style={{ flex: 1, marginBottom: '30px' }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                `${TIER_LIMITS.free.analysesPerMonth} analýz měsíčně`,
                `Max ${TIER_LIMITS.free.maxRows.toLocaleString()} řádků`,
                'Základní analýzy',
                'Textový export',
                'Email podpora'
              ].map((feature, idx) => (
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
              {[
                'PDF export',
                'Historie analýz',
                'Prioritní zpracování'
              ].map((feature, idx) => (
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
            Začít zdarma
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
            ⭐ DOPORUČENO
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
              PRO
            </div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', margin: '10px 0' }}>
              €49<span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.8)', fontWeight: 'normal' }}>/měsíc</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '15px', fontWeight: '600' }}>
              🎁 7 dní zdarma na vyzkoušení
            </p>
          </div>

          <div style={{ flex: 1, marginBottom: '30px' }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                '∞ Neomezené analýzy',
                '∞ Neomezený počet řádků',
                'Pokročilé AI analýzy',
                'PDF + PPT export',
                'Historie 90 dní',
                'Prioritní zpracování',
                'Prioritní podpora 24/7'
              ].map((feature, idx) => (
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
            {loading && selectedPlan === 'pro' ? '⏳ Načítám...' : '🚀 Začít PRO trial'}
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
          💰 Proč je to výhodné?
        </h3>

        <div style={{ display: 'grid', gap: '20px' }}>
          <div style={{ background: '#0f172a', padding: '20px', borderRadius: '12px' }}>
            <h4 style={{ color: '#10b981', marginBottom: '10px' }}>👨‍💼 Lidský analytik</h4>
            <p style={{ color: '#94a3b8', margin: 0 }}>
              Průměrná mzda: <strong style={{ color: 'white' }}>50 000 - 80 000 Kč/měsíc</strong><br/>
              + zdravotní pojištění, dovolená, školení...
            </p>
          </div>

          <div style={{ background: '#0f172a', padding: '20px', borderRadius: '12px', border: '2px solid #10b981' }}>
            <h4 style={{ color: '#0ea5e9', marginBottom: '10px' }}>🤖 DataPalo PRO</h4>
            <p style={{ color: '#94a3b8', margin: 0 }}>
              Cena: <strong style={{ color: '#10b981', fontSize: '1.2rem' }}>1 250 Kč/měsíc (€49)</strong><br/>
              = <strong style={{ color: '#10b981' }}>40x levnější</strong> než lidský zaměstnanec<br/>
              ✓ Dostupný 24/7 ✓ Okamžité výsledky ✓ Žádné chyby
            </p>
          </div>
        </div>

        <div style={{ marginTop: '30px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
          <p>✅ Zrušit kdykoliv | 🔒 Bezpečné platby přes Stripe | 🇪🇺 Včetně DPH</p>
        </div>
      </div>

      {/* Footer CTA */}
      <div style={{ textAlign: 'center', marginTop: '60px', color: '#64748b' }}>
        <p style={{ fontSize: '14px', marginBottom: '10px' }}>
          Máte otázky? Napište na{' '}
          <a href="mailto:michael@forgecreative.cz" style={{ color: '#0ea5e9', textDecoration: 'none' }}>
            michael@forgecreative.cz
          </a>
        </p>
        <p style={{ fontSize: '12px', color: '#475569' }}>
          FORGE CREATIVE | AI Job Agency
        </p>
      </div>
    </div>
  );
}
