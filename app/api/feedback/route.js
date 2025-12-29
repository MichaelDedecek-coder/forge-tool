/**
 * Feedback API Endpoint
 * Handles user feedback submissions
 * Sends email notification to Michael
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '../../lib/supabase-server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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
 * Send email notification to Michael using Resend
 */
async function sendEmailNotification({ feedback_type, message, email, page_url, user_id, feedback_id }) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'DataWizard <onboarding@resend.dev>',
      to: ['michael@forgecreative.cz'],
      subject: `[DataWizard Feedback] ${getTypeLabel(feedback_type)}`,
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
            New DataWizard Feedback
          </h2>

          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Type:</strong> ${getTypeLabel(feedback_type)}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'UTC' })} UTC</p>
          </div>

          <div style="margin: 20px 0;">
            <p style="margin-bottom: 5px;"><strong>Message:</strong></p>
            <div style="background: white; padding: 15px; border-left: 4px solid #10b981; border-radius: 4px;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>

          ${email ? `
            <p style="margin: 10px 0;">
              <strong>Contact Email:</strong>
              <a href="mailto:${email}" style="color: #0ea5e9;">${email}</a>
            </p>
          ` : '<p style="color: #666; margin: 10px 0;"><em>No contact email provided</em></p>'}

          ${user_id ? `
            <p style="margin: 10px 0; color: #666;">
              <strong>User ID:</strong> <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">${user_id}</code>
            </p>
          ` : '<p style="color: #666; margin: 10px 0;"><em>Anonymous user</em></p>'}

          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
            <p style="margin: 5px 0; font-size: 14px; color: #666;">
              <strong>Page:</strong> <a href="${page_url}" style="color: #0ea5e9;">${page_url}</a>
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: #666;">
              <strong>Feedback ID:</strong> ${feedback_id}
            </p>
          </div>

          <div style="margin-top: 30px; padding: 15px; background: #f9fafb; border-radius: 8px; font-size: 13px; color: #666;">
            <p style="margin: 5px 0;">💡 <strong>Tip:</strong> ${email ? 'Reply to this email to respond directly to the user.' : 'User did not provide contact email.'}</p>
            <p style="margin: 5px 0;">📊 View all feedback in your <a href="https://supabase.com/dashboard/project/qtpmqdxdxujszulgyouh/editor" style="color: #0ea5e9;">Supabase Dashboard</a></p>
          </div>
        </div>
      `
    });

    if (error) {
      console.error('❌ Resend error:', error);
      return;
    }

    console.log('✅ Email sent successfully to michael@forgecreative.cz');
    console.log('📧 Email ID:', data.id);
  } catch (error) {
    console.error('❌ Email error:', error);
    throw error;
  }
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
