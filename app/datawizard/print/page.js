"use client";

import { useEffect, useState } from "react";
import ReportInterface from "../../components/ReportInterface";

export default function PrintPage() {
  const [reportData, setReportData] = useState(null);
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    console.log("[PrintPage] Initializing...");
    let dataReceived = false;

    // CROSS-ORIGIN SOLUTION: Listen for postMessage from parent window
    const handleMessage = (event) => {
      console.log("[PrintPage] Received message:", event.data?.type);

      if (event.data?.type === "DATAWIZARD_PRINT_DATA" && !dataReceived) {
        dataReceived = true;
        console.log("[PrintPage] Received data via postMessage");
        console.log("[PrintPage] Has metrics?", event.data.data?.metrics?.length);
        console.log("[PrintPage] Has charts?", event.data.data?.charts?.length);

        setReportData(event.data.data);
        setLanguage(event.data.language || "en");

        // Auto-trigger print dialog
        setTimeout(() => {
          console.log("[PrintPage] Triggering print dialog");
          window.print();
        }, 2500);

        // Clean up
        window.removeEventListener("message", handleMessage);
      }
    };

    window.addEventListener("message", handleMessage);

    // Send "ready" message to parent window (if opened via window.open)
    if (window.opener) {
      console.log("[PrintPage] Sending READY message to parent");
      window.opener.postMessage({ type: "PRINT_PAGE_READY" }, window.location.origin);
    }

    // FALLBACK: Try localStorage (works if same origin)
    setTimeout(() => {
      if (!dataReceived) {
        console.log("[PrintPage] Trying localStorage fallback...");
        const storedData = localStorage.getItem("datawizard_print_data");
        const storedLang = localStorage.getItem("datawizard_print_language");

        if (storedData) {
          try {
            const parsed = JSON.parse(storedData);
            console.log("[PrintPage] Loaded from localStorage");
            setReportData(parsed);
            setLanguage(storedLang || "en");
            dataReceived = true;

            setTimeout(() => {
              window.print();
            }, 2500);
          } catch (error) {
            console.error("Failed to parse localStorage data:", error);
          }
        }
      }
    }, 1000); // Wait 1s for postMessage before trying localStorage

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  if (!reportData) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        fontFamily: "sans-serif",
        color: "#475569"
      }}>
        <div style={{ textAlign: "center" }}>
          <p>Loading report data...</p>
          <p style={{ fontSize: "14px", marginTop: "10px" }}>
            If this message persists, please close this window and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        /* Print-specific styles */
        @media screen {
          body {
            background: white;
            margin: 0;
            padding: 20px;
            font-family: 'Georgia', 'Times New Roman', serif;
          }
        }

        @media print {
          @page {
            size: A4;
            margin: 2cm 1.5cm;
          }

          body {
            background: white;
            color: #1e293b;
            font-family: 'Georgia', 'Times New Roman', serif;
          }

          /* GEMINI'S NUCLEAR OPTION - Kill ALL filters and force simple layout */

          /* 1. Force everything to be visible and standard */
          html, body {
            background: white !important;
            color: black !important;
            overflow: visible !important;
            height: auto !important;
          }

          /* 2. CRITICAL: Kill ALL filters globally (backdrop-blur is the silent killer) */
          * {
            backdrop-filter: none !important;
            filter: none !important;
            box-shadow: none !important;
            text-shadow: none !important;
            transition: none !important;
            transform: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* 3. Reset app layout containers */
          #__next,
          main,
          .layout-wrapper {
            display: block !important;
            position: static !important;
            overflow: visible !important;
          }

          /* CRITICAL FIX #3: Ensure main layout containers are visible */
          .space-y-8,
          .w-full,
          .max-w-7xl {
            display: block !important;
            opacity: 1 !important;
            visibility: visible !important;
            position: relative !important;
            overflow: visible !important;
          }

          /* 4. NUCLEAR: Kill Grid & Flex - Use Simple Block Layout */
          .grid,
          [class*="grid-cols"],
          .grid-cols-1,
          .md\\:grid-cols-2,
          .lg\\:grid-cols-4,
          .lg\\:grid-cols-2 {
            display: block !important;
            width: 100% !important;
            opacity: 1 !important;
            visibility: visible !important;
            overflow: visible !important;
          }

          /* 5. ABSOLUTE NUCLEAR: Direct targeting of metric cards with simple class */
          .print-metric-card {
            background: #ffffff !important;
            border: 5px solid #FF0000 !important; /* HUGE RED BORDER - IMPOSSIBLE TO MISS */
            backdrop-filter: none !important;
            filter: none !important;
            box-shadow: none !important;
            opacity: 1 !important;
            visibility: visible !important;
            display: block !important;
            width: 100% !important;
            min-height: 100px !important;
            margin-bottom: 1rem !important;
            padding: 1.5rem !important;
            page-break-inside: avoid !important;
            position: relative !important;
            overflow: visible !important;
            transform: none !important;
          }

          /* 6. CRITICAL: Kill Glassmorphism on all other elements */
          [class*="backdrop-blur"],
          [class*="bg-opacity"],
          [class*="bg-white/"],
          .backdrop-blur-sm,
          .bg-white\\/5,
          div[class*="bg-white\\/"] {
            background: #ffffff !important;
            backdrop-filter: none !important;
            filter: none !important;
            border: 2px solid #000000 !important;
            opacity: 1 !important;
            visibility: visible !important;
            display: block !important;
            width: 100% !important;
            margin-bottom: 1rem !important;
            padding: 1rem !important;
            page-break-inside: avoid !important;
          }

          /* 7. Force metric card text to high-contrast black */
          .print-metric-card,
          .print-metric-card *,
          .print-metric-card div,
          .print-metric-card h3,
          .print-metric-card p,
          .print-metric-card span {
            color: #000000 !important;
            opacity: 1 !important;
            visibility: visible !important;
          }

          /* 8. Force other card text to black */
          .bg-white\\/5 *,
          [class*="backdrop-blur"] *,
          [class*="bg-white\\/"] * {
            color: black !important;
            opacity: 1 !important;
          }

          /* 7. Charts - force visibility */
          .recharts-wrapper,
          .recharts-surface,
          [data-chart-id],
          .chart-container {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            overflow: visible !important;
            page-break-inside: avoid !important;
          }

          /* Hide tab navigation container */
          div.flex.space-x-1,
          div.rounded-xl.bg-slate-800\\/50,
          div[class*="bg-slate-800"],
          .inline-flex.mb-6 {
            display: none !important;
          }

          /* Hide ALL buttons */
          button {
            display: none !important;
          }

          /* CRITICAL: Show ALL tab content panels regardless of React state */
          div.space-y-6.animate-in,
          div.space-y-4.animate-in,
          div.animate-in {
            display: block !important;
            opacity: 1 !important;
            transform: none !important;
            animation: none !important;
            margin-bottom: 24pt !important;
            page-break-before: auto !important;
          }

          /* Force visibility of all sections */
          .animate-in.fade-in,
          .slide-in-from-bottom-2 {
            display: block !important;
            visibility: visible !important;
          }

          /* Section headers in print */
          div.animate-in:before {
            display: block;
            margin-bottom: 12pt;
            page-break-after: avoid;
          }

          /* Default text colors for print */
          body, div, span, p {
            color: #1e293b;
          }

          /* Specific overrides for metric values */
          .text-2xl,
          div[class*="text-2xl"],
          div[class*="font-bold"],
          .text-white,
          div.text-white,
          span.text-white {
            color: #0f172a !important;
            font-size: 20pt !important;
            font-weight: bold !important;
          }

          /* Target metric cards specifically */
          .bg-white\/5 .text-2xl,
          .bg-white\/5 div[class*="font-bold"] {
            color: #0f172a !important;
          }

          /* Labels */
          .text-sm,
          .text-xs,
          div[class*="text-sm"] {
            color: #64748b !important;
            font-size: 9pt !important;
          }

          /* Typography */
          h1 {
            color: #0f172a;
            font-size: 24pt;
            margin-bottom: 12pt;
            page-break-after: avoid;
          }

          h2 {
            color: #1e293b;
            font-size: 16pt;
            margin-top: 16pt;
            page-break-after: avoid;
          }

          h3 {
            color: #1e293b;
            font-size: 13pt;
            page-break-after: avoid;
          }

          p {
            color: #475569;
            font-size: 11pt;
            line-height: 1.6;
          }

          /* Clean backgrounds for specific dark elements ONLY */
          body {
            background: white !important;
          }

          /* Metric cards - keep them visible */
          .bg-white\\/5,
          .backdrop-blur-sm {
            background: #f8fafc !important;
            border: 1px solid #cbd5e1 !important;
          }

          /* Insight cards - preserve their colored backgrounds but lighten */
          .bg-red-500\\/5 {
            background: #fee2e2 !important;
            border: 1px solid #fecaca !important;
          }

          .bg-yellow-500\\/5 {
            background: #fef3c7 !important;
            border: 1px solid #fde68a !important;
          }

          .bg-green-500\\/5 {
            background: #d1fae5 !important;
            border: 1px solid #a7f3d0 !important;
          }

          .bg-blue-500\\/5 {
            background: #dbeafe !important;
            border: 1px solid #bfdbfe !important;
          }

          /* NUCLEAR: Force ALL content inside metric cards to be dark */
          .bg-white\\/5 *,
          .bg-white\\/5 div,
          .bg-white\\/5 span,
          .bg-white\\/5 p,
          .bg-white\\/5 h1,
          .bg-white\\/5 h2,
          .bg-white\\/5 h3 {
            color: #0f172a !important;
          }

          /* Metric card labels */
          .bg-white\\/5 .text-sm,
          .bg-white\\/5 .text-slate-400 {
            color: #64748b !important;
          }

          /* Text colors - FORCE ALL WHITE TEXT TO DARK */
          .text-white,
          div.text-white,
          span.text-white,
          p.text-white,
          h1.text-white,
          h2.text-white,
          h3.text-white {
            color: #0f172a !important;
          }

          .text-slate-400,
          .text-slate-500 {
            color: #64748b !important;
          }

          .text-2xl {
            color: #0f172a !important;
            font-size: 20pt !important;
            font-weight: bold !important;
          }

          /* Charts - CRITICAL: Ensure charts and SVGs are visible */
          .recharts-wrapper,
          .recharts-surface,
          svg,
          svg * {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }

          svg {
            max-width: 100%;
            page-break-inside: avoid;
          }

          svg text {
            fill: #475569 !important;
          }

          /* Insights */
          .border.rounded-xl {
            border: 1px solid #cbd5e1 !important;
            border-left-width: 3pt !important;
            background: white !important;
            page-break-inside: avoid;
          }

          /* Tables */
          table {
            border-collapse: collapse;
            page-break-inside: auto;
          }

          th {
            background: #f1f5f9 !important;
            color: #0f172a !important;
            border: 1px solid #cbd5e1 !important;
          }

          td {
            color: #334155 !important;
            border: 1px solid #e2e8f0 !important;
          }

          /* Page breaks */
          .space-y-8 > *,
          .grid > * {
            page-break-inside: avoid;
          }

          /* Footer branding */
          @page {
            @bottom-center {
              content: "Generated by DataWizard AI | forgecreative.cz/datawizard | Page " counter(page) " of " counter(pages);
              font-size: 8pt;
              color: #94a3b8;
            }
          }
        }

        /* Screen preview styles */
        @media screen {
          .print-container {
            max-width: 210mm;
            margin: 0 auto;
            background: white;
            padding: 40px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }

          .print-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #0f172a;
            color: white;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 1000;
          }

          .print-body {
            margin-top: 60px;
          }

          button {
            background: linear-gradient(135deg, #10b981 0%, #0ea5e9 100%);
            color: white;
            border: none;
            padding: 10px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
          }

          button:hover {
            opacity: 0.9;
          }

          /* Hide header when printing */
          @media print {
            .print-header {
              display: none !important;
            }
            .print-body {
              margin-top: 0 !important;
            }
          }
        }
      `}</style>

      <div className="print-header no-print">
        <div>
          <h2 style={{ margin: 0, fontSize: "18px" }}>
            <span style={{ color: "#0ea5e9" }}>Data</span>Wizard Print Preview
          </h2>
          <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>
            {language === "cs" ? "Stiskněte Cmd+P (nebo Ctrl+P) pro tisk" : "Press Cmd+P (or Ctrl+P) to print"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => window.print()}>
            {language === "cs" ? "🖨️ Tisknout" : "🖨️ Print"}
          </button>
          <button
            onClick={() => window.close()}
            style={{ background: "#475569" }}
          >
            {language === "cs" ? "✕ Zavřít" : "✕ Close"}
          </button>
        </div>
      </div>

      <div className="print-body">
        <div className="print-container">
          <ReportInterface data={reportData} printMode={true} />
        </div>
      </div>
    </>
  );
}
