"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from './lib/auth-context';
import AuthModal from './components/AuthModal';
import DemoReportPreview from './components/DemoReportPreview';

export default function DataPaloLanding() {
  const [language, setLanguage] = useState('en');
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [visibleSections, setVisibleSections] = useState({});
  const [showAuth, setShowAuth] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollDepth, setScrollDepth] = useState(0);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupSubmitted, setPopupSubmitted] = useState(false);
  const [popupEmail, setPopupEmail] = useState('');
  const [popupLoading, setPopupLoading] = useState(false);
  const popupShownRef = useRef(false);
  const ctaClickedRef = useRef(false);
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

    const ids = ['demo', 'infographic', 'problem', 'solution', 'features', 'raa', 'usecases', 'trust', 'final-cta'];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 500);
      // Track scroll depth as percentage
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) setScrollDepth((window.scrollY / docHeight) * 100);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Exit-intent popup logic ──
  const getCookie = (name) => {
    try {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? match[2] : null;
    } catch { return null; }
  };
  const setCookie = (name, value, days) => {
    try {
      const expires = new Date(Date.now() + days * 864e5).toUTCString();
      document.cookie = name + '=' + value + '; expires=' + expires + '; path=/; SameSite=Lax';
    } catch {}
  };

  const tryShowPopup = () => {
    if (popupShownRef.current || ctaClickedRef.current) return;
    if (getCookie('dp_popup_dismissed')) return;
    popupShownRef.current = true;
    setPopupVisible(true);
  };

  useEffect(() => {
    // Desktop: exit-intent (cursor leaves top edge)
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    let mobileTimer;

    if (isFinePointer) {
      const handleMouseLeave = (e) => {
        if (e.clientY <= 0) tryShowPopup();
      };
      document.addEventListener('mouseleave', handleMouseLeave);
      return () => document.removeEventListener('mouseleave', handleMouseLeave);
    } else {
      // Mobile: time-based trigger (45s)
      mobileTimer = setTimeout(() => tryShowPopup(), 45000);
      return () => clearTimeout(mobileTimer);
    }
  }, []);

  const hidePopup = (remember) => {
    setPopupVisible(false);
    if (remember) setCookie('dp_popup_dismissed', '1', 14);
  };

  const handlePopupSubmit = async (e) => {
    e.preventDefault();
    if (!popupEmail.trim() || popupLoading) return;
    setPopupLoading(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: popupEmail.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        console.error('[Popup] Subscribe error:', data.error);
      }
    } catch (err) {
      console.error('[Popup] Network error:', err);
    }
    // Show success regardless — don't let API errors block the UX
    setPopupSubmitted(true);
    setPopupLoading(false);
    setCookie('dp_popup_dismissed', 'subscribed', 140);
  };

  const content = {
    en: {
      // Hero
      heroHeadline: "Upload a File. Get Answers in Seconds.",
      heroSub: "Drop any CSV or Excel file — get charts, insights, and reports instantly. Free to start, no skills required.",
      heroCta: "Try It Free",
      heroMicro: "No credit card. No setup. Just upload.",
      // Trust bar
      trust1: "GDPR",
      trust2: "No data stored",
      trust3: "Made in EU",
      howItWorks: "HOW IT WORKS",
      miniCta: "Try It Free →",
      stickyBar: "Start Free",
      scrollCta: "Ready to try? Upload your first file.",
      scrollCtaBtn: "Upload Your First File →",
      powered: "Powered by EXA Research AI",
      // Exit-intent popup
      popupBadge: "Free Weekly Newsletter",
      popupHeading: "Learn to Build & Monetize AI Agents",
      popupSub: "Real techniques. Real revenue strategies. From the team behind DataPalo \u2014 no fluff, delivered every week.",
      popupPlaceholder: "your@email.com",
      popupSubmit: "Subscribe",
      popupPrivacy: "No spam. Unsubscribe anytime. We respect your privacy.",
      popupSuccess: "You\u2019re in! Check your inbox for a welcome email.",
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
      raaBadgeNote: "Launching March 15, 2026",
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
      finalCta: "Try It Free",
      // Footer
      tagline: "The friend who understands your numbers.",
    },
    cz: {
      heroHeadline: "Nahrajte soubor. Odpovědi za vteřiny.",
      heroSub: "Nahrajte jakýkoli CSV nebo Excel — grafy, poznatky a reporty okamžitě. Zdarma, bez odborných znalostí.",
      heroCta: "Vyzkoušet zdarma",
      heroMicro: "Bez kreditky. Bez nastavení. Prostě nahrajte.",
      trust1: "GDPR",
      trust2: "Žádná data neuložena",
      trust3: "Vyrobeno v EU",
      howItWorks: "JAK TO FUNGUJE",
      miniCta: "Vyzkoušet zdarma →",
      stickyBar: "Vyzkoušet zdarma",
      scrollCta: "Připraveni? Nahrajte svůj první soubor.",
      scrollCtaBtn: "Nahrát první soubor →",
      powered: "Poháněno EXA Research AI",
      popupBadge: "Bezplatn\u00FD t\u00FDdenn\u00ED newsletter",
      popupHeading: "Nau\u010Dte se vytv\u00E1\u0159et a monetizovat AI agenty",
      popupSub: "Re\u00E1ln\u00E9 techniky. Re\u00E1ln\u00E9 strategie p\u0159\u00EDjm\u016F. Od t\u00FDmu DataPalo \u2014 \u017E\u00E1dn\u00E9 kecy, ka\u017Ed\u00FD t\u00FDden.",
      popupPlaceholder: "vas@email.cz",
      popupSubmit: "Odeb\u00EDrat",
      popupPrivacy: "\u017D\u00E1dn\u00FD spam. Odhl\u00E1\u0161en\u00ED kdykoli. Respektujeme va\u0161e soukrom\u00ED.",
      popupSuccess: "Jste p\u0159ihl\u00E1\u0161eni! Zkontrolujte si doru\u010Denou po\u0161tu.",
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
      raaBadgeNote: "Spuštění 15. března 2026",
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
      finalCta: "Vyzkoušet zdarma",
      tagline: "Přítel, který rozumí vašim číslům.",
    },
  };

  const t = content[language];

  const vis = (id) => visibleSections[id];

  return (
    <>
      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'DataPalo',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            url: 'https://www.datapalo.app',
            description: 'AI-powered data analysis tool. Upload any CSV or Excel file and get instant charts, insights, and reports. No technical skills needed.',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
              description: 'Free tier — 2 analyses included',
            },
          }).replace(/</g, '\\u003c'),
        }}
      />
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

        .sticky-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          padding: 14px 40px;
          background: rgba(8, 8, 24, 0.82);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          transform: translateY(-100%);
          opacity: 0;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .sticky-nav.sticky-visible {
          transform: translateY(0);
          opacity: 1;
        }

        .hero-cta-btn {
          padding: 20px 52px;
          font-size: 1.1rem;
          font-weight: 700;
          font-family: 'Satoshi', sans-serif;
          background: linear-gradient(135deg, #E06792 0%, #CF5585 50%, #3F51B5 100%);
          color: white;
          border: none;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 16px 48px rgba(224, 103, 146, 0.22), 0 4px 16px rgba(63, 81, 181, 0.1);
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }
        .hero-cta-btn:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 24px 64px rgba(224, 103, 146, 0.35), 0 8px 24px rgba(63, 81, 181, 0.2);
        }
        .mini-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 48px;
          padding: 14px 36px;
          font-size: 0.88rem;
          font-weight: 700;
          font-family: 'Satoshi', sans-serif;
          color: white;
          background: linear-gradient(135deg, #E06792 0%, #CF5585 50%, #3F51B5 100%);
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 8px 28px rgba(224, 103, 146, 0.18), 0 2px 8px rgba(63, 81, 181, 0.08);
        }
        .mini-cta:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 14px 40px rgba(224, 103, 146, 0.28), 0 4px 14px rgba(63, 81, 181, 0.14);
        }

        /* Sticky bottom CTA bar — mobile only */
        .sticky-bottom-bar {
          display: none;
        }
        @media (max-width: 768px) {
          .sticky-bottom-bar {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 99;
            padding: 12px 20px;
            background: rgba(8, 8, 24, 0.92);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-top: 1px solid rgba(255,255,255,0.06);
            justify-content: center;
            align-items: center;
            transform: translateY(100%);
            opacity: 0;
            transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
          }
          .sticky-bottom-bar.bar-visible {
            transform: translateY(0);
            opacity: 1;
          }
        }

        /* Scroll progress indicator */
        .scroll-progress {
          position: fixed;
          top: 0;
          left: 0;
          height: 3px;
          background: linear-gradient(90deg, #E06792, #3F51B5, #A1C50A);
          z-index: 101;
          transition: width 0.15s linear;
          pointer-events: none;
          border-radius: 0 2px 2px 0;
        }

        /* Scroll-triggered inline CTA */
        .scroll-cta-block {
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          transition: max-height 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease;
        }
        .scroll-cta-block.scroll-visible {
          max-height: 200px;
          opacity: 1;
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
          /* ── NAV ── */
          nav { padding: 16px 16px !important; }
          nav > div:last-child { gap: 10px !important; }
          nav > div:last-child button,
          nav > div:last-child a {
            padding: 6px 12px !important;
            font-size: 0.78rem !important;
          }
          nav > div:first-child { font-size: 1.2rem !important; }
          .sticky-nav { padding: 10px 16px !important; }
          .sticky-nav button { display: none !important; }
          .hero-cta-btn { width: 100% !important; justify-content: center !important; padding: 18px 32px !important; }
          .mini-cta { padding: 12px 28px !important; font-size: 0.82rem !important; }
          .lang-switcher {
            position: absolute !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
          }
          .nav-pricing {
            display: none !important;
          }
          .landing-root { padding-bottom: 64px !important; }

          /* ── HERO — stack on mobile ── */
          .hero-section {
            min-height: auto !important;
            flex-direction: column !important;
            padding: 24px 24px 32px !important;
            gap: 32px !important;
            text-align: center !important;
          }
          .hero-left { max-width: 100% !important; align-items: center !important; display: flex !important; flex-direction: column !important; }
          .hero-right { max-width: 100% !important; }
          .hero-h1 { font-size: 2.2rem !important; text-align: center !important; }
          .hero-sub { font-size: 1rem !important; max-width: 100% !important; text-align: center !important; }

          /* ── ALL SECTIONS — tighten the 120px desktop padding ── */
          #problem, #solution, #features, #raa,
          #usecases, #trust, #final-cta {
            padding-top: 56px !important;
            padding-bottom: 56px !important;
            padding-left: 24px !important;
            padding-right: 24px !important;
          }

          /* ── CARDS ── */
          .cards-row { flex-direction: column !important; }
          .step-card { padding: 24px 20px !important; min-width: 0 !important; }
          .feature-card { padding: 28px 24px !important; min-width: 0 !important; }
          .usecase-card { padding: 32px 24px !important; min-width: 0 !important; }
          .raa-card { padding: 32px 24px !important; }

          /* ── FINAL CTA button ── */
          #final-cta button {
            width: 100% !important;
            justify-content: center !important;
            padding: 18px 32px !important;
            font-size: 1rem !important;
          }

          /* ── TYPOGRAPHY tightening ── */
          #problem h2, #solution h2, #features h2,
          #trust h2, #final-cta h2 {
            font-size: clamp(1.5rem, 7vw, 2rem) !important;
          }
          #raa h2 { font-size: clamp(1.4rem, 6vw, 1.8rem) !important; }
        }

        /* ═══ EXIT-INTENT POPUP ═══ */
        .dp-popup-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(6, 6, 20, 0.75);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          opacity: 0;
          visibility: hidden;
          transition: opacity 350ms cubic-bezier(0.16, 1, 0.3, 1),
                      visibility 350ms cubic-bezier(0.16, 1, 0.3, 1);
          padding: 1rem;
        }
        .dp-popup-overlay.dp-active {
          opacity: 1;
          visibility: visible;
        }
        .dp-popup {
          position: relative;
          width: 100%;
          max-width: 440px;
          background: linear-gradient(165deg, rgba(18, 18, 46, 0.97) 0%, rgba(13, 13, 38, 0.98) 100%);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 2.5rem 2rem 2rem;
          overflow: hidden;
          transform: translateY(20px) scale(0.97);
          transition: transform 400ms cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 24px 80px rgba(0,0,0,0.5), 0 0 60px rgba(224, 103, 146, 0.06), inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .dp-popup-overlay.dp-active .dp-popup {
          transform: translateY(0) scale(1);
        }
        .dp-popup-glow {
          position: absolute;
          top: -60px;
          right: -40px;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(224, 103, 146, 0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .dp-popup-close {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          color: rgba(255,255,255,0.35);
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          cursor: pointer;
          transition: all 200ms ease;
          z-index: 2;
        }
        .dp-popup-close:hover {
          color: rgba(255,255,255,0.7);
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.12);
        }
        .dp-popup-content { position: relative; z-index: 1; }
        .dp-popup-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 50px;
          background: linear-gradient(135deg, rgba(161, 197, 10, 0.12), rgba(161, 197, 10, 0.06));
          border: 1px solid rgba(161, 197, 10, 0.2);
          margin-bottom: 1.25rem;
        }
        .dp-popup-badge-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #A1C50A;
          box-shadow: 0 0 8px rgba(161, 197, 10, 0.5);
          animation: dp-pulse 2.5s ease-in-out infinite;
        }
        @keyframes dp-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
        .dp-popup-badge-text {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #A1C50A;
        }
        .dp-popup-heading {
          font-family: 'Instrument Serif', Georgia, serif;
          font-size: clamp(1.5rem, 1.2rem + 1.5vw, 2rem);
          font-weight: 400;
          line-height: 1.2;
          color: rgba(255,255,255,0.94);
          margin-bottom: 0.75rem;
        }
        .dp-popup-subtext {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.48);
          line-height: 1.65;
          margin-bottom: 1.5rem;
          max-width: 380px;
        }
        .dp-popup-input-wrap {
          display: flex;
          gap: 0;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          transition: border-color 250ms ease;
        }
        .dp-popup-input-wrap:focus-within {
          border-color: rgba(224, 103, 146, 0.4);
          box-shadow: 0 0 0 3px rgba(224, 103, 146, 0.08);
        }
        .dp-popup-input {
          flex: 1;
          min-width: 0;
          padding: 14px 16px;
          font-family: 'Satoshi', sans-serif;
          font-size: 0.9rem;
          color: rgba(255,255,255,0.9);
          background: transparent;
          border: none;
          outline: none;
        }
        .dp-popup-input::placeholder { color: rgba(255,255,255,0.22); }
        .dp-popup-submit {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 14px 20px;
          font-family: 'Satoshi', sans-serif;
          font-size: 0.85rem;
          font-weight: 700;
          color: white;
          background: linear-gradient(135deg, #E06792 0%, #CF5585 50%, #3F51B5 100%);
          border: none;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 250ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .dp-popup-submit:hover { filter: brightness(1.1); }
        .dp-popup-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .dp-popup-privacy {
          font-size: 0.72rem;
          color: rgba(255,255,255,0.25);
          margin-top: 0.75rem;
          text-align: center;
        }
        .dp-popup-success { text-align: center; padding: 1rem 0; }
        .dp-popup-success-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(161, 197, 10, 0.15), rgba(161, 197, 10, 0.08));
          border: 1px solid rgba(161, 197, 10, 0.3);
          color: #A1C50A;
          font-size: 1.25rem;
          font-weight: 700;
        }
        .dp-popup-success-text {
          font-size: 0.95rem;
          color: rgba(255,255,255,0.7);
          line-height: 1.6;
        }
        @media (max-width: 480px) {
          .dp-popup { padding: 2rem 1.25rem 1.5rem; border-radius: 14px; }
          .dp-popup-heading { font-size: 1.4rem; }
          .dp-popup-input-wrap { flex-direction: column; border-radius: 10px; }
          .dp-popup-input { border-bottom: 1px solid rgba(255,255,255,0.06); }
          .dp-popup-submit { justify-content: center; padding: 14px 20px; }
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

        {/* === SCROLL PROGRESS BAR === */}
        <div className="scroll-progress" style={{ width: `${scrollDepth}%` }} />

        {/* ============================================ */}
        {/* STICKY NAV — appears on scroll */}
        {/* ============================================ */}
        <div className={`sticky-nav ${scrolled ? 'sticky-visible' : ''}`}>
          <div style={{
            fontSize: "1.2rem",
            fontWeight: "900",
            letterSpacing: "-0.03em",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <img src="/datapalo-logo.svg" alt="" style={{ width: "22px", height: "22px" }} />
            <span style={{ color: "#E06792" }}>Data</span>
            <span style={{ color: "rgba(255,255,255,0.92)" }}>Palo</span>
          </div>
          <button
            onClick={() => { ctaClickedRef.current = true; window.location.href = '/datapalo'; }}
            style={{
              padding: "10px 24px",
              fontSize: "0.85rem",
              fontWeight: "700",
              fontFamily: "'Satoshi', sans-serif",
              background: "linear-gradient(135deg, #E06792 0%, #CF5585 50%, #3F51B5 100%)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 16px rgba(224, 103, 146, 0.2)",
            }}
          >
            {t.heroCta} →
          </button>
        </div>

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
            gap: "10px",
          }}>
            <img src="/datapalo-logo.svg" alt="" style={{ width: "28px", height: "28px" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
              <span style={{ color: "#E06792" }}>Data</span>
              <span style={{ color: "rgba(255,255,255,0.92)" }}>Palo</span>
            </div>
          </div>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}>
            {/* Language switcher */}
            <div className="lang-switcher" style={{
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
              className="nav-pricing"
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
                  onClick={async () => {
                    try {
                      await signOut();
                      window.location.href = '/';
                    } catch (error) {
                      console.error('Sign out error:', error);
                    }
                  }}
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
        {/* HERO — Split-screen: text left, product right */}
        {/* ============================================ */}
        <section className="hero-section" style={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 40px 40px",
          maxWidth: "1140px",
          margin: "0 auto",
          position: "relative",
          zIndex: 5,
          gap: "60px",
        }}>
          {/* LEFT — Copy */}
          <div className="hero-left" style={{
            flex: "1 1 50%",
            maxWidth: "520px",
          }}>
            <h1 className={`hero-h1 ${mounted ? 'anim-2' : ''}`} style={{
              fontSize: "clamp(2.2rem, 5vw, 3.6rem)",
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontWeight: "400",
              lineHeight: "1.1",
              letterSpacing: "-0.02em",
              marginBottom: "24px",
              color: "rgba(255,255,255,0.92)",
            }}>
              {t.heroHeadline}
            </h1>

            <p className={`hero-sub ${mounted ? 'anim-3' : ''}`} style={{
              fontSize: "1.1rem",
              fontWeight: "400",
              color: "rgba(255,255,255,0.42)",
              marginBottom: "36px",
              lineHeight: "1.7",
              maxWidth: "440px",
              letterSpacing: "0.01em",
            }}>
              {t.heroSub}
            </p>

            {/* Single Hero CTA */}
            <button
              className={`hero-cta-btn ${mounted ? 'anim-4' : ''}`}
              onClick={() => { ctaClickedRef.current = true; window.location.href = '/datapalo'; }}
            >
              {t.heroCta}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>

            {/* Micro-copy */}
            <p className={mounted ? 'anim-5' : ''} style={{
              fontSize: "0.78rem",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: "500",
              color: "rgba(255,255,255,0.22)",
              marginTop: "16px",
              letterSpacing: "0.04em",
            }}>
              {t.heroMicro}
            </p>

            {/* Trust bar */}
            <div className={mounted ? 'anim-5' : ''} style={{
              display: "flex",
              gap: "20px",
              marginTop: "28px",
              flexWrap: "wrap",
            }}>
              {[t.trust1, t.trust2, t.trust3].map((item, i) => (
                <span key={i} style={{
                  fontSize: "0.68rem",
                  fontWeight: "500",
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "rgba(255,255,255,0.18)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}>
                  <span style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: i === 0 ? "#A1C50A" : i === 1 ? "#3F51B5" : "#E06792",
                    display: "inline-block",
                    opacity: 0.5,
                  }} />
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT — Product visual */}
          <div className={`hero-right ${mounted ? 'anim-4' : ''}`} style={{
            flex: "1 1 45%",
            maxWidth: "480px",
            position: "relative",
          }}>
            <div style={{
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.08)",
              overflow: "hidden",
              boxShadow: "0 24px 80px rgba(0,0,0,0.5), 0 0 40px rgba(63, 81, 181, 0.08)",
              position: "relative",
            }}>
              {/* Browser chrome bar */}
              <div style={{
                background: "rgba(255,255,255,0.04)",
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "rgba(255,255,255,0.12)" }} />
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "rgba(255,255,255,0.12)" }} />
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "rgba(255,255,255,0.12)" }} />
                <span style={{
                  marginLeft: "12px",
                  fontSize: "0.6rem",
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "rgba(255,255,255,0.15)",
                  letterSpacing: "0.05em",
                }}>datapalo.app</span>
              </div>
              <img
                src="/datapalo-infographic.jpg"
                alt="DataPalo — Upload, Analyze, Get Answers"
                style={{
                  width: "100%",
                  display: "block",
                }}
              />
            </div>
            {/* Subtle glow behind product image */}
            <div style={{
              position: "absolute",
              width: "120%",
              height: "120%",
              top: "-10%",
              left: "-10%",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(63, 81, 181, 0.08) 0%, transparent 60%)",
              filter: "blur(40px)",
              pointerEvents: "none",
              zIndex: -1,
            }} />
          </div>

        </section>

        {/* ============================================ */}
        {/* DEMO REPORT PREVIEW */}
        {/* ============================================ */}
        <DemoReportPreview language={language} />

        {/* ============================================ */}
        {/* INFOGRAPHIC — How It Works */}
        {/* ============================================ */}
        <section
          id="infographic"
          className={`section-reveal ${vis('infographic') ? 'visible' : ''}`}
          style={{
            padding: "80px 40px",
            maxWidth: "960px",
            margin: "0 auto",
            textAlign: "center",
            position: "relative",
            zIndex: 5,
          }}
        >
          <span style={{
            fontSize: "0.85rem",
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: "700",
            color: "#3F51B5",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            marginBottom: "40px",
            display: "block",
          }}>{t.howItWorks}</span>
          <img
            src="/datapalo-infographic.jpg"
            alt="DataPalo — Upload. Analyze. Done. AI-Powered Data Analysis in Seconds"
            style={{
              width: "100%",
              maxWidth: "900px",
              borderRadius: "20px",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(14, 165, 233, 0.06)",
              transition: "transform 0.4s ease, box-shadow 0.4s ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "scale(1.01)";
              e.target.style.boxShadow = "0 24px 70px rgba(0,0,0,0.5), 0 0 50px rgba(14, 165, 233, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1)";
              e.target.style.boxShadow = "0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(14, 165, 233, 0.06)";
            }}
          />
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
          <div style={{ textAlign: "center" }}>
            <button className="mini-cta" onClick={() => { ctaClickedRef.current = true; window.location.href = '/datapalo'; }}>
              {t.miniCta}
            </button>
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
          <div style={{ textAlign: "center" }}>
            <button className="mini-cta" onClick={() => { ctaClickedRef.current = true; window.location.href = '/datapalo'; }}>
              {t.miniCta}
            </button>
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
        {/* SCROLL-TRIGGERED CTA — appears at ~60% depth */}
        {/* ============================================ */}
        <div className={`scroll-cta-block ${scrollDepth > 55 ? 'scroll-visible' : ''}`}
          style={{
            padding: "0 40px",
            maxWidth: "700px",
            margin: "0 auto",
          }}
        >
          <div style={{
            textAlign: "center",
            padding: "48px 36px",
            background: "linear-gradient(135deg, rgba(224, 103, 146, 0.06) 0%, rgba(63, 81, 181, 0.06) 100%)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "20px",
            position: "relative",
            zIndex: 5,
          }}>
            <p style={{
              fontSize: "1.05rem",
              fontFamily: "'Instrument Serif', Georgia, serif",
              color: "rgba(255,255,255,0.55)",
              marginBottom: "24px",
              fontStyle: "italic",
            }}>{t.scrollCta}</p>
            <button
              className="hero-cta-btn"
              onClick={() => { ctaClickedRef.current = true; window.location.href = '/datapalo'; }}
              style={{ padding: "16px 40px", fontSize: "0.95rem" }}
            >
              {t.scrollCtaBtn}
            </button>
          </div>
        </div>

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
            onClick={() => { ctaClickedRef.current = true; window.location.href = '/datapalo'; }}
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
            {t.heroCta}
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

        {/* ============================================ */}
        {/* MOBILE STICKY BOTTOM CTA BAR */}
        {/* ============================================ */}
        <div className={`sticky-bottom-bar ${scrollDepth > 10 ? 'bar-visible' : ''}`}>
          <button
            onClick={() => { ctaClickedRef.current = true; window.location.href = '/datapalo'; }}
            style={{
              width: "100%",
              padding: "14px 32px",
              fontSize: "0.9rem",
              fontWeight: "700",
              fontFamily: "'Satoshi', sans-serif",
              background: "linear-gradient(135deg, #E06792 0%, #CF5585 50%, #3F51B5 100%)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 8px 24px rgba(224, 103, 146, 0.25)",
            }}
          >
            {t.stickyBar}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ============================================ */}
      {/* EXIT-INTENT NEWSLETTER POPUP */}
      {/* ============================================ */}
      <div
        className={`dp-popup-overlay ${popupVisible ? 'dp-active' : ''}`}
        aria-hidden={!popupVisible}
        role="dialog"
        aria-modal="true"
        onClick={(e) => { if (e.target === e.currentTarget) hidePopup(true); }}
        onKeyDown={(e) => { if (e.key === 'Escape') hidePopup(true); }}
      >
        <div className="dp-popup">
          <button className="dp-popup-close" aria-label="Close popup" onClick={() => hidePopup(true)}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="4" x2="16" y2="16"/><line x1="16" y1="4" x2="4" y2="16"/>
            </svg>
          </button>
          <div className="dp-popup-glow" />
          <div className="dp-popup-content">
            <div className="dp-popup-badge">
              <span className="dp-popup-badge-dot" />
              <span className="dp-popup-badge-text">{t.popupBadge}</span>
            </div>
            <h2 className="dp-popup-heading">{t.popupHeading}</h2>
            {!popupSubmitted && (
              <>
                <p className="dp-popup-subtext">{t.popupSub}</p>
                <form className="dp-popup-form" onSubmit={handlePopupSubmit}>
                  <div className="dp-popup-input-wrap">
                    <input
                      type="email"
                      className="dp-popup-input"
                      placeholder={t.popupPlaceholder}
                      value={popupEmail}
                      onChange={(e) => setPopupEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                    <button type="submit" className="dp-popup-submit" disabled={popupLoading}>
                      <span>{t.popupSubmit}</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </button>
                  </div>
                  <p className="dp-popup-privacy">{t.popupPrivacy}</p>
                </form>
              </>
            )}
            {popupSubmitted && (
              <div className="dp-popup-success">
                <div className="dp-popup-success-icon">{'\u2713'}</div>
                <p className="dp-popup-success-text">{t.popupSuccess}</p>
              </div>
            )}
          </div>
        </div>
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
