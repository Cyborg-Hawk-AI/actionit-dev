
import React, { useState } from 'react';
import { format, startOfWeek, addDays, parseISO, getHours, getMinutes, differenceInHours, differenceInMinutes, isWithinInterval, isSameHour, addHours } from 'date-fns';
import { cn } from '@/lib/utils';
import { Meeting } from '@/services/calendarService';
import { JoinMode } from '@/services/recallService';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import EventDetailModal from './EventDetailModal';
import EventCreationModal from './EventCreationModal';

interface WeekCalendarViewProps {
  selectedDate: Date;
  meetings: Meeting[];
  enabledCalendars: {[id: string]: boolean};
  calendars: any[];
  is24Hour: boolean;
  joiningMeetings: {[key: string]: boolean};
  meetingJoinModes: {[key: string]: JoinMode};
  onJoinMeeting: (meetingUrl: string) => void;
  onJoinMeetingWithBot: (meetingId: string) => Promise<void>;
  onSetJoinMode: (meetingId: string, mode: JoinMode) => void;
  onUpdateMeeting: (meetingId: string, setting: 'auto_join' | 'auto_record', currentValue: boolean) => void;
  onEventClick: (meeting: Meeting) => void;
}

const WeekCalendarView: React.FC<WeekCalendarViewProps> = ({
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
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
  const [creationTime, setCreationTime] = useState<{ start: Date; end: Date } | null>(null);
  const { toast } = useToast();

  // Get the start of the week and create array of 7 days
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 }); // Sunday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  // Create business hours array (24 hours)
  const businessHours = Array.from({ length: 24 }, (_, i) => i);
  
  // Get primary calendar for event creation
  const primaryCalendar = calendars.find(cal => cal.is_primary) || calendars[0];
  
  // Filter meetings for the week and enabled calendars
  const weekMeetings = meetings.filter(meeting => {
    const meetingDate = parseISO(meeting.start_time);
    const meetingDay = new Date(meetingDate);
    meetingDay.setHours(0, 0, 0, 0);
    
    const isInWeek = weekDays.some(day => {
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      return meetingDay.getTime() === dayStart.getTime();
    });
    
    // Check if the meeting's calendar is enabled
    const calendar = calendars.find(cal => cal.external_id === meeting.calendar_external_id);
    const calendarEnabled = calendar ? enabledCalendars[calendar.id] !== false : true;
    
    return isInWeek && calendarEnabled;
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
    
    return diffHours + (diffMinutes / 60);
  };

  // Get which day column a meeting belongs to
  const getMeetingDayIndex = (meeting: Meeting) => {
    const meetingDate = parseISO(meeting.start_time);
    const meetingDay = new Date(meetingDate);
    meetingDay.setHours(0, 0, 0, 0);
    
    return weekDays.findIndex(day => {
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      return meetingDay.getTime() === dayStart.getTime();
    });
  };

  // Handle opening the meeting details modal
  const handleOpenMeetingModal = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setIsModalOpen(true);
  };

  // Handle time slot click for creating events
  const handleTimeSlotClick = (dayIndex: number, hour: number, minute: number = 0) => {
    if (!primaryCalendar) {
      toast({
        title: "No Calendar Connected",
        description: "Please connect a Google Calendar account first",
        variant: "destructive"
      });
      return;
    }
    
    const startTime = new Date(weekDays[dayIndex]);
    startTime.setHours(hour, minute, 0, 0);
    const endTime = addHours(startTime, 1); // Default 1 hour duration
    
    setCreationTime({ start: startTime, end: endTime });
    setIsCreationModalOpen(true);
  };

  // Handle event click - open modal instead of navigating
  const handleEventClick = (meeting: Meeting, event: React.MouseEvent) => {
    event.stopPropagation();
    handleOpenMeetingModal(meeting);
  };

  const handleEventCreated = () => {
    // The useCreateEvent mutation will automatically refresh the data
    setCreationTime(null);
  };

  // Calculate current time for the time indicator
  const now = new Date();
  const currentHour = getHours(now);
  const currentMinute = getMinutes(now);
  const currentTimePosition = currentHour + (currentMinute / 60);

  return (
    <div className="flex flex-col h-full">
      {/* Week header */}
      <div className="border-b py-3 px-4">
        <div className="grid grid-cols-8 gap-2">
          <div className="text-center">
            <span className="text-sm text-muted-foreground">Time</span>
          </div>
          {weekDays.map((day, index) => (
            <div key={index} className="text-center">
              <div className="font-medium">{format(day, 'EEE')}</div>
              <div className="text-sm text-muted-foreground">{format(day, 'MMM d')}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Week view with enhanced hour blocks */}
      <ScrollArea className="flex-grow">
        <div className="relative grid grid-cols-8 min-h-[1200px]">
          {/* Hours labels */}
          <div className="col-span-1 border-r pr-2 text-right bg-gradient-to-r from-green-50/30 to-emerald-50/20 dark:from-green-950/10 dark:to-emerald-950/5">
            {businessHours.map((hour) => (
              <div key={`hour-${hour}`} className="h-20 border-b border-green-200/40 dark:border-green-700/30 flex items-end justify-end pb-1">
                <span className="text-xs text-green-700/70 dark:text-green-300/70 font-medium px-1 py-0.5 bg-green-100/50 dark:bg-green-900/30 rounded">
                  {is24Hour ? `${hour}:00` : hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                </span>
              </div>
            ))}
          </div>
          
          {/* Day columns */}
          {weekDays.map((day, dayIndex) => (
            <div key={dayIndex} className="col-span-1 relative bg-gradient-to-br from-green-50/20 via-emerald-50/10 to-teal-50/5 dark:from-green-950/10 dark:via-emerald-950/5 dark:to-teal-950/2 border-r border-green-200/40 dark:border-green-700/30">
              {/* Time slot grid for clicking */}
              {businessHours.map((hour) => (
                <div key={`time-slot-${dayIndex}-${hour}`} className="relative">
                  {/* Hour slot */}
                  <div
                    className={cn(
                      "h-20 border-b border-green-200/50 dark:border-green-700/30 cursor-pointer",
                      "hover:bg-green-50/30 dark:hover:bg-green-950/20 transition-colors",
                      hour % 2 === 0 ? "bg-green-50/20 dark:bg-green-950/5" : "bg-white/20 dark:bg-green-900/5"
                    )}
                    onClick={() => handleTimeSlotClick(dayIndex, hour)}
                  >
                    {/* 30-minute divider */}
                    <div
                      className="absolute top-10 left-0 right-0 h-px bg-green-200/40 dark:bg-green-700/20 cursor-pointer hover:bg-green-200/60"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTimeSlotClick(dayIndex, hour, 30);
                      }}
                    />
                  </div>
                </div>
              ))}
              
              {/* Meetings for this day */}
              {weekMeetings
                .filter(meeting => getMeetingDayIndex(meeting) === dayIndex)
                .map((meeting) => {
                  const timePosition = getMeetingTimePosition(meeting);
                  const duration = getMeetingDuration(meeting);
                  const isNow = isMeetingNow(meeting);
                  
                  // Position and size calculation
                  const top = timePosition * 80; // 80px per hour (h-20)
                  const height = duration * 80;
                  
                  return (
                    <div
                      key={meeting.id}
                      onClick={(e) => handleEventClick(meeting, e)}
                      className={cn(
                        "absolute left-1.5 right-1.5 rounded p-2 overflow-hidden cursor-pointer transition-all z-20",
                        "hover:shadow-md hover:z-30 hover:left-1 hover:right-1",
                        isNow ? "border-l-4 border-green-500" : "border-l-4"
                      )}
                      style={{
                        top: `${top}px`,
                        height: `${Math.max(height, 24)}px`, // Minimum 24px height
                        backgroundColor: meeting.calendar_color || '#4285F4',
                        borderLeftColor: isNow ? '#22c55e' : meeting.calendar_color || '#4285F4',
                        opacity: new Date(meeting.end_time) < new Date() ? 0.7 : 1
                      }}
                    >
                      <div className="text-white font-medium text-xs truncate">
                        {meeting.title}
                      </div>
                      <div className="text-white text-xs opacity-90">
                        {getFormattedTime(parseISO(meeting.start_time))}
                      </div>
                      
                      {isNow && (
                        <Badge className="absolute bottom-1 right-1 bg-green-600 text-xs px-1 py-0">LIVE</Badge>
                      )}
                    </div>
                  );
                })}
              
              {/* Current time indicator - only show on today's column */}
              {format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && (
                <div 
                  className="absolute left-0 right-0 border-t border-red-500 z-50 pointer-events-none"
                  style={{ top: `${currentTimePosition * 80}px` }}
                >
                  <div className="w-2 h-2 rounded-full bg-red-500 absolute -top-1 -left-1"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      
      {/* Meeting Details Modal */}
      <EventDetailModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        event={selectedMeeting}
        onJoinClick={onJoinMeeting}
        onJoinWithBot={async (meetingId) => {
          await onJoinMeetingWithBot(meetingId);
        }}
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

export default WeekCalendarView;
