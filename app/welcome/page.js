"use client";

export default function WelcomePage() {
  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#0f172a",
      color: "white",
      fontFamily: "sans-serif",
      position: "relative",
      overflow: "hidden"
    }}>

      {/* Background Gradient Effect */}
      <div style={{
        position: "absolute",
        top: "-50%",
        left: "-25%",
        width: "150%",
        height: "150%",
        background: "radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)",
        pointerEvents: "none"
      }}></div>

      {/* Navigation */}
      <nav style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 60px",
        position: "relative",
        zIndex: 10
      }}>
        <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
          <span style={{ color: "#0ea5e9" }}>Data</span>
          <span style={{ color: "white" }}>Wizard</span>
        </div>
        <button
          onClick={() => window.location.href = '/datawizard'}
          style={{
            background: "linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)",
            color: "white",
            border: "none",
            padding: "12px 30px",
            borderRadius: "25px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "15px",
            boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
            transition: "transform 0.2s"
          }}
          onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
          onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
        >
          Launch App
        </button>
      </nav>

      {/* Hero Section */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 20px",
        position: "relative",
        zIndex: 10
      }}>

        {/* Main Headline */}
        <div style={{ textAlign: "center", maxWidth: "900px" }}>
          <div style={{
            display: "inline-block",
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(14, 165, 233, 0.2))",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: "50px",
            padding: "8px 20px",
            marginBottom: "30px",
            fontSize: "14px",
            color: "#10b981",
            fontWeight: "600"
          }}>
            AI-Powered Data Analysis
          </div>

          <h1 style={{
            fontSize: "4rem",
            fontWeight: "800",
            marginBottom: "30px",
            lineHeight: "1.1",
            background: "linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}>
            Transform Your Data<br />Into Insights
          </h1>

          <p style={{
            fontSize: "1.3rem",
            color: "#94a3b8",
            marginBottom: "50px",
            lineHeight: "1.6",
            maxWidth: "700px",
            margin: "0 auto 50px"
          }}>
            Upload any CSV or Excel file and get instant AI-powered analysis
            with beautiful charts, key metrics, and actionable insights.
          </p>

          <div style={{ display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => window.location.href = '/datawizard'}
              style={{
                padding: "18px 50px",
                fontSize: "1.1rem",
                fontWeight: "bold",
                background: "linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)",
                color: "white",
                border: "none",
                borderRadius: "50px",
                cursor: "pointer",
                boxShadow: "0 10px 40px rgba(16, 185, 129, 0.4)",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-3px)";
                e.target.style.boxShadow = "0 15px 50px rgba(16, 185, 129, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 10px 40px rgba(16, 185, 129, 0.4)";
              }}
            >
              Get Started Free
            </button>
            <button
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              style={{
                padding: "18px 50px",
                fontSize: "1.1rem",
                fontWeight: "600",
                background: "transparent",
                color: "#94a3b8",
                border: "2px solid #334155",
                borderRadius: "50px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = "#10b981";
                e.target.style.color = "#10b981";
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = "#334155";
                e.target.style.color = "#94a3b8";
              }}
            >
              Learn More
            </button>
          </div>
        </div>

        {/* Demo Visual */}
        <div style={{
          marginTop: "80px",
          width: "100%",
          maxWidth: "1000px",
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          border: "1px solid #334155",
          borderRadius: "20px",
          padding: "40px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)"
        }}>
          <div style={{ textAlign: "center", color: "#64748b" }}>
            <div style={{ fontSize: "60px", marginBottom: "20px" }}>📊</div>
            <p style={{ fontSize: "1.1rem", marginBottom: "10px", color: "#94a3b8" }}>
              Upload your data and watch the magic happen
            </p>
            <p style={{ fontSize: "0.9rem", color: "#475569" }}>
              Instant analysis • Beautiful charts • Smart insights
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" style={{
        padding: "100px 20px",
        position: "relative",
        zIndex: 10
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <h2 style={{
              fontSize: "2.5rem",
              fontWeight: "bold",
              marginBottom: "20px",
              color: "white"
            }}>
              Everything You Need
            </h2>
            <p style={{ fontSize: "1.1rem", color: "#64748b" }}>
              Powerful features to analyze your data in seconds
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "30px"
          }}>

            {/* Feature 1 */}
            <div style={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "16px",
              padding: "40px",
              transition: "all 0.3s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#10b981";
              e.currentTarget.style.transform = "translateY(-5px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#334155";
              e.currentTarget.style.transform = "translateY(0)";
            }}>
              <div style={{ fontSize: "40px", marginBottom: "20px" }}>⚡</div>
              <h3 style={{ fontSize: "1.3rem", marginBottom: "15px", color: "white" }}>
                Lightning Fast
              </h3>
              <p style={{ color: "#94a3b8", lineHeight: "1.6" }}>
                Get comprehensive analysis in under 30 seconds.
                No more hours spent in spreadsheets.
              </p>
            </div>

            {/* Feature 2 */}
            <div style={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "16px",
              padding: "40px",
              transition: "all 0.3s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#0ea5e9";
              e.currentTarget.style.transform = "translateY(-5px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#334155";
              e.currentTarget.style.transform = "translateY(0)";
            }}>
              <div style={{ fontSize: "40px", marginBottom: "20px" }}>🎨</div>
              <h3 style={{ fontSize: "1.3rem", marginBottom: "15px", color: "white" }}>
                Beautiful Charts
              </h3>
              <p style={{ color: "#94a3b8", lineHeight: "1.6" }}>
                Auto-generated visualizations that make your data
                easy to understand and share.
              </p>
            </div>

            {/* Feature 3 */}
            <div style={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "16px",
              padding: "40px",
              transition: "all 0.3s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#8b5cf6";
              e.currentTarget.style.transform = "translateY(-5px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#334155";
              e.currentTarget.style.transform = "translateY(0)";
            }}>
              <div style={{ fontSize: "40px", marginBottom: "20px" }}>🧠</div>
              <h3 style={{ fontSize: "1.3rem", marginBottom: "15px", color: "white" }}>
                AI Insights
              </h3>
              <p style={{ color: "#94a3b8", lineHeight: "1.6" }}>
                Powered by advanced AI to find trends, patterns,
                and outliers you might have missed.
              </p>
            </div>

            {/* Feature 4 */}
            <div style={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "16px",
              padding: "40px",
              transition: "all 0.3s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#f59e0b";
              e.currentTarget.style.transform = "translateY(-5px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#334155";
              e.currentTarget.style.transform = "translateY(0)";
            }}>
              <div style={{ fontSize: "40px", marginBottom: "20px" }}>🌍</div>
              <h3 style={{ fontSize: "1.3rem", marginBottom: "15px", color: "white" }}>
                Multilingual
              </h3>
              <p style={{ color: "#94a3b8", lineHeight: "1.6" }}>
                Support for both English and Czech.
                Get analysis in your preferred language.
              </p>
            </div>

            {/* Feature 5 */}
            <div style={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "16px",
              padding: "40px",
              transition: "all 0.3s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#ec4899";
              e.currentTarget.style.transform = "translateY(-5px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#334155";
              e.currentTarget.style.transform = "translateY(0)";
            }}>
              <div style={{ fontSize: "40px", marginBottom: "20px" }}>📁</div>
              <h3 style={{ fontSize: "1.3rem", marginBottom: "15px", color: "white" }}>
                Any Format
              </h3>
              <p style={{ color: "#94a3b8", lineHeight: "1.6" }}>
                Works with CSV and Excel files.
                Just drag, drop, and analyze.
              </p>
            </div>

            {/* Feature 6 */}
            <div style={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "16px",
              padding: "40px",
              transition: "all 0.3s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#06b6d4";
              e.currentTarget.style.transform = "translateY(-5px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#334155";
              e.currentTarget.style.transform = "translateY(0)";
            }}>
              <div style={{ fontSize: "40px", marginBottom: "20px" }}>💾</div>
              <h3 style={{ fontSize: "1.3rem", marginBottom: "15px", color: "white" }}>
                Export Reports
              </h3>
              <p style={{ color: "#94a3b8", lineHeight: "1.6" }}>
                Download your analysis reports and share them
                with your team instantly.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{
        padding: "100px 20px",
        textAlign: "center",
        position: "relative",
        zIndex: 10
      }}>
        <div style={{
          maxWidth: "800px",
          margin: "0 auto",
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(14, 165, 233, 0.1))",
          border: "1px solid rgba(16, 185, 129, 0.2)",
          borderRadius: "24px",
          padding: "60px 40px"
        }}>
          <h2 style={{
            fontSize: "2.5rem",
            fontWeight: "bold",
            marginBottom: "20px",
            color: "white"
          }}>
            Ready to Transform Your Data?
          </h2>
          <p style={{
            fontSize: "1.2rem",
            color: "#94a3b8",
            marginBottom: "40px"
          }}>
            Join hundreds of users who save hours every week with DataWizard
          </p>
          <button
            onClick={() => window.location.href = '/datawizard'}
            style={{
              padding: "20px 60px",
              fontSize: "1.2rem",
              fontWeight: "bold",
              background: "linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)",
              color: "white",
              border: "none",
              borderRadius: "50px",
              cursor: "pointer",
              boxShadow: "0 10px 40px rgba(16, 185, 129, 0.4)",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-3px)";
              e.target.style.boxShadow = "0 15px 50px rgba(16, 185, 129, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 10px 40px rgba(16, 185, 129, 0.4)";
            }}
          >
            Start Analyzing Now
          </button>
          <p style={{
            marginTop: "20px",
            fontSize: "14px",
            color: "#64748b"
          }}>
            No credit card required • Free forever • No signup
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        borderTop: "1px solid #1e293b",
        padding: "40px 20px",
        textAlign: "center",
        color: "#475569",
        fontSize: "14px",
        position: "relative",
        zIndex: 10
      }}>
        <p style={{ marginBottom: "8px" }}>
          Feedback? Ideas? Want to collaborate?
        </p>
        <a
          href="mailto:michael@forgecreative.cz?subject=DataWizard%20Feedback"
          style={{ color: "#0ea5e9", textDecoration: "none", fontWeight: "600" }}
        >
          michael@forgecreative.cz
        </a>
        <p style={{ marginTop: "20px", fontSize: "12px", color: "#334155" }}>
          © 2024 FORGE CREATIVE | AI Job Agency
        </p>
      </div>

    </div>
  );
}
