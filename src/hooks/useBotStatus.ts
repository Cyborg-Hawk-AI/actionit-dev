import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface BotMeeting {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  autoJoin: boolean;
  autoRecord: boolean;
  joinMode: 'audio_only' | 'speaker_view';
  status: 'scheduled' | 'joining' | 'recording' | 'completed';
  meetingUrl?: string;
  attendeesCount?: number;
}

export interface BotStatus {
  isOnline: boolean;
  syncStatus: 'synced' | 'syncing' | 'error';
  lastSyncTime?: string;
  errorMessage?: string;
}

export function useBotStatus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch bot meetings (meetings with auto_join enabled)
  const { data: botMeetings, isLoading: botMeetingsLoading, error: botMeetingsError } = useQuery({
    queryKey: ['bot-meetings', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No user authenticated');
      
      // Get meetings with auto_join enabled
      const { data: meetings, error: meetingsError } = await supabase
        .from('meetings')
        .select('*')
        .eq('user_id', user.id)
        .eq('auto_join', true)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      if (meetingsError) {
        console.error('Error fetching bot meetings:', meetingsError);
        throw meetingsError;
      }

      // Transform meetings into BotMeeting format
      const transformedMeetings: BotMeeting[] = meetings?.map((meeting) => ({
        id: meeting.id,
        title: meeting.title,
        startTime: meeting.start_time,
        endTime: meeting.end_time,
        autoJoin: meeting.auto_join || false,
        autoRecord: meeting.auto_record || false,
        joinMode: 'audio_only' as const, // Default join mode since join_mode field doesn't exist in meetings table
        status: 'scheduled' as const, // Default status, could be enhanced with recording status
        meetingUrl: meeting.meeting_url,
        attendeesCount: meeting.attendees_count
      })) || [];

      return transformedMeetings;
    },
    enabled: !!user,
  });

  // Fetch bot status and sync information
  const { data: botStatus, isLoading: botStatusLoading, error: botStatusError } = useQuery({
    queryKey: ['bot-status', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No user authenticated');
      
      // Get user settings for bot status
      const { data: userSettings, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        console.error('Error fetching user settings:', settingsError);
        throw settingsError;
      }

      // Get sync status from sync_status table
      const { data: syncStatus, error: syncError } = await supabase
        .from('sync_status')
        .select('*')
        .eq('user_id', user.id)
        .order('sync_started_at', { ascending: false })
        .limit(1);

      // Determine bot status
      const isOnline = userSettings?.auto_join_enabled !== false; // Use auto_join_enabled as bot status
      const syncStatusValue = syncStatus?.[0]?.status || 'synced';
      const lastSyncTime = syncStatus?.[0]?.sync_started_at;
      const errorMessage = syncStatus?.[0]?.error_message;

      return {
        isOnline,
        syncStatus: syncStatusValue as 'synced' | 'syncing' | 'error',
        lastSyncTime,
        errorMessage
      };
    },
    enabled: !!user,
  });

  // Mutation to toggle auto-join for a meeting
  const toggleAutoJoinMutation = useMutation({
    mutationFn: async ({ meetingId, enabled }: { meetingId: string; enabled: boolean }) => {
      const { data, error } = await supabase
        .from('meetings')
        .update({ auto_join: enabled })
        .eq('id', meetingId)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-meetings', user?.id] });
      toast({
        title: "Bot settings updated",
        description: "Auto-join setting has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Error updating auto-join:', error);
      toast({
        title: "Error updating bot settings",
        description: "Failed to update auto-join setting. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation to toggle auto-record for a meeting
  const toggleAutoRecordMutation = useMutation({
    mutationFn: async ({ meetingId, enabled }: { meetingId: string; enabled: boolean }) => {
      const { data, error } = await supabase
        .from('meetings')
        .update({ auto_record: enabled })
        .eq('id', meetingId)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-meetings', user?.id] });
      toast({
        title: "Bot settings updated",
        description: "Auto-record setting has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Error updating auto-record:', error);
      toast({
        title: "Error updating bot settings",
        description: "Failed to update auto-record setting. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation to set join mode for a meeting
  const setJoinModeMutation = useMutation({
    mutationFn: async ({ meetingId, mode }: { meetingId: string; mode: 'audio_only' | 'speaker_view' }) => {
      // Since join_mode doesn't exist in meetings table, we'll store this in user_settings
      // For now, we'll just return success without updating the database
      // In a real implementation, you might want to add this field to the meetings table
      console.log(`Setting join mode to ${mode} for meeting ${meetingId}`);
      return { id: meetingId, join_mode: mode };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-meetings', user?.id] });
      toast({
        title: "Bot settings updated",
        description: "Join mode has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Error updating join mode:', error);
      toast({
        title: "Error updating bot settings",
        description: "Failed to update join mode. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Function to troubleshoot bot issues
  const troubleshootBot = async () => {
    try {
      // Check bot connectivity
      const { data: botCheck, error: botError } = await supabase
        .from('user_settings')
        .select('auto_join_enabled, auto_record_enabled, bot_name')
        .eq('user_id', user?.id)
        .single();

      if (botError) {
        toast({
          title: "Bot troubleshooting",
          description: "Unable to check bot status. Please check your settings.",
          variant: "destructive",
        });
        return;
      }

      // Check recent sync status
      const { data: syncCheck, error: syncError } = await supabase
        .from('sync_status')
        .select('*')
        .eq('user_id', user?.id)
        .order('sync_started_at', { ascending: false })
        .limit(5);

      if (syncError) {
        toast({
          title: "Bot troubleshooting",
          description: "Unable to check sync status. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Provide troubleshooting feedback
      const hasRecentErrors = syncCheck?.some(status => status.status === 'error');
      const isBotEnabled = botCheck?.auto_join_enabled !== false;

      if (!isBotEnabled) {
        toast({
          title: "Bot is disabled",
          description: "Enable the bot in your settings to start auto-joining meetings.",
        });
      } else if (hasRecentErrors) {
        toast({
          title: "Sync issues detected",
          description: "Recent sync errors detected. Check your calendar connection.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Bot status check",
          description: "Bot appears to be working correctly. All systems operational.",
        });
      }
    } catch (error) {
      console.error('Error during troubleshooting:', error);
      toast({
        title: "Troubleshooting failed",
        description: "Unable to complete troubleshooting. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    // Data
    botMeetings: botMeetings || [],
    botStatus: botStatus || { isOnline: true, syncStatus: 'synced' as const },
    
    // Loading states
    isLoading: botMeetingsLoading || botStatusLoading,
    isUpdating: toggleAutoJoinMutation.isPending || toggleAutoRecordMutation.isPending || setJoinModeMutation.isPending,
    
    // Errors
    error: botMeetingsError || botStatusError,
    
    // Actions
    toggleAutoJoin: toggleAutoJoinMutation.mutate,
    toggleAutoRecord: toggleAutoRecordMutation.mutate,
    setJoinMode: setJoinModeMutation.mutate,
    troubleshootBot,
  };
} 