import { NextResponse } from 'next/server';

/**
 * POST /api/auth/welcome
 * Add a new signup to the Mailchimp audience so they receive the welcome email automation.
 * Called from auth-context.js on SIGNED_UP event.
 */
export async function POST(request) {
  try {
    const { email, name } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const apiKey = process.env.MAILCHIMP_API_KEY;
    const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;

    if (!apiKey || !audienceId) {
      console.error('[Welcome] Missing MAILCHIMP_API_KEY or MAILCHIMP_AUDIENCE_ID');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const dataCenter = apiKey.split('-').pop();

    // Split name into first/last if provided
    const nameParts = (name || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

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
          merge_fields: {
            FNAME: firstName,
            LNAME: lastName,
          },
          tags: ['DataPalo User', 'Free Signup'],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok && data.title !== 'Member Exists') {
      console.error('[Welcome] Mailchimp error:', data.title, data.detail);
      return NextResponse.json({ error: 'Subscription failed' }, { status: 400 });
    }

    console.log(`[Welcome] Added to Mailchimp: ${email}`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Welcome] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
