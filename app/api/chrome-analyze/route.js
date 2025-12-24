import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Chrome Extension Integration Endpoint
// Accepts web page data and returns AI analysis
export async function POST(req) {
  try {
    const data = await req.json();
    const { pageContent, pageUrl, pageTitle, customPrompt } = data;

    // Validate required fields
    if (!pageContent) {
      return NextResponse.json(
        { error: "pageContent is required" },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "API Key is missing" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Build analysis prompt
    const prompt = `
      You are analyzing a web page for the user.

      Page URL: ${pageUrl || "Not provided"}
      Page Title: ${pageTitle || "Not provided"}

      Page Content:
      ${pageContent}

      ${customPrompt ? `User Request: ${customPrompt}` : "Please provide a concise analysis of this web page, including key insights, main topics, and any important information."}

      Provide a clear, structured response in markdown format.
    `;

    console.log(`Chrome Extension Request: Analyzing ${pageUrl || "unknown URL"}`);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      success: true,
      analysis: text,
      pageUrl: pageUrl || null,
      pageTitle: pageTitle || null
    });

  } catch (error) {
    console.error("Chrome Extension API Error:", error);
    return NextResponse.json(
      { error: error.message || "Analysis failed" },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "online",
    endpoint: "chrome-analyze",
    description: "Chrome Extension Integration - Send web page data for AI analysis"
  });
}
