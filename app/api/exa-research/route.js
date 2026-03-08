import Exa from "exa-js";
import { NextResponse } from "next/server";

export const maxDuration = 30;

export async function POST(req) {
  try {
    const body = await req.json();
    const { statisticalSummary, userQuestion, language } = body;

    if (!statisticalSummary || !userQuestion) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Initialize Exa client
    const exa = new Exa(process.env.EXA_API_KEY);

    // Extract key topics from the dataset for research
    const columns = Object.keys(statisticalSummary.columns || {});
    const columnDescriptions = columns.slice(0, 5).join(", ");

    // Build intelligent search query based on user question and data
    const searchQuery = buildResearchQuery(
      userQuestion,
      statisticalSummary,
      language
    );

    console.log(`🔍 Exa Research Query: "${searchQuery}"`);

    // Perform Exa search with semantic search
    const searchResults = await exa.searchAndContents(searchQuery, {
      type: "neural", // Use semantic search
      numResults: 5,
      text: { maxCharacters: 500 }, // Get text content
      category: "research paper",
    });

    console.log(`✅ Found ${searchResults.results.length} research insights`);

    // Process and structure the results
    const insights = searchResults.results.map((result) => ({
      title: result.title,
      url: result.url,
      summary: result.text || result.snippet || "",
      publishedDate: result.publishedDate,
      score: result.score,
    }));

    return NextResponse.json({
      query: searchQuery,
      insights: insights,
      total: insights.length,
    });
  } catch (error) {
    console.error("Exa Research Error:", error);
    return NextResponse.json(
      {
        error: error.message,
        insights: [], // Return empty array on error so analysis can continue
      },
      { status: 200 } // Still return 200 so it doesn't break the main flow
    );
  }
}

/**
 * Build an intelligent research query based on user question and data
 */
function buildResearchQuery(userQuestion, statisticalSummary, language) {
  // Extract meaningful context from the data
  const columns = Object.keys(statisticalSummary.columns || {});
  const totalRows = statisticalSummary.total_rows;

  // Identify potential business context from column names
  const businessContext = inferBusinessContext(columns);

  // Build query in English (Exa works best with English queries)
  let query = "";

  // If user question contains specific domain terms, use them
  const questionKeywords = extractKeywords(userQuestion);

  if (questionKeywords.length > 0) {
    query = `${businessContext} trends analysis benchmark statistics ${questionKeywords.join(
      " "
    )}`;
  } else {
    query = `${businessContext} industry trends market analysis statistics benchmarks`;
  }

  return query.trim();
}

/**
 * Infer business context from column names
 */
function inferBusinessContext(columns) {
  const columnString = columns.join(" ").toLowerCase();

  // Sales/Revenue context
  if (
    columnString.includes("sales") ||
    columnString.includes("revenue") ||
    columnString.includes("price")
  ) {
    return "sales revenue";
  }

  // Marketing context
  if (
    columnString.includes("customer") ||
    columnString.includes("user") ||
    columnString.includes("marketing")
  ) {
    return "customer marketing";
  }

  // Finance context
  if (
    columnString.includes("cost") ||
    columnString.includes("expense") ||
    columnString.includes("profit")
  ) {
    return "financial business";
  }

  // Product context
  if (
    columnString.includes("product") ||
    columnString.includes("item") ||
    columnString.includes("category")
  ) {
    return "product business";
  }

  // HR context
  if (
    columnString.includes("employee") ||
    columnString.includes("salary") ||
    columnString.includes("department")
  ) {
    return "human resources workforce";
  }

  // Default: general business
  return "business data";
}

/**
 * Extract meaningful keywords from user question
 */
function extractKeywords(question) {
  // Remove common stop words
  const stopWords = [
    "the",
    "is",
    "at",
    "which",
    "on",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "with",
    "to",
    "for",
    "of",
    "as",
    "by",
    "this",
    "that",
    "these",
    "those",
    "what",
    "why",
    "how",
    "when",
    "where",
    "who",
    // Czech stop words
    "je",
    "a",
    "v",
    "na",
    "s",
    "o",
    "z",
    "k",
    "pro",
    "co",
    "jak",
    "proč",
    "kdy",
    "kde",
  ];

  const words = question
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.includes(word));

  return [...new Set(words)].slice(0, 5); // Return unique keywords, max 5
}
