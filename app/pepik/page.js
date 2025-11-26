"use client";
import { useState } from "react";

export default function PepikPage() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  async function askPepik() {
    if (!input) return;
    setLoading(true);
    setResponse(""); 

    try {
      const res = await fetch("/api/pepik", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      setResponse(data.result);
    } catch (e) {
      setResponse("Promiň, došla mi řeč.");
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#000", color: "#fff", padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#f59e0b", marginBottom: "0.5rem" }}>🍺 Pepík Cvikov</h1>
      <p style={{ color: "#9ca3af", marginBottom: "2rem" }}>Virtual Head Tapster</p>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Mám chuť na..."
        style={{ 
          width: "100%", 
          maxWidth: "500px", 
          height: "120px", 
          padding: "1rem", 
          backgroundColor: "#1f2937", 
          border: "1px solid #374151", 
          borderRadius: "0.5rem", 
          color: "#fff", 
          outline: "none" 
        }}
      />

      <button
        onClick={askPepik}
        disabled={loading}
        style={{ 
          marginTop: "1rem", 
          padding: "0.75rem 2rem", 
          backgroundColor: "#d97706", 
          color: "#000", 
          fontWeight: "bold", 
          borderRadius: "0.5rem", 
          border: "none", 
          cursor: "pointer" 
        }}
      >
        {loading ? "Čepuji..." : "Zeptat se Pepíka"}
      </button>

      {response && (
        <div style={{ marginTop: "2rem", maxWidth: "500px", padding: "1.5rem", backgroundColor: "#1f2937", borderLeft: "4px solid #f59e0b", borderRadius: "0.25rem" }}>
          <p style={{ whiteSpace: "pre-wrap" }}>{response}</p>
        </div>
      )}
    </div>
  );
}
