
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEventAttendees, addEventAttendees, updateAttendeeStatus, EventAttendee } from '@/services/googleCalendarService';

export const useEventAttendees = (meetingId: string | null) => {
  return useQuery({
    queryKey: ['event-attendees', meetingId],
    queryFn: () => meetingId ? getEventAttendees(meetingId) : Promise.resolve([]),
    enabled: !!meetingId,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useAddAttendees = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ meetingId, attendees }: { meetingId: string; attendees: Array<{ email: string; name?: string }> }) =>
      addEventAttendees(meetingId, attendees),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: ['event-attendees', meetingId] });
    },
  });
};

export const useUpdateAttendeeStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ meetingId, email, status }: { meetingId: string; email: string; status: 'pending' | 'accepted' | 'declined' | 'tentative' }) =>
      updateAttendeeStatus(meetingId, email, status),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: ['event-attendees', meetingId] });
    },
  });
};
