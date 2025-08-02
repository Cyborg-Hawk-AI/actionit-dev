import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";

// API base URL - updated to match the correct endpoint format 
export const RECALL_API_BASE_URL = "https://us-west-2.recall.ai";

// Interfaces for working with Recall.ai
export interface RecallCalendar {
  id: string;
  user_id: string;
  recall_calendar_id: string;
  platform: string;
  created_at: string;
  updated_at: string;
}

export interface MeetingRecording {
  id: string;
  user_id: string;
  meeting_id: string;
  bot_id: string;
  status: string; // Changed from specific literals to accept any string from the database
  join_time?: string;
  leave_time?: string;
  recording_url?: string;
  meeting_title?: string;
  created_at: string;
  updated_at: string;
}

export interface Transcript {
  id: string;
  user_id: string;
  meeting_id: string;
  bot_id: string;
  transcript_text?: string;
  speakers?: any;
  timestamps?: any;
  raw_transcript?: any;
  parsed_transcript?: any;
  actionit_summary?: any;
  created_at: string;
  updated_at: string;
}

export interface KeyInsight {
  id: string;
  user_id: string;
  meeting_id: string;
  insight_summary?: string;
  action_items: any; // Changed from any[] to any to accept any JSON value from the database
  decisions: any; // Changed from any[] to any to accept any JSON value from the database
  actionit_summary?: any;
  created_at: string;
  updated_at: string;
}

export type JoinMode = 'audio_only' | 'speaker_view';

interface CreateCalendarParams {
  userId: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

interface ScheduleBotParams {
  userId: string;
  calendarId: string; // We'll keep this parameter for compatibility but won't use it
  meetingId: string;
  meetingUrl: string;
  meetingTitle: string;
  joinAt: string; // ISO string
  botName?: string;
  enableRecording?: boolean;
  joinMode?: JoinMode;
  deduplicationKey?: string;
}

interface JoinMeetingNowParams {
  userId: string;
  calendarId: string; // We'll keep this parameter for compatibility but won't use it
  meetingId: string;
  meetingUrl: string;
  meetingTitle: string;
  botName?: string;
  joinMode?: JoinMode;
}

interface StartRecordingParams {
  botId: string;
  recordingMode?: 'speaker_view' | 'audio_only' | null;
  transcriptionProvider?: 'meeting_captions' | null;
}

interface TranscriptResponse {
  id: string;
  transcript: {
    monologue: {
      speaker: {
        name: string;
        id: string;
      };
      messages: {
        text: string;
        start_timestamp: number;
        end_timestamp: number;
      }[];
    }[];
  };
}

// Create a calendar in Recall.ai
export async function createRecallCalendar({
  userId,
  clientId,
  clientSecret,
  refreshToken
}: CreateCalendarParams): Promise<RecallCalendar | null> {
  try {
    console.log("[Recall Service] Creating calendar for user:", userId);
    
    // Make API call through edge function to avoid exposing API key in frontend
    const { data, error } = await supabase.functions.invoke('recall-api', {
      body: {
        action: 'create-calendar',
        userId,
        clientId,
        clientSecret,
        refreshToken,
        platform: 'google_calendar'
      }
    });
    
    if (error) {
      console.error("[Recall Service] Error creating calendar:", error);
      throw error;
    }
    
    console.log("[Recall Service] Calendar created successfully:", data);
    return data.calendar;
  } catch (error) {
    console.error('[Recall Service] Error creating Recall calendar:', error);
    toast.error("Failed to create Recall calendar. Please try again later.");
    return null;
  }
}

// Create a calendar in Recall.ai from an existing Google Calendar connection
export async function createRecallCalendarFromGoogleAuth(userId: string): Promise<{ calendar: RecallCalendar, googleCalendar: any } | null> {
  try {
    console.log("[Recall Service] Creating Recall calendar for user from Google Auth:", userId);
    console.log("[Recall Service] Step 1: Preparing to invoke edge function");
    
    // Make API call through edge function to create a Recall calendar from Google Auth
    const startTime = Date.now();
    console.log("[Recall Service] Step 2: Invoking edge function 'recall-api'");
    console.log("[Recall Service] API base URL being used:", RECALL_API_BASE_URL);
    
    const { data, error } = await supabase.functions.invoke('recall-api', {
      body: {
        action: 'create-calendar-from-google-auth',
        userId
      }
    });
    
    const endTime = Date.now();
    console.log(`[Recall Service] Step 3: Edge function responded in ${endTime - startTime}ms`);
    
    if (error) {
      console.error("[Recall Service] Step 4: Error invoking edge function:", error);
      console.error("[Recall Service] Error details:", JSON.stringify(error));
      throw new Error(`Failed to create Recall calendar: ${error.message}`);
    }
    
    if (!data) {
      console.error("[Recall Service] Step 4: No data returned from API");
      throw new Error("No data returned from API");
    }
    
    console.log("[Recall Service] Step 4: Checking response from edge function:", 
      JSON.stringify(data).substring(0, 500));
    
    if (data.error) {
      console.error("[Recall Service] Step 5: Error from Recall API:", data.error);
      
      // Extract more detailed error information if available
      let errorDetails = data.error;
      if (data.details) {
        errorDetails += `: ${typeof data.details === 'string' ? data.details : JSON.stringify(data.details)}`;
      }
      
      throw new Error(errorDetails);
    }
    
    console.log("[Recall Service] Step 5: Calendar created successfully from Google Auth:", 
      data.calendar ? `Calendar ID: ${data.calendar.id}` : "No calendar data");
    return data;
  } catch (error) {
    console.error('[Recall Service] Error creating Recall calendar from Google Auth:', error);
    console.error('[Recall Service] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }
}

// Get user's Recall calendar
export async function getUserRecallCalendar(userId: string): Promise<RecallCalendar | null> {
  try {
    console.log("[Recall Service] Fetching calendar for user:", userId);
    
    const { data, error } = await supabase
      .from('recall_calendars')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error("[Recall Service] Error fetching calendar:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('[Recall Service] Error getting Recall calendar:', error);
    return null;
  }
}

// Schedule a bot to join a meeting
export async function scheduleBot({
  userId,
  calendarId: string, // We'll keep this parameter for compatibility but won't use it
  meetingId,
  meetingUrl,
  meetingTitle,
  joinAt,
  botName = 'Action.IT',
  enableRecording = true,
  joinMode = 'speaker_view',
  deduplicationKey
}: ScheduleBotParams): Promise<MeetingRecording | null> {
  try {
    console.log(`[Recall Service] Scheduling bot for meeting: ${meetingTitle} (${meetingId})`);
    
    // Generate a deduplication key if not provided
    if (!deduplicationKey) {
      deduplicationKey = `meeting-${meetingId}-${new Date(joinAt).toISOString()}`;
    }
    
    // Make API call through edge function to avoid exposing API key in frontend
    const { data, error } = await supabase.functions.invoke('recall-api', {
      body: {
        action: 'schedule-bot',
        userId,
        calendarId: string, // We'll keep this parameter for compatibility but won't use it
        meetingId,
        meetingUrl,
        meetingTitle,
        joinAt,
        botName,
        botConfig: {
          transcription_options: { provider: "meeting_captions" }, // Always enable transcription
          recording_mode: joinMode // Use the specified join mode
        },
        deduplicationKey
      }
    });
    
    if (error) {
      console.error("[Recall Service] Error scheduling bot:", error);
      throw error;
    }
    
    console.log("[Recall Service] Bot scheduled successfully:", data);
    return data.recording;
  } catch (error) {
    console.error('[Recall Service] Error scheduling bot:', error);
    toast.error("Failed to schedule recording bot. Please try again later.");
    return null;
  }
}

// Join a meeting immediately with a bot - updated to match new API format with audio_only default
export async function joinMeetingNow({
  userId,
  calendarId,
  meetingId,
  meetingUrl,
  meetingTitle,
  botName = 'Action.IT',
  joinMode = 'audio_only' // Default set to audio_only
}: JoinMeetingNowParams): Promise<MeetingRecording | null> {
  try {
    console.log(`[Recall Service] Joining meeting now: ${meetingTitle} (${meetingId})`);
    console.log(`[Recall Service] Meeting URL: ${meetingUrl}`);
    console.log(`[Recall Service] Join mode: ${joinMode}`);
    
    if (!meetingUrl) {
      toast.error("No meeting URL found for this meeting");
      console.error("Missing meeting_url for meeting", { meetingId, meetingTitle });
      return null;
    }
    
    // Make API call through edge function to join immediately using direct bot creation
    const { data, error } = await supabase.functions.invoke('recall-api', {
      body: {
        action: 'join-meeting-now',
        userId,
        meetingId,
        meetingUrl,
        meetingTitle,
        botName,
        joinMode,
        // Add more debugging info
        debug: {
          apiBaseUrl: RECALL_API_BASE_URL,
          timestamp: new Date().toISOString()
        }
      }
    });
    
    if (error) {
      console.error("[Recall Service] Error joining meeting now:", error);
      throw error;
    }
    
    if (!data || !data.recording) {
      console.error("[Recall Service] No recording data returned:", data);
      throw new Error("No recording data returned from API");
    }
    
    console.log("[Recall Service] Bot joining meeting now:", data);
    return data.recording;
  } catch (error) {
    console.error('[Recall Service] Error joining meeting now:', error);
    const errorMessage = error instanceof Error ? 
      `Failed to join meeting: ${error.message}` : 
      "Failed to join meeting with recording bot";
      
    toast.error(errorMessage);
    return null;
  }
}

// Start recording for a bot that has already joined
export async function startRecording({
  botId,
  recordingMode = 'speaker_view',
  transcriptionProvider = 'meeting_captions'
}: StartRecordingParams): Promise<boolean> {
  try {
    console.log(`[Recall Service] Starting recording for bot: ${botId}`);
    
    const { data, error } = await supabase.functions.invoke('recall-api', {
      body: {
        action: 'start-recording',
        botId,
        recordingMode,
        transcriptionProvider
      }
    });
    
    if (error) {
      console.error("[Recall Service] Error starting recording:", error);
      throw error;
    }
    
    console.log("[Recall Service] Recording started successfully");
    return true;
  } catch (error) {
    console.error('[Recall Service] Error starting recording:', error);
    toast.error("Failed to start recording. Please try again later.");
    return false;
  }
}

// Get meeting recordings for a user
export async function getMeetingRecordings(userId: string): Promise<MeetingRecording[]> {
  try {
    console.log("[Recall Service] Fetching recordings for user:", userId);
    
    const { data, error } = await supabase
      .from('meeting_recordings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("[Recall Service] Error fetching recordings:", error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('[Recall Service] Error getting meeting recordings:', error);
    return [];
  }
}

// Get meeting recording by meeting ID
export async function getMeetingRecordingByMeetingId(meetingId: string): Promise<MeetingRecording | null> {
  try {
    console.log("[Recall Service] Fetching recording for meeting:", meetingId);
    
    const { data, error } = await supabase
      .from('meeting_recordings')
      .select('*')
      .eq('meeting_id', meetingId)
      .maybeSingle();
    
    if (error) {
      console.error("[Recall Service] Error fetching recording:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('[Recall Service] Error getting meeting recording:', error);
    return null;
  }
}

// Get transcript for a meeting
export async function getTranscript(botId: string, userId: string, meetingId: string): Promise<Transcript | null> {
  try {
    console.log("[Recall Service] Fetching transcript for bot:", botId);
    
    // First check if we already have the transcript in our database
    const { data: existingTranscript, error: fetchError } = await supabase
      .from('transcripts')
      .select('*')
      .eq('bot_id', botId)
      .eq('meeting_id', meetingId)
      .maybeSingle();
    
    if (fetchError) {
      console.error("[Recall Service] Error fetching transcript from DB:", fetchError);
      // Continue to try the API even if DB fetch failed
    }
    
    // If we have the transcript in our database, return it
    if (existingTranscript?.transcript_text) {
      console.log("[Recall Service] Found transcript in database");
      return existingTranscript;
    }
    
    // Otherwise, fetch from Recall API and store it
    const { data, error } = await supabase.functions.invoke('recall-api', {
      body: {
        action: 'get-transcript',
        botId,
        userId,
        meetingId
      }
    });
    
    if (error) {
      console.error("[Recall Service] Error fetching transcript from API:", error);
      throw error;
    }
    
    console.log("[Recall Service] Transcript fetched and stored successfully");
    return data.transcript;
  } catch (error) {
    console.error('[Recall Service] Error getting transcript:', error);
    toast.error("Failed to retrieve meeting transcript. Please try again later.");
    return null;
  }
}

// Get key insights for a meeting
export async function getKeyInsights(meetingId: string): Promise<KeyInsight | null> {
  try {
    console.log("[Recall Service] Fetching insights for meeting:", meetingId);
    
    const { data, error } = await supabase
      .from('key_insights')
      .select('*')
      .eq('meeting_id', meetingId)
      .maybeSingle();
    
    if (error) {
      console.error("[Recall Service] Error fetching insights:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('[Recall Service] Error getting key insights:', error);
    return null;
  }
}

// Get user settings
export async function getUserSettings(userId: string): Promise<any | null> {
  try {
    console.log("[Recall Service] Fetching settings for user:", userId);
    
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error("[Recall Service] Error fetching settings:", error);
      throw error;
    }
    
    // If no settings found, create default settings
    if (!data) {
      console.log("[Recall Service] Creating default settings for user:", userId);
      
      const defaultSettings = {
        user_id: userId,
        auto_join_enabled: false,
        auto_record_enabled: false,
        bot_name: 'Action.IT',
        default_bot_join_method: 'audio_only'
      };
      
      const { data: newSettings, error: insertError } = await supabase
        .from('user_settings')
        .insert(defaultSettings)
        .select()
        .single();
        
      if (insertError) {
        console.error("[Recall Service] Error creating default settings:", insertError);
        throw insertError;
      }
      
      return newSettings;
    }
    
    return data;
  } catch (error) {
    console.error('[Recall Service] Error getting user settings:', error);
    return null;
  }
}

// Update user settings
export async function updateUserSettings(userId: string, settings: any): Promise<any | null> {
  try {
    console.log("[Recall Service] Updating settings for user:", userId);
    
    const { data, error } = await supabase
      .from('user_settings')
      .update(settings)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      console.error("[Recall Service] Error updating settings:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('[Recall Service] Error updating user settings:', error);
    toast.error("Failed to update settings. Please try again later.");
    return null;
  }
}

// Update user bot settings
export async function updateUserBotSettings(userId: string, settings: {
  join_mode?: 'auto' | 'manual' | 'disabled',
  default_bot_join_method?: JoinMode,
  selected_calendars?: string[]
}): Promise<any | null> {
  try {
    console.log("[Recall Service] Updating bot settings for user:", userId);
    
    // First get current settings
    const currentSettings = await getUserSettings(userId);
    
    if (!currentSettings) {
      console.error("[Recall Service] No settings found for user:", userId);
      return null;
    }
    
    // Ensure default_bot_join_method is set to audio_only if not specified
    if (!settings.default_bot_join_method) {
      settings.default_bot_join_method = 'audio_only';
    }
    
    // Update settings
    const updatedSettings = {
      ...currentSettings,
      auto_join_enabled: settings.join_mode === 'auto',
      default_bot_join_method: settings.default_bot_join_method,
      ...settings
    };
    
    const { data, error } = await supabase
      .from('user_settings')
      .update(updatedSettings)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      console.error("[Recall Service] Error updating bot settings:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('[Recall Service] Error updating user bot settings:', error);
    toast.error("Failed to update bot settings. Please try again later.");
    return null;
  }
}

// Get total meeting count for dashboard
export async function getTotalMeetingsCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('meeting_recordings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (error) {
      console.error("[Recall Service] Error counting recordings:", error);
      throw error;
    }
    
    return count || 0;
  } catch (error) {
    console.error('[Recall Service] Error getting meeting count:', error);
    return 0;
  }
}

// Get weekly insights stats
export async function getWeeklyInsightsStats(userId: string): Promise<{
  insightsCount: number;
  actionsCount: number;
  decisionsCount: number;
  previousWeekChange: number;
}> {
  try {
    // Get insights from current week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const { data: currentWeekInsights, error } = await supabase
      .from('key_insights')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', oneWeekAgo.toISOString());
      
    if (error) {
      console.error("[Recall Service] Error fetching insights:", error);
      throw error;
    }
    
    // Get insights from previous week for comparison
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const { data: previousWeekInsights, error: prevError } = await supabase
      .from('key_insights')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', twoWeeksAgo.toISOString())
      .lt('created_at', oneWeekAgo.toISOString());
      
    if (prevError) {
      console.error("[Recall Service] Error fetching previous insights:", prevError);
      // Continue with partial data
    }
    
    // Calculate stats
    const currentWeekCount = currentWeekInsights?.length || 0;
    const previousWeekCount = previousWeekInsights?.length || 0;
    
    // Calculate percentage change
    let percentChange = 0;
    if (previousWeekCount > 0) {
      percentChange = ((currentWeekCount - previousWeekCount) / previousWeekCount) * 100;
    } else if (currentWeekCount > 0) {
      percentChange = 100; // If no previous data but we have current data, that's a 100% increase
    }
    
    // Count total actions and decisions
    let actionsCount = 0;
    let decisionsCount = 0;
    
    currentWeekInsights?.forEach(insight => {
      if (insight.action_items && Array.isArray(insight.action_items)) {
        actionsCount += insight.action_items.length;
      }
      if (insight.decisions && Array.isArray(insight.decisions)) {
        decisionsCount += insight.decisions.length;
      }
    });
    
    return {
      insightsCount: currentWeekCount,
      actionsCount,
      decisionsCount,
      previousWeekChange: Math.round(percentChange)
    };
  } catch (error) {
    console.error('[Recall Service] Error getting insights stats:', error);
    return {
      insightsCount: 0,
      actionsCount: 0,
      decisionsCount: 0,
      previousWeekChange: 0
    };
  }
}

// Get recent recordings with transcripts
export async function getRecentRecordings(userId: string, limit: number = 3): Promise<any[]> {
  try {
    console.log("[Recall Service] Fetching recent recordings for user:", userId);
    
    // Get meeting recordings WITHOUT trying to join with transcripts
    // This avoids the foreign key relationship error
    const { data, error } = await supabase
      .from('meeting_recordings')
      .select(`
        *,
        meetings(id, title, start_time, end_time, description, platform, meeting_url)
      `)
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error("[Recall Service] Error fetching recent recordings:", error);
      throw error;
    }

    // For each recording, separately check if there are transcripts
    const enhancedData = await Promise.all((data || []).map(async (recording) => {
      // Check if transcript exists for this recording
      const { count: transcriptCount } = await supabase
        .from('transcripts')
        .select('*', { count: 'exact', head: true })
        .eq('bot_id', recording.bot_id);
      
      // Check if insights exist for this recording
      const { count: insightsCount } = await supabase
        .from('key_insights')
        .select('*', { count: 'exact', head: true })
        .eq('meeting_id', recording.meeting_id);

      // Calculate duration if join_time and leave_time exist
      let duration = '';
      if (recording.join_time && recording.leave_time) {
        const joinTime = new Date(recording.join_time);
        const leaveTime = new Date(recording.leave_time);
        const durationMs = leaveTime.getTime() - joinTime.getTime();
        const durationMins = Math.round(durationMs / (1000 * 60));
        duration = `${durationMins} min`;
      }
      
      return {
        ...recording,
        title: recording.meetings?.title || 'Untitled Meeting',
        date: recording.meetings?.start_time || recording.created_at,
        duration,
        hasTranscript: transcriptCount > 0,
        hasInsights: insightsCount > 0
      };
    }));
    
    return enhancedData || [];
  } catch (error) {
    console.error('[Recall Service] Error getting recent recordings:', error);
    return [];
  }
}

export const getLatestMeetingSummary = async (userId: string): Promise<{
  title: string;
  summary: string;
  date: string;
  meetingId: string;
} | null> => {
  try {
    console.log("[getLatestMeetingSummary] Fetching latest meeting summary for user:", userId);
    
    // Get the most recent meeting with a transcript and summary
    const { data: latestMeeting, error: meetingError } = await supabase
      .from('meetings')
      .select(`
        id,
        title,
        start_time,
        transcripts!inner (
          meeting_summary,
          meeting_title
        )
      `)
      .eq('user_id', userId)
      .not('transcripts.meeting_summary', 'is', null)
      .order('start_time', { ascending: false })
      .limit(1)
      .single();

    if (meetingError) {
      if (meetingError.code === 'PGRST116') {
        // No meetings found with summaries
        console.log("[getLatestMeetingSummary] No meetings with summaries found");
        return null;
      }
      throw meetingError;
    }

    if (!latestMeeting || !latestMeeting.transcripts || latestMeeting.transcripts.length === 0) {
      console.log("[getLatestMeetingSummary] No meeting summary found");
      return null;
    }

    const transcript = latestMeeting.transcripts[0];
    
    return {
      title: transcript.meeting_title || latestMeeting.title,
      summary: transcript.meeting_summary || '',
      date: latestMeeting.start_time,
      meetingId: latestMeeting.id
    };
  } catch (error) {
    console.error("[getLatestMeetingSummary] Error fetching latest meeting summary:", error);
    return null;
  }
};
