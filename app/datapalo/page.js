"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import ReportInterface from "../components/ReportInterface";
import UpgradeModal from "../components/UpgradeModal";
import AuthModal from "../components/AuthModal";
import { markdownToReportJson } from "../lib/markdown-transformer";
import { useAuth } from "../lib/auth-context";
import {
  incrementAnonymousUpload,
  shouldShowSignupWall,
  clearAnonymousSession
} from "../lib/anonymous-session";
import {
  checkTierLimits,
  canExport,
  canUseExaResearch,
  TIER_LIMITS
} from "../lib/tier-config";
import { getCurrentUsage, incrementUsage } from "../lib/supabase-client";

export default function Home() {
  // Auth state
  const { user, profile, loading: authLoading, signOut, refreshProfile } = useAuth();

  // File state
  const [csvData, setCsvData] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [rowCount, setRowCount] = useState(0);

  // Analysis state
  const [result, setResult] = useState(null);
  const [parsedReport, setParsedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");

  // Exa Research state
  const [researchAugmented, setResearchAugmented] = useState(false);
  const [exaInsightsCount, setExaInsightsCount] = useState(0);
  const [exaDiagnostics, setExaDiagnostics] = useState(null);

  // Modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState(null);
  const [upgradeMessage, setUpgradeMessage] = useState("");

  // Usage tracking
  const [usage, setUsage] = useState({ analysis_count: 0, total_rows_processed: 0 });

  // Synced tier from Stripe (local backup in case fetchProfile fails)
  const [syncedTier, setSyncedTier] = useState(null);
  const syncInProgressRef = useRef(false);

  // UI state
  const [language, setLanguage] = useState("cs");

  const addLog = (msg) => console.log(`[DataPalo] ${msg}`);

  // Sync tier from Stripe — runs once per mount for signed-in users.
  // Uses a ref to prevent duplicate calls and a local state backup
  // so the page works even if fetchProfile() fails on the client.
  useEffect(() => {
    async function syncTier() {
      if (!user || authLoading) return;
      if (syncInProgressRef.current) return; // Prevent parallel calls

      const isCheckoutReturn = typeof window !== 'undefined' && window.location.search.includes('success=true');
      // Treat null profile OR free tier as needing sync
      const currentTier = profile?.tier;
      const isFree = !currentTier || currentTier === 'free';

      // Already PRO in both profile and local backup — skip
      if (!isCheckoutReturn && !isFree && syncedTier === 'pro') return;

      // Need sync: either checkout return, free tier, OR no profile loaded yet
      if (isCheckoutReturn || isFree) {
        syncInProgressRef.current = true;
        try {
          addLog(`Syncing tier from Stripe (profile.tier=${currentTier}, syncedTier=${syncedTier})...`);
          const res = await fetch('/api/stripe/sync-tier', { method: 'POST' });
          const data = await res.json();
          addLog(`Sync result: ${JSON.stringify(data)}`);
          if (data.tier === 'pro') {
            addLog('Tier synced to PRO from Stripe');
            setSyncedTier('pro'); // Local backup — works even if refreshProfile fails
            // Try to refresh profile from DB, but don't depend on it
            refreshProfile().catch(() => {});
            if (isCheckoutReturn) {
              window.history.replaceState({}, '', '/datapalo');
            }
          } else {
            setSyncedTier(data.tier || 'free');
          }
        } catch (err) {
          console.error('Tier sync error:', err);
        } finally {
          syncInProgressRef.current = false;
        }
      }
    }
    syncTier();
  }, [user, authLoading, profile?.tier]);

  // Load user's usage on mount and when profile changes
  useEffect(() => {
    async function loadUsage() {
      if (user && profile) {
        try {
          const currentUsage = await getCurrentUsage(user.id);
          setUsage(currentUsage);
          addLog(`Usage loaded: ${currentUsage.analysis_count} analyses this month`);
        } catch (error) {
          console.error('Error loading usage:', error);
        }
      }
    }
    loadUsage();
  }, [user, profile]);

  // Clear anonymous session after signup
  useEffect(() => {
    if (user) clearAnonymousSession();
  }, [user]);

  // Handle File Drop
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    setFileName(file.name);
    addLog(`File selected: ${file.name}`);

    const reader = new FileReader();
    reader.onload = (e) => {
      const binaryStr = e.target.result;
      const workbook = XLSX.read(binaryStr, { type: "binary" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const csvText = XLSX.utils.sheet_to_csv(worksheet);

      const rows = csvText.split('\n').filter(row => row.trim());
      const totalRows = rows.length - 1;

      setCsvData(csvText);
      setRowCount(totalRows);
      addLog(`File parsed. ${totalRows.toLocaleString()} rows detected`);
    };
    reader.readAsBinaryString(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    }
  });

  async function runAnalysis() {
    if (!csvData) {
      return alert(language === "cs" ? "Nejprve nahrajte soubor!" : "Please upload a file first!");
    }

    // Wait for auth to finish loading before deciding user vs anonymous
    if (authLoading) {
      addLog('Auth still loading, please wait...');
      return;
    }

    // TIER LOGIC: Check limits BEFORE running analysis
    if (user) {
      const tier = syncedTier || profile?.tier || 'free';
      const limits = checkTierLimits(tier, usage.analysis_count, rowCount);

      if (!limits.allowed) {
        setUpgradeReason(limits.reason);
        setUpgradeMessage(limits.message);
        setShowUpgradeModal(true);
        return;
      }
    } else {
      // Anonymous user (not signed in) - check if this would be 2nd upload
      if (shouldShowSignupWall(false)) {
        setShowAuthModal(true);
        return;
      }
    }

    // Proceed with analysis
    setLoading(true);
    setResult(null);
    setParsedReport(null);
    setResearchAugmented(false);
    setExaInsightsCount(0);
    setExaDiagnostics(null);

    setLoadingStage(language === "cs"
      ? `Načítám ${rowCount.toLocaleString()} řádků...`
      : `Reading ${rowCount.toLocaleString()} rows...`);
    addLog("Starting analysis...");

    const question = language === "cs"
      ? "Analyzuj tato data. Řekni mi nejdůležitější trendy, součty a odlehlé hodnoty."
      : "Analyze this data. Tell me the most important trends, totals, or outliers.";

    // Determine if user has PRO Exa access for loading stage messaging
    const currentTier = syncedTier || profile?.tier || 'free';
    const hasExaAccess = canUseExaResearch(currentTier);

    try {
      // Stage 2: Statistical Aggregation
      setTimeout(() => {
        setLoadingStage(language === "cs"
          ? "Provádím statistickou agregaci..."
          : "Performing statistical aggregation...");
      }, 1000);

      if (hasExaAccess) {
        // Stage 3: Exa Research (PRO only)
        setTimeout(() => {
          setLoadingStage(language === "cs"
            ? "🔍 Automaticky hledám průmyslové benchmarky a trendy..."
            : "🔍 Auto-fetching industry benchmarks & market trends...");
        }, 3000);

        // Stage 4: AI Insights with Research Context
        setTimeout(() => {
          setLoadingStage(language === "cs"
            ? "✨ Generuji analýzu s externím kontextem..."
            : "✨ Generating analysis with external research context...");
        }, 5000);
      } else {
        // Stage 3: Basic AI (FREE)
        setTimeout(() => {
          setLoadingStage(language === "cs"
            ? "Generuji AI analýzu..."
            : "Generating AI insights...");
        }, 3000);
      }

      addLog("Calling /api/datapalo...");
      const res = await fetch("/api/datapalo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question,
          csvData: csvData,
          language: language,
          userId: user?.id,
        }),
      });
      const data = await res.json();

      // Handle 403: upgrade required (from server-side tier check)
      if (res.status === 403 && data.requiresUpgrade) {
        setUpgradeReason(data.reason);
        setUpgradeMessage(data.error);
        setShowUpgradeModal(true);
        setLoading(false);
        setLoadingStage("");
        return;
      }

      // Handle 401: auth required
      if (res.status === 401 && data.requiresAuth) {
        setShowAuthModal(true);
        setLoading(false);
        setLoadingStage("");
        return;
      }

      if (data.error) {
        alert(data.error);
        setLoading(false);
        setLoadingStage("");
        return;
      }

      addLog(`API response received. Result length: ${data.result?.length || 0}`);

      // Store EXA diagnostics
      if (data.exa_diagnostics) {
        setExaDiagnostics(data.exa_diagnostics);
        addLog(`Exa diagnostics: ${data.exa_diagnostics.status}`);
      }

      // Check if research augmentation was used
      if (data.research_augmented) {
        setResearchAugmented(true);
        setExaInsightsCount(data.exa_insights?.length || 0);
        addLog(`Research-augmented: ${data.exa_insights?.length || 0} insights found`);
      }

      setResult(data.result);

      // Parse the markdown into structured data
      addLog("Parsing markdown to report...");
      const reportData = markdownToReportJson(data.result);
      addLog(`Parse complete: Charts=${reportData?.charts?.length || 0}, Metrics=${reportData?.metrics?.length || 0}`);

      setParsedReport(reportData);

      // USAGE TRACKING: Increment counters AFTER successful analysis
      if (user) {
        try {
          await incrementUsage(user.id, rowCount);
          const newUsage = await getCurrentUsage(user.id);
          setUsage(newUsage);
          addLog(`Usage updated: ${newUsage.analysis_count} analyses`);
        } catch (error) {
          console.error('Error updating usage:', error);
        }
      } else {
        // Anonymous (not signed in) - increment localStorage counter
        const count = incrementAnonymousUpload();
        addLog(`Anonymous upload ${count} recorded`);

        // Show signup wall after first analysis completes
        if (count === 1) {
          setTimeout(() => setShowAuthModal(true), 2000);
        }
      }

    } catch (e) {
      addLog(`ERROR: ${e.message}`);
      alert("Error: " + e.message);
    }
    setLoading(false);
    setLoadingStage("");
  }

  const downloadReport = () => {
    if (!result) return;
    const element = document.createElement("a");
    const file = new Blob([result], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `DataPalo_Report_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(element);
    element.click();
  };

  const downloadPDF = () => {
    if (!parsedReport) return;

    // Check if user has PRO tier for PDF export
    const tier = syncedTier || profile?.tier || 'free';
    if (!canExport(tier, 'pdf')) {
      setUpgradeReason('pdf_export');
      setUpgradeMessage(
        language === 'cs'
          ? 'Export PDF je dostupný pouze pro PRO uživatele. Přejděte na PRO pro neomezené exporty.'
          : 'PDF export is only available for PRO users. Upgrade to PRO for unlimited exports.'
      );
      setShowUpgradeModal(true);
      return;
    }

    try {
      const printUrl = `${window.location.origin}/datapalo/print`;
      const printWindow = window.open(printUrl, "_blank");

      if (!printWindow) {
        alert(language === "cs"
          ? "Povolte vyskakovací okna pro tisk PDF"
          : "Please allow pop-ups to open print preview");
        return;
      }

      const handleMessage = (event) => {
        if (event.data?.type === "PRINT_PAGE_READY") {
          addLog("Print window ready, sending data...");
          printWindow.postMessage({
            type: "DATAWIZARD_PRINT_DATA",
            data: parsedReport,
            language: language
          }, "*");
          window.removeEventListener("message", handleMessage);
        }
      };

      window.addEventListener("message", handleMessage);
      localStorage.setItem("datapalo_print_data", JSON.stringify(parsedReport));
      localStorage.setItem("datapalo_print_language", language);
      addLog("Opening print preview...");
    } catch (error) {
      addLog(`Error: ${error.message}`);
      alert(language === "cs" ? "Chyba při otevírání náhledu tisku" : "Error opening print preview");
    }
  };

  // Get tier info for display — use syncedTier as backup if profile fetch failed
  const tier = syncedTier || profile?.tier || 'free';
  const tierLimits = TIER_LIMITS[tier];
  const analysesRemaining = tierLimits.analysesPerMonth === Infinity
    ? '∞'
    : Math.max(0, tierLimits.analysesPerMonth - usage.analysis_count);

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", backgroundColor: "#0f172a", minHeight: "100vh", color: "white", display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        language={language}
      />

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason={upgradeReason}
        message={upgradeMessage}
        language={language}
      />

      {/* BACK TO HOME */}
      <button
        onClick={() => window.location.href = '/'}
        style={{
          position: "absolute", top: "20px", left: "20px",
          background: "none", border: "1px solid rgba(255,255,255,0.2)",
          color: "rgba(255,255,255,0.7)", padding: "8px 16px",
          borderRadius: "8px", cursor: "pointer", fontSize: "14px"
        }}
      >
        ← {language === "cs" ? "Zpět" : "Back"}
      </button>

      {/* TIER BADGE + USER INFO (top right) */}
      <div style={{ position: "absolute", top: "20px", right: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Language Toggle */}
        <div style={{ display: "flex", gap: "4px", background: "#1e293b", padding: "4px", borderRadius: "20px" }}>
          <button
            onClick={() => setLanguage("cs")}
            style={{
              background: language === "cs" ? "#3b82f6" : "transparent",
              color: "white", border: "none", padding: "6px 14px", borderRadius: "16px", cursor: "pointer", fontWeight: "bold", fontSize: "13px"
            }}
          >CZ 🇨🇿</button>
          <button
            onClick={() => setLanguage("en")}
            style={{
              background: language === "en" ? "#3b82f6" : "transparent",
              color: "white", border: "none", padding: "6px 14px", borderRadius: "16px", cursor: "pointer", fontWeight: "bold", fontSize: "13px"
            }}
          >EN 🇬🇧</button>
        </div>

        {/* Tier Badge — show when user is signed in AND we have tier info from profile OR sync */}
        {user && (profile || syncedTier) && (
          <div style={{
            background: tier === 'pro' ? 'linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)' : '#64748b',
            color: 'white',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>{tier.toUpperCase()}</span>
            <span style={{ opacity: 0.8 }}>•</span>
            <span>{analysesRemaining} {language === 'cs' ? 'zbývá' : 'left'}</span>
          </div>
        )}

        {/* Sign In / Sign Out button */}
        {!user && !authLoading && (
          <button
            onClick={() => setShowAuthModal(true)}
            style={{
              background: '#334155',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            {language === 'cs' ? 'Přihlásit se' : 'Sign In'}
          </button>
        )}
        {user && (
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
              background: 'none',
              color: '#94a3b8',
              border: '1px solid #334155',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            {language === 'cs' ? 'Odhlásit' : 'Sign Out'}
          </button>
        )}
      </div>

      {/* HEADER */}
      <div style={{ marginTop: "40px", textAlign: "center" }}>
        <h1 style={{ marginBottom: "10px", fontSize: "2.2rem" }}>
          <span style={{ color: "#0ea5e9" }}>Data</span><span style={{ fontWeight: "bold", color: "white" }}>Palo</span>
        </h1>
        <p style={{ color: "#64748b", marginBottom: "30px" }}>
          {language === "cs" ? "Vložte CSV nebo Excel. Získejte okamžité výsledky." : "Drop any CSV or Excel file. Get instant insights."}
        </p>
      </div>

      {/* DROP ZONE */}
      <div {...getRootProps()} style={{
        width: "100%", maxWidth: "550px", padding: "50px 40px",
        border: "2px dashed #334155", borderRadius: "16px",
        textAlign: "center", cursor: "pointer",
        backgroundColor: isDragActive ? "#1e293b" : "transparent",
        transition: "all 0.2s"
      }}>
        <input {...getInputProps()} />
        {fileName ? (
          <div>
            <div style={{ fontSize: "48px", marginBottom: "15px" }}>📄</div>
            <p style={{ fontSize: "18px", color: "#10b981", fontWeight: "600" }}>{language === "cs" ? "Připraveno:" : "Ready:"} {fileName}</p>
            <p style={{ fontSize: "15px", color: "#0ea5e9", marginTop: "8px", fontWeight: "600" }}>
              {rowCount.toLocaleString()} {language === "cs" ? "řádků" : "rows"}
            </p>
            <p style={{ fontSize: "13px", color: "#475569", marginTop: "8px" }}>{language === "cs" ? "Klikněte na tlačítko níže pro analýzu" : "Click the button below to analyze"}</p>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: "48px", marginBottom: "15px" }}>📥</div>
            <p style={{ color: "#94a3b8", fontSize: "16px" }}>{language === "cs" ? "Přetáhněte soubor sem nebo klikněte" : "Drag & drop a file here, or click"}</p>
            <p style={{ fontSize: "13px", color: "#475569", marginTop: "10px" }}>CSV, Excel (.xlsx)</p>
          </div>
        )}
      </div>

      {/* ANALYZE BUTTON */}
      {fileName && (
        <button
          onClick={runAnalysis}
          disabled={loading}
          style={{
            marginTop: "25px", padding: "16px 50px", fontSize: "17px",
            background: loading ? "#475569" : "linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)",
            color: "white", border: "none", borderRadius: "30px", cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "bold", boxShadow: "0 4px 20px rgba(16, 185, 129, 0.3)",
            transition: "all 0.2s"
          }}
        >
          {loading
            ? `✨ ${loadingStage}`
            : (language === "cs" ? "✨ Analyzovat" : "✨ Analyze")}
        </button>
      )}

      {/* RESULTS */}
      {parsedReport && (
        <div style={{ marginTop: "40px", width: "100%", maxWidth: "1200px" }}>

          {/* Exa Diagnostic Banner (shows when Exa had issues or is PRO-only) */}
          {exaDiagnostics && exaDiagnostics.status !== "success" && (
            <div style={{
              background: exaDiagnostics.status === "pro_only" ? "#1e1b4b" : exaDiagnostics.status === "not_configured" ? "#1e293b" : "#451a03",
              padding: "12px 20px",
              borderRadius: "10px",
              marginBottom: "12px",
              border: `1px solid ${exaDiagnostics.status === "pro_only" ? "#4338ca" : exaDiagnostics.status === "not_configured" ? "#334155" : "#92400e"}`,
              fontSize: "13px"
            }}>
              <div style={{ fontWeight: "bold", marginBottom: "4px", color: exaDiagnostics.status === "pro_only" ? "#a78bfa" : exaDiagnostics.status === "not_configured" ? "#94a3b8" : "#fbbf24" }}>
                {exaDiagnostics.status === "pro_only" && (language === "cs"
                  ? "🔒 Research-Augmented Analysis je PRO funkce"
                  : "🔒 Research-Augmented Analysis is a PRO feature")}
                {exaDiagnostics.status === "not_configured" && "ℹ️ EXA Research: Not configured"}
                {exaDiagnostics.status === "error" && `⚠️ EXA Research: Error — ${exaDiagnostics.error}`}
                {exaDiagnostics.status === "empty" && "⚠️ EXA Research: No results found"}
                {exaDiagnostics.status === "skipped" && "ℹ️ EXA Research: Skipped"}
              </div>
              <div style={{ color: "#94a3b8", fontSize: "12px" }}>
                {exaDiagnostics.status === "pro_only"
                  ? (language === "cs"
                    ? "Přejděte na PRO pro průmyslové benchmarky, tržní trendy a citované zdroje."
                    : "Upgrade to PRO for industry benchmarks, market trends, and cited sources.")
                  : (exaDiagnostics.hint || exaDiagnostics.reason || "")}
              </div>
              {exaDiagnostics.status === "pro_only" && (
                <button
                  onClick={() => {
                    setUpgradeReason('exa_research');
                    setUpgradeMessage(language === "cs"
                      ? "Odemkněte Research-Augmented Analysis s DataPalo PRO. Vaše analýzy budou obohaceny o průmyslové benchmarky, tržní trendy a citované zdroje z Exa.ai."
                      : "Unlock Research-Augmented Analysis with DataPalo PRO. Your analyses will be enriched with industry benchmarks, market trends, and cited sources from Exa.ai.");
                    setShowUpgradeModal(true);
                  }}
                  style={{
                    marginTop: "8px",
                    background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
                    color: "white",
                    border: "none",
                    padding: "6px 16px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  {language === "cs" ? "🚀 Upgradovat na PRO" : "🚀 Upgrade to PRO"}
                </button>
              )}
            </div>
          )}

          {/* Research Augmentation Badge (shows when Exa successfully enriched the analysis) */}
          {researchAugmented && (
            <div style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
              padding: "16px 24px",
              borderRadius: "12px",
              marginBottom: "16px",
              boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <span style={{ fontSize: "24px" }}>🔍</span>
                <div>
                  <div style={{ fontWeight: "bold", fontSize: "16px" }}>
                    ✨ Research-Augmented Analysis
                  </div>
                  <div style={{ fontSize: "13px", opacity: 0.9 }}>
                    {language === "cs"
                      ? `Obohaceno o ${exaInsightsCount} externí${exaInsightsCount === 1 ? ' zdroj' : exaInsightsCount < 5 ? ' zdroje' : ' zdrojů'} z Exa.ai`
                      : `Enriched with ${exaInsightsCount} external insight${exaInsightsCount === 1 ? '' : 's'} from Exa.ai`
                    }
                  </div>
                </div>
              </div>
              <div style={{ fontSize: "12px", opacity: 0.95, marginLeft: "36px", lineHeight: "1.8" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>✅ {language === "cs" ? "Srovnání s průmyslem" : "Industry benchmarks"}</div>
                  <div>✅ {language === "cs" ? "Tržní trendy" : "Market trends"}</div>
                  <div>✅ {language === "cs" ? "Externí kontext" : "External research context"}</div>
                  <div>✅ {language === "cs" ? "Citované zdroje" : "Cited sources"}</div>
                </div>
              </div>
            </div>
          )}

          {/* Report Card */}
          <div style={{ background: "#1e293b", padding: "30px", borderRadius: "16px", border: "1px solid #334155" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
              <h3 style={{ margin: 0, color: "#10b981", fontSize: "1.3rem" }}>📊 {language === "cs" ? "Výsledky Analýzy" : "Analysis Results"}</h3>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={downloadPDF}
                  style={{
                    background: canExport(tier, 'pdf')
                      ? "linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)"
                      : "#334155",
                    color: "#fff",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    boxShadow: canExport(tier, 'pdf') ? "0 4px 12px rgba(16, 185, 129, 0.3)" : "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  {language === "cs" ? "📄 Stáhnout PDF" : "📄 Download PDF"}
                  {!canExport(tier, 'pdf') && <span style={{ fontSize: '12px', opacity: 0.7 }}>🔒 PRO</span>}
                </button>
                <button
                  onClick={downloadReport}
                  style={{ background: "#334155", color: "#fff", border: "1px solid #475569", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}
                >
                  {language === "cs" ? "📝 Stáhnout TXT" : "📝 Download TXT"}
                </button>
              </div>
            </div>
            <ReportInterface data={parsedReport} />
          </div>
        </div>
      )}

      {/* FALLBACK: Raw output if parsing failed */}
      {result && !parsedReport && (
        <div style={{ marginTop: "40px", width: "100%", maxWidth: "900px" }}>
          <div style={{ background: "#1e293b", padding: "30px", borderRadius: "16px", border: "1px solid #334155" }}>
            <h3 style={{ marginTop: 0, color: "#f59e0b" }}>⚠️ {language === "cs" ? "Textový výstup" : "Text Output"}</h3>
            <pre style={{ fontSize: "14px", whiteSpace: "pre-wrap", fontFamily: "monospace", lineHeight: "1.6", color: "#94a3b8" }}>
              {result}
            </pre>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div style={{ marginTop: "60px", textAlign: "center", color: "#475569", fontSize: "14px", paddingBottom: "20px" }}>
        <p style={{ marginBottom: "8px" }}>
          {language === "cs" ? "Zpětná vazba? Nápady? Chcete spolupracovat?" : "Feedback? Ideas? Want to collaborate?"}
        </p>
        <a
          href="mailto:michael@forgecreative.cz?subject=DataPalo%20Feedback"
          style={{ color: "#0ea5e9", textDecoration: "none", fontWeight: "600" }}
        >
          michael@forgecreative.cz
        </a>
        <p style={{ marginTop: "20px", fontSize: "12px", color: "#334155" }}>
          FORGE CREATIVE | AI Job Agency
        </p>
      </div>
    </div>
  );
}
