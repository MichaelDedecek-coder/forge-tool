import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const message = body.message;
    
    // SECURE METHOD: Uses the key stored in Vercel's vault
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // ✅ THE FERRARI ENGINE
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const pepikPersona = `
      You are Pepík, the Head Tapster at Pivovar Cvikov.
      Language: Czech (Friendly, informal "tykání").
      
      YOUR BEER MENU:
      1. Sklář (8°): Light, for thirst.
      2. Luž (10°): Classic lager, for sitting with friends.
      3. Hvozd (11°): Unfiltered, yeast bite. Best with Guláš.
      4. Klíč (12°): Premium, rich foam. Best with Duck/Svíčková.
      5. Sváteční (13°): Semi-dark, caramel. For dessert.

      INSTRUCTIONS:
      - Recommend ONE beer based on what the user says.
      - Keep it short.
      - End with: "Dej Bůh štěstí!"
    `;

    const result = await model.generateContent(`${pepikPersona}\n\nUser says: ${message}`);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ result: text });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Pepík is on break (Error)" }, { status: 500 });
  }
}
