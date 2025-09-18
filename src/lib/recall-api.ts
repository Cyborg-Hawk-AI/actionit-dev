// Recall.ai API client for calendar integration
// Based on the recall-ai-setup.md documentation

const RECALL_API_BASE = 'https://us-east-1.recall.ai/api/v2';

export interface RecallCalendar {
  id: string;
  user_id: string;
  status: 'connected' | 'disconnected' | 'error';
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
  attendees: Array<{
    email: string;
    name?: string;
    response_status: 'accepted' | 'declined' | 'tentative' | 'needs_action';
  }>;
  location?: string;
  description?: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecallBot {
  id: string;
  meeting_url: string;
  join_at: string;
  status: 'scheduled' | 'joining' | 'joined' | 'left' | 'error';
  created_at: string;
}

export interface RecallWebhookEvent {
  type: 'calendar.update' | 'calendar.sync_events';
  calendar_id: string;
  last_updated_ts?: string;
  status?: string;
}

class RecallAPIClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = RECALL_API_BASE;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Token ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Recall API error: ${response.status} - ${errorData.detail || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create a calendar connection for a user
   */
  async createCalendar(userId: string, googleTokens: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  }): Promise<RecallCalendar> {
    console.log('[Recall API] Creating calendar for user:', userId);
    
    return this.makeRequest<RecallCalendar>('/calendars/', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        google_access_token: googleTokens.access_token,
        google_refresh_token: googleTokens.refresh_token,
        google_token_expires_at: new Date(googleTokens.expires_at).toISOString(),
      }),
    });
  }

  /**
   * List all calendars for a user
   */
  async listCalendars(userId?: string): Promise<{ results: RecallCalendar[] }> {
    console.log('[Recall API] Listing calendars for user:', userId);
    
    const params = userId ? `?user_id=${userId}` : '';
    return this.makeRequest<{ results: RecallCalendar[] }>(`/calendars/${params}`);
  }

  /**
   * List calendar events
   */
  async listCalendarEvents(filters: {
    calendar_id?: string;
    updated_at__gte?: string;
    start_time__gte?: string;
    end_time__lte?: string;
  } = {}): Promise<{ results: RecallCalendarEvent[] }> {
    console.log('[Recall API] Listing calendar events with filters:', filters);
    
    const searchParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) searchParams.append(key, value);
    });
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/calendar-events/?${queryString}` : '/calendar-events/';
    
    return this.makeRequest<{ results: RecallCalendarEvent[] }>(endpoint);
  }

  /**
   * Create a bot for a meeting
   */
  async createBot(meetingUrl: string, joinAt: string, options: {
    bot_name?: string;
    transcription_options?: {
      provider: 'deepgram' | 'assembly_ai';
      language?: string;
    };
  } = {}): Promise<RecallBot> {
    console.log('[Recall API] Creating bot for meeting:', meetingUrl);
    
    return this.makeRequest<RecallBot>('/bots/', {
      method: 'POST',
      body: JSON.stringify({
        meeting_url: meetingUrl,
        join_at: joinAt,
        bot_name: options.bot_name || 'Action.IT Bot',
        transcription_options: options.transcription_options || {
          provider: 'deepgram',
          language: 'en',
        },
      }),
    });
  }

  /**
   * Get bot status
   */
  async getBot(botId: string): Promise<RecallBot> {
    console.log('[Recall API] Getting bot status:', botId);
    
    return this.makeRequest<RecallBot>(`/bots/${botId}/`);
  }

  /**
   * Delete a bot
   */
  async deleteBot(botId: string): Promise<void> {
    console.log('[Recall API] Deleting bot:', botId);
    
    await this.makeRequest(`/bots/${botId}/`, {
      method: 'DELETE',
    });
  }

  /**
   * Check if a meeting URL is a Google Meet link
   */
  static isGoogleMeetUrl(url: string): boolean {
    if (!url) return false;
    
    const meetPatterns = [
      /https:\/\/meet\.google\.com\/[a-z0-9-]+/i,
      /https:\/\/meet\.google\.com\/[a-z0-9-]+\?[^/]*/i,
      /https:\/\/meet\.google\.com\/[a-z0-9-]+\/.*/i,
    ];
    
    return meetPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Extract Google Meet link from calendar event
   */
  static extractGoogleMeetLink(event: RecallCalendarEvent): string | null {
    // Check meeting_url field first
    if (event.meeting_url && this.isGoogleMeetUrl(event.meeting_url)) {
      return event.meeting_url;
    }
    
    // Check location field for meet links
    if (event.location && this.isGoogleMeetUrl(event.location)) {
      return event.location;
    }
    
    // Check description for meet links
    if (event.description) {
      const meetUrlMatch = event.description.match(/https:\/\/meet\.google\.com\/[a-z0-9-]+/i);
      if (meetUrlMatch) {
        return meetUrlMatch[0];
      }
    }
    
    return null;
  }
}

export default RecallAPIClient;
