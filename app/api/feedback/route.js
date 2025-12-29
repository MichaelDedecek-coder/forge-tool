/**
 * Feedback API Endpoint
 * Handles user feedback submissions
 * Sends email notification to Michael
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '../../lib/supabase-server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { feedback_type, message, email, page_url, user_agent } = body;

    // Validation
    if (!feedback_type || !message) {
      return NextResponse.json(
        { error: 'Feedback type and message are required' },
        { status: 400 }
      );
    }

    if (!['bug', 'feature', 'general', 'question'].includes(feedback_type)) {
      return NextResponse.json(
        { error: 'Invalid feedback type' },
        { status: 400 }
      );
    }

    // Get user ID if authenticated
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    const user_id = session?.user?.id || null;

    // Save to database
    const { data: feedback, error: dbError } = await supabase
      .from('feedback')
      .insert({
        user_id,
        feedback_type,
        message: message.trim(),
        email: email?.trim() || null,
        page_url,
        user_agent
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save feedback' },
        { status: 500 }
      );
    }

    // Send email notification to Michael
    try {
      await sendEmailNotification({
        feedback_type,
        message,
        email,
        page_url,
        user_id,
        feedback_id: feedback.id
      });
    } catch (emailError) {
      // Don't fail the request if email fails
      console.error('Email notification error:', emailError);
    }

    return NextResponse.json({
      success: true,
      feedback_id: feedback.id
    });

  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Send email notification to Michael
 * Using a simple approach - can be upgraded to SendGrid/Resend later
 */
async function sendEmailNotification({ feedback_type, message, email, page_url, user_id, feedback_id }) {
  // For now, we'll use a simple webhook or console log
  // Michael can set up email forwarding from Supabase or use a webhook

  const emailContent = {
    to: 'michael@forgecreative.cz',
    subject: `[DataWizard Feedback] ${getTypeLabel(feedback_type)}`,
    body: `
New feedback received on DataWizard:

TYPE: ${getTypeLabel(feedback_type)}
MESSAGE: ${message}

${email ? `CONTACT EMAIL: ${email}` : 'No contact email provided'}
${user_id ? `USER ID: ${user_id}` : 'Anonymous user'}

PAGE: ${page_url}
FEEDBACK ID: ${feedback_id}
TIME: ${new Date().toISOString()}

---
Reply to this email to respond to the user (if email provided).
View all feedback: https://supabase.com (check feedback table)
    `.trim()
  };

  console.log('📧 EMAIL NOTIFICATION:');
  console.log('='.repeat(60));
  console.log(`To: ${emailContent.to}`);
  console.log(`Subject: ${emailContent.subject}`);
  console.log('');
  console.log(emailContent.body);
  console.log('='.repeat(60));

  // TODO: Integrate with actual email service (SendGrid/Resend/Postmark)
  // For now, Michael can monitor via Supabase dashboard + console logs
  // Or set up Supabase webhook to forward to email

  return emailContent;
}

function getTypeLabel(type) {
  const labels = {
    bug: 'Bug Report 🐛',
    feature: 'Feature Request ✨',
    general: 'General Feedback 💬',
    question: 'Question ❓'
  };
  return labels[type] || type;
}
