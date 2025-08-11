import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const googleClientId = Deno.env.get("GOOGLE_CLIENT_ID");
const googleClientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
const supabase = createClient(supabaseUrl, supabaseServiceRole);
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  try {
    const { action, calendarId, eventId, event, userId } = await req.json();
    console.log("[Google Calendar API] Action:", action, "User:", userId);
    // Get user's access token
    const { data: connection, error: connectionError } = await supabase.from('calendar_connections').select('access_token, refresh_token, expires_at').eq('user_id', userId).eq('provider', 'google').order('created_at', {
      ascending: false
    }).limit(1).single();
    if (connectionError || !connection) {
      console.error("[Google Calendar API] No calendar connection found:", connectionError);
      throw new Error('No Google Calendar connection found. Please reconnect your calendar.');
    }
    let accessToken = connection.access_token;
    // Check if token is expired
    const tokenExpiry = new Date(connection.expires_at);
    const now = new Date();
    const isExpired = tokenExpiry <= now;
    if (isExpired && connection.refresh_token) {
      console.log("[Google Calendar API] Access token expired, refreshing...");
      accessToken = await refreshAccessToken(connection.refresh_token, userId);
    }
    // Helper function to make authenticated Google API calls
    const makeGoogleAPICall = async (url, options = {})=>{
      console.log("[Google Calendar API] Making request to:", url);
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      console.log("[Google Calendar API] Response status:", response.status);
      if (response.status === 401) {
        console.log("[Google Calendar API] Token expired during request, refreshing...");
        // Token expired, refresh it
        if (connection.refresh_token) {
          accessToken = await refreshAccessToken(connection.refresh_token, userId);
          // Retry the request
          return await fetch(url, {
            ...options,
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              ...options.headers
            }
          });
        } else {
          throw new Error('Access token expired and no refresh token available. Please reconnect your calendar.');
        }
      }
      return response;
    };
    switch(action){
      case 'create_event': {
        console.log("[Google Calendar API] Creating event in calendar:", calendarId);
        if (event.conferenceData) {
          event.conferenceData = {
            createRequest: {
              requestId: `meet-${Date.now()}`,
              conferenceSolutionKey: {
                type: 'hangoutsMeet'
              }
            }
          };
        }
        const createResponse = await makeGoogleAPICall(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1&sendUpdates=all`, {
          method: 'POST',
          body: JSON.stringify(event)
        });
        if (!createResponse.ok) {
          const error = await createResponse.text();
          console.error('[Google Calendar API] Create event error:', error);
          throw new Error(`Failed to create event in Google Calendar: ${error}`);
        }
        const createdEvent = await createResponse.json();
        console.log('[Google Calendar API] Event created successfully:', createdEvent.id);
        return new Response(JSON.stringify({
          event: createdEvent
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      case 'update_event': {
        console.log("[Google Calendar API] Updating event:", eventId);
        const updateResponse = await makeGoogleAPICall(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}?sendUpdates=all`, {
          method: 'PUT',
          body: JSON.stringify(event)
        });
        if (!updateResponse.ok) {
          const error = await updateResponse.text();
          console.error('[Google Calendar API] Update event error:', error);
          throw new Error(`Failed to update event in Google Calendar: ${error}`);
        }
        const updatedEvent = await updateResponse.json();
        console.log('[Google Calendar API] Event updated successfully:', updatedEvent.id);
        return new Response(JSON.stringify({
          event: updatedEvent
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      case 'delete_event': {
        console.log("[Google Calendar API] Deleting event:", eventId);
        const deleteResponse = await makeGoogleAPICall(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}?sendUpdates=all`, {
          method: 'DELETE'
        });
        if (!deleteResponse.ok && deleteResponse.status !== 410) {
          const error = await deleteResponse.text();
          console.error('[Google Calendar API] Delete event error:', error);
          throw new Error(`Failed to delete event from Google Calendar: ${error}`);
        }
        console.log('[Google Calendar API] Event deleted successfully:', eventId);
        return new Response(JSON.stringify({
          success: true
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      case 'setup_webhook': {
        console.log("[Google Calendar API] Setting up webhook for calendar:", calendarId);
        const webhookUrl = `${supabaseUrl}/functions/v1/google-calendar-webhook`;
        const channelId = `action-it-${userId}-${Date.now()}`;
        const webhookResponse = await makeGoogleAPICall(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/watch`, {
          method: 'POST',
          body: JSON.stringify({
            id: channelId,
            type: 'web_hook',
            address: webhookUrl,
            token: userId
          })
        });
        if (!webhookResponse.ok) {
          const error = await webhookResponse.text();
          console.error('[Google Calendar API] Webhook setup error:', error);
          throw new Error(`Failed to setup webhook: ${error}`);
        }
        const webhookData = await webhookResponse.json();
        console.log('[Google Calendar API] Webhook setup successful:', webhookData.id);
        return new Response(JSON.stringify({
          channel: webhookData
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      default: {
        throw new Error(`Unknown action: ${action}`);
      }
    }
  } catch (error) {
    console.error("[Google Calendar API] Error:", error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
async function refreshAccessToken(refreshToken, userId) {
  console.log("[Google Calendar API] Refreshing access token for user:", userId);
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: googleClientId,
      client_secret: googleClientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });
  if (!response.ok) {
    const error = await response.text();
    console.error("[Google Calendar API] Token refresh failed:", error);
    throw new Error('Failed to refresh access token. Please reconnect your calendar.');
  }
  const data = await response.json();
  console.log("[Google Calendar API] Access token refreshed successfully");
  // Update the stored token
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + (data.expires_in || 3600));
  await supabase.from('calendar_connections').update({
    access_token: data.access_token,
    expires_at: expiresAt.toISOString(),
    token_expires_at: expiresAt.toISOString(),
    updated_at: new Date().toISOString()
  }).eq('user_id', userId).eq('provider', 'google');
  return data.access_token;
}
