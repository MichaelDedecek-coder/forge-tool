import Anthropic from "@anthropic-ai/sdk";
import { Sandbox } from "@e2b/code-interpreter";
import { NextResponse } from "next/server";

// Allow up to 120 seconds for enterprise-scale datasets (50K+ rows)
export const maxDuration = 120;

// --- RATE LIMITING (in-memory, per-IP, resets on deploy) ---
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // max 5 analyses per minute

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

// --- FILE SIZE LIMITS ---
const MAX_CSV_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_ROW_COUNT = 200_000;

export async function POST(req) {
  try {
    // Rate limiting
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment before analyzing again." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const userQuestion = body.message || "Analyze the sales trend.";
    const dynamicData = body.csvData;
    const language = body.language || "en";

    if (!dynamicData) {
      return NextResponse.json({ error: "No data provided." }, { status: 400 });
    }

    // File size guard
    const csvByteSize = Buffer.byteLength(dynamicData, "utf8");
    if (csvByteSize > MAX_CSV_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File too large (${(csvByteSize / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.` },
        { status: 413 }
      );
    }

    // 1. PREPARE METADATA
    const dataRows = dynamicData.split('\n').filter(row => row.trim());
    const headerRow = dataRows[0];
    const totalRows = dataRows.length - 1; // Exclude header

    // Row count guard
    if (totalRows > MAX_ROW_COUNT) {
      return NextResponse.json(
        { error: `Too many rows (${totalRows.toLocaleString()}). Maximum is ${MAX_ROW_COUNT.toLocaleString()}.` },
        { status: 413 }
      );
    }

    console.log(`DATAWIZARD INPUT: Received ${totalRows} rows. Lang: ${language}`);

    // 2. CREATE E2B SANDBOX FOR STATISTICAL PRE-AGGREGATION
    console.log("🚀 Stage 1/3: Initializing Python Sandbox...");
    const sandbox = await Sandbox.create({ apiKey: process.env.E2B_API_KEY });

    // 3. UPLOAD RAW DATA TO SANDBOX
    console.log(`📤 Stage 2/3: Uploading ${totalRows} rows for statistical analysis...`);
    await sandbox.files.write("dataset.csv", dynamicData);

    // 4. STATISTICAL PRE-AGGREGATION SCRIPT
    // This script generates a compact statistical summary instead of sending raw data to LLM
    const preAggregationScript = `
import pandas as pd
import json
import sys
from datetime import datetime

try:
    # Load dataset
    df = pd.read_csv('dataset.csv')
    total_rows = len(df)
    print(f"✅ Loaded {total_rows} rows")

    # Initialize statistical summary
    summary = {
        "total_rows": total_rows,
        "columns": {},
        "sample_rows": []
    }

    # Analyze each column
    for col in df.columns:
        col_info = {
            "name": col,
            "dtype": str(df[col].dtype),
            "null_count": int(df[col].isnull().sum()),
            "null_percent": round(float(df[col].isnull().sum() / total_rows * 100), 2)
        }

        # Detect column type and calculate appropriate statistics
        if pd.api.types.is_numeric_dtype(df[col]):
            # Numerical column statistics
            col_info["type"] = "numerical"
            col_info["stats"] = {
                "mean": float(df[col].mean()) if not df[col].isnull().all() else None,
                "median": float(df[col].median()) if not df[col].isnull().all() else None,
                "std": float(df[col].std()) if not df[col].isnull().all() else None,
                "min": float(df[col].min()) if not df[col].isnull().all() else None,
                "max": float(df[col].max()) if not df[col].isnull().all() else None,
                "q25": float(df[col].quantile(0.25)) if not df[col].isnull().all() else None,
                "q75": float(df[col].quantile(0.75)) if not df[col].isnull().all() else None
            }
            # Detect outliers using IQR method
            if col_info["stats"]["q25"] and col_info["stats"]["q75"]:
                iqr = col_info["stats"]["q75"] - col_info["stats"]["q25"]
                lower_bound = col_info["stats"]["q25"] - 1.5 * iqr
                upper_bound = col_info["stats"]["q75"] + 1.5 * iqr
                outliers = df[(df[col] < lower_bound) | (df[col] > upper_bound)][col]
                col_info["outliers_count"] = len(outliers)

        elif pd.api.types.is_datetime64_any_dtype(df[col]) or col.lower() in ['date', 'time', 'datetime']:
            # Date/Time column
            col_info["type"] = "datetime"
            try:
                date_col = pd.to_datetime(df[col], errors='coerce')
                col_info["stats"] = {
                    "min_date": str(date_col.min()) if not date_col.isnull().all() else None,
                    "max_date": str(date_col.max()) if not date_col.isnull().all() else None,
                    "date_range_days": int((date_col.max() - date_col.min()).days) if not date_col.isnull().all() else None
                }
            except:
                col_info["type"] = "categorical"

        else:
            # Categorical column
            col_info["type"] = "categorical"
            value_counts = df[col].value_counts()
            col_info["unique_count"] = int(df[col].nunique())
            col_info["top_10_values"] = [
                {"value": str(k), "count": int(v), "percent": round(float(v / total_rows * 100), 2)}
                for k, v in value_counts.head(10).items()
            ]

        summary["columns"][col] = col_info

    # SMART SAMPLING: Select 20 representative rows
    sample_indices = []

    # 1. First row (example of structure)
    sample_indices.append(0)

    # 2. Last row (most recent if time-sorted)
    sample_indices.append(len(df) - 1)

    # 3. Random stratified sample (18 more rows)
    if len(df) > 20:
        step = len(df) // 18
        for i in range(1, 19):
            idx = min(i * step, len(df) - 2)
            if idx not in sample_indices:
                sample_indices.append(idx)

    # Get sample rows
    sample_df = df.iloc[sample_indices].head(20)
    summary["sample_rows"] = sample_df.to_dict('records')

    # Output as JSON
    print("\\n### STATISTICAL_SUMMARY ###")
    print(json.dumps(summary, indent=2))
    print("### END_SUMMARY ###")

except Exception as e:
    print(f"Error during pre-aggregation: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
    sys.exit(1)
`;

    // 5. RUN PRE-AGGREGATION
    console.log("🔬 Stage 3/3: Performing statistical aggregation...");
    let execution = await sandbox.runCode(preAggregationScript);

    // Auto-retry logic for cold start
    if (execution.logs.stdout.length === 0 && execution.logs.stderr.length === 0) {
        console.log("⚠️ Empty output detected (Cold Start?). Retrying in 1s...");
        await new Promise(r => setTimeout(r, 1000));
        execution = await sandbox.runCode(preAggregationScript);
    }

    await sandbox.kill();

    // 6. EXTRACT STATISTICAL SUMMARY
    const stdout = execution.logs.stdout.join("\n");
    const stderr = execution.logs.stderr.join("\n");

    console.log("📊 Pre-aggregation complete");

    // Parse the JSON summary from output
    let statisticalSummary = null;
    const summaryMatch = stdout.match(/### STATISTICAL_SUMMARY ###\n([\s\S]*?)\n### END_SUMMARY ###/);
    if (summaryMatch) {
        try {
            statisticalSummary = JSON.parse(summaryMatch[1]);
            console.log(`✅ Statistical summary generated: ${statisticalSummary.total_rows} rows, ${Object.keys(statisticalSummary.columns).length} columns`);
        } catch (e) {
            console.error("Failed to parse statistical summary:", e);
        }
    }

    if (!statisticalSummary) {
        // Fallback if pre-aggregation failed
        console.error("⚠️ Pre-aggregation failed, stderr:", stderr);
        return NextResponse.json({
            error: "Statistical pre-aggregation failed. Please check your data format.",
            debug: { stdout, stderr }
        }, { status: 500 });
    }

    // 7. NOW SEND COMPACT SUMMARY TO LLM (NOT RAW DATA!)
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const fullOutput = stdout + "\n" + stderr;

    // 8. SYSTEM PROMPT — defines DataWizard's persona and output format
    const systemPrompt = `You are DataWizard, a professional Data Analyst with access to a PRE-AGGREGATED STATISTICAL SUMMARY of a large dataset.

You receive VERIFIED statistical data calculated by Python/Pandas. These numbers are 100% accurate — use them directly, never invent or estimate.

## OUTPUT FORMAT
You MUST output your response in a specific Markdown format that includes structured JSON blocks for charts.

### Output Format Rules:

1. **Title:** Start with a H1 title (\`# Title\`) that reflects the analysis.
2. **Summary:** Provide a brief executive summary (2-3 sentences) about the dataset.
3. **Key Metrics:** List the most important numbers as bullet points using bold keys:
    * \`- **Total Rows Analyzed**: [number]\`
    * \`- **[Metric Name]**: [Value]\`
4. **Charts:** Create visualizations from the statistical data. Supported types: \`"bar"\`, \`"line"\`, \`"pie"\`
    * For categorical columns: Use top_10_values to create bar or pie charts
    * For numerical columns: Use the stats (mean, median, min, max) to create comparison charts
    * Structure:
        \`\`\`json
        {
          "type": "chart",
          "title": "Top 10 Categories by Frequency",
          "chartType": "bar",
          "data": [
            { "category": "Value1", "count": 1234 },
            { "category": "Value2", "count": 987 }
          ],
          "dataKeys": [
            { "name": "category", "value": "count" }
          ]
        }
        \`\`\`
5. **Insights:** Use a \`## ${language === 'cs' ? 'Poznatky' : 'Insights'}\` section to list detailed findings.
    * Use bold for insight titles: \`- **Data Quality**: 98% of rows are complete...\`
    * Mention outliers if outliers_count > 0
    * Comment on distributions, trends, and patterns

## CRITICAL RULES:
- **100% ACCURACY**: Only use numbers from the statistical summary. DO NOT invent or estimate.
- **NO FAKE DATA**: Never create synthetic examples or placeholder values.
- **SMART INTERPRETATION**: The sample_rows show representative examples — use them for context.
- **DATA TYPES**: Pay attention to column types (numerical, categorical, datetime).
- **NULL HANDLING**: If null_percent is high, mention data quality issues.
- **OUTLIERS**: If outliers_count exists and is significant, highlight it.
- **LANGUAGE**: Write ALL text in ${language === 'cs' ? 'CZECH (česky)' : 'ENGLISH'}.
- **CHARTS**: Always include at least 2-3 charts if the data supports it.`;

    // 9. USER MESSAGE — dataset context + question
    const userMessage = `## DATASET OVERVIEW
- **Total Rows**: ${statisticalSummary.total_rows.toLocaleString()}
- **Analysis Method**: Statistical Pre-Aggregation (100% mathematically verified)

## USER QUESTION
"${userQuestion}"

## STATISTICAL SUMMARY
${JSON.stringify(statisticalSummary, null, 2)}

Analyze the statistical summary above and answer the user's question: "${userQuestion}"`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    // Extract text from Claude's response blocks
    const resultText = response.content
      .filter(block => block.type === "text")
      .map(block => block.text)
      .join("\n");

    return NextResponse.json({
      question: userQuestion,
      result: resultText,
      raw_output: fullOutput,
      statistical_summary: statisticalSummary,
      total_rows_processed: statisticalSummary.total_rows
    });

  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}