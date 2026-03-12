"use client";

import { useState, useEffect, useRef } from 'react';
import demoData from '../../public/demo-report.json';

const t = {
  en: {
    label: "SEE IT IN ACTION",
    headline: "Here's what DataPalo finds in a sales spreadsheet.",
    sub: "Real analysis. Real insights. In seconds — not hours.",
    chartTitle: "Revenue by Category",
    insightsTitle: "AI Insights",
    exaLabel: "POWERED BY EXA NEURAL SEARCH",
    benchTitle: "Industry Benchmarks",
    benchYou: "Yours",
    benchInd: "Industry",
    benchVerdict: "Verdict",
    trendsTitle: "Market Trends",
    sourcesTitle: "Cited Sources",
    cta: "Try With Your Own Data",
    proBadge: "PRO",
    severity: { high: "Action needed", medium: "Opportunity", low: "Insight" },
  },
  cz: {
    label: "PODÍVEJTE SE",
    headline: "Tady je, co DataPalo najde v prodejní tabulce.",
    sub: "Skutečná analýza. Skutečné poznatky. Za vteřiny — ne hodiny.",
    chartTitle: "Tržby podle kategorie",
    insightsTitle: "AI poznatky",
    exaLabel: "POHÁNĚNO EXA NEURAL SEARCH",
    benchTitle: "Oborové benchmarky",
    benchYou: "Vaše",
    benchInd: "Odvětví",
    benchVerdict: "Hodnocení",
    trendsTitle: "Tržní trendy",
    sourcesTitle: "Citované zdroje",
    cta: "Zkuste se svými daty",
    proBadge: "PRO",
    severity: { high: "Vyžaduje akci", medium: "Příležitost", low: "Poznatek" },
  },
};

const severityColor = { high: "#EF4444", medium: "#F59E0B", low: "#22C55E" };

export default function DemoReportPreview({ language = 'en' }) {
  const lang = language === 'cz' ? 'cz' : 'en';
  const s = t[lang];
  const [visible, setVisible] = useState(false);
  const [chartAnimated, setChartAnimated] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          setTimeout(() => setChartAnimated(true), 400);
        }
      },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const maxVal = Math.max(...demoData.chart.data.map(d => d.value));

  return (
    <>
      <style jsx>{`
        @keyframes demoFadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes barGrow {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @keyframes shimmerBorder {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        .demo-section {
          opacity: 0;
          transform: translateY(48px);
          transition: opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1), transform 0.9s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .demo-section.demo-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .demo-card {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          transition: all 0.4s ease;
        }
        .demo-card:hover {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.1);
          transform: translateY(-2px);
        }
        .metric-card {
          padding: 28px 24px;
          flex: 1;
          min-width: 140px;
        }
        .exa-glow {
          position: absolute;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(161, 197, 10, 0.06) 0%, rgba(63, 81, 181, 0.04) 40%, transparent 70%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          filter: blur(60px);
          pointer-events: none;
          animation: glowPulse 6s ease-in-out infinite;
        }
        .exa-wrapper {
          position: relative;
          border-radius: 24px;
          padding: 2px;
          background: linear-gradient(135deg, #E06792, #3F51B5, #A1C50A, #E06792);
          background-size: 300% 300%;
          animation: shimmerBorder 8s linear infinite;
        }
        .exa-inner {
          background: linear-gradient(165deg, rgba(10, 10, 30, 0.97) 0%, rgba(15, 15, 40, 0.98) 100%);
          border-radius: 22px;
          padding: 44px 40px;
          position: relative;
          overflow: hidden;
        }
        .bench-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }
        .bench-table th {
          font-size: 0.65rem;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.25);
          padding: 0 0 14px 0;
          text-align: left;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .bench-table td {
          padding: 14px 0;
          font-size: 0.9rem;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .demo-cta-btn {
          padding: 20px 52px;
          font-size: 1.05rem;
          font-weight: 700;
          font-family: 'Satoshi', sans-serif;
          background: linear-gradient(135deg, #E06792 0%, #CF5585 50%, #3F51B5 100%);
          color: white;
          border: none;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 12px 40px rgba(224, 103, 146, 0.18), 0 4px 16px rgba(63, 81, 181, 0.08);
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }
        .demo-cta-btn:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 24px 64px rgba(224, 103, 146, 0.35), 0 8px 24px rgba(63, 81, 181, 0.2);
        }

        @media (max-width: 768px) {
          .demo-metrics-row {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
          }
          .demo-mid-row { flex-direction: column !important; }
          .exa-content-row { flex-direction: column !important; gap: 24px !important; }
          .exa-inner { padding: 28px 18px !important; }
          .metric-card { min-width: 0 !important; padding: 20px 16px !important; }
          .demo-cta-btn { width: 100% !important; justify-content: center !important; }
          .demo-section-inner { padding: 0 16px !important; }
          .bench-table td, .bench-table th { font-size: 0.72rem !important; padding: 10px 4px !important; }
          .bench-table th:first-child, .bench-table td:first-child { padding-left: 0 !important; }
        }
      `}</style>

      <section
        ref={sectionRef}
        id="demo"
        className={`demo-section ${visible ? 'demo-visible' : ''}`}
        style={{
          padding: "60px 40px 120px",
          maxWidth: "1060px",
          margin: "0 auto",
          position: "relative",
          zIndex: 5,
        }}
      >
        <div className="demo-section-inner">
          {/* Section label */}
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <span style={{
              fontSize: "0.7rem",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: "500",
              color: "rgba(161, 197, 10, 0.5)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              display: "block",
              marginBottom: "24px",
            }}>{s.label}</span>

            <h2 style={{
              fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontWeight: "400",
              lineHeight: "1.2",
              letterSpacing: "-0.02em",
              color: "rgba(255,255,255,0.88)",
              marginBottom: "12px",
            }}>{s.headline}</h2>

            <p style={{
              fontSize: "1rem",
              color: "rgba(255,255,255,0.3)",
              lineHeight: "1.6",
              maxWidth: "420px",
              margin: "0 auto",
            }}>{s.sub}</p>
          </div>

          {/* ── METRICS ROW ── */}
          <div className="demo-metrics-row" style={{
            display: "flex",
            gap: "14px",
            marginBottom: "16px",
          }}>
            {demoData.metrics.map((m, i) => (
              <div
                key={i}
                className="demo-card metric-card"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(20px)',
                  transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.1 + i * 0.1}s`,
                }}
              >
                <div style={{
                  fontSize: "0.65rem",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: "500",
                  color: "rgba(255,255,255,0.25)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: "12px",
                }}>{m.label}</div>
                <div style={{
                  fontSize: "1.5rem",
                  fontWeight: "800",
                  color: "rgba(255,255,255,0.92)",
                  fontFamily: "'Satoshi', sans-serif",
                  letterSpacing: "-0.02em",
                  marginBottom: "6px",
                }}>{m.value}</div>
                <div style={{
                  fontSize: "0.75rem",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: "500",
                  color: "#A1C50A",
                  letterSpacing: "0.05em",
                }}>
                  {m.trend.startsWith('+') || m.trend.startsWith('↑') || m.trend === 'accelerating'
                    ? '↑ ' : ''}{m.trend}
                </div>
              </div>
            ))}
          </div>

          {/* ── CHART + INSIGHTS ROW ── */}
          <div className="demo-mid-row" style={{
            display: "flex",
            gap: "14px",
            marginBottom: "16px",
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.5s',
          }}>
            {/* Bar Chart */}
            <div className="demo-card" style={{ flex: "1.2", padding: "32px 28px" }}>
              <div style={{
                fontSize: "0.65rem",
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: "500",
                color: "rgba(255,255,255,0.25)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: "28px",
              }}>{s.chartTitle}</div>

              <div style={{
                display: "flex",
                alignItems: "flex-end",
                gap: "16px",
                height: "160px",
                padding: "0 8px",
              }}>
                {demoData.chart.data.map((bar, i) => {
                  const pct = (bar.value / maxVal) * 100;
                  return (
                    <div key={i} style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      height: "100%",
                      justifyContent: "flex-end",
                    }}>
                      <div style={{
                        fontSize: "0.7rem",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: "500",
                        color: "rgba(255,255,255,0.35)",
                        marginBottom: "8px",
                      }}>
                        ${(bar.value / 1000).toFixed(0)}k
                      </div>
                      <div style={{
                        width: "100%",
                        maxWidth: "52px",
                        height: chartAnimated ? `${pct}%` : "0%",
                        background: `linear-gradient(180deg, ${bar.color} 0%, ${bar.color}88 100%)`,
                        borderRadius: "8px 8px 4px 4px",
                        transition: `height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.6 + i * 0.15}s`,
                        position: "relative",
                      }}>
                        <div style={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: "inherit",
                          background: "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 60%)",
                        }} />
                      </div>
                      <div style={{
                        fontSize: "0.6rem",
                        fontFamily: "'JetBrains Mono', monospace",
                        color: "rgba(255,255,255,0.2)",
                        marginTop: "10px",
                        textAlign: "center",
                        letterSpacing: "0.03em",
                      }}>{bar.name}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Insights */}
            <div className="demo-card" style={{ flex: "1", padding: "32px 28px" }}>
              <div style={{
                fontSize: "0.65rem",
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: "500",
                color: "rgba(255,255,255,0.25)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: "24px",
              }}>{s.insightsTitle}</div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {demoData.insights.map((insight, i) => (
                  <div key={i} style={{
                    display: "flex",
                    gap: "14px",
                    alignItems: "flex-start",
                  }}>
                    <div style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: severityColor[insight.severity],
                      marginTop: "6px",
                      flexShrink: 0,
                      boxShadow: `0 0 8px ${severityColor[insight.severity]}44`,
                    }} />
                    <div>
                      <div style={{
                        fontSize: "0.6rem",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: "600",
                        color: severityColor[insight.severity],
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        marginBottom: "4px",
                        opacity: 0.7,
                      }}>{s.severity[insight.severity]}</div>
                      <div style={{
                        fontSize: "0.88rem",
                        color: "rgba(255,255,255,0.55)",
                        lineHeight: "1.5",
                      }}>{insight.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════ */}
          {/* ⭐ EXA RESEARCH SHOWCASE — THE CROWN JEWEL ⭐ */}
          {/* ══════════════════════════════════════════════ */}
          <div
            className="exa-wrapper"
            style={{
              marginBottom: "52px",
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(24px)',
              transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.75s',
            }}
          >
            <div className="exa-inner">
              {/* Glow orb */}
              <div className="exa-glow" />

              {/* Header bar */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                marginBottom: "36px",
                position: "relative",
                zIndex: 2,
                flexWrap: "wrap",
              }}>
                <span style={{
                  fontSize: "0.6rem",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: "700",
                  letterSpacing: "0.15em",
                  color: "#080818",
                  background: "linear-gradient(135deg, #A1C50A, #8BAF09)",
                  padding: "5px 14px",
                  borderRadius: "6px",
                  textTransform: "uppercase",
                  boxShadow: "0 0 20px rgba(161, 197, 10, 0.3)",
                }}>{s.proBadge}</span>
                <span style={{
                  fontSize: "0.65rem",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: "500",
                  color: "rgba(161, 197, 10, 0.55)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}>{s.exaLabel}</span>
              </div>

              {/* Content grid */}
              <div className="exa-content-row" style={{
                display: "flex",
                gap: "32px",
                position: "relative",
                zIndex: 2,
              }}>
                {/* Left: Benchmarks */}
                <div style={{ flex: "1.1" }}>
                  <div style={{
                    fontSize: "0.65rem",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: "600",
                    color: "rgba(63, 81, 181, 0.7)",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    marginBottom: "18px",
                  }}>{s.benchTitle}</div>

                  <table className="bench-table">
                    <thead>
                      <tr>
                        <th style={{ width: "35%" }}></th>
                        <th style={{ textAlign: "center" }}>{s.benchYou}</th>
                        <th style={{ textAlign: "center" }}>{s.benchInd}</th>
                        <th style={{ textAlign: "right" }}>{s.benchVerdict}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {demoData.exaResearch.benchmarks.map((b, i) => (
                        <tr key={i}>
                          <td style={{
                            color: "rgba(255,255,255,0.4)",
                            fontSize: "0.85rem",
                          }}>{b.metric}</td>
                          <td style={{
                            textAlign: "center",
                            color: "rgba(255,255,255,0.8)",
                            fontFamily: "'JetBrains Mono', monospace",
                            fontWeight: "600",
                            fontSize: "0.85rem",
                          }}>{b.yours}</td>
                          <td style={{
                            textAlign: "center",
                            color: "rgba(255,255,255,0.3)",
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: "0.85rem",
                          }}>{b.industry}</td>
                          <td style={{
                            textAlign: "right",
                            fontSize: "0.75rem",
                            fontFamily: "'JetBrains Mono', monospace",
                            fontWeight: "600",
                            color: "#A1C50A",
                            letterSpacing: "0.03em",
                          }}>{b.verdict}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Right: Trends + Sources */}
                <div style={{ flex: "1" }}>
                  {/* Market Trends */}
                  <div style={{ marginBottom: "28px" }}>
                    <div style={{
                      fontSize: "0.65rem",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: "600",
                      color: "rgba(224, 103, 146, 0.7)",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      marginBottom: "16px",
                    }}>{s.trendsTitle}</div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {demoData.exaResearch.marketTrends.map((trend, i) => (
                        <div key={i} style={{
                          display: "flex",
                          gap: "10px",
                          alignItems: "flex-start",
                        }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginTop: "3px", flexShrink: 0 }}>
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="#3F51B5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
                          </svg>
                          <span style={{
                            fontSize: "0.85rem",
                            color: "rgba(255,255,255,0.45)",
                            lineHeight: "1.5",
                          }}>{trend}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cited Sources */}
                  <div>
                    <div style={{
                      fontSize: "0.65rem",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: "600",
                      color: "rgba(161, 197, 10, 0.6)",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      marginBottom: "12px",
                    }}>{s.sourcesTitle}</div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {demoData.exaResearch.sources.map((src, i) => (
                        <div key={i} style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="#A1C50A" strokeWidth="1.5" opacity="0.4" />
                            <polyline points="14 2 14 8 20 8" stroke="#A1C50A" strokeWidth="1.5" opacity="0.4" />
                          </svg>
                          <span style={{
                            fontSize: "0.8rem",
                            color: "rgba(255,255,255,0.4)",
                          }}>
                            {src.title}
                            <span style={{
                              fontSize: "0.65rem",
                              color: "rgba(255,255,255,0.2)",
                              marginLeft: "6px",
                              fontFamily: "'JetBrains Mono', monospace",
                            }}>— {src.publisher}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── CTA ── */}
          <div style={{
            textAlign: "center",
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(16px)',
            transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.95s',
          }}>
            <button
              className="demo-cta-btn"
              onClick={() => window.location.href = '/datapalo'}
            >
              {s.cta}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
