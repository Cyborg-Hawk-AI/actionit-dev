
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, AlertTriangle, CheckCircle2, ExternalLink, Loader2, Calendar, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';
import { useRecallData } from '@/hooks/useRecallData';
import { Link } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

export function RecallSettings() {
  const { user } = useAuth();
  const { isLoading, recordings, recentRecordings, totalMeetings, createRecallCalendarFromGoogle } = useRecallData();
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  
  // We're considering the integration configured if there are any recordings
  const isConfigured = recordings.length > 0 || recentRecordings.length > 0 || totalMeetings > 0;
  
  useEffect(() => {
    // Reset error state when component mounts or user changes
    setErrorMessage(null);
  }, [user, recordings, recentRecordings, totalMeetings]);
  
  const handleCreateRecallCalendar = async () => {
    if (!user) {
      return;
    }
    
    setIsCreating(true);
    setErrorMessage(null);
    
    try {
      const result = await createRecallCalendarFromGoogle(user.id);
      
      if (result) {
        console.log("Recall calendar created successfully:", result);
        toast({
          title: "Success",
          description: "Recall.ai calendar created successfully"
        });
      } else {
        throw new Error("Failed to create Recall calendar - no calendar data returned");
      }
    } catch (error) {
      console.error("Failed to create Recall calendar:", error);
      let errorMsg = "Unknown error occurred";
      
      if (error instanceof Error) {
        errorMsg = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Try to extract useful error information
        try {
          errorMsg = JSON.stringify(error);
        } catch (e) {
          errorMsg = String(error);
        }
      } else {
        errorMsg = String(error);
      }
      
      setErrorMessage(`Failed to create Recall calendar: ${errorMsg}`);
      toast({
        title: "Error",
        description: "Failed to create Recall.ai calendar. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleRetry = () => {
    setIsRetrying(true);
    setErrorMessage(null);
    
    // Simulate a brief delay before retrying
    setTimeout(() => {
      handleCreateRecallCalendar();
      setIsRetrying(false);
    }, 1000);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Mic className="mr-2 h-5 w-5" />
          Recall.ai Integration
        </CardTitle>
        <CardDescription>
          Configure Recall.ai integration for meeting recording and transcription
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="py-2 flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading Recall.ai status...
          </div>
        ) : isConfigured ? (
          <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle>Integration Active</AlertTitle>
            <AlertDescription>
              Recall.ai integration is properly configured.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertTitle>Setup Required</AlertTitle>
              <AlertDescription>
                Recall.ai integration is not configured. Follow the setup guide to enable meeting bot functionality.
              </AlertDescription>
            </Alert>
            <div className="py-2">
              <h3 className="text-sm font-medium mb-2">Required steps:</h3>
              <ol className="list-decimal pl-5 text-sm space-y-1 text-muted-foreground">
                <li>Connect your Google Calendar (if not already done)</li>
                <li>Create a Recall.ai calendar using the button below</li>
                <li>Start scheduling and joining meetings with the bot</li>
              </ol>
            </div>
            {errorMessage && (
              <Alert variant="destructive" className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription className="text-sm break-words">
                  {errorMessage}
                  <div className="mt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRetry} 
                      disabled={isRetrying || isCreating}
                      className="text-xs"
                    >
                      {isRetrying ? (
                        <>
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          Retrying...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-1 h-3 w-3" />
                          Retry
                        </>
                      )}
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            {!isConfigured && (
              <Button 
                onClick={handleCreateRecallCalendar} 
                disabled={isCreating || isRetrying} 
                className="mt-2"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Calendar...
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2 h-4 w-4" />
                    Create Recall Calendar
                  </>
                )}
              </Button>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Link to="/docs/recall-ai-integration-setup" target="_blank" rel="noopener">
          <Button variant="outline" size="sm" className="text-xs">
            <ExternalLink className="mr-1 h-3 w-3" />
            View Setup Guide
          </Button>
        </Link>
        
        {isConfigured && (
          <div className="text-xs text-muted-foreground">
            {totalMeetings} {totalMeetings === 1 ? 'meeting' : 'meetings'} recorded
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
