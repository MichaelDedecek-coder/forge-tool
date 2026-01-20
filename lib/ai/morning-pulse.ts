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
 * @param email User's email address
 * @returns AI-generated morning briefing
 */
export async function generateMorningPulse(email: string): Promise<string> {
  console.log(`[Morning Pulse] Generating briefing for ${email}`);

  // Fetch all data in parallel
  const [calendarEvents, recentEmails, unreadCount, incompleteTasks, taskSummary] = await Promise.all([
    getUpcomingEvents(email, 10),
    getRecentEmails(email, 10),
    getUnreadCount(email),
    getIncompleteTasks(email),
    getTaskSummary(email),
  ]);

  console.log(`[Morning Pulse] Data fetched: ${calendarEvents.length} events, ${recentEmails.length} emails, ${incompleteTasks.length} tasks`);

  // Prepare context for Claude
  const today = new Date().toISOString().split('T')[0];

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
      unreadCount,
      recentCount: recentEmails.length,
      recent: recentEmails.slice(0, 5).map(e => ({
        from: e.from,
        subject: e.subject,
        snippet: e.snippet,
        isUnread: e.isUnread,
      })),
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

EMAIL:
- ${unreadCount} unread emails
- Recent emails:
${JSON.stringify(context.email.recent, null, 2)}

TASKS:
- ${taskSummary.incompleteTasks} incomplete tasks across ${taskSummary.totalLists} lists
- High-priority incomplete tasks:
${JSON.stringify(context.tasks.incompleteTasks, null, 2)}

Create a Morning Pulse briefing with these sections:

1. **GREETING** - Warm, personal greeting
2. **TOP 3 PRIORITIES** - Most urgent items from calendar/tasks/email (with specific times/deadlines)
3. **QUICK WINS** - 3-5 small, easy tasks that can be completed quickly
4. **DAY OVERVIEW** - Summary of meetings, emails, and tasks
5. **IMPORTANT NOTES** - Any deadlines, overdue items, or critical meetings

Format:
- Use emojis strategically for visual scanning
- Be concise but specific
- Include actionable details (times, names, deadlines)
- Prioritize by urgency and importance
- Highlight overdue or time-sensitive items

Keep the briefing under 300 words. Be direct and actionable.`;

  // Call Claude Haiku 4.5
  console.log('[Morning Pulse] Calling Claude Haiku 4.5...');

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-20250514',
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
 * @param email User's email address
 * @returns Structured briefing object
 */
export async function generateStructuredPulse(email: string): Promise<{
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
  const briefing = await generateMorningPulse(email);

  // Fetch summary data
  const [events, unreadCount, taskSummary] = await Promise.all([
    getUpcomingEvents(email, 10),
    getUnreadCount(email),
    getTaskSummary(email),
  ]);

  return {
    greeting: `Good morning! Here's your Morning Pulse for ${new Date().toLocaleDateString()}`,
    topPriorities: [], // Extracted by Claude in briefing
    quickWins: [], // Extracted by Claude in briefing
    overview: {
      meetings: events.length,
      unreadEmails: unreadCount,
      incompleteTasks: taskSummary.incompleteTasks,
    },
    briefing,
  };
}
