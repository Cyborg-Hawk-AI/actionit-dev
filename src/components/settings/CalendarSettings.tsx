
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Link, Unlink, Loader2, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';
import { useCalendarData } from '@/hooks/useCalendarData';
import { connectGoogleCalendar } from '@/services/calendarService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function CalendarSettings() {
  const { user } = useAuth();
  const { calendars, isLoading, refreshData } = useCalendarData();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [lastConnectionError, setLastConnectionError] = useState<string | null>(null);
  
  // Enhanced connection detection
  const [calendarConnections, setCalendarConnections] = useState<any[]>([]);
  const [connectionCheckLoading, setConnectionCheckLoading] = useState(false);
  
  const hasConnectedCalendars = calendars.length > 0 || calendarConnections.length > 0;
  
  // Load connection data on component mount
  useEffect(() => {
    if (user) {
      checkAllConnections();
    }
  }, [user]);

  const checkAllConnections = async () => {
    if (!user) return;
    
    setConnectionCheckLoading(true);
    try {
      console.log("[CalendarSettings] Checking all connection types...");
      
      // Check calendar_connections table
      const { data: connections, error: connectionsError } = await supabase
        .from('calendar_connections')
        .select('*')
        .eq('user_id', user.id);
      
      console.log("[CalendarSettings] Calendar connections:", connections, connectionsError);
      
      // Check user_calendars table  
      const { data: userCalendars, error: calendarsError } = await supabase
        .from('user_calendars')
        .select('*')
        .eq('user_id', user.id);
      
      console.log("[CalendarSettings] User calendars:", userCalendars, calendarsError);
      
      // Check meetings table
      const { data: meetings, error: meetingsError } = await supabase
        .from('meetings')
        .select('id, title, calendar_external_id, calendar_name')
        .eq('user_id', user.id)
        .limit(5);
      
      console.log("[CalendarSettings] Sample meetings:", meetings, meetingsError);
      
      setCalendarConnections(connections || []);
      
    } catch (error) {
      console.error("[CalendarSettings] Error checking connections:", error);
    } finally {
      setConnectionCheckLoading(false);
    }
  };
  
  const handleConnectGoogle = async () => {
    if (!user) return;
    
    setIsConnecting(true);
    setLastConnectionError(null);
    
    try {
      await connectGoogleCalendar();
    } catch (error) {
      console.error('Failed to connect Google Calendar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setLastConnectionError(errorMessage);
      
      toast({
        title: "Connection Failed",
        description: `Failed to connect to Google Calendar: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCheckConnection = async () => {
    await checkAllConnections();
    await refreshData();
    
    toast({
      title: "Connection Check Complete",
      description: "Calendar connection status has been refreshed",
    });
  };
  
  const handleDisconnectGoogle = async () => {
    if (!user) return;
    
    setIsDisconnecting(true);
    try {
      console.log('Starting Google Calendar disconnection process...');
      
      // Delete in the correct order to avoid foreign key constraint violations
      // 1. First delete meetings (no foreign key dependencies)
      console.log('Deleting meetings...');
      const { error: meetingsError } = await supabase
        .from('meetings')
        .delete()
        .eq('user_id', user.id);
      
      if (meetingsError) {
        console.error('Error deleting meetings:', meetingsError);
        throw meetingsError;
      }
      
      // 2. Then delete user calendars (references calendar_connections)
      console.log('Deleting user calendars...');
      const { error: calendarsError } = await supabase
        .from('user_calendars')
        .delete()
        .eq('user_id', user.id);
      
      if (calendarsError) {
        console.error('Error deleting user calendars:', calendarsError);
        throw calendarsError;
      }
      
      // 3. Finally delete calendar connections (parent table)
      console.log('Deleting calendar connections...');
      const { error: connectionsError } = await supabase
        .from('calendar_connections')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', 'google');
      
      if (connectionsError) {
        console.error('Error deleting calendar connections:', connectionsError);
        throw connectionsError;
      }
      
      console.log('Google Calendar disconnection completed successfully');
      
      toast({
        title: "Calendar Disconnected",
        description: "Google Calendar has been disconnected and all data removed.",
      });
      
      // Clear local state and refresh
      setCalendarConnections([]);
      await refreshData();
      await checkAllConnections();
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
        {isLoading || connectionCheckLoading ? (
          <div className="py-2 flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading calendar status...
          </div>
        ) : hasConnectedCalendars ? (
          <>
            <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle>Google Calendar Connected</AlertTitle>
              <AlertDescription>
                Your Google Calendar is connected. 
                {calendars.length > 0 && (
                  <span> Found {calendars.length} calendar{calendars.length !== 1 ? 's' : ''}.</span>
                )}
                {calendarConnections.length > 0 && calendars.length === 0 && (
                  <span> Connection found but calendars may need syncing.</span>
                )}
              </AlertDescription>
            </Alert>
            
            {calendars.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Connected Calendars:</h4>
                <div className="space-y-1">
                  {calendars.map((calendar) => (
                    <div key={calendar.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: calendar.color }}
                        />
                        <span className="text-sm">{calendar.name}</span>
                        {calendar.is_primary && (
                          <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 py-0.5 rounded">
                            Primary
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleCheckConnection}
                className="flex-1"
                disabled={connectionCheckLoading}
              >
                {connectionCheckLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Check Connection
                  </>
                )}
              </Button>
              
              <Button 
                variant="destructive" 
                onClick={handleDisconnectGoogle}
                disabled={isDisconnecting}
                className="flex-1"
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
            </div>
            
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

            {lastConnectionError && (
              <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <AlertTitle>Connection Error</AlertTitle>
                <AlertDescription className="text-sm">
                  <div className="mb-2">Last connection attempt failed:</div>
                  <code className="text-xs bg-red-100 dark:bg-red-800 p-1 rounded">
                    {lastConnectionError}
                  </code>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={handleConnectGoogle}
                disabled={isConnecting}
                className="flex-1"
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
              
              <Button 
                variant="outline" 
                onClick={handleCheckConnection}
                className="flex-1"
                disabled={connectionCheckLoading}
              >
                {connectionCheckLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Check Connection
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
