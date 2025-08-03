import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface MeetingAnalytics {
  totalMeetings: number;
  thisWeekMeetings: number;
  thisMonthMeetings: number;
  averageDuration: number;
  completionRate: number;
  productivityScore: number;
  topMeetingTypes: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  weeklyTrend: {
    current: number;
    previous: number;
    change: number;
  };
  monthlyTrend: {
    current: number;
    previous: number;
    change: number;
  };
  insightsGenerated: number;
  actionItemsCreated: number;
  decisionsRecorded: number;
}

export function useMeetingAnalytics() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['meeting-analytics', user?.id],
    queryFn: async (): Promise<MeetingAnalytics> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Fetch meetings for the current user
      const { data: meetings, error: meetingsError } = await supabase
        .from('meetings')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false });

      if (meetingsError) {
        throw new Error(`Failed to fetch meetings: ${meetingsError.message}`);
      }

      // Fetch key insights for analytics
      const { data: keyInsights, error: insightsError } = await supabase
        .from('key_insights')
        .select('*')
        .eq('user_id', user.id);

      if (insightsError) {
        throw new Error(`Failed to fetch key insights: ${insightsError.message}`);
      }

      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfPreviousWeek = new Date(startOfWeek);
      startOfPreviousWeek.setDate(startOfPreviousWeek.getDate() - 7);
      const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      // Calculate analytics
      const totalMeetings = meetings?.length || 0;
      
      const thisWeekMeetings = meetings?.filter(meeting => 
        new Date(meeting.start_time) >= startOfWeek
      ).length || 0;

      const thisMonthMeetings = meetings?.filter(meeting => 
        new Date(meeting.start_time) >= startOfMonth
      ).length || 0;

      const previousWeekMeetings = meetings?.filter(meeting => {
        const meetingDate = new Date(meeting.start_time);
        return meetingDate >= startOfPreviousWeek && meetingDate < startOfWeek;
      }).length || 0;

      const previousMonthMeetings = meetings?.filter(meeting => {
        const meetingDate = new Date(meeting.start_time);
        return meetingDate >= startOfPreviousMonth && meetingDate < startOfMonth;
      }).length || 0;

      // Calculate average duration
      const completedMeetings = meetings?.filter(meeting => 
        meeting.end_time && meeting.start_time
      ) || [];

      const totalDuration = completedMeetings.reduce((total, meeting) => {
        const start = new Date(meeting.start_time);
        const end = new Date(meeting.end_time);
        return total + (end.getTime() - start.getTime());
      }, 0);

      const averageDuration = completedMeetings.length > 0 
        ? Math.round(totalDuration / completedMeetings.length / (1000 * 60)) // Convert to minutes
        : 0;

      // Calculate completion rate (meetings with end_time)
      const completionRate = totalMeetings > 0 
        ? Math.round((completedMeetings.length / totalMeetings) * 100)
        : 0;

      // Calculate productivity score based on insights and action items
      const insightsGenerated = keyInsights?.length || 0;
      const actionItemsCreated = keyInsights?.reduce((total, insight) => {
        if (insight.action_items && typeof insight.action_items === 'object') {
          const items = Array.isArray(insight.action_items) ? insight.action_items : [];
          return total + items.length;
        }
        return total;
      }, 0) || 0;

      const decisionsRecorded = keyInsights?.reduce((total, insight) => {
        if (insight.decisions && typeof insight.decisions === 'object') {
          const decisions = Array.isArray(insight.decisions) ? insight.decisions : [];
          return total + decisions.length;
        }
        return total;
      }, 0) || 0;

      // Simple productivity score calculation
      const productivityScore = Math.min(100, Math.round(
        (completionRate * 0.3) + 
        (insightsGenerated * 2) + 
        (actionItemsCreated * 3) + 
        (decisionsRecorded * 2)
      ));

      // Analyze meeting types (based on title patterns)
      const meetingTypeCounts: Record<string, number> = {};
      meetings?.forEach(meeting => {
        const title = meeting.title?.toLowerCase() || '';
        let type = 'Other';
        
        if (title.includes('standup') || title.includes('daily')) type = 'Standup';
        else if (title.includes('review') || title.includes('retro')) type = 'Review';
        else if (title.includes('planning') || title.includes('sprint')) type = 'Planning';
        else if (title.includes('client') || title.includes('customer')) type = 'Client';
        else if (title.includes('sync') || title.includes('catch')) type = 'Sync';
        
        meetingTypeCounts[type] = (meetingTypeCounts[type] || 0) + 1;
      });

      const topMeetingTypes = Object.entries(meetingTypeCounts)
        .map(([type, count]) => ({
          type,
          count,
          percentage: totalMeetings > 0 ? Math.round((count / totalMeetings) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      return {
        totalMeetings,
        thisWeekMeetings,
        thisMonthMeetings,
        averageDuration,
        completionRate,
        productivityScore,
        topMeetingTypes,
        weeklyTrend: {
          current: thisWeekMeetings,
          previous: previousWeekMeetings,
          change: previousWeekMeetings > 0 
            ? Math.round(((thisWeekMeetings - previousWeekMeetings) / previousWeekMeetings) * 100)
            : 0
        },
        monthlyTrend: {
          current: thisMonthMeetings,
          previous: previousMonthMeetings,
          change: previousMonthMeetings > 0
            ? Math.round(((thisMonthMeetings - previousMonthMeetings) / previousMonthMeetings) * 100)
            : 0
        },
        insightsGenerated,
        actionItemsCreated,
        decisionsRecorded
      };
    },
    enabled: !!user?.id,
  });
} 