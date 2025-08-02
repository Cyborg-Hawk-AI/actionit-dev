import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useRecallData } from './useRecallData';
import { 
  getMeetings, 
  getUserCalendars, 
  syncCalendars,
  updateMeetingSetting,
  type Meeting,
  type UserCalendar
} from '@/services/calendarService';
import { 
  getUserRecallCalendar,
  type JoinMode
} from '@/services/recallService';


export function useCalendarData() {
  const { user } = useAuth();
  const { joinMeeting, scheduleMeetingBot } = useRecallData();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [todayMeetings, setTodayMeetings] = useState<Meeting[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [calendars, setCalendars] = useState<UserCalendar[]>([]);
  const [recallCalendarId, setRecallCalendarId] = useState<string | null>(null);
  const [userSettings, setUserSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joiningMeetings, setJoiningMeetings] = useState<{[key: string]: boolean}>({});
  const [meetingJoinModes, setMeetingJoinModes] = useState<{[key: string]: JoinMode}>({});
  
  // Load data on component mount
  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [user]);
  
  useEffect(() => {
    if (meetings.length > 0) {
      organizeCalendarData(meetings);
    }
  }, [meetings]);
  
  // Organize calendar data into today and upcoming meetings
  const organizeCalendarData = (allMeetings: Meeting[]) => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    
    // Today's meetings - from now to end of day
    const todayMtgs = allMeetings.filter(meeting => {
      const meetingDate = new Date(meeting.start_time);
      return meetingDate >= now && meetingDate < tomorrow;
    }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    
    // Upcoming meetings - from tomorrow to 3 days later
    const upcomingMtgs = allMeetings.filter(meeting => {
      const meetingDate = new Date(meeting.start_time);
      return meetingDate >= tomorrow && meetingDate < threeDaysLater;
    }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    
    setTodayMeetings(todayMtgs);
    setUpcomingMeetings(upcomingMtgs);
  };
  

  
  const loadData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("[useCalendarData] Loading calendar data for user:", user.id);
      
      // First check for calendar connections
      const connectionsCheck = await fetch('https://vfsnygvfgtqwjwrwnseg.supabase.co/functions/v1/calendar-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmc255Z3ZmZ3Rxd2p3cnduc2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NzEyMzcsImV4cCI6MjA2MjE0NzIzN30.tkYMaq3lvT-qXDqSNLdU2uSr-Puwhzcg-a6Sq10CBNU`
        },
        body: JSON.stringify({ userId: user.id })
      });
      
      console.log("[useCalendarData] Calendar sync response status:", connectionsCheck.status);
      
      if (connectionsCheck.ok) {
        const syncResult = await connectionsCheck.json();
        console.log("[useCalendarData] Sync result:", syncResult);
        
        if (syncResult.meetings && syncResult.meetings.length > 0) {
          console.log("[useCalendarData] Setting meetings from sync:", syncResult.meetings.length);
          setMeetings(syncResult.meetings);
        }
        
        if (syncResult.calendars && syncResult.calendars.length > 0) {
          console.log("[useCalendarData] Setting calendars from sync:", syncResult.calendars.length);
          setCalendars(syncResult.calendars);
        }
      } else {
        console.warn("[useCalendarData] Calendar sync failed, falling back to direct queries");
      }
      
      // Get meetings - now returns empty array on error instead of throwing
      const fetchedMeetings = await getMeetings(user.id);
      console.log("[useCalendarData] Fetched meetings directly:", fetchedMeetings.length);
      if (fetchedMeetings.length > 0) {
        setMeetings(fetchedMeetings);
      }
      
      // Get user calendars - now returns empty array on error instead of throwing
      const fetchedCalendars = await getUserCalendars(user.id);
      console.log("[useCalendarData] Fetched calendars directly:", fetchedCalendars.length);
      if (fetchedCalendars.length > 0) {
        setCalendars(fetchedCalendars);
      }
      
      // Get user's Recall calendar
      try {
        const recallCalendar = await getUserRecallCalendar(user.id);
        if (recallCalendar) {
          console.log("[useCalendarData] Found existing Recall calendar:", recallCalendar.recall_calendar_id);
          setRecallCalendarId(recallCalendar.id); // Store the db ID, not the recall_calendar_id
        } else {
          console.log("[useCalendarData] No Recall calendar found for user");
          // Only show this toast if we have no meetings at all
          if (fetchedMeetings.length === 0) {
            toast({
              title: "Recall.ai Integration Not Set Up",
              description: "Bot joining functionality requires Recall.ai integration. Please check documentation for setup instructions.",
              duration: 6000
            });
          }
        }
      } catch (recallError) {
        console.warn("[useCalendarData] Error checking Recall calendar:", recallError);
        // Don't treat this as a fatal error
      }
      
      // If there are no meetings, but we have calendar connections, try syncing
      if (fetchedMeetings.length === 0 && fetchedCalendars.length === 0) {
        console.log("[useCalendarData] No data found, this suggests no calendar connections exist");
        toast({
          title: "No Calendar Connected",
          description: "Please connect your Google Calendar in Settings to see your meetings.",
          duration: 6000
        });
      }
    } catch (err) {
      console.error('[useCalendarData] Error loading calendar data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load calendar data';
      setError(errorMessage);
      toast({
        title: "Calendar Data Error",
        description: "There was a problem loading your calendar data. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const refreshData = async () => {
    
    if (!user) return;
    
    setIsSyncing(true);
    setError(null);
    
    try {
      console.log("[useCalendarData] Refreshing calendar data for user:", user.id);
      const result = await syncCalendars(user.id);
      
      console.log("[useCalendarData] Sync completed, setting data:", {
        meetings: result.meetings?.length || 0,
        calendars: result.calendars?.length || 0
      });
      
      // Directly update state with the data from sync
      if (result.meetings) setMeetings(result.meetings);
      if (result.calendars) setCalendars(result.calendars);
      
      toast({
        title: "Calendar Refreshed",
        description: `Found ${result.meetings?.length || 0} meetings and ${result.calendars?.length || 0} calendars.`,
        duration: 4000
      });
      
      return result;
    } catch (err) {
      console.error('[useCalendarData] Error syncing calendars:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync calendars';
      setError(errorMessage);
      toast({
        title: "Sync Failed",
        description: "There was a problem syncing your calendar data. Please check your calendar connection in Settings.",
        variant: "destructive"
      });
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Schedule a bot for a specific meeting
  const scheduleBotForMeeting = async (meetingId: string, joinMode: JoinMode = 'speaker_view') => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to schedule a meeting bot.",
        variant: "destructive"
      });
      return null;
    }
    
    if (!recallCalendarId) {
      toast({
        title: "Recall.ai Not Connected",
        description: "Please connect your Recall.ai integration in Settings first.",
        variant: "destructive"
      });
      return null;
    }
    
    try {
      const meeting = meetings.find(m => m.id === meetingId);
      
      if (!meeting) {
        toast({
          title: "Meeting Not Found",
          description: "The selected meeting could not be found.",
          variant: "destructive"
        });
        return null;
      }
      
      const recording = await scheduleMeetingBot(recallCalendarId, meeting, joinMode);
      if (recording) {
        // Update meetings list with scheduled status
        setMeetings(prevMeetings => 
          prevMeetings.map(m => 
            m.id === meetingId 
              ? { ...m, bot_scheduled: true }
              : m
          )
        );
      }
      
      return recording;
    } catch (err) {
      console.error('Error scheduling meeting bot:', err);
      toast({
        title: "Bot Scheduling Failed",
        description: "Failed to schedule bot for meeting. Please check your Recall.ai integration.",
        variant: "destructive"
      });
      return null;
    }
  };
  
  // Join a meeting now with bot
  const joinMeetingWithBot = async (meetingId: string, joinMode: JoinMode = 'speaker_view', openMeetingUrl: boolean = true) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to join a meeting.",
        variant: "destructive"
      });
      return null;
    }
    
    if (!recallCalendarId) {
      toast({
        title: "Recall.ai Not Connected",
        description: "Please set up your Recall.ai integration in Settings first. See the setup guide in documentation.",
        variant: "destructive"
      });
      window.open("/docs/recall-ai-integration-setup", "_blank");
      return null;
    }
    
    try {
      const meeting = meetings.find(m => m.id === meetingId);
      
      if (!meeting) {
        toast({
          title: "Meeting Not Found",
          description: "The selected meeting could not be found.",
          variant: "destructive"
        });
        console.error("Meeting not found", { meetingId, meetingsCount: meetings.length });
        return null;
      }
      
      // Set joining state
      setJoiningMeetings(prev => ({ ...prev, [meetingId]: true }));
      
      // Save the join mode
      setMeetingJoinModes(prev => ({ ...prev, [meetingId]: joinMode }));
      
      console.log("Joining meeting with bot", { 
        meetingId, 
        calendarId: recallCalendarId, 
        meeting: {
          id: meeting.id,
          title: meeting.title,
          meeting_url: meeting.meeting_url
        },
        joinMode,
        openMeetingUrl
      });
      
      // Join the meeting with the bot
      const recording = await joinMeeting(recallCalendarId, meeting, joinMode, openMeetingUrl);
      
      if (recording) {
        console.log("Bot successfully joined meeting", recording);
        
        // Update meetings list with joining status
        setMeetings(prevMeetings => 
          prevMeetings.map(m => 
            m.id === meetingId 
              ? { ...m, bot_joined: true }
              : m
          )
        );
        
        return recording;
      } else {
        console.error("joinMeeting returned null");
        toast({
          title: "Join Failed",
          description: "Failed to join meeting with bot. Check your Recall.ai integration.",
          variant: "destructive"
        });
        return null;
      }
    } catch (err) {
      console.error('Error joining meeting with bot:', err);
      toast({
        title: "Join Error",
        description: "Failed to join meeting with bot. See console for details.",
        variant: "destructive"
      });
      return null;
    } finally {
      // Clear joining state after a delay
      setTimeout(() => {
        setJoiningMeetings(prev => ({ ...prev, [meetingId]: false }));
      }, 3000);
    }
  };
  
  // Update meeting settings (auto join or auto record)
  const updateMeeting = async (meetingId: string, setting: 'auto_join' | 'auto_record', value: boolean) => {
    try {
      const updatedMeeting = await updateMeetingSetting(meetingId, setting, value);
      
      if (updatedMeeting) {
        // Update the meetings list with the updated meeting
        setMeetings(prev => prev.map(meeting => 
          meeting.id === meetingId ? updatedMeeting : meeting
        ));
        
        return updatedMeeting;
      }
      
      return null;
    } catch (err) {
      console.error(`Error updating meeting ${setting}:`, err);
      toast({
        title: "Update Failed",
        description: `Failed to update meeting ${setting === 'auto_join' ? 'auto join' : 'auto record'} setting`,
        variant: "destructive"
      });
      return null;
    }
  };
  
  return {
    meetings,
    todayMeetings,
    upcomingMeetings,
    calendars,
    recallCalendarId,
    userSettings,
    isLoading,
    isSyncing,
    joiningMeetings,
    meetingJoinModes,
    error,
    refreshData,
    loadData,
    scheduleBotForMeeting,
    joinMeetingWithBot,
    updateMeeting
  };
}
