/**
 * Parses the raw markdown output from the LLM into a structured AnalysisReport object.
 * HARDENED VERSION (V4) - Designed to handle messy LLM output and partial JSON blocks.
 */
export function markdownToReportJson(markdown) {
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

      report.metrics.push({
        label: label.trim(),
        value: value.trim(),
        trend
      });
    }

    // 4. Extract Charts - ROBUST JSON PARSING
    const jsonBlockRegex = /```(?:json)?\s*({[\s\S]*?})\s*```/g;
    let jsonMatch;
    
    while ((jsonMatch = jsonBlockRegex.exec(markdown)) !== null) {
      try {
        const jsonStr = jsonMatch[1].replace(/,\s*}/g, '}').replace(/,\s*]/g, ']'); 
        const jsonContent = JSON.parse(jsonStr);
        
        if (jsonContent.type === 'chart' || jsonContent.chartType) {
          report.charts.push({
            title: jsonContent.title || "Chart",
            type: (jsonContent.chartType || jsonContent.type || 'bar').toLowerCase(),
            data: jsonContent.data || [],
            dataKeys: jsonContent.dataKeys || jsonContent.series || []
          });
        }
      } catch (e) {
        console.warn("Failed to parse JSON block:", e);
      }
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
        if (lowerLine.includes('critical') || lowerLine.includes('urgent') || lowerLine.includes('risk') || lowerLine.includes('drop')) {
          severity = 'critical';
        } else if (lowerLine.includes('warning') || lowerLine.includes('attention') || lowerLine.includes('monitor')) {
          severity = 'warning';
        } else if (lowerLine.includes('success') || lowerLine.includes('growth') || lowerLine.includes('opportunity') || lowerLine.includes('record')) {
          severity = 'success';
        }

        report.insights.push({ title, content, severity });
      });
    }

  } catch (error) {
    console.error("Critical error parsing markdown report:", error);
  }

  return report;
}