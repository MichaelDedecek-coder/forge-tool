import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    console.log("🧪 TESTING GOOGLE KEY...");
    
    // HARDCODED KEY from your screenshot
    const apiKey = "AIzaSyDV-UEsCTX0fyosDYtBp0xIL5PyugZw6QY";
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent("Just say the word: SUCCESS");
    const text = result.response.text();
    
    console.log("✅ GOOGLE RESULT:", text);
    
    return NextResponse.json({ status: "Alive", message: text });
    
  } catch (error) {
    console.error("❌ GOOGLE DIED:", error.message);
    return NextResponse.json({ status: "Dead", error: error.message }, { status: 500 });
  }
}
