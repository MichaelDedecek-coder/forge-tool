"use client";

export default function LandingPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 50%, #E9D5FF 100%)",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      position: "relative",
      overflow: "hidden"
    }}>

      {/* SUBTLE BACKGROUND GRID */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          linear-gradient(rgba(139, 92, 246, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(139, 92, 246, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: "50px 50px",
        pointerEvents: "none",
        zIndex: 0
      }} />

      {/* NAVIGATION */}
      <nav style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 40px",
        maxWidth: "1400px",
        margin: "0 auto",
        position: "relative",
        zIndex: 10
      }}>
        {/* LOGO */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          fontSize: "1.5rem",
          fontWeight: "700",
          color: "#111827"
        }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="4" y="20" width="4" height="8" fill="#6366F1" rx="1"/>
            <rect x="10" y="14" width="4" height="14" fill="#8B5CF6" rx="1"/>
            <rect x="16" y="8" width="4" height="20" fill="#A855F7" rx="1"/>
            <path d="M24 4L28 8L24 12" stroke="#6366F1" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>DataWizard <span style={{ color: "#8B5CF6" }}>AI</span></span>
        </div>

        {/* NAV ITEMS */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "32px"
        }}>
          <a
            href="#how-it-works"
            style={{
              color: "#4B5563",
              textDecoration: "none",
              fontSize: "1rem",
              fontWeight: "500",
              transition: "color 0.2s"
            }}
            onMouseEnter={(e) => e.target.style.color = "#111827"}
            onMouseLeave={(e) => e.target.style.color = "#4B5563"}
          >
            How it works
          </a>

          {/* LANGUAGE TOGGLE */}
          <div style={{
            display: "flex",
            gap: "8px",
            color: "#6B7280",
            fontSize: "0.875rem",
            fontWeight: "600"
          }}>
            <span style={{ cursor: "pointer" }}>EN</span>
            <span>|</span>
            <span style={{ cursor: "pointer" }}>CZ</span>
          </div>

          {/* TRY DEMO BUTTON */}
          <button
            onClick={() => window.location.href = '/datawizard'}
            style={{
              padding: "12px 24px",
              fontSize: "1rem",
              fontWeight: "600",
              background: "#6366F1",
              color: "white",
              border: "none",
              borderRadius: "50px",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 16px rgba(99, 102, 241, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.3)";
            }}
          >
            Try Demo
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "80px 40px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 500px), 1fr))",
        gap: "80px",
        alignItems: "center",
        position: "relative",
        zIndex: 1
      }}>
        {/* DECORATIVE SPARKLES */}
        <div style={{ position: "absolute", top: "10%", left: "5%", opacity: 0.6 }}>
          <svg width="20" height="20" viewBox="0 0 20 20">
            <path d="M10 0L11 9L20 10L11 11L10 20L9 11L0 10L9 9Z" fill="#A855F7" opacity="0.5"/>
          </svg>
        </div>
        <div style={{ position: "absolute", top: "20%", right: "15%", opacity: 0.4 }}>
          <svg width="16" height="16" viewBox="0 0 20 20">
            <path d="M10 0L11 9L20 10L11 11L10 20L9 11L0 10L9 9Z" fill="#6366F1" opacity="0.4"/>
          </svg>
        </div>
        <div style={{ position: "absolute", bottom: "15%", left: "12%", opacity: 0.5 }}>
          <svg width="14" height="14" viewBox="0 0 20 20">
            <path d="M10 0L11 9L20 10L11 11L10 20L9 11L0 10L9 9Z" fill="#8B5CF6" opacity="0.3"/>
          </svg>
        </div>

        {/* LEFT COLUMN */}
        <div>
          {/* HEADLINE */}
          <h1 style={{
            fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
            fontWeight: "800",
            marginBottom: "24px",
            lineHeight: "1.1",
            color: "#111827"
          }}>
            8 hours in Excel.
            <br />
            <span style={{ color: "#6366F1" }}>Done in 30 seconds.</span>
          </h1>

          {/* SUBHEADLINE */}
          <p style={{
            fontSize: "clamp(1rem, 2vw, 1.25rem)",
            color: "#4B5563",
            marginBottom: "32px",
            lineHeight: "1.7"
          }}>
            DataWizard AI is your friendly data analyst. We turn messy spreadsheets into clear insights so you can focus on growing your business, not fighting formulas.
          </p>

          {/* FEATURE BULLETS */}
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "40px",
            fontSize: "1rem",
            color: "#6B7280",
            fontWeight: "500"
          }}>
            <span>✨ No dashboards.</span>
            <span>🚀 No setup.</span>
            <span>👇 Just insights.</span>
          </div>

          {/* DUAL CTA BUTTONS */}
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "48px"
          }}>
            {/* PRIMARY CTA - ENHANCED CORAL */}
            <button
              onClick={() => window.location.href = '/datawizard'}
              style={{
                padding: "18px 36px",
                fontSize: "1.125rem",
                fontWeight: "700",
                background: "linear-gradient(135deg, #FF8A80 0%, #FF6B6B 50%, #FF9A8B 100%)",
                color: "white",
                border: "none",
                borderRadius: "50px",
                cursor: "pointer",
                boxShadow: "0 8px 24px rgba(255, 107, 107, 0.35), 0 4px 12px rgba(255, 138, 128, 0.2)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                position: "relative",
                overflow: "hidden"
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-3px) scale(1.02)";
                e.target.style.boxShadow = "0 12px 32px rgba(255, 107, 107, 0.45), 0 6px 16px rgba(255, 138, 128, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0) scale(1)";
                e.target.style.boxShadow = "0 8px 24px rgba(255, 107, 107, 0.35), 0 4px 12px rgba(255, 138, 128, 0.2)";
              }}
            >
              Upload a file ✨
            </button>

            {/* SECONDARY CTA - OUTLINE */}
            <button
              onClick={() => {/* Add demo video or tour */}}
              style={{
                padding: "16px 32px",
                fontSize: "1.125rem",
                fontWeight: "600",
                background: "transparent",
                color: "#6366F1",
                border: "2px solid #6366F1",
                borderRadius: "50px",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#6366F1";
                e.target.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "transparent";
                e.target.style.color = "#6366F1";
              }}
            >
              See the magic ▶
            </button>
          </div>

          {/* TESTIMONIAL - JANA FROM PRAGUE */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "16px 20px",
            background: "rgba(255, 255, 255, 0.8)",
            borderRadius: "12px",
            border: "1px solid rgba(139, 92, 246, 0.1)",
            maxWidth: "fit-content"
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "600",
              fontSize: "1.125rem"
            }}>
              J
            </div>
            <div>
              <p style={{
                margin: 0,
                fontSize: "0.875rem",
                color: "#111827",
                fontWeight: "500"
              }}>
                Finally understand my numbers.
              </p>
              <p style={{
                margin: 0,
                fontSize: "0.75rem",
                color: "#6B7280"
              }}>
                — Jana, Prague
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - GLASSMORPHIC INSIGHT CARD */}
        <div style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "500px"
        }}>
          {/* REALISTIC SPREADSHEET BACKGROUND */}
          <div style={{
            position: "absolute",
            width: "480px",
            height: "480px",
            background: "linear-gradient(to bottom, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)",
            borderRadius: "20px",
            transform: "rotate(-8deg) translateY(20px)",
            boxShadow: "0 20px 60px rgba(139, 92, 246, 0.1)",
            border: "1px solid rgba(139, 92, 246, 0.15)",
            overflow: "hidden"
          }}>
            {/* Spreadsheet Grid */}
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `
                linear-gradient(to right, rgba(139, 92, 246, 0.06) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(139, 92, 246, 0.06) 1px, transparent 1px)
              `,
              backgroundSize: "60px 40px"
            }} />
            {/* Header Row */}
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "40px",
              background: "linear-gradient(to bottom, rgba(99, 102, 241, 0.08), rgba(99, 102, 241, 0.04))",
              borderBottom: "2px solid rgba(139, 92, 246, 0.12)"
            }} />
            {/* Sample Data Bars (simulating content) */}
            <div style={{
              position: "absolute",
              top: "80px",
              left: "20px",
              width: "140px",
              height: "8px",
              background: "linear-gradient(90deg, rgba(99, 102, 241, 0.3), transparent)",
              borderRadius: "2px"
            }} />
            <div style={{
              position: "absolute",
              top: "120px",
              left: "20px",
              width: "180px",
              height: "8px",
              background: "linear-gradient(90deg, rgba(139, 92, 246, 0.3), transparent)",
              borderRadius: "2px"
            }} />
            <div style={{
              position: "absolute",
              top: "160px",
              left: "20px",
              width: "110px",
              height: "8px",
              background: "linear-gradient(90deg, rgba(168, 85, 247, 0.3), transparent)",
              borderRadius: "2px"
            }} />
            {/* Column Labels (simulated) */}
            <div style={{
              position: "absolute",
              top: "12px",
              left: "20px",
              fontSize: "11px",
              fontWeight: "600",
              color: "rgba(99, 102, 241, 0.4)",
              letterSpacing: "0.5px"
            }}>A</div>
            <div style={{
              position: "absolute",
              top: "12px",
              left: "80px",
              fontSize: "11px",
              fontWeight: "600",
              color: "rgba(99, 102, 241, 0.4)",
              letterSpacing: "0.5px"
            }}>B</div>
            <div style={{
              position: "absolute",
              top: "12px",
              left: "140px",
              fontSize: "11px",
              fontWeight: "600",
              color: "rgba(99, 102, 241, 0.4)",
              letterSpacing: "0.5px"
            }}>C</div>
          </div>

          {/* ENHANCED GLASSMORPHIC INSIGHT CARD */}
          <div style={{
            position: "relative",
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            borderRadius: "28px",
            padding: "48px",
            border: "2px solid rgba(255, 255, 255, 0.8)",
            boxShadow: `
              0 24px 48px rgba(99, 102, 241, 0.12),
              0 12px 24px rgba(139, 92, 246, 0.08),
              inset 0 1px 2px rgba(255, 255, 255, 1),
              inset 0 -1px 2px rgba(139, 92, 246, 0.05)
            `,
            width: "100%",
            maxWidth: "440px",
            transform: "translateZ(0)",
            willChange: "transform"
          }}>
            {/* CHART VISUALIZATION */}
            <svg width="100%" height="200" viewBox="0 0 400 200" style={{ marginBottom: "28px" }}>
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="50%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#A855F7" />
                </linearGradient>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Grid lines */}
              <line x1="0" y1="160" x2="400" y2="160" stroke="rgba(139, 92, 246, 0.08)" strokeWidth="1" />
              <line x1="0" y1="120" x2="400" y2="120" stroke="rgba(139, 92, 246, 0.08)" strokeWidth="1" />
              <line x1="0" y1="80" x2="400" y2="80" stroke="rgba(139, 92, 246, 0.08)" strokeWidth="1" />

              {/* Area fill with enhanced opacity */}
              <path
                d="M 0 150 L 50 135 L 100 140 L 150 110 L 200 115 L 250 90 L 300 75 L 350 65 L 400 50 L 400 200 L 0 200 Z"
                fill="url(#areaGradient)"
              />

              {/* Main line with glow effect */}
              <path
                d="M 0 150 L 50 135 L 100 140 L 150 110 L 200 115 L 250 90 L 300 75 L 350 65 L 400 50"
                stroke="url(#lineGradient)"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
              />

              {/* Enhanced data points with halos */}
              <circle cx="150" cy="110" r="8" fill="#6366F1" opacity="0.2" />
              <circle cx="150" cy="110" r="6" fill="#6366F1" />
              <circle cx="250" cy="90" r="8" fill="#8B5CF6" opacity="0.2" />
              <circle cx="250" cy="90" r="6" fill="#8B5CF6" />
              <circle cx="350" cy="65" r="8" fill="#A855F7" opacity="0.2" />
              <circle cx="350" cy="65" r="6" fill="#A855F7" />

              {/* Highlight final point */}
              <circle cx="400" cy="50" r="10" fill="#A855F7" opacity="0.15" />
              <circle cx="400" cy="50" r="7" fill="#A855F7" />
            </svg>

            {/* METRIC */}
            <h2 style={{
              fontSize: "2.5rem",
              fontWeight: "700",
              color: "#111827",
              margin: "0 0 8px 0"
            }}>
              Revenue
              <br />
              up 34%
            </h2>

            {/* CONFIDENCE INFO */}
            <p style={{
              fontSize: "0.875rem",
              color: "#6B7280",
              margin: "0 0 16px 0"
            }}>
              Confidence 98% • 3,150 transactions • Q1/2024–Q3/2024
            </p>
          </div>
        </div>
      </div>

      {/* TRUST BADGES */}
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "0 40px 60px",
        display: "flex",
        gap: "32px",
        justifyContent: "flex-start",
        position: "relative",
        zIndex: 1
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "#6B7280",
          fontSize: "0.875rem",
          fontWeight: "500"
        }}>
          <span style={{ fontSize: "1.25rem" }}>✓</span>
          <span>GDPR</span>
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "#6B7280",
          fontSize: "0.875rem",
          fontWeight: "500"
        }}>
          <span style={{ fontSize: "1.25rem" }}>✓</span>
          <span>No data stored</span>
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "#6B7280",
          fontSize: "0.875rem",
          fontWeight: "500"
        }}>
          <span style={{ fontSize: "1.25rem" }}>✓</span>
          <span>Made in EU</span>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{
        textAlign: "center",
        padding: "40px",
        color: "#9CA3AF",
        fontSize: "0.875rem",
        borderTop: "1px solid rgba(139, 92, 246, 0.1)",
        position: "relative",
        zIndex: 1
      }}>
        <p style={{ marginBottom: "8px" }}>
          Feedback? Ideas? Want to collaborate?
        </p>
        <a
          href="mailto:michael@forgecreative.cz?subject=DataWizard%20Feedback"
          style={{ color: "#6366F1", textDecoration: "none", fontWeight: "600" }}
        >
          michael@forgecreative.cz
        </a>
        <p style={{ marginTop: "16px", fontSize: "0.75rem", color: "#D1D5DB" }}>
          FORGE CREATIVE | AI Job Agency
        </p>
      </div>

    </div>
  );
}
