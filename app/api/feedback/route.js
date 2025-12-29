export async function POST(request) {
  try {
    const body = await request.json();
    
    const { feedback_type, message, email, page_url, user_agent } = body;

    // Validate required fields
    if (!message) {
      return Response.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Save to Supabase using REST API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/feedback`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          feedback_type: feedback_type || 'general',
          message,
          email: email || null,
          page_url: page_url || null,
          user_agent: user_agent || null,
        })
      }
    );

    if (!response.ok) {
      console.error('Supabase error:', response.status);
      return Response.json(
        { error: 'Failed to save feedback' },
        { status: 500 }
      );
    }

    return Response.json(
      { success: true, message: 'Feedback saved!' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Feedback API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
