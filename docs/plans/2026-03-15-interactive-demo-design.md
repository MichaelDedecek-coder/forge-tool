# Interactive Demo: Staged Reveal Design

**Date:** 2026-03-15
**Status:** Approved by Steve
**Scope:** Replace static sample dashboard with interactive "Staged Reveal" demo on `/datapalo` page

## Problem

The current sample demo on the DataPalo page is a static grid of pre-filled metrics and a bar chart. It's boring, doesn't showcase what DataPalo actually does, and fails to create any emotional hook for visitors.

## Solution: Staged Reveal with FOMO CTA

A 4-phase animated demo that simulates DataPalo processing a CSV file in real-time, reveals metrics with counting animations, then blurs the AI insights behind a CTA wall — creating FOMO and driving uploads.

## State Machine

Replace `showSample` boolean with `demoPhase` (0–4):

| Phase | Duration | What happens |
|-------|----------|-------------|
| 0 | — | Demo not started (initial state) |
| 1 | 0–1.5s | "Reading file..." scan-line animation, file badge: `kavarna-prodeje.csv · 2,847 řádků` |
| 2 | 1.5–3s | "Finding patterns..." pulsing bar chart icon |
| 3 | 3–4.5s | "Building insights..." sparkle animation, progress at 75% |
| 4 | 4.5s+ | Dashboard reveal with counting metrics, animated chart, typewriter insight → blur wall + CTA |

## Phase 4 Details

### Metrics (counting animation)
- €0 → €142,847 over 1.2s with ease-out
- 0% → +12.3% (growth)
- 0% → 34.2% (margin)
- 200ms stagger between each metric

### Bar Chart
- Bars animate from 0% height to target
- 100ms stagger per bar

### AI Insight Typewriter
- Types ~50 characters of insight text
- Then applies `filter: blur(6px)` with gradient mask (sharp → blurred)
- 2 additional insight cards fully blurred from start

### FOMO CTA Overlay
- Frosted glass backdrop over blurred insights
- Gradient border (pink → indigo)
- Text: "Nahrajte svůj soubor a uvidíte celou analýzu" / "Upload your file to see the full analysis"
- Primary button → triggers dropzone file input click
- Secondary button → resets demo to phase 0

## Technical Approach

- **No new dependencies** — pure React state + CSS animations + `requestAnimationFrame`
- **All changes in `app/datapalo/page.js`** — replaces existing `showSample` ternary block (~lines 877–927)
- **New CSS keyframes** added to existing `<style dangerouslySetInnerHTML>` block
- **`useRef` + `requestAnimationFrame`** for smooth number counting
- **`setTimeout` chain** to drive phase transitions
- **CSS `filter: blur()` with gradient mask** for insight blur effect

## Design System Compliance

- Pink (#E06792) for primary CTA button and progress accents
- Indigo (#3F51B5) for secondary elements
- Lime (#A1C50A) for positive metric changes
- JetBrains Mono for metric values and file badge
- Satoshi for body text
- Dark gradient background consistent with page
- Czech diacritics in all CS locale strings
