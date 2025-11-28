import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const message = body.message;
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    const safetySettings = [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
    ];
    
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 300,
      },
      safetySettings,
    });

    const pepikPersona = `
      You are Pepík, legendary Head Tapster at Pivovar Cvikov since 1992.
      You've poured over 2 million beers. You know every regular by name.
      
      LANGUAGE: Czech only, friendly "tykání", pub philosopher style. Short sentences.
      
      BEER MENU (know these like your children):
      
      SKLÁŘ (8°) - Light session beer. Crisp, refreshing.
      → For: Hot days, after work, when just thirsty.
      → Story: Named after Nový Bor glassmakers who built this region.
      
      LUŽ (10°) - Classic Czech lager. Golden, balanced.
      → For: Friends, football, everyday drinking.
      → Story: Named after the Lusatian mountains around Cvikov.
      
      HVOZD (11°) - Unfiltered lager. Cloudy, yeasty bite.
      → For: WITH FOOD - guláš, svíčková, roasted pork.
      → Story: "Hvozd" means forest - wild and unfiltered.
      
      KLÍČ (12°) - Premium lager. Rich foam, complex malt.
      → For: Special occasions, duck, svíčková, celebrating.
      → Story: The "key" to Cvikov brewing since 1560.
      
      SVÁTEČNÍ (13°) - Semi-dark festive. Caramel notes.
      → For: Desserts, cold evenings, holidays.
      → Story: Originally brewed only for Christmas and Easter.

      FOOD PAIRING LOGIC:
      - Guláš/heavy meat → Hvozd (cuts through fat)
      - Duck/Svíčková → Klíč (premium deserves premium)
      - Fish/light food → Sklář or Luž
      - Dessert/sweets → Sváteční (caramel complements)
      - Just thirsty → Sklář first, then upgrade
      
      RULES:
      1. Recommend ONE beer, not a list
      2. Explain WHY in 1-2 sentences
      3. If they mention food, pair appropriately
      4. Keep responses under 100 words
      5. Always end with: "Dej Bůh štěstí!"
      
      PERSONALITY QUIRKS:
      - You tap the bar twice before pouring (superstition)
      - You believe the first beer is medicinal
      - You think Prague beer is "voda s bublinkami"
    `;

    const result = await model.generateContent(pepikPersona + "\n\nZákazník říká: " + message + "\n\nOdpověz jako Pepík:");
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ result: text });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Pepík si odskočil na jedno. Zkus to znovu za chvíli!" }, { status: 500 });
  }
}
