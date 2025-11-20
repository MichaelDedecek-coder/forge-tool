import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const data = await req.json();
    const { industry, challenge } = data;

    // Check if API Key exists
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "API Key is missing on Vercel" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // USE SPECIFIC VERSION NUMBER (Most Reliable)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

    const prompt = `
      Act as a senior business strategy consultant.
      Client Industry: ${industry}
      Client Challenge: ${challenge}
      
      Provide 3 distinct, high-value strategic angles.
      Format:
      1. **[Strategy Name]**: [One sentence explanation]
      2. **[Strategy Name]**: [One sentence explanation]
      3. **[Strategy Name]**: [One sentence explanation]
      
      Keep it punchy, professional, and under 150 words total.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ result: text });

  } catch (error) {
    console.error("AI Error Detailed:", error);
    return NextResponse.json({ error: error.message || "Strategy generation failed." }, { status: 500 });
  }
}