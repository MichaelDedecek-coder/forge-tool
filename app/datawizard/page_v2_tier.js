"use client";
import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import ReportInterface from "../components/ReportInterface";
import { markdownToReportJson } from "../lib/markdown-transformer";
import { useAuth } from "../lib/auth-context";
import AuthModal from "../components/AuthModal";
import {
  incrementAnonymousUpload,
  shouldShowSignupWall,
  clearAnonymousSession
} from "../lib/anonymous-session";
import {
  checkTierLimits,
  canExport,
  TIER_LIMITS
} from "../lib/tier-config";
import { getCurrentUsage, incrementUsage } from "../lib/supabase-client";

export default function Home() {
  // Auth state
  const { user, profile, loading: authLoading } = useAuth();

  // File state
  const [csvData, setCsvData] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [rowCount, setRowCount] = useState(0);

  // Analysis state
  const [result, setResult] = useState(null);
  const [parsedReport, setParsedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");

  // Modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitMessage, setLimitMessage] = useState(null);

  // Usage tracking
  const [usage, setUsage] = useState({ analysis_count: 0, total_rows_processed: 0 });

  // UI state
  const [language, setLanguage] = useState("cs");

  const addLog = (msg) => {
    console.log(`[DataWizard] ${msg}`);
  };

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
    if (user) {
      clearAnonymousSession();
    }
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

    // TIER LOGIC: Check limits BEFORE running analysis
    if (user && profile) {
      // Authenticated user - check tier limits
      const tier = profile.tier || 'free';
      const limits = checkTierLimits(tier, usage.analysis_count, rowCount);

      if (!limits.allowed) {
        // Show upgrade modal
        setLimitMessage(limits);
        setShowLimitModal(true);
        return;
      }
    } else {
      // Anonymous user - check if this would be 2nd upload
      if (shouldShowSignupWall(false)) {
        // Show signup wall
        setShowAuthModal(true);
        return;
      }
    }

    // Proceed with analysis
    setLoading(true);
    setResult(null);
    setParsedReport(null);

    setLoadingStage(language === "cs"
      ? `Načítám ${rowCount.toLocaleString()} řádků...`
      : `Reading ${rowCount.toLocaleString()} rows...`);
    addLog("Starting analysis...");

    const question = language === "cs"
      ? "Analyzuj tato data. Řekni mi nejdůležitější trendy, součty a odlehlé hodnoty."
      : "Analyze this data. Tell me the most important trends, totals, or outliers.";

    try {
      setTimeout(() => {
        setLoadingStage(language === "cs"
          ? "Provádím statistickou agregaci..."
          : "Performing statistical aggregation...");
      }, 1000);

      setTimeout(() => {
        setLoadingStage(language === "cs"
          ? "Generuji AI analýzu..."
          : "Generating AI insights...");
      }, 3000);

      addLog("Calling /api/datawizard...");
      const res = await fetch("/api/datawizard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question,
          csvData: csvData,
          language: language,
          userId: user?.id, // Pass user ID for server-side tracking
        }),
      });
      const data = await res.json();
      addLog(`API response received. Result length: ${data.result?.length || 0}`);

      console.log("[DataWizard V10] API Response preview:", data.result?.substring(0, 1000));

      setResult(data.result);

      // Parse the markdown into structured data
      addLog("Parsing markdown to report...");
      const reportData = markdownToReportJson(data.result);
      addLog(`Parse complete: Charts=${reportData?.charts?.length || 0}, Metrics=${reportData?.metrics?.length || 0}`);

      setParsedReport(reportData);

      // USAGE TRACKING: Increment counters AFTER successful analysis
      if (user && profile) {
        // Authenticated - increment database usage
        try {
          await incrementUsage(user.id, rowCount);
          // Reload usage
          const newUsage = await getCurrentUsage(user.id);
          setUsage(newUsage);
          addLog(`Usage updated: ${newUsage.analysis_count} analyses`);
        } catch (error) {
          console.error('Error updating usage:', error);
        }
      } else {
        // Anonymous - increment localStorage counter
        const count = incrementAnonymousUpload();
        addLog(`Anonymous upload ${count} recorded`);

        // Show signup wall after first analysis completes
        if (count === 1) {
          setTimeout(() => {
            setShowAuthModal(true);
          }, 2000); // Wait 2s so user can see results first
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
    element.download = `DataWizard_Report_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(element);
    element.click();
  };

  const downloadPDF = () => {
    if (!parsedReport) return;

    // Check if user has PRO tier
    const tier = profile?.tier || 'free';
    if (!canExport(tier, 'pdf')) {
      // Show upgrade modal
      setLimitMessage({
        reason: 'pdf_export',
        message: language === 'cs'
          ? 'Export PDF je dostupný pouze pro PRO uživatele.'
          : 'PDF export is only available for PRO users.',
        upgrade: 'pro',
        upgradeMessage: language === 'cs'
          ? `Přejděte na PRO za €${TIER_LIMITS.pro.price}/měsíc pro neomezené exporty.`
          : `Upgrade to PRO for €${TIER_LIMITS.pro.price}/month for unlimited exports.`
      });
      setShowLimitModal(true);
      return;
    }

    try {
      const printUrl = `${window.location.origin}/datawizard/print`;
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
      localStorage.setItem("datawizard_print_data", JSON.stringify(parsedReport));
      localStorage.setItem("datawizard_print_language", language);
      addLog("Opening print preview...");
    } catch (error) {
      addLog(`Error: ${error.message}`);
      alert(language === "cs" ? "Chyba při otevírání náhledu tisku" : "Error opening print preview");
    }
  };

  // Get tier info for display
  const tier = profile?.tier || 'free';
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

      {/* Limit/Upgrade Modal */}
      {showLimitModal && limitMessage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={() => setShowLimitModal(false)}
        >
          <div
            style={{
              backgroundColor: '#1e293b',
              borderRadius: '16px',
              padding: '40px',
              maxWidth: '500px',
              width: '100%',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🚀</div>
            <h2 style={{ color: '#fff', fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '16px' }}>
              {language === 'cs' ? 'Přejděte na PRO' : 'Upgrade to PRO'}
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '1rem', marginBottom: '24px' }}>
              {limitMessage.message}
            </p>
            <p style={{ color: '#3b82f6', fontSize: '1.125rem', fontWeight: '600', marginBottom: '32px' }}>
              {limitMessage.upgradeMessage}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                style={{
                  padding: '14px 32px',
                  background: 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {language === 'cs' ? 'Přejít na PRO' : 'Upgrade Now'} — €{TIER_LIMITS.pro.price}/měs
              </button>
              <button
                onClick={() => setShowLimitModal(false)}
                style={{
                  padding: '14px 32px',
                  background: 'transparent',
                  color: '#94a3b8',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                {language === 'cs' ? 'Možná později' : 'Maybe Later'}
              </button>
            </div>
          </div>
        </div>
      )}

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

        {/* Tier Badge */}
        {user && profile && (
          <div style={{
            background: tier === 'pro' ? '#3b82f6' : tier === 'enterprise' ? '#8b5cf6' : '#64748b',
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

        {/* Sign In button (if not authenticated) */}
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
      </div>

      {/* HEADER */}
      <div style={{ marginTop: "40px", textAlign: "center" }}>
        <h1 style={{ marginBottom: "10px", fontSize: "2.2rem" }}>
          <span style={{ color: "#0ea5e9" }}>Data</span><span style={{ fontWeight: "bold", color: "white" }}>Wizard</span>
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
          href="mailto:michael@forgecreative.cz?subject=DataWizard%20Feedback"
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
