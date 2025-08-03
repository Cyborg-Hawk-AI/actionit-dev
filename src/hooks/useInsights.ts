import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface Insight {
  id: string;
  title: string;
  description: string;
  type: 'decision' | 'action' | 'blocker' | 'milestone';
  tags: string[];
  meetingId: string;
  meetingTitle: string;
  meetingDate: string;
  attendees: string[];
  status: 'active' | 'resolved' | 'pending';
  createdAt: string;
}

export function useInsights() {
  const { user } = useAuth();

  const { data: insights, isLoading, error } = useQuery({
    queryKey: ['insights', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No user authenticated');
      
      // Get key insights with meeting information
      const { data: keyInsights, error: insightsError } = await supabase
        .from('key_insights')
        .select(`
          *,
          meetings!inner (
            id,
            title,
            start_time,
            attendees_count
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (insightsError) {
        console.error('Error fetching key insights:', insightsError);
        throw insightsError;
      }

      // Transform key insights into the Insight format
      const transformedInsights: Insight[] = [];
      
      keyInsights?.forEach((insight) => {
        // Extract decisions from key insights
        if (insight.decisions && Array.isArray(insight.decisions)) {
          insight.decisions.forEach((decision: any, index: number) => {
            let title = '';
            let description = '';
            
            if (typeof decision === 'string') {
              title = decision;
              description = `Decision made during meeting: ${insight.meetings?.title || 'Unknown Meeting'}`;
            } else if (typeof decision === 'object') {
              title = decision.text || decision.title || decision.decision || '';
              description = decision.description || `Decision made during meeting: ${insight.meetings?.title || 'Unknown Meeting'}`;
            }
            
            if (title) {
              transformedInsights.push({
                id: `decision-${insight.id}-${index}`,
                title,
                description,
                type: 'decision' as const,
                tags: ['decision', 'meeting'],
                meetingId: insight.meeting_id,
                meetingTitle: insight.meetings?.title || 'Unknown Meeting',
                meetingDate: insight.meetings?.start_time || insight.created_at,
                attendees: Array(insight.meetings?.attendees_count || 1).fill('Attendee'),
                status: 'active' as const,
                createdAt: insight.created_at
              });
            }
          });
        }

        // Extract action items as insights
        if (insight.action_items && Array.isArray(insight.action_items)) {
          insight.action_items.forEach((item: any, index: number) => {
            let title = '';
            let description = '';
            
            if (typeof item === 'string') {
              title = item;
              description = `Action item from meeting: ${insight.meetings?.title || 'Unknown Meeting'}`;
            } else if (typeof item === 'object') {
              title = item.text || item.title || item.action || '';
              description = item.description || `Action item from meeting: ${insight.meetings?.title || 'Unknown Meeting'}`;
            }
            
            if (title) {
              transformedInsights.push({
                id: `action-${insight.id}-${index}`,
                title,
                description,
                type: 'action' as const,
                tags: ['action', 'follow-up'],
                meetingId: insight.meeting_id,
                meetingTitle: insight.meetings?.title || 'Unknown Meeting',
                meetingDate: insight.meetings?.start_time || insight.created_at,
                attendees: Array(insight.meetings?.attendees_count || 1).fill('Attendee'),
                status: 'pending' as const,
                createdAt: insight.created_at
              });
            }
          });
        }

        // Create milestone from insight summary
        if (insight.insight_summary) {
          transformedInsights.push({
            id: `milestone-${insight.id}`,
            title: 'Meeting Insights Generated',
            description: insight.insight_summary,
            type: 'milestone' as const,
            tags: ['insights', 'ai-generated'],
            meetingId: insight.meeting_id,
            meetingTitle: insight.meetings?.title || 'Unknown Meeting',
            meetingDate: insight.meetings?.start_time || insight.created_at,
            attendees: Array(insight.meetings?.attendees_count || 1).fill('Attendee'),
            status: 'active' as const,
            createdAt: insight.created_at
          });
        }
      });

      // Also check transcripts for additional insights
      const { data: transcripts, error: transcriptsError } = await supabase
        .from('transcripts')
        .select(`
          *,
          meetings!inner (
            id,
            title,
            start_time,
            attendees_count
          )
        `)
        .eq('user_id', user.id)
        .not('meeting_summary', 'is', null)
        .order('created_at', { ascending: false });

      if (!transcriptsError && transcripts) {
        transcripts.forEach((transcript) => {
          // Create milestone from transcript summary
          if (transcript.meeting_summary) {
            transformedInsights.push({
              id: `transcript-milestone-${transcript.id}`,
              title: 'Meeting Transcript Processed',
              description: transcript.meeting_summary,
              type: 'milestone' as const,
              tags: ['transcript', 'ai-processed'],
              meetingId: transcript.meeting_id,
              meetingTitle: transcript.meetings?.title || 'Unknown Meeting',
              meetingDate: transcript.meetings?.start_time || transcript.created_at,
              attendees: Array(transcript.meetings?.attendees_count || 1).fill('Attendee'),
              status: 'active' as const,
              createdAt: transcript.created_at
            });
          }

          // Create blocker insights from considerations
          if (transcript.considerations_and_open_issues) {
            const considerations = transcript.considerations_and_open_issues.split('\n').filter(line => line.trim());
            considerations.forEach((consideration, index) => {
              if (consideration.trim()) {
                transformedInsights.push({
                  id: `blocker-${transcript.id}-${index}`,
                  title: consideration.trim(),
                  description: `Open issue identified during meeting: ${transcript.meetings?.title || 'Unknown Meeting'}`,
                  type: 'blocker' as const,
                  tags: ['blocker', 'issue'],
                  meetingId: transcript.meeting_id,
                  meetingTitle: transcript.meetings?.title || 'Unknown Meeting',
                  meetingDate: transcript.meetings?.start_time || transcript.created_at,
                  attendees: Array(transcript.meetings?.attendees_count || 1).fill('Attendee'),
                  status: 'pending' as const,
                  createdAt: transcript.created_at
                });
              }
            });
          }
        });
      }

      // Sort by creation date (newest first)
      return transformedInsights.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    enabled: !!user,
  });

  return {
    insights: insights || [],
    isLoading,
    error,
  };
} 