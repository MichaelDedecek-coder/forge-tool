import Exa from "exa-js";
import { NextResponse } from "next/server";

/**
 * Diagnostic endpoint that checks if EXA research is configured AND working.
 * Access at: /api/exa-status
 */
export async function GET() {
  const exaConfigured = !!process.env.EXA_API_KEY;
  const geminiConfigured = !!process.env.GEMINI_API_KEY;
  const anthropicConfigured = !!process.env.ANTHROPIC_API_KEY;
  const e2bConfigured = !!process.env.E2B_API_KEY;

  let exaLiveTest = null;

  // Actually test the EXA API if the key is configured
  if (exaConfigured) {
    try {
      const exa = new Exa(process.env.EXA_API_KEY);
      const testResults = await exa.searchAndContents("business data analytics trends 2025", {
        type: "neural",
        numResults: 1,
        text: { maxCharacters: 100 },
      });
      exaLiveTest = {
        status: "working",
        resultsReturned: testResults.results.length,
        sampleTitle: testResults.results[0]?.title || "N/A",
      };
    } catch (error) {
      exaLiveTest = {
        status: "error",
        error: error.message,
        hint: error.message.includes("401") || error.message.includes("403")
          ? "API key is invalid or expired. Get a new one at https://exa.ai"
          : error.message.includes("429")
          ? "Rate limit exceeded. Wait a moment and try again."
          : "Unknown error. Check Vercel logs for details.",
      };
    }
  }

  return NextResponse.json({
    exa_configured: exaConfigured,
    exa_status: exaConfigured ? "KEY SET" : "NOT CONFIGURED",
    exa_live_test: exaLiveTest,
    exa_working: exaLiveTest?.status === "working",
    ai_providers: {
      gemini: geminiConfigured ? "configured" : "not set",
      anthropic: anthropicConfigured ? "configured" : "not set"
    },
    e2b_sandbox: e2bConfigured ? "configured" : "not set",
    research_features: exaLiveTest?.status === "working" ? [
      "Industry Benchmarks",
      "Market Trends",
      "Research Sources",
      "Research Badge"
    ] : [],
    message: !exaConfigured
      ? "EXA_API_KEY not set. Add it to Vercel Environment Variables to enable research-augmented analysis."
      : exaLiveTest?.status === "working"
      ? `EXA is LIVE and working! Test search returned ${exaLiveTest.resultsReturned} result(s).`
      : `EXA key is set but API call FAILED: ${exaLiveTest?.error}. ${exaLiveTest?.hint}`
  });
}
