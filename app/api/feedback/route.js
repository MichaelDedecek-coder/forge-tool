import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

    // Save to Supabase
    const { data, error } = await supabase
      .from('feedback')
      .insert([
        {
          feedback_type: feedback_type || 'general',
          message,
          email: email || null,
          page_url: page_url || null,
          user_agent: user_agent || null,
        }
      ])
      .select();

    if (error) {
      console.error('Supabase error:', error);
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
