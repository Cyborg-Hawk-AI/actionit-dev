
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
  ExternalLink
} from 'lucide-react';
import { format, parseISO, isToday, isSameDay } from 'date-fns';
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
  title = "Today's Meetings",
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
  
  return (
    <Card className={cn("overflow-hidden h-full", className)}>
      <CardHeader className="bg-card border-b">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              {totalMeetings !== undefined ? `${totalMeetings} upcoming` : 
                `${meetings.length} meeting${meetings.length !== 1 ? 's' : ''} scheduled`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading meetings...</p>
            </div>
          </div>
        ) : meetings.length === 0 ? (
          <div className="text-center py-10">
            <CalendarIcon className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
            <h4 className="text-base font-medium mb-1">No meetings scheduled</h4>
            <p className="text-sm text-muted-foreground">Enjoy your free time!</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div>
              {meetings.map((meeting) => {
                const isNow = isMeetingNow(meeting);
                const status = getMeetingStatus(meeting);
                
                return (
                  <div 
                    key={meeting.id} 
                    className={cn(
                      "border-b last:border-0 p-3 hover:bg-muted/10 transition-colors cursor-pointer",
                      isNow && "bg-primary/5"
                    )}
                    onClick={() => handleOpenMeetingModal(meeting)}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2.5 h-2.5 rounded-full" 
                          style={{ backgroundColor: meeting.calendar_color || '#4285F4' }}
                        />
                        <h4 className="font-medium truncate">{meeting.title}</h4>
                      </div>
                      
                      {isNow && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                          Now
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center flex-wrap gap-2 text-xs text-muted-foreground mb-2">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>
                          {format(parseISO(meeting.start_time), 'h:mm a')} - {format(parseISO(meeting.end_time), 'h:mm a')}
                        </span>
                      </div>
                      
                      {meeting.attendees_count > 0 && (
                        <div className="flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          <span>{meeting.attendees_count}</span>
                        </div>
                      )}
                      
                      {!isToday(parseISO(meeting.start_time)) && (
                        <div className="text-xs px-1.5 py-0.5 bg-muted/60 rounded-full">
                          {format(parseISO(meeting.start_time), 'EEE, MMM d')}
                        </div>
                      )}
                    </div>
                    
                    {meeting.meeting_url && (
                      <div className="flex flex-wrap gap-2 mt-1">
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
                                <ToggleGroupItem value="audio_only" size="sm" onClick={(e) => e.stopPropagation()}>
                                  <Headphones className="h-3 w-3" />
                                </ToggleGroupItem>
                              </TooltipTrigger>
                              <TooltipContent>
                                Audio Only
                              </TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <ToggleGroupItem value="speaker_view" size="sm" onClick={(e) => e.stopPropagation()}>
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
                          className="h-7 text-xs"
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
                          className="h-7 text-xs"
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

      {/* Meeting Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          {selectedMeeting && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedMeeting.title}</DialogTitle>
                <DialogDescription>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="w-4 h-4 mr-1.5" />
                      <span className="text-sm">
                        {format(parseISO(selectedMeeting.start_time), 'h:mm a')} - {format(parseISO(selectedMeeting.end_time), 'h:mm a')}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-muted-foreground">
                      <CalendarIcon className="w-4 h-4 mr-1.5" />
                      <span className="text-sm">{format(parseISO(selectedMeeting.start_time), 'EEEE, MMMM d')}</span>
                    </div>
                  </div>
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 my-2">
                {/* Calendar info */}
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: selectedMeeting.calendar_color || '#4285F4' }}
                  ></div>
                  <span className="text-sm">{selectedMeeting.calendar_name || 'Calendar'}</span>
                </div>
                
                {/* Attendees */}
                {selectedMeeting.attendees_count > 0 && (
                  <div className="flex items-start">
                    <Users className="w-4 h-4 mt-0.5 mr-2 text-muted-foreground" />
                    <div>
                      <p className="text-sm">{selectedMeeting.attendees_count} {selectedMeeting.attendees_count === 1 ? 'attendee' : 'attendees'}</p>
                    </div>
                  </div>
                )}
                
                {/* Status */}
                <div className="flex items-center">
                  <span className="text-sm font-medium mr-2">Status:</span>
                  <Badge className={cn(
                    isMeetingNow(selectedMeeting) 
                      ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {getMeetingStatus(selectedMeeting)}
                  </Badge>
                </div>
                
                <Separator />
                
                {/* Bot settings */}
                {onUpdateMeeting && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label htmlFor="auto-join" className="text-sm font-medium">Auto-join with bot</label>
                      <Switch 
                        id="auto-join" 
                        checked={selectedMeeting.auto_join}
                        onCheckedChange={() => onUpdateMeeting(selectedMeeting.id, 'auto_join', selectedMeeting.auto_join)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label htmlFor="auto-record" className="text-sm font-medium">Record meeting</label>
                      <Switch 
                        id="auto-record" 
                        checked={selectedMeeting.auto_record}
                        onCheckedChange={() => onUpdateMeeting(selectedMeeting.id, 'auto_record', selectedMeeting.auto_record)}
                      />
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Bot join mode</p>
                      <ToggleGroup 
                        type="single" 
                        value={meetingJoinModes[selectedMeeting.id] || 'speaker_view'} 
                        onValueChange={(value) => value && onSetJoinMode(selectedMeeting.id, value as JoinMode)}
                        className="justify-start"
                      >
                        <ToggleGroupItem value="audio_only" aria-label="Audio Only">
                          <Headphones className="h-4 w-4 mr-1" />
                          Audio Only
                        </ToggleGroupItem>
                        <ToggleGroupItem value="speaker_view" aria-label="Video">
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
                      className="w-full sm:w-auto"
                      onClick={() => onJoinMeeting(selectedMeeting.meeting_url as string)}
                    >
                      <ExternalLink className="w-4 h-4 mr-1.5" />
                      Open Meeting
                    </Button>
                    
                    <Button 
                      className="w-full sm:w-auto"
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
