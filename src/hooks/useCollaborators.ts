import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  meetingCount: number;
  lastMeeting: string;
  totalDuration: number; // in minutes
  crmData?: {
    company?: string;
    dealValue?: number;
    dealStage?: string;
    ticketCount?: number;
  };
}

export function useCollaborators() {
  const { user } = useAuth();

  const { data: collaborators, isLoading, error } = useQuery({
    queryKey: ['collaborators', user?.id],
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

      // Get event attendees for all meetings
      const { data: attendees, error: attendeesError } = await supabase
        .from('event_attendees')
        .select(`
          *,
          meetings!inner (
            id,
            title,
            start_time,
            end_time,
            user_id
          )
        `)
        .eq('meetings.user_id', user.id);

      if (attendeesError) {
        console.error('Error fetching attendees:', attendeesError);
        throw attendeesError;
      }

      // Process attendees to create collaborator data
      const collaboratorMap = new Map<string, {
        id: string;
        name: string;
        email: string;
        meetings: any[];
        totalDuration: number;
        lastMeeting: string;
      }>();

      attendees?.forEach((attendee) => {
        const email = attendee.email.toLowerCase();
        const name = attendee.name || attendee.email.split('@')[0];
        
        if (!collaboratorMap.has(email)) {
          collaboratorMap.set(email, {
            id: email, // Use email as ID for now
            name,
            email: attendee.email,
            meetings: [],
            totalDuration: 0,
            lastMeeting: attendee.meetings.start_time
          });
        }

        const collaborator = collaboratorMap.get(email)!;
        collaborator.meetings.push(attendee.meetings);
        
        // Calculate duration
        const startTime = new Date(attendee.meetings.start_time);
        const endTime = new Date(attendee.meetings.end_time);
        const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
        collaborator.totalDuration += durationMinutes;
        
        // Update last meeting if this one is more recent
        if (new Date(attendee.meetings.start_time) > new Date(collaborator.lastMeeting)) {
          collaborator.lastMeeting = attendee.meetings.start_time;
        }
      });

      // Transform to Collaborator format
      const transformedCollaborators: Collaborator[] = Array.from(collaboratorMap.values())
        .map((collaborator) => ({
          id: collaborator.id,
          name: collaborator.name,
          email: collaborator.email,
          avatar: undefined, // Could be enhanced with avatar URLs
          meetingCount: collaborator.meetings.length,
          lastMeeting: collaborator.lastMeeting,
          totalDuration: collaborator.totalDuration,
          crmData: {
            // For now, we'll use mock CRM data
            // In a real implementation, this would come from CRM integrations
            company: collaborator.email.includes('@') ? collaborator.email.split('@')[1].split('.')[0] : undefined,
            dealValue: Math.floor(Math.random() * 100000) + 10000, // Mock deal value
            dealStage: ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won'][Math.floor(Math.random() * 5)],
            ticketCount: Math.floor(Math.random() * 5) + 1 // Mock ticket count
          }
        }))
        .sort((a, b) => b.meetingCount - a.meetingCount);

      return transformedCollaborators;
    },
    enabled: !!user,
  });

  return {
    collaborators: collaborators || [],
    isLoading,
    error,
  };
} 