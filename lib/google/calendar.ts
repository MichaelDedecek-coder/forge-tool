/**
 * Google Calendar API Integration
 *
 * Provides functions to interact with Google Calendar API
 * Automatically handles authentication and token refresh
 */

import { google } from 'googleapis';
import { getGoogleAccessToken } from './client';

/**
 * Calendar event interface
 */
export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  status: string;
  htmlLink: string;
  location?: string;
  attendees?: Array<{
    email: string;
    responseStatus: string;
  }>;
}

/**
 * Get upcoming calendar events for a user
 * @param email User's email address
 * @param maxResults Maximum number of events to return (default: 10)
 * @param timeMin Start time (ISO string, default: now)
 * @returns Array of calendar events
 */
export async function getUpcomingEvents(
  email: string,
  maxResults: number = 10,
  timeMin?: string
): Promise<CalendarEvent[]> {
  console.log(`[Calendar API] Fetching upcoming events for ${email}`);

  // Get valid access token (auto-refreshes if needed)
  const accessToken = await getGoogleAccessToken(email);

  // Initialize OAuth2 client
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  // Initialize Calendar API
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    // Fetch events
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin || new Date().toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];

    console.log(`[Calendar API] ✅ Found ${events.length} events`);

    return events.map(event => ({
      id: event.id || '',
      summary: event.summary || 'No title',
      description: event.description,
      start: {
        dateTime: event.start?.dateTime,
        date: event.start?.date,
        timeZone: event.start?.timeZone,
      },
      end: {
        dateTime: event.end?.dateTime,
        date: event.end?.date,
        timeZone: event.end?.timeZone,
      },
      status: event.status || 'unknown',
      htmlLink: event.htmlLink || '',
      location: event.location,
      attendees: event.attendees?.map(a => ({
        email: a.email || '',
        responseStatus: a.responseStatus || 'needsAction',
      })),
    }));

  } catch (error) {
    console.error('[Calendar API] ❌ Failed to fetch events:', error);
    if (error instanceof Error) {
      throw new Error(`Calendar API error: ${error.message}`);
    }
    throw new Error('Calendar API error: Unknown error');
  }
}

/**
 * Get calendar events for a specific date range
 * @param email User's email address
 * @param timeMin Start time (ISO string)
 * @param timeMax End time (ISO string)
 * @returns Array of calendar events
 */
export async function getEventsInRange(
  email: string,
  timeMin: string,
  timeMax: string
): Promise<CalendarEvent[]> {
  console.log(`[Calendar API] Fetching events for ${email} from ${timeMin} to ${timeMax}`);

  const accessToken = await getGoogleAccessToken(email);

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];

    console.log(`[Calendar API] ✅ Found ${events.length} events in range`);

    return events.map(event => ({
      id: event.id || '',
      summary: event.summary || 'No title',
      description: event.description,
      start: {
        dateTime: event.start?.dateTime,
        date: event.start?.date,
        timeZone: event.start?.timeZone,
      },
      end: {
        dateTime: event.end?.dateTime,
        date: event.end?.date,
        timeZone: event.end?.timeZone,
      },
      status: event.status || 'unknown',
      htmlLink: event.htmlLink || '',
      location: event.location,
      attendees: event.attendees?.map(a => ({
        email: a.email || '',
        responseStatus: a.responseStatus || 'needsAction',
      })),
    }));

  } catch (error) {
    console.error('[Calendar API] ❌ Failed to fetch events:', error);
    if (error instanceof Error) {
      throw new Error(`Calendar API error: ${error.message}`);
    }
    throw new Error('Calendar API error: Unknown error');
  }
}

/**
 * Get today's calendar events
 * @param email User's email address
 * @returns Array of today's calendar events
 */
export async function getTodaysEvents(email: string): Promise<CalendarEvent[]> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  return getEventsInRange(
    email,
    startOfDay.toISOString(),
    endOfDay.toISOString()
  );
}
