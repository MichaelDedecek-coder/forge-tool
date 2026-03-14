import { NextResponse } from 'next/server';

/**
 * POST /api/newsletter
 * Subscribe an email to Mailchimp audience list.
 *
 * Requires env vars:
 *   MAILCHIMP_API_KEY     — your Mailchimp API key (ends with -usX)
 *   MAILCHIMP_AUDIENCE_ID — the audience/list ID to subscribe to
 *
 * The API key suffix (e.g. "us21") determines the data center.
 */
export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.MAILCHIMP_API_KEY;
    const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;

    if (!apiKey || !audienceId) {
      console.error('[Newsletter] Missing MAILCHIMP_API_KEY or MAILCHIMP_AUDIENCE_ID');
      return NextResponse.json(
        { error: 'Newsletter service not configured' },
        { status: 500 }
      );
    }

    // Extract data center from API key (e.g., "abc123-us21" → "us21")
    const dataCenter = apiKey.split('-').pop();

    const response = await fetch(
      `https://${dataCenter}.api.mailchimp.com/3.0/lists/${audienceId}/members`,
      {
        method: 'POST',
        headers: {
          Authorization: `apikey ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_address: email,
          status: 'subscribed',
          tags: ['DataPalo Newsletter', 'Exit Popup'],
        }),
      }
    );

    const data = await response.json();

    // "Member Exists" is not an error — they're already subscribed
    if (!response.ok && data.title !== 'Member Exists') {
      console.error('[Newsletter] Mailchimp error:', data.title, data.detail);
      return NextResponse.json(
        { error: 'Subscription failed. Please try again.' },
        { status: 400 }
      );
    }

    console.log(`[Newsletter] Subscribed: ${email}`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Newsletter] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
