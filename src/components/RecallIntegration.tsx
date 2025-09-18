import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Bot, RefreshCw, ExternalLink, Clock, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  meeting_url?: string;
  attendees: Array<{
    email: string;
    name?: string;
    response_status: string;
  }>;
  location?: string;
  is_private: boolean;
}

interface RecallIntegrationStatus {
  connected: boolean;
  calendar_id?: string;
  status?: string;
  last_sync?: string;
}

const RecallIntegration: React.FC = () => {
  const { user, session } = useAuth();
  const [integrationStatus, setIntegrationStatus] = useState<RecallIntegrationStatus>({
    connected: false,
  });
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && session) {
      checkIntegrationStatus();
      fetchUpcomingEvents();
    }
  }, [user, session]);

  const checkIntegrationStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/recall/calendar');
      if (response.ok) {
        const data = await response.json();
        setIntegrationStatus({
          connected: true,
          calendar_id: data.results?.[0]?.id,
          status: data.results?.[0]?.status,
        });
      } else {
        setIntegrationStatus({ connected: false });
      }
    } catch (err) {
      console.error('Failed to check integration status:', err);
      setError('Failed to check integration status');
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/recall/events');
      if (response.ok) {
        const data = await response.json();
        setUpcomingEvents(data.results || []);
      }
    } catch (err) {
      console.error('Failed to fetch upcoming events:', err);
      setError('Failed to fetch upcoming events');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const isGoogleMeetUrl = (url: string) => {
    return url && url.includes('meet.google.com');
  };

  const getEventStatus = (event: CalendarEvent) => {
    const now = new Date();
    const startTime = new Date(event.start_time);
    const endTime = new Date(event.end_time);
    
    if (now < startTime) {
      return 'upcoming';
    } else if (now >= startTime && now <= endTime) {
      return 'in-progress';
    } else {
      return 'completed';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="secondary">Upcoming</Badge>;
      case 'in-progress':
        return <Badge variant="default">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Recall.ai Integration
          </CardTitle>
          <CardDescription>
            Automatically join Google Meet meetings with AI bots
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                integrationStatus.connected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="font-medium">
                {integrationStatus.connected ? 'Connected' : 'Not Connected'}
              </span>
            </div>
            <Button
              onClick={checkIntegrationStatus}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          {integrationStatus.connected && (
            <div className="mt-4 text-sm text-muted-foreground">
              <p>Calendar ID: {integrationStatus.calendar_id}</p>
              <p>Status: {integrationStatus.status}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Meetings
          </CardTitle>
          <CardDescription>
            Google Meet meetings that will have AI bots join automatically
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading events...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>{error}</p>
              <Button onClick={fetchUpcomingEvents} variant="outline" className="mt-2">
                Try Again
              </Button>
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No upcoming meetings found</p>
              <p className="text-sm">Create a Google Meet meeting to see it here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingEvents.map((event) => {
                const status = getEventStatus(event);
                const hasGoogleMeet = isGoogleMeetUrl(event.meeting_url || '');
                
                return (
                  <div
                    key={event.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{event.title}</h3>
                          {getStatusBadge(status)}
                          {hasGoogleMeet && (
                            <Badge variant="default" className="bg-blue-500">
                              <Bot className="h-3 w-3 mr-1" />
                              Bot Scheduled
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatDateTime(event.start_time)}
                          </div>
                          {event.attendees.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {event.attendees.length} attendees
                            </div>
                          )}
                        </div>
                        
                        {event.location && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Location: {event.location}
                          </p>
                        )}
                      </div>
                      
                      {event.meeting_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(event.meeting_url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Join
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RecallIntegration;
