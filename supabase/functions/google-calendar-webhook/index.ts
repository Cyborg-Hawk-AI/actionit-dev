
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-goog-channel-id, x-goog-channel-token, x-goog-resource-id, x-goog-resource-state, x-goog-message-number',
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(supabaseUrl, supabaseServiceRole);

serve(async (req) => {
  console.log("[Google Calendar Webhook] Received request:", req.method);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const headers = Object.fromEntries(req.headers.entries());
    console.log("[Google Calendar Webhook] Headers:", headers);

    const channelId = headers['x-goog-channel-id'];
    const resourceState = headers['x-goog-resource-state'];
    const resourceId = headers['x-goog-resource-id'];

    if (!channelId || !resourceState) {
      console.log("[Google Calendar Webhook] Missing required headers");
      return new Response("Missing required headers", { status: 400, headers: corsHeaders });
    }

    // Find the calendar this webhook belongs to
    const { data: calendar, error: calendarError } = await supabase
      .from('user_calendars')
      .select('*')
      .eq('webhook_channel_id', channelId)
      .eq('webhook_resource_id', resourceId)
      .single();

    if (calendarError || !calendar) {
      console.log("[Google Calendar Webhook] Calendar not found for channel:", channelId);
      return new Response("Calendar not found", { status: 404, headers: corsHeaders });
    }

    // Handle different resource states
    if (resourceState === 'sync') {
      console.log("[Google Calendar Webhook] Sync message, acknowledging");
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    if (resourceState === 'exists') {
      console.log("[Google Calendar Webhook] Change detected, triggering sync");
      
      // Trigger calendar sync for this user and calendar
      const { error: syncError } = await supabase.functions.invoke('calendar-sync', {
        body: { 
          userId: calendar.user_id,
          calendarId: calendar.external_id,
          syncType: 'webhook'
        }
      });

      if (syncError) {
        console.error("[Google Calendar Webhook] Sync trigger error:", syncError);
        return new Response("Sync error", { status: 500, headers: corsHeaders });
      }
    }

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("[Google Calendar Webhook] Error:", error);
    return new Response("Internal error", { status: 500, headers: corsHeaders });
  }
});
