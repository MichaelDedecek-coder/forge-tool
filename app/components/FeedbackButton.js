"use client";

import { useState } from "react";

export default function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [formData, setFormData] = useState({
    message: "",
    email: "",
    feedback_type: "general"
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.message.trim()) {
      alert("Please enter a message");
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const payload = {
        email: formData.email,
        type: formData.feedback_type,
        message: formData.message,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };

      const res = await fetch("https://formspree.io/f/mbddrkow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to submit feedback");

      setStatus("success");
      setFormData({ message: "", email: "", feedback_type: "general" });

      // Auto-close after 2 seconds
      setTimeout(() => {
        setIsOpen(false);
        setStatus(null);
      }, 2000);

    } catch (error) {
      console.error("Feedback submission error:", error);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Feedback Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          background: "linear-gradient(135deg, #FF8A80 0%, #FF6B6B 50%, #FF9A8B 100%)",
          color: "white",
          border: "none",
          borderRadius: "50px",
          padding: "14px 24px",
          fontSize: "15px",
          fontWeight: "600",
          cursor: "pointer",
          boxShadow: "0 8px 24px rgba(255, 107, 107, 0.35), 0 4px 12px rgba(255, 138, 128, 0.2)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          zIndex: 9998,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
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
        💬 Feedback
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          }}
        >
          {/* Modal Content */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: "20px",
              padding: "32px",
              maxWidth: "500px",
              width: "100%",
              boxShadow: "0 24px 48px rgba(0, 0, 0, 0.2)",
              position: "relative"
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                color: "#6B7280",
                padding: "4px",
                lineHeight: 1
              }}
            >
              ×
            </button>

            {/* Header */}
            <h2 style={{
              margin: "0 0 8px 0",
              fontSize: "24px",
              fontWeight: "700",
              color: "#111827"
            }}>
              Send Feedback
            </h2>
            <p style={{
              margin: "0 0 24px 0",
              fontSize: "14px",
              color: "#6B7280"
            }}>
              Help us improve {typeof window !== 'undefined' && window.location.pathname.includes('/focusmate') ? 'FocusMate' : 'DataWizard'}
            </p>

            {/* Success Message */}
            {status === "success" && (
              <div style={{
                background: "linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)",
                color: "white",
                padding: "16px",
                borderRadius: "12px",
                marginBottom: "20px",
                textAlign: "center",
                fontWeight: "600"
              }}>
                ✅ Thank you! Your feedback has been sent.
              </div>
            )}

            {/* Error Message */}
            {status === "error" && (
              <div style={{
                background: "#FEE2E2",
                color: "#DC2626",
                padding: "16px",
                borderRadius: "12px",
                marginBottom: "20px",
                textAlign: "center",
                fontWeight: "600"
              }}>
                ❌ Failed to send feedback. Please try again.
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {/* Feedback Type */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "8px"
                }}>
                  Type
                </label>
                <select
                  value={formData.feedback_type}
                  onChange={(e) => setFormData({ ...formData, feedback_type: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    fontSize: "15px",
                    color: "#111827",
                    border: "2px solid #E5E7EB",
                    borderRadius: "10px",
                    outline: "none",
                    transition: "border-color 0.2s",
                    fontFamily: "inherit"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#FF6B6B"}
                  onBlur={(e) => e.target.style.borderColor = "#E5E7EB"}
                >
                  <option value="general">General Feedback</option>
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                </select>
              </div>

              {/* Message */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "8px"
                }}>
                  Message <span style={{ color: "#FF6B6B" }}>*</span>
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us what you think..."
                  required
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    fontSize: "15px",
                    color: "#111827",
                    border: "2px solid #E5E7EB",
                    borderRadius: "10px",
                    outline: "none",
                    resize: "vertical",
                    fontFamily: "inherit",
                    transition: "border-color 0.2s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#FF6B6B"}
                  onBlur={(e) => e.target.style.borderColor = "#E5E7EB"}
                />
              </div>

              {/* Email (Optional) */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "8px"
                }}>
                  Email <span style={{ color: "#9CA3AF", fontWeight: "400" }}>(optional)</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    fontSize: "15px",
                    color: "#111827",
                    border: "2px solid #E5E7EB",
                    borderRadius: "10px",
                    outline: "none",
                    fontFamily: "inherit",
                    transition: "border-color 0.2s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#FF6B6B"}
                  onBlur={(e) => e.target.style.borderColor = "#E5E7EB"}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || status === "success"}
                style={{
                  width: "100%",
                  padding: "14px",
                  fontSize: "16px",
                  fontWeight: "700",
                  background: loading || status === "success"
                    ? "#9CA3AF"
                    : "linear-gradient(135deg, #FF8A80 0%, #FF6B6B 50%, #FF9A8B 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  cursor: loading || status === "success" ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 12px rgba(255, 107, 107, 0.3)",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                {loading ? (
                  <>
                    <span style={{
                      display: "inline-block",
                      width: "16px",
                      height: "16px",
                      border: "2px solid white",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite"
                    }} />
                    Sending...
                    <style>{`
                      @keyframes spin {
                        to { transform: rotate(360deg); }
                      }
                    `}</style>
                  </>
                ) : status === "success" ? (
                  "✓ Sent!"
                ) : (
                  "Send Feedback"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
