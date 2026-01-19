/**
 * Gmail API Integration
 *
 * Provides functions to interact with Gmail API
 * Automatically handles authentication and token refresh
 */

import { google } from 'googleapis';
import { getGoogleAccessToken } from './client';

/**
 * Gmail message interface
 */
export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  labels: string[];
  isUnread: boolean;
  hasAttachments: boolean;
}

/**
 * Parse email headers to extract common fields
 */
function parseHeaders(headers: any[]): { from: string; to: string; subject: string; date: string } {
  const headerMap: any = {};
  headers.forEach((header: any) => {
    headerMap[header.name.toLowerCase()] = header.value;
  });

  return {
    from: headerMap['from'] || '',
    to: headerMap['to'] || '',
    subject: headerMap['subject'] || '(No subject)',
    date: headerMap['date'] || '',
  };
}

/**
 * Get recent emails from inbox
 * @param email User's email address
 * @param maxResults Maximum number of emails to return (default: 10)
 * @param query Gmail search query (default: 'in:inbox')
 * @returns Array of email messages
 */
export async function getRecentEmails(
  email: string,
  maxResults: number = 10,
  query: string = 'in:inbox'
): Promise<GmailMessage[]> {
  console.log(`[Gmail API] Fetching recent emails for ${email}`);

  // Get valid access token (auto-refreshes if needed)
  const accessToken = await getGoogleAccessToken(email);

  // Initialize OAuth2 client
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  // Initialize Gmail API
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  try {
    // List messages
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      q: query,
    });

    const messages = listResponse.data.messages || [];

    if (messages.length === 0) {
      console.log('[Gmail API] ✅ No messages found');
      return [];
    }

    // Fetch full message details for each
    const fullMessages = await Promise.all(
      messages.map(async (message) => {
        const msgResponse = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'metadata',
          metadataHeaders: ['From', 'To', 'Subject', 'Date'],
        });

        const data = msgResponse.data;
        const headers = parseHeaders(data.payload?.headers || []);
        const labels = data.labelIds || [];

        return {
          id: data.id || '',
          threadId: data.threadId || '',
          snippet: data.snippet || '',
          from: headers.from,
          to: headers.to,
          subject: headers.subject,
          date: headers.date,
          labels,
          isUnread: labels.includes('UNREAD'),
          hasAttachments: labels.includes('ATTACHMENT') || false,
        };
      })
    );

    console.log(`[Gmail API] ✅ Found ${fullMessages.length} messages`);
    return fullMessages;

  } catch (error) {
    console.error('[Gmail API] ❌ Failed to fetch emails:', error);
    if (error instanceof Error) {
      throw new Error(`Gmail API error: ${error.message}`);
    }
    throw new Error('Gmail API error: Unknown error');
  }
}

/**
 * Get unread emails count
 * @param email User's email address
 * @returns Number of unread emails
 */
export async function getUnreadCount(email: string): Promise<number> {
  console.log(`[Gmail API] Fetching unread count for ${email}`);

  const accessToken = await getGoogleAccessToken(email);

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  try {
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread',
      maxResults: 1,
    });

    const unreadCount = response.data.resultSizeEstimate || 0;
    console.log(`[Gmail API] ✅ Unread count: ${unreadCount}`);

    return unreadCount;

  } catch (error) {
    console.error('[Gmail API] ❌ Failed to get unread count:', error);
    if (error instanceof Error) {
      throw new Error(`Gmail API error: ${error.message}`);
    }
    throw new Error('Gmail API error: Unknown error');
  }
}

/**
 * Search emails by query
 * @param email User's email address
 * @param searchQuery Gmail search query (e.g., 'from:example@gmail.com subject:urgent')
 * @param maxResults Maximum number of results (default: 10)
 * @returns Array of matching email messages
 */
export async function searchEmails(
  email: string,
  searchQuery: string,
  maxResults: number = 10
): Promise<GmailMessage[]> {
  console.log(`[Gmail API] Searching emails for ${email}: "${searchQuery}"`);
  return getRecentEmails(email, maxResults, searchQuery);
}

/**
 * Get user's Gmail profile information
 * @param email User's email address
 * @returns Profile with email address and message/thread counts
 */
export async function getProfile(email: string): Promise<{
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}> {
  console.log(`[Gmail API] Fetching profile for ${email}`);

  const accessToken = await getGoogleAccessToken(email);

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  try {
    const response = await gmail.users.getProfile({
      userId: 'me',
    });

    const profile = response.data;

    console.log(`[Gmail API] ✅ Profile retrieved: ${profile.emailAddress}`);

    return {
      emailAddress: profile.emailAddress || '',
      messagesTotal: profile.messagesTotal || 0,
      threadsTotal: profile.threadsTotal || 0,
      historyId: profile.historyId || '',
    };

  } catch (error) {
    console.error('[Gmail API] ❌ Failed to get profile:', error);
    if (error instanceof Error) {
      throw new Error(`Gmail API error: ${error.message}`);
    }
    throw new Error('Gmail API error: Unknown error');
  }
}
