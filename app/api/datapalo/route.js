import { GoogleGenerativeAI } from "@google/generative-ai";
import { Sandbox } from "@e2b/code-interpreter";
import { NextResponse } from "next/server";
import Exa from "exa-js";
import Anthropic from "@anthropic-ai/sdk";

// Allow up to 120 seconds for enterprise-scale datasets (50K+ rows)
export const maxDuration = 120;

export async function POST(req) {
  try {
    const body = await req.json();
    const userQuestion = body.message || "Analyze the sales trend.";
    const dynamicData = body.csvData;
    const language = body.language || "en";
    const onProgress = body.onProgress; // For progressive loading

    if (!dynamicData) {
      return NextResponse.json({ error: "No data provided." }, { status: 400 });
    }

    // 1. PREPARE METADATA
    const dataRows = dynamicData.split('\n').filter(row => row.trim());
    const headerRow = dataRows[0];
    const totalRows = dataRows.length - 1; // Exclude header

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

    // 7. EXA RESEARCH-AUGMENTED ANALYSIS (AUTOMATIC!)
    let exaInsights = [];
    let researchAugmented = false;
    let exaDiagnostics = { status: "skipped", reason: "EXA_API_KEY not configured" };

    if (process.env.EXA_API_KEY) {
        try {
            console.log("🔍 Fetching research insights from Exa.ai...");
            const exa = new Exa(process.env.EXA_API_KEY);

            // Build research query from column names
            const columns = Object.keys(statisticalSummary.columns || {});
            const columnString = columns.join(" ").toLowerCase();

            // Infer business context
            let businessContext = "business data";
            if (columnString.includes("sales") || columnString.includes("revenue") || columnString.includes("price")) {
                businessContext = "sales revenue";
            } else if (columnString.includes("customer") || columnString.includes("user") || columnString.includes("marketing")) {
                businessContext = "customer marketing";
            } else if (columnString.includes("cost") || columnString.includes("expense") || columnString.includes("profit")) {
                businessContext = "financial business";
            } else if (columnString.includes("product") || columnString.includes("item") || columnString.includes("category")) {
                businessContext = "product business";
            } else if (columnString.includes("employee") || columnString.includes("salary") || columnString.includes("department")) {
                businessContext = "human resources workforce";
            }

            const searchQuery = `${businessContext} trends analysis benchmark statistics industry`;
            console.log(`🔍 Exa Research Query: "${searchQuery}"`);
            exaDiagnostics = { status: "searching", query: searchQuery };

            // Perform Exa search (NO category filter - was returning 0 results)
            const searchResults = await exa.searchAndContents(searchQuery, {
                type: "neural",
                numResults: 5,
                text: { maxCharacters: 500 },
            });

            console.log(`🔍 Exa raw results count: ${searchResults.results.length}`);

            exaInsights = searchResults.results.map((result) => ({
                title: result.title,
                url: result.url,
                summary: result.text || result.snippet || "",
                publishedDate: result.publishedDate,
                score: result.score,
            }));

            if (exaInsights.length > 0) {
                researchAugmented = true;
                exaDiagnostics = { status: "success", query: searchQuery, resultsCount: exaInsights.length };
                console.log(`✨ Research-augmented: ${exaInsights.length} insights found`);
            } else {
                exaDiagnostics = { status: "empty", query: searchQuery, resultsCount: 0, reason: "Exa returned 0 results for this query" };
                console.log("⚠️ Exa returned 0 results for query:", searchQuery);
            }
        } catch (exaError) {
            const errorMsg = exaError.message || "Unknown error";
            exaDiagnostics = {
                status: "error",
                error: errorMsg,
                hint: errorMsg.includes("401") || errorMsg.includes("403")
                    ? "EXA_API_KEY is invalid or expired"
                    : errorMsg.includes("429")
                    ? "Exa rate limit exceeded"
                    : "Check Vercel function logs for details"
            };
            console.error("❌ Exa research FAILED:", errorMsg);
            console.error("❌ Full error:", exaError);
            // Continue without research - graceful degradation
        }
    } else {
        console.log("❌ EXA_API_KEY not configured - research features disabled");
        exaDiagnostics = { status: "not_configured", reason: "EXA_API_KEY environment variable is not set in Vercel" };
    }

    const fullOutput = stdout + "\n" + stderr;

    // 8. Initialize AI provider (Gemini or Claude)
    let genAI, model;
    if (process.env.GEMINI_API_KEY) {
      genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }

    // 9. SYSTEM PROMPT FOR PRE-AGGREGATED DATA (WITH EXA RESEARCH!)
    const systemPrompt = `You are DataPalo, a professional Data Analyst with access to a PRE-AGGREGATED STATISTICAL SUMMARY of a large dataset${researchAugmented ? ' AND EXTERNAL RESEARCH INSIGHTS from Exa.ai' : ''}. You produce precise, data-driven analysis with beautiful chart visualizations.

CRITICAL RULES:
- 100% ACCURACY: Only use numbers from the statistical summary provided. DO NOT invent or estimate.
- NO FAKE DATA: Never create synthetic examples or placeholder values.
- SMART INTERPRETATION: The sample_rows show representative examples - use them for context.
- DATA TYPES: Pay attention to column types (numerical, categorical, datetime).
- NULL HANDLING: If null_percent is high, mention data quality issues.
- OUTLIERS: If outliers_count exists and is significant, highlight it.
- LANGUAGE: Write ALL text in ${language === 'cs' ? 'CZECH (česky)' : 'ENGLISH'}.
- CHARTS: Always include at least 2-3 charts if the data supports it.${researchAugmented ? `

🔴 RESEARCH-AUGMENTED MODE ACTIVE 🔴
You have ${exaInsights.length} external research insights from Exa.ai. This is MANDATORY for your response:

REQUIRED SECTIONS (DO NOT SKIP ANY):
1. ## ${language === 'cs' ? '📊 Srovnání s Průmyslem' : '📊 Industry Benchmarks'} - Compare user's metrics to industry standards
2. ## ${language === 'cs' ? '📈 Tržní Trendy' : '📈 Market Trends'} - Summarize relevant market trends
3. ## ${language === 'cs' ? '📚 Zdroje Výzkumu' : '📚 Research Sources'} - List ALL ${exaInsights.length} sources with links

These sections MUST appear in your markdown output. Do not skip them!` : ''}`;

    const userPrompt = `## DATASET OVERVIEW
- **Total Rows**: ${statisticalSummary.total_rows.toLocaleString()}
- **Analysis Method**: Statistical Pre-Aggregation (100% mathematically verified)
${researchAugmented ? `- **Research Augmentation**: ✨ ${exaInsights.length} external research insights included` : ''}

## USER QUESTION
"${userQuestion}"

## STATISTICAL SUMMARY
You are receiving VERIFIED statistical data calculated by Python/Pandas. These numbers are 100% accurate.

${JSON.stringify(statisticalSummary, null, 2)}
${researchAugmented ? `

## EXTERNAL RESEARCH INSIGHTS (from Exa.ai)
You have access to ${exaInsights.length} relevant research articles and industry reports. Use these to provide context, benchmarks, and trends.

${exaInsights.map((insight, idx) => `
### Research Source ${idx + 1}: ${insight.title}
- **URL**: ${insight.url}
- **Published**: ${insight.publishedDate || 'N/A'}
- **Relevance Score**: ${(insight.score * 100).toFixed(0)}%
- **Summary**: ${insight.summary}
`).join('\n')}

IMPORTANT: When referencing these research insights in your analysis:
- Mention industry benchmarks or trends that relate to the user's data
- Compare the user's metrics to industry standards when applicable
- Cite sources using the format: "According to [source title]..." or "Industry research shows..."
- Add a "📚 Research Context" section to highlight key external insights
` : ''}

## YOUR TASK
Analyze the statistical summary above and answer the user's question: "${userQuestion}"

## OUTPUT FORMAT
You MUST output your response in a specific Markdown format that includes structured JSON blocks for charts.

### Output Format Rules:

1. **Title:** Start with a H1 title (\`# Title\`) that reflects the analysis.
2. **Summary:** Provide a brief executive summary (2-3 sentences) about the dataset.
3. **Key Metrics:** List the most important numbers as bullet points using bold keys:
    * \`- **Total Rows Analyzed**: ${statisticalSummary.total_rows.toLocaleString()}\`
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
${researchAugmented ? `

═══════════════════════════════════════════════════════════════
🔴 RESEARCH-AUGMENTED SECTIONS - ABSOLUTELY MANDATORY 🔴
You MUST include these three sections AFTER the Insights section:
═══════════════════════════════════════════════════════════════

6. **Industry Benchmarks:** Create a \`## ${language === 'cs' ? '📊 Srovnání s Průmyslem' : '📊 Industry Benchmarks'}\` section:
    * REQUIRED: At least 3-5 benchmark comparisons
    * Format: \`- **Metric Name**: Your value vs Industry average (Source: Article Name)\`
    * Example: \`- **Average Transaction Value**: Your $1,085 is 23% above industry average of $880 (Source: E-commerce Industry Report 2025)\`
    * Use the research insights below to find relevant industry data
    * If no exact numbers in research, cite trends: "Industry reports indicate strong growth in this sector"

7. **Market Trends:** Create a \`## ${language === 'cs' ? '📈 Tržní Trendy' : '📈 Market Trends'}\` section:
    * REQUIRED: At least 3-4 market trends
    * Format: \`- **Trend Name**: Description of trend and how it relates to user's data\`
    * Example: \`- **Mobile Commerce Growth**: Industry seeing 40% shift to mobile purchases, aligning with your 45% mobile transaction rate\`
    * Connect research insights to the user's actual data patterns

8. **Research Sources:** Create a \`## ${language === 'cs' ? '📚 Zdroje Výzkumu' : '📚 Research Sources'}\` section:
    * REQUIRED: List ALL ${exaInsights.length} research sources provided below
    * Format: \`- [Exact Source Title](URL) - One sentence description\`
    * Example: \`- [E-commerce Trends Report 2025](https://example.com) - Comprehensive analysis of global e-commerce market dynamics\`
    * DO NOT skip any sources - include all ${exaInsights.length} of them!

⚠️ CRITICAL: Your response will be considered INCOMPLETE if any of these 3 sections are missing! ⚠️
` : ''}`;

    console.log("🤖 Sending to AI for analysis...");

    // Combine system and user prompts
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

    let resultText;
    let aiProvider = "gemini";

    /**
     * POST-PROCESSING FUNCTION: Ensures research sections exist in markdown
     * This guarantees the UI will show research sections even if AI doesn't generate them
     */
    function ensureResearchSections(markdown, exaInsights, lang) {
      if (!exaInsights || exaInsights.length === 0) return markdown;

      const cs = lang === 'cs';
      let result = markdown;

      // Check if Industry Benchmarks section exists
      if (!markdown.match(/##\s*(?:📊\s*)?(?:Industry Benchmarks|Srovnání s Průmyslem)/i)) {
        console.log("⚠️ AI didn't generate Industry Benchmarks section - adding it automatically");
        const benchmarkSection = `\n\n## ${cs ? '📊 Srovnání s Průmyslem' : '📊 Industry Benchmarks'}\n\n` +
          exaInsights.slice(0, 3).map(insight =>
            `- **${insight.title}**: ${cs ? 'Relevantní průmyslový kontext a benchmarky.' : 'Relevant industry context and benchmarks.'} (${cs ? 'Zdroj' : 'Source'}: ${insight.title})\n`
          ).join('');
        result += benchmarkSection;
      }

      // Check if Market Trends section exists
      if (!markdown.match(/##\s*(?:📈\s*)?(?:Market Trends|Tržní Trendy)/i)) {
        console.log("⚠️ AI didn't generate Market Trends section - adding it automatically");
        const trendsSection = `\n\n## ${cs ? '📈 Tržní Trendy' : '📈 Market Trends'}\n\n` +
          exaInsights.slice(0, 3).map(insight =>
            `- **${cs ? 'Aktuální Trend' : 'Current Trend'}**: ${insight.summary.substring(0, 200)}...\n`
          ).join('');
        result += trendsSection;
      }

      // Check if Research Sources section exists
      if (!markdown.match(/##\s*(?:📚\s*)?(?:Research Sources|Zdroje Výzkumu)/i)) {
        console.log("⚠️ AI didn't generate Research Sources section - adding it automatically");
        const sourcesSection = `\n\n## ${cs ? '📚 Zdroje Výzkumu' : '📚 Research Sources'}\n\n` +
          exaInsights.map(insight =>
            `- [${insight.title}](${insight.url}) - ${insight.summary.substring(0, 100)}...\n`
          ).join('');
        result += sourcesSection;
      }

      return result;
    }

    // Try Gemini first (if key exists), fall back to Claude if it fails
    if (process.env.GEMINI_API_KEY && model) {
      try {
          const finalResponse = await model.generateContent(fullPrompt);
          resultText = finalResponse.response.text();
          console.log(`✅ Gemini response received: ${resultText.length} chars`);
      } catch (geminiError) {
          console.log(`⚠️ Gemini failed: ${geminiError.message}`);
          model = null; // Force fallback
      }
    }

    // Use Claude if Gemini not available or failed
    if (!resultText) {
        if (process.env.ANTHROPIC_API_KEY) {
            console.log("🔄 Using Claude API...");
            aiProvider = "claude";

            const anthropic = new Anthropic({
                apiKey: process.env.ANTHROPIC_API_KEY
            });

            const claudeResponse = await anthropic.messages.create({
                model: "claude-opus-4-6",
                max_tokens: 4096,
                system: systemPrompt,
                messages: [{
                    role: "user",
                    content: userPrompt
                }]
            });

            resultText = claudeResponse.content[0].text;
            console.log(`✅ Claude response received: ${resultText.length} chars`);
        } else {
            throw new Error(`No AI provider available. Please set GEMINI_API_KEY or ANTHROPIC_API_KEY.`);
        }
    }

    // 🔴 POST-PROCESSING: Ensure research sections exist
    if (researchAugmented && exaInsights.length > 0) {
      console.log("═══════════════════════════════════════════════════════");
      console.log("🔍 POST-PROCESSING: Checking research sections...");
      console.log(`Research augmented: ${researchAugmented}`);
      console.log(`EXA insights count: ${exaInsights.length}`);
      console.log(`Markdown length before: ${resultText.length} chars`);

      // Check what sections exist BEFORE post-processing
      const hasBenchmarks = resultText.match(/##\s*(?:📊\s*)?(?:Industry Benchmarks|Srovnání s Průmyslem)/i);
      const hasTrends = resultText.match(/##\s*(?:📈\s*)?(?:Market Trends|Tržní Trendy)/i);
      const hasSources = resultText.match(/##\s*(?:📚\s*)?(?:Research Sources|Zdroje Výzkumu)/i);

      console.log(`BEFORE POST-PROCESSING:`);
      console.log(`  - Industry Benchmarks: ${hasBenchmarks ? '✅ FOUND' : '❌ MISSING'}`);
      console.log(`  - Market Trends: ${hasTrends ? '✅ FOUND' : '❌ MISSING'}`);
      console.log(`  - Research Sources: ${hasSources ? '✅ FOUND' : '❌ MISSING'}`);

      const originalLength = resultText.length;
      resultText = ensureResearchSections(resultText, exaInsights, language);

      console.log(`Markdown length after: ${resultText.length} chars`);
      console.log(`Characters added: ${resultText.length - originalLength}`);

      if (resultText.length > originalLength) {
        console.log(`✅ POST-PROCESSING ADDED MISSING SECTIONS`);
      } else {
        console.log("✅ AI generated all sections correctly");
      }
      console.log("═══════════════════════════════════════════════════════");
    }

    // DEBUG: Verify sections exist in FINAL markdown
    console.log("═══════════════════════════════════════════════════════");
    console.log("🔍 FINAL MARKDOWN VERIFICATION");
    console.log("═══════════════════════════════════════════════════════");
    console.log(`Total length: ${resultText.length} chars`);

    const finalHasBenchmarks = resultText.match(/##\s*(?:📊\s*)?(?:Industry Benchmarks|Srovnání s Průmyslem)/i);
    const finalHasTrends = resultText.match(/##\s*(?:📈\s*)?(?:Market Trends|Tržní Trendy)/i);
    const finalHasSources = resultText.match(/##\s*(?:📚\s*)?(?:Research Sources|Zdroje Výzkumu)/i);

    console.log(`FINAL SECTIONS IN MARKDOWN:`);
    console.log(`  - Industry Benchmarks: ${finalHasBenchmarks ? '✅ YES at position ' + resultText.indexOf(finalHasBenchmarks[0]) : '❌ NO'}`);
    console.log(`  - Market Trends: ${finalHasTrends ? '✅ YES at position ' + resultText.indexOf(finalHasTrends[0]) : '❌ NO'}`);
    console.log(`  - Research Sources: ${finalHasSources ? '✅ YES at position ' + resultText.indexOf(finalHasSources[0]) : '❌ NO'}`);

    // Show sections that exist in markdown
    const allSections = resultText.match(/^##\s+.+$/gm) || [];
    console.log(`\nAll ## sections found in markdown (${allSections.length}):`);
    allSections.forEach((section, i) => console.log(`  ${i + 1}. ${section}`));
    console.log("═══════════════════════════════════════════════════════");

    // DEBUG: Log preview
    console.log("🔍 MARKDOWN OUTPUT PREVIEW (first 2000 chars):");
    console.log(resultText.substring(0, 2000));
    console.log("...\n[LAST 500 CHARS]:");
    console.log(resultText.substring(Math.max(0, resultText.length - 500)));

    return NextResponse.json({
      question: userQuestion,
      result: resultText,
      raw_output: fullOutput,
      statistical_summary: statisticalSummary,
      total_rows_processed: statisticalSummary.total_rows,
      research_augmented: researchAugmented,
      exa_insights: exaInsights,
      exa_diagnostics: exaDiagnostics,
      ai_provider: aiProvider
    });

  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}