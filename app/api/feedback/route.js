import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.message || !body.message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Extract feedback data
    const feedback = {
      message: body.message,
      email: body.email || "anonymous",
      feedback_type: body.feedback_type || "general",
      page_url: body.page_url || "unknown",
      user_agent: body.user_agent || "unknown",
      timestamp: body.timestamp || new Date().toISOString()
    };

    // Log to console for now (you can replace this with database storage later)
    console.log("📬 NEW FEEDBACK RECEIVED:");
    console.log(JSON.stringify(feedback, null, 2));

    // TODO: In production, you might want to:
    // 1. Store in a database (Supabase, MongoDB, etc.)
    // 2. Send an email notification to michael@forgecreative.cz
    // 3. Send to a Slack channel
    // 4. Store in Google Sheets via API

    // For now, we'll just log it and return success
    // You can check Vercel logs to see the feedback

    return NextResponse.json(
      {
        success: true,
        message: "Feedback received successfully"
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("❌ Feedback API Error:", error);
    return NextResponse.json(
      { error: "Failed to process feedback" },
      { status: 500 }
    );
  }
}
