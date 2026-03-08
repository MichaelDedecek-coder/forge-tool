import { NextResponse } from "next/server";

/**
 * Environment Variables Diagnostic Endpoint
 * This helps debug which API keys are available in your deployment
 */
export async function GET() {
  const envStatus = {
    E2B_API_KEY: !!process.env.E2B_API_KEY,
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    EXA_API_KEY: !!process.env.EXA_API_KEY,

    // Show partial keys for verification (first 10 chars only)
    keys_preview: {
      E2B_API_KEY: process.env.E2B_API_KEY ? process.env.E2B_API_KEY.substring(0, 10) + '...' : null,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) + '...' : null,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.substring(0, 10) + '...' : null,
      EXA_API_KEY: process.env.EXA_API_KEY ? process.env.EXA_API_KEY.substring(0, 10) + '...' : null,
    },

    environment: process.env.VERCEL_ENV || 'development',
    deployment_url: process.env.VERCEL_URL || 'localhost',
  };

  return NextResponse.json({
    status: "ok",
    message: "Environment variables diagnostic",
    ...envStatus,
    recommendation: getRecommendation(envStatus)
  });
}

function getRecommendation(envStatus) {
  const missing = [];

  if (!envStatus.E2B_API_KEY) missing.push("E2B_API_KEY");
  if (!envStatus.GEMINI_API_KEY && !envStatus.ANTHROPIC_API_KEY) {
    return "⚠️ CRITICAL: No AI provider available! Set either GEMINI_API_KEY or ANTHROPIC_API_KEY";
  }
  if (!envStatus.GEMINI_API_KEY) {
    return "ℹ️ Using Claude only (GEMINI_API_KEY not set)";
  }
  if (!envStatus.ANTHROPIC_API_KEY) {
    return "⚠️ No Claude fallback! Set ANTHROPIC_API_KEY for redundancy";
  }
  if (!envStatus.EXA_API_KEY) {
    return "ℹ️ Research augmentation disabled (EXA_API_KEY not set)";
  }

  if (missing.length > 0) {
    return `⚠️ Missing: ${missing.join(', ')}`;
  }

  return "✅ All environment variables are set correctly!";
}
