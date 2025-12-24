import { GoogleGenerativeAI } from "@google/generative-ai";
import { Sandbox } from "@e2b/code-interpreter";
import { NextResponse } from "next/server";

// Allow up to 60 seconds for calculation on Vercel
export const maxDuration = 60; 

export async function POST(req) {
  try {
    const body = await req.json();
    const userQuestion = body.message || "Analyze the sales trend.";
    const dynamicData = body.csvData; 
    const language = body.language || "en"; 

    if (!dynamicData) {
      return NextResponse.json({ error: "No data provided." }, { status: 400 });
    }

    // 1. PREPARE METADATA
    const dataRows = dynamicData.split('\n');
    const headerRow = dataRows[0];
    const totalRows = dataRows.length;

    console.log(`DATAWIZARD INPUT: Received ${totalRows} rows. Lang: ${language}`);

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // 2. SYSTEM PROMPT (v2.1 - Polished Output)
    const systemPrompt = `
    You are DataWizard, a STRICT Python code generator for business data analysis.

    ## YOUR ENVIRONMENT
    A file named 'dataset.csv' has ALREADY been uploaded to your working directory.
    - Total rows in file: ${totalRows}
    - Column headers: ${headerRow}

    ## CRITICAL DATA FORMAT NOTES
    - Margin_Percent column contains WHOLE NUMBERS (e.g., 35 means 35%, NOT 0.35)
    - When displaying margins, do NOT multiply by 100 — they are already percentages
    - Price and Revenue columns are in EUR (or CZK if Czech data)
    - Date formats may vary — use pd.to_datetime() with errors='coerce'

    ## YOUR TASK
    Write Python code to answer: "${userQuestion}"

    ## MANDATORY CODE STRUCTURE
    Your code MUST follow this exact pattern:

    import pandas as pd
    import sys

    # Step 1: Load the REAL file
    try:
        df = pd.read_csv('dataset.csv')
        # POLISHED OUTPUT LINE - DO NOT CHANGE
        print(f"✅ DATA LOADED: {len(df)} rows processed successfully.")
    except Exception as e:
        print(f"Error loading file: {e}")
        sys.exit(1)

    # Step 2: Data cleaning
    # ... your cleaning code ...

    # Step 3: Analysis
    # ... your analysis code ...

    # Step 4: Print results clearly
    print("--- RESULTS ---")
    # ... print findings ...

    ## FORBIDDEN ACTIONS
    - DO NOT use io.StringIO
    - DO NOT create fake/sample/simulated data
    - DO NOT import random
    - DO NOT generate synthetic data
    - DO NOT invent product names
    `;

    const result = await model.generateContent(systemPrompt);
    let pythonCode = result.response.text();
    pythonCode = pythonCode.replace(/```python/g, "").replace(/```/g, "").trim();

    // 3. EXECUTION (With Auto-Retry)
    console.log("🚀 DataWizard: Executing in Sandbox...");
    let sandbox = null;
    let fullOutput = "";

    try {
      sandbox = await Sandbox.create({ apiKey: process.env.E2B_API_KEY });

      // 4. UPLOAD DATA
      await sandbox.files.write("dataset.csv", dynamicData);

      // 5. RUN CODE (ATTEMPT 1)
      let execution = await sandbox.runCode(pythonCode);

      // --- 🛡️ AUTO-RETRY LOGIC ---
      // If output is empty (Cold Start issue), wait 1s and try again.
      if (execution.logs.stdout.length === 0 && execution.logs.stderr.length === 0) {
          console.log("⚠️ Empty output detected (Cold Start?). Retrying execution in 1s...");
          await new Promise(r => setTimeout(r, 1000));
          execution = await sandbox.runCode(pythonCode);
          console.log("🔄 Retry complete.");
      }
      // -----------------------------

      // 6. CAPTURE OUTPUT
      const stdout = execution.logs.stdout.join("\n");
      const stderr = execution.logs.stderr.join("\n");
      fullOutput = stdout + "\n" + stderr;

      console.log("📊 FINAL OUTPUT:", fullOutput);
    } finally {
      // Ensure sandbox is ALWAYS terminated, even if errors occur
      if (sandbox) {
        console.log("🧹 Cleaning up sandbox session...");
        await sandbox.kill();
      }
    }

    // 7. FINAL REPORT (Structured for Visualization - V3)
    const formatterPrompt = `
    You are DataWizard, a professional Data Analyst Reporter.

    Here is the RAW OUTPUT from a verified Python calculation:
    """
    ${fullOutput}
    """

    INSTRUCTIONS:
    You MUST output your response in a specific Markdown format that includes structured JSON blocks for charts.
    Use ${language === 'cs' ? 'CZECH' : 'ENGLISH'} language for all text.

    ### Output Format Rules:

    1. **Title:** Start with a H1 title (\`# Title\`).
    2. **Summary:** Provide a brief executive summary immediately after the title.
    3. **Key Metrics:** List key numbers as bullet points using bold keys:
        * \`- **Total Revenue**: $1.2M (Up 12%)\`
        * \`- **Active Users**: 4,500\`
    4. **Charts:** When data is suitable for visualization, include a JSON code block:
        * Supported types: \`"bar"\`, \`"line"\`, \`"pie"\`
        * Structure:
            \`\`\`json
            {
              "type": "chart",
              "title": "Revenue by Category",
              "chartType": "bar",
              "data": [
                { "category": "Electronics", "revenue": 50000 },
                { "category": "Clothing", "revenue": 35000 }
              ],
              "dataKeys": [
                { "name": "category", "value": "revenue" }
              ]
            }
            \`\`\`
    5. **Insights:** Use a \`## ${language === 'cs' ? 'Poznatky' : 'Insights'}\` section to list detailed findings.
        * Use bold for the insight title: \`- **Seasonality**: Sales peak in Q4...\`

    CRITICAL RULES:
    - Do NOT invent numbers. Only use data from the Python output above.
    - Do NOT show DEBUG messages or technical warnings.
    - If the Python output contains errors, apologize and explain in ${language === 'cs' ? 'Czech' : 'English'}.
    - Always include at least one chart if numerical data is present.
    `;

    const finalResponse = await model.generateContent(formatterPrompt);

    return NextResponse.json({
      question: userQuestion,
      generated_code: pythonCode,
      result: finalResponse.response.text(),
      raw_output: fullOutput
    });

  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}