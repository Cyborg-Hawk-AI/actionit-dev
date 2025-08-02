import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://vfsnygvfgtqwjwrwnseg.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

interface GoogleCalendarEvent {
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

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[Calendar Sync] Starting calendar sync function");
    const requestData = await req.json();
    const { userId } = requestData;
    
    if (!userId) {
      console.error("[Calendar Sync] Missing userId parameter");
      return new Response(
        JSON.stringify({ error: "Missing userId parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("[Calendar Sync] Creating Supabase client");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get all calendar connections for the user
    console.log("[Calendar Sync] Fetching calendar connections for user:", userId);
    const { data: connections, error: connectionsError } = await supabase
      .from("calendar_connections")
      .select("*")
      .eq("user_id", userId);
      
    if (connectionsError) {
      console.error("[Calendar Sync] Failed to fetch calendar connections:", connectionsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch calendar connections", details: connectionsError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`[Calendar Sync] Found ${connections.length} calendar connections`);
    
    const allMeetings = [];
    const allCalendars = [];
    const now = new Date();
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    
    // Fetch events from each connected calendar
    for (const connection of connections) {
      try {
        console.log(`[Calendar Sync] Processing ${connection.provider} calendar connection: ${connection.id}`);
        const isTokenExpired = new Date(connection.token_expires_at) <= now;
        
        if (isTokenExpired) {
          console.warn(`[Calendar Sync] Token expired for ${connection.provider} connection: ${connection.id}`);
          
          // Attempt to refresh the token if we have a refresh token
          if (connection.refresh_token) {
            console.log("[Calendar Sync] Attempting to refresh the token");
            
            let refreshEndpoint = "";
            let requestBody = {};
            
            if (connection.provider === "google") {
              // Google OAuth token refresh
              const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") || "";
              const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";
              
              if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
                console.error("[Calendar Sync] Missing Google OAuth credentials");
                continue;
              }
              
              refreshEndpoint = "https://oauth2.googleapis.com/token";
              requestBody = {
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                refresh_token: connection.refresh_token,
                grant_type: "refresh_token"
              };
            } else if (connection.provider === "microsoft") {
              // Microsoft OAuth token refresh
              const MICROSOFT_CLIENT_ID = Deno.env.get("MICROSOFT_CLIENT_ID") || "";
              const MICROSOFT_CLIENT_SECRET = Deno.env.get("MICROSOFT_CLIENT_SECRET") || "";
              
              if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET) {
                console.error("[Calendar Sync] Missing Microsoft OAuth credentials");
                continue;
              }
              
              refreshEndpoint = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
              requestBody = {
                client_id: MICROSOFT_CLIENT_ID,
                client_secret: MICROSOFT_CLIENT_SECRET,
                refresh_token: connection.refresh_token,
                grant_type: "refresh_token",
                scope: "offline_access Calendars.Read"
              };
            }
            
            if (refreshEndpoint) {
              try {
                const refreshResponse = await fetch(refreshEndpoint, {
                  method: "POST",
                  headers: { "Content-Type": "application/x-www-form-urlencoded" },
                  body: new URLSearchParams(requestBody).toString()
                });
                
                const refreshData = await refreshResponse.json();
                
                if (refreshData.access_token) {
                  console.log("[Calendar Sync] Token refreshed successfully");
                  
                  // Calculate new expiration time
                  const expiresIn = refreshData.expires_in || 3600;
                  const newExpiryDate = new Date();
                  newExpiryDate.setSeconds(newExpiryDate.getSeconds() + expiresIn);
                  
                  // Update token in database
                  await supabase
                    .from("calendar_connections")
                    .update({
                      access_token: refreshData.access_token,
                      token_expires_at: newExpiryDate.toISOString(),
                      refresh_token: refreshData.refresh_token || connection.refresh_token  // Update if provided, otherwise keep existing
                    })
                    .eq("id", connection.id);
                  
                  // Update connection object for current usage
                  connection.access_token = refreshData.access_token;
                  connection.token_expires_at = newExpiryDate.toISOString();
                  if (refreshData.refresh_token) {
                    connection.refresh_token = refreshData.refresh_token;
                  }
                } else {
                  console.error("[Calendar Sync] Failed to refresh token:", refreshData);
                  continue;
                }
              } catch (refreshError) {
                console.error("[Calendar Sync] Error refreshing token:", refreshError);
                continue;
              }
            } else {
              console.log("[Calendar Sync] No refresh endpoint for provider:", connection.provider);
              continue;
            }
          } else {
            console.error("[Calendar Sync] No refresh token available");
            continue;
          }
        }
        
        let events = [];
        
        if (connection.provider === "google") {
          // First, fetch all calendars
          console.log("[Calendar Sync] Fetching Google Calendars list");
          const calendarListResponse = await fetch(
            "https://www.googleapis.com/calendar/v3/users/me/calendarList",
            {
              headers: {
                Authorization: `Bearer ${connection.access_token}`,
              },
            }
          );
          
          const calendarList = await calendarListResponse.json();
          
          if (calendarList.error) {
            console.error("[Calendar Sync] Google Calendar API error (calendar list):", calendarList.error);
            continue;
          }
          
          console.log(`[Calendar Sync] Retrieved ${calendarList.items?.length || 0} Google Calendars`);
          
          // Store calendar metadata
          const calendarItems = calendarList.items || [];
          
          // Save each calendar to the database
          for (const calItem of calendarItems) {
            try {
              // Check if calendar already exists
              const { data: existingCalendar } = await supabase
                .from("user_calendars")
                .select("id")
                .eq("user_id", userId)
                .eq("calendar_connection_id", connection.id)
                .eq("external_id", calItem.id)
                .maybeSingle();
              
              const calendarData = {
                user_id: userId,
                calendar_connection_id: connection.id,
                external_id: calItem.id,
                name: calItem.summary || "Unnamed Calendar",
                description: calItem.description || "",
                color: calItem.backgroundColor || "#4285F4",
                is_primary: calItem.primary === true,
                is_selected: true, // Default to selected, we'll add UI controls later
                auto_join: false,  // Default to false, user can enable per calendar
                auto_record: false // Default to false, user can enable per calendar
              };
              
              if (existingCalendar) {
                console.log(`[Calendar Sync] Updating existing calendar: ${existingCalendar.id}`);
                await supabase
                  .from("user_calendars")
                  .update(calendarData)
                  .eq("id", existingCalendar.id);
              } else {
                console.log(`[Calendar Sync] Inserting new calendar: ${calItem.id}`);
                const { data: newCalendar, error } = await supabase
                  .from("user_calendars")
                  .insert(calendarData)
                  .select()
                  .single();
                  
                if (error) {
                  console.error(`[Calendar Sync] Error inserting calendar:`, error);
                } else {
                  console.log(`[Calendar Sync] Successfully inserted calendar: ${newCalendar.id}`);
                  allCalendars.push(newCalendar);
                }
              }
            } catch (calError) {
              console.error(`[Calendar Sync] Error processing calendar ${calItem.id}:`, calError);
            }
          }
          
          // Now fetch events from each calendar
          for (const calItem of calendarItems) {
            console.log(`[Calendar Sync] Fetching events for calendar: ${calItem.summary} (${calItem.id})`);
            try {
              const calendarResponse = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calItem.id)}/events?timeMin=${now.toISOString()}&timeMax=${oneWeekFromNow.toISOString()}&singleEvents=true&orderBy=startTime`,
                {
                  headers: {
                    Authorization: `Bearer ${connection.access_token}`,
                  },
                }
              );
              
              const calData = await calendarResponse.json();
              
              if (calData.error) {
                console.error(`[Calendar Sync] Google Calendar API error for ${calItem.id}:`, calData.error);
                continue;
              }
              
              console.log(`[Calendar Sync] Retrieved ${calData.items?.length || 0} events from calendar ${calItem.summary}`);
              
              const calEvents = (calData.items || []).map((event) => {
                // Identify meeting URLs
                let meetingUrl = event.hangoutLink || null;
                let platform = event.hangoutLink ? "google_meet" : null;
                
                // Look for meeting URLs in conferenceData
                if (event.conferenceData?.entryPoints) {
                  const videoEntry = event.conferenceData.entryPoints.find(e => e.entryPointType === "video");
                  if (videoEntry?.uri) {
                    meetingUrl = videoEntry.uri;
                    platform = event.conferenceData.conferenceSolution?.name || 
                              (videoEntry.uri.includes('zoom') ? 'zoom' : 
                               videoEntry.uri.includes('teams') ? 'teams' : platform);
                  }
                }
                
                // Look for URLs in the description
                if (!meetingUrl && event.description) {
                  // Check for Zoom links
                  const zoomMatch = event.description.match(/(https:\/\/[a-z0-9-.]+zoom.us\/[^\s<]+)/i);
                  if (zoomMatch) {
                    meetingUrl = zoomMatch[1];
                    platform = "zoom";
                  }
                  
                  // Check for Google Meet links
                  const meetMatch = event.description.match(/(https:\/\/meet.google.com\/[^\s<]+)/i);
                  if (meetMatch && !meetingUrl) {
                    meetingUrl = meetMatch[1];
                    platform = "google_meet";
                  }
                  
                  // Check for Microsoft Teams links
                  const teamsMatch = event.description.match(/(https:\/\/teams.microsoft.com\/[^\s<]+)/i);
                  if (teamsMatch && !meetingUrl) {
                    meetingUrl = teamsMatch[1];
                    platform = "teams";
                  }
                }
                
                return {
                  external_id: event.id,
                  calendar_external_id: calItem.id,
                  title: event.summary || "No Title",
                  description: event.description || "",
                  start_time: event.start.dateTime || `${event.start.date}T00:00:00Z`,
                  end_time: event.end.dateTime || `${event.end.date}T23:59:59Z`,
                  meeting_url: meetingUrl,
                  platform: platform,
                  attendees_count: event.attendees?.length || 1,
                  calendar_name: calItem.summary,
                  calendar_color: calItem.backgroundColor || "#4285F4",
                };
              });
              
              events = events.concat(calEvents);
            } catch (calEventError) {
              console.error(`[Calendar Sync] Error fetching events for calendar ${calItem.id}:`, calEventError);
            }
          }
        } else if (connection.provider === "microsoft") {
          // Keep the existing Microsoft calendar code
          console.log("[Calendar Sync] Fetching Microsoft Calendar events");
          const response = await fetch(
            `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${now.toISOString()}&endDateTime=${oneWeekFromNow.toISOString()}`,
            {
              headers: {
                Authorization: `Bearer ${connection.access_token}`,
                'Content-Type': 'application/json',
              },
            }
          );
          
          const data = await response.json();
          
          if (data.error) {
            console.error("[Calendar Sync] Microsoft Graph API error:", data.error);
            continue;
          }
          
          console.log(`[Calendar Sync] Retrieved ${data.value?.length || 0} Microsoft Calendar events`);
          
          events = (data.value || []).map((event) => ({
            external_id: event.id,
            calendar_external_id: 'primary', // Microsoft doesn't provide calendar ID in the same way
            title: event.subject || "No Title",
            description: event.bodyPreview || "",
            start_time: event.start.dateTime + "Z",
            end_time: event.end.dateTime + "Z",
            meeting_url: event.onlineMeeting?.joinUrl || null,
            platform: event.onlineMeeting ? "teams" : null,
            attendees_count: event.attendees?.length || 1,
            calendar_name: 'Microsoft Calendar',
            calendar_color: '#0078D4', // Microsoft blue
          }));
        }
        
        // Store all events (with or without meeting URLs)
        console.log(`[Calendar Sync] Processing ${events.length} events`);
        
        for (const event of events) {
          try {
            // Check if meeting already exists
            console.log(`[Calendar Sync] Processing event: ${event.title} (${event.external_id})`);
            const { data: existingMeeting } = await supabase
              .from("meetings")
              .select("id")
              .eq("user_id", userId)
              .eq("calendar_id", connection.id)
              .eq("external_id", event.external_id)
              .maybeSingle();
              
            if (existingMeeting) {
              console.log(`[Calendar Sync] Updating existing meeting: ${existingMeeting.id}`);
              // Update existing meeting
              await supabase
                .from("meetings")
                .update({
                  title: event.title,
                  description: event.description,
                  start_time: event.start_time,
                  end_time: event.end_time,
                  meeting_url: event.meeting_url,
                  platform: event.platform,
                  calendar_external_id: event.calendar_external_id,
                  calendar_name: event.calendar_name,
                  calendar_color: event.calendar_color,
                  attendees_count: event.attendees_count,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", existingMeeting.id);
            } else {
              console.log(`[Calendar Sync] Inserting new meeting: ${event.title}`);
              // Insert new meeting
              const { data: newMeeting, error } = await supabase
                .from("meetings")
                .insert({
                  user_id: userId,
                  calendar_id: connection.id,
                  external_id: event.external_id,
                  title: event.title,
                  description: event.description,
                  start_time: event.start_time,
                  end_time: event.end_time,
                  meeting_url: event.meeting_url,
                  platform: event.platform,
                  calendar_external_id: event.calendar_external_id,
                  calendar_name: event.calendar_name,
                  calendar_color: event.calendar_color,
                  attendees_count: event.attendees_count,
                  auto_join: false,
                  auto_record: false,
                })
                .select()
                .single();
                
              if (error) {
                console.error(`[Calendar Sync] Error inserting meeting:`, error);
              } else if (newMeeting) {
                console.log(`[Calendar Sync] Successfully inserted meeting: ${newMeeting.id}`);
                allMeetings.push(newMeeting);
                
                // If the meeting has a URL, check if we should auto-schedule a bot
                if (newMeeting.meeting_url) {
                  // Get user settings
                  const { data: userSettings } = await supabase
                    .from("user_settings")
                    .select("*")
                    .eq("user_id", userId)
                    .maybeSingle();
                  
                  // Check if auto-join is enabled
                  if (userSettings?.auto_join_enabled) {
                    console.log(`[Calendar Sync] Auto-join enabled, checking Recall calendar`);
                    
                    // Get Recall calendar
                    const { data: recallCalendar } = await supabase
                      .from("recall_calendars")
                      .select("*")
                      .eq("user_id", userId)
                      .maybeSingle();
                    
                    // We will handle the bot scheduling in the frontend
                    // This is because we need to interact with the Recall API which requires the API key
                  }
                }
              }
            }
          } catch (eventError) {
            console.error(`[Calendar Sync] Error processing event ${event.external_id}:`, eventError);
          }
        }
      } catch (connectionError) {
        console.error(`[Calendar Sync] Error processing ${connection.provider} calendar:`, connectionError);
      }
    }
    
    // Fetch all upcoming meetings from the database
    console.log(`[Calendar Sync] Fetching all upcoming meetings for user: ${userId}`);
    const { data: upcomingMeetings, error: meetingsError } = await supabase
      .from("meetings")
      .select("*")
      .eq("user_id", userId)
      .gte("end_time", now.toISOString())
      .order("start_time", { ascending: true });
      
    if (meetingsError) {
      console.error("[Calendar Sync] Failed to fetch upcoming meetings:", meetingsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch upcoming meetings", details: meetingsError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Fetch all user calendars
    console.log(`[Calendar Sync] Fetching all calendars for user: ${userId}`);
    const { data: userCalendars, error: calendarsError } = await supabase
      .from("user_calendars")
      .select("*")
      .eq("user_id", userId);
      
    if (calendarsError) {
      console.error("[Calendar Sync] Failed to fetch user calendars:", calendarsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch user calendars", details: calendarsError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`[Calendar Sync] Successfully retrieved ${upcomingMeetings?.length || 0} upcoming meetings`);
    console.log(`[Calendar Sync] Successfully retrieved ${userCalendars?.length || 0} calendars`);
    console.log("[Calendar Sync] Calendar sync completed successfully");
    
    return new Response(
      JSON.stringify({ 
        success: true,
        meetings: upcomingMeetings || [],
        calendars: userCalendars || [],
        newMeetingsCount: allMeetings.length,
        newCalendarsCount: allCalendars.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Calendar Sync] Internal server error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function syncGoogleCalendar(calendarId: string, accessToken: string) {
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
    const events = data.items as GoogleCalendarEvent[];

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

      if (existingEvent) {
        // Update existing event
        await supabase
          .from('meetings')
          .update({
            title: event.summary,
            description: event.description,
            start_time: event.start.dateTime,
            end_time: event.end.dateTime,
            location: event.location,
            meeting_type: meetingType,
            meeting_url: meetingUrl,
            platform: meetingType === 'google_meet' ? 'google_meet' : null,
            recurrence_rule: event.recurrence?.[0],
            timezone: event.start.timeZone,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingEvent.id);
      } else {
        // Create new event
        await supabase
          .from('meetings')
          .insert({
            title: event.summary,
            description: event.description,
            start_time: event.start.dateTime,
            end_time: event.end.dateTime,
            location: event.location,
            calendar_external_id: calendarId,
            google_event_id: event.id,
            meeting_type: meetingType,
            meeting_url: meetingUrl,
            platform: meetingType === 'google_meet' ? 'google_meet' : null,
            recurrence_rule: event.recurrence?.[0],
            timezone: event.start.timeZone
          });
      }

      // Sync attendees if present
      if (event.attendees && event.attendees.length > 0) {
        const attendeeRecords = event.attendees.map(attendee => ({
          meeting_id: existingEvent?.id,
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
  } catch (error) {
    console.error('Error syncing Google Calendar:', error);
    throw error;
  }
}
