/**
 * Parses the raw markdown output from the LLM into a structured AnalysisReport object.
 * V8 CLAUDE'S EDITION - Robust array handling, verbose logging, and crash prevention.
 * 
 * @param {string} markdown - The raw markdown string from the LLM
 * @returns {Object} The structured report object
 */
export function markdownToReportJson(markdown) {
  // --- CLAUDE'S DIAGNOSTIC LOGGING ---
  console.log("[Parser V8] Input length:", markdown?.length);
  console.log("[Parser V8] First 500 chars:", markdown?.substring(0, 500));

  // Default structure
  const report = {
    title: "Data Analysis Report",
    summary: "",
    metrics: [],
    tables: [],
    charts: [],
    insights: [],
    rawMarkdown: markdown || ""
  };

  if (!markdown || typeof markdown !== 'string') {
    console.warn("[Parser V8] Invalid input: markdown is null or not a string");
    return report;
  }

  try {
    // 1. Extract Title (First H1)
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      report.title = titleMatch[1].trim();
    }

    // 2. Extract Summary
    const summaryMatch = markdown.match(/^#\s+.+\n+([\s\S]*?)(?=\n(?:#|-|\*|```))/);
    if (summaryMatch) {
      report.summary = summaryMatch[1].trim();
    } else if (!titleMatch) {
      const firstPara = markdown.split('\n\n')[0];
      if (firstPara && !firstPara.startsWith('#')) {
        report.summary = firstPara;
      }
    }

    // 3. Extract Metrics
    const metricRegex = /(?:-|\*)\s*\*\*(.+?)\*\*:\s*(.+?)(?:\s*\((.+?)\))?$/gm;
    let metricMatch;
    while ((metricMatch = metricRegex.exec(markdown)) !== null) {
      const [_, label, value, trendStr] = metricMatch;
      let trend = undefined;
      if (trendStr) {
        const lowerTrend = trendStr.toLowerCase();
        if (lowerTrend.includes('up') || lowerTrend.includes('increase') || lowerTrend.includes('+')) {
          trend = { direction: 'up', value: trendStr, label: 'vs last period' };
        } else if (lowerTrend.includes('down') || lowerTrend.includes('decrease') || lowerTrend.includes('-')) {
          trend = { direction: 'down', value: trendStr, label: 'vs last period' };
        } else {
          trend = { direction: 'neutral', value: trendStr, label: '' };
        }
      }
      report.metrics.push({ label: label.trim(), value: value.trim(), trend });
    }

    // 4. Extract Charts - ENHANCED V9 WITH BETTER REGEX & DETECTION
    // Updated regex to handle all variations: ```json, ```JSON, ```, etc.
    const jsonBlockRegex = /```(?:json|JSON)?\s*\n?([\s\S]*?)\n?```/gi;
    let jsonMatch;
    let matchCount = 0;

    console.log("[Parser V9] Starting chart extraction...");

    while ((jsonMatch = jsonBlockRegex.exec(markdown)) !== null) {
      matchCount++;
      const rawContent = jsonMatch[1].trim();
      console.log(`[Parser V9] Match ${matchCount} found. Content snippet:`, rawContent.substring(0, 100));

      try {
        // Attempt to parse the content directly
        let jsonContent;
        try {
          jsonContent = JSON.parse(rawContent);
          console.log(`[Parser V9] Match ${matchCount} parsed successfully`);
        } catch (e) {
          // If direct parse fails, try to find the first '{' or '[' and last '}' or ']'
          console.log(`[Parser V9] Direct parse failed for Match ${matchCount}, attempting cleanup...`);

          // Find start/end of JSON structure (object or array)
          const firstBrace = rawContent.search(/[{[]/);
          const lastBrace = Math.max(rawContent.lastIndexOf('}'), rawContent.lastIndexOf(']'));

          if (firstBrace !== -1 && lastBrace !== -1) {
            const cleaned = rawContent.substring(firstBrace, lastBrace + 1);
            jsonContent = JSON.parse(cleaned);
            console.log(`[Parser V9] Match ${matchCount} parsed after cleanup`);
          } else {
            throw e; // Re-throw if we can't find valid JSON boundaries
          }
        }

        // Handle both single object and array of objects
        const items = Array.isArray(jsonContent) ? jsonContent : [jsonContent];

        items.forEach((item, itemIndex) => {
          // ENHANCED DETECTION: Check if it's a chart object
          // Accept if: (1) type="chart" OR (2) chartType exists OR (3) has both data + dataKeys
          const isChart = item.type === 'chart' ||
                          item.chartType ||
                          (item.data && item.dataKeys);

          if (isChart) {
            console.log(`[Parser V9] ✓ Chart detected in Match ${matchCount}, Item ${itemIndex}:`, {
              title: item.title,
              type: item.type,
              chartType: item.chartType,
              dataLength: item.data?.length,
              dataKeysLength: item.dataKeys?.length
            });

            // Validate and normalize dataKeys
            let dataKeys = item.dataKeys || item.series || [];
            if (!Array.isArray(dataKeys)) dataKeys = [dataKeys]; // Force array

            if (dataKeys.length === 0) {
              console.warn(`[Parser V9] Chart "${item.title}" has no dataKeys! Inferring from data...`);
              // Try to infer keys from the first data point if available
              if (item.data && Array.isArray(item.data) && item.data.length > 0) {
                const keys = Object.keys(item.data[0]);
                if (keys.length >= 2) {
                  dataKeys.push({ name: keys[0], value: keys[1] });
                  console.log(`[Parser V9] Inferred dataKeys:`, dataKeys);
                } else if (keys.length === 1) {
                  // Edge case: single column data (e.g., just values)
                  dataKeys.push({ name: 'index', value: keys[0] });
                }
              }
            }

            // Determine chart type with priority: chartType > type (if not "chart") > default "bar"
            let finalType = 'bar';
            if (item.chartType && typeof item.chartType === 'string') {
              finalType = item.chartType.toLowerCase();
            } else if (item.type && item.type !== 'chart') {
              finalType = item.type.toLowerCase();
            }

            const chartObject = {
              title: item.title || "Untitled Chart",
              chartType: finalType, // Store as chartType for component
              data: Array.isArray(item.data) ? item.data : [],
              dataKeys: dataKeys
            };

            report.charts.push(chartObject);
            console.log(`[Parser V9] ✓ Chart added to report:`, {
              title: chartObject.title,
              chartType: chartObject.chartType,
              dataPoints: chartObject.data.length,
              dataKeys: chartObject.dataKeys.length
            });
          } else {
            console.log(`[Parser V9] ✗ Skipping non-chart JSON in Match ${matchCount}, Item ${itemIndex}`);
          }
        });

      } catch (e) {
        console.error(`[Parser V9] ✗ Failed to parse JSON block ${matchCount}:`, e.message);
        console.error(`[Parser V9] Failed content (first 200 chars):`, rawContent.substring(0, 200));
      }
    }
    console.log("[Parser V9] ═══════════════════════════════════════");
    console.log("[Parser V9] EXTRACTION COMPLETE");
    console.log("[Parser V9] Total JSON blocks found:", matchCount);
    console.log("[Parser V9] Total charts extracted:", report.charts.length);
    console.log("[Parser V9] ═══════════════════════════════════════");
    if (report.charts.length > 0) {
      console.log("[Parser V9] Charts summary:", report.charts.map(c => ({
        title: c.title,
        type: c.chartType,
        dataPoints: c.data.length
      })));
    }

    // 5. Extract Insights
    const insightSectionRegex = /##\s*(?:Insights|Recommendations|Analysis|Findings)([\s\S]*?)(?=\n##|$)/i;
    const insightMatch = insightSectionRegex.exec(markdown);
    if (insightMatch) {
      const insightContent = insightMatch[1];
      const insightLines = insightContent.split(/\n(?:-|\*)\s+/).filter(line => line.trim().length > 0);
      insightLines.forEach(line => {
        const parts = line.split('**:');
        let title = "Insight";
        let content = line;
        let severity = 'info';
        if (parts.length > 1) {
          title = parts[0].replace(/\*\*/g, '').trim();
          content = parts.slice(1).join('**:').trim();
        } else {
          const colonParts = line.split(':');
          if (colonParts.length > 1 && colonParts[0].length < 50) {
             title = colonParts[0].replace(/\*\*/g, '').trim();
             content = colonParts.slice(1).join(':').trim();
          }
        }
        const lowerLine = line.toLowerCase();
        if (lowerLine.includes('critical') || lowerLine.includes('urgent') || lowerLine.includes('risk')) severity = 'critical';
        else if (lowerLine.includes('warning') || lowerLine.includes('attention')) severity = 'warning';
        else if (lowerLine.includes('success') || lowerLine.includes('growth')) severity = 'success';
        report.insights.push({ title, content, severity });
      });
    }

  } catch (error) {
    console.error("[Parser V8] Critical error:", error);
  }

  return report;
}