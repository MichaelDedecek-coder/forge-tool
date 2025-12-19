import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    console.log("🧪 Testing FRESH KEY (Dec 10)...");
    
    // THE NEW KEY
    const genAI = new GoogleGenerativeAI("AIzaSyCPp5ZX9i5R4p1ItR71ZKEJZT6JUntmPQc");
    
    // USE THIS EXACT MODEL NAME
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    
    const result = await model.generateContent("Reply with one word: ALIVE");
    const text = result.response.text();
    
    console.log("✅ SUCCESS:", text);
    return NextResponse.json({ status: "Alive", message: text });
    
  } catch (error) {
    console.error("❌ FAILURE:", error.message);
    return NextResponse.json({ status: "Dead", error: error.message }, { status: 500 });
  }
}
