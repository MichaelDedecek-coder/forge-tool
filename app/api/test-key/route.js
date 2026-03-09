import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

async function testKey() {
  try {
    console.log("🧪 TESTING GOOGLE KEY...");

    // Use environment variable (NEW key from DataWizard 2026)
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not found in environment variables");
    }

    console.log("🔑 Using API Key:", apiKey.slice(0, 20) + "...");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent("Just say the word: SUCCESS");
    const text = result.response.text();

    console.log("✅ GOOGLE RESULT:", text);

    return NextResponse.json({
      status: "Alive",
      message: text,
      keyUsed: apiKey.slice(0, 20) + "..."
    });

  } catch (error) {
    console.error("❌ GOOGLE DIED:", error.message);
    return NextResponse.json({ status: "Dead", error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return testKey();
}

export async function POST() {
  return testKey();
}
