/**
 * Morning Pulse: AI-Powered Daily Briefing
 *
 * Synthesizes Calendar, Gmail, and Tasks data into actionable insights
 * using Claude Haiku 4.5 for fast, intelligent analysis
 */

import Anthropic from '@anthropic-ai/sdk';
import { getUpcomingEvents } from '@/lib/google/calendar';
import { getRecentEmails } from '@/lib/google/gmail';
import { getIncompleteTasks, getTaskSummary } from '@/lib/google/tasks';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Generate Morning Pulse briefing for a user
 * @param email User's primary email address (for Calendar and Tasks)
 * @param additionalEmailAccounts Optional array of additional Gmail accounts to include
 * @returns AI-generated morning briefing
 */
export async function generateMorningPulse(
  email: string,
  additionalEmailAccounts?: string[]
): Promise<string> {
  console.log(`[Morning Pulse] Generating briefing for ${email}`);

  // Determine all email accounts to fetch Gmail data from
  const allEmailAccounts = [email, ...(additionalEmailAccounts || [])];
  console.log(`[Morning Pulse] Fetching Gmail from: ${allEmailAccounts.join(', ')}`);

  // Calculate date for "last 48 hours" Gmail query
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const dateFilter = twoDaysAgo.toISOString().split('T')[0].replace(/-/g, '/');

  // Fetch Calendar and Tasks from primary account only
  // Fetch Gmail from all accounts (last 48 hours, up to 50 emails per account)
  const [calendarEvents, incompleteTasks, taskSummary, ...gmailResults] = await Promise.all([
    getUpcomingEvents(email, 10),
    getIncompleteTasks(email),
    getTaskSummary(email),
    // Fetch Gmail data for each account - last 48 hours only
    ...allEmailAccounts.map(async (gmailAccount) => ({
      account: gmailAccount,
      recentEmails: await getRecentEmails(gmailAccount, 50, `after:${dateFilter}`),
    })),
  ]);

  // Combine Gmail data from all accounts
  const combinedRecentEmails = gmailResults.flatMap(result =>
    result.recentEmails.map(email => ({
      ...email,
      account: result.account, // Tag which account this email is from
    }))
  );

  console.log(`[Morning Pulse] Data fetched: ${calendarEvents.length} events, ${combinedRecentEmails.length} emails from ${allEmailAccounts.length} accounts, ${incompleteTasks.length} tasks`);

  // Prepare context for Claude - NO COUNTS, ONLY ACTUAL DATA
  const today = new Date().toISOString().split('T')[0];

  // Prepare email data - ONLY the emails themselves, NO counts
  const allEmailsFlat = gmailResults.flatMap(result =>
    result.recentEmails.slice(0, 20).map(e => ({
      account: result.account,
      from: e.from,
      subject: e.subject,
      snippet: e.snippet,
      date: e.date,
      isUnread: e.isUnread,
    }))
  );

  const context = {
    date: today,
    calendar: calendarEvents.map(e => ({
      summary: e.summary,
      start: e.start.dateTime || e.start.date,
      end: e.end.dateTime || e.end.date,
      location: e.location,
      attendees: e.attendees?.map((a: any) => a.email) || [],
    })),
    emails: allEmailsFlat, // Just the emails, no counts
    tasks: incompleteTasks.map(t => ({ // Just the tasks, no counts
      title: t.title,
      due: t.due,
      notes: t.notes,
      status: t.status,
      updated: t.updated,
    })),
  };

  // Craft the prompt with STRICT format requirements
  const prompt = `You are an executive assistant. Create a Morning Pulse briefing for ${today}.

DATA PROVIDED:

CALENDAR EVENTS:
${JSON.stringify(context.calendar, null, 2)}

EMAILS (last 48 hours from ${allEmailAccounts.join(', ')}):
${JSON.stringify(context.emails, null, 2)}

TASKS:
${JSON.stringify(context.tasks, null, 2)}

═══════════════════════════════════════════════════════════════════
STRICT OUTPUT FORMAT - FOLLOW EXACTLY:
═══════════════════════════════════════════════════════════════════

☀️ MORNING PULSE: ${today}

**TOP 3 PRIORITIES**
1. [Most urgent item with time/deadline/person]
2. [Second most urgent item]
3. [Third most urgent item]

**IMPORTANT NEW EMAILS** 📧
[List 4-6 emails that require response/action. For EACH email, show:]
- **From:** [Sender name/email]
- **Subject:** [Email subject]
- **Action needed:** [What user needs to do]
- **Account:** [Which Gmail account: ${allEmailAccounts.join(' or ')}]

[If there are NO important emails requiring action, write: "✅ No urgent emails requiring action"]

**TASKS BREAKDOWN** ✅

⚠️ **OVERDUE:**
[List each overdue task with: "- [Task title] (due: [date]) - [notes if any]"]
[If none, write: "None"]

🔥 **DUE TODAY:**
[List each task due today with: "- [Task title] - [notes if any]"]
[If none, write: "None"]

📅 **DUE THIS WEEK:**
[List each task due this week with: "- [Task title] (due: [date]) - [notes if any]"]
[If none, write: "None"]

📋 **NO DEADLINE:**
[List important tasks without deadlines: "- [Task title] - [notes if any]"]
[Only show 3-5 most important ones]

**TODAY'S MEETINGS** 📅
[List each meeting with time, attendees, and what to prepare]
[If no meetings, write: "No meetings scheduled"]

**QUICK WINS** ⚡
[List 2-3 tasks that can be done in under 10 minutes]

═══════════════════════════════════════════════════════════════════
CRITICAL RULES:
═══════════════════════════════════════════════════════════════════

1. **NEVER** show email counts like "201 unread" or "402 total unread"
2. **NEVER** show "Email Status:" section
3. **NEVER** write "- michael@agentforge.tech: X unread"
4. **ONLY** list SPECIFIC emails that need response (sender + subject + action)
5. **ALWAYS** list ALL tasks with their due dates
6. **IGNORE** promotional emails, newsletters, automated notifications
7. **FOCUS** on actionable items only

Keep total length under 400 words. Be specific and actionable.`;

  // Call Claude 3.5 Haiku
  console.log('[Morning Pulse] Calling Claude 3.5 Haiku...');

  const message = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 1536,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const briefing = message.content[0].type === 'text' ? message.content[0].text : '';

  console.log(`[Morning Pulse] ✅ Briefing generated (${briefing.length} chars)`);

  return briefing;
}

/**
 * Generate Morning Pulse with structured output
 * @param email User's primary email address
 * @param additionalEmailAccounts Optional array of additional Gmail accounts
 * @returns Structured briefing object
 */
export async function generateStructuredPulse(
  email: string,
  additionalEmailAccounts?: string[]
): Promise<{
  greeting: string;
  topPriorities: string[];
  quickWins: string[];
  overview: {
    meetings: number;
    unreadEmails: number;
    incompleteTasks: number;
  };
  briefing: string;
}> {
  const briefing = await generateMorningPulse(email, additionalEmailAccounts);

  // Determine all email accounts
  const allEmailAccounts = [email, ...(additionalEmailAccounts || [])];

  // Calculate date for "last 48 hours" Gmail query
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const dateFilter = twoDaysAgo.toISOString().split('T')[0].replace(/-/g, '/');

  // Fetch summary data
  const [events, taskSummary, ...gmailResults] = await Promise.all([
    getUpcomingEvents(email, 10),
    getTaskSummary(email),
    // Get recent emails from all accounts
    ...allEmailAccounts.map(async (gmailAccount) =>
      getRecentEmails(gmailAccount, 50, `after:${dateFilter}`)
    ),
  ]);

  const totalNewEmails = gmailResults.reduce((sum, emails) => sum + emails.length, 0);

  return {
    greeting: `Good morning! Here's your Morning Pulse for ${new Date().toLocaleDateString()}`,
    topPriorities: [], // Extracted by Claude in briefing
    quickWins: [], // Extracted by Claude in briefing
    overview: {
      meetings: events.length,
      unreadEmails: totalNewEmails,
      incompleteTasks: taskSummary.incompleteTasks,
    },
    briefing,
  };
}
