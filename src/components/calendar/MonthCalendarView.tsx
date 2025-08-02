
import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, parseISO, isWithinInterval, addHours } from 'date-fns';
import { cn } from '@/lib/utils';
import { Meeting } from '@/services/calendarService';
import { JoinMode } from '@/services/recallService';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import EventDetailModal from './EventDetailModal';
import EventCreationModal from './EventCreationModal';

interface MonthCalendarViewProps {
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

const MonthCalendarView: React.FC<MonthCalendarViewProps> = ({
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

  // Get primary calendar for event creation
  const primaryCalendar = calendars.find(cal => cal.is_primary) || calendars[0];

  // Get the month boundaries
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  // Create array of all days to display
  const calendarDays: Date[] = [];
  let currentDay = calendarStart;
  while (currentDay <= calendarEnd) {
    calendarDays.push(new Date(currentDay));
    currentDay = addDays(currentDay, 1);
  }

  // Filter meetings for the month and enabled calendars
  const monthMeetings = meetings.filter(meeting => {
    const meetingDate = parseISO(meeting.start_time);
    const isInRange = meetingDate >= calendarStart && meetingDate <= calendarEnd;
    
    // Check if the meeting's calendar is enabled
    const calendar = calendars.find(cal => cal.external_id === meeting.calendar_external_id);
    const calendarEnabled = calendar ? enabledCalendars[calendar.id] !== false : true;
    
    return isInRange && calendarEnabled;
  });

  // Get meetings for a specific day
  const getMeetingsForDay = (day: Date) => {
    return monthMeetings.filter(meeting => {
      const meetingDate = parseISO(meeting.start_time);
      return isSameDay(meetingDate, day);
    });
  };

  // Check if a meeting is currently in progress
  const isMeetingNow = (meeting: Meeting) => {
    const meetingStart = parseISO(meeting.start_time);
    const meetingEnd = parseISO(meeting.end_time);
    return isWithinInterval(new Date(), { start: meetingStart, end: meetingEnd });
  };

  // Format time based on 12/24 hour preference
  const getFormattedTime = (date: Date) => {
    return is24Hour ? format(date, 'HH:mm') : format(date, 'h:mm a');
  };

  // Handle opening the meeting details modal
  const handleOpenMeetingModal = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setIsModalOpen(true);
  };

  // Handle day click for creating events
  const handleDayClick = (day: Date) => {
    if (!primaryCalendar) {
      toast({
        title: "No Calendar Connected",
        description: "Please connect a Google Calendar account first",
        variant: "destructive"
      });
      return;
    }
    
    // Set event to start at 9 AM on the clicked day
    const startTime = new Date(day);
    startTime.setHours(9, 0, 0, 0);
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

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex flex-col h-full">
      {/* Month header */}
      <div className="border-b py-3 px-4">
        <h2 className="text-lg font-semibold">{format(selectedDate, 'MMMM yyyy')}</h2>
      </div>

      {/* Calendar grid */}
      <div className="flex-grow bg-gradient-to-br from-purple-50/20 via-violet-50/10 to-indigo-50/5 dark:from-purple-950/10 dark:via-violet-950/5 dark:to-indigo-950/2">
        {/* Week day headers */}
        <div className="grid grid-cols-7 border-b">
          {weekDays.map((day) => (
            <div key={day} className="p-3 text-center font-medium text-sm bg-purple-50/30 dark:bg-purple-950/20 border-r border-purple-200/40 dark:border-purple-700/30">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 h-full">
          {calendarDays.map((day, index) => {
            const dayMeetings = getMeetingsForDay(day);
            const isCurrentMonth = day >= monthStart && day <= monthEnd;
            const isToday = isSameDay(day, new Date());
            
            return (
              <div
                key={index}
                onClick={() => handleDayClick(day)}
                className={cn(
                  "border-r border-b border-purple-200/40 dark:border-purple-700/30 p-2 min-h-[120px] cursor-pointer transition-colors",
                  "hover:bg-purple-50/30 dark:hover:bg-purple-950/20",
                  !isCurrentMonth && "bg-gray-50/50 dark:bg-gray-900/20 text-muted-foreground",
                  isCurrentMonth && "bg-white/20 dark:bg-purple-900/5",
                  isToday && "bg-purple-100/50 dark:bg-purple-900/30"
                )}
              >
                <div className={cn(
                  "text-sm font-medium mb-1",
                  isToday && "text-purple-700 dark:text-purple-300"
                )}>
                  {format(day, 'd')}
                </div>
                
                {/* Day meetings */}
                <div className="space-y-1">
                  {dayMeetings.slice(0, 3).map((meeting) => {
                    const isNow = isMeetingNow(meeting);
                    
                    return (
                      <div
                        key={meeting.id}
                        onClick={(e) => handleEventClick(meeting, e)}
                        className={cn(
                          "text-xs p-1 rounded cursor-pointer truncate transition-all",
                          "hover:shadow-sm hover:scale-[1.02]",
                          isNow && "ring-2 ring-green-500"
                        )}
                        style={{
                          backgroundColor: meeting.calendar_color || '#4285F4',
                          color: 'white',
                          opacity: new Date(meeting.end_time) < new Date() ? 0.7 : 1
                        }}
                      >
                        <div className="font-medium truncate">{meeting.title}</div>
                        <div className="text-xs opacity-90">
                          {getFormattedTime(parseISO(meeting.start_time))}
                        </div>
                        {isNow && (
                          <Badge className="bg-green-600 text-xs px-1 py-0 ml-1">LIVE</Badge>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Show +N more if there are additional meetings */}
                  {dayMeetings.length > 3 && (
                    <div className="text-xs text-muted-foreground pl-1">
                      +{dayMeetings.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
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

export default MonthCalendarView;
