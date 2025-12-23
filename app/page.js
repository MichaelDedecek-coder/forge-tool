"use client";

export default function LandingPage() {
  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#0f172a",
      color: "white",
      fontFamily: "sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>

      {/* HERO SECTION */}
      <div style={{ textAlign: "center", maxWidth: "800px" }}>

        {/* HEADLINE */}
        <h1 style={{
          fontSize: "3.5rem",
          fontWeight: "bold",
          marginBottom: "30px",
          lineHeight: "1.2"
        }}>
          <span style={{ color: "#94a3b8" }}>8 Hours of Excel.</span>
          <br />
          <span style={{ color: "#0ea5e9" }}>Now 30 Seconds.</span>
        </h1>

        {/* SUBHEADLINE */}
        <p style={{
          fontSize: "1.3rem",
          color: "#64748b",
          marginBottom: "50px",
          lineHeight: "1.6"
        }}>
          Upload your CSV or Excel file. Get instant AI-powered analysis with charts, insights, and trends.
        </p>

        {/* CTA BUTTON */}
        <button
          onClick={() => window.location.href = '/datawizard'}
          style={{
            padding: "18px 60px",
            fontSize: "1.2rem",
            fontWeight: "bold",
            background: "linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)",
            color: "white",
            border: "none",
            borderRadius: "50px",
            cursor: "pointer",
            boxShadow: "0 10px 40px rgba(16, 185, 129, 0.4)",
            transition: "transform 0.2s, box-shadow 0.2s"
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
          Try Live Demo
        </button>

      </div>

      {/* FOOTER */}
      <div style={{
        position: "absolute",
        bottom: "30px",
        textAlign: "center",
        color: "#475569",
        fontSize: "14px"
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
        <p style={{ marginTop: "15px", fontSize: "12px", color: "#334155" }}>
          FORGE CREATIVE | AI Job Agency
        </p>
      </div>

    </div>
  );
}
