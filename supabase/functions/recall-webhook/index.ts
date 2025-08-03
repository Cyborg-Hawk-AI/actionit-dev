import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
// API base URL for Recall.ai
const RECALL_API_BASE_URL = "https://us-west-2.recall.ai";
const RECALL_API_KEY = Deno.env.get("RECALL_API_KEY");
// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(supabaseUrl, supabaseServiceRole);
// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  // Allow webhook requests without authentication
  // This is necessary because Recall.ai cannot send authentication headers
  console.log("[Recall Webhook] Received webhook request");
  
  try {
    const payload = await req.json();
    console.log("[Recall Webhook] Webhook payload:", JSON.stringify(payload).substring(0, 500));
    
    const { event, data } = payload;
    
    // Handle different webhook event types
    if (event === "bot.joining_call") {
      return await handleBotJoiningCall(data);
    } else if (event === "bot.in_waiting_room") {
      return await handleBotInWaitingRoom(data);
    } else if (event === "bot.in_call_not_recording") {
      return await handleBotInCallNotRecording(data);
    } else if (event === "bot.recording_permission_allowed") {
      return await handleBotRecordingPermissionAllowed(data);
    } else if (event === "bot.recording_permission_denied") {
      return await handleBotRecordingPermissionDenied(data);
    } else if (event === "bot.in_call_recording") {
      return await handleBotInCallRecording(data);
    } else if (event === "bot.call_ended") {
      return await handleBotCallEnded(data);
    } else if (event === "bot.done") {
      return await handleBotDone(data);
    } else if (event === "bot.fatal") {
      return await handleBotFatal(data);
    } else {
      console.log(`[Recall Webhook] Unhandled event type: ${event}`);
      return new Response(JSON.stringify({ status: "ignored", event }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  } catch (error) {
    console.error("[Recall Webhook] Error processing webhook:", error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
// Handle bot.status_change events
async function handleBotStatusChange(data) {
  const { bot_id, status } = data;
  console.log(`[Recall Webhook] Bot ${bot_id} status changed to: ${status.code}`);
  // Only process these specific status codes
  if ([
    "call_ended",
    "done",
    "fatal"
  ].includes(status.code)) {
    console.log(`[Recall Webhook] Bot ${bot_id} has ended call, triggering analysis`);
    try {
      // Find the meeting ID for this bot
      const { data: recordingData, error: recordingError } = await supabase.from('meeting_recordings').select('*').eq('bot_id', bot_id).maybeSingle();
      if (recordingError) {
        console.error(`[Recall Webhook] Error finding recording for bot ${bot_id}:`, recordingError);
        return new Response(JSON.stringify({
          error: "Failed to find recording",
          details: recordingError
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
      if (!recordingData) {
        console.error(`[Recall Webhook] No recording found for bot ${bot_id}`);
        return new Response(JSON.stringify({
          error: "No recording found for this bot"
        }), {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
      // Update the recording status
      await supabase.from('meeting_recordings').update({
        status: status.code === "fatal" ? "error" : "completed",
        leave_time: new Date().toISOString()
      }).eq('bot_id', bot_id);
      // Initiate asynchronous transcript generation
      const analyzeResponse = await fetch(`${RECALL_API_BASE_URL}/api/v2beta/bot/${bot_id}/analyze`, {
        method: "POST",
        headers: {
          "Authorization": `Token ${RECALL_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          transcript: true
        })
      });
      if (!analyzeResponse.ok) {
        const errorText = await analyzeResponse.text();
        console.error(`[Recall Webhook] Error analyzing bot ${bot_id}:`, errorText);
        return new Response(JSON.stringify({
          error: "Failed to analyze bot",
          details: errorText
        }), {
          status: analyzeResponse.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
      const analyzeData = await analyzeResponse.json();
      console.log(`[Recall Webhook] Successfully initiated analysis for bot ${bot_id}:`, JSON.stringify(analyzeData).substring(0, 200));
      // Immediately try to fetch transcript as well
      await fetchAndStoreTranscript(bot_id, recordingData.meeting_id, recordingData.user_id);
      return new Response(JSON.stringify({
        success: true,
        status: "analysis_initiated",
        bot_id
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    } catch (error) {
      console.error(`[Recall Webhook] Error handling status change for bot ${bot_id}:`, error);
      return new Response(JSON.stringify({
        error: error.message,
        stack: error.stack
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
  }
  return new Response(JSON.stringify({
    status: "ignored",
    reason: "Status not relevant"
  }), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}
// Handle transcript.done events
async function handleTranscriptDone(data) {
  // Extract bot ID and transcript ID from the payload
  const botId = data?.bot?.id;
  const transcriptId = data?.transcript?.id;
  if (!botId) {
    console.error("[Recall Webhook] Missing bot ID in transcript.done event");
    return new Response(JSON.stringify({
      error: "Missing bot ID in transcript.done event"
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
  if (!transcriptId) {
    console.error("[Recall Webhook] Missing transcript ID in transcript.done event");
    return new Response(JSON.stringify({
      error: "Missing transcript ID in transcript.done event"
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
  console.log(`[Recall Webhook] Transcript completed for bot ${botId} with transcript ID ${transcriptId}`);
  try {
    // Find the meeting ID for this bot
    const { data: recordingData, error: recordingError } = await supabase.from('meeting_recordings').select('*').eq('bot_id', botId).maybeSingle();
    if (recordingError || !recordingData) {
      console.error(`[Recall Webhook] Error finding recording for bot ${botId}:`, recordingError);
      return new Response(JSON.stringify({
        error: "Failed to find recording",
        details: recordingError
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const { meeting_id, user_id } = recordingData;
    // Fetch and store the transcript
    await fetchAndStoreTranscript(botId, transcriptId, meeting_id, user_id);
    return new Response(JSON.stringify({
      success: true,
      status: "transcript_processing_started",
      botId,
      transcriptId
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error(`[Recall Webhook] Error handling transcript done for bot ${botId}:`, error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
}
// Handle analysis_done events
async function handleAnalysisDone(data) {
  const botId = data?.bot?.id;
  if (!botId) {
    console.error("[Recall Webhook] Missing bot ID in analysis_done event");
    return new Response(JSON.stringify({
      error: "Missing bot ID in analysis_done event"
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
  console.log(`[Recall Webhook] Analysis completed for bot ${botId}`);
  try {
    // Find the meeting ID for this bot
    const { data: recordingData, error: recordingError } = await supabase.from('meeting_recordings').select('*').eq('bot_id', botId).maybeSingle();
    if (recordingError || !recordingData) {
      console.error(`[Recall Webhook] Error finding recording for bot ${botId}:`, recordingError);
      return new Response(JSON.stringify({
        error: "Failed to find recording",
        details: recordingError
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const { meeting_id, user_id } = recordingData;
    // Fetch and store the transcript
    await fetchAndStoreTranscript(botId, meeting_id, user_id);
    return new Response(JSON.stringify({
      success: true,
      status: "transcript_fetched",
      botId
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error(`[Recall Webhook] Error handling analysis done for bot ${botId}:`, error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
}
// Handle bot_joined events
async function handleBotJoined(data) {
  const { bot_id } = data;
  console.log(`[Recall Webhook] Bot ${bot_id} joined the meeting`);
  
  try {
    // Update the recording status to joined
    await supabase
      .from('meeting_recordings')
      .update({
        status: "joined",
        join_time: new Date().toISOString()
      })
      .eq('bot_id', bot_id);
    
    return new Response(
      JSON.stringify({ success: true, status: "bot_joined", bot_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`[Recall Webhook] Error handling bot joined for bot ${bot_id}:`, error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// Handle bot_left events
async function handleBotLeft(data) {
  const { bot_id } = data;
  console.log(`[Recall Webhook] Bot ${bot_id} left the meeting`);
  
  try {
    // Update the recording status to completed
    await supabase
      .from('meeting_recordings')
      .update({
        status: "completed",
        leave_time: new Date().toISOString()
      })
      .eq('bot_id', bot_id);
    
    // Trigger transcript processing
    await fetchAndStoreTranscript(bot_id, null, null, null);
    
    return new Response(
      JSON.stringify({ success: true, status: "bot_left", bot_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`[Recall Webhook] Error handling bot left for bot ${bot_id}:`, error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// Handle recording_started events
async function handleRecordingStarted(data) {
  const { bot_id } = data;
  console.log(`[Recall Webhook] Recording started for bot ${bot_id}`);
  
  try {
    // Update the recording status
    await supabase
      .from('meeting_recordings')
      .update({
        status: "recording"
      })
      .eq('bot_id', bot_id);
    
    return new Response(
      JSON.stringify({ success: true, status: "recording_started", bot_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`[Recall Webhook] Error handling recording started for bot ${bot_id}:`, error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// Handle recording_stopped events
async function handleRecordingStopped(data) {
  const { bot_id } = data;
  console.log(`[Recall Webhook] Recording stopped for bot ${bot_id}`);
  
  try {
    // Update the recording status
    await supabase
      .from('meeting_recordings')
      .update({
        status: "completed"
      })
      .eq('bot_id', bot_id);
    
    return new Response(
      JSON.stringify({ success: true, status: "recording_stopped", bot_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`[Recall Webhook] Error handling recording stopped for bot ${bot_id}:`, error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// Handle transcript_available events
async function handleTranscriptAvailable(data) {
  const { bot_id, transcript_id } = data;
  console.log(`[Recall Webhook] Transcript available for bot ${bot_id} with transcript ID ${transcript_id}`);
  
  try {
    // Find the meeting ID for this bot
    const { data: recordingData, error: recordingError } = await supabase
      .from('meeting_recordings')
      .select('*')
      .eq('bot_id', bot_id)
      .maybeSingle();
    
    if (recordingError || !recordingData) {
      console.error(`[Recall Webhook] Error finding recording for bot ${bot_id}:`, recordingError);
      return new Response(
        JSON.stringify({ error: "Failed to find recording", details: recordingError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { meeting_id, user_id } = recordingData;
    
    // Fetch and store the transcript
    await fetchAndStoreTranscript(bot_id, transcript_id, meeting_id, user_id);
    
    return new Response(
      JSON.stringify({ success: true, status: "transcript_processing_started", bot_id, transcript_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`[Recall Webhook] Error handling transcript available for bot ${bot_id}:`, error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
// Helper function to fetch and store transcript
async function fetchAndStoreTranscript(botId, transcriptId, meetingId, userId) {
  console.log(`[Recall Webhook] Fetching and storing transcript for bot ${botId}, transcript ${transcriptId}, meeting ${meetingId}`);
  try {
    // Fetch the transcript from Recall.ai API
    const transcriptResponse = await fetch(`${RECALL_API_BASE_URL}/api/v1/transcript/${transcriptId}/`, {
      method: "GET",
      headers: {
        "Authorization": `Token ${RECALL_API_KEY}`,
        "Accept": "application/json"
      }
    });
    if (!transcriptResponse.ok) {
      const errorText = await transcriptResponse.text();
      console.error(`[Recall Webhook] Error fetching transcript ${transcriptId} for bot ${botId}:`, errorText);
      throw new Error(`Failed to fetch transcript: ${errorText}`);
    }
    const transcriptData = await transcriptResponse.json();
    console.log(`[Recall Webhook] Successfully fetched transcript ${transcriptId} for bot ${botId} (first 200 chars):`, JSON.stringify(transcriptData).substring(0, 200));
    // Extract the transcript text if available for logging purposes
    let transcriptTextPreview = '';
    if (transcriptData && transcriptData.transcript) {
      if (typeof transcriptData.transcript === 'string') {
        transcriptTextPreview = transcriptData.transcript.substring(0, 100);
      } else if (transcriptData.transcript.monologue) {
        // Just get first few messages for preview
        const monologue = transcriptData.transcript.monologue;
        if (Array.isArray(monologue) && monologue.length > 0 && monologue[0].messages && monologue[0].messages.length > 0) {
          transcriptTextPreview = monologue[0].messages[0].text;
        }
      }
    }
    console.log(`[Recall Webhook] Parsed transcript text (preview): ${transcriptTextPreview}`);
    // Check if a transcript already exists for this bot/meeting
    const { data: existingTranscript, error: findError } = await supabase.from('transcripts').select('*').eq('bot_id', botId).eq('meeting_id', meetingId).maybeSingle();
    if (findError) {
      console.error(`[Recall Webhook] Error finding existing transcript for bot ${botId}:`, findError);
    }
    // Store the raw transcript data first
    const transcriptRecord = {
      user_id: userId,
      meeting_id: meetingId,
      bot_id: botId,
      raw_transcript: transcriptData,
      recall_transcript_id: transcriptId,
      updated_at: new Date().toISOString()
    };
    let savedTranscriptId;
    let operation;
    if (existingTranscript) {
      // Update existing transcript
      console.log(`[Recall Webhook] Updating existing transcript for bot ${botId}`);
      savedTranscriptId = existingTranscript.id;
      operation = supabase.from('transcripts').update(transcriptRecord).eq('id', existingTranscript.id);
    } else {
      // Insert new transcript
      console.log(`[Recall Webhook] Creating new transcript for bot ${botId}`);
      operation = supabase.from('transcripts').insert(transcriptRecord).select();
    }
    const { data: savedTranscript, error: saveError } = await operation;
    if (saveError) {
      console.error(`[Recall Webhook] Error saving transcript for bot ${botId}:`, saveError);
      throw new Error(`Failed to save transcript: ${saveError.message}`);
    }
    // If this was an insert, get the ID from the response
    if (!existingTranscript && savedTranscript && savedTranscript.length > 0) {
      savedTranscriptId = savedTranscript[0].id;
    }
    console.log(`[Recall Webhook] Successfully saved transcript for bot ${botId}`);
    // Trigger the additional transcript processing
    // Only proceed if we have a valid transcript ID
    if (savedTranscriptId) {
      try {
        console.log(`[Recall Webhook] Triggering additional transcript processing for transcript ${savedTranscriptId}`);
        const { data: processResult, error: processError } = await supabase.functions.invoke('process-transcripts', {
          body: {
            transcriptId: savedTranscriptId
          }
        });
        if (processError) {
          console.error(`[Recall Webhook] Error processing transcript ${savedTranscriptId}:`, processError);
        } else {
          console.log(`[Recall Webhook] Successfully triggered transcript processing for ${savedTranscriptId}`);
        }
      } catch (processError) {
        console.error(`[Recall Webhook] Exception while processing transcript ${savedTranscriptId}:`, processError);
      }
    } else {
      console.warn(`[Recall Webhook] No transcript ID available for additional processing`);
    }
  } catch (error) {
    console.error(`[Recall Webhook] Error in fetchAndStoreTranscript for bot ${botId}:`, error);
    throw error;
  }
}

// Handle bot.joining_call events
async function handleBotJoiningCall(data) {
  const { bot } = data;
  const botId = bot?.id;
  console.log(`[Recall Webhook] Bot ${botId} is joining call`);
  
  try {
    // Update the recording status to joining
    await supabase
      .from('meeting_recordings')
      .update({
        status: "joining"
      })
      .eq('bot_id', botId);
    
    return new Response(
      JSON.stringify({ success: true, status: "bot_joining_call", botId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`[Recall Webhook] Error handling bot joining call for bot ${botId}:`, error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// Handle bot.in_waiting_room events
async function handleBotInWaitingRoom(data) {
  const { bot } = data;
  const botId = bot?.id;
  console.log(`[Recall Webhook] Bot ${botId} is in waiting room`);
  
  try {
    // Update the recording status to waiting
    await supabase
      .from('meeting_recordings')
      .update({
        status: "waiting"
      })
      .eq('bot_id', botId);
    
    return new Response(
      JSON.stringify({ success: true, status: "bot_in_waiting_room", botId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`[Recall Webhook] Error handling bot in waiting room for bot ${botId}:`, error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// Handle bot.in_call_not_recording events
async function handleBotInCallNotRecording(data) {
  const { bot } = data;
  const botId = bot?.id;
  console.log(`[Recall Webhook] Bot ${botId} is in call but not recording`);
  
  try {
    // Update the recording status to joined
    await supabase
      .from('meeting_recordings')
      .update({
        status: "joined"
      })
      .eq('bot_id', botId);
    
    return new Response(
      JSON.stringify({ success: true, status: "bot_in_call_not_recording", botId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`[Recall Webhook] Error handling bot in call not recording for bot ${botId}:`, error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// Handle bot.recording_permission_allowed events
async function handleBotRecordingPermissionAllowed(data) {
  const { bot } = data;
  const botId = bot?.id;
  console.log(`[Recall Webhook] Bot ${botId} recording permission allowed`);
  
  try {
    // Update the recording status to recording
    await supabase
      .from('meeting_recordings')
      .update({
        status: "recording"
      })
      .eq('bot_id', botId);
    
    return new Response(
      JSON.stringify({ success: true, status: "bot_recording_permission_allowed", botId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`[Recall Webhook] Error handling bot recording permission allowed for bot ${botId}:`, error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// Handle bot.recording_permission_denied events
async function handleBotRecordingPermissionDenied(data) {
  const { bot, data: eventData } = data;
  const botId = bot?.id;
  console.log(`[Recall Webhook] Bot ${botId} recording permission denied: ${eventData?.sub_code}`);
  
  try {
    // Update the recording status to permission_denied
    await supabase
      .from('meeting_recordings')
      .update({
        status: "permission_denied"
      })
      .eq('bot_id', botId);
    
    return new Response(
      JSON.stringify({ success: true, status: "bot_recording_permission_denied", botId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`[Recall Webhook] Error handling bot recording permission denied for bot ${botId}:`, error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// Handle bot.in_call_recording events
async function handleBotInCallRecording(data) {
  const { bot } = data;
  const botId = bot?.id;
  console.log(`[Recall Webhook] Bot ${botId} is recording`);
  
  try {
    // Update the recording status to recording
    await supabase
      .from('meeting_recordings')
      .update({
        status: "recording"
      })
      .eq('bot_id', botId);
    
    return new Response(
      JSON.stringify({ success: true, status: "bot_in_call_recording", botId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`[Recall Webhook] Error handling bot in call recording for bot ${botId}:`, error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// Handle bot.call_ended events
async function handleBotCallEnded(data) {
  const { bot, data: eventData } = data;
  const botId = bot?.id;
  console.log(`[Recall Webhook] Bot ${botId} call ended: ${eventData?.sub_code}`);
  
  try {
    // Update the recording status to completed
    await supabase
      .from('meeting_recordings')
      .update({
        status: "completed",
        leave_time: new Date().toISOString()
      })
      .eq('bot_id', botId);
    
    // Trigger transcript processing
    await fetchAndStoreTranscript(botId, null, null, null);
    
    return new Response(
      JSON.stringify({ success: true, status: "bot_call_ended", botId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`[Recall Webhook] Error handling bot call ended for bot ${botId}:`, error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// Handle bot.done events
async function handleBotDone(data) {
  const { bot } = data;
  const botId = bot?.id;
  console.log(`[Recall Webhook] Bot ${botId} is done`);
  
  try {
    // Update the recording status to completed
    await supabase
      .from('meeting_recordings')
      .update({
        status: "completed",
        leave_time: new Date().toISOString()
      })
      .eq('bot_id', botId);
    
    // Trigger transcript processing
    await fetchAndStoreTranscript(botId, null, null, null);
    
    return new Response(
      JSON.stringify({ success: true, status: "bot_done", botId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`[Recall Webhook] Error handling bot done for bot ${botId}:`, error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// Handle bot.fatal events
async function handleBotFatal(data) {
  const { bot, data: eventData } = data;
  const botId = bot?.id;
  console.log(`[Recall Webhook] Bot ${botId} fatal error: ${eventData?.sub_code}`);
  
  try {
    // Update the recording status to error
    await supabase
      .from('meeting_recordings')
      .update({
        status: "error",
        leave_time: new Date().toISOString()
      })
      .eq('bot_id', botId);
    
    return new Response(
      JSON.stringify({ success: true, status: "bot_fatal", botId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`[Recall Webhook] Error handling bot fatal for bot ${botId}:`, error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
