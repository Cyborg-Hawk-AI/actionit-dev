import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Bot, CheckCircle, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getRecallCalendar, listRecallCalendarEvents } from '@/lib/recall-calendar';
import { toast } from 'sonner';

interface RecallCalendarStatusProps {
  className?: string;
}

export const RecallCalendarStatus: React.FC<RecallCalendarStatusProps> = ({ className }) => {
  const { user, session } = useAuth();
  const [calendarStatus, setCalendarStatus] = useState<any>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const hasRecallCalendar = user?.recallCalendarId && user?.recallCalendarStatus;

  useEffect(() => {
    if (hasRecallCalendar) {
      loadCalendarStatus();
    }
  }, [hasRecallCalendar]);

  const loadCalendarStatus = async () => {
    if (!user?.recallCalendarId) return;
    
    setLoading(true);
    try {
      const calendar = await getRecallCalendar(user.recallCalendarId);
      setCalendarStatus(calendar);
      
      // Load upcoming events
      const events = await listRecallCalendarEvents(user.recallCalendarId);
      const upcoming = events
        .filter(event => !event.is_deleted && new Date(event.start_time) > new Date())
        .slice(0, 5); // Show next 5 events
      setUpcomingEvents(upcoming);
    } catch (error) {
      console.error('Failed to load calendar status:', error);
      toast.error('Failed to load Recall.ai calendar status');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadCalendarStatus();
      toast.success('Calendar status refreshed');
    } catch (error) {
      toast.error('Failed to refresh calendar status');
    } finally {
      setRefreshing(false);
    }
  };

  if (!hasRecallCalendar) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recall.ai Calendar Integration
          </CardTitle>
          <CardDescription>
            Connect your Google Calendar to automatically schedule bots for your meetings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>No Recall.ai calendar connected. Connect your Google Calendar to get started.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'disconnected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'syncing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4" />;
      case 'disconnected':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <RefreshCw className="h-4 w-4" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recall.ai Calendar Integration
            </CardTitle>
            <CardDescription>
              Your Google Calendar is connected to Recall.ai for automatic bot scheduling
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading calendar status...</span>
          </div>
        ) : (
          <>
            {/* Calendar Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Calendar Status:</span>
                <Badge className={getStatusColor(calendarStatus?.status || 'unknown')}>
                  {getStatusIcon(calendarStatus?.status || 'unknown')}
                  <span className="ml-1 capitalize">
                    {calendarStatus?.status || 'Unknown'}
                  </span>
                </Badge>
              </div>
              {calendarStatus?.platform_email && (
                <span className="text-sm text-muted-foreground">
                  {calendarStatus.platform_email}
                </span>
              )}
            </div>

            {/* Calendar ID */}
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Calendar ID:</span> {user.recallCalendarId}
            </div>

            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  Upcoming Meetings (Bots will join automatically)
                </h4>
                <div className="space-y-2">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-2 bg-muted rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-sm">{event.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(event.start_time).toLocaleString()}
                        </div>
                      </div>
                      {event.meeting_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a
                            href={event.meeting_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Join
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No upcoming events */}
            {upcomingEvents.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No upcoming meetings found</p>
                <p className="text-xs">Bots will automatically join meetings when they're scheduled</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
