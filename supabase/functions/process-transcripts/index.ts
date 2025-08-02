import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Supabase client setup
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const openAIApiKey = Deno.env.get("OPENAI_API_KEY") || "";
const recallApiKey = Deno.env.get("RECALL_API_KEY") || "";
const openAIAssistantId = Deno.env.get("OPENAI_ASSISTANT_ID") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CORS headers for the response
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper functions for formatting analysis data
function formatSpeakerBullets(data: any): string {
  if (!data) return '';
  
  // Handle array format: [{"speaker": "Name", "key_points": ["point1", "point2"]}]
  if (Array.isArray(data)) {
    return data
      .map(item => {
        if (item.speaker && Array.isArray(item.key_points)) {
          return `${item.speaker}:\n${item.key_points.map((point: string) => `  ${point}`).join('\n')}`;
        }
        return '';
      })
      .filter(Boolean)
      .join('\n\n');
  }
  
  // Handle object format: {"Speaker Name": ["point1", "point2"]}
  if (typeof data === 'object') {
    return Object.entries(data)
      .map(([speaker, bullets]) => {
        if (Array.isArray(bullets)) {
          return `${speaker}:\n${bullets.map(b => `  ${b}`).join('\n')}`;
        }
        return '';
      })
      .filter(Boolean)
      .join('\n\n');
  }
  
  return '';
}

function formatTone(data: any): string {
  if (!data || typeof data !== 'object') return '';
  
  return Object.entries(data)
    .map(([speaker, toneData]) => {
      if (typeof toneData === 'string') {
        return `${speaker}: ${toneData}`;
      } else if (typeof toneData === 'object' && toneData !== null) {
        // Handle the actual structure from OpenAI: { "tone": "...", "intent": [...], "sentiment": "..." }
        const parts = [];
        if (toneData.tone) parts.push(`Tone: ${toneData.tone}`);
        if (toneData.sentiment) parts.push(`Sentiment: ${toneData.sentiment}`);
        return `${speaker}: ${parts.join(', ')}`;
      }
      return `${speaker}: ${JSON.stringify(toneData)}`;
    })
    .filter(Boolean)
    .join('\n');
}

function formatIntent(data: any): string {
  if (!data || typeof data !== 'object') return '';
  
  return Object.entries(data)
    .map(([speaker, speakerData]) => {
      if (typeof speakerData === 'object' && speakerData !== null) {
        // Handle the actual structure: { "tone": "...", "intent": [...], "sentiment": "..." }
        if (Array.isArray(speakerData.intent)) {
          return `${speaker}:\n${speakerData.intent.map((i: string) => `  - ${i}`).join('\n')}`;
        } else if (Array.isArray(speakerData)) {
          // Fallback for direct array format
          return `${speaker}:\n${speakerData.map((i: string) => `  - ${i}`).join('\n')}`;
        }
      } else if (Array.isArray(speakerData)) {
        // Direct array format
        return `${speaker}:\n${speakerData.map((i: string) => `  - ${i}`).join('\n')}`;
      }
      return '';
    })
    .filter(Boolean)
    .join('\n\n');
}

function joinLines(arr?: string[] | { item?: string; action?: string; issue?: string; note?: string }[]): string {
  if (!arr || !Array.isArray(arr)) return '';
  
  return arr.map(item => {
    if (typeof item === 'string') return item;
    if (typeof item === 'object' && item !== null) {
      // Handle object format with item/action/issue/note properties
      return item.item || item.action || item.issue || item.note || '';
    }
    return '';
  }).filter(Boolean).join('\n');
}

// Helper function to clean and parse JSON from OpenAI response
function cleanAndParseJSON(responseText: string): any {
  console.log(`[process-transcripts] === PARSING JSON START ===`);
  console.log(`[process-transcripts] Raw response length: ${responseText.length}`);
  console.log(`[process-transcripts] Raw response preview (first 500 chars): ${responseText.substring(0, 500)}`);
  
  try {
    // First, try to parse as-is
    const directParse = JSON.parse(responseText);
    console.log(`[process-transcripts] Successfully parsed JSON directly`);
    return directParse;
  } catch (directError) {
    console.log(`[process-transcripts] Direct JSON parse failed: ${directError.message}`);
    
    // Try to extract JSON from markdown code blocks
    const jsonMatch = responseText.match(/```json\s*\n([\s\S]*?)\n\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      console.log(`[process-transcripts] Found JSON in markdown code block`);
      try {
        const extractedJSON = JSON.parse(jsonMatch[1]);
        console.log(`[process-transcripts] Successfully parsed extracted JSON`);
        return extractedJSON;
      } catch (extractError) {
        console.error(`[process-transcripts] Failed to parse extracted JSON: ${extractError.message}`);
        console.error(`[process-transcripts] Extracted content: ${jsonMatch[1].substring(0, 500)}...`);
      }
    }
    
    // Try to find any JSON-like content
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      const possibleJSON = responseText.substring(jsonStart, jsonEnd + 1);
      console.log(`[process-transcripts] Attempting to parse possible JSON content`);
      try {
        const parsedJSON = JSON.parse(possibleJSON);
        console.log(`[process-transcripts] Successfully parsed extracted JSON content`);
        return parsedJSON;
      } catch (fallbackError) {
        console.error(`[process-transcripts] Fallback JSON parse failed: ${fallbackError.message}`);
      }
    }
    
    console.error(`[process-transcripts] All JSON parsing attempts failed`);
    throw new Error(`Unable to parse JSON from response: ${directError.message}`);
  }
}

async function fetchTranscriptText(downloadUrl: string): Promise<string> {
  console.log(`[process-transcripts] === FETCH TRANSCRIPT START ===`);
  console.log(`[process-transcripts] Download URL: ${downloadUrl}`);
  console.log(`[process-transcripts] Using Recall API Key: ${recallApiKey ? 'Present' : 'Missing'}`);
  
  try {
    console.log(`[process-transcripts] Making GET request to: ${downloadUrl}`);
    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${recallApiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error(`[process-transcripts] HTTP error! status: ${response.status}`);
      const errorText = await response.text();
      console.error(`[process-transcripts] Error response body: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const rawResponseText = await response.text();
    console.log(`[process-transcripts] Raw response length: ${rawResponseText.length} characters`);
    
    return rawResponseText;
  } catch (error) {
    console.error(`[process-transcripts] === FETCH TRANSCRIPT ERROR ===`);
    console.error(`[process-transcripts] Error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

async function analyzeTranscriptWithAssistant(transcriptText: string): Promise<any> {
  console.log(`[process-transcripts] === OPENAI ANALYSIS START ===`);
  console.log(`[process-transcripts] Transcript text length: ${transcriptText.length} characters`);
  console.log(`[process-transcripts] OpenAI API Key: ${openAIApiKey ? 'Present' : 'Missing'}`);
  console.log(`[process-transcripts] Assistant ID: ${openAIAssistantId || 'Missing'}`);

  if (!openAIAssistantId) {
    console.error(`[process-transcripts] OpenAI Assistant ID not configured`);
    throw new Error('OpenAI Assistant ID not configured. Please set OPENAI_ASSISTANT_ID environment variable.');
  }

  try {
    // Step 1: Create a thread
    console.log(`[process-transcripts] Step 1: Creating OpenAI thread...`);
    const threadResponse = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({}),
    });

    if (!threadResponse.ok) {
      const errorText = await threadResponse.text();
      console.error(`[process-transcripts] Thread creation failed: ${errorText}`);
      throw new Error(`Failed to create thread: ${errorText}`);
    }

    const threadData = await threadResponse.json();
    const threadId = threadData.id;
    console.log(`[process-transcripts] Created thread: ${threadId}`);

    // Step 2: Add the transcript as a message to the thread
    console.log(`[process-transcripts] Step 2: Adding transcript message to thread...`);
    const messageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        role: 'user',
        content: transcriptText
      }),
    });

    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      console.error(`[process-transcripts] Message creation failed: ${errorText}`);
      throw new Error(`Failed to add message: ${errorText}`);
    }

    console.log(`[process-transcripts] Added transcript message to thread`);

    // Step 3: Run the assistant
    console.log(`[process-transcripts] Step 3: Running assistant...`);
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        assistant_id: openAIAssistantId
      }),
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error(`[process-transcripts] Assistant run failed: ${errorText}`);
      throw new Error(`Failed to run assistant: ${errorText}`);
    }

    const runData = await runResponse.json();
    const runId = runData.id;
    console.log(`[process-transcripts] Started assistant run: ${runId}`);

    // Step 4: Poll for completion
    console.log(`[process-transcripts] Step 4: Polling for completion...`);
    let runStatus = 'queued';
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max

    while (runStatus !== 'completed' && runStatus !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'OpenAI-Beta': 'assistants=v2',
        },
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        runStatus = statusData.status;
        console.log(`[process-transcripts] Run status: ${runStatus} (attempt ${attempts + 1})`);
        
        if (statusData.last_error) {
          console.error(`[process-transcripts] Assistant error: ${JSON.stringify(statusData.last_error)}`);
        }
      }
      
      attempts++;
    }

    if (runStatus !== 'completed') {
      console.error(`[process-transcripts] Assistant run did not complete successfully. Final status: ${runStatus}`);
      throw new Error(`Assistant run did not complete successfully. Final status: ${runStatus}`);
    }

    // Step 5: Retrieve the assistant's response
    console.log(`[process-transcripts] Step 5: Retrieving assistant response...`);
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'OpenAI-Beta': 'assistants=v2',
      },
    });

    if (!messagesResponse.ok) {
      const errorText = await messagesResponse.text();
      console.error(`[process-transcripts] Messages retrieval failed: ${errorText}`);
      throw new Error(`Failed to retrieve messages: ${errorText}`);
    }

    const messagesData = await messagesResponse.json();
    const assistantMessages = messagesData.data.filter((msg: any) => msg.role === 'assistant');
    
    if (assistantMessages.length === 0) {
      console.error(`[process-transcripts] No assistant response found`);
      throw new Error('No assistant response found');
    }

    const latestMessage = assistantMessages[0];
    const content = latestMessage.content[0];
    
    if (content.type === 'text') {
      const responseText = content.text.value;
      console.log(`[process-transcripts] Assistant response text length: ${responseText.length} characters`);
      console.log(`[process-transcripts] Assistant response preview: ${responseText.substring(0, 1000)}...`);
      
      // Use the new parsing function
      const parsedResponse = cleanAndParseJSON(responseText);
      console.log(`[process-transcripts] Successfully parsed response structure`);
      console.log(`[process-transcripts] === OPENAI ANALYSIS SUCCESS ===`);
      return parsedResponse;
    } else {
      console.error(`[process-transcripts] Unexpected response format from assistant: ${content.type}`);
      throw new Error('Unexpected response format from assistant');
    }

  } catch (error) {
    console.error(`[process-transcripts] === OPENAI ANALYSIS ERROR ===`);
    console.error(`[process-transcripts] Error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

async function processTranscript(transcriptId: string): Promise<any> {
  console.log(`[process-transcripts] === PROCESS TRANSCRIPT START ===`);
  console.log(`[process-transcripts] Processing transcript: ${transcriptId}`);
  
  try {
    // 1. Fetch transcript data from the database
    console.log(`[process-transcripts] Step 1: Fetching transcript from database...`);
    const { data: transcript, error: fetchError } = await supabase
      .from('transcripts')
      .select('*')
      .eq('id', transcriptId)
      .maybeSingle();
    
    if (fetchError) {
      console.error(`[process-transcripts] Database fetch error: ${JSON.stringify(fetchError)}`);
      throw new Error(`Failed to fetch transcript: ${fetchError.message}`);
    }
    
    if (!transcript) {
      console.error(`[process-transcripts] Transcript not found with ID: ${transcriptId}`);
      throw new Error(`Transcript not found with ID: ${transcriptId}`);
    }
    
    console.log(`[process-transcripts] Found transcript: ${transcript.id}`);
    
    // 2. Extract download URL from raw_transcript
    if (!transcript.raw_transcript) {
      console.error(`[process-transcripts] No raw transcript data available for ID: ${transcriptId}`);
      throw new Error('No raw transcript data available');
    }
    
    const downloadUrl = transcript.raw_transcript?.data?.download_url;
    if (!downloadUrl) {
      console.error(`[process-transcripts] No download URL found in raw transcript for ID: ${transcriptId}`);
      throw new Error('No download URL found in raw transcript');
    }
    
    console.log(`[process-transcripts] Found download URL: ${downloadUrl}`);
    
    // 3. Fetch transcript text from download URL
    console.log(`[process-transcripts] Step 2: Fetching transcript text from URL...`);
    const transcriptText = await fetchTranscriptText(downloadUrl);
    console.log(`[process-transcripts] Transcript text fetched successfully, length: ${transcriptText.length}`);
    
    // 4. Send transcript to OpenAI Assistant for analysis
    let analysis = null;
    let flattenedAnalysis = {};
    
    if (transcriptText && transcriptText.length > 0) {
      console.log(`[process-transcripts] Step 3: Starting OpenAI Assistant analysis...`);
      analysis = await analyzeTranscriptWithAssistant(transcriptText);
      console.log(`[process-transcripts] Assistant analysis completed successfully`);
      console.log(`[process-transcripts] Analysis result structure: ${JSON.stringify(Object.keys(analysis))}`);
      
      // 5. Transform analysis into human-readable format
      if (analysis && typeof analysis === 'object') {
        console.log(`[process-transcripts] Step 4: Transforming analysis into human-readable format...`);
        
        try {
          // Extract tone and intent data properly
          const toneData = analysis.speaker_intent_analysis;
          console.log(`[process-transcripts] Raw speaker_intent_analysis:`, JSON.stringify(toneData));
          
          // Create flattened analysis with improved formatting
          flattenedAnalysis = {
            meeting_title: analysis.meeting_title || null,
            meeting_summary: analysis.contextual_summary || analysis.meeting_summary || null,
            key_points_by_speaker: analysis.key_points_by_speaker ? formatSpeakerBullets(analysis.key_points_by_speaker) : null,
            key_items_and_action_items: joinLines(analysis.key_items_and_action_items) || null,
            next_steps_and_follow_ups: joinLines(analysis.next_steps_and_follow_ups) || null,
            considerations_and_open_issues: joinLines(analysis.considerations_and_open_issues) || null,
            notes_for_next_meeting: joinLines(analysis.notes_for_next_meeting) || null,
            tone_and_sentiment_analysis: toneData ? formatTone(toneData) : null,
            intent_identification: toneData ? formatIntent(toneData) : null
          };
          
          console.log(`[process-transcripts] Flattened analysis created successfully:`);
          console.log(`[process-transcripts] - meeting_title: ${flattenedAnalysis.meeting_title ? 'Present' : 'Null'}`);
          console.log(`[process-transcripts] - meeting_summary: ${flattenedAnalysis.meeting_summary ? `Present (${flattenedAnalysis.meeting_summary.length} chars)` : 'Null'}`);
          console.log(`[process-transcripts] - key_points_by_speaker: ${flattenedAnalysis.key_points_by_speaker ? `Present (${flattenedAnalysis.key_points_by_speaker.length} chars)` : 'Null'}`);
          console.log(`[process-transcripts] - key_items_and_action_items: ${flattenedAnalysis.key_items_and_action_items ? `Present (${flattenedAnalysis.key_items_and_action_items.length} chars)` : 'Null'}`);
          console.log(`[process-transcripts] - next_steps_and_follow_ups: ${flattenedAnalysis.next_steps_and_follow_ups ? `Present (${flattenedAnalysis.next_steps_and_follow_ups.length} chars)` : 'Null'}`);
          console.log(`[process-transcripts] - considerations_and_open_issues: ${flattenedAnalysis.considerations_and_open_issues ? `Present (${flattenedAnalysis.considerations_and_open_issues.length} chars)` : 'Null'}`);
          console.log(`[process-transcripts] - notes_for_next_meeting: ${flattenedAnalysis.notes_for_next_meeting ? `Present (${flattenedAnalysis.notes_for_next_meeting.length} chars)` : 'Null'}`);
          console.log(`[process-transcripts] - tone_and_sentiment_analysis: ${flattenedAnalysis.tone_and_sentiment_analysis ? `Present (${flattenedAnalysis.tone_and_sentiment_analysis.length} chars)` : 'Null'}`);
          console.log(`[process-transcripts] - intent_identification: ${flattenedAnalysis.intent_identification ? `Present (${flattenedAnalysis.intent_identification.length} chars)` : 'Null'}`);
          
          // Log the specific tone and intent raw data for debugging
          console.log(`[process-transcripts] Raw tone data for formatting:`, JSON.stringify(toneData, null, 2));
          if (toneData) {
            console.log(`[process-transcripts] Formatted tone result:`, flattenedAnalysis.tone_and_sentiment_analysis);
            console.log(`[process-transcripts] Formatted intent result:`, flattenedAnalysis.intent_identification);
          }
          
        } catch (formatError) {
          console.error(`[process-transcripts] Error formatting analysis: ${formatError.message}`);
          console.error(`[process-transcripts] Analysis structure: ${JSON.stringify(analysis)}`);
        }
      }
    } else {
      console.warn(`[process-transcripts] No transcript text available for analysis`);
    }
    
    // 6. Save both transcript text, analysis, and flattened data to database
    console.log(`[process-transcripts] Step 5: Updating database with results...`);
    const updateData: any = {
      transcript_text: transcriptText,
      recall_transcript_id: transcript.raw_transcript.id || transcript.recall_transcript_id,
      updated_at: new Date().toISOString(),
      ...flattenedAnalysis
    };
    
    if (analysis) {
      updateData.open_ai_analysis = analysis;
    }
    
    console.log(`[process-transcripts] === DATABASE UPDATE START ===`);
    console.log(`[process-transcripts] Update data includes:`);
    console.log(`[process-transcripts] - transcript_text length: ${transcriptText.length} characters`);
    console.log(`[process-transcripts] - recall_transcript_id: ${updateData.recall_transcript_id}`);
    console.log(`[process-transcripts] - has_analysis: ${!!analysis}`);
    console.log(`[process-transcripts] - has_flattened_data: ${Object.keys(flattenedAnalysis).length > 0}`);
    
    const { data: updateResult, error: updateError } = await supabase
      .from('transcripts')
      .update(updateData)
      .eq('id', transcriptId)
      .select();
    
    if (updateError) {
      console.error(`[process-transcripts] Database update error: ${JSON.stringify(updateError)}`);
      throw new Error(`Failed to update transcript: ${updateError.message}`);
    }
    
    console.log(`[process-transcripts] Database update successful`);
    console.log(`[process-transcripts] === DATABASE UPDATE END ===`);
    
    // 7. Verify the data was saved correctly
    console.log(`[process-transcripts] Step 6: Verifying data was saved correctly...`);
    const { data: verifyData, error: verifyError } = await supabase
      .from('transcripts')
      .select('transcript_text, open_ai_analysis, recall_transcript_id, meeting_title, meeting_summary, key_points_by_speaker, key_items_and_action_items')
      .eq('id', transcriptId)
      .single();
    
    if (verifyError) {
      console.error(`[process-transcripts] Verification error: ${JSON.stringify(verifyError)}`);
    } else {
      console.log(`[process-transcripts] Verification results:`);
      console.log(`[process-transcripts] - transcript_text length in DB: ${verifyData.transcript_text?.length || 'NULL'}`);
      console.log(`[process-transcripts] - open_ai_analysis present: ${!!verifyData.open_ai_analysis}`);
      console.log(`[process-transcripts] - meeting_title: ${verifyData.meeting_title || 'NULL'}`);
      console.log(`[process-transcripts] - meeting_summary length: ${verifyData.meeting_summary?.length || 'NULL'}`);
      console.log(`[process-transcripts] - key_points_by_speaker length: ${verifyData.key_points_by_speaker?.length || 'NULL'}`);
      console.log(`[process-transcripts] - key_items_and_action_items length: ${verifyData.key_items_and_action_items?.length || 'NULL'}`);
    }
    
    console.log(`[process-transcripts] === PROCESS TRANSCRIPT SUCCESS ===`);
    
    return { 
      success: true, 
      transcriptId, 
      message: "Transcript processed successfully with assistant analysis and human-readable formatting",
      hasAnalysis: !!analysis,
      hasFlattened: Object.keys(flattenedAnalysis).length > 0,
      textLength: transcriptText.length,
      analysisKeys: analysis ? Object.keys(analysis) : [],
      flattenedKeys: Object.keys(flattenedAnalysis),
      verificationResult: verifyData
    };
    
  } catch (error) {
    console.error(`[process-transcripts] === PROCESS TRANSCRIPT ERROR ===`);
    console.error(`[process-transcripts] Error: ${error instanceof Error ? error.message : String(error)}`);
    
    return { 
      success: false, 
      transcriptId,
      message: `Error processing transcript: ${error instanceof Error ? error.message : String(error)}`,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : String(error)
    };
  }
}

serve(async (req) => {
  console.log(`[process-transcripts] === EDGE FUNCTION REQUEST START ===`);
  console.log(`[process-transcripts] Request method: ${req.method}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`[process-transcripts] Handling CORS preflight request`);
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const requestBody = await req.text();
    console.log(`[process-transcripts] Request body: ${requestBody}`);
    
    const { transcriptId } = JSON.parse(requestBody);
    console.log(`[process-transcripts] Parsed transcriptId: ${transcriptId}`);
    
    if (!transcriptId) {
      console.error(`[process-transcripts] Missing transcriptId parameter`);
      return new Response(
        JSON.stringify({ success: false, message: "Missing transcriptId parameter" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    const result = await processTranscript(transcriptId);
    console.log(`[process-transcripts] Final result: ${JSON.stringify(result)}`);
    console.log(`[process-transcripts] === EDGE FUNCTION REQUEST SUCCESS ===`);
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
    
  } catch (error) {
    console.error(`[process-transcripts] === EDGE FUNCTION REQUEST ERROR ===`);
    console.error(`[process-transcripts] Error: ${error instanceof Error ? error.message : String(error)}`);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Error in process-transcripts function: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : String(error)
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
