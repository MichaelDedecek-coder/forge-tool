"use client";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { ReportInterface } from "../components/ReportInterface";
import { markdownToReportJson } from "../lib/markdown-transformer";

export default function Home() { 
  // --- AUTH STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [authError, setAuthError] = useState("");
  
  // --- APP STATE ---
  const [csvData, setCsvData] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("cs"); 

  // --- SECURITY CHECK ---
  const handlePinSubmit = (e) => {
    e.preventDefault();
    const SECRET_PIN = "4863"; 
    
    if (pinInput === SECRET_PIN) {
      setIsAuthenticated(true);
    } else {
      setAuthError("❌ Incorrect PIN / Nesprávný PIN");
      setPinInput("");
    }
  };

  // Handle File Drop
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const binaryStr = e.target.result;
      const workbook = XLSX.read(binaryStr, { type: "binary" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const csvText = XLSX.utils.sheet_to_csv(worksheet);
      setCsvData(csvText);
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
        body: JSON.stringify({ 
            message: question, 
            csvData: csvData,
            language: language 
        }),
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

  // --- 🔒 THE LOCK SCREEN (Updated with Email) ---
  if (!isAuthenticated) {
    return (
      <div style={{ 
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", 
        height: "100vh", backgroundColor: "#050505", color: "white", fontFamily: "sans-serif" 
      }}>
        <div style={{ padding: "40px", background: "#111", borderRadius: "12px", border: "1px solid #333", textAlign: "center", maxWidth: "400px", width: "90%" }}>
          <h1 style={{ fontSize: "40px", marginBottom: "20px" }}>🧙‍♂️</h1>
          <h2 style={{ marginBottom: "20px" }}>DataWizard Access</h2>
          <form onSubmit={handlePinSubmit}>
            <input 
              type="password" 
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter PIN"
              style={{ padding: "10px", borderRadius: "5px", border: "1px solid #444", background: "#222", color: "white", fontSize: "16px", marginBottom: "10px", width: "100%" }}
              autoFocus
            />
            <button type="submit" style={{ width: "100%", padding: "10px", background: "#3b82f6", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>
              Unlock / Odemknout
            </button>
          </form>
          {authError && <p style={{ color: "#ef4444", marginTop: "15px" }}>{authError}</p>}
          
          {/* --- NEW LEAD GEN SECTION --- */}
          <div style={{ marginTop: "40px", borderTop: "1px solid #333", paddingTop: "20px" }}>
            <p style={{ fontSize: "14px", color: "#888", marginBottom: "5px" }}>
              Don't have a PIN? / Nemáte PIN?
            </p>
            <a 
              href="mailto:michael@agentforge.tech?subject=Request%20DataWizard%20Access"
              style={{ color: "#3b82f6", textDecoration: "none", fontSize: "14px", fontWeight: "bold" }}
            >
              michael@agentforge.tech
            </a>
          </div>

        </div>
      </div>
    );
  }

  // --- 🔓 THE APP (Main Interface) ---
  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", backgroundColor: "#111", minHeight: "100vh", color: "white", display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
      
      {/* LANGUAGE TOGGLE */}
      <div style={{ position: "absolute", top: "20px", right: "20px", display: "flex", gap: "10px", background: "#222", padding: "5px", borderRadius: "20px" }}>
        <button 
            onClick={() => setLanguage("cs")}
            style={{ 
                background: language === "cs" ? "#3b82f6" : "transparent", 
                color: "white", border: "none", padding: "5px 15px", borderRadius: "15px", cursor: "pointer", fontWeight: "bold"
            }}
        >CZ 🇨🇿</button>
        <button 
            onClick={() => setLanguage("en")}
            style={{ 
                background: language === "en" ? "#3b82f6" : "transparent", 
                color: "white", border: "none", padding: "5px 15px", borderRadius: "15px", cursor: "pointer", fontWeight: "bold"
            }}
        >EN 🇬🇧</button>
      </div>

      <h1 style={{ color: "#3b82f6", marginBottom: "10px" }}>🧙‍♂️ DataWizard</h1>
      <p style={{ color: "#888", marginBottom: "30px" }}>
          {language === "cs" ? "Vložte CSV nebo Excel. Získejte okamžité výsledky." : "Drop any CSV or Excel file. Get instant insights."}
      </p>
      
      {/* DROP ZONE */}
      <div {...getRootProps()} style={{ 
          width: "100%", maxWidth: "600px", padding: "40px", 
          border: "2px dashed #444", borderRadius: "12px", 
          textAlign: "center", cursor: "pointer",
          backgroundColor: isDragActive ? "#222" : "#1a1a1a",
          transition: "all 0.2s"
      }}>
        <input {...getInputProps()} />
        {fileName ? (
            <div>
                <div style={{ fontSize: "40px", marginBottom: "10px" }}>📄</div>
                <p style={{ fontSize: "18px", color: "#10b981" }}>{language === "cs" ? "Připraveno:" : "Ready:"} {fileName}</p>
                <p style={{ fontSize: "12px", color: "#555" }}>{language === "cs" ? "Klikněte na tlačítko níže" : "Click button below"}</p>
            </div>
        ) : (
            <div>
                <div style={{ fontSize: "40px", marginBottom: "10px" }}>📥</div>
                <p style={{ color: "#aaa" }}>{language === "cs" ? "Přetáhněte soubor sem" : "Drag & drop a file here"}</p>
                <p style={{ fontSize: "12px", color: "#555", marginTop: "10px" }}>(CSV or Excel)</p>
            </div>
        )}
      </div>

      {/* ACTION BUTTON */}
      {fileName && (
          <button 
            onClick={runAnalysis} 
            disabled={loading}
            style={{ 
                marginTop: "30px", padding: "15px 40px", fontSize: "18px", 
                background: loading ? "#555" : "linear-gradient(90deg, #3b82f6, #8b5cf6)", 
                color: "white", border: "none", borderRadius: "30px", cursor: "pointer",
                fontWeight: "bold", boxShadow: "0 4px 15px rgba(59, 130, 246, 0.4)"
            }}
          >
            {loading 
                ? (language === "cs" ? "✨ Analyzuji..." : "✨ Analyzing...") 
                : (language === "cs" ? "✨ Získat Insight" : "✨ Auto-Discover Insights")}
          </button>
      )}

      {/* RESULTS - NEW VISUALIZATION INTERFACE */}
      {result && (
        <div style={{ marginTop: "40px", width: "100%", maxWidth: "900px" }}>
          <div style={{ background: "#1f2937", padding: "30px", borderRadius: "12px", border: "1px solid #374151" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ marginTop: 0, color: "#10b981" }}>📊 {language === "cs" ? "Analýza DataWizard" : "Wizard Analysis"}</h3>
                <button 
                    onClick={downloadReport}
                    style={{ background: "#374151", color: "#fff", border: "1px solid #555", padding: "5px 15px", borderRadius: "5px", cursor: "pointer" }}
                >
                    {language === "cs" ? "⬇️ Stáhnout Report" : "⬇️ Download Report"}
                </button>
            </div>
            
            {/* NEW: Interactive Report Interface */}
            <ReportInterface 
              data={markdownToReportJson(result.result)} 
              language={language} 
            />
            
            {/* FALLBACK: Raw text (collapsible) */}
            <details style={{ marginTop: "20px" }}>
              <summary style={{ cursor: "pointer", color: "#888", fontSize: "14px" }}>
                {language === "cs" ? "📝 Zobrazit textový výstup" : "📝 Show raw text output"}
              </summary>
              <pre style={{ fontSize: "14px", marginTop: "10px", whiteSpace: "pre-wrap", fontFamily: "monospace", lineHeight: "1.6", color: "#aaa", background: "#111", padding: "15px", borderRadius: "8px" }}>
                {result.result}
              </pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}