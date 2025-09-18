
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, AlertTriangle, CheckCircle2, Loader2, Calendar } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

export function RecallSettings() {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  
  const handleCreateRecallCalendar = async () => {
    if (!user) {
      return;
    }
    
    setIsCreating(true);
    
    try {
      // TODO: Replace with AWS API Gateway call
      // For now, simulate success
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsConfigured(true);
      toast({
        title: "Success",
        description: "Recall.ai calendar created successfully"
      });
    } catch (error) {
      console.error("Failed to create Recall calendar:", error);
      toast({
        title: "Error",
        description: "Failed to create Recall.ai calendar. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
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
        {isConfigured ? (
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
            <Button 
              onClick={handleCreateRecallCalendar} 
              disabled={isCreating} 
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
