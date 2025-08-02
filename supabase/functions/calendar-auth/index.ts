
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const googleClientId = Deno.env.get("GOOGLE_CLIENT_ID");
const googleClientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

serve(async (req) => {
  console.log("[Calendar Auth] Starting request handling");
  console.log("[Calendar Auth] Request method:", req.method);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    const { action, code, userId, origin } = requestData;
    console.log("[Calendar Auth] Received request with action:", action, "userId:", userId);

    if (!supabaseUrl || !supabaseServiceRole) {
      throw new Error("Supabase configuration not found");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRole);

    if (!googleClientId || !googleClientSecret) {
      console.error("[Calendar Auth] Missing Google OAuth credentials");
      throw new Error("Google OAuth credentials not configured");
    }

    if (action === 'google-auth') {
      const redirectUri = `${origin}/auth/callback`;
      console.log("[Calendar Auth] Using redirect URI:", redirectUri);
      
      const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.calendarlist',
        'https://www.googleapis.com/auth/calendar.settings.readonly',
        'https://www.googleapis.com/auth/calendar.acls',
        'https://www.googleapis.com/auth/calendar.freebusy',
        'https://www.googleapis.com/auth/calendar.app.created',
        'email',
        'profile',
        'openid'
      ].join(' ');

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${googleClientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `include_granted_scopes=true`;

      console.log("[Calendar Auth] Generated Google Auth URL");

      return new Response(JSON.stringify({ url: authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'google-token') {
      console.log("[Calendar Auth] Token exchange request received");

      if (!code) {
        throw new Error('Authorization code is required');
      }

      if (!userId) {
        throw new Error('User ID is required');
      }

      // Delete any existing Google connection for this user to avoid conflicts
      const { error: deleteError } = await supabase
        .from('calendar_connections')
        .delete()
        .eq('user_id', userId)
        .eq('provider', 'google');

      if (deleteError) {
        console.warn("[Calendar Auth] Warning deleting existing connection:", deleteError);
      }

      // Determine the correct redirect URI
      const redirectUri = origin ? `${origin}/auth/callback` : 'https://preview--meet-ai-insights-hub.lovable.app/auth/callback';
      
      console.log("[Calendar Auth] Exchanging code for tokens with redirect URI:", redirectUri);

      // Exchange authorization code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: googleClientId,
          client_secret: googleClientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri
        })
      });

      console.log("[Calendar Auth] Token exchange response status:", tokenResponse.status);

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("[Calendar Auth] Token exchange failed:", errorText);
        
        // Try with alternative redirect URI if the first one fails
        const altRedirectUri = 'https://meet-ai-insights-hub.lovable.app/auth/callback';
        console.log("[Calendar Auth] Retrying with alternative redirect URI:", altRedirectUri);
        
        const retryTokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: googleClientId,
            client_secret: googleClientSecret,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: altRedirectUri
          })
        });

        if (!retryTokenResponse.ok) {
          const retryErrorText = await retryTokenResponse.text();
          console.error("[Calendar Auth] Retry token exchange also failed:", retryErrorText);
          throw new Error(`Token exchange failed: ${retryErrorText}`);
        }

        const tokenData = await retryTokenResponse.json();
        console.log("[Calendar Auth] Token data received successfully on retry");

        // Calculate expiry time
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + (tokenData.expires_in || 3600));

        // Store the connection
        const { data: connection, error: insertError } = await supabase
          .from('calendar_connections')
          .insert({
            user_id: userId,
            provider: 'google',
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || null,
            expires_at: expiresAt.toISOString(),
            token_expires_at: expiresAt.toISOString()
          })
          .select()
          .single();

        if (insertError) {
          console.error("[Calendar Auth] Failed to store calendar connection:", insertError);
          throw new Error(`Failed to store calendar connection: ${insertError.message}`);
        }

        console.log("[Calendar Auth] Calendar connection stored successfully:", connection.id);

        // Trigger calendar sync
        try {
          console.log("[Calendar Auth] Triggering calendar sync...");
          const syncResponse = await supabase.functions.invoke('calendar-sync', {
            body: { userId },
          });
          
          if (syncResponse.error) {
            console.warn("[Calendar Auth] Calendar sync failed but connection was successful:", syncResponse.error);
          } else {
            console.log("[Calendar Auth] Calendar sync completed successfully");
          }
        } catch (syncError) {
          console.warn("[Calendar Auth] Calendar sync failed but connection was successful:", syncError);
        }

        return new Response(JSON.stringify({ 
          success: true, 
          connectionId: connection.id,
          message: 'Google Calendar connected successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const tokenData = await tokenResponse.json();
      console.log("[Calendar Auth] Token data received successfully");

      // Calculate expiry time
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + (tokenData.expires_in || 3600));

      // Store the connection
      const { data: connection, error: insertError } = await supabase
        .from('calendar_connections')
        .insert({
          user_id: userId,
          provider: 'google',
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || null,
          expires_at: expiresAt.toISOString(),
          token_expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error("[Calendar Auth] Failed to store calendar connection:", insertError);
        throw new Error(`Failed to store calendar connection: ${insertError.message}`);
      }

      console.log("[Calendar Auth] Calendar connection stored successfully:", connection.id);

      // Trigger calendar sync after successful connection
      try {
        console.log("[Calendar Auth] Triggering calendar sync...");
        const syncResponse = await supabase.functions.invoke('calendar-sync', {
          body: { userId },
        });
        
        if (syncResponse.error) {
          console.warn("[Calendar Auth] Calendar sync failed but connection was successful:", syncResponse.error);
        } else {
          console.log("[Calendar Auth] Calendar sync completed successfully");
        }
      } catch (syncError) {
        console.warn("[Calendar Auth] Calendar sync failed but connection was successful:", syncError);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        connectionId: connection.id,
        message: 'Google Calendar connected successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error) {
    console.error("[Calendar Auth] Error:", error.message);
    console.error("[Calendar Auth] Stack trace:", error.stack);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
