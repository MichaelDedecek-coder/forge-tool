import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const data = await req.json();
    const { industry, challenge } = data;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // USING THE MOST STABLE MODEL (gemini-pro) to fix the 404 error
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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
    console.error("AI Error:", error);
    return NextResponse.json({ error: "Strategy generation failed." }, { status: 500 });
  }
}