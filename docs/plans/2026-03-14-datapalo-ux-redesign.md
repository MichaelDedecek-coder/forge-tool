# DataPalo App UX Redesign — Design Document

**Date:** 2026-03-14
**Approach:** Incremental Reskin (Approach B)
**Scope:** app/datapalo/page.js — visual layer only, zero logic changes
**Philosophy:** God is in Detail. Less is More.

## Goal

Unify the `/datapalo` app's visual identity with the landing page and implement 4 UX patterns from the Perplexity pattern library to transform the first-use experience.

## Problem

- App uses Tailwind slate/emerald/sky colors (#0f172a, #10b981, #0ea5e9) while landing page uses DataPalo palette (#080818, #E06792, #3F51B5)
- Users clicking "Try It Free" land in what feels like a different product
- No empty state — cold start with no context
- Upload zone has minimal visual feedback
- Processing shows text-only loading stages, no progress bar
- All errors use browser alert() dialogs

## Design Sections

### 1. Design Token Unification

Replace all visual tokens to match the landing page:

| Token | Current | New |
|-------|---------|-----|
| Background | #0f172a | #080818 gradient to #0D0D2B |
| Primary CTA | #10b981 → #0ea5e9 | #E06792 → #CF5585 → #3F51B5 |
| Success/Accent | #10b981 | #A1C50A (lime) |
| Text primary | white | rgba(255,255,255,0.92) |
| Text secondary | #94a3b8 | rgba(255,255,255,0.42) |
| Text muted | #64748b | rgba(255,255,255,0.22) |
| Card bg | #1e293b | rgba(255,255,255,0.03) |
| Card border | #334155 | rgba(255,255,255,0.06) |
| Heading font | system sans-serif | Instrument Serif |
| Body font | system sans-serif | Satoshi |
| Mono font | system monospace | JetBrains Mono |

Fonts loaded via same Google Fonts import as landing page.

### 2. Empty State

Shown when `!fileName && !parsedReport`:

- SVG illustration (bar chart + magnifier, using gradient)
- Heading: "Your insights are waiting" (Instrument Serif)
- Subtext: "Upload your first file, or explore a sample analysis to see what DataPalo can do."
- Two buttons: "Upload Your First File" (primary) + "Explore Sample" (ghost)
- "Explore Sample" reveals static sample dashboard:
  - 3 metric cards: Revenue EUR142,847 / Growth +12.3% / Margin 34.2%
  - Mini bar chart with gradient bars
  - Staggered fadeSlideUp animation (100ms, 250ms, 400ms)
  - "Reset" button to return to empty state
- No API calls — purely static preview data
- Bilingual: en/cs via existing `language` state

### 3. Upload Zone Redesign

Three visual states using existing `isDragActive` and `fileName`:

**State 1 — Idle:** Dashed border (rgba(255,255,255,0.15)), SVG upload icon, "Drop your CSV or Excel file here", format badges (CSV, XLSX, XLS in JetBrains Mono)

**State 2 — Drag over:** Gradient border (solid), radial glow, pulsing icon, tinted background

**State 3 — File loaded:** File name in lime green, row count in mono, integrated "Analyze" button (gradient) + "Remove" ghost button

Existing `react-dropzone` integration unchanged. Same `onDrop`, `getRootProps`, `getInputProps`.

### 4. Processing Animation

When `loading === true`, upload zone transforms into processing view:

- 3px lime progress bar at top (width driven by step * 25%)
- 4 narrated steps with animated SVG icons:
  1. 25% — "Reading your file..." (scan line animation)
  2. 50% — "Finding patterns..." (bar chart pulse)
  3. 75% — "Building your insights..." (sparkle rotation)
  4. 100% — "Done!" in lime green (checkmark bounce)
- PRO users get extra Exa steps between 3 and 4
- Step transitions: fadeIn with translateY(8px)
- Completion: "View Results" button appears after 400ms
- File name + row count shown as context below step label

New state: `processingStep` (1-4). Existing `setTimeout` stages in `runAnalysis()` mapped to step transitions.

### 5. Error Messages

Replace all 8 `alert()` calls with inline error cards:

New state: `errorState: { visible, type, title, message, actions }`
Helper: `showError(type, title, message, actions)`

Three severity levels:
- Red (#E06792) — file errors, parse failures
- Yellow (#F5A623) — size limits, timeouts
- Blue (#5B9CF5) — connection issues

Each card has: 3px left color border, icon, human title, descriptive message, action buttons.

Error auto-clears when user drops a new file. Dismissable with X button.

## What Does NOT Change

- `runAnalysis()` function logic
- Auth flow (Supabase, AuthModal)
- Tier checks (checkTierLimits, canExport, canUseExaResearch)
- File parsing (XLSX.read, sheet_to_csv)
- Gzip compression (compressCSV)
- API call to /api/datapalo
- Response handling and JSON parsing
- Exa Research diagnostics
- PDF export flow
- Usage tracking (incrementUsage, incrementAnonymousUpload)
- UpgradeModal component
- ReportInterface component (results display)

## Files Modified

- `app/datapalo/page.js` — visual layer replacement (all 5 sections)

## Files NOT Modified

- `app/components/ReportInterface.jsx` — results display (future phase)
- `app/components/UpgradeModal.jsx` — upgrade flow (works as-is)
- `app/components/AuthModal.jsx` — auth flow (works as-is)
- `app/lib/*` — all library code untouched

## Success Criteria

1. Visual continuity: landing page → app feels like one product
2. Empty state reduces first-session abandonment
3. Upload zone provides clear feedback in all 3 states
4. Processing animation reduces perceived wait time
5. Error cards are human-readable with recovery actions
6. All existing functionality preserved — zero regressions
7. Bilingual support (en/cs) maintained throughout
