"use client";
import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";

export default function Home() {
  // --- STATE ---
  const [currentView, setCurrentView] = useState("landing");
  const [language, setLanguage] = useState("en"); 
  const [emailInput, setEmailInput] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  // --- APP STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false); 
  const [pinInput, setPinInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [csvData, setCsvData] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- REFS ---
  const accessSectionRef = useRef(null);

  // ==========================================
  // 🎨 STYLES
  // ==========================================
  const styles = `
    .landing-container { font-family: 'Inter', sans-serif; background-color: #030712; color: white; min-height: 100vh; position: relative; overflow-x: hidden; }
    .grid-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-image: linear-gradient(rgba(6, 182, 212, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.03) 1px, transparent 1px); background-size: 50px 50px; pointer-events: none; z-index: 1; }
    .glow-orb-1 { position: fixed; top: -200px; right: -200px; width: 600px; height: 600px; background: radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%); pointer-events: none; z-index: 0; }
    .glow-orb-2 { position: fixed; bottom: -300px; left: -200px; width: 600px; height: 600px; background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%); pointer-events: none; z-index: 0; }
    
    header { display: flex; justify-content: space-between; align-items: center; padding: 20px 40px; position: relative; z-index: 10; }
    .logo { display: flex; align-items: center; gap: 12px; }
    .logo-icon { font-size: 32px; }
    .logo-text { font-size: 20px; font-weight: 700; color: #06b6d4; }
    
    .lang-toggle { display: flex; gap: 8px; background: rgba(255,255,255,0.05); padding: 4px; border-radius: 20px; }
    .lang-btn { background: transparent; color: rgba(255,255,255,0.6); border: none; padding: 8px 16px; border-radius: 16px; cursor: pointer; font-weight: 600; font-size: 14px; transition: all 0.2s; }
    .lang-btn.active { background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); color: white; }
    
    main { max-width: 900px; margin: 0 auto; padding: 40px 40px 60px; position: relative; z-index: 10; }
    
    .badge { display: inline-flex; align-items: center; gap: 10px; background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.3); padding: 10px 20px; border-radius: 30px; margin-bottom: 40px; }
    .badge-dot { width: 8px; height: 8px; background: #06b6d4; border-radius: 50%; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .badge-text { color: #06b6d4; font-size: 14px; font-weight: 500; font-family: monospace; }
    
    h1 { font-size: clamp(40px, 8vw, 80px); font-weight: 800; line-height: 1.05; margin-bottom: 30px; letter-spacing: -2px; }
    .headline-white { color: white; }
    .headline-cyan { background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    
    .subhead { font-size: 20px; color: rgba(255,255,255,0.7); line-height: 1.6; margin-bottom: 40px; max-width: 600px; }
    
    .cta-container { display: flex; gap: 15px; justify-content: center; margin-bottom: 60px; flex-wrap: wrap; }
    
    .cta-button { display: inline-flex; align-items: center; gap: 12px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 18px 36px; border-radius: 12px; font-size: 18px; font-weight: 700; text-decoration: none; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4); cursor: pointer; border: none; }
    .cta-button:hover { transform: translateY(-2px); box-shadow: 0 6px 30px rgba(16, 185, 129, 0.5); }
    
    .cta-button.secondary { background: rgba(255,255,255,0.1); box-shadow: none; border: 1px solid rgba(255,255,255,0.2); }
    .cta-button.secondary:hover { background: rgba(255,255,255,0.15); }
    
    .proof-section { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 80px; padding: 30px; background: rgba(255,255,255,0.02); border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
    .proof-item { display: flex; align-items: center; gap: 10px; color: rgba(255,255,255,0.8); font-size: 15px; }
    .checkmark { color: #10b981; font-weight: bold; font-size: 18px; }
    
    .how-section { margin-bottom: 80px; }
    .how-title { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.5); letter-spacing: 2px; margin-bottom: 40px; }
    .steps-container { display: flex; align-items: center; justify-content: center; gap: 20px; flex-wrap: wrap; }
    .step { text-align: center; padding: 30px; background: rgba(255,255,255,0.03); border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); min-width: 180px; transition: transform 0.2s, border-color 0.2s; flex: 1; }
    .step:hover { transform: translateY(-4px); border-color: rgba(16, 185, 129, 0.3); }
    .step-icon { font-size: 40px; margin-bottom: 16px; }
    .step-title { font-size: 18px; font-weight: 700; color: white; margin-bottom: 8px; }
    .step-desc { font-size: 14px; color: rgba(255,255,255,0.6); }
    .step-arrow { font-size: 24px; color: rgba(6, 182, 212, 0.6); }
    
    .cta-section { text-align: center; padding: 60px 40px; background: rgba(16, 185, 129, 0.05); border-radius: 24px; border: 1px solid rgba(16, 185, 129, 0.2); margin-bottom: 60px; }
    .email-form { display: flex; gap: 12px; max-width: 500px; margin: 0 auto 20px; flex-wrap: wrap; justify-content: center; }
    .email-input { flex: 1; min-width: 250px; padding: 16px 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.3); color: white; font-size: 16px; outline: none; }
    .email-input:focus { border-color: #10b981; }
    
    .access-btn { display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 32px; border-radius: 12px; border: none; font-size: 16px; font-weight: 700; cursor: pointer; transition: transform 0.2s; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3); }
    .access-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4); }
    .access-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
    
    .pin-note { color: rgba(255,255,255,0.5); font-size: 14px; margin-bottom: 20px; }
    .already-pin { color: rgba(255,255,255,0.6); font-size: 14px; }
    .enter-here-btn { background: none; border: none; color: #10b981; cursor: pointer; font-weight: 600; text-decoration: underline; font-size: 14px; padding: 0 5px; }
    
    /* SUCCESS BOX */
    .action-box { background: rgba(255,255,255,0.05); border: 1px solid #10b981; padding: 30px; border-radius: 12px; animation: fadeIn 0.3s; }
    .action-title { font-size: 22px; color: #10b981; font-weight: bold; margin-bottom: 10px; }
    .action-desc { color: #ccc; margin-bottom: 20px; line-height: 1.5; }
    
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    footer { text-align: center; padding-top: 40px; border-top: 1px solid rgba(255,255,255,0.05); }
    .footer-logo { color: rgba(255,255,255,0.4); font-size: 14px; margin-bottom: 8px; }
    .footer-tagline { color: #06b6d4; font-size: 16px; font-weight: 600; }
    
    @media (max-width: 768px) {
        header { padding: 15px 20px; }
        main { padding: 20px 20px 40px; }
        .steps-container { flex-direction: column; }
        .step-arrow { transform: rotate(90deg); }
        .cta-section { padding: 40px 20px; }
    }
  `;

  // ==========================================
  // 🌍 TRANSLATIONS
  // ==========================================
  const t = {
    en: {
      badge: "Your AI Data Analyst is ready",
      h1_1: "8 Hours",
      h1_2: "of Excel.",
      h1_3: "Now 30",
      h1_4: "Seconds.",
      subhead: "Drop any CSV or Excel file. Get instant insights. No formulas. No pivot tables. Just answers.",
      cta_main: "Get Access",
      cta_demo: "⚡️ Try Live Demo",
      p1: "Stress-tested on 21,000 rows",
      p2: "€22.7M calculated — exact to the cent",
      p3: "Zero hallucinations",
      p4: "Results in 24 seconds",
      how_title: "HOW IT WORKS",
      s1_t: "Upload", s1_d: "Drop your CSV or Excel file",
      s2_t: "Analyze", s2_d: "AI processes your data",
      s3_t: "Insights", s3_d: "Get your report instantly",
      email_ph: "Enter your email",
      pin_note: "You'll receive your PIN within 24 hours",
      already: "Already have a PIN?",
      enter: "Enter here",
      footer_brand: "FORGE CREATIVE | AI Job Agency",
      footer_tag: "DataWizard — Precision Insights. Instant.",
      drop_ready: "Ready:",
      drop_hint: "Drag & drop a file here",
      analyzing: "✨ Analyzing...",
      get_insight: "✨ Auto-Discover Insights",
      download: "⬇️ Download Report",
      pin_title: "DataWizard Access",
      unlock: "Unlock",
      back: "← Back to Home",
      upsell_title: "Want to analyze YOUR own data?",
      upsell_text: "This was just a demo. Get your personal PIN to unlock the full power of DataWizard.",
      // Success State
      act_title: "Request Received!",
      act_desc: "We've got your email. You'll receive your PIN within 24 hours.",
      submitting: "Submitting...",
    },
    cs: {
      badge: "Váš AI datový analytik je připraven",
      h1_1: "8 Hodin",
      h1_2: "v Excelu.",
      h1_3: "Teď 30",
      h1_4: "Sekund.",
      subhead: "Vložte CSV nebo Excel. Získejte okamžité odpovědi. Žádné vzorce. Žádné kontingenční tabulky.",
      cta_main: "Získat přístup",
      cta_demo: "⚡️ Vyzkoušet Demo",
      p1: "Stres-testováno na 21 000 řádcích",
      p2: "Spočítáno 22,7 mil. € — přesně na cent",
      p3: "Nulové halucinace",
      p4: "Výsledky za 24 sekund",
      how_title: "JAK TO FUNGUJE",
      s1_t: "Nahrát", s1_d: "Vložte soubor CSV nebo Excel",
      s2_t: "Analyzovat", s2_d: "AI zpracuje vaše data",
      s3_t: "Insight", s3_d: "Okamžitě získejte report",
      email_ph: "Váš email",
      pin_note: "PIN obdržíte do 24 hodin",
      already: "Máte už PIN?",
      enter: "Vstoupit zde",
      footer_brand: "FORGE CREATIVE | AI Job Agency",
      footer_tag: "DataWizard — Přesné vhledy. Okamžitě.",
      drop_ready: "Připraveno:",
      drop_hint: "Přetáhněte soubor sem",
      analyzing: "✨ Analyzuji...",
      get_insight: "✨ Získat Insight",
      download: "⬇️ Stáhnout Report",
      pin_title: "Vstup do DataWizard",
      unlock: "Odemknout",
      back: "← Zpět na úvod",
      upsell_title: "Chcete analyzovat SVÁ vlastní data?",
      upsell_text: "Toto bylo pouze demo. Získejte svůj osobní PIN a odemkněte plnou sílu DataWizard.",
      // Success State
      act_title: "Požadavek přijat!",
      act_desc: "Máme váš email. PIN obdržíte do 24 hodin.",
      submitting: "Odesílám...",
    }
  };

  const txt = t[language];

  // ==========================================
  // ⚙️ LOGIC
  // ==========================================
  const handleScrollToAccess = (e) => {
    e.preventDefault();
    accessSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 🚀 FORMSPREE INTEGRATION - NO MORE MAILTO!
  const handleRequestAccess = async (e) => {
    e.preventDefault();
    if (!emailInput) return alert(language === "cs" ? "Prosím zadejte email" : "Please enter an email");
    
    setLoading(true);
    
    try {
      const response = await fetch("https://formspree.io/f/xjknqvkw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          email: emailInput,
          _subject: "New DataWizard PIN Request"
        })
      });
      
      if (response.ok) {
        setFormSubmitted(true);
      } else {
        alert(language === "cs" ? "Něco se pokazilo. Zkuste to znovu." : "Something went wrong. Please try again.");
      }
    } catch (error) {
      alert(language === "cs" ? "Chyba sítě. Zkuste to znovu." : "Network error. Please try again.");
    }
    
    setLoading(false);
  };

  const handleStartDemo = async () => {
    setLoading(true);
    setCurrentView("app");
    setIsDemoMode(true);
    setIsAuthenticated(true); 
    try {
        const response = await fetch('/demo.csv');
        if (!response.ok) throw new Error("Demo file not found");
        const text = await response.text();
        setCsvData(text);
        setFileName(language === "cs" ? "demo_data_ukazka.csv" : "demo_sample_data.csv");
    } catch (e) {
        alert("Error loading demo data: " + e.message);
    }
    setLoading(false);
  };

  const handleUpsellClick = (e) => {
    setIsDemoMode(false);
    setIsAuthenticated(false);
    setResult(null);
    setCsvData(null);
    setFileName(null);
    setCurrentView("landing");
    setTimeout(() => {
        handleScrollToAccess(e);
    }, 100);
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    const SECRET_PIN = "4863"; 
    if (pinInput === SECRET_PIN) {
      setIsAuthenticated(true);
      setIsDemoMode(false); 
    } else {
      setAuthError(language === "cs" ? "❌ Nesprávný PIN" : "❌ Incorrect PIN");
      setPinInput("");
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const binaryStr = e.target.result;
      const workbook = XLSX.read(binaryStr, { type: "binary" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      setCsvData(XLSX.utils.sheet_to_csv(worksheet));
    };
    reader.readAsBinaryString(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'text/csv': ['.csv'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } 
  });

  async function runAnalysis() {
    if (!csvData) return alert("Please upload a file first!");
    setLoading(true);
    setResult(null);
    const question = language === "cs" 
      ? "Analyzuj tato data. Řekni mi nejdůležitější trendy, součty a odlehlé hodnoty."
      : "Analyze this data. Tell me the most important trends, totals, or outliers.";

    try {
      const res = await fetch("/api/datawizard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, csvData: csvData, language: language }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      alert("Error: " + e.message);
    }
    setLoading(false);
  }

  const downloadReport = () => {
    if (!result) return;
    const element = document.createElement("a");
    const file = new Blob([result.result], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `DataWizard_Report_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(element);
    element.click();
  };

  // ==========================================
  // 🖥️ RENDER
  // ==========================================
  
  if (currentView === "app") {
    if (!isAuthenticated) {
        return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", backgroundColor: "#030712", color: "white", fontFamily: "sans-serif" }}>
                <style>{styles}</style>
                <button onClick={() => setCurrentView("landing")} style={{ position: "absolute", top: "20px", left: "20px", background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: "16px" }}>{txt.back}</button>
                <div style={{ padding: "40px", background: "rgba(255,255,255,0.05)", borderRadius: "12px", border: "1px solid #333", textAlign: "center", maxWidth: "400px", width: "90%" }}>
                    <h1 style={{ fontSize: "40px", marginBottom: "20px" }}>🧙‍♂️</h1>
                    <h2 style={{ marginBottom: "20px" }}>{txt.pin_title}</h2>
                    <form onSubmit={handlePinSubmit}>
                        <input type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value)} placeholder="PIN" style={{ padding: "12px", borderRadius: "8px", border: "1px solid #444", background: "#000", color: "white", fontSize: "16px", marginBottom: "15px", width: "100%", textAlign: "center" }} autoFocus />
                        <button type="submit" className="cta-button" style={{ width: "100%", justifyContent: "center", fontSize: "16px", padding: "12px" }}>{txt.unlock}</button>
                    </form>
                    {authError && <p style={{ color: "#ef4444", marginTop: "15px" }}>{authError}</p>}
                    <div style={{ marginTop: "20px", borderTop: "1px solid #333", paddingTop: "20px" }}>
                       <button onClick={handleStartDemo} style={{ background: "none", border: "none", color: "#10b981", cursor: "pointer", fontSize: "14px", fontWeight: "bold" }}>{txt.cta_demo}</button>
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div style={{ padding: "40px", fontFamily: "sans-serif", backgroundColor: "#030712", minHeight: "100vh", color: "white", display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
            <style>{styles}</style>
            <button onClick={() => setCurrentView("landing")} style={{ position: "absolute", top: "20px", left: "20px", background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: "16px" }}>{txt.back}</button>
            <div style={{ position: "absolute", top: "20px", right: "20px", display: "flex", gap: "10px", background: "rgba(255,255,255,0.05)", padding: "5px", borderRadius: "20px" }}>
                <button onClick={() => setLanguage("cs")} className={`lang-btn ${language === "cs" ? "active" : ""}`}>CZ 🇨🇿</button>
                <button onClick={() => setLanguage("en")} className={`lang-btn ${language === "en" ? "active" : ""}`}>EN 🇬🇧</button>
            </div>
            
            <h1 style={{ marginTop: "40px", fontSize: "40px" }}>
                <span style={{color: "#06b6d4"}}>Data</span>Wizard 
                {isDemoMode && <span style={{fontSize: "14px", background: "#333", padding: "4px 10px", borderRadius: "10px", marginLeft: "10px", verticalAlign: "middle"}}>DEMO MODE</span>}
            </h1>
            
            <div {...getRootProps()} style={{ width: "100%", maxWidth: "600px", padding: "40px", border: "2px dashed #333", borderRadius: "12px", textAlign: "center", cursor: "pointer", backgroundColor: "rgba(255,255,255,0.02)", transition: "all 0.2s", marginTop: "40px" }}>
                {isDemoMode ? (
                     <div><div style={{ fontSize: "40px", marginBottom: "10px" }}>📄</div><p style={{ fontSize: "18px", color: "#10b981" }}>{fileName}</p></div>
                ) : (
                    <>
                        <input {...getInputProps()} />
                        {fileName ? (
                            <div><div style={{ fontSize: "40px", marginBottom: "10px" }}>📄</div><p style={{ fontSize: "18px", color: "#10b981" }}>{txt.drop_ready} {fileName}</p></div>
                        ) : (
                            <div><div style={{ fontSize: "40px", marginBottom: "10px" }}>📥</div><p style={{ color: "#aaa" }}>{txt.drop_hint}</p></div>
                        )}
                    </>
                )}
            </div>

            {fileName && (
                <button onClick={runAnalysis} disabled={loading} className="cta-button" style={{ marginTop: "30px", marginBottom: "0" }}>
                    {loading ? txt.analyzing : txt.get_insight}
                </button>
            )}
            
            {result && (
                <div style={{ marginTop: "40px", width: "100%", maxWidth: "800px" }}>
                    <div style={{ background: "#111", padding: "30px", borderRadius: "12px", border: "1px solid #333" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h3 style={{ marginTop: 0, color: "#10b981" }}>📊 Wizard Analysis</h3>
                            <button onClick={downloadReport} style={{ background: "#333", color: "#fff", border: "1px solid #555", padding: "8px 15px", borderRadius: "5px", cursor: "pointer" }}>{txt.download}</button>
                        </div>
                        <pre style={{ fontSize: "14px", marginTop: "20px", whiteSpace: "pre-wrap", fontFamily: "monospace", lineHeight: "1.6", color: "#ddd" }}>{result.result}</pre>
                        
                        {isDemoMode && (
                            <div style={{ marginTop: "30px", padding: "20px", background: "rgba(16, 185, 129, 0.05)", border: "1px solid #10b981", borderRadius: "12px", textAlign: "center" }}>
                                <h4 style={{ color: "white", marginBottom: "10px", fontSize: "18px" }}>{txt.upsell_title}</h4>
                                <p style={{ color: "#aaa", marginBottom: "20px", fontSize: "14px" }}>{txt.upsell_text}</p>
                                <button onClick={handleUpsellClick} className="cta-button" style={{ marginBottom: 0, fontSize: "16px", padding: "10px 25px" }}>
                                    {txt.cta_main} <span className="cta-arrow">→</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
  }

  return (
    <div className="landing-container">
        <style>{styles}</style>
        <div className="grid-overlay"></div>
        <div className="glow-orb-1"></div>
        <div className="glow-orb-2"></div>

        <header>
            <div className="logo">
                <div className="logo-icon">🧙‍♂️</div>
                <span className="logo-text">DataWizard</span>
            </div>
            <div className="lang-toggle">
                <button onClick={() => setLanguage("cs")} className={`lang-btn ${language === "cs" ? "active" : ""}`}>CZ 🇨🇿</button>
                <button onClick={() => setLanguage("en")} className={`lang-btn ${language === "en" ? "active" : ""}`}>EN 🇬🇧</button>
            </div>
        </header>

        <main>
            <div style={{textAlign: 'center'}}>
                <div className="badge">
                    <span className="badge-dot"></span>
                    <span className="badge-text">{txt.badge}</span>
                </div>
                
                <h1>
                    <span className="headline-white">{txt.h1_1}</span> <span className="headline-cyan">{txt.h1_2}</span><br/>
                    <span className="headline-white">{txt.h1_3}</span> <span className="headline-cyan">{txt.h1_4}</span>
                </h1>
                
                <p className="subhead" style={{margin: '0 auto 40px auto'}}>
                    {txt.subhead}
                </p>
                
                <div className="cta-container">
                    <button onClick={handleScrollToAccess} className="cta-button">
                        {txt.cta_main} <span className="cta-arrow">→</span>
                    </button>
                    <button onClick={handleStartDemo} className="cta-button secondary">
                        {txt.cta_demo}
                    </button>
                </div>
            </div>

            <div className="proof-section">
                <div className="proof-item"><span className="checkmark">✓</span> {txt.p1}</div>
                <div className="proof-item"><span className="checkmark">✓</span> {txt.p2}</div>
                <div className="proof-item"><span className="checkmark">✓</span> {txt.p3}</div>
                <div className="proof-item"><span className="checkmark">✓</span> {txt.p4}</div>
            </div>

            <section className="how-section">
                <h2 className="how-title" style={{textAlign: 'center'}}>{txt.how_title}</h2>
                <div className="steps-container">
                    <div className="step">
                        <div className="step-icon">📤</div>
                        <div className="step-title">{txt.s1_t}</div>
                        <div className="step-desc">{txt.s1_d}</div>
                    </div>
                    <div className="step-arrow">→</div>
                    <div className="step">
                        <div className="step-icon">🔍</div>
                        <div className="step-title">{txt.s2_t}</div>
                        <div className="step-desc">{txt.s2_d}</div>
                    </div>
                    <div className="step-arrow">→</div>
                    <div className="step">
                        <div className="step-icon">📊</div>
                        <div className="step-title">{txt.s3_t}</div>
                        <div className="step-desc">{txt.s3_d}</div>
                    </div>
                </div>
            </section>

            <section ref={accessSectionRef} className="cta-section">
                
                {!formSubmitted ? (
                    <form className="email-form" onSubmit={handleRequestAccess}>
                        <input 
                            type="email" 
                            className="email-input" 
                            placeholder={txt.email_ph} 
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                        />
                        <button type="submit" className="access-btn" disabled={loading}>
                            {loading ? txt.submitting : txt.cta_main} {!loading && <span className="cta-arrow">→</span>}
                        </button>
                    </form>
                ) : (
                    <div className="action-box">
                        <div className="action-title">✅ {txt.act_title}</div>
                        <div className="action-desc">{txt.act_desc}</div>
                        <p style={{color: "#10b981", fontSize: "16px", marginTop: "20px", fontFamily: "monospace"}}>
                          📧 {emailInput}
                        </p>
                    </div>
                )}
                
                
                
                <div className="already-pin">
                    {txt.already} 
                    <button onClick={() => setCurrentView("app")} className="enter-here-btn">{txt.enter}</button>
                </div>
            </section>

            <footer>
                <div className="footer-logo">{txt.footer_brand}</div>
                <div className="footer-tagline">{txt.footer_tag}</div>
            </footer>
        </main>
    </div>
  );
}