/**
 * Transforms Gemini's structured Markdown output into JSON for the ReportInterface
 */
export function markdownToReportJson(markdown) {
  if (!markdown || typeof markdown !== "string") {
    return null;
  }

  const result = {
    title: null,
    summary: null,
    metrics: [],
    charts: [],
    insights: [],
  };

  try {
    const lines = markdown.split("\n");

    // Extract title (first H1)
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      result.title = titleMatch[1].trim();
    }

    // Extract summary (first paragraph after title)
    const titleIndex = lines.findIndex((l) => l.startsWith("# "));
    if (titleIndex !== -1) {
      for (let i = titleIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line && !line.startsWith("#") && !line.startsWith("-") && !line.startsWith("```")) {
          result.summary = line;
          break;
        }
      }
    }

    // Extract metrics (bold key-value pairs in bullet points)
    const metricRegex = /^-\s+\*\*(.+?)\*\*:\s*(.+)$/gm;
    let metricMatch;
    while ((metricMatch = metricRegex.exec(markdown)) !== null) {
      const label = metricMatch[1].trim();
      const fullValue = metricMatch[2].trim();

      // Try to extract trend from parentheses
      const trendMatch = fullValue.match(/\(([^)]+)\)/);
      const trend = trendMatch ? trendMatch[1] : null;
      const value = trend ? fullValue.replace(`(${trend})`, "").trim() : fullValue;

      result.metrics.push({ label, value, trend });
    }

    // Extract JSON chart blocks
    const jsonBlockRegex = /```json\s*([\s\S]*?)```/g;
    let jsonMatch;
    while ((jsonMatch = jsonBlockRegex.exec(markdown)) !== null) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.type === "chart" && parsed.chartType && parsed.data) {
          result.charts.push(parsed);
        }
      } catch (e) {
        // Skip invalid JSON
        console.warn("Failed to parse chart JSON:", e);
      }
    }

    // Extract insights (from ## Insights or ## Poznatky section)
    const insightSectionRegex = /##\s+(Insights|Poznatky)\s*\n([\s\S]*?)(?=\n##|$)/i;
    const insightSection = markdown.match(insightSectionRegex);
    if (insightSection) {
      const insightLines = insightSection[2].split("\n");
      for (const line of insightLines) {
        const insightMatch = line.match(/^-\s+\*\*(.+?)\*\*:\s*(.+)$/);
        if (insightMatch) {
          result.insights.push({
            title: insightMatch[1].trim(),
            description: insightMatch[2].trim(),
          });
        }
      }
    }

    return result;
  } catch (error) {
    console.error("Error parsing markdown:", error);
    return null;
  }
}