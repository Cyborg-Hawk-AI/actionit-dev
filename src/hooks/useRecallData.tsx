
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  joinMeetingNow as joinMeetingService, 
  scheduleBot as scheduleMeetingBotService,
  createRecallCalendarFromGoogleAuth,
  getMeetingRecordings,
  getTotalMeetingsCount,
  type JoinMode 
} from '@/services/recallService';

export const useRecallData = () => {
  const { user } = useAuth();
  const [recentRecordings, setRecentRecordings] = useState<any[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [insightsStats, setInsightsStats] = useState<any>(null);
  const [latestMeetingSummary, setLatestMeetingSummary] = useState<any>(null);
  const [totalMeetings, setTotalMeetings] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch recent meetings from meetings table with transcripts
  const fetchRecentMeetings = async () => {
    if (!user?.id) {
      console.log('[useRecallData] No user ID, skipping recent meetings fetch');
      return;
    }

    try {
      console.log('[useRecallData] Fetching recent meetings for user:', user.id);
      
      // Get recent meetings with transcript information, ordered by most recent
      const { data: recentMeetings, error } = await supabase
        .from('meetings')
        .select(`
          id,
          title,
          start_time,
          end_time,
          transcripts!inner (
            meeting_summary,
            meeting_title
          )
        `)
        .eq('user_id', user.id)
        .not('transcripts.meeting_summary', 'is', null)
        .order('start_time', { ascending: false })
        .limit(5);

      if (error) {
        console.error('[useRecallData] Error fetching recent meetings:', error);
        setRecentRecordings([]);
        return;
      }

      console.log('[useRecallData] Raw recent meetings data:', recentMeetings);

      // Transform meetings data to match the expected format
      const transformedMeetings = recentMeetings?.map(meeting => {
        const transcript = meeting.transcripts[0];
        return {
          meetingId: meeting.id,
          title: transcript.meeting_title || meeting.title,
          date: meeting.start_time,
          duration: calculateDuration(meeting.start_time, meeting.end_time),
          hasTranscript: true,
          hasInsights: true,
          meeting_summary: transcript.meeting_summary,
          summary: transcript.meeting_summary
        };
      }) || [];

      console.log('[useRecallData] Transformed recent meetings:', transformedMeetings);
      setRecentRecordings(transformedMeetings);
    } catch (error) {
      console.error('[useRecallData] Error in fetchRecentMeetings:', error);
      setRecentRecordings([]);
    }
  };

  // Fetch recordings from meeting_recordings table (for RecallSettings)
  const fetchRecordings = async () => {
    if (!user?.id) {
      console.log('[useRecallData] No user ID, skipping recordings fetch');
      return;
    }

    try {
      console.log('[useRecallData] Fetching recordings for user:', user.id);
      const recordingsData = await getMeetingRecordings(user.id);
      console.log('[useRecallData] Recordings data:', recordingsData);
      setRecordings(recordingsData);
    } catch (error) {
      console.error('[useRecallData] Error fetching recordings:', error);
      setRecordings([]);
    }
  };

  // Fetch total meetings count
  const fetchTotalMeetings = async () => {
    if (!user?.id) {
      console.log('[useRecallData] No user ID, skipping total meetings fetch');
      return;
    }

    try {
      console.log('[useRecallData] Fetching total meetings for user:', user.id);
      const count = await getTotalMeetingsCount(user.id);
      console.log('[useRecallData] Total meetings count:', count);
      setTotalMeetings(count);
    } catch (error) {
      console.error('[useRecallData] Error fetching total meetings:', error);
      setTotalMeetings(0);
    }
  };

  // Helper function to calculate meeting duration
  const calculateDuration = (startTime: string | null, endTime: string | null): string => {
    if (!startTime || !endTime) return 'Duration unknown';
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins} min`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
  };

  // Fetch insights stats
  const fetchInsightsStats = async () => {
    if (!user?.id) {
      console.log('[useRecallData] No user ID, skipping insights stats fetch');
      return;
    }

    try {
      console.log('[useRecallData] Fetching insights stats for user:', user.id);
      
      const { data: insights, error } = await supabase
        .from('key_insights')
        .select('action_items, decisions')
        .eq('user_id', user.id);

      if (error) {
        console.error('[useRecallData] Error fetching insights stats:', error);
        setInsightsStats({
          insightsCount: 0,
          actionsCount: 0,
          decisionsCount: 0,
          previousWeekChange: 0
        });
        return;
      }

      console.log('[useRecallData] Raw insights data:', insights);

      let totalActions = 0;
      let totalDecisions = 0;

      insights?.forEach(insight => {
        if (insight.action_items) {
          totalActions += Array.isArray(insight.action_items) ? insight.action_items.length : 0;
        }
        if (insight.decisions) {
          totalDecisions += Array.isArray(insight.decisions) ? insight.decisions.length : 0;
        }
      });

      const statsData = {
        insightsCount: insights?.length || 0,
        actionsCount: totalActions,
        decisionsCount: totalDecisions,
        previousWeekChange: 0 // Could be calculated with more complex logic
      };

      console.log('[useRecallData] Processed insights stats:', statsData);
      setInsightsStats(statsData);
    } catch (error) {
      console.error('[useRecallData] Error in fetchInsightsStats:', error);
      setInsightsStats({
        insightsCount: 0,
        actionsCount: 0,
        decisionsCount: 0,
        previousWeekChange: 0
      });
    }
  };

  // Fetch latest meeting summary
  const fetchLatestMeetingSummary = async () => {
    if (!user?.id) {
      console.log('[useRecallData] No user ID, skipping latest meeting summary fetch');
      return;
    }

    try {
      console.log('[useRecallData] Fetching latest meeting summary for user:', user.id);
      
      const { data: latestTranscript, error } = await supabase
        .from('transcripts')
        .select(`
          meeting_id,
          meeting_title,
          meeting_summary,
          created_at
        `)
        .eq('user_id', user.id)
        .not('meeting_summary', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[useRecallData] Error fetching latest meeting summary:', error);
        setLatestMeetingSummary(null);
        return;
      }

      console.log('[useRecallData] Latest transcript data:', latestTranscript);

      if (latestTranscript) {
        const summaryData = {
          title: latestTranscript.meeting_title || 'Recent Meeting',
          summary: latestTranscript.meeting_summary,
          date: latestTranscript.created_at,
          meetingId: latestTranscript.meeting_id
        };
        console.log('[useRecallData] Setting latest meeting summary:', summaryData);
        setLatestMeetingSummary(summaryData);
      } else {
        console.log('[useRecallData] No latest meeting summary found');
        setLatestMeetingSummary(null);
      }
    } catch (error) {
      console.error('[useRecallData] Error in fetchLatestMeetingSummary:', error);
      setLatestMeetingSummary(null);
    }
  };

  // Main data fetching function
  const fetchAllData = async () => {
    if (!user?.id) {
      console.log('[useRecallData] No user ID, skipping all data fetch');
      return;
    }

    console.log('[useRecallData] Starting data fetch for user:', user.id);
    setIsLoading(true);

    try {
      // Fetch all data in parallel
      await Promise.all([
        fetchRecentMeetings(),
        fetchRecordings(),
        fetchInsightsStats(),
        fetchLatestMeetingSummary(),
        fetchTotalMeetings()
      ]);
      
      console.log('[useRecallData] All data fetching completed');
    } catch (error) {
      console.error('[useRecallData] Error in fetchAllData:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Join meeting function
  const joinMeeting = async (calendarId: string, meeting: any, joinMode: JoinMode = 'audio_only', openMeetingUrl: boolean = true) => {
    try {
      const result = await joinMeetingService({
        userId: user?.id || '',
        calendarId,
        meetingId: meeting.id,
        meetingUrl: meeting.meeting_url,
        meetingTitle: meeting.title,
        joinMode
      });
      
      if (openMeetingUrl && meeting.meeting_url) {
        window.open(meeting.meeting_url, '_blank');
      }
      
      return result;
    } catch (error) {
      console.error('[useRecallData] Error joining meeting:', error);
      throw error;
    }
  };

  // Schedule meeting bot function
  const scheduleMeetingBot = async (calendarId: string, meeting: any, joinMode: JoinMode = 'audio_only') => {
    try {
      return await scheduleMeetingBotService({
        userId: user?.id || '',
        calendarId,
        meetingId: meeting.id,
        meetingUrl: meeting.meeting_url,
        meetingTitle: meeting.title,
        joinAt: meeting.start_time,
        joinMode
      });
    } catch (error) {
      console.error('[useRecallData] Error scheduling meeting bot:', error);
      throw error;
    }
  };

  // Join meeting with bot function - FIXED VERSION
  const joinMeetingWithBot = async (meetingId: string, joinMode: JoinMode = 'audio_only') => {
    try {
      console.log('[useRecallData] joinMeetingWithBot called with:', { meetingId, joinMode });
      
      if (!user?.id) {
        console.error('[useRecallData] No user ID available');
        throw new Error('User not authenticated');
      }

      // First, fetch the meeting details from the database
      console.log('[useRecallData] Fetching meeting details for ID:', meetingId);
      const { data: meeting, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', meetingId)
        .single();

      if (error) {
        console.error('[useRecallData] Error fetching meeting:', error);
        throw new Error(`Failed to fetch meeting details: ${error.message}`);
      }

      if (!meeting) {
        console.error('[useRecallData] Meeting not found:', meetingId);
        throw new Error('Meeting not found');
      }

      if (!meeting.meeting_url) {
        console.error('[useRecallData] Meeting has no URL:', meeting);
        throw new Error('Meeting URL is missing');
      }

      console.log('[useRecallData] Meeting details retrieved:', {
        id: meeting.id,
        title: meeting.title,
        meeting_url: meeting.meeting_url
      });

      // Now join with the bot using the complete meeting details
      const result = await joinMeetingService({
        userId: user.id,
        calendarId: '', // Not needed for direct bot joining
        meetingId: meeting.id,
        meetingUrl: meeting.meeting_url,
        meetingTitle: meeting.title,
        joinMode
      });

      console.log('[useRecallData] Bot join result:', result);
      return result;
    } catch (error) {
      console.error('[useRecallData] Error joining meeting with bot:', error);
      throw error;
    }
  };

  // Create Recall calendar from Google auth
  const createRecallCalendarFromGoogle = async (userId: string) => {
    try {
      return await createRecallCalendarFromGoogleAuth(userId);
    } catch (error) {
      console.error('[useRecallData] Error creating Recall calendar from Google:', error);
      throw error;
    }
  };

  // Initial data load effect
  useEffect(() => {
    console.log('[useRecallData] useEffect triggered, user ID:', user?.id);
    if (user?.id) {
      fetchAllData();
    }
  }, [user?.id]);

  // Refresh function for external use
  const refreshData = () => {
    console.log('[useRecallData] Manual refresh triggered');
    if (user?.id) {
      fetchAllData();
    }
  };

  return {
    recentRecordings,
    recordings,
    insightsStats,
    latestMeetingSummary,
    totalMeetings,
    isLoading,
    joinMeeting,
    scheduleMeetingBot,
    joinMeetingWithBot,
    createRecallCalendarFromGoogle,
    refreshData
  };
};
