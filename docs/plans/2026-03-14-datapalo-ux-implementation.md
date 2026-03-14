# DataPalo App UX Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reskin the /datapalo app to match the landing page design system and add 4 UX patterns (empty state, upload zone, processing animation, error cards).

**Architecture:** Incremental replacement of the visual layer in app/datapalo/page.js. All business logic (auth, tiers, compression, API calls, PDF export, Exa) stays untouched. We modify only JSX and inline styles, adding new state variables for processing steps and error display.

**Tech Stack:** Next.js 14 (App Router), React client component, react-dropzone (existing), inline styles + CSS-in-JSX

**Design doc:** docs/plans/2026-03-14-datapalo-ux-redesign.md

---

### Task 1: Design Token Swap — Background, Fonts, Header

**Files:**
- Modify: `app/datapalo/page.js:557-558` (root div styles)
- Modify: `app/datapalo/page.js:671-679` (header)
- Modify: `app/datapalo/page.js:576-587` (back button)

**Step 1: Add font import and CSS keyframes**

Add a `<style jsx>` block at the top of the return statement (before the root div), importing fonts and defining animations needed throughout:

```jsx
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
```

**Step 2: Update root div background and font**

Change the root `<div>` style from:
```
backgroundColor: "#0f172a", fontFamily: "sans-serif"
```
To:
```
background: "linear-gradient(168deg, #080818 0%, #0D0D2B 35%, #111133 65%, #0E0E28 100%)",
fontFamily: "'Satoshi', -apple-system, BlinkMacSystemFont, sans-serif"
```

**Step 3: Update header to match landing page**

Replace the header (lines 671-679) with DataPalo logo + Instrument Serif heading:

```jsx
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
```

**Step 4: Update back button to glass style**

Replace the back button style with:
```
background: "rgba(255,255,255,0.06)",
border: "1px solid rgba(255,255,255,0.1)",
color: "rgba(255,255,255,0.5)",
backdropFilter: "blur(12px)",
WebkitBackdropFilter: "blur(12px)",
padding: "8px 16px",
borderRadius: "10px",
cursor: "pointer",
fontSize: "14px",
fontFamily: "'Satoshi', sans-serif",
transition: "all 0.25s ease",
```

**Step 5: Update language toggle**

Replace the language toggle styles (lines 592-607) to match landing page:
- Background: `rgba(255,255,255,0.04)` with `rgba(255,255,255,0.06)` border
- Active state: `rgba(224, 103, 146, 0.15)` bg with `rgba(224, 103, 146, 0.25)` border
- Font: JetBrains Mono, 0.75rem, uppercase

**Step 6: Update tier badge colors**

Replace tier badge (lines 611-626):
- PRO: `background: "linear-gradient(135deg, #E06792 0%, #3F51B5 100%)"`
- FREE: `background: "rgba(255,255,255,0.08)"`

**Step 7: Update sign in/out buttons**

Style sign-in button to match landing page nav:
- `background: "rgba(255,255,255,0.08)"`, `border: "1px solid rgba(255,255,255,0.15)"`
- Sign out: `color: "rgba(255,255,255,0.5)"`, `border: "1px solid rgba(255,255,255,0.1)"`

**Step 8: Update footer**

Replace footer colors (lines 876-890):
- Text: `rgba(255,255,255,0.22)` and `rgba(255,255,255,0.12)`
- Link: `#E06792` instead of `#0ea5e9`

**Step 9: Syntax check**

Run: `node -c app/datapalo/page.js`
Expected: No output (clean)

**Step 10: Commit**

```bash
git add app/datapalo/page.js
git commit -m "Reskin /datapalo app: design tokens match landing page"
```

---

### Task 2: Empty State with Sample Data Preview

**Files:**
- Modify: `app/datapalo/page.js` (add state, add JSX before dropzone)

**Step 1: Add showSample state**

After the existing UI state declarations (~line 92), add:
```javascript
const [showSample, setShowSample] = useState(false);
```

**Step 2: Add empty state JSX**

Insert BEFORE the dropzone div (before line 682), wrapped in condition `{!fileName && !parsedReport && !loading && (`:

```jsx
{!fileName && !parsedReport && !loading && (
  <div style={{
    width: "100%",
    maxWidth: "550px",
    textAlign: "center",
    padding: "40px 20px",
    marginBottom: "20px",
  }}>
    {!showSample ? (
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
          {language === "cs" ? "Vase poznatky cekaji" : "Your insights are waiting"}
        </h3>

        <p style={{
          color: "rgba(255,255,255,0.42)",
          fontSize: "0.9rem",
          maxWidth: "400px",
          margin: "0 auto 24px",
        }}>
          {language === "cs"
            ? "Nahrajte svuj prvni soubor, nebo prozkoumejte ukazkovou analyzu."
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
            {language === "cs" ? "Nahrat prvni soubor" : "Upload Your First File"}
          </button>
          <button
            onClick={() => setShowSample(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "transparent", color: "rgba(255,255,255,0.6)",
              border: "1px solid rgba(255,255,255,0.08)", padding: "12px 24px",
              borderRadius: "10px", fontFamily: "'Satoshi', sans-serif",
              fontSize: "0.9rem", fontWeight: "500", cursor: "pointer",
              transition: "all 250ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {language === "cs" ? "Prozkoumat ukazku" : "Explore Sample"} →
          </button>
        </div>
      </>
    ) : (
      /* Sample Dashboard */
      <div style={{ padding: "20px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
          {[
            { label: language === "cs" ? "Trzby" : "Revenue", value: "\u20AC142,847", change: "+12.3%", positive: true },
            { label: language === "cs" ? "Rust" : "Growth", value: "+12.3%", change: language === "cs" ? "Rostouci trend" : "Trending upward", positive: true },
            { label: language === "cs" ? "Marze" : "Margin", value: "34.2%", change: language === "cs" ? "Nad cilem" : "Above target", positive: true },
          ].map((m, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px", padding: "20px",
              animation: `fadeSlideUp 600ms cubic-bezier(0.16, 1, 0.3, 1) ${100 + i * 150}ms both`,
            }}>
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.42)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px", fontFamily: "'JetBrains Mono', monospace" }}>{m.label}</div>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.8rem", color: "rgba(255,255,255,0.92)" }}>{m.value}</div>
              <div style={{ fontSize: "0.8rem", marginTop: "4px", color: "#A1C50A" }}>{m.change}</div>
            </div>
          ))}
        </div>

        {/* Mini bar chart */}
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "12px", padding: "20px", height: "120px",
          display: "flex", alignItems: "flex-end", gap: "8px",
          animation: "fadeSlideUp 600ms cubic-bezier(0.16, 1, 0.3, 1) 450ms both",
        }}>
          {[45, 68, 52, 80, 92, 74, 55, 88].map((h, i) => (
            <div key={i} style={{
              flex: 1, borderRadius: "4px 4px 0 0", height: `${h}%`,
              background: "linear-gradient(135deg, #E06792, #3F51B5)",
              transition: "height 800ms cubic-bezier(0.16, 1, 0.3, 1)",
            }} />
          ))}
        </div>

        <button
          onClick={() => setShowSample(false)}
          style={{
            marginTop: "16px", background: "transparent",
            color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)",
            padding: "8px 16px", borderRadius: "8px", fontSize: "0.8rem",
            fontFamily: "'Satoshi', sans-serif", cursor: "pointer",
          }}
        >
          {language === "cs" ? "Zpet" : "Reset demo"}
        </button>
      </div>
    )}
  </div>
)}
```

**Step 3: Add data-dropzone attribute**

On the dropzone root div, add `data-dropzone` so the empty state button can reference it:
```jsx
<div {...getRootProps()} data-dropzone style={{...}}>
```

**Step 4: Syntax check**

Run: `node -c app/datapalo/page.js`
Expected: No output (clean)

**Step 5: Commit**

```bash
git add app/datapalo/page.js
git commit -m "Add empty state with sample data preview to /datapalo"
```

---

### Task 3: Upload Zone Redesign

**Files:**
- Modify: `app/datapalo/page.js:682-725` (dropzone + analyze button)

**Step 1: Replace dropzone JSX**

Replace the entire dropzone div and analyze button (lines 682-725) with the new 3-state upload zone:

```jsx
<div {...getRootProps()} data-dropzone style={{
  width: "100%", maxWidth: "550px",
  border: isDragActive
    ? "2px solid #E06792"
    : fileName
      ? "1px solid rgba(255,255,255,0.08)"
      : "2px dashed rgba(255,255,255,0.15)",
  borderRadius: "16px",
  padding: fileName ? "32px" : "60px 40px",
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
        color: "rgba(255,255,255,0.42)",
        marginBottom: "24px",
      }}>
        {rowCount.toLocaleString()} {language === "cs" ? "radku" : "rows"} · {language === "cs" ? "Pripraveno k analyze" : "Ready to analyze"}
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
            color: "rgba(255,255,255,0.42)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px", cursor: "pointer",
            transition: "all 0.25s ease",
          }}
        >
          {language === "cs" ? "Odstranit" : "Remove"}
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
        <rect x="12" y="6" width="32" height="40" rx="4" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
        <path d="M22 16h12M22 22h12M22 28h8" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M28 50V38M22 44l6-6 6 6" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <h3 style={{
        fontFamily: "'Instrument Serif', Georgia, serif",
        fontSize: "1.3rem", fontWeight: "400",
        color: "rgba(255,255,255,0.92)",
        marginBottom: "8px",
      }}>
        {language === "cs" ? "Presunte CSV nebo Excel soubor sem" : "Drop your CSV or Excel file here"}
      </h3>
      <p style={{
        color: "rgba(255,255,255,0.42)",
        fontSize: "0.85rem", marginBottom: "16px",
      }}>
        {language === "cs" ? "Okamzite analyzujeme a pripravime poznatky" : "We'll analyze it instantly and build your insights"}
      </p>
      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
        {["CSV", "XLSX", "XLS"].map(fmt => (
          <span key={fmt} style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.7rem", padding: "4px 10px", borderRadius: "6px",
            background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.42)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            {fmt}
          </span>
        ))}
      </div>
    </div>
  )}
</div>
```

**Step 2: Remove the old separate Analyze button**

Delete the old analyze button block (lines 708-725) since it's now integrated into the upload zone State 3.

**Step 3: Syntax check**

Run: `node -c app/datapalo/page.js`
Expected: No output (clean)

**Step 4: Commit**

```bash
git add app/datapalo/page.js
git commit -m "Redesign upload zone: 3 visual states with format badges"
```

---

### Task 4: Processing Animation

**Files:**
- Modify: `app/datapalo/page.js` (add state, add processing view)

**Step 1: Add processingStep state**

After the existing `loadingStage` state (~line 71), add:
```javascript
const [processingStep, setProcessingStep] = useState(0);
```

**Step 2: Update runAnalysis() loading stage setTimeouts**

In `runAnalysis()`, after `setLoading(true)` (line 249), add step transitions:

```javascript
setProcessingStep(1);

// Step 2 — after 1.5s
setTimeout(() => setProcessingStep(2), 1500);

// Step 3 — after 3s (or 3.5s for PRO with Exa)
if (hasExaAccess) {
  setTimeout(() => setProcessingStep(3), 3500);
} else {
  setTimeout(() => setProcessingStep(3), 3000);
}
```

At the end of `runAnalysis()`, after `setLoading(false)` (line 469-470), add:
```javascript
setProcessingStep(0);
```

Also set step 4 when results arrive successfully, before `setLoading(false)`:
```javascript
setProcessingStep(4);
// Brief pause to show "Done!" before revealing results
await new Promise(r => setTimeout(r, 800));
```

**Step 3: Add processing view JSX**

Insert between the dropzone and the results section. When `loading === true`, show the processing view instead of (or overlaying) the dropzone:

```jsx
{loading && (
  <div style={{
    width: "100%", maxWidth: "550px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "48px 32px",
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

    {/* Step icons and labels */}
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
          {language === "cs" ? "Cteme vas soubor..." : "Reading your file..."}
        </div>
      </div>
    )}

    {processingStep === 2 && (
      <div style={{ animation: "fadeIn 400ms cubic-bezier(0.16, 1, 0.3, 1)" }}>
        <svg style={{ width: "64px", height: "64px", margin: "0 auto 16px", animation: "pulseSlow 1.5s ease-in-out infinite" }} viewBox="0 0 64 64" fill="none">
          <rect x="10" y="34" width="10" height="22" rx="2" fill="url(#procGrad)" opacity="0.6"/>
          <rect x="27" y="22" width="10" height="34" rx="2" fill="url(#procGrad)" opacity="0.7"/>
          <rect x="44" y="14" width="10" height="42" rx="2" fill="url(#procGrad)" opacity="0.8"/>
          <defs><linearGradient id="procGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#E06792"/><stop offset="100%" stopColor="#3F51B5"/></linearGradient></defs>
        </svg>
        <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.3rem", color: "rgba(255,255,255,0.92)" }}>
          {language === "cs" ? "Hledame vzory..." : "Finding patterns..."}
        </div>
      </div>
    )}

    {processingStep === 3 && (
      <div style={{ animation: "fadeIn 400ms cubic-bezier(0.16, 1, 0.3, 1)" }}>
        <svg style={{ width: "64px", height: "64px", margin: "0 auto 16px", animation: "sparkle 1.2s ease-in-out infinite" }} viewBox="0 0 64 64" fill="none">
          <path d="M32 8L35 26L52 20L38 32L52 44L35 38L32 56L29 38L12 44L26 32L12 20L29 26Z" fill="url(#procGrad)" opacity="0.7"/>
        </svg>
        <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.3rem", color: "rgba(255,255,255,0.92)" }}>
          {language === "cs" ? "Pripravujeme poznatky..." : "Building your insights..."}
        </div>
      </div>
    )}

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
      {fileName} · {rowCount.toLocaleString()} {language === "cs" ? "radku" : "rows"}
    </div>
  </div>
)}
```

**Step 4: Hide dropzone during loading**

Wrap the dropzone in `{!loading && (` so it's hidden while processing is shown.

**Step 5: Syntax check**

Run: `node -c app/datapalo/page.js`
Expected: No output (clean)

**Step 6: Commit**

```bash
git add app/datapalo/page.js
git commit -m "Add narrated processing animation with 4-step progress bar"
```

---

### Task 5: Error Cards Replacing alert()

**Files:**
- Modify: `app/datapalo/page.js` (add state, add component, replace all alert() calls)

**Step 1: Add error state**

After existing state declarations, add:
```javascript
const [errorState, setErrorState] = useState(null);
// Shape: { type: 'red'|'yellow'|'blue', title: string, message: string, actions: [{label, onClick}] }
```

Add helper:
```javascript
const showError = (type, title, message, actions = []) => {
  setErrorState({ type, title, message, actions });
};
const clearError = () => setErrorState(null);
```

**Step 2: Add error card JSX**

Insert before the dropzone, shown when `errorState` is not null:

```jsx
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
      {errorState.type === 'red' ? '⚠' : errorState.type === 'yellow' ? '⚡' : '🔌'}
    </div>

    {/* Content */}
    <div style={{ flex: 1 }}>
      <h4 style={{
        fontFamily: "'Satoshi', sans-serif", fontSize: "0.95rem",
        fontWeight: "600", color: "rgba(255,255,255,0.92)",
        marginBottom: "6px", margin: "0 0 6px 0",
      }}>
        {errorState.title}
      </h4>
      <p style={{
        color: "rgba(255,255,255,0.42)", fontSize: "0.85rem",
        lineHeight: "1.6", marginBottom: errorState.actions.length > 0 ? "12px" : "0",
        margin: 0,
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
      x
    </button>
  </div>
)}
```

**Step 3: Replace all alert() calls**

Replace each alert() in runAnalysis() with showError():

1. Line 196 (no file):
```javascript
return showError('red',
  language === "cs" ? "Zadny soubor" : "No file selected",
  language === "cs" ? "Nejprve nahrajte soubor." : "Please upload a file first.",
  [{ label: language === "cs" ? "Vybrat soubor" : "Choose a file", onClick: () => { clearError(); document.querySelector('[data-dropzone]')?.click(); } }]
);
```

2. Lines 216-223 (file too large):
```javascript
showError('yellow',
  language === "cs" ? "Soubor je prilis velky" : "This file is a big one",
  isPro
    ? (language === "cs" ? `Soubor presahuje PRO limit 10 MB (${sizeMB} MB).` : `File exceeds the PRO limit of 10 MB (${sizeMB} MB).`)
    : (language === "cs" ? `Soubor ma ${sizeMB} MB a ${rowCount.toLocaleString()} radku. Zmensete pod 3.5 MB nebo prejdete na PRO.` : `File is ${sizeMB} MB with ${rowCount.toLocaleString()} rows. Reduce to under 3.5 MB or upgrade to PRO.`),
  isPro
    ? [{ label: language === "cs" ? "Zkusit mensi soubor" : "Try a smaller file", onClick: () => { clearError(); setCsvData(null); setFileName(null); setRowCount(0); } }]
    : [
        { label: language === "cs" ? "Zkusit mensi soubor" : "Try a smaller file", onClick: () => { clearError(); setCsvData(null); setFileName(null); setRowCount(0); } },
        { label: language === "cs" ? "Zobrazit PRO" : "See PRO plans", onClick: () => { clearError(); window.location.href = '/pricing'; } },
      ]
);
return;
```

3. Lines 365-379 (HTTP errors): Replace `alert(friendlyMsg)` with appropriate showError calls based on status code.

4. Lines 386-393 (JSON parse): Replace with blue error card with "Try again" action.

5. Lines 413-418 (data.error): Replace with red error card.

6. Lines 465-468 (catch): Replace with red error card with "Try again" action.

7. Lines 541-544 (PDF error): Replace with red error card.

**Step 4: Clear error on new file drop**

In the `onDrop` callback (line 163), add at the start:
```javascript
clearError();
```

**Step 5: Syntax check**

Run: `node -c app/datapalo/page.js`
Expected: No output (clean)

**Step 6: Commit**

```bash
git add app/datapalo/page.js
git commit -m "Replace all alert() with inline error cards"
```

---

### Task 6: Update Results Section Colors

**Files:**
- Modify: `app/datapalo/page.js:818-893` (results card, fallback, footer)

**Step 1: Update report card background**

Change the report card wrapper (line 819):
- `background: "#1e293b"` → `background: "rgba(255,255,255,0.03)"`
- `border: "1px solid #334155"` → `border: "1px solid rgba(255,255,255,0.06)"`

Update result header color (line 821):
- `color: "#10b981"` → `color: "#A1C50A"`

Update button styles:
- PDF download gradient: `#10b981 → #0ea5e9` → `#E06792 → #3F51B5`
- TXT button: `#334155` bg → `rgba(255,255,255,0.06)`
- Shadows: use pink shadow instead of green

**Step 2: Update fallback text output (lines 864-874)**

Same card style changes as results.

**Step 3: Update Exa badges and diagnostic banners**

Match gradient colors for research augmented badge (lines 787-816) — keep the purple-to-pink gradient as it's already close to our system.

**Step 4: Syntax check**

Run: `node -c app/datapalo/page.js`
Expected: No output (clean)

**Step 5: Commit**

```bash
git add app/datapalo/page.js
git commit -m "Update results section and footer to DataPalo design tokens"
```

---

### Task 7: Final Verification

**Step 1: Full syntax check**

Run: `node -c app/datapalo/page.js`
Expected: No output (clean)

**Step 2: Visual review checklist**

Verify in browser:
- [ ] Background matches landing page gradient
- [ ] Fonts render (Instrument Serif, Satoshi, JetBrains Mono)
- [ ] Empty state shows on fresh visit
- [ ] "Explore Sample" reveals sample dashboard with animations
- [ ] Upload zone shows format badges in idle state
- [ ] Drag over shows gradient border and glow
- [ ] File loaded shows name, row count, Analyze + Remove buttons
- [ ] Processing shows 4 narrated steps with progress bar
- [ ] Errors show inline cards instead of alert() dialogs
- [ ] Language toggle works for all new text (en/cs)
- [ ] Auth, tier checks, PDF export still work
- [ ] Mobile layout doesn't break

**Step 3: Push and merge**

```bash
git push origin claude/interesting-morse
```

Merge via GitHub web UI, Vercel auto-deploys.
