import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface RiskItem {
  id: string;
  type: 'compliance' | 'security' | 'delivery' | 'ownership' | 'timeline';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  meetingId?: string;
  meetingTitle?: string;
  detectedAt: string;
  status: 'active' | 'resolved' | 'acknowledged';
}

export function useEnterpriseRisks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: risks, isLoading, error } = useQuery({
    queryKey: ['enterprise-risks', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No user authenticated');
      
      // Get all meetings for the user
      const { data: meetings, error: meetingsError } = await supabase
        .from('meetings')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false });

      if (meetingsError) {
        console.error('Error fetching meetings:', meetingsError);
        throw meetingsError;
      }

      // Get key insights for meetings to analyze for risks
      const { data: keyInsights, error: insightsError } = await supabase
        .from('key_insights')
        .select('*')
        .eq('user_id', user.id);

      if (insightsError) {
        console.error('Error fetching key insights:', insightsError);
        throw insightsError;
      }

      // Analyze meetings and insights for potential risks
      const detectedRisks: RiskItem[] = [];

      if (meetings && meetings.length > 0) {
        // Check for decisions without clear owners
        for (const meeting of meetings) {
          const meetingInsights = keyInsights?.find(insight => insight.meeting_id === meeting.id);
          
          if (meetingInsights?.decisions && typeof meetingInsights.decisions === 'object') {
            const decisions = Array.isArray(meetingInsights.decisions) ? meetingInsights.decisions : [];
            
            // Check if decisions have clear owners
            const decisionsWithoutOwners = decisions.filter((decision: any) => {
              if (typeof decision === 'string') {
                return !decision.toLowerCase().includes('assigned') && 
                       !decision.toLowerCase().includes('owner') && 
                       !decision.toLowerCase().includes('responsible');
              }
              return true; // Assume object decisions need review
            });

            if (decisionsWithoutOwners.length > 0) {
              detectedRisks.push({
                id: `ownership-${meeting.id}`,
                type: 'ownership',
                severity: 'medium',
                title: 'Decisions without clear owners',
                description: `${decisionsWithoutOwners.length} decision(s) from "${meeting.title}" lack clear ownership assignment`,
                meetingId: meeting.id,
                meetingTitle: meeting.title,
                detectedAt: new Date().toISOString(),
                status: 'active'
              });
            }
          }

          // Check for action items without timelines
          if (meetingInsights?.action_items && typeof meetingInsights.action_items === 'object') {
            const actionItems = Array.isArray(meetingInsights.action_items) ? meetingInsights.action_items : [];
            
            const itemsWithoutTimelines = actionItems.filter((item: any) => {
              if (typeof item === 'string') {
                return !item.toLowerCase().includes('by') && 
                       !item.toLowerCase().includes('deadline') && 
                       !item.toLowerCase().includes('timeline') &&
                       !item.toLowerCase().includes('due');
              }
              return true; // Assume object items need review
            });

            if (itemsWithoutTimelines.length > 0) {
              detectedRisks.push({
                id: `timeline-${meeting.id}`,
                type: 'timeline',
                severity: 'medium',
                title: 'Action items without timelines',
                description: `${itemsWithoutTimelines.length} action item(s) from "${meeting.title}" lack clear timelines`,
                meetingId: meeting.id,
                meetingTitle: meeting.title,
                detectedAt: new Date().toISOString(),
                status: 'active'
              });
            }
          }

          // Check for potential compliance issues (keywords)
          const complianceKeywords = ['gdpr', 'compliance', 'regulation', 'legal', 'policy', 'audit'];
          const meetingText = `${meeting.title} ${meetingInsights?.insight_summary || ''}`.toLowerCase();
          
          const complianceIssues = complianceKeywords.filter(keyword => 
            meetingText.includes(keyword)
          );

          if (complianceIssues.length > 0) {
            detectedRisks.push({
              id: `compliance-${meeting.id}`,
              type: 'compliance',
              severity: 'high',
              title: 'Potential compliance concerns',
              description: `Meeting "${meeting.title}" contains compliance-related content that may need review`,
              meetingId: meeting.id,
              meetingTitle: meeting.title,
              detectedAt: new Date().toISOString(),
              status: 'active'
            });
          }

          // Check for security concerns
          const securityKeywords = ['password', 'credential', 'access', 'permission', 'security', 'vulnerability'];
          const securityIssues = securityKeywords.filter(keyword => 
            meetingText.includes(keyword)
          );

          if (securityIssues.length > 0) {
            detectedRisks.push({
              id: `security-${meeting.id}`,
              type: 'security',
              severity: 'high',
              title: 'Security concerns detected',
              description: `Meeting "${meeting.title}" contains security-related content that may need review`,
              meetingId: meeting.id,
              meetingTitle: meeting.title,
              detectedAt: new Date().toISOString(),
              status: 'active'
            });
          }

          // Check for delivery risks (meetings with many action items but few decisions)
          if (meetingInsights?.action_items && meetingInsights?.decisions) {
            const actionItems = Array.isArray(meetingInsights.action_items) ? meetingInsights.action_items : [];
            const decisions = Array.isArray(meetingInsights.decisions) ? meetingInsights.decisions : [];
            
            if (actionItems.length > 5 && decisions.length < 2) {
              detectedRisks.push({
                id: `delivery-${meeting.id}`,
                type: 'delivery',
                severity: 'medium',
                title: 'Potential delivery risk',
                description: `Meeting "${meeting.title}" has many action items (${actionItems.length}) but few decisions (${decisions.length}), indicating potential delivery challenges`,
                meetingId: meeting.id,
                meetingTitle: meeting.title,
                detectedAt: new Date().toISOString(),
                status: 'active'
              });
            }
          }
        }
      }

      return detectedRisks;
    },
    enabled: !!user,
  });

  const acknowledgeRiskMutation = useMutation({
    mutationFn: async (riskId: string) => {
      // In a real implementation, this would update the risk status in the database
      // For now, we'll just simulate the update
      console.log('Acknowledging risk:', riskId);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enterprise-risks', user?.id] });
    },
  });

  const resolveRiskMutation = useMutation({
    mutationFn: async (riskId: string) => {
      // In a real implementation, this would update the risk status in the database
      // For now, we'll just simulate the update
      console.log('Resolving risk:', riskId);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enterprise-risks', user?.id] });
    },
  });

  return {
    risks: risks || [],
    isLoading,
    error,
    acknowledgeRisk: acknowledgeRiskMutation.mutate,
    resolveRisk: resolveRiskMutation.mutate,
  };
} 