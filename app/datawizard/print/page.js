"use client";

import { useEffect, useState } from "react";
import ReportInterface from "../../components/ReportInterface";

export default function PrintPage() {
  const [reportData, setReportData] = useState(null);
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    // Get report data from localStorage
    const storedData = localStorage.getItem("datawizard_print_data");
    const storedLang = localStorage.getItem("datawizard_print_language");

    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        setReportData(parsed);
        setLanguage(storedLang || "en");

        // Auto-trigger print dialog after content loads
        setTimeout(() => {
          window.print();
        }, 1000);
      } catch (error) {
        console.error("Failed to parse report data:", error);
      }
    }
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

          /* Hide everything except report */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
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

          /* Force ALL text to be visible */
          *,
          div,
          span,
          p,
          h1, h2, h3, h4, h5, h6 {
            color: #1e293b !important;
          }

          /* Specific overrides for metric values */
          .text-2xl,
          div[class*="text-2xl"],
          div[class*="font-bold"] {
            color: #0f172a !important;
            font-size: 20pt !important;
            font-weight: bold !important;
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

          /* Remove dark backgrounds */
          .bg-white\\/5,
          .backdrop-blur-sm,
          .bg-slate-900,
          .bg-slate-950,
          div[style*="background"],
          div[class*="bg-"] {
            background: white !important;
            border: 1px solid #e2e8f0 !important;
          }

          /* Clean metric cards */
          .bg-white\\/5 {
            background: #f8fafc !important;
            border: 1px solid #cbd5e1 !important;
            border-left: 4px solid #0ea5e9 !important;
          }

          /* Text colors */
          .text-white {
            color: #0f172a !important;
          }

          .text-slate-400,
          .text-slate-500 {
            color: #64748b !important;
          }

          .text-2xl {
            color: #0f172a !important;
            font-size: 20pt !important;
          }

          /* Charts */
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
