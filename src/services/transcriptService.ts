
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface TranscriptAnalysis {
  summary: string;
  key_points: string[];
  action_items: string[];
  decisions: string[];
  follow_ups: string[];
}

export async function processTranscript(transcriptId: string): Promise<boolean> {
  try {
    console.log(`[Transcript Service] Triggering processing for transcript: ${transcriptId}`);
    
    const { data, error } = await supabase.functions.invoke('process-transcripts', {
      body: { transcriptId }
    });
    
    if (error) {
      console.error(`[Transcript Service] Error processing transcript: ${error.message}`);
      toast({
        title: "Processing Failed",
        description: "Failed to process transcript. Please try again later.",
        variant: "destructive"
      });
      return false;
    }
    
    console.log(`[Transcript Service] Successfully triggered transcript processing: ${JSON.stringify(data)}`);
    toast({
      title: "Processing Started",
      description: "Transcript processing has been initiated. This may take a few moments.",
    });
    return true;
  } catch (error) {
    console.error('[Transcript Service] Error in processTranscript:', error);
    toast({
      title: "Processing Failed",
      description: "An unexpected error occurred. Please try again later.",
      variant: "destructive"
    });
    return false;
  }
}

export async function getTranscriptAnalysis(transcriptId: string): Promise<TranscriptAnalysis | null> {
  try {
    console.log(`[Transcript Service] Fetching analysis for transcript: ${transcriptId}`);
    
    // Use maybeSingle instead of single to handle the case where no data is found
    const { data, error } = await supabase
      .from('transcripts')
      .select('open_ai_analysis, transcript_text, recall_transcript_id')
      .eq('id', transcriptId)
      .maybeSingle();
    
    if (error) {
      console.error(`[Transcript Service] Error fetching transcript analysis: ${error.message}`);
      return null;
    }
    
    if (!data) {
      console.log(`[Transcript Service] No transcript found with ID: ${transcriptId}`);
      return null;
    }
    
    console.log(`[Transcript Service] Found transcript with recall_transcript_id: ${data.recall_transcript_id || 'Not available'}`);
    
    if (!data.open_ai_analysis) {
      console.log(`[Transcript Service] No analysis found for transcript. Text length: ${data.transcript_text?.length || 0} characters`);
      // If there's no analysis yet but we have transcript text, we can trigger processing
      if (data.transcript_text && data.transcript_text.length > 0) {
        await processTranscript(transcriptId);
      }
      return null;
    }
    
    // Add proper type casting with validation to ensure type safety
    const analysis = data.open_ai_analysis as any;
    
    // Validate that the returned data matches our expected structure
    const isValidAnalysis = analysis && 
      typeof analysis === 'object' &&
      ('summary' in analysis) &&
      ('key_points' in analysis) &&
      ('action_items' in analysis) &&
      ('decisions' in analysis) &&
      ('follow_ups' in analysis);
    
    if (!isValidAnalysis) {
      console.warn('[Transcript Service] Analysis data does not match expected TranscriptAnalysis structure:', analysis);
      
      // Return a properly structured object with default values if the data doesn't match
      return {
        summary: typeof analysis?.summary === 'string' ? analysis.summary : 'No summary available',
        key_points: Array.isArray(analysis?.key_points) ? analysis.key_points : [],
        action_items: Array.isArray(analysis?.action_items) ? analysis.action_items : [],
        decisions: Array.isArray(analysis?.decisions) ? analysis.decisions : [],
        follow_ups: Array.isArray(analysis?.follow_ups) ? analysis.follow_ups : []
      };
    }
    
    return analysis as TranscriptAnalysis;
  } catch (error) {
    console.error('[Transcript Service] Error in getTranscriptAnalysis:', error);
    toast({
      title: "Error",
      description: "Failed to load transcript analysis. Please try again later.",
      variant: "destructive"
    });
    return null;
  }
}
