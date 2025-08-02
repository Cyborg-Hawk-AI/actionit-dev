
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
const keyInsightsAssistantId = Deno.env.get("OPENAI_KEY_INSIGHTS_ASSISTANT_ID");
const supabase = createClient(supabaseUrl, supabaseServiceRole);

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    console.log("[Generate Key Insights] Received request");
    const payload = await req.json();
    console.log("[Generate Key Insights] Request payload:", JSON.stringify(payload));
    
    // Fix parameter parsing - the trigger sends user_id and meeting_id (snake_case)
    const userId = payload.user_id;
    const meetingId = payload.meeting_id;
    
    if (!userId) {
      throw new Error("Missing required parameter: user_id");
    }
    
    if (!openAIApiKey) {
      throw new Error("OpenAI API key not configured");
    }
    
    if (!keyInsightsAssistantId) {
      throw new Error("Key Insights Assistant ID not configured");
    }
    
    console.log(`[Generate Key Insights] Processing for user ${userId}`);
    
    // Get the current date and 7 days ago
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    console.log(`[Generate Key Insights] Fetching summaries from ${sevenDaysAgo.toISOString()} to ${now.toISOString()}`);
    
    // Fetch all meeting summaries for the user from the last 7 days
    const { data: transcripts, error: transcriptsError } = await supabase
      .from('transcripts')
      .select('meeting_summary, created_at')
      .eq('user_id', userId)
      .not('meeting_summary', 'is', null)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true });
    
    if (transcriptsError) {
      console.error(`[Generate Key Insights] Error fetching transcripts:`, transcriptsError);
      throw new Error(`Failed to fetch transcripts: ${transcriptsError.message}`);
    }
    
    if (!transcripts || transcripts.length === 0) {
      console.log(`[Generate Key Insights] No transcripts found for user ${userId} in the last 7 days`);
      return new Response(
        JSON.stringify({ success: true, message: 'No transcripts found in the last 7 days' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`[Generate Key Insights] Found ${transcripts.length} transcripts to analyze`);
    
    // Combine all summaries into a single text string
    const combinedSummaries = transcripts
      .map((transcript, index) => `Meeting ${index + 1} (${new Date(transcript.created_at).toLocaleDateString()}):\n${transcript.meeting_summary}`)
      .join('\n\n---\n\n');
    
    console.log(`[Generate Key Insights] Combined summaries length: ${combinedSummaries.length} characters`);
    
    // Send to OpenAI Key Insights Assistant
    const keyInsights = await generateKeyInsightsWithOpenAI(combinedSummaries);
    
    // Check if insights already exist for this user (we'll update or insert)
    const { data: existingInsights, error: findError } = await supabase
      .from('key_insights')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (findError) {
      console.error(`[Generate Key Insights] Error finding existing insights:`, findError);
      // Continue anyway
    }
    
    // Prepare the insights record
    const insightsRecord = {
      user_id: userId,
      meeting_id: meetingId, // This will be the most recent meeting that triggered the insights
      insight_summary: keyInsights.insight_summary,
      action_items: keyInsights.action_items,
      decisions: keyInsights.decisions
    };
    
    let operation;
    if (existingInsights) {
      // Update existing insights
      console.log(`[Generate Key Insights] Updating existing insights for user ${userId}`);
      operation = supabase
        .from('key_insights')
        .update(insightsRecord)
        .eq('id', existingInsights.id);
    } else {
      // Insert new insights
      console.log(`[Generate Key Insights] Creating new insights for user ${userId}`);
      operation = supabase
        .from('key_insights')
        .insert(insightsRecord);
    }
    
    const { error: saveError } = await operation;
    
    if (saveError) {
      console.error(`[Generate Key Insights] Error saving insights:`, saveError);
      throw new Error(`Failed to save insights: ${saveError.message}`);
    }
    
    console.log(`[Generate Key Insights] Successfully generated key insights for user ${userId}`);
    
    return new Response(
      JSON.stringify({ success: true, keyInsightsGenerated: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Generate Key Insights] Error generating key insights:", error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Function to generate key insights using OpenAI Assistant
async function generateKeyInsightsWithOpenAI(combinedSummaries: string) {
  console.log(`[Generate Key Insights] Sending to OpenAI Assistant: ${keyInsightsAssistantId}`);
  
  try {
    // Create a thread
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
      throw new Error(`Failed to create thread: ${threadResponse.status} ${threadResponse.statusText}`);
    }
    
    const thread = await threadResponse.json();
    const threadId = thread.id;
    console.log(`[Generate Key Insights] Created thread: ${threadId}`);
    
    // Add the combined summaries as a message to the thread
    const messageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        role: 'user',
        content: combinedSummaries,
      }),
    });
    
    if (!messageResponse.ok) {
      throw new Error(`Failed to add message: ${messageResponse.status} ${messageResponse.statusText}`);
    }
    
    console.log(`[Generate Key Insights] Added message to thread`);
    
    // Run the assistant
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        assistant_id: keyInsightsAssistantId,
      }),
    });
    
    if (!runResponse.ok) {
      throw new Error(`Failed to run assistant: ${runResponse.status} ${runResponse.statusText}`);
    }
    
    const run = await runResponse.json();
    const runId = run.id;
    console.log(`[Generate Key Insights] Started assistant run: ${runId}`);
    
    // Poll for completion
    let runStatus = run.status;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes maximum
    
    while (runStatus !== 'completed' && runStatus !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      attempts++;
      
      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'OpenAI-Beta': 'assistants=v2',
        },
      });
      
      if (!statusResponse.ok) {
        throw new Error(`Failed to check run status: ${statusResponse.status} ${statusResponse.statusText}`);
      }
      
      const statusData = await statusResponse.json();
      runStatus = statusData.status;
      console.log(`[Generate Key Insights] Run status: ${runStatus} (attempt ${attempts})`);
    }
    
    if (runStatus !== 'completed') {
      throw new Error(`Assistant run did not complete successfully. Final status: ${runStatus}`);
    }
    
    // Get the assistant's response
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'OpenAI-Beta': 'assistants=v2',
      },
    });
    
    if (!messagesResponse.ok) {
      throw new Error(`Failed to get messages: ${messagesResponse.status} ${messagesResponse.statusText}`);
    }
    
    const messages = await messagesResponse.json();
    const assistantMessages = messages.data.filter((msg: any) => msg.role === 'assistant');
    
    if (assistantMessages.length === 0) {
      throw new Error('No assistant response found');
    }
    
    const assistantResponse = assistantMessages[0];
    const responseText = assistantResponse.content[0].text.value;
    
    console.log(`[Generate Key Insights] Assistant response: ${responseText.substring(0, 200)}...`);
    
    // Parse the JSON response
    try {
      const parsedResponse = JSON.parse(responseText);
      
      // Validate the expected structure
      if (!parsedResponse.insight_summary || !parsedResponse.action_items || !parsedResponse.decisions) {
        throw new Error('Invalid response structure from assistant');
      }
      
      return {
        insight_summary: parsedResponse.insight_summary,
        action_items: parsedResponse.action_items,
        decisions: parsedResponse.decisions
      };
    } catch (parseError) {
      console.error(`[Generate Key Insights] Failed to parse JSON response: ${parseError.message}`);
      // Fallback: return the raw response in insight_summary
      return {
        insight_summary: responseText,
        action_items: [],
        decisions: []
      };
    }
    
  } catch (error) {
    console.error(`[Generate Key Insights] OpenAI API error: ${error.message}`);
    throw error;
  }
}
