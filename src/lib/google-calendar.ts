import { getUserSession } from './google-oauth';

// Google Calendar API endpoints
const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

// Types for Calendar API
export interface Calendar {
  id: string;
  summary: string;
  description?: string;
  timeZone: string;
  colorId?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  accessRole: string;
  primary?: boolean;
}

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
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus: string;
  }>;
  location?: string;
  status: string;
  htmlLink?: string;
  hangoutLink?: string;
}

export interface CalendarListResponse {
  items: Calendar[];
  nextPageToken?: string;
}

export interface EventsListResponse {
  items: CalendarEvent[];
  nextPageToken?: string;
}

/**
 * Makes authenticated requests to Google Calendar API
 */
async function makeCalendarRequest<T>(
  endpoint: string, 
  params?: Record<string, string>
): Promise<T> {
  const session = await getUserSession();
  if (!session) {
    throw new Error('No active Google OAuth session found');
  }

  const url = new URL(`${CALENDAR_API_BASE}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${session.tokens.access_token}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token might be expired, try to refresh
      throw new Error('AUTHENTICATION_REQUIRED');
    }
    
    const errorData = await response.json();
    throw new Error(`Calendar API request failed: ${errorData.error?.message || 'Unknown error'}`);
  }

  return response.json();
}

/**
 * Gets list of user's calendars
 */
export async function getCalendars(): Promise<Calendar[]> {
  try {
    const response = await makeCalendarRequest<CalendarListResponse>('/users/me/calendarList');
    return response.items || [];
  } catch (error) {
    console.error('Failed to get calendars:', error);
    throw new Error('Failed to retrieve calendars');
  }
}

/**
 * Gets events from a specific calendar
 */
export async function getCalendarEvents(
  calendarId: string = 'primary',
  options: {
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
    singleEvents?: boolean;
    orderBy?: 'startTime' | 'updated';
  } = {}
): Promise<CalendarEvent[]> {
  try {
    const params: Record<string, string> = {
      singleEvents: 'true',
      orderBy: 'startTime',
      ...options,
    };

    // Convert options to string parameters
    Object.entries(params).forEach(([key, value]) => {
      if (typeof value === 'boolean') {
        params[key] = value.toString();
      } else if (typeof value === 'number') {
        params[key] = value.toString();
      }
    });

    const response = await makeCalendarRequest<EventsListResponse>(
      `/calendars/${encodeURIComponent(calendarId)}/events`,
      params
    );
    
    return response.items || [];
  } catch (error) {
    console.error('Failed to get calendar events:', error);
    throw new Error('Failed to retrieve calendar events');
  }
}

/**
 * Gets upcoming events from primary calendar
 */
export async function getUpcomingEvents(
  maxResults: number = 10
): Promise<CalendarEvent[]> {
  try {
    const now = new Date();
    const timeMin = now.toISOString();
    
    // Get events for the next 30 days
    const timeMax = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString();
    
    return await getCalendarEvents('primary', {
      timeMin,
      timeMax,
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });
  } catch (error) {
    console.error('Failed to get upcoming events:', error);
    throw new Error('Failed to retrieve upcoming events');
  }
}

/**
 * Gets today's events
 */
export async function getTodaysEvents(): Promise<CalendarEvent[]> {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + (24 * 60 * 60 * 1000));
    
    return await getCalendarEvents('primary', {
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });
  } catch (error) {
    console.error('Failed to get today\'s events:', error);
    throw new Error('Failed to retrieve today\'s events');
  }
}

/**
 * Creates a new calendar event
 */
export async function createCalendarEvent(
  calendarId: string = 'primary',
  event: {
    summary: string;
    description?: string;
    start: {
      dateTime: string;
      timeZone?: string;
    };
    end: {
      dateTime: string;
      timeZone?: string;
    };
    attendees?: Array<{ email: string }>;
    location?: string;
  }
): Promise<CalendarEvent> {
  try {
    const session = await getUserSession();
    if (!session) {
      throw new Error('No active Google OAuth session found');
    }

    const response = await fetch(
      `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.tokens.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to create event: ${errorData.error?.message || 'Unknown error'}`);
    }

    return response.json();
  } catch (error) {
    console.error('Failed to create calendar event:', error);
    throw new Error('Failed to create calendar event');
  }
}

/**
 * Updates an existing calendar event
 */
export async function updateCalendarEvent(
  calendarId: string = 'primary',
  eventId: string,
  event: Partial<CalendarEvent>
): Promise<CalendarEvent> {
  try {
    const session = await getUserSession();
    if (!session) {
      throw new Error('No active Google OAuth session found');
    }

    const response = await fetch(
      `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.tokens.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to update event: ${errorData.error?.message || 'Unknown error'}`);
    }

    return response.json();
  } catch (error) {
    console.error('Failed to update calendar event:', error);
    throw new Error('Failed to update calendar event');
  }
}

/**
 * Deletes a calendar event
 */
export async function deleteCalendarEvent(
  calendarId: string = 'primary',
  eventId: string
): Promise<void> {
  try {
    const session = await getUserSession();
    if (!session) {
      throw new Error('No active Google OAuth session found');
    }

    const response = await fetch(
      `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.tokens.access_token}`,
        },
      }
    );

    if (!response.ok && response.status !== 410) { // 410 is "Gone" which is acceptable for deletion
      const errorData = await response.json();
      throw new Error(`Failed to delete event: ${errorData.error?.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Failed to delete calendar event:', error);
    throw new Error('Failed to delete calendar event');
  }
}

/**
 * Checks if user has calendar access
 */
export async function checkCalendarAccess(): Promise<boolean> {
  try {
    await getCalendars();
    return true;
  } catch (error) {
    console.error('Calendar access check failed:', error);
    return false;
  }
}

