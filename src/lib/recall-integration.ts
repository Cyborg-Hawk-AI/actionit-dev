// Integration service between our OAuth flow and Recall.ai
import RecallAPIClient, { type RecallCalendar, type RecallCalendarEvent } from './recall-api';

export interface UserCalendarSession {
  user_id: string;
  calendar_id: string;
  status: 'connected' | 'disconnected' | 'error';
  google_tokens: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
  created_at: string;
  updated_at: string;
}

export interface ScheduledBot {
  bot_id: string;
  event_id: string;
  calendar_id: string;
  user_id: string;
  meeting_url: string;
  join_at: string;
  status: 'scheduled' | 'joining' | 'joined' | 'left' | 'error';
  created_at: string;
}

class RecallIntegrationService {
  private recallClient: RecallAPIClient;

  constructor(apiKey: string) {
    this.recallClient = new RecallAPIClient(apiKey);
  }

  /**
   * Connect user's Google Calendar to Recall.ai
   */
  async connectUserCalendar(
    userId: string, 
    googleTokens: {
      access_token: string;
      refresh_token: string;
      expires_at: number;
    }
  ): Promise<UserCalendarSession> {
    try {
      console.log('[Recall Integration] Connecting calendar for user:', userId);
      
      // Create calendar in Recall.ai
      const calendar = await this.recallClient.createCalendar(userId, googleTokens);
      
      // Store the session information
      const session: UserCalendarSession = {
        user_id: userId,
        calendar_id: calendar.id,
        status: calendar.status,
        google_tokens: googleTokens,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // TODO: Store session in your database
      // await this.storeUserSession(session);
      
      console.log('[Recall Integration] Calendar connected successfully:', calendar.id);
      return session;
    } catch (error) {
      console.error('[Recall Integration] Failed to connect calendar:', error);
      throw error;
    }
  }

  /**
   * Sync calendar events and schedule bots for Google Meet meetings
   */
  async syncCalendarEvents(calendarId: string, userId: string): Promise<void> {
    try {
      console.log('[Recall Integration] Syncing events for calendar:', calendarId);
      
      // Get upcoming events (next 7 days)
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const eventsResponse = await this.recallClient.listCalendarEvents({
        calendar_id: calendarId,
        start_time__gte: now.toISOString(),
        end_time__lte: weekFromNow.toISOString(),
      });
      
      const events = eventsResponse.results;
      console.log(`[Recall Integration] Found ${events.length} upcoming events`);
      
      // Process each event
      for (const event of events) {
        await this.processEventForBotScheduling(event, userId);
      }
    } catch (error) {
      console.error('[Recall Integration] Failed to sync calendar events:', error);
      throw error;
    }
  }

  /**
   * Process a calendar event and schedule a bot if it's a Google Meet
   */
  private async processEventForBotScheduling(
    event: RecallCalendarEvent, 
    userId: string
  ): Promise<void> {
    try {
      // Check if this event has a Google Meet link
      const meetUrl = RecallAPIClient.extractGoogleMeetLink(event);
      
      if (!meetUrl) {
        console.log('[Recall Integration] No Google Meet link found for event:', event.title);
        return;
      }
      
      console.log('[Recall Integration] Found Google Meet event:', {
        title: event.title,
        start_time: event.start_time,
        meet_url: meetUrl,
      });
      
      // Check if we already have a bot scheduled for this event
      // TODO: Query your database to check for existing bots
      const existingBot = await this.getExistingBot(event.id, userId);
      if (existingBot) {
        console.log('[Recall Integration] Bot already scheduled for event:', event.title);
        return;
      }
      
      // Schedule bot to join 2 minutes before meeting starts
      const joinAt = new Date(new Date(event.start_time).getTime() - 2 * 60 * 1000).toISOString();
      
      console.log('[Recall Integration] Scheduling bot for meeting:', {
        title: event.title,
        join_at: joinAt,
        meet_url: meetUrl,
      });
      
      const bot = await this.recallClient.createBot(meetUrl, joinAt, {
        bot_name: `Action.IT Bot - ${event.title}`,
        transcription_options: {
          provider: 'deepgram',
          language: 'en',
        },
      });
      
      console.log('[Recall Integration] Bot scheduled successfully:', bot.id);
      
      // Store bot information
      const scheduledBot: ScheduledBot = {
        bot_id: bot.id,
        event_id: event.id,
        calendar_id: event.calendar_id,
        user_id: userId,
        meeting_url: meetUrl,
        join_at: joinAt,
        status: bot.status,
        created_at: new Date().toISOString(),
      };
      
      // TODO: Store scheduled bot in your database
      // await this.storeScheduledBot(scheduledBot);
      
    } catch (error) {
      console.error('[Recall Integration] Failed to process event:', error);
    }
  }

  /**
   * Get existing bot for an event (placeholder)
   */
  private async getExistingBot(eventId: string, userId: string): Promise<ScheduledBot | null> {
    // TODO: Query your database for existing bots
    // This would check if we already have a bot scheduled for this event
    return null;
  }

  /**
   * Get user's calendar status
   */
  async getUserCalendarStatus(userId: string): Promise<UserCalendarSession | null> {
    try {
      // TODO: Query your database for user's calendar session
      // This would return the stored session information
      return null;
    } catch (error) {
      console.error('[Recall Integration] Failed to get calendar status:', error);
      return null;
    }
  }

  /**
   * Disconnect user's calendar
   */
  async disconnectUserCalendar(userId: string): Promise<void> {
    try {
      console.log('[Recall Integration] Disconnecting calendar for user:', userId);
      
      // TODO: Get user's calendar session from database
      // TODO: Clean up scheduled bots for this user
      // TODO: Update session status to 'disconnected'
      
      console.log('[Recall Integration] Calendar disconnected successfully');
    } catch (error) {
      console.error('[Recall Integration] Failed to disconnect calendar:', error);
      throw error;
    }
  }
}

export default RecallIntegrationService;
