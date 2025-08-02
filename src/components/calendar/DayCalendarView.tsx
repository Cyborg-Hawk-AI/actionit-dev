import React from 'react';
import { format, parseISO, isSameHour, addHours, startOfDay, isAfter, isBefore, isWithinInterval, getHours, getMinutes, differenceInHours, differenceInMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import { Meeting } from '@/services/calendarService';
import { JoinMode } from '@/services/recallService';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import EventDetailModal from './EventDetailModal';
import EventCreationModal from './EventCreationModal';
import TimeSlotGrid from './TimeSlotGrid';
import DraggableEvent from './DraggableEvent';
import { useUpdateEvent } from '@/hooks/useEventManagement';

interface DayCalendarViewProps {
  selectedDate: Date;
  meetings: Meeting[];
  enabledCalendars: {[id: string]: boolean};
  calendars: any[];
  is24Hour: boolean;
  joiningMeetings: {[key: string]: boolean};
  meetingJoinModes: {[key: string]: JoinMode};
  onJoinMeeting: (meetingUrl: string) => void;
  onJoinMeetingWithBot: (meetingId: string) => void;
  onSetJoinMode: (meetingId: string, mode: JoinMode) => void;
  onUpdateMeeting: (meetingId: string, setting: 'auto_join' | 'auto_record', currentValue: boolean) => void;
  onEventClick: (meeting: Meeting) => void;
}

const DayCalendarView: React.FC<DayCalendarViewProps> = ({
  selectedDate,
  meetings,
  enabledCalendars,
  calendars,
  is24Hour,
  joiningMeetings,
  meetingJoinModes,
  onJoinMeeting,
  onJoinMeetingWithBot,
  onSetJoinMode,
  onUpdateMeeting,
  onEventClick
}) => {
  const [selectedMeeting, setSelectedMeeting] = React.useState<Meeting | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isCreationModalOpen, setIsCreationModalOpen] = React.useState(false);
  const [creationTime, setCreationTime] = React.useState<{ start: Date; end: Date } | null>(null);
  const [syncingEvents, setSyncingEvents] = React.useState<{[key: string]: 'syncing' | 'synced' | 'failed'}>({});
  const { toast } = useToast();
  const updateEventMutation = useUpdateEvent();
  
  // Create business hours array (24 hours)
  const businessHours = Array.from({ length: 24 }, (_, i) => i);
  
  // Calculate current time for the time indicator
  const now = new Date();
  const currentHour = getHours(now);
  const currentMinute = getMinutes(now);
  const currentTimePosition = currentHour + (currentMinute / 60);
  
  // Get primary calendar for event creation
  const primaryCalendar = calendars.find(cal => cal.is_primary) || calendars[0];
  
  // Filter meetings for the selected date and enabled calendars
  const dayMeetings = meetings.filter(meeting => {
    const meetingDate = parseISO(meeting.start_time);
    const meetingStartDate = new Date(meetingDate);
    meetingStartDate.setHours(0, 0, 0, 0);
    
    const selectedDateCopy = new Date(selectedDate);
    selectedDateCopy.setHours(0, 0, 0, 0);
    
    const matchesDate = meetingStartDate.getTime() === selectedDateCopy.getTime();
    
    // Check if the meeting's calendar is enabled
    const calendar = calendars.find(cal => cal.external_id === meeting.calendar_external_id);
    const calendarEnabled = calendar ? enabledCalendars[calendar.id] !== false : true;
    
    return matchesDate && calendarEnabled;
  });
  
  // Format time based on 12/24 hour preference
  const getFormattedTime = (date: Date) => {
    return is24Hour ? format(date, 'HH:mm') : format(date, 'h:mm a');
  };
  
  // Check if a meeting is currently in progress
  const isMeetingNow = (meeting: Meeting) => {
    const meetingStart = parseISO(meeting.start_time);
    const meetingEnd = parseISO(meeting.end_time);
    return isWithinInterval(new Date(), { start: meetingStart, end: meetingEnd });
  };

  // Get the status of a meeting (In Progress, Upcoming, Completed)
  const getMeetingStatus = (meeting: Meeting) => {
    const meetingStart = parseISO(meeting.start_time);
    const meetingEnd = parseISO(meeting.end_time);
    const now = new Date();
    
    if (isAfter(now, meetingStart) && isBefore(now, meetingEnd)) {
      return "In Progress";
    } else if (isBefore(now, meetingStart)) {
      return "Upcoming";
    } else {
      return "Completed";
    }
  };

  // Calculate the vertical position of a meeting based on its start time
  const getMeetingTimePosition = (meeting: Meeting) => {
    const meetingStart = parseISO(meeting.start_time);
    const startHour = getHours(meetingStart);
    const startMinute = getMinutes(meetingStart);
    return startHour + (startMinute / 60);
  };

  // Calculate the duration of a meeting in hours
  const getMeetingDuration = (meeting: Meeting) => {
    const meetingStart = parseISO(meeting.start_time);
    const meetingEnd = parseISO(meeting.end_time);
    const diffHours = differenceInHours(meetingEnd, meetingStart);
    const diffMinutes = differenceInMinutes(meetingEnd, meetingStart) % 60;
    
    // Calculate total hours including minutes as a decimal
    return diffHours + (diffMinutes / 60);
  };

  // Handle opening the meeting details modal
  const handleOpenMeetingModal = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setIsModalOpen(true);
  };

  // Handle time slot click for creating events
  const handleTimeSlotClick = (startTime: Date, endTime: Date) => {
    if (!primaryCalendar) {
      toast({
        title: "No Calendar Connected",
        description: "Please connect a Google Calendar account first",
        variant: "destructive"
      });
      return;
    }
    
    setCreationTime({ start: startTime, end: endTime });
    setIsCreationModalOpen(true);
  };

  // Handle joining a meeting with the bot
  const handleJoinMeetingWithBot = async (meetingId: string, joinMode: JoinMode = 'audio_only') => {
    onJoinMeetingWithBot(meetingId);
  };

  // Handle event click - open modal instead of navigating
  const handleEventClick = (meeting: Meeting, event: React.MouseEvent) => {
    event.stopPropagation();
    handleOpenMeetingModal(meeting);
  };

  const handleEventDrop = async (meetingId: string, newStartTime: Date, newEndTime: Date) => {
    const meeting = dayMeetings.find(m => m.id === meetingId);
    if (!meeting) return;

    // Set syncing status
    setSyncingEvents(prev => ({ ...prev, [meetingId]: 'syncing' }));
    
    toast({
      title: "Saving...",
      description: "Updating event time",
    });

    try {
      await updateEventMutation.mutateAsync({
        id: meeting.id,
        google_event_id: meeting.google_event_id,
        calendar_external_id: meeting.calendar_external_id,
        start_time: newStartTime.toISOString(),
        end_time: newEndTime.toISOString()
      });

      setSyncingEvents(prev => ({ ...prev, [meetingId]: 'synced' }));
      
      toast({
        title: "Event Updated ✅",
        description: "Event has been updated and synced with Google Calendar",
      });

      // Clear sync status after 2 seconds
      setTimeout(() => {
        setSyncingEvents(prev => {
          const { [meetingId]: _, ...rest } = prev;
          return rest;
        });
      }, 2000);
    } catch (error) {
      setSyncingEvents(prev => ({ ...prev, [meetingId]: 'failed' }));
      toast({
        title: "Update Failed",
        description: "Could not update the event",
        variant: "destructive"
      });
    }
  };

  const handleEventCreated = () => {
    // The useCreateEvent mutation will automatically refresh the data
    setCreationTime(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Day header */}
      <div className="border-b py-3 px-4 flex justify-between items-center">
        <div>
          <h2 className="font-semibold text-lg">{format(selectedDate, 'EEEE')}</h2>
          <p className="text-muted-foreground text-sm">{format(selectedDate, 'MMMM d, yyyy')}</p>
        </div>
        <div className="text-sm text-muted-foreground">
          {dayMeetings.length} meeting{dayMeetings.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      {/* Day view with enhanced hour blocks */}
      <ScrollArea className="flex-grow">
        <div className="relative grid grid-cols-[auto_1fr] min-h-[1200px]">
          {/* Hours labels */}
          <div className="col-span-1 border-r pr-2 text-right bg-gradient-to-r from-orange-50/30 to-amber-50/20 dark:from-orange-950/10 dark:to-amber-950/5">
            {businessHours.map((hour) => (
              <div key={`hour-${hour}`} className="h-20 border-b border-orange-200/40 dark:border-orange-700/30 flex items-end justify-end pb-1">
                <span className="text-xs text-orange-700/70 dark:text-orange-300/70 font-medium px-1 py-0.5 bg-orange-100/50 dark:bg-orange-900/30 rounded">
                  {is24Hour ? `${hour}:00` : hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                </span>
              </div>
            ))}
          </div>
          
          {/* Events column with time slot grid */}
          <div className="col-span-1 relative bg-gradient-to-br from-orange-50/20 via-amber-50/10 to-yellow-50/5 dark:from-orange-950/10 dark:via-amber-950/5 dark:to-yellow-950/2">
            {/* Time slot grid for clicking */}
            <TimeSlotGrid
              selectedDate={selectedDate}
              businessHours={businessHours}
              is24Hour={is24Hour}
              onTimeSlotClick={handleTimeSlotClick}
              className="absolute inset-0 z-10"
            />
            
            {/* Meetings */}
            {dayMeetings.map((meeting) => {
              const timePosition = getMeetingTimePosition(meeting);
              const duration = getMeetingDuration(meeting);
              const isNow = isMeetingNow(meeting);
              const status = getMeetingStatus(meeting);
              const syncStatus = syncingEvents[meeting.id];
              
              return (
                <DraggableEvent
                  key={meeting.id}
                  meeting={meeting}
                  timePosition={timePosition}
                  duration={duration}
                  isNow={isNow}
                  status={status}
                  onEventClick={handleEventClick}
                  onEventDrop={handleEventDrop}
                  getFormattedTime={getFormattedTime}
                  syncStatus={syncStatus}
                />
              );
            })}
            
            {/* Current time indicator */}
            <div 
              className="absolute left-0 right-0 border-t border-red-500 z-50 pointer-events-none"
              style={{ top: `${currentTimePosition * 80}px` }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 absolute -top-1.5 -left-1"></div>
            </div>
          </div>
        </div>
      </ScrollArea>
      
      {/* Meeting Details Modal */}
      <EventDetailModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        event={selectedMeeting}
        onJoinClick={onJoinMeeting}
        onJoinWithBot={handleJoinMeetingWithBot}
        joiningMeetings={joiningMeetings}
      />

      {/* Event Creation Modal */}
      {creationTime && primaryCalendar && (
        <EventCreationModal
          open={isCreationModalOpen}
          onOpenChange={setIsCreationModalOpen}
          initialStartTime={creationTime.start}
          initialEndTime={creationTime.end}
          calendarId={primaryCalendar.external_id}
          onEventCreated={handleEventCreated}
        />
      )}
    </div>
  );
};

export default DayCalendarView;
