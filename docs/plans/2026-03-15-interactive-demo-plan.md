# Interactive Demo: Staged Reveal — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the static sample dashboard with an animated 4-phase "Staged Reveal" demo that simulates DataPalo processing a CSV, counting up metrics, then blurring AI insights behind a FOMO CTA.

**Architecture:** Single-file change in `app/datapalo/page.js`. A `demoPhase` state variable (0–4) replaces the `showSample` boolean. `setTimeout` chains drive phase transitions. `requestAnimationFrame` handles smooth number counting. CSS keyframes + `filter: blur()` handle visual effects.

**Tech Stack:** React 18 (useState, useEffect, useRef, useCallback), CSS keyframes via `<style dangerouslySetInnerHTML>`, requestAnimationFrame for counting.

---

### Task 1: Add new keyframes to the style block

**Files:**
- Modify: `app/datapalo/page.js:645-649` (before closing of style block)

**Step 1: Add keyframes**

Add these keyframes before the closing backtick of the `<style>` block (line 649):

```css
@keyframes typewriter {
  from { width: 0; }
  to { width: 100%; }
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
```

**Step 2: Verify no syntax errors**

Run: `cd /Users/michaeldedecek/forge-tool && npx next build --no-lint 2>&1 | head -20`
Expected: Build starts without CSS parse errors.

**Step 3: Commit**

```bash
git add app/datapalo/page.js
git commit -m "feat(demo): add keyframes for staged reveal animations"
```

---

### Task 2: Replace state variables

**Files:**
- Modify: `app/datapalo/page.js:93` (state declarations)

**Step 1: Replace `showSample` with `demoPhase` and add counting refs**

Find line 93:
```javascript
  const [showSample, setShowSample] = useState(false);
```

Replace with:
```javascript
  const [demoPhase, setDemoPhase] = useState(0); // 0=idle, 1=reading, 2=patterns, 3=insights, 4=reveal
  const [demoMetrics, setDemoMetrics] = useState({ revenue: 0, growth: 0, margin: 0 });
  const demoTimersRef = useRef([]);
  const countingRef = useRef(null);
```

**Step 2: Commit**

```bash
git add app/datapalo/page.js
git commit -m "feat(demo): replace showSample with demoPhase state machine"
```

---

### Task 3: Add demo control functions

**Files:**
- Modify: `app/datapalo/page.js` — insert after the new state declarations (after Task 2's additions, around line 97)

**Step 1: Add startDemo and resetDemo functions**

Insert right after the `countingRef` declaration:

```javascript
  // ── DEMO: Staged Reveal Logic ──
  const startDemo = useCallback(() => {
    // Clear any existing timers
    demoTimersRef.current.forEach(t => clearTimeout(t));
    demoTimersRef.current = [];
    if (countingRef.current) cancelAnimationFrame(countingRef.current);

    setDemoMetrics({ revenue: 0, growth: 0, margin: 0 });
    setDemoPhase(1);

    // Phase 2: Finding patterns at 1.5s
    demoTimersRef.current.push(setTimeout(() => setDemoPhase(2), 1500));

    // Phase 3: Building insights at 3s
    demoTimersRef.current.push(setTimeout(() => setDemoPhase(3), 3000));

    // Phase 4: Reveal at 4.5s
    demoTimersRef.current.push(setTimeout(() => {
      setDemoPhase(4);
      // Animate counting
      const startTime = performance.now();
      const duration = 1200;
      const targets = { revenue: 142847, growth: 12.3, margin: 34.2 };

      const animate = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      demoTimersRef.current.forEach(t => clearTimeout(t));
      if (countingRef.current) cancelAnimationFrame(countingRef.current);
    };
  }, []);
```

**Step 2: Commit**

```bash
git add app/datapalo/page.js
git commit -m "feat(demo): add startDemo/resetDemo with counting animation"
```

---

### Task 4: Update the "Explore Sample" button trigger

**Files:**
- Modify: `app/datapalo/page.js:859` (the explore sample button onClick)

**Step 1: Change onClick from `setShowSample(true)` to `startDemo()`**

Find:
```javascript
                  onClick={() => setShowSample(true)}
```

Replace with:
```javascript
                  onClick={startDemo}
```

**Step 2: Also update the button label for the demo context**

Find:
```javascript
                  {language === "cs" ? "Prozkoumat ukázku" : "Explore Sample"} →
```

Replace with:
```javascript
                  {language === "cs" ? "Spustit živou ukázku" : "Watch DataPalo Analyze"} →
```

**Step 3: Commit**

```bash
git add app/datapalo/page.js
git commit -m "feat(demo): wire explore button to startDemo"
```

---

### Task 5: Update the conditional to use demoPhase

**Files:**
- Modify: `app/datapalo/page.js:873` (the ternary condition)

**Step 1: Replace showSample ternary condition**

Find:
```javascript
          ) : (
            /* Sample Dashboard */
            <div style={{ padding: "20px 0" }}>
```

This whole block (lines 873–923) will be replaced in the next task. First, update the condition on line ~832 that checks `!showSample`.

Find the condition that renders either the dropzone prompt or the sample. Look for:
```javascript
          {!showSample ? (
```

Replace with:
```javascript
          {demoPhase === 0 ? (
```

**Step 2: Commit**

```bash
git add app/datapalo/page.js
git commit -m "feat(demo): update conditional to use demoPhase"
```

---

### Task 6: Replace the static sample dashboard with Staged Reveal demo

**Files:**
- Modify: `app/datapalo/page.js:873-923` (the entire sample dashboard block)

**Step 1: Replace the sample dashboard block**

Find the entire block from `/* Sample Dashboard */` to the closing `</div>` and `)}`:

```javascript
          ) : (
            /* Sample Dashboard */
            <div style={{ padding: "20px 0" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "24px" }}>
                {[
                  { label: language === "cs" ? "Tržby" : "Revenue", value: "\u20AC142,847", change: "+12.3%", positive: true },
                  { label: language === "cs" ? "Růst" : "Growth", value: "+12.3%", change: language === "cs" ? "Rostoucí trend" : "Trending upward", positive: true },
                  { label: language === "cs" ? "Marže" : "Margin", value: "34.2%", change: language === "cs" ? "Nad cílem" : "Above target", positive: true },
                ].map((m, i) => (
                  <div key={i} style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "12px", padding: "16px",
                    animation: `fadeSlideUp 600ms cubic-bezier(0.16, 1, 0.3, 1) ${100 + i * 150}ms both`,
                  }}>
                    <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px", fontFamily: "'JetBrains Mono', monospace" }}>{m.label}</div>
                    <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "clamp(1.3rem, 5vw, 1.8rem)", color: "rgba(255,255,255,0.92)" }}>{m.value}</div>
                    <div style={{ fontSize: "0.75rem", marginTop: "4px", color: "#A1C50A" }}>{m.change}</div>
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
                {language === "cs" ? "Zpět" : "Reset demo"}
              </button>
            </div>
          )}
```

Replace with the full Staged Reveal demo:

```jsx
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
                      ? (language === "cs" ? "Čtení souboru..." : "Reading file...")
                      : demoPhase === 2
                      ? (language === "cs" ? "Hledání vzorců..." : "Finding patterns...")
                      : (language === "cs" ? "Budování insightů..." : "Building insights...")}
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

                  {/* AI Insight — typewriter then blur */}
                  <div style={{ marginTop: "20px", position: "relative" }}>
                    {/* First insight — partially visible */}
                    <div style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "12px", padding: "16px", marginBottom: "8px",
                      animation: "blurReveal 500ms cubic-bezier(0.16, 1, 0.3, 1) 1500ms both",
                      overflow: "hidden",
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
                        maskImage: "linear-gradient(to right, black 60%, transparent 100%)",
                        WebkitMaskImage: "linear-gradient(to right, black 60%, transparent 100%)",
                      }}>
                        {language === "cs"
                          ? "Páteční tržby jsou o 23% vyšší než průměr. Zvažte rozšíření personálu v pátek a nabídku speciálního menu..."
                          : "Friday revenue is 23% above average. Consider expanding Friday staffing and offering a special weekend menu..."}
                      </div>
                    </div>

                    {/* Blurred insight cards */}
                    <div style={{
                      filter: "blur(6px)", userSelect: "none", pointerEvents: "none",
                      animation: "blurReveal 500ms cubic-bezier(0.16, 1, 0.3, 1) 1800ms both",
                    }}>
                      <div style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "12px", padding: "16px", marginBottom: "8px",
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

                      <div style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "12px", padding: "16px",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                          <span style={{ fontSize: "14px" }}>⚠️</span>
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
                    </div>

                    {/* FOMO CTA overlay */}
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0,
                      background: "linear-gradient(to top, rgba(8,8,24,0.95) 40%, rgba(8,8,24,0.8) 70%, transparent 100%)",
                      padding: "60px 20px 24px",
                      display: "flex", flexDirection: "column", alignItems: "center",
                      animation: "blurReveal 600ms cubic-bezier(0.16, 1, 0.3, 1) 2200ms both",
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
                            onClick={resetDemo}
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
```

**Step 2: Build check**

Run: `cd /Users/michaeldedecek/forge-tool && npx next build --no-lint 2>&1 | tail -10`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add app/datapalo/page.js
git commit -m "feat(demo): implement Staged Reveal interactive demo with FOMO CTA"
```

---

### Task 7: Visual QA and final verification

**Step 1: Start dev server and test**

Run: `cd /Users/michaeldedecek/forge-tool && npx next dev --turbopack`

Test manually:
- Visit `/datapalo`
- Click "Spustit živou ukázku" / "Watch DataPalo Analyze"
- Verify phases 1→2→3 animate with correct labels, progress bar
- Verify phase 4: metrics count up, bars animate, insight fades in then blurs
- Verify FOMO CTA appears over blurred insights
- Verify "Nahrát svůj soubor" button triggers file picker
- Verify "Přehrát znovu" resets to phase 0
- Test both CS and EN language toggle
- Test on mobile viewport (375px width)

**Step 2: Fix any visual issues found during QA**

**Step 3: Final commit if any fixes were needed**

```bash
git add app/datapalo/page.js
git commit -m "fix(demo): visual QA polish adjustments"
```

---

## Dependency Graph

```
Task 1 (keyframes) ──┐
Task 2 (state) ──────┤
Task 3 (functions) ───┤── all independent of each other
Task 4 (button) ──────┤
Task 5 (conditional) ─┘
         │
         ▼
Task 6 (full demo JSX) ── depends on all above
         │
         ▼
Task 7 (visual QA) ── depends on Task 6
```

Tasks 1–5 can be executed in parallel by independent agents.
Task 6 depends on all of 1–5 being complete.
Task 7 is manual QA after Task 6.
