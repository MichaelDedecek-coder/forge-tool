import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const data = await req.json();
    const { industry, challenge } = data;

    // This connects to your secure API Key in Vercel
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // We use the PRO model for strategic reasoning
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
      Act as a senior business strategy consultant (Michael Dědeček's partner).
      Client Industry: ${industry}
      Client Challenge: ${challenge}
      
      Provide 3 distinct, high-value strategic angles or solutions to solve this challenge.
      Format:
      1. [Bold Title]: Description
      2. [Bold Title]: Description
      3. [Bold Title]: Description
      
      Keep it professional, empathetic, and actionable.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ result: text });

  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: "Failed to generate strategy" }, { status: 500 });
  }
}