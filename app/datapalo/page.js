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
  clearAnonymousSession,
  ANONYMOUS_FREE_LIMIT
} from "../lib/anonymous-session";
import {
  checkTierLimits,
  canExport,
  canUseExaResearch,
  TIER_LIMITS
} from "../lib/tier-config";
import { getCurrentUsage, incrementUsage } from "../lib/supabase-client";

// ── GZIP COMPRESSION FOR LARGE CSV PAYLOADS ──
// Vercel serverless has a 4.5 MB body limit.
// PRO users can upload up to 10 MB CSV files.
// We gzip + base64 encode on the client so 10 MB CSV → ~1-2 MB payload.
async function compressCSV(csvText) {
  if (typeof CompressionStream === 'undefined') return null; // Safari < 16.4 fallback

  const readable = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(csvText));
      controller.close();
    }
  }).pipeThrough(new CompressionStream('gzip'));

  const reader = readable.getReader();
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const buffer = await new Blob(chunks).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Convert to base64 in chunks to avoid call-stack overflow on large buffers
  let binary = '';
  const CHUNK = 8192;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

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

    // ── 1. SIZE CHECK FIRST — before any auth/tier gates ──
    // This must run before signup wall so users see "file too large"
    // instead of "create account" when their file exceeds limits.
    const csvBytes = new Blob([csvData]).size;
    const currentTierForSize = user ? (syncedTier || profile?.tier || 'free') : 'anonymous';
    const isPro = currentTierForSize === 'pro';
    const MAX_CSV_BYTES = isPro
      ? 10 * 1024 * 1024     // PRO: 10 MB
      : 3.5 * 1024 * 1024;   // FREE / anonymous: 3.5 MB
    if (csvBytes > MAX_CSV_BYTES) {
      const sizeMB = (csvBytes / 1024 / 1024).toFixed(1);
      alert(isPro
        ? (language === "cs"
            ? `Soubor přesahuje PRO limit 10 MB (${sizeMB} MB). Zkuste prosím zmenšit soubor.`
            : `File exceeds the PRO limit of 10 MB (${sizeMB} MB). Please reduce the file size.`)
        : (language === "cs"
            ? `Soubor je příliš velký (${sizeMB} MB, ${rowCount.toLocaleString()} řádků). Zmenšete pod 10 000 řádků / 3.5 MB, nebo přejděte na PRO.`
            : `File too large (${sizeMB} MB, ${rowCount.toLocaleString()} rows). Reduce to under 10,000 rows / 3.5 MB or upgrade to PRO.`));
      return;
    }

    // ── 2. TIER / AUTH GATES ──
    if (user) {
      const tier = syncedTier || profile?.tier || 'free';
      const limits = checkTierLimits(tier, usage.analysis_count, rowCount);

      if (!limits.allowed) {
        setUpgradeReason(limits.reason);
        setUpgradeMessage(limits.message);
        setShowUpgradeModal(true);
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'upgrade_wall_shown', { reason: limits.reason });
        }
        return;
      }
    } else {
      // Anonymous user (not signed in) - check if they've used their free analyses
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

    // Track analysis event in GA4
    if (typeof window !== 'undefined' && window.gtag) {
      const currentTierForGA = syncedTier || profile?.tier || (user ? 'free' : 'anonymous');
      window.gtag('event', 'analyze_data', {
        tier: currentTierForGA,
        row_count: rowCount,
        language: language,
      });
    }

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

      // ── COMPRESS LARGE CSVs ──
      // Vercel serverless has a 4.5 MB body limit.
      // For CSVs > 3 MB, gzip + base64 encode to shrink the payload.
      // CSV compresses ~5-10x, so 10 MB → ~1-2 MB base64.
      const COMPRESS_THRESHOLD = 3 * 1024 * 1024; // 3 MB
      let requestBody;
      if (csvBytes > COMPRESS_THRESHOLD) {
        addLog(`Large CSV (${(csvBytes / 1024 / 1024).toFixed(1)} MB) — compressing...`);
        setLoadingStage(language === "cs"
          ? "Komprimuji velký soubor..."
          : "Compressing large file...");
        const compressed = await compressCSV(csvData);
        if (compressed) {
          addLog(`Compressed: ${(csvBytes / 1024 / 1024).toFixed(1)} MB → ${(compressed.length / 1024 / 1024).toFixed(1)} MB (base64)`);
          requestBody = JSON.stringify({
            message: question,
            csvDataCompressed: compressed,
            language: language,
            userId: user?.id,
          });
        } else {
          // CompressionStream not supported — send raw (may hit 4.5 MB limit)
          addLog("CompressionStream unavailable — sending uncompressed");
          requestBody = JSON.stringify({
            message: question,
            csvData: csvData,
            language: language,
            userId: user?.id,
          });
        }
      } else {
        requestBody = JSON.stringify({
          message: question,
          csvData: csvData,
          language: language,
          userId: user?.id,
        });
      }

      addLog("Calling /api/datapalo...");
      const res = await fetch("/api/datapalo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: requestBody,
      });

      // ── SAFE RESPONSE PARSING ──
      // Infrastructure errors (413 Too Large, 504 Timeout, etc.)
      // return plain text/HTML — not JSON. Guard against that.
      let data;
      const contentType = res.headers.get("content-type") || "";
      if (!res.ok && !contentType.includes("application/json")) {
        const raw = await res.text();
        addLog(`Non-JSON error (${res.status}): ${raw.substring(0, 200)}`);
        const tierLabel = currentTierForSize === 'pro' ? 'PRO' : 'FREE';
        const friendlyMsg = res.status === 413
          ? (language === "cs"
              ? `Soubor je příliš velký pro online zpracování (${rowCount.toLocaleString()} řádků). Zkuste zmenšit soubor pod 30 000 řádků — pracujeme na podpoře větších datasetů!`
              : `File is too large for online processing (${rowCount.toLocaleString()} rows). Please try under 30,000 rows — we're working on supporting larger datasets!`)
          : res.status === 504 || res.status === 524
            ? (language === "cs"
                ? "Analýza vypršela — soubor je příliš velký. Zkuste zmenšit počet řádků."
                : "Analysis timed out — the file is too large. Try reducing the number of rows.")
            : (language === "cs"
                ? `Chyba serveru (${res.status}). Zkuste to prosím znovu.`
                : `Server error (${res.status}). Please try again.`);
        alert(friendlyMsg);
        setLoading(false);
        setLoadingStage("");
        return;
      }

      try {
        data = await res.json();
      } catch (parseErr) {
        addLog(`JSON parse failed: ${parseErr.message}`);
        const fallbackMsg = language === "cs"
          ? "Server vrátil neočekávanou odpověď. Zkuste to prosím znovu."
          : "Server returned an unexpected response. Please try again.";
        alert(fallbackMsg);
        setLoading(false);
        setLoadingStage("");
        return;
      }

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
        addLog(`Anonymous upload ${count}/${ANONYMOUS_FREE_LIMIT} recorded`);

        // Gentle nudge after 2nd analysis — they've seen the value, now ask
        if (count >= ANONYMOUS_FREE_LIMIT) {
          setTimeout(() => setShowAuthModal(true), 3000);
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

  const [pdfGenerating, setPdfGenerating] = useState(false);

  const downloadPDF = async () => {
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
      setPdfGenerating(true);
      addLog("Generating PDF...");

      const res = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportData: parsedReport,
          fileName: parsedReport.title || "DataPalo_Report",
          language,
        }),
      });

      if (!res.ok) {
        const contentType = res.headers.get("content-type") || "";
        let errorMsg = `PDF generation failed (${res.status})`;
        if (contentType.includes("application/json")) {
          const err = await res.json();
          errorMsg = err.error || errorMsg;
        }
        throw new Error(errorMsg);
      }

      // Download the PDF blob
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `DataPalo_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addLog("PDF downloaded successfully");
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'export_pdf', { tier: syncedTier || profile?.tier || 'free' });
        }
    } catch (error) {
      addLog(`PDF error: ${error.message}`);
      alert(language === "cs"
        ? `Chyba při generování PDF: ${error.message}`
        : `Error generating PDF: ${error.message}`);
    } finally {
      setPdfGenerating(false);
    }
  };

  // Get tier info for display — use syncedTier as backup if profile fetch failed
  const tier = syncedTier || profile?.tier || 'free';
  const tierLimits = TIER_LIMITS[tier];
  const analysesRemaining = tierLimits.analysesPerMonth === Infinity
    ? '∞'
    : Math.max(0, tierLimits.analysesPerMonth - usage.analysis_count);

  return (
    <style jsx>{`
      @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Satoshi:wght@300;400;500;700;900&family=JetBrains+Mono:wght@400;500&display=swap');

      @keyframes fadeSlideUp {
        from { opacity: 0; transform: translateY(16px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.08); }
      }
      @keyframes scanLine {
        0% { top: 10%; }
        100% { top: 80%; }
      }
      @keyframes pulseSlow {
        0%, 100% { opacity: 0.5; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.05); }
      }
      @keyframes sparkle {
        0%, 100% { opacity: 0.3; transform: rotate(0deg) scale(0.9); }
        50% { opacity: 1; transform: rotate(15deg) scale(1.1); }
      }
      @keyframes bounceIn {
        0% { transform: scale(0); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `}</style>
    <div style={{ padding: "40px", fontFamily: "'Satoshi', -apple-system, BlinkMacSystemFont, sans-serif", background: "linear-gradient(168deg, #080818 0%, #0D0D2B 35%, #111133 65%, #0E0E28 100%)", minHeight: "100vh", color: "white", display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>

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
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          color: "rgba(255,255,255,0.5)", backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)", padding: "8px 16px",
          borderRadius: "10px", cursor: "pointer", fontSize: "14px",
          fontFamily: "'Satoshi', sans-serif", transition: "all 0.25s ease"
        }}
      >
        ← {language === "cs" ? "Zpět" : "Back"}
      </button>

      {/* TIER BADGE + USER INFO (top right) */}
      <div style={{ position: "absolute", top: "20px", right: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Language Toggle */}
        <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.04)", padding: "4px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            onClick={() => setLanguage("cs")}
            style={{
              background: language === "cs" ? "rgba(224, 103, 146, 0.15)" : "transparent",
              color: "white", border: language === "cs" ? "1px solid rgba(224, 103, 146, 0.25)" : "1px solid transparent", padding: "6px 14px", borderRadius: "16px", cursor: "pointer", fontWeight: "bold", fontSize: "0.75rem", fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase"
            }}
          >CZ</button>
          <button
            onClick={() => setLanguage("en")}
            style={{
              background: language === "en" ? "rgba(224, 103, 146, 0.15)" : "transparent",
              color: "white", border: language === "en" ? "1px solid rgba(224, 103, 146, 0.25)" : "1px solid transparent", padding: "6px 14px", borderRadius: "16px", cursor: "pointer", fontWeight: "bold", fontSize: "0.75rem", fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase"
            }}
          >EN</button>
        </div>

        {/* Tier Badge — show when user is signed in AND we have tier info from profile OR sync */}
        {user && (profile || syncedTier) && (
          <div style={{
            background: tier === 'pro' ? 'linear-gradient(135deg, #E06792 0%, #3F51B5 100%)' : 'rgba(255,255,255,0.08)',
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
              background: 'rgba(255,255,255,0.08)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.15)',
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
              color: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(255,255,255,0.1)',
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "10px" }}>
          <img src="/datapalo-logo.svg" alt="" style={{ width: "36px", height: "36px" }} />
          <h1 style={{
            fontSize: "2.2rem",
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontWeight: "400",
            letterSpacing: "-0.02em",
            margin: 0,
          }}>
            <span style={{ color: "#E06792" }}>Data</span>
            <span style={{ color: "rgba(255,255,255,0.92)" }}>Palo</span>
          </h1>
        </div>
        <p style={{
          color: "rgba(255,255,255,0.42)",
          marginBottom: "30px",
          fontFamily: "'Satoshi', sans-serif",
          fontSize: "1rem",
        }}>
          {language === "cs" ? "Nahrajte CSV nebo Excel. Získejte okamzite poznatky." : "Drop any CSV or Excel file. Get instant insights."}
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
                  disabled={pdfGenerating}
                  style={{
                    background: pdfGenerating
                      ? "#475569"
                      : canExport(tier, 'pdf')
                        ? "linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)"
                        : "#334155",
                    color: "#fff",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    cursor: pdfGenerating ? "wait" : "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    boxShadow: canExport(tier, 'pdf') && !pdfGenerating ? "0 4px 12px rgba(16, 185, 129, 0.3)" : "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    opacity: pdfGenerating ? 0.7 : 1,
                  }}
                >
                  {pdfGenerating
                    ? (language === "cs" ? "⏳ Generuji PDF..." : "⏳ Generating PDF...")
                    : (language === "cs" ? "📄 Stáhnout PDF" : "📄 Download PDF")}
                  {!canExport(tier, 'pdf') && !pdfGenerating && <span style={{ fontSize: '12px', opacity: 0.7 }}>🔒 PRO</span>}
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
      <div style={{ marginTop: "60px", textAlign: "center", color: "rgba(255,255,255,0.22)", fontSize: "14px", paddingBottom: "20px" }}>
        <p style={{ marginBottom: "8px" }}>
          {language === "cs" ? "Zpětná vazba? Nápady? Chcete spolupracovat?" : "Feedback? Ideas? Want to collaborate?"}
        </p>
        <a
          href="mailto:michael@forgecreative.cz?subject=DataPalo%20Feedback"
          style={{ color: "#E06792", textDecoration: "none", fontWeight: "600" }}
        >
          michael@forgecreative.cz
        </a>
        <p style={{ marginTop: "20px", fontSize: "12px", color: "rgba(255,255,255,0.12)" }}>
          FORGE CREATIVE | AI Job Agency
        </p>
      </div>
    </div>
  );
}
