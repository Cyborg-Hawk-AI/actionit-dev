import React from 'react';
import { format, startOfDay, endOfDay, addDays, isSameDay } from 'date-fns';
import { Calendar, Clock, MapPin, Users, ExternalLink, Bot, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Meeting, UserCalendar } from '@/services/calendarService';
import { JoinMode } from '@/services/recallService';

interface AgendaViewProps {
  selectedDate: Date;
  meetings: Meeting[];
  enabledCalendars: {[id: string]: boolean};
  calendars: UserCalendar[];
  is24Hour: boolean;
  joiningMeetings: {[key: string]: boolean};
  meetingJoinModes: {[key: string]: JoinMode};
  onJoinMeeting: (meetingUrl: string) => void;
  onJoinMeetingWithBot: (meetingId: string, joinMode?: JoinMode) => Promise<void>;
  onSetJoinMode: (meetingId: string, mode: JoinMode) => void;
  onUpdateMeeting: (meetingId: string, setting: 'auto_join' | 'auto_record', currentValue: boolean) => void;
  onEventClick: (meeting: Meeting) => void;
}

const AgendaView: React.FC<AgendaViewProps> = ({
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
  const getMeetingsForDateRange = (startDate: Date, days: number) => {
    const endDate = addDays(startDate, days);
    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.start_time);
      return meetingDate >= startOfDay(startDate) && meetingDate < endOfDay(endDate);
    }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  };

  const agendaMeetings = getMeetingsForDateRange(selectedDate, 7);
  
  const groupedMeetings = agendaMeetings.reduce((groups, meeting) => {
    const meetingDate = format(new Date(meeting.start_time), 'yyyy-MM-dd');
    if (!groups[meetingDate]) {
      groups[meetingDate] = [];
    }
    groups[meetingDate].push(meeting);
    return groups;
  }, {} as Record<string, Meeting[]>);

  const handleJoinWithBot = async (meetingId: string) => {
    const joinMode = meetingJoinModes[meetingId] || 'audio_only';
    await onJoinMeetingWithBot(meetingId, joinMode);
  };

  return (
    <div className="p-4 space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Agenda View
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {format(selectedDate, 'MMMM d, yyyy')} - {format(addDays(selectedDate, 6), 'MMMM d, yyyy')}
        </p>
      </div>

      {Object.keys(groupedMeetings).length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No meetings found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            There are no meetings scheduled for this week.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedMeetings).map(([dateStr, dayMeetings]) => {
            const date = new Date(dateStr);
            const isToday = isSameDay(date, new Date());
            
            return (
              <Card key={dateStr} className={isToday ? "border-blue-500 shadow-md" : ""}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {format(date, 'EEEE, MMMM d')}
                    {isToday && (
                      <Badge variant="default" className="ml-2">Today</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dayMeetings.map((meeting) => {
                    const calendar = calendars.find(cal => cal.external_id === meeting.calendar_external_id);
                    const isJoining = joiningMeetings[meeting.id] || false;
                    
                    return (
                      <div
                        key={meeting.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                        onClick={() => onEventClick(meeting)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {calendar && (
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: calendar.color }}
                                />
                              )}
                              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                {meeting.title}
                              </h4>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {format(new Date(meeting.start_time), is24Hour ? 'HH:mm' : 'h:mm a')} - 
                                {format(new Date(meeting.end_time), is24Hour ? 'HH:mm' : 'h:mm a')}
                              </div>
                              
                              {meeting.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {meeting.location}
                                </div>
                              )}
                              
                              {meeting.attendees_count && (
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  {meeting.attendees_count}
                                </div>
                              )}
                            </div>
                            
                            {meeting.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                {meeting.description}
                              </p>
                            )}
                            
                            <div className="flex gap-2">
                              {meeting.auto_join && (
                                <Badge variant="secondary" className="text-xs">
                                  Auto Join
                                </Badge>
                              )}
                              {meeting.auto_record && (
                                <Badge variant="secondary" className="text-xs">
                                  Auto Record
                                </Badge>
                              )}
                              {meeting.platform && (
                                <Badge variant="outline" className="text-xs">
                                  {meeting.platform}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                            {meeting.meeting_url && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => onJoinMeeting(meeting.meeting_url!)}
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Join
                              </Button>
                            )}
                            
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleJoinWithBot(meeting.id)}
                              disabled={isJoining}
                            >
                              {isJoining ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  Joining...
                                </>
                              ) : (
                                <>
                                  <Bot className="h-4 w-4 mr-1" />
                                  Bot
                                </>
                              )}
                            </Button>
                            
                            <div className="flex items-center gap-2">
                              <Switch
                                id={`auto-join-${meeting.id}`}
                                checked={meeting.auto_join || false}
                                onCheckedChange={() => onUpdateMeeting(meeting.id, 'auto_join', meeting.auto_join || false)}
                              />
                              <Label htmlFor={`auto-join-${meeting.id}`} className="text-xs">
                                Auto Join
                              </Label>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Switch
                                id={`auto-record-${meeting.id}`}
                                checked={meeting.auto_record || false}
                                onCheckedChange={() => onUpdateMeeting(meeting.id, 'auto_record', meeting.auto_record || false)}
                              />
                              <Label htmlFor={`auto-record-${meeting.id}`} className="text-xs">
                                Auto Record
                              </Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AgendaView;
