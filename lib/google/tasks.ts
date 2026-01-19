/**
 * Google Tasks API Integration
 *
 * Provides functions to interact with Google Tasks API
 * Automatically handles authentication and token refresh
 */

import { google } from 'googleapis';
import { getGoogleAccessToken } from './client';

/**
 * Task list interface
 */
export interface TaskList {
  id: string;
  title: string;
  updated: string;
}

/**
 * Task interface
 */
export interface Task {
  id: string;
  title: string;
  status: 'needsAction' | 'completed';
  notes?: string;
  due?: string;
  completed?: string;
  updated: string;
  position: string;
}

/**
 * Get all task lists
 * @param email User's email address
 * @returns Array of task lists
 */
export async function getTaskLists(email: string): Promise<TaskList[]> {
  console.log(`[Tasks API] Fetching task lists for ${email}`);

  // Get valid access token (auto-refreshes if needed)
  const accessToken = await getGoogleAccessToken(email);

  // Initialize OAuth2 client
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  // Initialize Tasks API
  const tasks = google.tasks({ version: 'v1', auth: oauth2Client });

  try {
    const response = await tasks.tasklists.list();

    const taskLists = (response.data.items || []).map(list => ({
      id: list.id || '',
      title: list.title || 'Untitled',
      updated: list.updated || '',
    }));

    console.log(`[Tasks API] ✅ Found ${taskLists.length} task lists`);
    return taskLists;

  } catch (error) {
    console.error('[Tasks API] ❌ Failed to fetch task lists:', error);
    if (error instanceof Error) {
      throw new Error(`Tasks API error: ${error.message}`);
    }
    throw new Error('Tasks API error: Unknown error');
  }
}

/**
 * Get tasks from a specific task list
 * @param email User's email address
 * @param taskListId Task list ID (use '@default' for default list)
 * @param showCompleted Include completed tasks (default: false)
 * @returns Array of tasks
 */
export async function getTasks(
  email: string,
  taskListId: string = '@default',
  showCompleted: boolean = false
): Promise<Task[]> {
  console.log(`[Tasks API] Fetching tasks from list ${taskListId} for ${email}`);

  const accessToken = await getGoogleAccessToken(email);

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  const tasks = google.tasks({ version: 'v1', auth: oauth2Client });

  try {
    const response = await tasks.tasks.list({
      tasklist: taskListId,
      showCompleted,
      showHidden: false,
    });

    const taskItems = (response.data.items || []).map(task => ({
      id: task.id || '',
      title: task.title || 'Untitled',
      status: (task.status as 'needsAction' | 'completed') || 'needsAction',
      notes: task.notes,
      due: task.due,
      completed: task.completed,
      updated: task.updated || '',
      position: task.position || '',
    }));

    console.log(`[Tasks API] ✅ Found ${taskItems.length} tasks`);
    return taskItems;

  } catch (error) {
    console.error('[Tasks API] ❌ Failed to fetch tasks:', error);
    if (error instanceof Error) {
      throw new Error(`Tasks API error: ${error.message}`);
    }
    throw new Error('Tasks API error: Unknown error');
  }
}

/**
 * Get all tasks from all task lists
 * @param email User's email address
 * @param showCompleted Include completed tasks (default: false)
 * @returns Object mapping task list titles to their tasks
 */
export async function getAllTasks(
  email: string,
  showCompleted: boolean = false
): Promise<{ [listTitle: string]: Task[] }> {
  console.log(`[Tasks API] Fetching all tasks for ${email}`);

  const taskLists = await getTaskLists(email);

  const allTasks: { [listTitle: string]: Task[] } = {};

  for (const list of taskLists) {
    const tasks = await getTasks(email, list.id, showCompleted);
    allTasks[list.title] = tasks;
  }

  const totalTasks = Object.values(allTasks).reduce((sum, tasks) => sum + tasks.length, 0);
  console.log(`[Tasks API] ✅ Found ${totalTasks} total tasks across ${taskLists.length} lists`);

  return allTasks;
}

/**
 * Get incomplete tasks from default task list
 * @param email User's email address
 * @returns Array of incomplete tasks
 */
export async function getIncompleteTasks(email: string): Promise<Task[]> {
  console.log(`[Tasks API] Fetching incomplete tasks for ${email}`);

  const tasks = await getTasks(email, '@default', false);
  const incompleteTasks = tasks.filter(task => task.status === 'needsAction');

  console.log(`[Tasks API] ✅ Found ${incompleteTasks.length} incomplete tasks`);
  return incompleteTasks;
}

/**
 * Get task count summary
 * @param email User's email address
 * @returns Summary of task counts by list
 */
export async function getTaskSummary(email: string): Promise<{
  totalLists: number;
  totalTasks: number;
  incompleteTasks: number;
  completedTasks: number;
  listSummaries: Array<{
    title: string;
    id: string;
    taskCount: number;
    incompleteCount: number;
  }>;
}> {
  console.log(`[Tasks API] Fetching task summary for ${email}`);

  const taskLists = await getTaskLists(email);

  const listSummaries = [];
  let totalTasks = 0;
  let incompleteTasks = 0;
  let completedTasks = 0;

  for (const list of taskLists) {
    const tasks = await getTasks(email, list.id, true);
    const incomplete = tasks.filter(t => t.status === 'needsAction').length;
    const completed = tasks.filter(t => t.status === 'completed').length;

    listSummaries.push({
      title: list.title,
      id: list.id,
      taskCount: tasks.length,
      incompleteCount: incomplete,
    });

    totalTasks += tasks.length;
    incompleteTasks += incomplete;
    completedTasks += completed;
  }

  console.log(`[Tasks API] ✅ Summary: ${totalTasks} total tasks, ${incompleteTasks} incomplete`);

  return {
    totalLists: taskLists.length,
    totalTasks,
    incompleteTasks,
    completedTasks,
    listSummaries,
  };
}
