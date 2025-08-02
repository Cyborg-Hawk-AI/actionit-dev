
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Video, 
  Mic, 
  Clock, 
  Users, 
  Calendar as CalendarIcon,
  Headphones,
  Loader2,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { format, parseISO, isToday, isSameDay, addDays, isWithinInterval } from 'date-fns';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Meeting } from '@/services/calendarService';
import { JoinMode } from '@/services/recallService';

interface DashboardCalendarCardProps {
  meetings: Meeting[];
  title?: string;
  totalMeetings?: number;
  loading?: boolean;
  joiningMeetings: {[key: string]: boolean};
  meetingJoinModes: {[key: string]: JoinMode};
  onJoinMeeting: (meetingUrl: string) => void;
  onJoinMeetingWithBot: (meetingId: string) => void;
  onSetJoinMode: (meetingId: string, mode: JoinMode) => void;
  onUpdateMeeting?: (meetingId: string, setting: 'auto_join' | 'auto_record', currentValue: boolean) => void;
  className?: string;
}

export function DashboardCalendarCard({
  meetings,
  title,
  totalMeetings,
  loading = false,
  joiningMeetings,
  meetingJoinModes,
  onJoinMeeting,
  onJoinMeetingWithBot,
  onSetJoinMode,
  onUpdateMeeting,
  className
}: DashboardCalendarCardProps) {
  const [selectedMeeting, setSelectedMeeting] = React.useState<Meeting | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  
  // Filter meetings based on availability
  const todayMeetings = meetings.filter(meeting => 
    isToday(parseISO(meeting.start_time))
  );
  
  const nextThreeDays = meetings.filter(meeting => {
    const meetingDate = parseISO(meeting.start_time);
    const today = new Date();
    const threeDaysFromNow = addDays(today, 3);
    return isWithinInterval(meetingDate, { start: today, end: threeDaysFromNow }) && !isToday(meetingDate);
  });
  
  // Determine which meetings to show and card title
  const displayMeetings = todayMeetings.length > 0 ? todayMeetings : nextThreeDays;
  const hasAnyMeetings = todayMeetings.length > 0 || nextThreeDays.length > 0;
  
  const getCardTitle = () => {
    if (todayMeetings.length > 0) {
      return "Today's Meetings";
    } else if (nextThreeDays.length > 0) {
      return "Upcoming Meetings";
    }
    return "No Meetings Scheduled";
  };
  
  const getCardDescription = () => {
    if (todayMeetings.length > 0) {
      return `${todayMeetings.length} meeting${todayMeetings.length !== 1 ? 's' : ''} today`;
    } else if (nextThreeDays.length > 0) {
      return `${nextThreeDays.length} meeting${nextThreeDays.length !== 1 ? 's' : ''} in the next 3 days`;
    }
    return "Enjoy your free time!";
  };
  
  const isMeetingNow = (meeting: Meeting) => {
    const now = new Date();
    const start = parseISO(meeting.start_time);
    const end = parseISO(meeting.end_time);
    
    return now >= start && now <= end;
  };
  
  const getMeetingStatus = (meeting: Meeting) => {
    const now = new Date();
    const start = parseISO(meeting.start_time);
    const end = parseISO(meeting.end_time);
    
    if (now >= start && now <= end) {
      return "In Progress";
    } else if (now < start) {
      return "Upcoming";
    } else {
      return "Completed";
    }
  };

  const handleOpenMeetingModal = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setIsModalOpen(true);
  };

  const handleCloseMeetingModal = () => {
    setIsModalOpen(false);
    setSelectedMeeting(null);
  };
  
  // If no meetings exist, return a minimal card
  if (!hasAnyMeetings && !loading) {
    return (
      <Card className={cn("overflow-hidden bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-purple-50/30 dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-purple-950/10 backdrop-blur-sm border-blue-200/50 dark:border-blue-800/30 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] rounded-xl", className)}>
        <CardHeader className="bg-gradient-to-r from-blue-100/50 to-indigo-100/50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-blue-200/30 dark:border-blue-800/20">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full p-2">
              <CalendarIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-blue-900 dark:text-blue-100">{getCardTitle()}</CardTitle>
              <CardDescription className="text-blue-700/70 dark:text-blue-300/70">{getCardDescription()}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <CalendarIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="text-base font-medium mb-2 text-blue-900 dark:text-blue-100">No meetings scheduled</h4>
            <p className="text-sm text-blue-700/70 dark:text-blue-300/70">Enjoy your free time!</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={cn("overflow-hidden h-full bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-purple-50/30 dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-purple-950/10 backdrop-blur-sm border-blue-200/50 dark:border-blue-800/30 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] rounded-xl", className)}>
      <CardHeader className="bg-gradient-to-r from-blue-100/50 to-indigo-100/50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-blue-200/30 dark:border-blue-800/20">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full p-2">
              <CalendarIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-blue-900 dark:text-blue-100">{getCardTitle()}</CardTitle>
              <CardDescription className="text-blue-700/70 dark:text-blue-300/70">
                {getCardDescription()}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-2"></div>
              <p className="text-sm text-blue-700/70 dark:text-blue-300/70">Loading meetings...</p>
            </div>
          </div>
        ) : displayMeetings.length === 0 ? (
          <div className="text-center py-10">
            <div className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <CalendarIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="text-base font-medium mb-1 text-blue-900 dark:text-blue-100">No meetings scheduled</h4>
            <p className="text-sm text-blue-700/70 dark:text-blue-300/70">Enjoy your free time!</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div>
              {displayMeetings.map((meeting) => {
                const isNow = isMeetingNow(meeting);
                const status = getMeetingStatus(meeting);
                
                return (
                  <div 
                    key={meeting.id} 
                    className={cn(
                      "border-b border-blue-200/30 dark:border-blue-800/20 last:border-0 p-4 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all duration-200 cursor-pointer",
                      isNow && "bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200/50 dark:border-green-800/30"
                    )}
                    onClick={() => handleOpenMeetingModal(meeting)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full shadow-sm" 
                          style={{ backgroundColor: meeting.calendar_color || '#4285F4' }}
                        />
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 truncate">{meeting.title}</h4>
                      </div>
                      
                      {isNow && (
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm">
                          <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                          Now
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center flex-wrap gap-3 text-sm text-blue-700/70 dark:text-blue-300/70 mb-3">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1.5" />
                        <span>
                          {format(parseISO(meeting.start_time), 'h:mm a')} - {format(parseISO(meeting.end_time), 'h:mm a')}
                        </span>
                      </div>
                      
                      {meeting.attendees_count > 0 && (
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1.5" />
                          <span>{meeting.attendees_count}</span>
                        </div>
                      )}
                      
                      {!isToday(parseISO(meeting.start_time)) && (
                        <div className="text-xs px-2 py-1 bg-blue-100/50 dark:bg-blue-900/30 rounded-full text-blue-700 dark:text-blue-300">
                          {format(parseISO(meeting.start_time), 'EEE, MMM d')}
                        </div>
                      )}
                    </div>
                    
                    {meeting.meeting_url && (
                      <div className="flex flex-wrap gap-2">
                        <TooltipProvider>
                          <ToggleGroup 
                            type="single" 
                            value={meetingJoinModes[meeting.id] || 'speaker_view'} 
                            onValueChange={(value) => value && onSetJoinMode(meeting.id, value as JoinMode)}
                            className="flex items-center gap-1"
                            size="sm"
                          >
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <ToggleGroupItem value="audio_only" size="sm" onClick={(e) => e.stopPropagation()} className="hover:bg-blue-100 dark:hover:bg-blue-900/30">
                                  <Headphones className="h-3 w-3" />
                                </ToggleGroupItem>
                              </TooltipTrigger>
                              <TooltipContent>
                                Audio Only
                              </TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <ToggleGroupItem value="speaker_view" size="sm" onClick={(e) => e.stopPropagation()} className="hover:bg-blue-100 dark:hover:bg-blue-900/30">
                                  <Video className="h-3 w-3" />
                                </ToggleGroupItem>
                              </TooltipTrigger>
                              <TooltipContent>
                                Video Recording
                              </TooltipContent>
                            </Tooltip>
                          </ToggleGroup>
                        </TooltipProvider>
                        
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          className="h-7 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
                          onClick={(e) => {
                            e.stopPropagation();
                            onJoinMeeting(meeting.meeting_url as string);
                          }}
                        >
                          <Video className="w-3 h-3 mr-1" />
                          Join
                        </Button>
                        
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 text-xs border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-200 hover:scale-[1.02]"
                          onClick={(e) => {
                            e.stopPropagation();
                            onJoinMeetingWithBot(meeting.id);
                          }}
                          disabled={joiningMeetings[meeting.id]}
                        >
                          {joiningMeetings[meeting.id] ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <Mic className="w-3 h-3 mr-1" />
                              Join with Bot
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      {/* Enhanced Meeting Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-blue-200/50 dark:border-blue-800/30">
          {selectedMeeting && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full p-2">
                    <CalendarIcon className="h-4 w-4 text-white" />
                  </div>
                  <DialogTitle className="text-xl text-blue-900 dark:text-blue-100">{selectedMeeting.title}</DialogTitle>
                </div>
                <DialogDescription className="text-blue-700/70 dark:text-blue-300/70">
                  <div className="flex flex-wrap gap-3 mt-2">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1.5 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm">
                        {format(parseISO(selectedMeeting.start_time), 'h:mm a')} - {format(parseISO(selectedMeeting.end_time), 'h:mm a')}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-1.5 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm">{format(parseISO(selectedMeeting.start_time), 'EEEE, MMMM d')}</span>
                    </div>
                  </div>
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 my-2">
                {/* Calendar info */}
                <div className="flex items-center p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg">
                  <div 
                    className="w-3 h-3 rounded-full mr-3 shadow-sm" 
                    style={{ backgroundColor: selectedMeeting.calendar_color || '#4285F4' }}
                  ></div>
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">{selectedMeeting.calendar_name || 'Calendar'}</span>
                </div>
                
                {/* Attendees */}
                {selectedMeeting.attendees_count > 0 && (
                  <div className="flex items-start p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg">
                    <Users className="w-4 h-4 mt-0.5 mr-3 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">{selectedMeeting.attendees_count} {selectedMeeting.attendees_count === 1 ? 'attendee' : 'attendees'}</p>
                    </div>
                  </div>
                )}
                
                {/* Status */}
                <div className="flex items-center p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg">
                  <span className="text-sm font-medium mr-3 text-blue-900 dark:text-blue-100">Status:</span>
                  <Badge className={cn(
                    "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm",
                    !isMeetingNow(selectedMeeting) && "bg-gradient-to-r from-blue-500 to-indigo-500"
                  )}>
                    {getMeetingStatus(selectedMeeting)}
                  </Badge>
                </div>
                
                <Separator className="bg-blue-200/50 dark:bg-blue-800/30" />
                
                {/* Bot settings */}
                {onUpdateMeeting && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg">
                      <label htmlFor="auto-join" className="text-sm font-medium text-blue-900 dark:text-blue-100">Auto-join with bot</label>
                      <Switch 
                        id="auto-join" 
                        checked={selectedMeeting.auto_join}
                        onCheckedChange={() => onUpdateMeeting(selectedMeeting.id, 'auto_join', selectedMeeting.auto_join)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg">
                      <label htmlFor="auto-record" className="text-sm font-medium text-blue-900 dark:text-blue-100">Record meeting</label>
                      <Switch 
                        id="auto-record" 
                        checked={selectedMeeting.auto_record}
                        onCheckedChange={() => onUpdateMeeting(selectedMeeting.id, 'auto_record', selectedMeeting.auto_record)}
                      />
                    </div>
                    
                    <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg">
                      <p className="text-sm font-medium mb-3 text-blue-900 dark:text-blue-100">Bot join mode</p>
                      <ToggleGroup 
                        type="single" 
                        value={meetingJoinModes[selectedMeeting.id] || 'speaker_view'} 
                        onValueChange={(value) => value && onSetJoinMode(selectedMeeting.id, value as JoinMode)}
                        className="justify-start"
                      >
                        <ToggleGroupItem value="audio_only" aria-label="Audio Only" className="hover:bg-blue-100 dark:hover:bg-blue-900/30">
                          <Headphones className="h-4 w-4 mr-1" />
                          Audio Only
                        </ToggleGroupItem>
                        <ToggleGroupItem value="speaker_view" aria-label="Video" className="hover:bg-blue-100 dark:hover:bg-blue-900/30">
                          <Video className="h-4 w-4 mr-1" />
                          Video
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-2">
                {selectedMeeting.meeting_url && (
                  <>
                    <Button 
                      variant="outline" 
                      className="w-full sm:w-auto border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-200 hover:scale-[1.02]"
                      onClick={() => onJoinMeeting(selectedMeeting.meeting_url as string)}
                    >
                      <ExternalLink className="w-4 h-4 mr-1.5" />
                      Open Meeting
                    </Button>
                    
                    <Button 
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
                      onClick={() => onJoinMeetingWithBot(selectedMeeting.id)}
                      disabled={joiningMeetings[selectedMeeting.id]}
                    >
                      <Mic className="w-4 h-4 mr-1.5" />
                      Join with Bot
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
