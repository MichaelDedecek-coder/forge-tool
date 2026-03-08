import { NextResponse } from "next/server";

/**
 * Simple diagnostic endpoint to check if EXA research is configured
 * Access at: /api/exa-status
 */
export async function GET() {
  const exaConfigured = !!process.env.EXA_API_KEY;
  const geminiConfigured = !!process.env.GEMINI_API_KEY;
  const anthropicConfigured = !!process.env.ANTHROPIC_API_KEY;
  const e2bConfigured = !!process.env.E2B_API_KEY;

  return NextResponse.json({
    exa_configured: exaConfigured,
    exa_status: exaConfigured ? "✅ ACTIVE" : "❌ NOT CONFIGURED",
    ai_providers: {
      gemini: geminiConfigured ? "✅" : "❌",
      anthropic: anthropicConfigured ? "✅" : "❌"
    },
    e2b_sandbox: e2bConfigured ? "✅" : "❌",
    research_features: exaConfigured ? [
      "Industry Benchmarks",
      "Market Trends",
      "Research Sources",
      "Research Badge"
    ] : [],
    message: exaConfigured
      ? "EXA Research is ACTIVE. Your analyses will be enriched with industry insights!"
      : "EXA Research is NOT configured. Set EXA_API_KEY in your environment to enable research-augmented analysis."
  });
}
