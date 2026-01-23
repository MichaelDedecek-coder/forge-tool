import { NextResponse } from 'next/server';
import {
  getTaskLists,
  getTasks,
  getAllTasks,
  getIncompleteTasks,
  getTaskSummary,
} from '@/lib/google/tasks';

/**
 * Google Tasks API Endpoint
 *
 * Fetches Google Tasks data for a user
 *
 * Query Parameters:
 * - email: User's email (required)
 * - view: 'lists' | 'tasks' | 'all' | 'incomplete' | 'summary' (default: 'incomplete')
 * - listId: Task list ID for 'tasks' view (default: '@default')
 * - showCompleted: Include completed tasks (default: 'false')
 *
 * Examples:
 * - /api/google/tasks?email=user@example.com
 * - /api/google/tasks?email=user@example.com&view=lists
 * - /api/google/tasks?email=user@example.com&view=tasks&listId=MTIzNDU2Nzg
 * - /api/google/tasks?email=user@example.com&view=all&showCompleted=true
 * - /api/google/tasks?email=user@example.com&view=summary
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const view = searchParams.get('view') || 'incomplete';
    const listId = searchParams.get('listId') || '@default';
    const showCompleted = searchParams.get('showCompleted') === 'true';

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter required' },
        { status: 400 }
      );
    }

    console.log(`[Tasks Endpoint] Request from ${email}, view: ${view}`);

    // Handle different views
    switch (view) {
      case 'lists': {
        const taskLists = await getTaskLists(email);

        console.log(`[Tasks Endpoint] ✅ Returning ${taskLists.length} task lists`);

        return NextResponse.json({
          success: true,
          email,
          view,
          count: taskLists.length,
          taskLists,
        });
      }

      case 'tasks': {
        const tasks = await getTasks(email, listId, showCompleted);

        console.log(`[Tasks Endpoint] ✅ Returning ${tasks.length} tasks from list ${listId}`);

        return NextResponse.json({
          success: true,
          email,
          view,
          listId,
          showCompleted,
          count: tasks.length,
          tasks,
        });
      }

      case 'all': {
        const allTasks = await getAllTasks(email, showCompleted);
        const totalCount = Object.values(allTasks).reduce((sum, tasks) => sum + tasks.length, 0);

        console.log(`[Tasks Endpoint] ✅ Returning ${totalCount} total tasks across all lists`);

        return NextResponse.json({
          success: true,
          email,
          view,
          showCompleted,
          totalCount,
          tasksByList: allTasks,
        });
      }

      case 'summary': {
        const summary = await getTaskSummary(email);

        console.log(`[Tasks Endpoint] ✅ Returning task summary`);

        return NextResponse.json({
          success: true,
          email,
          view,
          summary,
        });
      }

      case 'incomplete':
      default: {
        const incompleteTasks = await getIncompleteTasks(email);

        console.log(`[Tasks Endpoint] ✅ Returning ${incompleteTasks.length} incomplete tasks`);

        return NextResponse.json({
          success: true,
          email,
          view,
          count: incompleteTasks.length,
          tasks: incompleteTasks,
        });
      }
    }

  } catch (error) {
    console.error('[Tasks Endpoint] ❌ Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Failed to fetch Tasks data',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
