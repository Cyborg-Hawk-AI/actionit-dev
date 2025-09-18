
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Link, Unlink, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';
import { checkCalendarAccess, getCalendars, type Calendar } from '@/lib/google-calendar';
import { toast } from '@/hooks/use-toast';

export function CalendarSettings() {
  const { user, loginWithGoogle } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check calendar connection status on component mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const hasAccess = await checkCalendarAccess();
        setIsConnected(hasAccess);
        
        if (hasAccess) {
          const userCalendars = await getCalendars();
          setCalendars(userCalendars);
        }
      } catch (error) {
        console.error('Failed to check calendar connection:', error);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, [user]);

  const handleConnectGoogle = async () => {
    try {
      setIsConnecting(true);
      await loginWithGoogle();
      // The OAuth flow will redirect, so we don't need to update state here
    } catch (error) {
      console.error('Failed to initiate Google OAuth:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to initiate Google OAuth. Please try again.",
        variant: "destructive"
      });
      setIsConnecting(false);
    }
  };
  
  const handleDisconnectGoogle = async () => {
    try {
      setIsDisconnecting(true);
      
      // For now, we'll just clear the local session
      // In a full implementation, you might want to revoke tokens
      setIsConnected(false);
      setCalendars([]);
      
      toast({
        title: "Calendar Disconnected",
        description: "Google Calendar has been disconnected.",
      });
    } catch (error) {
      console.error('Failed to disconnect Google Calendar:', error);
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect Google Calendar. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDisconnecting(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="mr-2 h-5 w-5" />
          Calendar Integration
        </CardTitle>
        <CardDescription>
          Connect your Google Calendar to sync meetings and events
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="py-2 flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Checking calendar connection...
          </div>
        ) : isConnected ? (
          <>
            <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle>Google Calendar Connected</AlertTitle>
              <AlertDescription>
                Your Google Calendar is connected and ready to sync meetings.
                {calendars.length > 0 && ` Found ${calendars.length} calendar${calendars.length !== 1 ? 's' : ''}.`}
              </AlertDescription>
            </Alert>
            
            {calendars.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Connected Calendars:</h4>
                <div className="space-y-1">
                  {calendars.slice(0, 5).map((calendar) => (
                    <div key={calendar.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: calendar.backgroundColor || '#4285f4' }}
                        />
                        <span className="text-sm">{calendar.summary}</span>
                        {calendar.primary && (
                          <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 py-0.5 rounded">
                            Primary
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {calendars.length > 5 && (
                    <div className="text-xs text-muted-foreground text-center">
                      ... and {calendars.length - 5} more calendars
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <Button 
              variant="destructive" 
              onClick={handleDisconnectGoogle}
              disabled={isDisconnecting}
              className="w-full"
            >
              {isDisconnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                <>
                  <Unlink className="mr-2 h-4 w-4" />
                  Disconnect Google Calendar
                </>
              )}
            </Button>
            
            <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription className="text-sm">
                Disconnecting will remove all synced calendar data and meetings from Action.IT. This action cannot be undone.
              </AlertDescription>
            </Alert>
          </>
        ) : (
          <>
            <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900">
              <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertTitle>No Calendar Connected</AlertTitle>
              <AlertDescription>
                Connect your Google Calendar to start syncing meetings and enable bot functionality.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={handleConnectGoogle}
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link className="mr-2 h-4 w-4" />
                  Connect Google Calendar
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
