"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from './lib/auth-context';
import AuthModal from './components/AuthModal';

export default function DataPaloLanding() {
  const [language, setLanguage] = useState('en');
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [visibleSections, setVisibleSections] = useState({});
  const [showAuth, setShowAuth] = useState(false);
  const { user, signOut } = useAuth();
  const sectionRefs = useRef({});

  useEffect(() => {
    setMounted(true);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );

    const ids = ['problem', 'solution', 'features', 'raa', 'usecases', 'trust', 'final-cta'];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const content = {
    en: {
      // Hero
      headline1: "Your numbers,",
      headline2: "finally explained.",
      sub: "Drop any spreadsheet. Get clarity in seconds — not hours.",
      cta: "Try DataPalo Free",
      // Trust bar
      trust1: "GDPR",
      trust2: "No data stored",
      trust3: "Made in EU",
      powered: "Powered by EXA Research AI",
      // Problem
      problemLabel: "THE PROBLEM",
      problemH: "You have the data. You just don't have time.",
      problemP: "Every SME owner has that one spreadsheet they're afraid to open. Numbers that should tell a story — but don't. Hours lost formatting, pivoting, squinting at rows that blur together.",
      // Solution
      solutionLabel: "THE SOLUTION",
      solutionH: "A friend who speaks spreadsheet.",
      solutionP: "DataPalo reads your data and tells you what matters. No setup. No formulas. No consultants. Just upload and understand.",
      solutionStep1t: "Drop your file",
      solutionStep1d: "XLSX, CSV — anything goes",
      solutionStep2t: "DataPalo reads it",
      solutionStep2d: "AI finds patterns you'd miss",
      solutionStep3t: "Get answers",
      solutionStep3d: "Charts, summaries, action items",
      // Features
      featuresLabel: "WHAT YOU GET",
      feat1t: "Instant dashboards",
      feat1d: "Beautiful charts generated from raw data. No drag-and-drop builder needed.",
      feat2t: "Plain-English insights",
      feat2d: "\"Your margins dropped 12% in Q3\" — not a formula, a sentence.",
      feat3t: "Export-ready reports",
      feat3d: "PDF reports you can send to your accountant, your partner, your board.",
      // Research-Augmented Analysis (USP)
      raaLabel: "THE GAME CHANGER",
      raaH: "Your data + the world's knowledge.",
      raaSub: "Research-Augmented Analysis isn't just another AI report. It connects your numbers to live market intelligence — benchmarks, trends, and real citations from the world's research.",
      raaBadge: "PRO",
      raaBadgeNote: "Launching April 1, 2026",
      raaFeat1: "Industry Benchmarks — see how your numbers compare",
      raaFeat2: "Market Trends — context from the latest research",
      raaFeat3: "External Research — real sources, real citations",
      raaFeat4: "5 live insights from Exa neural search",
      raaCta: "This is your data, supercharged.",
      // Use Cases
      usecasesLabel: "BUILT FOR REAL WORK",
      uc1t: "Cash Flow Clarity",
      uc1d: "See exactly when money comes in and goes out. Spot gaps before they become emergencies.",
      uc2t: "Margin Intelligence",
      uc2d: "Know which products earn and which ones bleed. Make pricing decisions with confidence.",
      uc3t: "Inventory Insight",
      uc3d: "Understand what moves, what sits, and what to reorder — without counting boxes.",
      // Trust
      trustLabel: "YOUR DATA IS SACRED",
      trustH: "We never store your files.",
      trustP: "Your spreadsheet is analyzed in memory and discarded. No databases. No copies. No traces. GDPR-compliant by design, built and hosted in the EU.",
      // Final CTA
      finalH: "Stop guessing. Start knowing.",
      finalSub: "Your spreadsheet already has the answers. DataPalo just reads them for you.",
      finalCta: "Try DataPalo Free",
      // Footer
      tagline: "The friend who understands your numbers.",
    },
    cz: {
      headline1: "Vaše čísla,",
      headline2: "konečně vysvětlena.",
      sub: "Nahrajte jakoukoli tabulku. Získejte jasno za vteřiny — ne hodiny.",
      cta: "Vyzkoušet DataPalo zdarma",
      trust1: "GDPR",
      trust2: "Žádná data neuložena",
      trust3: "Vyrobeno v EU",
      powered: "Poháněno EXA Research AI",
      problemLabel: "PROBLÉM",
      problemH: "Máte data. Jen na ně nemáte čas.",
      problemP: "Každý majitel firmy má tu jednu tabulku, kterou se bojí otevřít. Čísla, která by měla vyprávět příběh — ale nevypráví. Hodiny ztracené formátováním a zíráním na řádky, které se slévají dohromady.",
      solutionLabel: "ŘEŠENÍ",
      solutionH: "Přítel, který rozumí tabulkám.",
      solutionP: "DataPalo přečte vaše data a řekne vám, na čem záleží. Žádné nastavování. Žádné vzorce. Žádní konzultanti. Prostě nahrajte a pochopte.",
      solutionStep1t: "Nahrajte soubor",
      solutionStep1d: "XLSX, CSV — cokoliv",
      solutionStep2t: "DataPalo ho přečte",
      solutionStep2d: "AI najde vzory, které byste přehlédli",
      solutionStep3t: "Získejte odpovědi",
      solutionStep3d: "Grafy, shrnutí, akční kroky",
      featuresLabel: "CO ZÍSKÁTE",
      feat1t: "Okamžité dashboardy",
      feat1d: "Krásné grafy vygenerované ze surových dat. Žádný drag-and-drop.",
      feat2t: "Poznatky v češtině",
      feat2d: "\"Vaše marže klesly o 12% v Q3\" — ne vzorec, ale věta.",
      feat3t: "Reporty připravené k exportu",
      feat3d: "PDF reporty, které můžete poslat účetní, partnerovi nebo vedení.",
      raaLabel: "PRŮLOM",
      raaH: "Vaše data + znalosti celého světa.",
      raaSub: "Research-Augmented Analysis není jen další AI report. Propojuje vaše čísla s živou tržní inteligencí — benchmarky, trendy a reálné citace z výzkumů celého světa.",
      raaBadge: "PRO",
      raaBadgeNote: "Spuštění 1. dubna 2026",
      raaFeat1: "Oborové benchmarky — srovnejte svá čísla s trhem",
      raaFeat2: "Tržní trendy — kontext z nejnovějšího výzkumu",
      raaFeat3: "Externí výzkum — reálné zdroje, reálné citace",
      raaFeat4: "5 živých poznatků z Exa neural search",
      raaCta: "Vaše data, supercharged.",
      usecasesLabel: "PRO SKUTEČNOU PRÁCI",
      uc1t: "Jasnost cash flow",
      uc1d: "Přesně vizte, kdy peníze přicházejí a odcházejí. Odhalte mezery dříve, než se stanou krizí.",
      uc2t: "Inteligence marží",
      uc2d: "Zjistěte, které produkty vydělávají a které krvácejí. Rozhodujte se o cenách s jistotou.",
      uc3t: "Přehled o zásobách",
      uc3d: "Pochopte, co se prodává, co leží a co objednat — bez počítání krabic.",
      trustLabel: "VAŠE DATA JSOU POSVÁTNÁ",
      trustH: "Vaše soubory nikdy neukládáme.",
      trustP: "Vaše tabulka je analyzována v paměti a smazána. Žádné databáze. Žádné kopie. Žádné stopy. GDPR od návrhu, postaveno a hostováno v EU.",
      finalH: "Přestaňte hádat. Začněte vědět.",
      finalSub: "Vaše tabulka už obsahuje odpovědi. DataPalo je jen přečte za vás.",
      finalCta: "Vyzkoušet DataPalo zdarma",
      tagline: "Přítel, který rozumí vašim číslům.",
    },
  };

  const t = content[language];

  const vis = (id) => visibleSections[id];

  return (
    <>
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Satoshi:wght@300;400;500;700;900&family=JetBrains+Mono:wght@400;500&display=swap');

        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-15px, 15px) scale(0.97); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-25px, 25px) scale(0.96); }
          66% { transform: translate(20px, -10px) scale(1.04); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(15px, -30px) scale(1.08); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(36px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes revealLine {
          from { width: 0; }
          to { width: 100%; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }

        .landing-root * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
          will-change: transform;
        }
        .orb-1 {
          width: 650px; height: 650px;
          background: radial-gradient(circle, rgba(63, 81, 181, 0.16) 0%, transparent 70%);
          top: -12%; left: -8%;
          animation: float1 22s ease-in-out infinite;
        }
        .orb-2 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(224, 103, 146, 0.12) 0%, transparent 70%);
          top: 18%; right: -10%;
          animation: float2 27s ease-in-out infinite;
        }
        .orb-3 {
          width: 420px; height: 420px;
          background: radial-gradient(circle, rgba(161, 197, 10, 0.08) 0%, transparent 70%);
          bottom: 8%; left: 25%;
          animation: float3 19s ease-in-out infinite;
        }

        .anim-1 { animation: fadeUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: 0.1s; }
        .anim-2 { animation: fadeUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: 0.3s; }
        .anim-3 { animation: fadeUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: 0.5s; }
        .anim-4 { animation: fadeUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: 0.7s; }
        .anim-5 { animation: fadeUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) both; animation-delay: 0.85s; }

        .section-reveal {
          opacity: 0;
          transform: translateY(48px);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .section-reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .step-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          padding: 36px 28px;
          text-align: center;
          transition: all 0.4s ease;
          flex: 1;
          min-width: 200px;
        }
        .step-card:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(63, 81, 181, 0.2);
          transform: translateY(-4px);
        }

        .feature-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 20px;
          padding: 40px 32px;
          transition: all 0.4s ease;
          flex: 1;
          min-width: 260px;
        }
        .feature-card:hover {
          background: rgba(255,255,255,0.04);
          border-color: rgba(224, 103, 146, 0.15);
        }

        .usecase-card {
          background: linear-gradient(135deg, rgba(63, 81, 181, 0.06) 0%, rgba(224, 103, 146, 0.04) 100%);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 24px;
          padding: 44px 36px;
          flex: 1;
          min-width: 280px;
          transition: all 0.4s ease;
          position: relative;
          overflow: hidden;
        }
        .usecase-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(161, 197, 10, 0.4), transparent);
          opacity: 0;
          transition: opacity 0.4s ease;
        }
        .usecase-card:hover::before {
          opacity: 1;
        }
        .usecase-card:hover {
          border-color: rgba(161, 197, 10, 0.15);
          transform: translateY(-3px);
        }

        .raa-card {
          position: relative;
          background: linear-gradient(165deg, rgba(63, 81, 181, 0.08) 0%, rgba(224, 103, 146, 0.05) 50%, rgba(161, 197, 10, 0.04) 100%);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 28px;
          padding: 56px 48px;
          max-width: 700px;
          margin: 0 auto;
          overflow: hidden;
        }
        .raa-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #E06792, #3F51B5, #A1C50A);
          opacity: 0.6;
        }
        .raa-card::after {
          content: '';
          position: absolute;
          top: -100px;
          right: -100px;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(63, 81, 181, 0.08) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .raa-check {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 16px;
        }

        @media (max-width: 768px) {
          .hero-h1 { font-size: 2.6rem !important; }
          .hero-h1-accent { font-size: 2.6rem !important; }
          .hero-sub { font-size: 1.05rem !important; }
          .cta-btn { width: 100% !important; justify-content: center !important; }
          .cards-row { flex-direction: column !important; }
          .section-inner { padding: 0 24px !important; }
          .raa-card { padding: 40px 28px !important; }
        }
      `}</style>

      <div className="landing-root" style={{
        background: "linear-gradient(168deg, #080818 0%, #0D0D2B 35%, #111133 65%, #0E0E28 100%)",
        fontFamily: "'Satoshi', -apple-system, BlinkMacSystemFont, sans-serif",
        color: "white",
        position: "relative",
        overflow: "hidden",
      }}>

        {/* === LIVING ORBS === */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        {/* ============================================ */}
        {/* NAV */}
        {/* ============================================ */}
        <nav className={mounted ? 'anim-1' : ''} style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "28px 40px",
          maxWidth: "1200px",
          width: "100%",
          margin: "0 auto",
          position: "relative",
          zIndex: 10,
        }}>
          <div style={{
            fontSize: "1.4rem",
            fontWeight: "900",
            letterSpacing: "-0.03em",
            display: "flex",
            alignItems: "center",
            gap: "0",
          }}>
            <span style={{ color: "#E06792" }}>Data</span>
            <span style={{ color: "rgba(255,255,255,0.92)" }}>Palo</span>
          </div>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}>
            {/* Language switcher */}
            <div style={{
              display: "flex",
              gap: "4px",
              fontSize: "0.75rem",
              fontWeight: "500",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.06em",
            }}>
              {['en', 'cz'].map((lang) => (
                <span
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  style={{
                    cursor: "pointer",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    color: language === lang ? "white" : "rgba(255,255,255,0.3)",
                    background: language === lang ? "rgba(224, 103, 146, 0.15)" : "transparent",
                    border: language === lang ? "1px solid rgba(224, 103, 146, 0.25)" : "1px solid transparent",
                    transition: "all 0.3s ease",
                    textTransform: "uppercase",
                  }}
                >{lang}</span>
              ))}
            </div>

            {/* Pricing link */}
            <a
              href="/pricing"
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: "0.875rem",
                fontWeight: "500",
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => e.target.style.color = "white"}
              onMouseLeave={(e) => e.target.style.color = "rgba(255,255,255,0.7)"}
            >
              {language === 'cz' ? 'Ceník' : 'Pricing'}
            </a>

            {/* Sign In / User menu */}
            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <a
                  href="/datapalo"
                  style={{
                    padding: "8px 18px",
                    background: "linear-gradient(135deg, #E06792 0%, #A855F7 100%)",
                    color: "white",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    textDecoration: "none",
                    transition: "opacity 0.2s ease",
                  }}
                  onMouseEnter={(e) => e.target.style.opacity = "0.85"}
                  onMouseLeave={(e) => e.target.style.opacity = "1"}
                >
                  {language === 'cz' ? 'Analyzovat' : 'Analyze'}
                </a>
                <button
                  onClick={signOut}
                  style={{
                    background: "none",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.6)",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.3)"; e.target.style.color = "white"; }}
                  onMouseLeave={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.15)"; e.target.style.color = "rgba(255,255,255,0.6)"; }}
                >
                  {language === 'cz' ? 'Odhlásit' : 'Sign Out'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                style={{
                  padding: "8px 20px",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "white",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => { e.target.style.background = "rgba(255,255,255,0.12)"; e.target.style.borderColor = "rgba(255,255,255,0.25)"; }}
                onMouseLeave={(e) => { e.target.style.background = "rgba(255,255,255,0.08)"; e.target.style.borderColor = "rgba(255,255,255,0.15)"; }}
              >
                {language === 'cz' ? 'Přihlásit se' : 'Sign In'}
              </button>
            )}
          </div>
        </nav>

        {/* ============================================ */}
        {/* HERO */}
        {/* ============================================ */}
        <section style={{
          minHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 40px 80px",
          maxWidth: "900px",
          margin: "0 auto",
          textAlign: "center",
          position: "relative",
          zIndex: 5,
        }}>
          <h1 className={`hero-h1 ${mounted ? 'anim-2' : ''}`} style={{
            fontSize: "clamp(2.8rem, 6.5vw, 4.8rem)",
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontWeight: "400",
            lineHeight: "1.05",
            letterSpacing: "-0.02em",
            marginBottom: "4px",
            color: "rgba(255,255,255,0.88)",
          }}>
            {t.headline1}
          </h1>

          <h1 className={`hero-h1-accent ${mounted ? 'anim-2' : ''}`} style={{
            fontSize: "clamp(2.8rem, 6.5vw, 4.8rem)",
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontWeight: "400",
            lineHeight: "1.05",
            letterSpacing: "-0.02em",
            marginBottom: "36px",
            background: "linear-gradient(135deg, #E06792 0%, #3F51B5 55%, #A1C50A 100%)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            animation: "shimmer 8s linear infinite",
          }}>
            {t.headline2}
          </h1>

          <p className={`hero-sub ${mounted ? 'anim-3' : ''}`} style={{
            fontSize: "1.2rem",
            fontWeight: "400",
            color: "rgba(255,255,255,0.4)",
            marginBottom: "52px",
            lineHeight: "1.7",
            maxWidth: "480px",
            letterSpacing: "0.01em",
          }}>
            {t.sub}
          </p>

          <button
            className={`cta-btn ${mounted ? 'anim-4' : ''}`}
            onClick={() => window.location.href = '/datapalo'}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
              padding: "20px 56px",
              fontSize: "1.05rem",
              fontWeight: "700",
              fontFamily: "'Satoshi', sans-serif",
              letterSpacing: "0.01em",
              background: hovered
                ? "linear-gradient(135deg, #E06792 0%, #D4568A 50%, #C0467E 100%)"
                : "linear-gradient(135deg, #E06792 0%, #CF5585 50%, #3F51B5 100%)",
              color: "white",
              border: "none",
              borderRadius: "16px",
              cursor: "pointer",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              transform: hovered ? "translateY(-3px) scale(1.02)" : "translateY(0) scale(1)",
              boxShadow: hovered
                ? "0 24px 64px rgba(224, 103, 146, 0.35), 0 8px 24px rgba(63, 81, 181, 0.2)"
                : "0 12px 40px rgba(224, 103, 146, 0.18), 0 4px 16px rgba(63, 81, 181, 0.08)",
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "56px",
              width: "fit-content",
              margin: "0 auto 56px",
            }}
          >
            {t.cta}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>

          {/* Trust badges */}
          <div className={mounted ? 'anim-5' : ''} style={{
            display: "flex",
            gap: "32px",
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: "24px",
          }}>
            {[t.trust1, t.trust2, t.trust3].map((item, i) => (
              <span key={i} style={{
                fontSize: "0.72rem",
                fontWeight: "500",
                fontFamily: "'JetBrains Mono', monospace",
                color: "rgba(255,255,255,0.2)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: "7px",
              }}>
                <span style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: "#A1C50A",
                  display: "inline-block",
                  opacity: 0.5,
                }} />
                {item}
              </span>
            ))}
          </div>

          <div className={mounted ? 'anim-5' : ''} style={{
            fontSize: "0.7rem",
            fontWeight: "500",
            fontFamily: "'JetBrains Mono', monospace",
            color: "rgba(161, 197, 10, 0.28)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}>
            {t.powered}
          </div>
        </section>

        {/* ============================================ */}
        {/* PROBLEM */}
        {/* ============================================ */}
        <section
          id="problem"
          className={`section-reveal ${vis('problem') ? 'visible' : ''}`}
          style={{
            padding: "120px 40px",
            maxWidth: "800px",
            margin: "0 auto",
            textAlign: "center",
            position: "relative",
            zIndex: 5,
          }}
        >
          <span style={{
            fontSize: "0.7rem",
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: "500",
            color: "rgba(224, 103, 146, 0.5)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginBottom: "24px",
            display: "block",
          }}>{t.problemLabel}</span>

          <h2 style={{
            fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontWeight: "400",
            lineHeight: "1.15",
            letterSpacing: "-0.02em",
            color: "rgba(255,255,255,0.88)",
            marginBottom: "28px",
          }}>{t.problemH}</h2>

          <p style={{
            fontSize: "1.1rem",
            lineHeight: "1.8",
            color: "rgba(255,255,255,0.35)",
            maxWidth: "600px",
            margin: "0 auto",
          }}>{t.problemP}</p>
        </section>

        {/* === Divider === */}
        <div style={{
          width: "60px",
          height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)",
          margin: "0 auto",
        }} />

        {/* ============================================ */}
        {/* SOLUTION */}
        {/* ============================================ */}
        <section
          id="solution"
          className={`section-reveal ${vis('solution') ? 'visible' : ''}`}
          style={{
            padding: "120px 40px",
            maxWidth: "1000px",
            margin: "0 auto",
            textAlign: "center",
            position: "relative",
            zIndex: 5,
          }}
        >
          <span style={{
            fontSize: "0.7rem",
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: "500",
            color: "rgba(63, 81, 181, 0.55)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginBottom: "24px",
            display: "block",
          }}>{t.solutionLabel}</span>

          <h2 style={{
            fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontWeight: "400",
            lineHeight: "1.15",
            letterSpacing: "-0.02em",
            color: "rgba(255,255,255,0.88)",
            marginBottom: "20px",
          }}>{t.solutionH}</h2>

          <p style={{
            fontSize: "1.1rem",
            lineHeight: "1.8",
            color: "rgba(255,255,255,0.35)",
            maxWidth: "540px",
            margin: "0 auto 64px",
          }}>{t.solutionP}</p>

          {/* 3-step cards */}
          <div className="cards-row" style={{
            display: "flex",
            gap: "20px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}>
            {[
              { num: "01", t: t.solutionStep1t, d: t.solutionStep1d, color: "#E06792" },
              { num: "02", t: t.solutionStep2t, d: t.solutionStep2d, color: "#3F51B5" },
              { num: "03", t: t.solutionStep3t, d: t.solutionStep3d, color: "#A1C50A" },
            ].map((step, i) => (
              <div key={i} className="step-card">
                <div style={{
                  fontSize: "0.7rem",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: "500",
                  color: step.color,
                  opacity: 0.6,
                  letterSpacing: "0.15em",
                  marginBottom: "20px",
                }}>{step.num}</div>
                <div style={{
                  fontSize: "1.1rem",
                  fontWeight: "700",
                  color: "rgba(255,255,255,0.85)",
                  marginBottom: "10px",
                }}>{step.t}</div>
                <div style={{
                  fontSize: "0.9rem",
                  color: "rgba(255,255,255,0.3)",
                  lineHeight: "1.5",
                }}>{step.d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================ */}
        {/* FEATURES */}
        {/* ============================================ */}
        <section
          id="features"
          className={`section-reveal ${vis('features') ? 'visible' : ''}`}
          style={{
            padding: "120px 40px",
            maxWidth: "1000px",
            margin: "0 auto",
            position: "relative",
            zIndex: 5,
          }}
        >
          <span style={{
            fontSize: "0.7rem",
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: "500",
            color: "rgba(161, 197, 10, 0.5)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginBottom: "52px",
            display: "block",
            textAlign: "center",
          }}>{t.featuresLabel}</span>

          <div className="cards-row" style={{
            display: "flex",
            gap: "20px",
            flexWrap: "wrap",
          }}>
            {[
              { icon: "M3 3v18h18", t: t.feat1t, d: t.feat1d, accent: "#3F51B5" },
              { icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z", t: t.feat2t, d: t.feat2d, accent: "#E06792" },
              { icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", t: t.feat3t, d: t.feat3d, accent: "#A1C50A" },
            ].map((feat, i) => (
              <div key={i} className="feature-card">
                <div style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: `${feat.accent}11`,
                  border: `1px solid ${feat.accent}22`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "24px",
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={feat.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d={feat.icon} />
                  </svg>
                </div>
                <div style={{
                  fontSize: "1.15rem",
                  fontWeight: "700",
                  color: "rgba(255,255,255,0.88)",
                  marginBottom: "12px",
                }}>{feat.t}</div>
                <div style={{
                  fontSize: "0.95rem",
                  color: "rgba(255,255,255,0.32)",
                  lineHeight: "1.65",
                }}>{feat.d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================ */}
        {/* RESEARCH-AUGMENTED ANALYSIS (USP) */}
        {/* ============================================ */}
        <section
          id="raa"
          className={`section-reveal ${vis('raa') ? 'visible' : ''}`}
          style={{
            padding: "100px 40px 120px",
            maxWidth: "1000px",
            margin: "0 auto",
            position: "relative",
            zIndex: 5,
          }}
        >
          <span style={{
            fontSize: "0.7rem",
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: "500",
            color: "rgba(224, 103, 146, 0.55)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginBottom: "40px",
            display: "block",
            textAlign: "center",
          }}>{t.raaLabel}</span>

          <div className="raa-card">
            {/* PRO badge */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "28px",
              position: "relative",
              zIndex: 2,
            }}>
              <span style={{
                fontSize: "0.65rem",
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: "700",
                letterSpacing: "0.15em",
                color: "#080818",
                background: "linear-gradient(135deg, #A1C50A, #8BAF09)",
                padding: "5px 12px",
                borderRadius: "6px",
                textTransform: "uppercase",
              }}>{t.raaBadge}</span>
              <span style={{
                fontSize: "0.75rem",
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: "500",
                color: "rgba(161, 197, 10, 0.45)",
                letterSpacing: "0.06em",
              }}>{t.raaBadgeNote}</span>
            </div>

            {/* Headline */}
            <h2 style={{
              fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontWeight: "400",
              lineHeight: "1.15",
              letterSpacing: "-0.02em",
              color: "rgba(255,255,255,0.9)",
              marginBottom: "18px",
              position: "relative",
              zIndex: 2,
            }}>{t.raaH}</h2>

            <p style={{
              fontSize: "1.05rem",
              lineHeight: "1.75",
              color: "rgba(255,255,255,0.35)",
              marginBottom: "36px",
              maxWidth: "560px",
              position: "relative",
              zIndex: 2,
            }}>{t.raaSub}</p>

            {/* Feature checklist */}
            <div style={{ position: "relative", zIndex: 2, marginBottom: "32px" }}>
              {[t.raaFeat1, t.raaFeat2, t.raaFeat3, t.raaFeat4].map((feat, i) => (
                <div key={i} className="raa-check">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginTop: "2px", flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" stroke={i === 3 ? "#A1C50A" : "#3F51B5"} strokeWidth="1.5" opacity="0.4" />
                    <path d="M8 12l3 3 5-5" stroke={i === 3 ? "#A1C50A" : "#3F51B5"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{
                    fontSize: "0.95rem",
                    color: "rgba(255,255,255,0.55)",
                    lineHeight: "1.5",
                  }}>{feat}</span>
                </div>
              ))}
            </div>

            {/* Closing line */}
            <p style={{
              fontSize: "1rem",
              fontWeight: "600",
              color: "rgba(255,255,255,0.7)",
              fontStyle: "italic",
              fontFamily: "'Instrument Serif', Georgia, serif",
              letterSpacing: "0.01em",
              position: "relative",
              zIndex: 2,
            }}>{t.raaCta}</p>
          </div>
        </section>

        {/* ============================================ */}
        {/* USE CASES */}
        {/* ============================================ */}
        <section
          id="usecases"
          className={`section-reveal ${vis('usecases') ? 'visible' : ''}`}
          style={{
            padding: "120px 40px",
            maxWidth: "1080px",
            margin: "0 auto",
            position: "relative",
            zIndex: 5,
          }}
        >
          <span style={{
            fontSize: "0.7rem",
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: "500",
            color: "rgba(255,255,255,0.25)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginBottom: "52px",
            display: "block",
            textAlign: "center",
          }}>{t.usecasesLabel}</span>

          <div className="cards-row" style={{
            display: "flex",
            gap: "24px",
            flexWrap: "wrap",
          }}>
            {[
              { emoji: "💸", t: t.uc1t, d: t.uc1d },
              { emoji: "📊", t: t.uc2t, d: t.uc2d },
              { emoji: "📦", t: t.uc3t, d: t.uc3d },
            ].map((uc, i) => (
              <div key={i} className="usecase-card">
                <div style={{
                  fontSize: "2rem",
                  marginBottom: "20px",
                }}>{uc.emoji}</div>
                <div style={{
                  fontSize: "1.2rem",
                  fontWeight: "700",
                  color: "rgba(255,255,255,0.88)",
                  marginBottom: "14px",
                }}>{uc.t}</div>
                <div style={{
                  fontSize: "0.95rem",
                  color: "rgba(255,255,255,0.32)",
                  lineHeight: "1.7",
                }}>{uc.d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================ */}
        {/* TRUST */}
        {/* ============================================ */}
        <section
          id="trust"
          className={`section-reveal ${vis('trust') ? 'visible' : ''}`}
          style={{
            padding: "120px 40px",
            maxWidth: "700px",
            margin: "0 auto",
            textAlign: "center",
            position: "relative",
            zIndex: 5,
          }}
        >
          <span style={{
            fontSize: "0.7rem",
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: "500",
            color: "rgba(161, 197, 10, 0.45)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginBottom: "24px",
            display: "block",
          }}>{t.trustLabel}</span>

          <h2 style={{
            fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)",
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontWeight: "400",
            lineHeight: "1.2",
            letterSpacing: "-0.02em",
            color: "rgba(255,255,255,0.88)",
            marginBottom: "24px",
          }}>{t.trustH}</h2>

          <p style={{
            fontSize: "1.05rem",
            lineHeight: "1.8",
            color: "rgba(255,255,255,0.33)",
            maxWidth: "560px",
            margin: "0 auto",
          }}>{t.trustP}</p>

          {/* Shield icon */}
          <div style={{
            marginTop: "48px",
            display: "flex",
            justifyContent: "center",
            gap: "32px",
            opacity: 0.2,
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#A1C50A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3F51B5" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E06792" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
        </section>

        {/* ============================================ */}
        {/* FINAL CTA */}
        {/* ============================================ */}
        <section
          id="final-cta"
          className={`section-reveal ${vis('final-cta') ? 'visible' : ''}`}
          style={{
            padding: "140px 40px",
            textAlign: "center",
            position: "relative",
            zIndex: 5,
          }}
        >
          {/* Glow behind CTA */}
          <div style={{
            position: "absolute",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(224, 103, 146, 0.08) 0%, transparent 65%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            filter: "blur(60px)",
            pointerEvents: "none",
          }} />

          <h2 style={{
            fontSize: "clamp(2rem, 4.5vw, 3.2rem)",
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontWeight: "400",
            lineHeight: "1.15",
            letterSpacing: "-0.02em",
            color: "rgba(255,255,255,0.9)",
            marginBottom: "20px",
            position: "relative",
          }}>{t.finalH}</h2>

          <p style={{
            fontSize: "1.1rem",
            color: "rgba(255,255,255,0.35)",
            marginBottom: "48px",
            lineHeight: "1.7",
            maxWidth: "460px",
            margin: "0 auto 48px",
            position: "relative",
          }}>{t.finalSub}</p>

          <button
            onClick={() => window.location.href = '/datapalo'}
            style={{
              padding: "22px 64px",
              fontSize: "1.1rem",
              fontWeight: "700",
              fontFamily: "'Satoshi', sans-serif",
              background: "linear-gradient(135deg, #E06792 0%, #CF5585 50%, #3F51B5 100%)",
              color: "white",
              border: "none",
              borderRadius: "16px",
              cursor: "pointer",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 16px 48px rgba(224, 103, 146, 0.22), 0 4px 16px rgba(63, 81, 181, 0.1)",
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              position: "relative",
            }}
          >
            {t.finalCta}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </section>

        {/* ============================================ */}
        {/* FOOTER */}
        {/* ============================================ */}
        <footer style={{
          textAlign: "center",
          padding: "60px 40px 36px",
          position: "relative",
          zIndex: 5,
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}>
          <div style={{
            fontSize: "1.15rem",
            fontWeight: "900",
            letterSpacing: "-0.03em",
            marginBottom: "8px",
          }}>
            <span style={{ color: "#E06792" }}>Data</span>
            <span style={{ color: "rgba(255,255,255,0.85)" }}>Palo</span>
          </div>

          <div style={{
            fontSize: "0.85rem",
            color: "rgba(255,255,255,0.2)",
            fontStyle: "italic",
            fontFamily: "'Instrument Serif', Georgia, serif",
            marginBottom: "24px",
            letterSpacing: "0.01em",
          }}>
            {t.tagline}
          </div>

          <a
            href="mailto:michael@forgecreative.cz"
            style={{
              color: "rgba(255,255,255,0.12)",
              textDecoration: "none",
              fontSize: "0.72rem",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.05em",
              transition: "color 0.3s ease",
            }}
            onMouseEnter={(e) => e.target.style.color = "rgba(224, 103, 146, 0.45)"}
            onMouseLeave={(e) => e.target.style.color = "rgba(255,255,255,0.12)"}
          >
            michael@forgecreative.cz
          </a>
        </footer>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        language={language === 'cz' ? 'cs' : 'en'}
      />
    </>
  );
}
