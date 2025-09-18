/**
 * Recall.ai Calendar Integration
 * Based on recall-ai-setup.md documentation
 */

const RECALL_BASE = "https://us-west-2.recall.ai";
const RECALL_API_KEY = "8c0933578c0fbc870e520b43432b392aba8c3da9";

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
 * Create a Recall.ai calendar for a user after Google OAuth
 */
export async function createRecallCalendar(
  googleTokens: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  },
  googleClientId: string,
  googleClientSecret: string
): Promise<RecallCalendar> {
  console.log('[Recall Calendar] Creating calendar in Recall.ai...');
  
  try {
    const response = await fetch(`${RECALL_BASE}/api/v2/calendars/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RECALL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        oauth_client_id: googleClientId,
        oauth_client_secret: googleClientSecret,
        oauth_refresh_token: googleTokens.refresh_token,
        platform: 'google_calendar',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Recall Calendar] Failed to create calendar:', errorData);
      throw new Error(`Recall.ai calendar creation failed: ${errorData.detail || errorData.error || response.statusText}`);
    }

    const calendar = await response.json();
    console.log('[Recall Calendar] Calendar created successfully:', calendar.id);
    
    return calendar;
  } catch (error) {
    console.error('[Recall Calendar] Error creating calendar:', error);
    throw error;
  }
}

/**
 * Get calendar status from Recall.ai
 */
export async function getRecallCalendar(calendarId: string): Promise<RecallCalendar> {
  console.log('[Recall Calendar] Getting calendar status:', calendarId);
  
  try {
    const response = await fetch(`${RECALL_BASE}/api/v2/calendars/${calendarId}`, {
      headers: {
        'Authorization': `Bearer ${RECALL_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Recall Calendar] Failed to get calendar:', errorData);
      throw new Error(`Failed to get calendar: ${errorData.detail || errorData.error || response.statusText}`);
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
  console.log('[Recall Calendar] Listing events for calendar:', calendarId);
  
  try {
    let url = `${RECALL_BASE}/api/v2/calendar-events/?calendar_id=${calendarId}`;
    if (updatedSince) {
      url += `&updated_at__gte=${updatedSince}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${RECALL_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Recall Calendar] Failed to list events:', errorData);
      throw new Error(`Failed to list events: ${errorData.detail || errorData.error || response.statusText}`);
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
