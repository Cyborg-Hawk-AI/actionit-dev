import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { setupWebhookNotifications } from "./googleCalendarService";

export interface CalendarConnection {
  id: string;
  provider: string;
  created_at: string;
}

export interface UserCalendar {
  id: string;
  external_id: string;
  name: string;
  color: string;
  is_primary: boolean;
  is_selected: boolean;
  description?: string;
  webhook_channel_id?: string;
  webhook_resource_id?: string;
  webhook_expires_at?: string;
}

export interface Meeting {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  meeting_url: string | null;
  platform: string | null;
  auto_join: boolean;
  auto_record: boolean;
  calendar_external_id: string;
  calendar_name: string;
  calendar_color: string;
  attendees_count: number;
  google_event_id?: string;
  location?: string;
  recurrence_rule?: string;
  timezone?: string;
}

const logPrefix = "[Calendar Service]";

/**
 * Starts the Google Calendar connection flow
 */
export async function connectGoogleCalendar() {
  try {
    console.log(`${logPrefix} Starting Google calendar connection flow`);
    
    // Verify user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.error(`${logPrefix} User not authenticated`);
      toast({
        title: "Authentication Required",
        description: "You must be logged in to connect a calendar",
        variant: "destructive"
      });
      throw new Error('User not authenticated');
    }
    
    localStorage.setItem('oauth_provider', 'google');
    
    // Get the current origin
    const currentOrigin = window.location.origin;
    console.log(`${logPrefix} Current origin: ${currentOrigin}`);
    console.log(`${logPrefix} Protocol: ${window.location.protocol}`);
    console.log(`${logPrefix} Hostname: ${window.location.hostname}`);
    console.log(`${logPrefix} Host: ${window.location.host}`);
    
    try {
      const { data, error } = await supabase.functions.invoke('calendar-auth', {
        body: { 
          action: 'google-auth',
          origin: currentOrigin
        },
      });
      
      console.log(`${logPrefix} Google auth response:`, data, error);
      
      if (error) {
        console.error(`${logPrefix} Google auth error:`, error);
        toast({
          title: "Calendar Connection Failed",
          description: error.message || "Could not connect to Google Calendar",
          variant: "destructive"
        });
        
        throw error;
      }
      
      if (!data || !data.url) {
        console.error(`${logPrefix} Invalid response:`, data);
        toast({
          title: "Calendar Connection Failed",
          description: "Invalid response from authorization server",
          variant: "destructive"
        });
        throw new Error('Invalid response from calendar-auth function');
      }
      
      if (data.url) {
        console.log(`${logPrefix} Redirecting to auth URL:`, data.url);
        
        // Parse and log URL details for debugging
        try {
          const url = new URL(data.url);
          console.log(`${logPrefix} Auth URL protocol:`, url.protocol);
          console.log(`${logPrefix} Auth URL hostname:`, url.hostname);
          console.log(`${logPrefix} Auth URL pathname:`, url.pathname);
          console.log(`${logPrefix} Auth URL search params:`, url.search);
        } catch (e) {
          console.error(`${logPrefix} Failed to parse auth URL:`, e);
        }
        
        window.location.href = data.url;
      } else {
        console.error(`${logPrefix} No authorization URL returned`);
        toast({
          title: "Calendar Connection Failed",
          description: "No authorization URL returned",
          variant: "destructive"
        });
        throw new Error('No authorization URL returned');
      }
    } catch (funcError) {
      console.error(`${logPrefix} Error invoking calendar-auth function:`, funcError);
      toast({
        title: "Calendar Connection Failed",
        description: "Could not connect to authorization server. Please try again later.",
        variant: "destructive"
      });
      throw funcError;
    }
  } catch (error) {
    console.error(`${logPrefix} Error connecting to Google Calendar:`, error);
    toast({
      title: "Calendar Connection Failed",
      description: "An unexpected error occurred. Please try again later.",
      variant: "destructive"
    });
    throw error;
  }
}

/**
 * Starts the Microsoft Calendar connection flow
 */
export async function connectMicrosoftCalendar() {
  try {
    console.log(`${logPrefix} Starting Microsoft calendar connection flow`);
    
    // Verify user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.error(`${logPrefix} User not authenticated`);
      toast.error("You must be logged in to connect a calendar");
      throw new Error('User not authenticated');
    }
    
    localStorage.setItem('oauth_provider', 'microsoft');
    
    // Get the current origin
    const currentOrigin = window.location.origin;
    console.log(`${logPrefix} Current origin: ${currentOrigin}`);
    
    const { data, error } = await supabase.functions.invoke('calendar-auth', {
      body: { 
        action: 'microsoft-auth',
        origin: currentOrigin
      },
    });
    
    console.log(`${logPrefix} Microsoft auth response:`, data, error);
    
    if (error) {
      console.error(`${logPrefix} Microsoft auth error:`, error);
      toast.error(`Calendar connection failed: ${error.message || "Unknown error"}`);
      throw error;
    }
    
    if (data?.url) {
      console.log(`${logPrefix} Redirecting to auth URL:`, data.url);
      window.location.href = data.url;
    } else {
      console.error(`${logPrefix} No authorization URL returned`);
      toast.error("Failed to connect to Microsoft Calendar. Check your OAuth configuration.");
      throw new Error('No authorization URL returned');
    }
  } catch (error) {
    console.error(`${logPrefix} Error connecting to Microsoft Calendar:`, error);
    toast.error("Failed to connect to Microsoft Calendar. Please try again later.");
    throw error;
  }
}

export async function syncCalendars(userId: string) {
  try {
    console.log("[Calendar Service] Starting calendar sync for user:", userId);
    const { data, error } = await supabase.functions.invoke('calendar-sync', {
      body: { userId },
    });
    
    console.log("[Calendar Service] Sync response:", data, error);
    
    if (error) {
      console.error("[Calendar Service] Sync error:", error);
      console.error("[Calendar Service] Error details:", JSON.stringify(error));
      throw error;
    }

    // Setup webhooks for all calendars after sync
    if (data?.calendars) {
      for (const calendar of data.calendars) {
        try {
          await setupWebhookNotifications(calendar.external_id, userId);
        } catch (webhookError) {
          console.warn(`[Calendar Service] Failed to setup webhook for calendar ${calendar.external_id}:`, webhookError);
        }
      }
    }
    
    return {
      meetings: data?.meetings || [],
      calendars: data?.calendars || []
    };
  } catch (error) {
    console.error('[Calendar Service] Error syncing calendars:', error);
    console.error('[Calendar Service] Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }
}

export async function getConnectedCalendars(userId: string): Promise<CalendarConnection[]> {
  try {
    console.log("[Calendar Service] Fetching connected calendars for user:", userId);
    const { data, error } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('user_id', userId);
    
    console.log("[Calendar Service] Connected calendars response:", data, error);
    
    if (error) {
      console.error("[Calendar Service] Error fetching calendar connections:", error);
      console.error("[Calendar Service] Error details:", JSON.stringify(error));
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('[Calendar Service] Error getting calendar connections:', error);
    console.error('[Calendar Service] Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }
}

export async function getUserCalendars(userId: string): Promise<UserCalendar[]> {
  try {
    console.log("[Calendar Service] Fetching user calendars for user:", userId);
    
    // First check if the user_calendars table exists by using a safe query
    const { error: tableCheckError } = await supabase
      .from('user_calendars')
      .select('id')
      .limit(1)
      .maybeSingle();
      
    // If there's a "relation does not exist" error, the table hasn't been migrated yet
    if (tableCheckError && tableCheckError.code === '42P01') {
      console.log("[Calendar Service] user_calendars table doesn't exist yet, returning empty array");
      return [];
    }
    
    // If we get here, the table exists so we can safely query it
    const { data, error } = await supabase
      .from('user_calendars')
      .select('*')
      .eq('user_id', userId);
    
    console.log("[Calendar Service] User calendars response:", data, error);
    
    if (error) {
      console.error("[Calendar Service] Error fetching user calendars:", error);
      console.error("[Calendar Service] Error details:", JSON.stringify(error));
      throw error;
    }
    
    // Ensure the returned data matches the UserCalendar interface
    const calendars: UserCalendar[] = (data || []).map((cal: any) => ({
      id: cal.id,
      external_id: cal.external_id,
      name: cal.name || "Unnamed Calendar",
      color: cal.color || "#4285F4",
      is_primary: cal.is_primary || false,
      is_selected: cal.is_selected || true,
      description: cal.description,
      webhook_channel_id: cal.webhook_channel_id,
      webhook_resource_id: cal.webhook_resource_id,
      webhook_expires_at: cal.webhook_expires_at
    }));
    
    return calendars;
  } catch (error) {
    console.error('[Calendar Service] Error getting user calendars:', error);
    console.error('[Calendar Service] Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Return an empty array instead of throwing to make the app more resilient
    return [];
  }
}

export async function getMeetings(userId: string): Promise<Meeting[]> {
  try {
    console.log("[Calendar Service] Fetching meetings for user:", userId);
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: true });
    
    console.log("[Calendar Service] Meetings response:", data?.length || 0, "meetings found");
    
    if (error) {
      console.error("[Calendar Service] Error fetching meetings:", error);
      console.error("[Calendar Service] Error details:", JSON.stringify(error));
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log("[Calendar Service] No meetings found in database for user:", userId);
      
      try {
        const { count, error: countError } = await supabase
          .from('meetings')
          .select('*', { count: 'exact', head: true });
        
        console.log("[Calendar Service] Total records in meetings table:", count);
        
        if (countError) {
          console.error("[Calendar Service] Error checking meetings table:", countError);
        }
      } catch (checkError) {
        console.error("[Calendar Service] Error checking meetings table structure:", checkError);
      }
    }
    
    // Map the database response to our Meeting interface with new fields
    const meetings: Meeting[] = (data || []).map((meeting: any) => ({
      id: meeting.id,
      title: meeting.title || "Untitled Meeting",
      description: meeting.description,
      start_time: meeting.start_time,
      end_time: meeting.end_time,
      meeting_url: meeting.meeting_url,
      platform: meeting.platform,
      auto_join: meeting.auto_join || false,
      auto_record: meeting.auto_record || false,
      calendar_external_id: meeting.calendar_external_id || meeting.external_id || "",
      calendar_name: meeting.calendar_name || "Calendar",
      calendar_color: meeting.calendar_color || "#4285F4",
      attendees_count: meeting.attendees_count || 0,
      google_event_id: meeting.google_event_id,
      location: meeting.location,
      recurrence_rule: meeting.recurrence_rule,
      timezone: meeting.timezone || 'UTC'
    }));
    
    return meetings;
  } catch (error) {
    console.error('[Calendar Service] Error getting meetings:', error);
    console.error('[Calendar Service] Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    return [];
  }
}

export async function updateMeetingSetting(meetingId: string, setting: 'auto_join' | 'auto_record', value: boolean) {
  try {
    console.log(`[Calendar Service] Updating meeting ${meetingId} setting ${setting} to ${value}`);
    
    const updateData = setting === 'auto_join' 
      ? { auto_join: value } 
      : { auto_record: value };
    
    const { data, error } = await supabase
      .from('meetings')
      .update(updateData)
      .eq('id', meetingId)
      .select()
      .single();
    
    if (error) {
      console.error(`[Calendar Service] Error updating meeting ${setting}:`, error);
      console.error('[Calendar Service] Error details:', JSON.stringify(error));
      throw error;
    }
    
    // Map the database response to our Meeting interface
    const meeting: Meeting = {
      id: data.id,
      title: data.title || "Untitled Meeting",
      description: data.description,
      start_time: data.start_time,
      end_time: data.end_time,
      meeting_url: data.meeting_url,
      platform: data.platform,
      auto_join: data.auto_join || false,
      auto_record: data.auto_record || false,
      calendar_external_id: data.calendar_external_id || data.external_id || "",
      calendar_name: data.calendar_name || "Calendar",
      calendar_color: data.calendar_color || "#4285F4",
      attendees_count: data.attendees_count || 0
    };
    
    return meeting;
  } catch (error) {
    console.error(`[Calendar Service] Error updating meeting ${setting}:`, error);
    console.error('[Calendar Service] Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }
}

export async function updateCalendarSettings(calendarId: string, settings: {
  auto_join?: boolean;
  auto_record?: boolean;
  is_selected?: boolean;
}): Promise<UserCalendar | null> {
  try {
    console.log(`[Calendar Service] Updating calendar settings:`, calendarId, settings);
    
    const { data, error } = await supabase
      .from('user_calendars')
      .update(settings)
      .eq('id', calendarId)
      .select()
      .single();
      
    if (error) {
      console.error('[Calendar Service] Error updating calendar settings:', error);
      throw error;
    }
    
    console.log('[Calendar Service] Calendar settings updated:', data);
    return data;
  } catch (error) {
    console.error('[Calendar Service] Error updating calendar settings:', error);
    toast.error('Failed to update calendar settings');
    return null;
  }
}

// New function to get meeting by ID
export async function getMeetingById(meetingId: string): Promise<Meeting | null> {
  try {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Meeting not found
      }
      throw error;
    }

    return {
      id: data.id,
      title: data.title || "Untitled Meeting",
      description: data.description,
      start_time: data.start_time,
      end_time: data.end_time,
      meeting_url: data.meeting_url,
      platform: data.platform,
      auto_join: data.auto_join || false,
      auto_record: data.auto_record || false,
      calendar_external_id: data.calendar_external_id || data.external_id || "",
      calendar_name: data.calendar_name || "Calendar",
      calendar_color: data.calendar_color || "#4285F4",
      attendees_count: data.attendees_count || 0,
      google_event_id: data.google_event_id,
      location: data.location,
      recurrence_rule: data.recurrence_rule,
      timezone: data.timezone || 'UTC'
    };
  } catch (error) {
    console.error('[Calendar Service] Error getting meeting by ID:', error);
    return null;
  }
}
