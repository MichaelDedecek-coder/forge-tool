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
  const { user, profile, loading: authLoading, signOut, refreshProfile, getAccessToken } = useAuth();

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
  const [language, setLanguage] = useState("en");
  const [demoPhase, setDemoPhase] = useState(0); // 0=idle, 1=reading, 2=patterns, 3=insights, 4=reveal
  const [demoMetrics, setDemoMetrics] = useState({ revenue: 0, growth: 0, margin: 0 });
  const demoTimersRef = useRef([]);
  const countingRef = useRef(null);
  const [processingStep, setProcessingStep] = useState(0);
  const demoRunCountRef = useRef(0);

  // ── DEMO: Staged Reveal Logic ──
  const startDemo = useCallback(() => {
    demoTimersRef.current.forEach(t => clearTimeout(t));
    demoTimersRef.current = [];
    if (countingRef.current) cancelAnimationFrame(countingRef.current);

    demoRunCountRef.current += 1;
    setDemoMetrics({ revenue: 0, growth: 0, margin: 0 });
    setDemoPhase(1);

    demoTimersRef.current.push(setTimeout(() => setDemoPhase(2), 1500));
    demoTimersRef.current.push(setTimeout(() => setDemoPhase(3), 3000));
    demoTimersRef.current.push(setTimeout(() => {
      setDemoPhase(4);
      const startTime = performance.now();
      const duration = 1200;
      const targets = { revenue: 142847, growth: 12.3, margin: 34.2 };

      const animate = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);

        setDemoMetrics({
          revenue: Math.round(targets.revenue * eased),
          growth: Math.round(targets.growth * eased * 10) / 10,
          margin: Math.round(targets.margin * eased * 10) / 10,
        });

        if (progress < 1) {
          countingRef.current = requestAnimationFrame(animate);
        }
      };
      countingRef.current = requestAnimationFrame(animate);
    }, 4500));
  }, []);

  const resetDemo = useCallback(() => {
    demoTimersRef.current.forEach(t => clearTimeout(t));
    demoTimersRef.current = [];
    if (countingRef.current) cancelAnimationFrame(countingRef.current);
    setDemoPhase(0);
    setDemoMetrics({ revenue: 0, growth: 0, margin: 0 });
  }, []);

  useEffect(() => {
    return () => {
      demoTimersRef.current.forEach(t => clearTimeout(t));
      if (countingRef.current) cancelAnimationFrame(countingRef.current);
    };
  }, []);

  // Error card state
  const [errorState, setErrorState] = useState(null);

  const showError = (type, title, message, actions = []) => {
    setErrorState({ type, title, message, actions });
  };
  const clearError = () => setErrorState(null);

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
    clearError();
    const file = acceptedFiles[0];
    setFileName(file.name);
    addLog(`File selected: ${file.name}`);

    const reader = new FileReader();
    reader.onload = (e) => {
      const binaryStr = e.target.result;
      const workbook = XLSX.read(binaryStr, { type: "binary" });

      // Smart sheet selection: pick the sheet with the most data
      let bestSheet = workbook.SheetNames[0];
      if (workbook.SheetNames.length > 1) {
        let maxRows = 0;
        for (const name of workbook.SheetNames) {
          const ws = workbook.Sheets[name];
          const ref = ws['!ref'];
          if (!ref) continue;
          const range = XLSX.utils.decode_range(ref);
          const sheetRows = range.e.r - range.s.r + 1;
          if (sheetRows > maxRows) {
            maxRows = sheetRows;
            bestSheet = name;
          }
        }
        console.log(`📊 Multi-sheet file: ${workbook.SheetNames.length} sheets. Using "${bestSheet}" (${maxRows} rows)`);
      }

      const worksheet = workbook.Sheets[bestSheet];
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
      showError('red',
        language === "cs" ? "Žádný soubor" : "No file selected",
        language === "cs" ? "Nejprve nahrajte soubor!" : "Please upload a file first!",
        [{ label: language === "cs" ? "Vybrat soubor" : "Choose a file", onClick: () => { clearError(); document.querySelector('[data-dropzone]')?.click(); } }]
      );
      return;
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
      showError('yellow',
        language === "cs" ? "Soubor je příliš velký" : "File too large",
        isPro
          ? (language === "cs"
              ? `Soubor přesahuje PRO limit 10 MB (${sizeMB} MB). Zkuste prosím zmenšit soubor.`
              : `File exceeds the PRO limit of 10 MB (${sizeMB} MB). Please reduce the file size.`)
          : (language === "cs"
              ? `Soubor je příliš velký (${sizeMB} MB, ${rowCount.toLocaleString()} řádků). Zmenšete pod 10 000 řádků / 3.5 MB, nebo přejděte na PRO.`
              : `File too large (${sizeMB} MB, ${rowCount.toLocaleString()} rows). Reduce to under 10,000 rows / 3.5 MB or upgrade to PRO.`),
        [
          { label: language === "cs" ? "Zkusit menší soubor" : "Try a smaller file", onClick: () => { clearError(); document.querySelector('[data-dropzone]')?.click(); } },
          ...(!isPro ? [{ label: language === "cs" ? "Zobrazit PRO plány" : "See PRO plans", onClick: () => { clearError(); setShowUpgradeModal(true); } }] : []),
        ]
      );
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
    setProcessingStep(1);
    setResult(null);
    setParsedReport(null);
    setResearchAugmented(false);
    setExaInsightsCount(0);
    setExaDiagnostics(null);

    // Processing step transitions
    setTimeout(() => setProcessingStep(2), 1500);
    setTimeout(() => setProcessingStep(3), 3000);

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
      // Get auth token for server-side identity verification
      const accessToken = await getAccessToken();
      const headers = { "Content-Type": "application/json" };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }
      const res = await fetch("/api/datapalo", {
        method: "POST",
        headers,
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
        showError(
          res.status === 413 || res.status === 504 || res.status === 524 ? 'yellow' : 'blue',
          language === "cs" ? "Chyba serveru" : "Server error",
          friendlyMsg,
          [{ label: language === "cs" ? "Zkusit znovu" : "Try again", onClick: () => { clearError(); runAnalysis(); } }]
        );
        setLoading(false);
        setProcessingStep(0);
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
        showError('blue',
          language === "cs" ? "Neočekávaná odpověď" : "Unexpected response",
          fallbackMsg,
          [{ label: language === "cs" ? "Zkusit znovu" : "Try again", onClick: () => { clearError(); runAnalysis(); } }]
        );
        setLoading(false);
        setProcessingStep(0);
        setLoadingStage("");
        return;
      }

      // Handle 403: upgrade required (from server-side tier check)
      if (res.status === 403 && data.requiresUpgrade) {
        setUpgradeReason(data.reason);
        setUpgradeMessage(data.error);
        setShowUpgradeModal(true);
        setLoading(false);
        setProcessingStep(0);
        setLoadingStage("");
        return;
      }

      // Handle 401: auth required
      if (res.status === 401 && data.requiresAuth) {
        setShowAuthModal(true);
        setLoading(false);
        setProcessingStep(0);
        setLoadingStage("");
        return;
      }

      if (data.error) {
        showError('red',
          language === "cs" ? "Chyba analýzy" : "Analysis error",
          data.error,
          [{ label: language === "cs" ? "Zkusit znovu" : "Try again", onClick: () => { clearError(); runAnalysis(); } }]
        );
        setLoading(false);
        setProcessingStep(0);
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

      setProcessingStep(4);
      await new Promise(r => setTimeout(r, 800));

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
      showError('red',
        language === "cs" ? "Něco se pokazilo" : "Something went wrong",
        e.message,
        [{ label: language === "cs" ? "Zkusit znovu" : "Try again", onClick: () => { clearError(); runAnalysis(); } }]
      );
    }
    setLoading(false);
    setProcessingStep(0);
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
      showError('red',
        language === "cs" ? "Chyba PDF" : "PDF error",
        language === "cs"
          ? `Chyba při generování PDF: ${error.message}`
          : `Error generating PDF: ${error.message}`,
        [{ label: language === "cs" ? "Zkusit znovu" : "Try again", onClick: () => { clearError(); } }]
      );
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
    <div style={{ padding: "40px 16px", fontFamily: "'Satoshi', -apple-system, BlinkMacSystemFont, sans-serif", background: "linear-gradient(168deg, #080818 0%, #0D0D2B 35%, #111133 65%, #0E0E28 100%)", minHeight: "100vh", color: "white", display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
      <style dangerouslySetInnerHTML={{ __html: `
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
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(224, 103, 146, 0.2); }
          50% { box-shadow: 0 0 40px rgba(224, 103, 146, 0.4), 0 0 60px rgba(63, 81, 181, 0.2); }
        }
        @keyframes countFadeIn {
          from { opacity: 0; transform: scale(0.8) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes barGrow {
          from { height: 0%; }
        }
        @keyframes blurReveal {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes cardSlideIn {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes cardBlur {
          from { filter: blur(0px); }
          to { filter: blur(6px); }
        }
      ` }} />

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

      {/* TOP NAV BAR */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        width: "100%", maxWidth: "1200px", marginBottom: "0px",
        flexWrap: "wrap", gap: "10px",
      }}>
      {/* BACK TO HOME */}
      <button
        onClick={() => window.location.href = '/'}
        style={{
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          color: "rgba(255,255,255,0.5)", backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)", padding: "8px 16px",
          borderRadius: "10px", cursor: "pointer", fontSize: "14px",
          fontFamily: "'Satoshi', sans-serif", transition: "all 0.25s ease",
          whiteSpace: "nowrap",
        }}
      >
        ← {language === "cs" ? "Zpět" : "Back"}
      </button>

      {/* TIER BADGE + USER INFO */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
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
      </div>

      {/* HEADER */}
      <div style={{ marginTop: "24px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "10px" }}>
          <img src="/datapalo-logo.svg" alt="" style={{ width: "36px", height: "36px" }} />
          <h1 style={{
            fontSize: "clamp(1.8rem, 6vw, 2.2rem)",
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
          color: "rgba(255,255,255,0.7)",
          marginBottom: "30px",
          fontFamily: "'Satoshi', sans-serif",
          fontSize: "1rem",
        }}>
          {language === "cs" ? "Nahrajte CSV nebo Excel. Získejte okamžité poznatky." : "Drop any CSV or Excel file. Get instant insights."}
        </p>
      </div>

      {/* EMPTY STATE */}
      {!fileName && !parsedReport && !loading && (
        <div style={{
          width: "100%",
          maxWidth: "550px",
          textAlign: "center",
          padding: "40px 20px",
          marginBottom: "20px",
        }}>
          {demoPhase === 0 ? (
            <>
              {/* SVG illustration */}
              <svg style={{ width: "120px", height: "120px", margin: "0 auto 28px", opacity: 0.6 }} viewBox="0 0 120 120" fill="none">
                <rect x="20" y="50" width="14" height="50" rx="3" fill="url(#emptyGrad)" opacity="0.6"/>
                <rect x="40" y="30" width="14" height="70" rx="3" fill="url(#emptyGrad)" opacity="0.7"/>
                <rect x="60" y="45" width="14" height="55" rx="3" fill="url(#emptyGrad)" opacity="0.65"/>
                <rect x="80" y="20" width="14" height="80" rx="3" fill="url(#emptyGrad)" opacity="0.8"/>
                <circle cx="85" cy="35" r="22" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" fill="none"/>
                <line x1="101" y1="51" x2="115" y2="65" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="emptyGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#E06792"/>
                    <stop offset="100%" stopColor="#3F51B5"/>
                  </linearGradient>
                </defs>
              </svg>

              <h3 style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontSize: "1.6rem",
                fontWeight: "400",
                color: "rgba(255,255,255,0.92)",
                marginBottom: "10px",
              }}>
                {language === "cs" ? "Vaše poznatky čekají" : "Your insights are waiting"}
              </h3>

              <p style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: "0.9rem",
                maxWidth: "400px",
                margin: "0 auto 24px",
              }}>
                {language === "cs"
                  ? "Nahrajte svůj první soubor, nebo prozkoumejte ukázkovou analýzu."
                  : "Upload your first file, or explore a sample analysis to see what DataPalo can do."}
              </p>

              <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  onClick={() => document.querySelector('[data-dropzone]')?.click()}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    background: "linear-gradient(135deg, #E06792 0%, #CF5585 50%, #3F51B5 100%)",
                    color: "white", border: "none", padding: "12px 24px", borderRadius: "10px",
                    fontFamily: "'Satoshi', sans-serif", fontSize: "0.9rem", fontWeight: "600",
                    cursor: "pointer", transition: "all 250ms cubic-bezier(0.16, 1, 0.3, 1)",
                    boxShadow: "0 8px 30px rgba(224, 103, 146, 0.2)",
                  }}
                >
                  {language === "cs" ? "Nahrát první soubor" : "Upload Your First File"}
                </button>
                <button
                  onClick={startDemo}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    background: "rgba(161, 197, 10, 0.06)", color: "rgba(255,255,255,0.8)",
                    border: "1px solid rgba(161, 197, 10, 0.3)", padding: "12px 24px",
                    borderRadius: "10px", fontFamily: "'Satoshi', sans-serif",
                    fontSize: "0.9rem", fontWeight: "500", cursor: "pointer",
                    transition: "all 250ms cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  {language === "cs" ? "Spustit živou ukázku" : "Watch DataPalo Analyze"} →
                </button>
              </div>
            </>
          ) : (
            /* ── STAGED REVEAL DEMO ── */
            <div style={{ padding: "20px 0", width: "100%" }}>

              {/* PHASES 1-3: Processing Animation */}
              {demoPhase >= 1 && demoPhase <= 3 && (
                <div style={{
                  textAlign: "center", padding: "40px 16px",
                  animation: "fadeSlideUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
                }}>
                  {/* File badge */}
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px", padding: "8px 16px", marginBottom: "24px",
                    fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem",
                    color: "rgba(255,255,255,0.6)",
                  }}>
                    <span style={{ fontSize: "14px" }}>📄</span>
                    kavarna-prodeje.csv · 2,847 {language === "cs" ? "řádků" : "rows"}
                  </div>

                  {/* Processing icon */}
                  <div style={{
                    width: "64px", height: "64px", margin: "0 auto 20px",
                    borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "28px",
                    background: demoPhase === 1 ? "rgba(224, 103, 146, 0.1)"
                      : demoPhase === 2 ? "rgba(63, 81, 181, 0.1)"
                      : "rgba(161, 197, 10, 0.1)",
                    animation: "pulseSlow 1.5s ease-in-out infinite",
                  }}>
                    {demoPhase === 1 ? "📊" : demoPhase === 2 ? "🔍" : "✨"}
                  </div>

                  {/* Phase label */}
                  <div style={{
                    fontFamily: "'Satoshi', sans-serif", fontSize: "1rem",
                    fontWeight: "600", color: "rgba(255,255,255,0.9)", marginBottom: "12px",
                  }}>
                    {demoPhase === 1
                      ? (language === "cs"
                        ? (demoRunCountRef.current > 1 ? "Načítání dat..." : "Čtení souboru...")
                        : (demoRunCountRef.current > 1 ? "Loading data..." : "Reading file..."))
                      : demoPhase === 2
                      ? (language === "cs"
                        ? (demoRunCountRef.current > 1 ? "Analyzuji trendy..." : "Hledání vzorců...")
                        : (demoRunCountRef.current > 1 ? "Analyzing trends..." : "Finding patterns..."))
                      : (language === "cs"
                        ? (demoRunCountRef.current > 1 ? "Generuji doporučení..." : "Budování insightů...")
                        : (demoRunCountRef.current > 1 ? "Generating recommendations..." : "Building insights..."))}
                  </div>

                  {/* Progress bar */}
                  <div style={{
                    width: "200px", height: "4px", margin: "0 auto",
                    background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden",
                  }}>
                    <div style={{
                      height: "100%", borderRadius: "2px",
                      background: "linear-gradient(90deg, #E06792, #3F51B5)",
                      transition: "width 1.4s cubic-bezier(0.16, 1, 0.3, 1)",
                      width: demoPhase === 1 ? "25%" : demoPhase === 2 ? "50%" : "75%",
                    }} />
                  </div>
                </div>
              )}

              {/* PHASE 4: Dashboard Reveal */}
              {demoPhase === 4 && (
                <div style={{ animation: "fadeSlideUp 500ms cubic-bezier(0.16, 1, 0.3, 1) both" }}>

                  {/* Metrics grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "24px" }}>
                    {[
                      {
                        label: language === "cs" ? "Tržby" : "Revenue",
                        value: `€${demoMetrics.revenue.toLocaleString("de-DE")}`,
                        change: `+${demoMetrics.growth}%`,
                      },
                      {
                        label: language === "cs" ? "Růst" : "Growth",
                        value: `+${demoMetrics.growth}%`,
                        change: language === "cs" ? "Rostoucí trend" : "Trending upward",
                      },
                      {
                        label: language === "cs" ? "Marže" : "Margin",
                        value: `${demoMetrics.margin}%`,
                        change: language === "cs" ? "Nad cílem" : "Above target",
                      },
                    ].map((m, i) => (
                      <div key={i} style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "12px", padding: "16px",
                        animation: `countFadeIn 500ms cubic-bezier(0.16, 1, 0.3, 1) ${i * 200}ms both`,
                      }}>
                        <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px", fontFamily: "'JetBrains Mono', monospace" }}>{m.label}</div>
                        <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "clamp(1.3rem, 5vw, 1.8rem)", color: "rgba(255,255,255,0.92)" }}>{m.value}</div>
                        <div style={{ fontSize: "0.75rem", marginTop: "4px", color: "#A1C50A" }}>{m.change}</div>
                      </div>
                    ))}
                  </div>

                  {/* Animated bar chart */}
                  <div style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "12px", padding: "20px", height: "120px",
                    display: "flex", alignItems: "flex-end", gap: "8px",
                    animation: "fadeSlideUp 500ms cubic-bezier(0.16, 1, 0.3, 1) 600ms both",
                  }}>
                    {[45, 68, 52, 80, 92, 74, 55, 88].map((h, i) => (
                      <div key={i} style={{
                        flex: 1, borderRadius: "4px 4px 0 0",
                        background: "linear-gradient(135deg, #E06792, #3F51B5)",
                        animation: `barGrow 800ms cubic-bezier(0.16, 1, 0.3, 1) ${700 + i * 100}ms both`,
                        height: `${h}%`,
                      }} />
                    ))}
                  </div>

                  {/* AI Insights — all 3 cards revealed sequentially, then blur + CTA */}
                  <div style={{ marginTop: "20px", position: "relative" }}>
                    {/* Insight 1: AI Insight — fully visible */}
                    <div style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "12px", padding: "16px", marginBottom: "8px",
                      animation: "cardSlideIn 500ms cubic-bezier(0.16, 1, 0.3, 1) 1500ms both",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                        <span style={{ fontSize: "14px" }}>🤖</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.7rem", color: "#E06792", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          AI Insight
                        </span>
                      </div>
                      <div style={{
                        fontFamily: "'Satoshi', sans-serif", fontSize: "0.85rem",
                        color: "rgba(255,255,255,0.8)", lineHeight: "1.6",
                        maskImage: "linear-gradient(to right, black 80%, transparent 100%)",
                        WebkitMaskImage: "linear-gradient(to right, black 80%, transparent 100%)",
                      }}>
                        {language === "cs"
                          ? "Páteční tržby jsou o 23% vyšší než průměr. Zvažte rozšíření personálu v pátek a nabídku speciálního menu..."
                          : "Friday revenue is 23% above average. Consider expanding Friday staffing and offering a special weekend menu..."}
                      </div>
                    </div>

                    {/* Insight 2: Trend — visible then blurs */}
                    <div style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "12px", padding: "16px", marginBottom: "8px",
                      animation: "cardSlideIn 500ms cubic-bezier(0.16, 1, 0.3, 1) 2100ms both, cardBlur 600ms cubic-bezier(0.4, 0, 1, 1) 3800ms both",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                        <span style={{ fontSize: "14px" }}>📈</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.7rem", color: "#3F51B5", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          {language === "cs" ? "Trend" : "Trend"}
                        </span>
                      </div>
                      <div style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "0.85rem", color: "rgba(255,255,255,0.8)", lineHeight: "1.6" }}>
                        {language === "cs"
                          ? "Sezónní analýza ukazuje rostoucí poptávku po teplých nápojích v období říjen–únor s průměrným nárůstem 18%..."
                          : "Seasonal analysis shows growing demand for warm beverages in October–February with an average increase of 18%..."}
                      </div>
                    </div>

                    {/* Insight 3: Recommendation — visible then blurs */}
                    <div style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "12px", padding: "16px",
                      animation: "cardSlideIn 500ms cubic-bezier(0.16, 1, 0.3, 1) 2700ms both, cardBlur 600ms cubic-bezier(0.4, 0, 1, 1) 3800ms both",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                        <span style={{ fontSize: "14px" }}>💡</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.7rem", color: "#A1C50A", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          {language === "cs" ? "Doporučení" : "Recommendation"}
                        </span>
                      </div>
                      <div style={{ fontFamily: "'Satoshi', sans-serif", fontSize: "0.85rem", color: "rgba(255,255,255,0.8)", lineHeight: "1.6" }}>
                        {language === "cs"
                          ? "Optimalizujte zásobování pondělí–středa, kdy je prodej o 31% nižší. Snížení zásob o 20% ušetří přibližně €2,400 měsíčně..."
                          : "Optimize inventory for Monday–Wednesday when sales are 31% lower. Reducing stock by 20% could save approximately €2,400/month..."}
                      </div>
                    </div>

                    {/* FOMO CTA overlay — appears after all cards shown */}
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0,
                      background: "linear-gradient(to top, rgba(8,8,24,0.95) 40%, rgba(8,8,24,0.8) 70%, transparent 100%)",
                      padding: "60px 20px 24px",
                      display: "flex", flexDirection: "column", alignItems: "center",
                      animation: "blurReveal 600ms cubic-bezier(0.16, 1, 0.3, 1) 4000ms both",
                    }}>
                      <div style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "16px", padding: "24px",
                        textAlign: "center", maxWidth: "400px",
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        animation: "glowPulse 3s ease-in-out infinite",
                      }}>
                        <div style={{
                          fontFamily: "'Satoshi', sans-serif", fontSize: "0.95rem",
                          fontWeight: "600", color: "rgba(255,255,255,0.9)", marginBottom: "16px",
                          lineHeight: "1.5",
                        }}>
                          {language === "cs"
                            ? "Nahrajte svůj soubor a uvidíte celou analýzu"
                            : "Upload your file to see the full analysis"}
                        </div>
                        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                          <button
                            onClick={() => document.querySelector('[data-dropzone]')?.click()}
                            style={{
                              background: "linear-gradient(135deg, #E06792 0%, #CF5585 50%, #3F51B5 100%)",
                              color: "white", border: "none", padding: "10px 20px", borderRadius: "10px",
                              fontFamily: "'Satoshi', sans-serif", fontSize: "0.85rem", fontWeight: "600",
                              cursor: "pointer", transition: "all 250ms cubic-bezier(0.16, 1, 0.3, 1)",
                              boxShadow: "0 8px 30px rgba(224, 103, 146, 0.3)",
                            }}
                          >
                            {language === "cs" ? "Nahrát svůj soubor" : "Upload Your File"}
                          </button>
                          <button
                            onClick={startDemo}
                            style={{
                              background: "transparent", color: "rgba(255,255,255,0.5)",
                              border: "1px solid rgba(255,255,255,0.1)", padding: "10px 16px",
                              borderRadius: "10px", fontSize: "0.8rem",
                              fontFamily: "'Satoshi', sans-serif", cursor: "pointer",
                            }}
                          >
                            {language === "cs" ? "Přehrát znovu" : "Replay demo"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ERROR CARD */}
      {errorState && (
        <div style={{
          width: "100%", maxWidth: "550px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "12px", padding: "24px",
          display: "flex", gap: "16px",
          position: "relative", overflow: "hidden",
          marginBottom: "20px",
          animation: "fadeIn 300ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}>
          {/* Left color bar */}
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: "3px",
            background: errorState.type === 'red' ? '#E06792'
              : errorState.type === 'yellow' ? '#F5A623' : '#5B9CF5',
          }} />

          {/* Icon */}
          <div style={{
            width: "40px", height: "40px", borderRadius: "10px",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, fontSize: "18px",
            background: errorState.type === 'red' ? 'rgba(224,103,146,0.12)'
              : errorState.type === 'yellow' ? 'rgba(245,166,35,0.12)' : 'rgba(91,156,245,0.12)',
          }}>
            {errorState.type === 'red' ? '\u26A0' : errorState.type === 'yellow' ? '\u26A1' : '\uD83D\uDD0C'}
          </div>

          {/* Content */}
          <div style={{ flex: 1 }}>
            <h4 style={{
              fontFamily: "'Satoshi', sans-serif", fontSize: "0.95rem",
              fontWeight: "600", color: "rgba(255,255,255,0.92)",
              margin: "0 0 6px 0",
            }}>
              {errorState.title}
            </h4>
            <p style={{
              color: "rgba(255,255,255,0.7)", fontSize: "0.85rem",
              lineHeight: "1.6", margin: 0,
            }}>
              {errorState.message}
            </p>
            {errorState.actions.length > 0 && (
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
                {errorState.actions.map((action, i) => (
                  <button key={i} onClick={action.onClick} style={{
                    padding: "8px 16px", fontSize: "0.8rem", borderRadius: "8px",
                    fontFamily: "'Satoshi', sans-serif", fontWeight: "600",
                    cursor: "pointer", transition: "all 0.25s ease",
                    ...(i === 0 ? {
                      background: "linear-gradient(135deg, #E06792 0%, #CF5585 50%, #3F51B5 100%)",
                      color: "white", border: "none",
                      boxShadow: "0 4px 16px rgba(224, 103, 146, 0.2)",
                    } : {
                      background: "transparent", color: "rgba(255,255,255,0.5)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }),
                  }}>
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dismiss */}
          <button onClick={clearError} style={{
            position: "absolute", top: "12px", right: "12px",
            background: "none", border: "none",
            color: "rgba(255,255,255,0.22)", cursor: "pointer",
            fontSize: "16px", padding: "4px",
          }}>
            {'\u2715'}
          </button>
        </div>
      )}

      {/* DROP ZONE */}
      {!loading && (
      <div {...getRootProps()} data-dropzone style={{
        width: "100%", maxWidth: "550px",
        border: isDragActive
          ? "2px solid #E06792"
          : fileName
            ? "1px solid rgba(255,255,255,0.08)"
            : "2px dashed rgba(255,255,255,0.25)",
        borderRadius: "16px",
        padding: fileName ? "24px 16px" : "40px 16px",
        textAlign: "center",
        cursor: "pointer",
        background: isDragActive
          ? "rgba(224,103,146,0.04)"
          : "rgba(255,255,255,0.02)",
        transition: "all 400ms cubic-bezier(0.16, 1, 0.3, 1)",
        position: "relative",
        overflow: "hidden",
      }}>
        <input {...getInputProps()} />

        {/* Radial glow on drag */}
        {isDragActive && (
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(circle at center, rgba(224,103,146,0.08), transparent 70%)",
            pointerEvents: "none",
          }} />
        )}

        {fileName ? (
          /* State 3: File loaded */
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{
              fontFamily: "'Satoshi', sans-serif",
              fontSize: "1.1rem", fontWeight: "600",
              color: "#A1C50A", marginBottom: "8px",
            }}>
              {fileName}
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.85rem",
              color: "rgba(255,255,255,0.7)",
              marginBottom: "24px",
            }}>
              {rowCount.toLocaleString()} {language === "cs" ? "řádků" : "rows"} · {language === "cs" ? "Připraveno k analýze" : "Ready to analyze"}
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={(e) => { e.stopPropagation(); runAnalysis(); }}
                disabled={loading}
                style={{
                  padding: "14px 36px", fontSize: "0.95rem", fontWeight: "700",
                  fontFamily: "'Satoshi', sans-serif",
                  background: loading ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #E06792 0%, #CF5585 50%, #3F51B5 100%)",
                  color: "white", border: "none", borderRadius: "12px",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: loading ? "none" : "0 8px 30px rgba(224, 103, 146, 0.22)",
                  display: "inline-flex", alignItems: "center", gap: "8px",
                }}
              >
                {language === "cs" ? "Analyzovat" : "Analyze"}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCsvData(null); setFileName(null); setRowCount(0);
                }}
                style={{
                  padding: "14px 20px", fontSize: "0.85rem",
                  fontFamily: "'Satoshi', sans-serif",
                  background: "transparent",
                  color: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px", cursor: "pointer",
                  transition: "all 0.25s ease",
                }}
              >
                {language === "cs" ? "Odebrat" : "Remove"}
              </button>
            </div>
          </div>
        ) : (
          /* State 1: Idle / State 2: Drag over */
          <div style={{ position: "relative", zIndex: 1 }}>
            <svg style={{
              width: "56px", height: "56px", margin: "0 auto 20px",
              opacity: isDragActive ? 1 : 0.5,
              transition: "all 400ms ease",
              animation: isDragActive ? "pulse 1s ease-in-out infinite" : "none",
            }} viewBox="0 0 56 56" fill="none">
              <rect x="12" y="6" width="32" height="40" rx="4" stroke="rgba(161,197,10,0.5)" strokeWidth="1.5"/>
              <path d="M22 16h12M22 22h12M22 28h8" stroke="rgba(161,197,10,0.3)" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M28 50V38M22 44l6-6 6 6" stroke="#A1C50A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3 style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: "1.3rem", fontWeight: "400",
              color: "rgba(255,255,255,0.92)",
              marginBottom: "8px",
            }}>
              {language === "cs" ? "Přesuňte CSV nebo Excel soubor sem" : "Drop your CSV or Excel file here"}
            </h3>
            <p style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: "0.85rem", marginBottom: "16px",
            }}>
              {language === "cs" ? "Okamžitě analyzujeme a připravíme poznatky" : "We'll analyze it instantly and build your insights"}
            </p>
            <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
              {["CSV", "XLSX", "XLS"].map(fmt => (
                <span key={fmt} style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.7rem", padding: "4px 10px", borderRadius: "6px",
                  background: "rgba(161, 197, 10, 0.08)", color: "#A1C50A",
                  border: "1px solid rgba(161, 197, 10, 0.25)",
                }}>
                  {fmt}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      )}

      {/* PROCESSING ANIMATION */}
      {loading && (
        <div style={{
          width: "100%", maxWidth: "550px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          padding: "40px 16px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          marginTop: "20px",
        }}>
          {/* Progress bar */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: "3px",
            background: "rgba(255,255,255,0.06)", borderRadius: "2px",
          }}>
            <div style={{
              height: "100%", width: `${processingStep * 25}%`,
              background: "#A1C50A", borderRadius: "2px",
              transition: "width 1.4s linear",
            }} />
          </div>

          {/* Step 1: Reading */}
          {processingStep === 1 && (
            <div style={{ animation: "fadeIn 400ms cubic-bezier(0.16, 1, 0.3, 1)" }}>
              <svg style={{ width: "64px", height: "64px", margin: "0 auto 16px" }} viewBox="0 0 64 64" fill="none">
                <rect x="14" y="8" width="36" height="48" rx="4" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
                <path d="M22 20h20M22 28h20M22 36h14" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="14" y1="20" x2="50" y2="20" stroke="#A1C50A" strokeWidth="2" opacity="0.8">
                  <animate attributeName="y1" values="12;52;12" dur="1.5s" repeatCount="indefinite"/>
                  <animate attributeName="y2" values="12;52;12" dur="1.5s" repeatCount="indefinite"/>
                </line>
              </svg>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.3rem", color: "rgba(255,255,255,0.92)" }}>
                {language === "cs" ? "Čteme váš soubor..." : "Reading your file..."}
              </div>
            </div>
          )}

          {/* Step 2: Finding patterns */}
          {processingStep === 2 && (
            <div style={{ animation: "fadeIn 400ms cubic-bezier(0.16, 1, 0.3, 1)" }}>
              <svg style={{ width: "64px", height: "64px", margin: "0 auto 16px", animation: "pulseSlow 1.5s ease-in-out infinite" }} viewBox="0 0 64 64" fill="none">
                <rect x="10" y="34" width="10" height="22" rx="2" fill="url(#procGrad)" opacity="0.6"/>
                <rect x="27" y="22" width="10" height="34" rx="2" fill="url(#procGrad)" opacity="0.7"/>
                <rect x="44" y="14" width="10" height="42" rx="2" fill="url(#procGrad)" opacity="0.8"/>
                <defs><linearGradient id="procGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#E06792"/><stop offset="100%" stopColor="#3F51B5"/></linearGradient></defs>
              </svg>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.3rem", color: "rgba(255,255,255,0.92)" }}>
                {language === "cs" ? "Hledáme vzory..." : "Finding patterns..."}
              </div>
            </div>
          )}

          {/* Step 3: Building insights */}
          {processingStep === 3 && (
            <div style={{ animation: "fadeIn 400ms cubic-bezier(0.16, 1, 0.3, 1)" }}>
              <svg style={{ width: "64px", height: "64px", margin: "0 auto 16px", animation: "sparkle 1.2s ease-in-out infinite" }} viewBox="0 0 64 64" fill="none">
                <path d="M32 8L35 26L52 20L38 32L52 44L35 38L32 56L29 38L12 44L26 32L12 20L29 26Z" fill="url(#procGrad)" opacity="0.7"/>
              </svg>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.3rem", color: "rgba(255,255,255,0.92)" }}>
                {language === "cs" ? "Připravujeme poznatky..." : "Building your insights..."}
              </div>
            </div>
          )}

          {/* Step 4: Done */}
          {processingStep === 4 && (
            <div style={{ animation: "fadeIn 400ms cubic-bezier(0.16, 1, 0.3, 1)" }}>
              <svg style={{ width: "64px", height: "64px", margin: "0 auto 16px" }} viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="24" fill="rgba(161, 197, 10, 0.15)"/>
                <path d="M22 32l7 7 14-14" stroke="#A1C50A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "bounceIn 500ms cubic-bezier(0.16, 1, 0.3, 1)" }}/>
              </svg>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.3rem", color: "#A1C50A" }}>
                {language === "cs" ? "Hotovo!" : "Done!"}
              </div>
            </div>
          )}

          {/* File context */}
          <div style={{
            marginTop: "16px", fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.8rem", color: "rgba(255,255,255,0.22)",
          }}>
            {fileName} · {rowCount.toLocaleString()} {language === "cs" ? "řádků" : "rows"}
          </div>
        </div>
      )}

      {/* RESULTS */}
      {parsedReport && (
        <div style={{ marginTop: "40px", width: "100%", maxWidth: "1200px" }}>

          {/* Exa Diagnostic Banner (shows when Exa had issues or is PRO-only) */}
          {exaDiagnostics && exaDiagnostics.status !== "success" && (
            <div style={{
              background: exaDiagnostics.status === "pro_only" ? "#1e1b4b" : exaDiagnostics.status === "not_configured" ? "rgba(255,255,255,0.03)" : "#451a03",
              padding: "12px 16px",
              borderRadius: "10px",
              marginBottom: "12px",
              border: `1px solid ${exaDiagnostics.status === "pro_only" ? "#4338ca" : exaDiagnostics.status === "not_configured" ? "rgba(255,255,255,0.06)" : "#92400e"}`,
              fontSize: "13px"
            }}>
              <div style={{ fontWeight: "bold", marginBottom: "4px", color: exaDiagnostics.status === "pro_only" ? "#a78bfa" : exaDiagnostics.status === "not_configured" ? "rgba(255,255,255,0.42)" : "#fbbf24" }}>
                {exaDiagnostics.status === "pro_only" && (language === "cs"
                  ? "🔒 Research-Augmented Analysis je PRO funkce"
                  : "🔒 Research-Augmented Analysis is a PRO feature")}
                {exaDiagnostics.status === "not_configured" && "ℹ️ EXA Research: Not configured"}
                {exaDiagnostics.status === "error" && `⚠️ EXA Research: Error — ${exaDiagnostics.error}`}
                {exaDiagnostics.status === "empty" && "⚠️ EXA Research: No results found"}
                {exaDiagnostics.status === "skipped" && "ℹ️ EXA Research: Skipped"}
              </div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>
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
              <div style={{ fontSize: "12px", opacity: 0.95, marginLeft: "0", lineHeight: "1.8" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "8px" }}>
                  <div>✅ {language === "cs" ? "Srovnání s průmyslem" : "Industry benchmarks"}</div>
                  <div>✅ {language === "cs" ? "Tržní trendy" : "Market trends"}</div>
                  <div>✅ {language === "cs" ? "Externí kontext" : "External research context"}</div>
                  <div>✅ {language === "cs" ? "Citované zdroje" : "Cited sources"}</div>
                </div>
              </div>
            </div>
          )}

          {/* Report Card */}
          <div style={{ background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
              <h3 style={{ margin: 0, color: "#A1C50A", fontSize: "1.3rem" }}>📊 {language === "cs" ? "Výsledky Analýzy" : "Analysis Results"}</h3>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={downloadPDF}
                  disabled={pdfGenerating}
                  style={{
                    background: pdfGenerating
                      ? "rgba(255,255,255,0.06)"
                      : canExport(tier, 'pdf')
                        ? "linear-gradient(135deg, #E06792 0%, #3F51B5 100%)"
                        : "rgba(255,255,255,0.06)",
                    color: "#fff",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    cursor: pdfGenerating ? "wait" : "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    boxShadow: canExport(tier, 'pdf') && !pdfGenerating ? "0 4px 12px rgba(224, 103, 146, 0.2)" : "none",
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
                  style={{ background: "rgba(255,255,255,0.03)", color: "#fff", border: "1px solid rgba(255,255,255,0.06)", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}
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
          <div style={{ background: "rgba(255,255,255,0.03)", padding: "30px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <h3 style={{ marginTop: 0, color: "#f59e0b" }}>⚠️ {language === "cs" ? "Textový výstup" : "Text Output"}</h3>
            <pre style={{ fontSize: "14px", whiteSpace: "pre-wrap", fontFamily: "monospace", lineHeight: "1.6", color: "rgba(255,255,255,0.7)" }}>
              {result}
            </pre>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div style={{ marginTop: "60px", textAlign: "center", color: "rgba(255,255,255,0.55)", fontSize: "14px", paddingBottom: "20px" }}>
        <p style={{ marginBottom: "8px" }}>
          {language === "cs" ? "Zpětná vazba? Nápady? Chcete spolupracovat?" : "Feedback? Ideas? Want to collaborate?"}
        </p>
        <a
          href="mailto:michael@forgecreative.cz?subject=DataPalo%20Feedback"
          style={{ color: "#E06792", textDecoration: "none", fontWeight: "600" }}
        >
          michael@forgecreative.cz
        </a>
        <div style={{ marginTop: "16px", display: "flex", justifyContent: "center", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
          <a
            href="/datapalo/privacy"
            style={{ color: "rgba(255,255,255,0.45)", textDecoration: "none", fontSize: "12px", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.03em", transition: "color 0.2s ease" }}
            onMouseEnter={e => e.target.style.color = "#E06792"}
            onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.45)"}
          >
            {language === "cs" ? "Zásady ochrany osobních údajů" : "Privacy Policy"}
          </a>
          <span style={{ color: "rgba(255,255,255,0.15)", fontSize: "12px" }}>|</span>
          <a
            href="/datapalo/privacy"
            style={{ color: "rgba(255,255,255,0.45)", textDecoration: "none", fontSize: "12px", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.03em", transition: "color 0.2s ease" }}
            onMouseEnter={e => e.target.style.color = "#E06792"}
            onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.45)"}
          >
            {language === "cs" ? "Podmínky služby" : "Terms of Service"}
          </a>
        </div>
        <div style={{ marginTop: "20px" }}>
          <a href="https://www.producthunt.com/products/datawizard-app/reviews/new?utm_source=badge-product_review&utm_medium=badge&utm_source=badge-datawizard-app" target="_blank" rel="noopener noreferrer">
            <img src="https://api.producthunt.com/widgets/embed-image/v1/product_review.svg?product_id=1143772&theme=dark" alt="DataPalo App - AI Data Analyst for SMEs. Instant Insights from CSV & Excel. | Product Hunt" style={{ width: "250px", height: "54px" }} width="250" height="54" />
          </a>
        </div>
        <p style={{ marginTop: "16px", fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>
          &copy; 2026 FORGE CREATIVE | AI Job Agency
        </p>
      </div>
    </div>
  );
}
