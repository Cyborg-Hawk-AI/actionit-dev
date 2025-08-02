
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Video, Headphones, ArrowUpRight } from 'lucide-react';
import { type Meeting } from '@/services/calendarService';
import { format } from 'date-fns';
import { type JoinMode } from '@/services/recallService';

interface EventListProps {
  title: string;
  events: Meeting[];
  onJoinClick: (meetingUrl: string) => void;
  onJoinWithBot: (meetingId: string, joinMode?: JoinMode, openMeetingUrl?: boolean) => Promise<any>;
}

interface ExtendedMeeting extends Meeting {
  bot_scheduled?: boolean;
  bot_joined?: boolean;
}

const EventList = ({ title, events, onJoinClick, onJoinWithBot }: EventListProps) => {
  const [joiningMeetings, setJoiningMeetings] = useState<{[key: string]: boolean}>({});

  const handleJoinWithBot = async (meeting: Meeting) => {
    if (!meeting.meeting_url) return;
    
    setJoiningMeetings(prev => ({ ...prev, [meeting.id]: true }));
    
    try {
      console.log(`Attempting to join meeting with bot: ${meeting.id} (${meeting.title})`);
      console.log(`Meeting URL: ${meeting.meeting_url}`);
      
      await onJoinWithBot(meeting.id, 'audio_only', true);
    } catch (error) {
      console.error('Error joining meeting with bot:', error);
    } finally {
      setTimeout(() => {
        setJoiningMeetings(prev => ({ ...prev, [meeting.id]: false }));
      }, 3000);
    }
  };

  if (!events.length) {
    return (
      <Card className="overflow-hidden relative bg-gradient-to-br from-gray-50/80 via-slate-50/40 to-zinc-50/30 dark:from-gray-950/20 dark:via-slate-950/10 dark:to-zinc-950/5 border-gray-200/40 dark:border-gray-800/30">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600/70 dark:text-gray-400/70 text-sm">No meetings found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden relative bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-purple-50/30 dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-purple-950/5 border-blue-200/40 dark:border-blue-800/30">
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-100/30 to-transparent dark:from-blue-900/10 rounded-full -translate-y-10 translate-x-10"></div>
      <CardHeader className="relative">
        <CardTitle className="text-blue-900 dark:text-blue-100">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 relative">
        {events.map(meeting => {
          const extendedMeeting = meeting as ExtendedMeeting;
          
          return (
            <div 
              key={meeting.id}
              className="border border-blue-200/50 dark:border-blue-700/30 rounded-lg p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-white/50 dark:bg-gray-900/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: meeting.calendar_color || '#6E59A5' }}
                  />
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">{meeting.title || 'Untitled Meeting'}</h3>
                </div>
                <div className="text-sm text-blue-700/70 dark:text-blue-300/70 mb-2">
                  {format(new Date(meeting.start_time), 'h:mm a')} - 
                  {format(new Date(meeting.end_time), 'h:mm a')}
                </div>
                
                {meeting.description && (
                  <p className="text-sm text-blue-600/60 dark:text-blue-400/60 mt-1 line-clamp-1">{meeting.description}</p>
                )}
                
                <div className="flex gap-2 mt-2">
                  {extendedMeeting.bot_scheduled && (
                    <Badge variant="outline" className="bg-blue-100/50 text-blue-700 border-blue-300/50 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50">Bot scheduled</Badge>
                  )}
                  {extendedMeeting.bot_joined && (
                    <Badge variant="secondary" className="bg-green-100/50 text-green-700 border-green-300/50 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50">Bot joined</Badge>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 flex-shrink-0">
                {meeting.meeting_url && (
                  <Button
                    size="sm" 
                    variant="outline"
                    onClick={() => onJoinClick(meeting.meeting_url || '')}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                  >
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    Join
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={joiningMeetings[meeting.id]}
                  onClick={() => handleJoinWithBot(meeting)}
                  className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-300"
                >
                  {joiningMeetings[meeting.id] ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <Headphones className="mr-2 h-4 w-4" />
                      Join with Bot
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default EventList;
