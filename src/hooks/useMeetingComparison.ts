import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface MeetingComparison {
  id: string;
  currentMeeting: {
    id: string;
    title: string;
    date: string;
    duration: number;
    attendees: number;
    decisions: number;
    actionItems: number;
  };
  previousMeetings: {
    id: string;
    title: string;
    date: string;
    duration: number;
    attendees: number;
    decisions: number;
    actionItems: number;
  }[];
  trends: {
    duration: 'up' | 'down' | 'same';
    attendees: 'up' | 'down' | 'same';
    decisions: 'up' | 'down' | 'same';
    actionItems: 'up' | 'down' | 'same';
  };
  improvements: string[];
  unresolvedItems: string[];
}

export function useMeetingComparison() {
  const { user } = useAuth();

  const { data: meetingComparison, isLoading, error } = useQuery({
    queryKey: ['meeting-comparison', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No user authenticated');
      
      // Get all meetings for the user, ordered by date
      const { data: meetings, error: meetingsError } = await supabase
        .from('meetings')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false });

      if (meetingsError) {
        console.error('Error fetching meetings:', meetingsError);
        throw meetingsError;
      }

      if (!meetings || meetings.length === 0) {
        return null;
      }

      // Get key insights for meetings to extract decisions and action items
      const { data: keyInsights, error: insightsError } = await supabase
        .from('key_insights')
        .select('*')
        .eq('user_id', user.id);

      if (insightsError) {
        console.error('Error fetching key insights:', insightsError);
        throw insightsError;
      }

      // Get event attendees for meetings to count attendees
      const { data: attendees, error: attendeesError } = await supabase
        .from('event_attendees')
        .select('meeting_id')
        .in('meeting_id', meetings.map(m => m.id));

      if (attendeesError) {
        console.error('Error fetching attendees:', attendeesError);
        throw attendeesError;
      }

      // Group attendees by meeting
      const attendeesByMeeting = attendees?.reduce((acc, attendee) => {
        acc[attendee.meeting_id] = (acc[attendee.meeting_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Process meetings to find recurring patterns
      const processedMeetings = meetings.map(meeting => {
        const startTime = new Date(meeting.start_time);
        const endTime = new Date(meeting.end_time);
        const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
        
        // Find insights for this meeting
        const meetingInsights = keyInsights?.find(insight => insight.meeting_id === meeting.id);
        
        // Count decisions and action items from insights
        let decisions = 0;
        let actionItems = 0;
        
        if (meetingInsights) {
          if (meetingInsights.decisions && typeof meetingInsights.decisions === 'object') {
            decisions = Array.isArray(meetingInsights.decisions) ? meetingInsights.decisions.length : 0;
          }
          if (meetingInsights.action_items && typeof meetingInsights.action_items === 'object') {
            actionItems = Array.isArray(meetingInsights.action_items) ? meetingInsights.action_items.length : 0;
          }
        }

        return {
          id: meeting.id,
          title: meeting.title,
          date: meeting.start_time,
          duration: durationMinutes,
          attendees: attendeesByMeeting[meeting.id] || 0,
          decisions,
          actionItems
        };
      });

      // Find the most recent meeting as current
      const currentMeeting = processedMeetings[0];
      
      // Find similar meetings (same title pattern) for comparison
      const similarMeetings = processedMeetings.filter(meeting => 
        meeting.id !== currentMeeting.id && 
        meeting.title.toLowerCase().includes(currentMeeting.title.toLowerCase().split(' ')[0])
      ).slice(0, 3); // Take up to 3 previous similar meetings

      if (similarMeetings.length === 0) {
        return null; // No comparison possible
      }

      // Calculate trends
      const avgPreviousDuration = similarMeetings.reduce((sum, m) => sum + m.duration, 0) / similarMeetings.length;
      const avgPreviousAttendees = similarMeetings.reduce((sum, m) => sum + m.attendees, 0) / similarMeetings.length;
      const avgPreviousDecisions = similarMeetings.reduce((sum, m) => sum + m.decisions, 0) / similarMeetings.length;
      const avgPreviousActionItems = similarMeetings.reduce((sum, m) => sum + m.actionItems, 0) / similarMeetings.length;

      const trends = {
        duration: (currentMeeting.duration > avgPreviousDuration ? 'up' : 
                  currentMeeting.duration < avgPreviousDuration ? 'down' : 'same') as 'up' | 'down' | 'same',
        attendees: (currentMeeting.attendees > avgPreviousAttendees ? 'up' : 
                   currentMeeting.attendees < avgPreviousAttendees ? 'down' : 'same') as 'up' | 'down' | 'same',
        decisions: (currentMeeting.decisions > avgPreviousDecisions ? 'up' : 
                   currentMeeting.decisions < avgPreviousDecisions ? 'down' : 'same') as 'up' | 'down' | 'same',
        actionItems: (currentMeeting.actionItems > avgPreviousActionItems ? 'up' : 
                     currentMeeting.actionItems < avgPreviousActionItems ? 'down' : 'same') as 'up' | 'down' | 'same'
      };

      // Generate improvements and unresolved items based on trends
      const improvements: string[] = [];
      const unresolvedItems: string[] = [];

      if (trends.duration === 'down') {
        improvements.push('Meeting duration reduced');
      }
      if (trends.decisions === 'up') {
        improvements.push('More decisions made');
      }
      if (trends.attendees === 'up') {
        improvements.push('Better attendance');
      }
      if (trends.actionItems === 'down') {
        improvements.push('Fewer action items needed');
      }

      // Find unresolved items from previous meetings
      // Look for action items from previous meetings that might be unresolved
      for (const previousMeeting of similarMeetings) {
        const previousInsights = keyInsights?.find(insight => insight.meeting_id === previousMeeting.id);
        
        if (previousInsights?.action_items && typeof previousInsights.action_items === 'object') {
          const actionItems = Array.isArray(previousInsights.action_items) ? previousInsights.action_items : [];
          
          // Add action items that might be unresolved (this is a simplified approach)
          // In a real implementation, you'd check completion status from a separate table
          if (actionItems.length > 0) {
            // Take the first action item as potentially unresolved
            const firstActionItem = actionItems[0];
            if (typeof firstActionItem === 'string') {
              unresolvedItems.push(firstActionItem);
            } else if (typeof firstActionItem === 'object' && firstActionItem && typeof firstActionItem === 'object' && 'text' in firstActionItem) {
              unresolvedItems.push(String(firstActionItem.text));
            }
          }
        }
      }

      // If no unresolved items found from previous meetings, show a generic message
      if (unresolvedItems.length === 0) {
        unresolvedItems.push('No unresolved items from previous meetings');
      }

      return {
        id: currentMeeting.id,
        currentMeeting,
        previousMeetings: similarMeetings,
        trends,
        improvements,
        unresolvedItems
      };
    },
    enabled: !!user,
  });

  return {
    meetingComparison: meetingComparison || null,
    isLoading,
    error,
  };
} 