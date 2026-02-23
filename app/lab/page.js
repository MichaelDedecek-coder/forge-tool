"use client";

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Terminal, Network, Cpu } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function AiLabPage() {
  const containerRef = useRef(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      gsap.from('.hero-el', { y: 60, opacity: 0, stagger: 0.08, duration: 1.2, ease: 'power3.out', delay: 0.2 });
      gsap.from('.phil-el', { scrollTrigger: { trigger: '#philosophy', start: 'top 70%' }, y: 40, opacity: 0, stagger: 0.1, duration: 1, ease: 'power3.out' });

      const cards = gsap.utils.toArray('.protocol-card');
      cards.forEach((card, i) => {
        ScrollTrigger.create({ trigger: card, start: 'top top', pin: true, pinSpacing: false, end: 'max' });
        if (i < cards.length - 1) {
          gsap.to(card, {
            scale: 0.9, opacity: 0.5, filter: 'blur(20px)', ease: 'none',
            scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: 'top top', scrub: true }
          });
        }
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    // Zde aplikujeme barvy Brutalist Signal jen na tuto konkrétní stránku
    <div ref={containerRef} className="relative min-h-screen bg-surface text-dark font-sans selection:bg-accent selection:text-surface">
      
      <svg className="pointer-events-none fixed inset-0 z-[9999] h-full w-full opacity-5 mix-blend-multiply">
        <filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" /></filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>

      <Navbar />
      <Hero />
      <Features />
      <Philosophy />
      <Protocol />
      <GetStarted />
      <Footer />
    </div>
  );
}

// ==========================================
// KOMPONENTY (Vloženy rovnou sem pro jednoduchost)
// ==========================================
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed left-1/2 top-6 z-50 flex w-[90%] max-w-5xl -translate-x-1/2 items-center justify-between rounded-4xl px-6 py-4 transition-all duration-500 ${scrolled ? 'bg-surface/80 backdrop-blur-xl border border-dark/10 shadow-lg' : 'bg-transparent text-primary'}`}>
      <div className={`font-sans text-xl font-bold tracking-tight ${scrolled ? 'text-dark' : 'text-primary'}`}>AI LAB</div>
      <div className={`hidden md:flex gap-8 font-mono text-sm uppercase ${scrolled ? 'text-dark/70' : 'text-primary/70'}`}>
        <a href="#features" className="hover:-translate-y-[1px] transition-transform hover:text-accent">Infrastruktura</a>
        <a href="#protocol" className="hover:-translate-y-[1px] transition-transform hover:text-accent">Protokol</a>
      </div>
      <a href="https://slack.com" target="_blank" rel="noreferrer" className="btn-magnetic bg-accent text-primary px-6 py-2.5 rounded-4xl font-sans font-bold text-sm flex items-center gap-2 hover:bg-red-700 transition-colors">
        Slack <ArrowRight size={16} />
      </a>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative flex h-[100dvh] w-full flex-col justify-end overflow-hidden p-8 md:p-16">
      <div className="absolute inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2500&auto=format&fit=crop" alt="Brutalist concrete architecture" className="h-full w-full object-cover grayscale" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/80 to-transparent"></div>
      </div>
      <div className="relative z-10 w-full max-w-5xl">
        <div className="hero-el mb-6 flex items-center gap-3">
          <div className="h-3 w-3 bg-accent"></div>
          <span className="font-mono text-sm font-bold text-accent tracking-widest uppercase">System Online</span>
        </div>
        <h1 className="hero-el flex flex-col leading-[0.85] text-primary">
          <span className="font-sans text-6xl font-bold uppercase tracking-tighter md:text-8xl">Ovládněte</span>
          <span className="font-drama text-7xl italic md:ml-12 md:text-9xl">Systémy.</span>
        </h1>
        <p className="hero-el mt-8 max-w-xl font-mono text-lg leading-relaxed text-primary/70 md:text-xl">
          Nezávislý technologický inkubátor. Konec AI teorie, stavíme reálné produkční systémy.
        </p>
        <div className="hero-el mt-12">
          <a href="https://join.slack.com/t/agentforgetech/shared_invite/zt-3qi1or6nq-cAvEDMU13nFtiZyqV8~0Sg" target="_blank" rel="noreferrer" className="btn-magnetic btn-slide inline-flex items-center gap-3 rounded-4xl bg-accent px-8 py-4 font-sans text-lg font-bold text-white shadow-xl shadow-accent/20">
            <span className="flex items-center gap-3 transition-colors">Připojit se na Slack AI Lab <Terminal size={20} /></span>
          </a>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="bg-surface px-6 py-32 md:px-16">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-3">
        <div className="flex flex-col overflow-hidden rounded-4xl border border-dark/10 bg-primary p-6 shadow-sm">
          <div className="relative mb-6 flex h-48 w-full items-center justify-center overflow-hidden rounded-[1.5rem] bg-surface border border-dark/5"><DiagnosticShuffler /></div>
          <h3 className="font-sans text-2xl font-bold tracking-tight text-dark">Inženýrský přístup</h3>
          <p className="mt-2 font-mono text-sm leading-relaxed text-dark/60">5-vrstvá architektura</p>
        </div>
        <div className="flex flex-col overflow-hidden rounded-4xl border border-dark/10 bg-primary p-6 shadow-sm">
          <div className="relative mb-6 flex h-48 w-full items-center justify-center overflow-hidden rounded-[1.5rem] bg-dark text-accent border border-dark/5 p-4"><TelemetryTypewriter /></div>
          <h3 className="font-sans text-2xl font-bold tracking-tight text-dark">Napojení na firmy</h3>
          <p className="mt-2 font-mono text-sm leading-relaxed text-dark/60">B2B datová extrakce</p>
        </div>
        <div className="flex flex-col overflow-hidden rounded-4xl border border-dark/10 bg-primary p-6 shadow-sm">
          <div className="relative mb-6 flex h-48 w-full items-center justify-center overflow-hidden rounded-[1.5rem] bg-surface border border-dark/5 p-4"><CursorScheduler /></div>
          <h3 className="font-sans text-2xl font-bold tracking-tight text-dark">Vlastní vývoj</h3>
          <p className="mt-2 font-mono text-sm leading-relaxed text-dark/60">Autonomní AI agenti</p>
        </div>
      </div>
    </section>
  );
}

function DiagnosticShuffler() {
  const [items, setItems] = useState(['1. ROLE', '2. ÚKOL', '3. OMEZENÍ', '4. FORMÁT', '5. ONE-SHOT']);
  useEffect(() => {
    const int = setInterval(() => setItems(prev => { const arr = [...prev]; arr.unshift(arr.pop()); return arr; }), 2500);
    return () => clearInterval(int);
  }, []);
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center">
      {items.slice(0, 3).map((item, i) => (
        <div key={item} className="absolute flex w-3/4 items-center justify-between rounded-xl border border-dark/20 bg-primary p-3 shadow-md transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{ transform: `translateY(${i * 16}px) scale(${1 - i * 0.05})`, zIndex: 10 - i, opacity: 1 - i * 0.2 }}>
          <span className="font-mono text-xs font-bold text-dark">{item}</span>
          <div className={`h-2 w-2 rounded-full ${i === 0 ? 'bg-accent' : 'bg-dark/20'}`}></div>
        </div>
      ))}
    </div>
  );
}

function TelemetryTypewriter() {
  const code = "> EXTRACT_DATA()\n> TARGET: SKU_INVENTORY\n> PARSING JSON...\n> STATUS: 100% PŘESNOST\n> WAITING FOR INPUT_";
  const [text, setText] = useState("");
  useEffect(() => {
    let i = 0; const int = setInterval(() => { setText(code.slice(0, i)); i++; if (i > code.length) i = 0; }, 80);
    return () => clearInterval(int);
  }, []);
  return (
    <div className="flex h-full w-full flex-col font-mono text-[11px] leading-relaxed text-primary/80">
      <div className="mb-2 flex items-center justify-between border-b border-primary/20 pb-2">
        <span className="text-primary/50">Terminal.exe</span>
        <span className="flex items-center gap-2 text-accent"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent"></span>LIVE FEED</span>
      </div>
      <div className="whitespace-pre-wrap">{text}</div>
    </div>
  );
}

function CursorScheduler() {
  const cursorRef = useRef(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1 });
      tl.to(cursorRef.current, { x: 70, y: 30, duration: 1, ease: 'power2.inOut' })
        .to(cursorRef.current, { scale: 0.9, duration: 0.1, yoyo: true, repeat: 1 })
        .to('.day-activate', { backgroundColor: '#E63B2E', color: '#F5F3EE', duration: 0.2 }, "-=0.1")
        .to(cursorRef.current, { x: 150, y: 80, duration: 1, ease: 'power2.inOut', delay: 0.5 })
        .to('.day-activate', { backgroundColor: 'transparent', color: '#111111', duration: 0.2 }, "+=0.5");
    });
    return () => ctx.revert();
  }, []);
  return (
    <div className="relative flex h-full w-full flex-col justify-between p-2">
      <div className="grid grid-cols-5 gap-1 font-mono text-[9px] font-bold">
        {['PO', 'ÚT', 'ST', 'ČT', 'PÁ'].map((d, i) => (
          <div key={i} className={`flex items-center justify-center rounded border border-dark/10 py-1.5 ${i === 3 ? 'day-activate transition-colors' : 'text-dark/50'}`}>{d}</div>
        ))}
      </div>
      <div className="self-center rounded border border-dark/10 bg-primary px-3 py-1.5 font-mono text-[10px] shadow-sm">Deploy Agent</div>
      <div ref={cursorRef} className="absolute left-2 top-2 z-10 w-5 h-5 text-dark drop-shadow-md">
        <svg viewBox="0 0 24 24" fill="#111111" stroke="white" strokeWidth="1"><path d="M4 4l16 7-7 2-2 7z" /></svg>
      </div>
    </div>
  );
}

function Philosophy() {
  return (
    <section id="philosophy" className="relative overflow-hidden bg-dark px-6 py-40 text-center md:px-16">
      <div className="absolute inset-0 opacity-10">
        <img src="https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=2000&auto=format&fit=crop" alt="Code texture" className="h-full w-full object-cover grayscale" />
      </div>
      <div className="relative z-10 mx-auto max-w-5xl">
        <p className="phil-el mb-8 font-mono text-xl uppercase tracking-widest text-primary/50 md:text-2xl">
          Většina vývojářů se soustředí na: AI teorii a fiktivní problémy.
        </p>
        <h2 className="phil-el font-sans text-5xl font-bold leading-tight tracking-tighter text-primary md:text-7xl">
          My se soustředíme na: <br />
          <span className="font-drama text-accent italic">reálné produkční systémy.</span>
        </h2>
      </div>
    </section>
  );
}

function Protocol() {
  const steps = [
    { num: '01', title: 'Dekonstrukce problému', desc: 'Identifikace procesů vhodných pro AI automatizaci.', icon: <Network size={80} strokeWidth={1} /> },
    { num: '02', title: 'AgentForge Stack', desc: 'Aplikace 5-vrstvé architektury promptů pro absolutní kontrolu.', icon: <Terminal size={80} strokeWidth={1} /> },
    { num: '03', title: 'Produkční Exekuce', desc: 'Testování mantinelů, iterace a nasazení autonomních řešení.', icon: <Cpu size={80} strokeWidth={1} /> }
  ];
  return (
    <section id="protocol" className="relative bg-surface pb-32 pt-16">
      {steps.map((step, i) => (
        <div key={i} className="protocol-card sticky top-0 flex h-screen w-full items-center justify-center bg-surface p-6">
          <div className="flex h-[75vh] w-full max-w-5xl flex-col justify-between overflow-hidden rounded-5xl border border-dark/10 bg-primary p-10 shadow-2xl md:flex-row md:items-center md:p-16">
            <div className="flex-1">
              <span className="font-mono text-xl font-bold text-accent">{step.num} //</span>
              <h2 className="mt-6 font-sans text-5xl font-bold tracking-tighter text-dark md:text-7xl">{step.title}</h2>
              <p className="mt-6 max-w-sm font-mono text-lg leading-relaxed text-dark/70">{step.desc}</p>
            </div>
            <div className="flex flex-1 items-center justify-center text-dark/20 relative w-full h-full min-h-[250px] mt-12 md:mt-0 bg-dark/5 rounded-[2rem] overflow-hidden">
               <ProtocolAnimation index={i} />
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

function ProtocolAnimation({ index }) {
  const svgRef = useRef(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (index === 0) gsap.to(".gear", { rotation: 360, duration: 20, repeat: -1, ease: "none", transformOrigin: "center" });
      else if (index === 1) gsap.to(".laser", { y: 200, duration: 2, repeat: -1, yoyo: true, ease: "power1.inOut" });
      else if (index === 2) gsap.to(".wave", { strokeDashoffset: -100, duration: 1.5, repeat: -1, ease: "none" });
    }, svgRef);
    return () => ctx.revert();
  }, [index]);

  return (
    <svg ref={svgRef} className="absolute inset-0 w-full h-full" viewBox="0 0 300 300" preserveAspectRatio="xMidYMid slice">
      {index === 0 && (
        <g className="gear" transform="translate(150, 150)">
          <circle cx="0" cy="0" r="60" fill="none" stroke="#111111" strokeWidth="2" strokeOpacity="0.2"/>
          <circle cx="0" cy="0" r="40" fill="none" stroke="#E63B2E" strokeWidth="4"/>
          {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
            <line key={angle} x1="0" y1="-40" x2="0" y2="-60" stroke="#111111" strokeOpacity="0.2" strokeWidth="4" transform={`rotate(${angle})`}/>
          ))}
        </g>
      )}
      {index === 1 && (
        <g>
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse"><rect width="30" height="30" fill="none" stroke="#111111" strokeOpacity="0.1" strokeWidth="1"/></pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <line className="laser" x1="0" y1="50" x2="300" y2="50" stroke="#E63B2E" strokeWidth="3" filter="drop-shadow(0 0 8px #E63B2E)"/>
        </g>
      )}
      {index === 2 && (
        <g transform="translate(0, 150)">
          <path className="wave" d="M0,0 Q25,-50 50,0 T100,0 T150,0 T200,0 T250,0 T300,0" fill="none" stroke="#111111" strokeOpacity="0.2" strokeWidth="4"/>
          <path className="wave" d="M0,0 Q25,50 50,0 T100,0 T150,0 T200,0 T250,0 T300,0" fill="none" stroke="#E63B2E" strokeWidth="4" strokeDasharray="50 50"/>
        </g>
      )}
    </svg>
  );
}

function GetStarted() {
  return (
    <section className="bg-surface px-6 py-32 md:px-16 text-center">
      <div className="mx-auto max-w-4xl rounded-5xl bg-primary border border-dark/10 p-12 shadow-sm md:p-24">
        <Cpu size={48} className="mx-auto mb-8 text-accent" strokeWidth={1.5} />
        <h2 className="font-sans text-4xl font-bold tracking-tighter text-dark md:text-6xl uppercase">Inicializace.</h2>
        <p className="mx-auto mt-6 max-w-lg font-mono text-dark/70 leading-relaxed mb-10">
          Získej přístup do vývojářského kanálu, převezmi datová zadání a začni stavět reálné systémy.
        </p>
        <a href="https://join.slack.com/t/agentforgetech/shared_invite/zt-3qi1or6nq-cAvEDMU13nFtiZyqV8~0Sg" target="_blank" rel="noreferrer" className="btn-magnetic btn-slide inline-flex items-center gap-3 rounded-4xl bg-accent px-10 py-5 font-sans text-xl font-bold text-white shadow-xl shadow-accent/20">
          <span className="flex items-center gap-3 transition-colors">Připojit se na Slack AI Lab <ArrowRight size={24} /></span>
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative z-50 -mt-10 rounded-t-5xl bg-dark px-8 py-16 text-primary md:px-16">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-12 border-b border-primary/10 pb-12 md:flex-row md:items-end">
        <div>
          <h3 className="font-sans text-3xl font-bold tracking-tight">AI LAB</h3>
          <p className="mt-2 font-mono text-sm text-primary/50">Vývojářská laboratoř.</p>
        </div>
        <div className="flex items-center gap-3 rounded-full border border-green-500/30 bg-green-500/10 px-5 py-2.5">
          <div className="h-2 w-2 animate-pulse rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
          <span className="font-mono text-xs font-bold tracking-widest text-green-500 uppercase">System Operational</span>
        </div>
      </div>
      <div className="mx-auto mt-8 flex max-w-7xl justify-between font-mono text-xs text-primary/40">
        <p>© 2026 AgentForge.Tech / AI Lab</p>
        <p>BUILD_V2.0.4</p>
      </div>
    </footer>
  );
}