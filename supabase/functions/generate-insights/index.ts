
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
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
    console.log("[Generate Insights] Received request");
    const payload = await req.json();
    console.log("[Generate Insights] Request payload:", JSON.stringify(payload));
    
    const { userId, meetingId, botId } = payload;
    
    if (!meetingId) {
      throw new Error("Missing required parameter: meetingId");
    }
    
    if (!userId) {
      throw new Error("Missing required parameter: userId");
    }
    
    // Fetch the transcript for the meeting
    const { data: transcript, error: transcriptError } = await supabase
      .from('transcripts')
      .select('*')
      .eq('meeting_id', meetingId)
      .maybeSingle();
    
    if (transcriptError) {
      console.error(`[Generate Insights] Error fetching transcript:`, transcriptError);
      throw new Error(`Failed to fetch transcript: ${transcriptError.message}`);
    }
    
    if (!transcript) {
      console.error(`[Generate Insights] No transcript found for meeting ${meetingId}`);
      throw new Error(`No transcript found for meeting ${meetingId}`);
    }
    
    // Verify that we have transcript text
    if (!transcript.transcript_text || transcript.transcript_text.trim() === '') {
      console.error(`[Generate Insights] Empty transcript text for meeting ${meetingId}`);
      throw new Error(`Empty transcript text for meeting ${meetingId}`);
    }
    
    console.log(`[Generate Insights] Processing transcript for meeting ${meetingId}, length: ${transcript.transcript_text.length} characters`);
    
    // Extract key insights from the transcript
    const insights = extractInsights(transcript.transcript_text);
    
    // Check if insights already exist for this meeting
    const { data: existingInsights, error: findError } = await supabase
      .from('key_insights')
      .select('*')
      .eq('meeting_id', meetingId)
      .maybeSingle();
    
    if (findError) {
      console.error(`[Generate Insights] Error finding existing insights:`, findError);
      // Continue anyway
    }
    
    // Prepare the insights record
    const insightsRecord = {
      user_id: userId,
      meeting_id: meetingId,
      insight_summary: insights.summary,
      action_items: insights.actionItems,
      decisions: insights.decisions
    };
    
    let operation;
    if (existingInsights) {
      // Update existing insights
      console.log(`[Generate Insights] Updating existing insights for meeting ${meetingId}`);
      operation = supabase
        .from('key_insights')
        .update(insightsRecord)
        .eq('id', existingInsights.id);
    } else {
      // Insert new insights
      console.log(`[Generate Insights] Creating new insights for meeting ${meetingId}`);
      operation = supabase
        .from('key_insights')
        .insert(insightsRecord);
    }
    
    const { error: saveError } = await operation;
    
    if (saveError) {
      console.error(`[Generate Insights] Error saving insights:`, saveError);
      throw new Error(`Failed to save insights: ${saveError.message}`);
    }
    
    console.log(`[Generate Insights] Successfully generated insights for meeting ${meetingId}`);
    
    return new Response(
      JSON.stringify({ success: true, insightsGenerated: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Generate Insights] Error generating insights:", error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Helper function to extract key insights from transcript text
function extractInsights(transcriptText) {
  console.log(`[Generate Insights] Extracting insights from transcript (first 200 chars): ${transcriptText.substring(0, 200)}`);
  
  // Simple rule-based extraction for now
  // In a real application, this would use more sophisticated NLP
  
  // Extract action items (lines containing "action item", "todo", "task", etc.)
  const actionItemRegex = /(?:action item|todo|task|to do|follow up|will do|should do).*?([^\.\n]+)/gi;
  const actionItems = [];
  let match;
  
  while ((match = actionItemRegex.exec(transcriptText)) !== null) {
    actionItems.push({
      text: match[0].trim(),
      assignee: extractAssignee(match[0])
    });
  }
  
  // Extract decisions (lines containing "decided", "decision", "agree", etc.)
  const decisionRegex = /(?:decided|decision|agree|conclusion|resolved|determined).*?([^\.\n]+)/gi;
  const decisions = [];
  
  while ((match = decisionRegex.exec(transcriptText)) !== null) {
    decisions.push({
      text: match[0].trim()
    });
  }
  
  // Generate a simple summary
  const lines = transcriptText.split('\n').filter(line => line.trim() !== '');
  const totalLines = lines.length;
  const summaryLines = Math.min(5, Math.ceil(totalLines * 0.1)); // 10% of lines or max 5
  
  // Very simplistic summary - take first few lines and last line
  const summary = [
    ...lines.slice(0, summaryLines),
    '...',
    lines[lines.length - 1]
  ].join('\n');
  
  return {
    summary,
    actionItems,
    decisions
  };
}

// Helper function to try to extract assignee from action item text
function extractAssignee(text) {
  // Look for patterns like "John will", "Mary to", etc.
  const assigneeRegex = /([A-Z][a-z]+)(?:\s+(?:will|to|should|is going to))/;
  const match = text.match(assigneeRegex);
  
  return match ? match[1] : null;
}
