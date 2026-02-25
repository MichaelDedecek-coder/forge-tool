"use client";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import ReportInterface from "../components/ReportInterface";
import { markdownToReportJson } from "../lib/markdown-transformer";

export default function Home() {
  // --- APP STATE (OPEN ACCESS - NO PIN) ---
  const [csvData, setCsvData] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [result, setResult] = useState(null);
  const [parsedReport, setParsedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");
  const [rowCount, setRowCount] = useState(0);
  const [language, setLanguage] = useState("cs");

  // --- DEBUG HELPER (console only) ---
  const addLog = (msg) => {
    console.log(`[DataWizard] ${msg}`);
  };

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

      // Count rows (excluding header)
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
    if (!csvData) return alert(language === "cs" ? "Nejprve nahrajte soubor!" : "Please upload a file first!");
    setLoading(true);
    setResult(null);
    setParsedReport(null);

    // PROGRESSIVE LOADING STAGES
    setLoadingStage(language === "cs"
      ? `Načítám ${rowCount.toLocaleString()} řádků...`
      : `Reading ${rowCount.toLocaleString()} rows...`);
    addLog("Starting analysis...");

    const question = language === "cs"
      ? "Analyzuj tato data. Řekni mi nejdůležitější trendy, součty a odlehlé hodnoty."
      : "Analyze this data. Tell me the most important trends, totals, or outliers.";

    try {
      // Stage 2: Statistical Aggregation
      setTimeout(() => {
        setLoadingStage(language === "cs"
          ? "Provádím statistickou agregaci..."
          : "Performing statistical aggregation...");
      }, 1000);

      // Stage 3: AI Insights
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
            language: language
        }),
      });
      const data = await res.json();
      addLog(`API response received. Result length: ${data.result?.length || 0}`);

      // V9: Log first 1000 chars of the response for debugging
      console.log("[DataWizard V9] API Response preview:", data.result?.substring(0, 1000));

      setResult(data.result);

      // Parse the markdown into structured data
      addLog("Parsing markdown to report...");
      console.log("[DataWizard V9] === STARTING PARSE ===");
      const reportData = markdownToReportJson(data.result);
      console.log("[DataWizard V9] === PARSE COMPLETE ===");
      console.log("[DataWizard V9] Parsed report structure:", {
        title: reportData?.title,
        summary: reportData?.summary?.substring(0, 100),
        metricsCount: reportData?.metrics?.length || 0,
        chartsCount: reportData?.charts?.length || 0,
        insightsCount: reportData?.insights?.length || 0,
        charts: reportData?.charts
      });
      addLog(`Parse complete: Charts=${reportData?.charts?.length || 0}, Metrics=${reportData?.metrics?.length || 0}`);

      setParsedReport(reportData);
      
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

    try {
      // CROSS-ORIGIN SOLUTION: Use postMessage instead of localStorage
      // This works even if domains are different (forgecreative.cz vs vercel.app)

      // Open print window
      const printUrl = `${window.location.origin}/datawizard/print`;
      const printWindow = window.open(printUrl, "_blank");

      if (!printWindow) {
        alert(language === "cs"
          ? "Povolte vyskakovací okna pro tisk PDF"
          : "Please allow pop-ups to open print preview");
        return;
      }

      // Listen for "ready" message from print window
      const handleMessage = (event) => {
        // Security: verify message is from print window
        if (event.data?.type === "PRINT_PAGE_READY") {
          addLog("Print window ready, sending data...");

          // Send report data to print window
          printWindow.postMessage({
            type: "DATAWIZARD_PRINT_DATA",
            data: parsedReport,
            language: language
          }, "*"); // Use "*" to allow any origin (print window might be on different domain)

          // Clean up listener
          window.removeEventListener("message", handleMessage);
        }
      };

      window.addEventListener("message", handleMessage);

      // Fallback: Also try localStorage (works if same origin)
      localStorage.setItem("datawizard_print_data", JSON.stringify(parsedReport));
      localStorage.setItem("datawizard_print_language", language);

      addLog("Opening print preview...");
    } catch (error) {
      addLog(`Error: ${error.message}`);
      alert(language === "cs" ? "Chyba při otevírání náhledu tisku" : "Error opening print preview");
    }
  };

  // --- CLEAN UI - INSTANT ACCESS ---
  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", backgroundColor: "#0f172a", minHeight: "100vh", color: "white", display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
      
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

      {/* LANGUAGE TOGGLE */}
      <div style={{ position: "absolute", top: "20px", right: "20px", display: "flex", gap: "4px", background: "#1e293b", padding: "4px", borderRadius: "20px" }}>
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
                        style={{ background: "linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600", boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)" }}
                    >
                        {language === "cs" ? "📄 Stáhnout PDF" : "📄 Download PDF"}
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

      {/* FOOTER - CONTACT FOR FEEDBACK */}
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