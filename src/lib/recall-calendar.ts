/**
 * Recall.ai Calendar Integration
 * Based on recall-ai-setup.md documentation
 */

const RECALL_BASE = "https://us-west-2.recall.ai";

export interface RecallCalendar {
  id: string;
  status: string;
  platform: string;
  platform_email?: string;
  created_at: string;
  updated_at: string;
}

export interface RecallCalendarEvent {
  id: string;
  calendar_id: string;
  title: string;
  start_time: string;
  end_time: string;
  meeting_url?: string;
  is_deleted: boolean;
  attendees: Array<{
    email: string;
    name?: string;
  }>;
  raw: any; // Google Calendar event data
}

export interface RecallBot {
  id: string;
  calendar_event_id: string;
  meeting_url: string;
  status: string;
  created_at: string;
}


/**
 * Get a Recall.ai calendar auth token for a user
 * This is the first step in the Recall.ai integration
 */
export async function getRecallCalendarAuthToken(userId: string): Promise<string> {
  console.log('[Recall.ai Debug] ===== GETTING RECALL.AI CALENDAR AUTH TOKEN =====');
  console.log('[Recall.ai Debug] User ID:', userId);
  console.log('[Recall.ai Debug] Recall.ai API Base URL:', RECALL_BASE);
  console.log('[Recall.ai Debug] Recall.ai API Key (masked):', RECALL_API_KEY.substring(0, 8) + '...');
  
  try {
    console.log('[Recall.ai Debug] Making request to get calendar auth token...');
    console.log('[Recall.ai Debug] Full URL:', `${RECALL_BASE}/api/v1/calendar/auth-token`);
    
    const response = await fetch(`${RECALL_BASE}/api/v1/calendar/auth-token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RECALL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
      }),
    });

    console.log('[Recall.ai Debug] Response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      console.error('[Recall.ai Debug] Request failed, attempting to parse error response...');
      let errorData;
      try {
        const responseText = await response.text();
        console.error('[Recall.ai Debug] Raw error response:', responseText);
        errorData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('[Recall.ai Debug] Failed to parse error response:', parseError);
        throw new Error(`Recall.ai auth token request failed: ${response.status} - ${response.statusText} - Unable to parse error response`);
      }
      
      console.error('[Recall.ai Debug] Parsed error data:', errorData);
      throw new Error(`Recall.ai auth token request failed: ${errorData.detail || errorData.error || response.statusText}`);
    }

    console.log('[Recall.ai Debug] Request successful, parsing response...');
    const data = await response.json();
    console.log('[Recall.ai Debug] Auth token received:', {
      hasToken: !!data.auth_token,
      tokenPrefix: data.auth_token?.substring(0, 10) + '...'
    });
    
    console.log('[Recall.ai Debug] ===== RECALL.AI AUTH TOKEN RECEIVED =====');
    return data.auth_token;
  } catch (error) {
    console.error('[Recall.ai Debug] ===== RECALL.AI AUTH TOKEN REQUEST FAILED =====');
    console.error('[Recall.ai Debug] Error type:', typeof error);
    console.error('[Recall.ai Debug] Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('[Recall.ai Debug] Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('[Recall.ai Debug] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    throw error;
  }
}

/**
 * Generate the Recall.ai OAuth URL for Google Calendar integration
 * This redirects the user to Google OAuth with Recall.ai's callback
 */
export async function generateRecallOAuthUrl(
  recallAuthToken: string,
  successUrl?: string,
  errorUrl?: string
): Promise<string> {
  console.log('[Recall.ai Debug] ===== GENERATING RECALL.AI OAUTH URL =====');
  console.log('[Recall.ai Debug] Recall auth token (masked):', recallAuthToken.substring(0, 10) + '...');
  
  // Note: This function is no longer used since we're using the server-side API route
  // The OAuth flow is now handled entirely through the server-side createRecallCalendar function
  throw new Error('This function is deprecated. Use the server-side API route instead.');
}

/**
 * Create a Recall.ai calendar for a user after Google OAuth
 * This calls our server-side API route which handles AWS Secrets Manager access
 */
export async function createRecallCalendar(
  googleTokens: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  }
): Promise<RecallCalendar> {
  console.log('[Recall.ai Debug] ===== STARTING RECALL.AI CALENDAR CREATION =====');
  console.log('[Recall.ai Debug] Google tokens:', {
    accessTokenPrefix: googleTokens.access_token?.substring(0, 10) + '...',
    refreshTokenPrefix: googleTokens.refresh_token?.substring(0, 10) + '...',
    expiresAt: googleTokens.expires_at,
    expiresAtDate: new Date(googleTokens.expires_at).toISOString()
  });
  
  try {
    console.log('[Recall.ai Debug] Calling server-side API route...');
    console.log('[Recall.ai Debug] Full URL:', '/api/recall/create-calendar');
    
    const response = await fetch('/api/recall/create-calendar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        googleTokens: googleTokens
      }),
    });

    console.log('[Recall.ai Debug] Response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      console.error('[Recall.ai Debug] Request failed, attempting to parse error response...');
      let errorData;
      try {
        const responseText = await response.text();
        console.error('[Recall.ai Debug] Raw error response:', responseText);
        errorData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('[Recall.ai Debug] Failed to parse error response:', parseError);
        throw new Error(`Recall.ai calendar creation failed: ${response.status} - ${response.statusText} - Unable to parse error response`);
      }
      
      console.error('[Recall.ai Debug] Parsed error data:', errorData);
      throw new Error(`Recall.ai calendar creation failed: ${errorData.error || errorData.details || response.statusText}`);
    }

    console.log('[Recall.ai Debug] Request successful, parsing response...');
    const calendar = await response.json();
    console.log('[Recall.ai Debug] Calendar created successfully:', {
      id: calendar.id,
      status: calendar.status,
      platform: calendar.platform,
      platform_email: calendar.platform_email,
      created_at: calendar.created_at,
      updated_at: calendar.updated_at
    });
    
    console.log('[Recall.ai Debug] ===== RECALL.AI CALENDAR CREATION COMPLETED =====');
    return calendar;
  } catch (error) {
    console.error('[Recall.ai Debug] ===== RECALL.AI CALENDAR CREATION FAILED =====');
    console.error('[Recall.ai Debug] Error type:', typeof error);
    console.error('[Recall.ai Debug] Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('[Recall.ai Debug] Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('[Recall.ai Debug] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('[Recall.ai Debug] Error cause:', error instanceof Error ? error.cause : undefined);
    
    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('[Recall.ai Debug] Network error detected - possible CORS or connectivity issue');
    }
    
    throw error;
  }
}

/**
 * Get calendar status from Recall.ai
 */
export async function getRecallCalendar(calendarId: string): Promise<RecallCalendar> {
  console.log('[Recall Calendar] Getting calendar status via server-side API:', calendarId);
  
  try {
    const response = await fetch(`/api/recall/calendar/${calendarId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Recall Calendar] Failed to get calendar:', errorData);
      throw new Error(`Failed to get calendar: ${errorData.error || errorData.details || response.statusText}`);
    }

    const calendar = await response.json();
    console.log('[Recall Calendar] Calendar status:', calendar.status);
    
    return calendar;
  } catch (error) {
    console.error('[Recall Calendar] Error getting calendar:', error);
    throw error;
  }
}

/**
 * List calendar events from Recall.ai
 */
export async function listRecallCalendarEvents(
  calendarId: string,
  updatedSince?: number
): Promise<RecallCalendarEvent[]> {
  console.log('[Recall Calendar] Listing events for calendar via server-side API:', calendarId);
  
  try {
    let url = `/api/recall/calendar/${calendarId}/events`;
    if (updatedSince) {
      url += `?updated_since=${updatedSince}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Recall Calendar] Failed to list events:', errorData);
      throw new Error(`Failed to list events: ${errorData.error || errorData.details || response.statusText}`);
    }

    const data = await response.json();
    console.log('[Recall Calendar] Found events:', data.results?.length || 0);
    
    return data.results || [];
  } catch (error) {
    console.error('[Recall Calendar] Error listing events:', error);
    throw error;
  }
}

/**
 * Schedule a bot for a calendar event
 */
export async function scheduleBotForEvent(
  eventId: string,
  meetingUrl: string
): Promise<RecallBot> {
  console.log('[Recall Calendar] Scheduling bot for event:', eventId);
  
  try {
    const response = await fetch(`${RECALL_BASE}/api/v2/calendar-events/${eventId}/schedule_bot`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RECALL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        meeting_url: meetingUrl,
        // Add any bot configuration here
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Recall Calendar] Failed to schedule bot:', errorData);
      throw new Error(`Failed to schedule bot: ${errorData.detail || errorData.error || response.statusText}`);
    }

    const bot = await response.json();
    console.log('[Recall Calendar] Bot scheduled successfully:', bot.id);
    
    return bot;
  } catch (error) {
    console.error('[Recall Calendar] Error scheduling bot:', error);
    throw error;
  }
}

/**
 * Check if an event should have a bot scheduled
 */
export function shouldScheduleBot(event: RecallCalendarEvent): boolean {
  // Skip deleted events
  if (event.is_deleted) {
    return false;
  }

  // Skip events without meeting URLs
  if (!event.meeting_url) {
    return false;
  }

  // Skip events in the past
  const now = new Date();
  const eventStart = new Date(event.start_time);
  if (eventStart < now) {
    return false;
  }

  // Skip private events (if we can detect them)
  if (event.title?.toLowerCase().includes('private')) {
    return false;
  }

  // Skip events with very few attendees (optional)
  if (event.attendees && event.attendees.length < 2) {
    return false;
  }

  return true;
}

/**
 * Extract Google Meet URL from calendar event
 */
export function extractGoogleMeetUrl(event: RecallCalendarEvent): string | null {
  if (event.meeting_url) {
    return event.meeting_url;
  }

  // Check if there's a Google Meet link in the description or location
  const description = event.raw?.description || '';
  const location = event.raw?.location || '';
  
  const meetUrlPattern = /https:\/\/meet\.google\.com\/[a-z0-9-]+/i;
  const meetUrl = description.match(meetUrlPattern) || location.match(meetUrlPattern);
  
  if (meetUrl) {
    return meetUrl[0];
  }

  return null;
}
