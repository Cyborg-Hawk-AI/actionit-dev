import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { createGoogleEvent, updateGoogleEvent, deleteGoogleEvent } from '@/services/googleCalendarService';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

export interface CreateEventData {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  calendar_external_id: string;
  meeting_type?: 'manual' | 'google_meet';
  meeting_url?: string;
  attendees?: Array<{ 
    email: string; 
    name?: string;
    responseStatus?: 'needsAction' | 'accepted' | 'declined' | 'tentative';
  }>;
  recurrence_rule?: string;
}

export interface UpdateEventData extends Partial<CreateEventData> {
  id: string;
  google_event_id?: string;
}

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (eventData: CreateEventData) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Prepare attendees for Google Calendar API
      const googleAttendees = eventData.attendees?.map(attendee => ({
        email: attendee.email,
        displayName: attendee.name,
        responseStatus: attendee.responseStatus || 'needsAction'
      }));

      // Create event in Google Calendar first
      const googleEvent = await createGoogleEvent({
        ...eventData,
        attendees: googleAttendees,
        userId: user.id
      });

      // Get the meeting URL from either the manual input or Google Meet
      const meetingUrl = eventData.meeting_type === 'google_meet' 
        ? googleEvent.conferenceData?.entryPoints?.[0]?.uri || googleEvent.hangoutLink
        : eventData.meeting_url;

      // Then create in Supabase - include external_id for backward compatibility
      const { data: meeting, error } = await supabase
        .from('meetings')
        .insert({
          user_id: user.id,
          title: eventData.title,
          description: eventData.description,
          start_time: eventData.start_time,
          end_time: eventData.end_time,
          location: eventData.location,
          calendar_external_id: eventData.calendar_external_id,
          google_event_id: googleEvent.id,
          meeting_type: eventData.meeting_type || 'manual',
          meeting_url: meetingUrl,
          platform: eventData.meeting_type === 'google_meet' ? 'google_meet' : null,
          recurrence_rule: eventData.recurrence_rule,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          external_id: googleEvent.id // Add this for backward compatibility
        })
        .select()
        .single();

      if (error) throw error;

      // Add attendees if provided
      if (eventData.attendees && eventData.attendees.length > 0) {
        const attendeeRecords = eventData.attendees.map(attendee => ({
          meeting_id: meeting.id,
          email: attendee.email,
          name: attendee.name,
          rsvp_status: (attendee.responseStatus === 'needsAction' ? 'pending' : attendee.responseStatus) as 'pending' | 'accepted' | 'declined' | 'tentative',
          is_organizer: false
        }));

        await supabase
          .from('event_attendees')
          .insert(attendeeRecords);
      }

      return meeting;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['today-meetings'] });
      toast({
        title: "Event Created",
        description: "Event has been created and invites sent via Google Calendar",
      });
    },
    onError: (error) => {
      console.error('Error creating event:', error);
      toast({
        title: "Event Creation Failed",
        description: error.message || "Could not create event",
        variant: "destructive"
      });
    },
  });
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventData: UpdateEventData) => {
      const { id, google_event_id, calendar_external_id, attendees, ...updates } = eventData;

      // Update in Google Calendar first if we have the google_event_id
      if (google_event_id && calendar_external_id) {
        const googleUpdates: any = {};
        if (updates.title) googleUpdates.summary = updates.title;
        if (updates.description !== undefined) googleUpdates.description = updates.description;
        if (updates.location !== undefined) googleUpdates.location = updates.location;
        if (updates.start_time) {
          googleUpdates.start = {
            dateTime: updates.start_time,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          };
        }
        if (updates.end_time) {
          googleUpdates.end = {
            dateTime: updates.end_time,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          };
        }
        
        // Add attendees to Google Calendar update if provided
        if (attendees && attendees.length > 0) {
          googleUpdates.attendees = attendees.map(attendee => ({
            email: attendee.email,
            displayName: attendee.name,
            responseStatus: attendee.responseStatus || 'needsAction'
          }));
        }

        await updateGoogleEvent(google_event_id, calendar_external_id, googleUpdates);
      }

      // Update in Supabase
      const { data: meeting, error } = await supabase
        .from('meetings')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update attendees in Supabase if provided
      if (attendees && attendees.length > 0) {
        // First, delete existing attendees for this meeting
        await supabase
          .from('event_attendees')
          .delete()
          .eq('meeting_id', id);

        // Then insert the new attendees
        const attendeeRecords = attendees.map(attendee => ({
          meeting_id: id,
          email: attendee.email,
          name: attendee.name,
          rsvp_status: (attendee.responseStatus === 'needsAction' ? 'pending' : attendee.responseStatus) as 'pending' | 'accepted' | 'declined' | 'tentative',
          is_organizer: false
        }));

        await supabase
          .from('event_attendees')
          .insert(attendeeRecords);
      }

      return meeting;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['today-meetings'] });
      queryClient.invalidateQueries({ queryKey: ['event-attendees'] });
      toast({
        title: "Event Updated",
        description: "Event has been updated and synced with Google Calendar",
      });
    },
    onError: (error) => {
      console.error('Error updating event:', error);
      toast({
        title: "Event Update Failed",
        description: error.message || "Could not update event",
        variant: "destructive"
      });
    },
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, google_event_id, calendar_external_id }: { id: string; google_event_id?: string; calendar_external_id?: string }) => {
      // Delete from Google Calendar first if we have the google_event_id
      if (google_event_id && calendar_external_id) {
        try {
          await deleteGoogleEvent(google_event_id, calendar_external_id);
        } catch (error) {
          console.warn('Failed to delete from Google Calendar, continuing with local deletion:', error);
        }
      }

      // Delete from Supabase
      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['today-meetings'] });
      toast({
        title: "Event Deleted",
        description: "Event has been deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting event:', error);
      toast({
        title: "Event Deletion Failed",
        description: error.message || "Could not delete event",
        variant: "destructive"
      });
    },
  });
};
