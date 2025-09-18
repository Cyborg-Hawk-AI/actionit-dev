import { VercelRequest, VercelResponse } from '@vercel/node';
import RecallAPIClient from '../../src/lib/recall-api';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[Recall Webhook] Received webhook:', req.body);
    
    const webhookEvent = req.body as {
      type: 'calendar.update' | 'calendar.sync_events';
      calendar_id: string;
      last_updated_ts?: string;
      status?: string;
    };

    // Get Recall API key from environment
    const recallApiKey = process.env.RECALL_API_KEY;
    if (!recallApiKey) {
      throw new Error('RECALL_API_KEY environment variable is not set');
    }

    const recallClient = new RecallAPIClient(recallApiKey);

    switch (webhookEvent.type) {
      case 'calendar.update':
        console.log('[Recall Webhook] Calendar update:', {
          calendar_id: webhookEvent.calendar_id,
          status: webhookEvent.status,
        });
        
        // Handle calendar disconnection or status change
        if (webhookEvent.status === 'disconnected') {
          console.log('[Recall Webhook] Calendar disconnected, cleaning up bots');
          // TODO: Clean up scheduled bots for this calendar
          // This would involve querying your database for scheduled bots
          // and removing them via the Recall API
        }
        break;

      case 'calendar.sync_events':
        console.log('[Recall Webhook] Calendar sync events:', {
          calendar_id: webhookEvent.calendar_id,
          last_updated_ts: webhookEvent.last_updated_ts,
        });
        
        // Sync events and schedule bots for new Google Meet meetings
        await handleCalendarSync(recallClient, webhookEvent.calendar_id, webhookEvent.last_updated_ts);
        break;

      default:
        console.log('[Recall Webhook] Unknown webhook type:', webhookEvent.type);
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('[Recall Webhook] Error processing webhook:', error);
    return res.status(500).json({ 
      error: 'Failed to process webhook',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function handleCalendarSync(
  recallClient: RecallAPIClient, 
  calendarId: string, 
  lastUpdatedTs?: string
) {
  try {
    console.log('[Recall Webhook] Syncing calendar events for:', calendarId);
    
    // Get updated events since last sync
    const filters: any = { calendar_id: calendarId };
    if (lastUpdatedTs) {
      filters.updated_at__gte = lastUpdatedTs;
    }
    
    const eventsResponse = await recallClient.listCalendarEvents(filters);
    const events = eventsResponse.results;
    
    console.log(`[Recall Webhook] Found ${events.length} updated events`);
    
    // Process each event
    for (const event of events) {
      await processCalendarEvent(recallClient, event);
    }
  } catch (error) {
    console.error('[Recall Webhook] Error syncing calendar:', error);
  }
}

async function processCalendarEvent(
  recallClient: RecallAPIClient, 
  event: any
) {
  try {
    // Check if this event has a Google Meet link
    const meetUrl = RecallAPIClient.extractGoogleMeetLink(event);
    
    if (!meetUrl) {
      console.log('[Recall Webhook] No Google Meet link found for event:', event.title);
      return;
    }
    
    console.log('[Recall Webhook] Found Google Meet event:', {
      title: event.title,
      start_time: event.start_time,
      meet_url: meetUrl,
    });
    
    // Check if we already have a bot scheduled for this event
    // TODO: Query your database to check for existing bots
    
    // Schedule bot to join 2 minutes before meeting starts
    const joinAt = new Date(new Date(event.start_time).getTime() - 2 * 60 * 1000).toISOString();
    
    console.log('[Recall Webhook] Scheduling bot for meeting:', {
      title: event.title,
      join_at: joinAt,
      meet_url: meetUrl,
    });
    
    const bot = await recallClient.createBot(meetUrl, joinAt, {
      bot_name: `Action.IT Bot - ${event.title}`,
      transcription_options: {
        provider: 'deepgram',
        language: 'en',
      },
    });
    
    console.log('[Recall Webhook] Bot scheduled successfully:', bot.id);
    
    // TODO: Store bot information in your database
    // This would include: bot_id, event_id, calendar_id, user_id, etc.
    
  } catch (error) {
    console.error('[Recall Webhook] Error processing event:', error);
  }
}
