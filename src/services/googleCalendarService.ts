import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface GoogleEvent {
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
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus: 'needsAction' | 'declined' | 'tentative' | 'accepted';
    organizer?: boolean;
  }>;
  recurrence?: string[];
  htmlLink: string;
  hangoutLink?: string;
  conferenceData?: {
    createRequest?: {
      requestId: string;
      conferenceSolutionKey: {
        type: string;
      };
    };
    entryPoints?: Array<{
      entryPointType: string;
      uri: string;
      label: string;
    }>;
  };
}

export interface EventAttendee {
  id: string;
  meeting_id: string;
  email: string;
  name?: string;
  rsvp_status: 'pending' | 'accepted' | 'declined' | 'tentative';
  is_organizer: boolean;
  response_timestamp?: string;
}

const logPrefix = "[Google Calendar Service]";

export async function getEventAttendees(meetingId: string): Promise<EventAttendee[]> {
  try {
    const { data, error } = await supabase
      .from('event_attendees')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    // Ensure proper type casting for rsvp_status
    return (data || []).map(attendee => ({
      ...attendee,
      rsvp_status: attendee.rsvp_status as 'pending' | 'accepted' | 'declined' | 'tentative'
    }));
  } catch (error) {
    console.error(`${logPrefix} Error fetching attendees:`, error);
    return [];
  }
}

export async function updateAttendeeStatus(
  meetingId: string, 
  email: string, 
  status: 'pending' | 'accepted' | 'declined' | 'tentative'
): Promise<void> {
  try {
    const { error } = await supabase
      .from('event_attendees')
      .update({
        rsvp_status: status,
        response_timestamp: new Date().toISOString()
      })
      .eq('meeting_id', meetingId)
      .eq('email', email);

    if (error) throw error;
  } catch (error) {
    console.error(`${logPrefix} Error updating attendee status:`, error);
    throw error;
  }
}

export async function addEventAttendees(meetingId: string, attendees: Array<{ email: string; name?: string }>): Promise<void> {
  try {
    const attendeeRecords = attendees.map(attendee => ({
      meeting_id: meetingId,
      email: attendee.email,
      name: attendee.name,
      rsvp_status: 'pending' as const,
      is_organizer: false
    }));

    const { error } = await supabase
      .from('event_attendees')
      .upsert(attendeeRecords, { 
        onConflict: 'meeting_id,email',
        ignoreDuplicates: false 
      });

    if (error) throw error;
  } catch (error) {
    console.error(`${logPrefix} Error adding attendees:`, error);
    throw error;
  }
}

export async function createGoogleEvent(meetingData: {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  attendees?: Array<{ 
    email: string; 
    name?: string; 
    displayName?: string;
    responseStatus?: 'needsAction' | 'accepted' | 'declined' | 'tentative';
  }>;
  recurrence_rule?: string;
  calendar_external_id: string;
  meeting_type?: 'manual' | 'google_meet';
  userId: string;
}): Promise<GoogleEvent> {
  try {
    console.log(`${logPrefix} Creating Google Calendar event:`, meetingData.title);
    
    // Prepare attendees for Google Calendar API
    const googleAttendees = meetingData.attendees?.map(attendee => ({
      email: attendee.email,
      displayName: attendee.displayName || attendee.name,
      responseStatus: attendee.responseStatus || 'needsAction'
    }));
    
    const { data, error } = await supabase.functions.invoke('google-calendar-api', {
      body: {
        action: 'create_event',
        calendarId: meetingData.calendar_external_id,
        userId: meetingData.userId,
        event: {
          summary: meetingData.title,
          description: meetingData.description,
          start: {
            dateTime: meetingData.start_time,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          end: {
            dateTime: meetingData.end_time,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          location: meetingData.location,
          attendees: googleAttendees,
          recurrence: meetingData.recurrence_rule ? [meetingData.recurrence_rule] : undefined,
          conferenceData: meetingData.meeting_type === 'google_meet' ? {
            createRequest: {
              requestId: `meet-${Date.now()}`,
              conferenceSolutionKey: { type: 'hangoutsMeet' }
            }
          } : undefined
        }
      }
    });

    if (error) throw error;
    return data.event;
  } catch (error) {
    console.error(`${logPrefix} Error creating Google event:`, error);
    toast({
      title: "Event Creation Failed",
      description: "Could not create event in Google Calendar",
      variant: "destructive"
    });
    throw error;
  }
}

export async function updateGoogleEvent(eventId: string, calendarId: string, updates: Partial<GoogleEvent>): Promise<GoogleEvent> {
  try {
    console.log(`${logPrefix} Updating Google Calendar event:`, eventId);
    
    const { data, error } = await supabase.functions.invoke('google-calendar-api', {
      body: {
        action: 'update_event',
        calendarId,
        eventId,
        event: updates
      }
    });

    if (error) throw error;
    return data.event;
  } catch (error) {
    console.error(`${logPrefix} Error updating Google event:`, error);
    toast({
      title: "Event Update Failed",
      description: "Could not update event in Google Calendar",
      variant: "destructive"
    });
    throw error;
  }
}

export async function deleteGoogleEvent(eventId: string, calendarId: string): Promise<void> {
  try {
    console.log(`${logPrefix} Deleting Google Calendar event:`, eventId);
    
    const { error } = await supabase.functions.invoke('google-calendar-api', {
      body: {
        action: 'delete_event',
        calendarId,
        eventId
      }
    });

    if (error) throw error;
  } catch (error) {
    console.error(`${logPrefix} Error deleting Google event:`, error);
    toast({
      title: "Event Deletion Failed",
      description: "Could not delete event in Google Calendar",
      variant: "destructive"
    });
    throw error;
  }
}

export async function setupWebhookNotifications(calendarId: string, userId: string): Promise<void> {
  try {
    console.log(`${logPrefix} Setting up webhook for calendar:`, calendarId);
    
    const { data, error } = await supabase.functions.invoke('google-calendar-api', {
      body: {
        action: 'setup_webhook',
        calendarId,
        userId
      }
    });

    if (error) throw error;
    
    // Update the calendar with webhook info
    if (data.channel) {
      await supabase
        .from('user_calendars')
        .update({
          webhook_channel_id: data.channel.id,
          webhook_resource_id: data.channel.resourceId,
          webhook_expires_at: new Date(parseInt(data.channel.expiration)).toISOString()
        })
        .eq('external_id', calendarId)
        .eq('user_id', userId);
    }
  } catch (error) {
    console.error(`${logPrefix} Error setting up webhook:`, error);
    throw error;
  }
}
