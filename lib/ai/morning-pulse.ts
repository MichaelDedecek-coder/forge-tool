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

  // Prepare context for Claude
  const today = new Date().toISOString().split('T')[0];

  // Group emails by account for better organization (show up to 20 per account)
  const emailsByAccount = gmailResults.map(result => ({
    account: result.account,
    emailCount: result.recentEmails.length,
    recentEmails: result.recentEmails.slice(0, 20).map(e => ({
      from: e.from,
      subject: e.subject,
      snippet: e.snippet,
      date: e.date,
      isUnread: e.isUnread,
    })),
  }));

  const context = {
    date: today,
    calendar: {
      count: calendarEvents.length,
      events: calendarEvents.map(e => ({
        summary: e.summary,
        start: e.start.dateTime || e.start.date,
        end: e.end.dateTime || e.end.date,
        location: e.location,
        attendees: e.attendees?.map((a: any) => a.email) || [],
      })),
    },
    email: {
      accounts: emailsByAccount,
      totalNewEmails: combinedRecentEmails.length,
    },
    tasks: {
      totalLists: taskSummary.totalLists,
      totalTasks: taskSummary.totalTasks,
      incompleteCount: taskSummary.incompleteTasks,
      incompleteTasks: incompleteTasks.slice(0, 15).map(t => ({
        title: t.title,
        due: t.due,
        notes: t.notes,
        status: t.status,
        updated: t.updated,
      })),
    },
  };

  // Craft the prompt
  const prompt = `You are an executive assistant creating a Morning Pulse briefing. Analyze the user's data and create a concise, actionable morning briefing.

TODAY'S DATE: ${today}

CALENDAR (next 10 events):
${JSON.stringify(context.calendar, null, 2)}

EMAIL - NEW MESSAGES IN LAST 48 HOURS (from ${allEmailAccounts.length} account${allEmailAccounts.length > 1 ? 's' : ''}):
${emailsByAccount.map(acc => `
  Account: ${acc.account}
  - ${acc.emailCount} new emails in last 48 hours
  - Recent messages (${acc.recentEmails.length} shown):
  ${JSON.stringify(acc.recentEmails, null, 2)}
`).join('\n')}

TASKS (${taskSummary.incompleteTasks} incomplete across ${taskSummary.totalLists} lists):
${JSON.stringify(context.tasks.incompleteTasks, null, 2)}

CRITICAL INSTRUCTIONS:

1. **EMAIL ANALYSIS** - Focus on NEW IMPORTANT emails only:
   - Identify emails requiring urgent response/action today
   - Look for: client requests, urgent inquiries, time-sensitive matters, important updates
   - IGNORE: newsletters, automated notifications, promotional emails, social media alerts
   - Mention specific senders and key action items from important emails
   - If there are multiple Gmail accounts, clearly indicate which account received important emails

2. **TASK DETAILS** - Provide comprehensive task information:
   - List ALL tasks with due dates (especially overdue or due today/tomorrow)
   - Include task notes if they provide context
   - Group by urgency: OVERDUE, DUE TODAY, DUE THIS WEEK, NO DEADLINE
   - Highlight tasks that relate to today's calendar events

3. **CALENDAR CONTEXT** - Connect meetings to emails/tasks when relevant:
   - If an email mentions a meeting attendee, note the connection
   - If a task relates to a calendar event, highlight it

Create a Morning Pulse briefing with these sections:

1. **TOP 3 PRIORITIES** - Most urgent items (specific times/deadlines/people)
2. **IMPORTANT NEW EMAILS** - List 3-5 emails requiring action (sender, subject, what's needed)
3. **TASKS BREAKDOWN** - Organized by urgency with due dates and notes
4. **TODAY'S MEETINGS** - Calendar overview with attendees and prep needed
5. **QUICK WINS** - 2-3 small tasks that can be completed in <10 minutes

Format:
- Use emojis strategically (🔥 urgent, ⚠️ overdue, 📧 email, 📅 calendar, ✅ task)
- Be specific: include times, names, deadlines, and action items
- Prioritize actionability over completeness
- Keep briefing focused and scannable (under 400 words)

REMEMBER: Focus on NEW IMPORTANT emails that need response, not total unread count!`;

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
