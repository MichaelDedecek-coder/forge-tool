"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase-client";
import { TIER_LIMITS, getDaysUntilReset } from "../lib/tier-config";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    const supabase = createClient();

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      router.push('/');
      return;
    }

    setUser(user);

    // Get subscription
    const { data: subData } = await supabase
      .from('users_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    setSubscription(subData || { tier: 'free' });

    // Get usage
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: usageData } = await supabase
      .from('users_usage')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', currentMonth)
      .single();

    setUsage(usageData || { analyses_count: 0, total_rows_processed: 0 });
    setLoading(false);
  }

  async function handleUpgrade() {
    setActionLoading(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        setActionLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Error creating checkout session');
      setActionLoading(false);
    }
  }

  async function handleManageSubscription() {
    setActionLoading(true);
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        setActionLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      console.error('Portal error:', error);
      alert('Error opening billing portal');
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <p>Načítám...</p>
        </div>
      </div>
    );
  }

  const tier = subscription?.tier || 'free';
  const limits = TIER_LIMITS[tier];
  const usagePercent = limits.analysesPerMonth === Infinity
    ? 0
    : Math.min(100, (usage.analyses_count / limits.analysesPerMonth) * 100);

  const daysUntilReset = getDaysUntilReset();

  const isTrialing = subscription?.subscription_status === 'trialing';
  const trialEndsAt = subscription?.trial_end ? new Date(subscription.trial_end) : null;
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '40px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', color: 'white', marginBottom: '10px' }}>
              <span style={{ color: '#0ea5e9' }}>Data</span>Palo Dashboard
            </h1>
            <p style={{ color: '#64748b', fontSize: '16px' }}>
              Vítejte, {user?.email}
            </p>
          </div>

          <button
            onClick={() => router.push('/datapalo')}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}
          >
            📊 Analyzovat data
          </button>
        </div>

        {/* Trial Banner */}
        {isTrialing && (
          <div style={{
            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
            color: '#000',
            padding: '20px 30px',
            borderRadius: '12px',
            marginBottom: '30px',
            fontWeight: '600',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(251, 191, 36, 0.4)'
          }}>
            🎁 Máte aktivní 14denní trial PRO verze! Zbývá {trialDaysLeft} {trialDaysLeft === 1 ? 'den' : 'dní'}
          </div>
        )}

        {/* Tier Card */}
        <div style={{
          background: tier === 'pro' ? 'linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)' : '#1e293b',
          border: tier === 'pro' ? 'none' : '2px solid #334155',
          borderRadius: '20px',
          padding: '40px',
          marginBottom: '30px',
          boxShadow: tier === 'pro' ? '0 20px 60px rgba(14, 165, 233, 0.4)' : 'none'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <div style={{
                display: 'inline-block',
                padding: '6px 16px',
                background: tier === 'pro' ? 'rgba(255,255,255,0.2)' : '#334155',
                color: tier === 'pro' ? 'white' : '#94a3b8',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '600',
                marginBottom: '15px'
              }}>
                {tier.toUpperCase()}
              </div>
              <h2 style={{
                fontSize: '2rem',
                color: tier === 'pro' ? 'white' : 'white',
                marginBottom: '10px'
              }}>
                €{limits.price}<span style={{ fontSize: '1rem', fontWeight: 'normal', opacity: 0.8 }}>/měsíc</span>
              </h2>
              <p style={{
                color: tier === 'pro' ? 'rgba(255,255,255,0.9)' : '#64748b',
                fontSize: '14px'
              }}>
                {tier === 'pro'
                  ? isTrialing
                    ? `Trial aktivní do ${trialEndsAt?.toLocaleDateString('cs-CZ')}`
                    : `Předplatné aktivní`
                  : 'Bezplatný plán'}
              </p>
            </div>

            <div>
              {tier === 'free' ? (
                <button
                  onClick={handleUpgrade}
                  disabled={actionLoading}
                  style={{
                    padding: '14px 28px',
                    background: 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: '700',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                    opacity: actionLoading ? 0.7 : 1
                  }}
                >
                  {actionLoading ? '⏳' : '🚀'} Upgradovat na PRO
                </button>
              ) : (
                <button
                  onClick={handleManageSubscription}
                  disabled={actionLoading}
                  style={{
                    padding: '14px 28px',
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    opacity: actionLoading ? 0.7 : 1
                  }}
                >
                  {actionLoading ? '⏳' : '⚙️'} Spravovat předplatné
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Usage Statistics */}
        <div style={{
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '20px',
          padding: '40px',
          marginBottom: '30px'
        }}>
          <h3 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '30px' }}>
            📈 Použití tento měsíc
          </h3>

          {/* Analyses Used */}
          <div style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ color: '#94a3b8', fontSize: '14px' }}>Počet analýz</span>
              <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>
                {usage.analyses_count} / {limits.analysesPerMonth === Infinity ? '∞' : limits.analysesPerMonth}
              </span>
            </div>
            {limits.analysesPerMonth !== Infinity && (
              <div style={{
                width: '100%',
                height: '10px',
                background: '#0f172a',
                borderRadius: '10px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${usagePercent}%`,
                  height: '100%',
                  background: usagePercent > 80
                    ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                    : 'linear-gradient(90deg, #10b981 0%, #0ea5e9 100%)',
                  transition: 'width 0.3s'
                }} />
              </div>
            )}
          </div>

          {/* Rows Processed */}
          <div style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ color: '#94a3b8', fontSize: '14px' }}>Řádků zpracováno</span>
              <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>
                {usage.total_rows_processed?.toLocaleString() || 0}
              </span>
            </div>
          </div>

          {/* Reset Info */}
          <div style={{
            padding: '15px',
            background: '#0f172a',
            borderRadius: '10px',
            border: '1px solid #334155'
          }}>
            <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
              ⏰ Limity se resetují za <strong style={{ color: '#0ea5e9' }}>{daysUntilReset} {daysUntilReset === 1 ? 'den' : 'dní'}</strong>
            </p>
          </div>
        </div>

        {/* Features Comparison */}
        {tier === 'free' && (
          <div style={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '20px',
            padding: '40px'
          }}>
            <h3 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '20px', textAlign: 'center' }}>
              🚀 Co získáte s PRO?
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              {[
                { icon: '∞', title: 'Neomezené analýzy', desc: 'Analyzujte kolikrát chcete' },
                { icon: '📊', title: 'Neomezené řádky', desc: 'Žádné limity na velikost dat' },
                { icon: '🎁', title: '14 dní zdarma', desc: 'Vyzkoušejte bez závazků' },
                { icon: '📄', title: 'PDF + PPT export', desc: 'Profesionální reporty' }
              ].map((feature, idx) => (
                <div key={idx} style={{
                  padding: '20px',
                  background: '#0f172a',
                  borderRadius: '12px',
                  textAlign: 'center',
                  border: '1px solid #334155'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>{feature.icon}</div>
                  <h4 style={{ color: 'white', fontSize: '16px', marginBottom: '8px' }}>{feature.title}</h4>
                  <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>{feature.desc}</p>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={handleUpgrade}
                disabled={actionLoading}
                style={{
                  padding: '16px 40px',
                  background: 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: '700',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
                  opacity: actionLoading ? 0.7 : 1
                }}
              >
                {actionLoading ? '⏳ Načítám...' : '🚀 Upgradovat za €29/měsíc'}
              </button>
              <p style={{ color: '#64748b', fontSize: '13px', marginTop: '15px' }}>
                ✓ Zrušit kdykoliv | ✓ Bez závazků | ✓ Bezpečné platby
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
