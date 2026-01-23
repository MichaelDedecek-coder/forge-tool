/**
 * Morning Pulse: AI-Powered Daily Briefing
 *
 * Synthesizes Calendar, Gmail, and Tasks data into actionable insights
 * using Claude Haiku 4.5 for fast, intelligent analysis
 */

import Anthropic from '@anthropic-ai/sdk';
import { getUpcomingEvents } from '@/lib/google/calendar';
import { getRecentEmails, getUnreadCount } from '@/lib/google/gmail';
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

  // Fetch Calendar and Tasks from primary account only
  // Fetch Gmail from all accounts
  const [calendarEvents, incompleteTasks, taskSummary, ...gmailResults] = await Promise.all([
    getUpcomingEvents(email, 10),
    getIncompleteTasks(email),
    getTaskSummary(email),
    // Fetch Gmail data for each account
    ...allEmailAccounts.map(async (gmailAccount) => ({
      account: gmailAccount,
      recentEmails: await getRecentEmails(gmailAccount, 10),
      unreadCount: await getUnreadCount(gmailAccount),
    })),
  ]);

  // Combine Gmail data from all accounts
  const combinedRecentEmails = gmailResults.flatMap(result =>
    result.recentEmails.map(email => ({
      ...email,
      account: result.account, // Tag which account this email is from
    }))
  );

  const totalUnreadCount = gmailResults.reduce((sum, result) => sum + result.unreadCount, 0);

  console.log(`[Morning Pulse] Data fetched: ${calendarEvents.length} events, ${combinedRecentEmails.length} emails from ${allEmailAccounts.length} accounts, ${incompleteTasks.length} tasks`);

  // Prepare context for Claude
  const today = new Date().toISOString().split('T')[0];

  // Group emails by account for better organization
  const emailsByAccount = gmailResults.map(result => ({
    account: result.account,
    unreadCount: result.unreadCount,
    recentEmails: result.recentEmails.slice(0, 5).map(e => ({
      from: e.from,
      subject: e.subject,
      snippet: e.snippet,
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
      })),
    },
    email: {
      totalUnreadCount,
      accounts: emailsByAccount,
    },
    tasks: {
      totalLists: taskSummary.totalLists,
      totalTasks: taskSummary.totalTasks,
      incompleteCount: taskSummary.incompleteTasks,
      incompleteTasks: incompleteTasks.slice(0, 10).map(t => ({
        title: t.title,
        due: t.due,
        notes: t.notes,
      })),
    },
  };

  // Craft the prompt
  const prompt = `You are an executive assistant creating a Morning Pulse briefing. Analyze the user's data and create a concise, actionable morning briefing.

TODAY'S DATE: ${today}

CALENDAR (next 10 events):
${JSON.stringify(context.calendar, null, 2)}

EMAIL (from ${allEmailAccounts.length} account${allEmailAccounts.length > 1 ? 's' : ''}):
- Total unread: ${totalUnreadCount} emails
${emailsByAccount.map(acc => `
  Account: ${acc.account}
  - ${acc.unreadCount} unread
  - Recent emails:
  ${JSON.stringify(acc.recentEmails, null, 2)}
`).join('\n')}

TASKS:
- ${taskSummary.incompleteTasks} incomplete tasks across ${taskSummary.totalLists} lists
- High-priority incomplete tasks:
${JSON.stringify(context.tasks.incompleteTasks, null, 2)}

Create a Morning Pulse briefing with these sections:

1. **GREETING** - Warm, personal greeting
2. **TOP 3 PRIORITIES** - Most urgent items from calendar/tasks/email (with specific times/deadlines)
3. **QUICK WINS** - 3-5 small, easy tasks that can be completed quickly
4. **DAY OVERVIEW** - Summary of meetings, emails, and tasks (show breakdown by email account if multiple)
5. **IMPORTANT NOTES** - Any deadlines, overdue items, or critical meetings

Format:
- Use emojis strategically for visual scanning
- Be concise but specific
- Include actionable details (times, names, deadlines)
- Prioritize by urgency and importance
- Highlight overdue or time-sensitive items
- When showing email stats with multiple accounts, show the breakdown clearly

Keep the briefing under 300 words. Be direct and actionable.`;

  // Call Claude 3.5 Haiku
  console.log('[Morning Pulse] Calling Claude 3.5 Haiku...');

  const message = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 1024,
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

  // Fetch summary data
  const [events, taskSummary, ...unreadCounts] = await Promise.all([
    getUpcomingEvents(email, 10),
    getTaskSummary(email),
    // Get unread count from all email accounts
    ...allEmailAccounts.map(gmailAccount => getUnreadCount(gmailAccount)),
  ]);

  const totalUnreadCount = unreadCounts.reduce((sum, count) => sum + count, 0);

  return {
    greeting: `Good morning! Here's your Morning Pulse for ${new Date().toLocaleDateString()}`,
    topPriorities: [], // Extracted by Claude in briefing
    quickWins: [], // Extracted by Claude in briefing
    overview: {
      meetings: events.length,
      unreadEmails: totalUnreadCount,
      incompleteTasks: taskSummary.incompleteTasks,
    },
    briefing,
  };
}
