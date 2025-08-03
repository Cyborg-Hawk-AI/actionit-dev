import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Users, 
  Video, 
  Mic, 
  AlertCircle, 
  CheckCircle, 
  Play, 
  Eye,
  ChevronRight,
  Star,
  Zap,
  Target,
  Building2,
  DollarSign
} from 'lucide-react';
import { format, isToday, isYesterday, isTomorrow, addDays, startOfDay, endOfDay } from 'date-fns';
import { Meeting } from '@/services/calendarService';
import { cn } from '@/lib/utils';

interface MeetingTimelineOverlayProps {
  meetings: Meeting[];
  selectedDate: Date;
  onMeetingClick: (meeting: Meeting) => void;
  onJoinMeeting: (meetingUrl: string) => void;
  onJoinWithBot: (meetingId: string) => Promise<void>;
  className?: string;
}

interface TimelineMeeting extends Meeting {
  status: 'past' | 'current' | 'upcoming';
  priority: 'high' | 'medium' | 'low';
  hasInsights: boolean;
  hasCRMContext: boolean;
  participantCount: number;
}

const MeetingTimelineOverlay: React.FC<MeetingTimelineOverlayProps> = ({
  meetings,
  selectedDate,
  onMeetingClick,
  onJoinMeeting,
  onJoinWithBot,
  className
}) => {
  const [hoveredMeeting, setHoveredMeeting] = useState<string | null>(null);

  // Process meetings for timeline display
  const timelineMeetings = useMemo(() => {
    const now = new Date();
    const startOfWeek = startOfDay(addDays(selectedDate, -3));
    const endOfWeek = endOfDay(addDays(selectedDate, 3));

    return meetings
      .filter(meeting => {
        const meetingDate = new Date(meeting.start_time);
        return meetingDate >= startOfWeek && meetingDate <= endOfWeek;
      })
      .map(meeting => {
        const meetingDate = new Date(meeting.start_time);
        const meetingEnd = new Date(meeting.end_time);
        
        let status: 'past' | 'current' | 'upcoming' = 'upcoming';
        if (meetingEnd < now) status = 'past';
        else if (meetingDate <= now && meetingEnd >= now) status = 'current';
        
        // Determine priority based on meeting title and attendees
        let priority: 'high' | 'medium' | 'low' = 'medium';
        const title = meeting.title.toLowerCase();
        if (title.includes('client') || title.includes('deal') || title.includes('sales') || title.includes('urgent')) {
          priority = 'high';
        } else if (title.includes('internal') || title.includes('sync') || title.includes('catch')) {
          priority = 'low';
        }

        // Mock data for demonstration
        const hasInsights = Math.random() > 0.3;
        const hasCRMContext = title.includes('client') || title.includes('deal');
        const participantCount = Math.floor(Math.random() * 8) + 1;

        return {
          ...meeting,
          status,
          priority,
          hasInsights,
          hasCRMContext,
          participantCount
        };
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [meetings, selectedDate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'past': return 'text-gray-400';
      case 'current': return 'text-blue-600';
      case 'upcoming': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'past': return <CheckCircle className="h-4 w-4" />;
      case 'current': return <Play className="h-4 w-4" />;
      case 'upcoming': return <Clock className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const formatMeetingTime = (meeting: TimelineMeeting) => {
    const start = new Date(meeting.start_time);
    const end = new Date(meeting.end_time);
    
    if (isToday(start)) {
      return `Today, ${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
    } else if (isTomorrow(start)) {
      return `Tomorrow, ${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
    } else if (isYesterday(start)) {
      return `Yesterday, ${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
    } else {
      return `${format(start, 'MMM d')}, ${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
    }
  };

  return (
    <Card className={cn("border-blue-200 dark:border-blue-800", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-blue-600" />
          Meeting Timeline
          <Badge variant="outline" className="text-xs">
            {timelineMeetings.length} meetings
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timelineMeetings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No meetings in this timeline</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
              
              <div className="space-y-4">
                {timelineMeetings.map((meeting, index) => (
                  <div
                    key={meeting.id}
                    className="relative group"
                    onMouseEnter={() => setHoveredMeeting(meeting.id)}
                    onMouseLeave={() => setHoveredMeeting(null)}
                  >
                    {/* Timeline dot */}
                    <div className="absolute left-4 top-2 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 bg-white dark:bg-gray-900 z-10">
                      <div className={cn("w-2 h-2 rounded-full mx-auto mt-0.5", getPriorityColor(meeting.priority))}></div>
                    </div>

                    {/* Meeting card */}
                    <Card className={cn(
                      "ml-12 transition-all duration-200 cursor-pointer",
                      hoveredMeeting === meeting.id ? "shadow-lg scale-[1.02]" : "shadow-sm",
                      meeting.status === 'current' ? "border-blue-300 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-950/20" : "",
                      meeting.status === 'past' ? "opacity-60" : ""
                    )}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm truncate">{meeting.title}</h4>
                              {meeting.hasInsights && (
                                <Badge variant="secondary" className="text-xs">
                                  <Zap className="h-3 w-3 mr-1" />
                                  Insights
                                </Badge>
                              )}
                              {meeting.hasCRMContext && (
                                <Badge variant="outline" className="text-xs">
                                  <Building2 className="h-3 w-3 mr-1" />
                                  CRM
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatMeetingTime(meeting)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {meeting.participantCount} participants
                              </span>
                            </div>

                            {/* Quick actions on hover */}
                            {hoveredMeeting === meeting.id && (
                              <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onMeetingClick(meeting)}
                                  className="h-6 text-xs"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Details
                                </Button>
                                {meeting.status === 'upcoming' && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => onJoinMeeting(meeting.url)}
                                      className="h-6 text-xs"
                                    >
                                      <Video className="h-3 w-3 mr-1" />
                                      Join
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => onJoinWithBot(meeting.id)}
                                      className="h-6 text-xs"
                                    >
                                      <Mic className="h-3 w-3 mr-1" />
                                      Bot
                                    </Button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1 ml-2">
                            {getStatusIcon(meeting.status)}
                            {meeting.priority === 'high' && (
                              <Star className="h-3 w-3 text-yellow-500" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Timeline Legend */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>High Priority</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Medium Priority</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Low Priority</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-6 text-xs">
              View All
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MeetingTimelineOverlay; 