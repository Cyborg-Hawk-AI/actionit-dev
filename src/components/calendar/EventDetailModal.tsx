
import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, ExternalLink, Bot, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Meeting } from '@/services/calendarService';
import { JoinMode } from '@/services/recallService';

interface EventDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Meeting | null;
  onJoinClick: (meetingUrl: string) => void;
  onJoinWithBot: (meetingId: string) => Promise<void>;
  joiningMeetings: {[key: string]: boolean};
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({
  open,
  onOpenChange,
  event,
  onJoinClick,
  onJoinWithBot,
  joiningMeetings
}) => {
  const [selectedJoinMode, setSelectedJoinMode] = useState<JoinMode>('audio_only');

  // Memoize the join handler to prevent re-renders
  const handleJoinWithBot = useCallback(async () => {
    if (!event) return;
    
    try {
      await onJoinWithBot(event.id);
    } catch (error) {
      console.error('Failed to join with bot:', error);
    }
  }, [event, onJoinWithBot]);

  // Memoize the direct join handler
  const handleDirectJoin = useCallback(() => {
    if (!event?.meeting_url) return;
    onJoinClick(event.meeting_url);
  }, [event, onJoinClick]);

  if (!event) return null;

  const startTime = parseISO(event.start_time);
  const endTime = parseISO(event.end_time);
  const isJoining = joiningMeetings[event.id] || false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {event.title}
          </DialogTitle>
          <DialogDescription>
            Meeting details and join options
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Meeting Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">
                  {format(startTime, 'MMM d, yyyy')}
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                </div>
              </div>
            </div>
            
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{event.location}</span>
              </div>
            )}
            
            {event.attendees_count && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{event.attendees_count} attendees</span>
              </div>
            )}
            
            {event.calendar_name && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{event.calendar_name}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {event.meeting_url && (
              <Button 
                onClick={handleDirectJoin}
                className="flex-1"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Join Meeting
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={handleJoinWithBot}
              disabled={isJoining}
              className="flex-1"
            >
              {isJoining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining with Bot...
                </>
              ) : (
                <>
                  <Bot className="mr-2 h-4 w-4" />
                  Join with Bot
                </>
              )}
            </Button>
          </div>

          {/* Meeting Status */}
          <div className="flex gap-2">
            {event.auto_join && (
              <Badge variant="secondary">
                Auto Join Enabled
              </Badge>
            )}
            {event.auto_record && (
              <Badge variant="secondary">
                Auto Record Enabled
              </Badge>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailModal;
