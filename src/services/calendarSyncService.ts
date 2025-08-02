

import { supabase } from '@/integrations/supabase/client';

interface SyncEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  conferenceData?: {
    createRequest?: {
      requestId: string;
      conferenceSolutionKey: { type: string };
    };
    entryPoints?: Array<{
      entryPointType: string;
      uri: string;
      label?: string;
    }>;
  };
  hangoutLink?: string;
  recurrence?: string[];
}

async function syncGoogleCalendar(calendarId: string, accessToken: string, userId: string) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Google Calendar events: ${response.statusText}`);
    }

    const data = await response.json();
    const events = data.items as SyncEvent[];

    // Process each event
    for (const event of events) {
      const meetingUrl = event.conferenceData?.entryPoints?.[0]?.uri || event.hangoutLink;
      const meetingType = meetingUrl ? 'google_meet' : 'manual';

      // Check if event already exists
      const { data: existingEvent } = await supabase
        .from('meetings')
        .select('id')
        .eq('google_event_id', event.id)
        .single();

      const meetingData = {
        title: event.summary,
        description: event.description,
        start_time: event.start.dateTime,
        end_time: event.end.dateTime,
        location: event.location,
        calendar_external_id: calendarId,
        google_event_id: event.id,
        platform: meetingType === 'google_meet' ? 'google_meet' : null,
        recurrence_rule: event.recurrence?.[0],
        timezone: event.start.timeZone,
        external_id: event.id,
        meeting_type: meetingType,
        meeting_url: meetingUrl,
        user_id: userId
      };

      if (existingEvent) {
        // Update existing event
        await supabase
          .from('meetings')
          .update({
            ...meetingData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingEvent.id);
      } else {
        // Create new event
        await supabase
          .from('meetings')
          .insert(meetingData);
      }

      // Sync attendees if present
      if (event.attendees && event.attendees.length > 0) {
        const meetingId = existingEvent?.id;
        if (meetingId) {
          const attendeeRecords = event.attendees.map(attendee => ({
            meeting_id: meetingId,
            email: attendee.email,
            name: attendee.displayName,
            rsvp_status: (attendee.responseStatus === 'needsAction' ? 'pending' : attendee.responseStatus) as 'pending' | 'accepted' | 'declined' | 'tentative',
            is_organizer: false
          }));

          await supabase
            .from('event_attendees')
            .upsert(attendeeRecords, {
              onConflict: 'meeting_id,email'
            });
        }
      }
    }
  } catch (error) {
    console.error('Error syncing Google Calendar:', error);
    throw error;
  }
}

export { syncGoogleCalendar };

