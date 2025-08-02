import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Calendar, Loader2, AlertCircle, CheckCircle, RefreshCw, ChevronLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authentication...');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [authCheckAttempts, setAuthCheckAttempts] = useState(0);
  
  const addDebugLog = (msg: string) => {
    console.log(`[Auth Callback Debug] ${msg}`);
    setDebugInfo(prev => [...prev, msg]);
  };
  
  // Log some basic browser information to help with debugging
  useEffect(() => {
    console.log("[App DEBUG] Browser information:", navigator.userAgent);
    console.log("[App DEBUG] Current URL:", window.location.href);
    console.log("[App DEBUG] Protocol:", window.location.protocol);
    console.log("[App DEBUG] Hostname:", window.location.hostname);
    console.log("[App DEBUG] Origin:", window.location.origin);
  }, []);
  
  useEffect(() => {
    // Auto-redirect countdown after success or error
    if (!isProcessing && !isRetrying && redirectCountdown > 0) {
      const timer = setTimeout(() => setRedirectCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (!isProcessing && !isRetrying && redirectCountdown === 0) {
      navigate('/app/calendar');
    }
  }, [redirectCountdown, isProcessing, isRetrying, navigate]);
  
  // Wait for auth to be ready before proceeding
  useEffect(() => {
    if (!user && authCheckAttempts < 30) {
      addDebugLog(`Waiting for authentication to be ready (attempt ${authCheckAttempts + 1}/30)...`);
      const timer = setTimeout(() => setAuthCheckAttempts(prev => prev + 1), 200);
      return () => clearTimeout(timer);
    }
  }, [user, authCheckAttempts]);
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        if (authCheckAttempts < 30 && !user) {
          // Still waiting for auth to be ready
          return;
        }
        
        setMessage('Completing authentication process...');
        addDebugLog('Starting authentication callback processing');
        
        // Get the OAuth provider from localStorage
        const provider = localStorage.getItem('oauth_provider');
        addDebugLog(`OAuth provider from localStorage: ${provider || 'not set'}`);
        
        if (!provider) {
          setStatus('error');
          setMessage('Error: OAuth provider not found');
          setErrorDetails('Missing OAuth provider information. Please try connecting again.');
          toast({
            title: "Authentication failed",
            description: "OAuth provider not specified",
            variant: "destructive"
          });
          setIsProcessing(false);
          return;
        }
        
        // Check if we're logged in
        addDebugLog(`User authentication state: ${user ? 'authenticated' : 'not authenticated'}`);
        if (!user) {
          setStatus('error');
          setMessage('Error: You must log in first');
          setErrorDetails('You must be logged in to connect a calendar. Please log in and try again.');
          toast({
            title: "Authentication failed", 
            description: "You must be logged in", 
            variant: "destructive"
          });
          setIsProcessing(false);
          
          // Give user a chance to see the error message before redirecting
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 3000);
          return;
        }
        
        // Get the code from the URL
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        addDebugLog(`URL parameters - code: ${code ? 'present' : 'missing'}, error: ${error || 'none'}`);
        
        if (!code) {
          const errorMsg = errorDescription || error || 'Authentication failed';
          setStatus('error');
          setMessage(`Error: ${errorMsg}`);
          setErrorDetails(`OAuth provider returned error: ${errorMsg}`);
          toast({
            title: "Authentication failed", 
            description: errorMsg, 
            variant: "destructive"
          });
          setIsProcessing(false);
          return;
        }
        
        // Exchange code for token
        setMessage(`Connecting your ${provider === 'google' ? 'Google Calendar' : 'Microsoft Calendar'}...`);
        
        addDebugLog(`Exchanging code for token with provider: ${provider}`);
        addDebugLog(`Current origin: ${window.location.origin}`);
        addDebugLog(`Current full URL: ${window.location.href}`);
        
        // We'll try multiple times with increasing backoff
        let attempts = 0;
        const maxAttempts = 3;  // Increased to 3 attempts
        let success = false;
        let lastError = null;
        let responseData = null;
        
        while (attempts < maxAttempts && !success) {
          try {
            attempts++;
            addDebugLog(`Token exchange attempt ${attempts}/${maxAttempts}`);
            
            const response = await supabase.functions.invoke('calendar-auth', {
              body: { 
                action: `${provider}-token`,
                code: code,
                userId: user.id,
                origin: window.location.origin
              },
            });
            
            addDebugLog(`Token exchange response: ${JSON.stringify(response.data || 'no data')}`);
            
            if (response.error) {
              addDebugLog(`Token exchange error (attempt ${attempts}): ${response.error.message}`);
              lastError = response.error;
              
              if (attempts < maxAttempts) {
                addDebugLog(`Waiting before retry attempt ${attempts + 1}...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * attempts));  // Exponential backoff
              }
            } else {
              success = true;
              responseData = response.data;
            }
          } catch (attemptError: any) {
            addDebugLog(`Token exchange error (attempt ${attempts}): ${attemptError.message}`);
            lastError = attemptError;
            
            if (attempts < maxAttempts) {
              addDebugLog(`Waiting before retry attempt ${attempts + 1}...`);
              await new Promise(resolve => setTimeout(resolve, 1000 * attempts));  // Exponential backoff
            }
          }
        }
        
        if (!success) {
          addDebugLog(`Final exception during token exchange: ${lastError?.message || 'Unknown error'}`);
          console.error('[Auth Callback] Token exchange exception:', lastError);
          setStatus('error');
          setMessage('Error connecting calendar');
          
          // Enhanced error details with troubleshooting steps
          if (lastError?.message?.includes('not authenticated') || lastError?.message?.includes('must be logged in')) {
            setErrorDetails(`Failed to connect calendar: You must be logged in. Please try logging in again and then reconnect your calendar.`);
          } else {
            setErrorDetails(`Failed to connect calendar: ${lastError?.message || 'Unknown error'}. You can try again or go back to the calendar page.`);
          }
          
          toast({
            title: "Calendar connection failed", 
            description: lastError?.message || 'Unknown error', 
            variant: "destructive"
          });
          setIsProcessing(false);
          return;
        }
        
        if (responseData?.success) {
          addDebugLog('Calendar connected successfully');
          setStatus('success');
          setMessage('Calendar connected successfully!');
          toast({
            title: "Success", 
            description: `${provider === 'google' ? 'Google Calendar' : 'Microsoft Calendar'} connected successfully`, 
            variant: "default"
          });
          
          // Clear the localStorage provider
          localStorage.removeItem('oauth_provider');
          setIsProcessing(false);
        } else {
          addDebugLog(`Error in response: ${responseData?.message || 'Unknown error'}`);
          setStatus('error');
          setMessage('Error: ' + (responseData?.message || 'Unknown error'));
          setErrorDetails(`Failed to connect calendar: ${responseData?.message || 'Unknown error'}`);
          toast({
            title: "Failed to connect calendar", 
            description: responseData?.message || 'Unknown error', 
            variant: "destructive"
          });
          setIsProcessing(false);
        }
      } catch (error: any) {
        addDebugLog(`Unexpected error: ${error.message || error}`);
        console.error('[Auth Callback] Auth callback error:', error);
        setStatus('error');
        setMessage('Error: An unexpected error occurred');
        setErrorDetails(`An unexpected error occurred: ${error.message || 'Please try again later.'}`);
        toast({
            title: "Authentication failed", 
            description: "An unexpected error occurred", 
            variant: "destructive"
        });
        setIsProcessing(false);
      }
    };
    
    handleCallback();
  }, [searchParams, navigate, user, retryCount, authCheckAttempts]);
  
  const handleRetry = () => {
    setIsRetrying(true);
    setStatus('processing');
    setMessage('Retrying authentication process...');
    setErrorDetails(null);
    setTimeout(() => {
      setRetryCount(prev => prev + 1);
      setIsRetrying(false);
      setIsProcessing(true);
    }, 1000);
  };
  
  const goToCalendar = () => {
    navigate('/app/calendar', { replace: true });
  };
  
  const goBack = () => {
    navigate(-1);
  };
  
  useGoogleAnalytics();
  
  // If we've waited too long for auth, show an error
  if (authCheckAttempts >= 30 && !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-muted/20 dark:bg-muted/10 p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl text-center">Authentication Error</CardTitle>
            <CardDescription className="text-center">
              You must be logged in to connect a calendar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Not Authenticated</AlertTitle>
              <AlertDescription>
                Please log in first before trying to connect your calendar.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate('/login')} variant="default">
              Go to Login Page
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted/20 dark:bg-muted/10 p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            {isProcessing || isRetrying ? (
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            ) : status === 'success' ? (
              <CheckCircle className="h-8 w-8 text-green-500" />
            ) : (
              <AlertCircle className="h-8 w-8 text-destructive" />
            )}
          </div>
          <CardTitle className="text-2xl text-center">Calendar Authentication</CardTitle>
          <CardDescription className="text-center">{message}</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {errorDetails && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorDetails}</AlertDescription>
            </Alert>
          )}
          
          {!isProcessing && !isRetrying && (
            <div className="text-center text-sm text-muted-foreground">
              {status === 'success' 
                ? `Automatically redirecting to calendar in ${redirectCountdown} seconds...` 
                : 'You can retry or go back to the calendar page.'}
            </div>
          )}
          
          {/* Debug Information Section (Collapsed by default) */}
          {debugInfo.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <details className="text-sm">
                <summary className="cursor-pointer text-sm text-blue-500 hover:text-blue-700 font-medium">
                  Technical Details
                </summary>
                <div className="mt-2 bg-muted/30 dark:bg-muted/20 p-3 rounded text-xs overflow-auto max-h-96">
                  {debugInfo.map((log, index) => (
                    <div key={index} className="mb-1 font-mono">{log}</div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </CardContent>
        
        {!isProcessing && !isRetrying && (
          <CardFooter className="flex justify-center gap-2">
            {status === 'error' && (
              <Button 
                onClick={handleRetry} 
                variant="default"
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            )}
            
            <Button 
              onClick={status === 'success' ? goToCalendar : goBack}
              variant={status === 'success' ? "default" : "outline"}
              className="flex items-center gap-1"
            >
              {status !== 'success' && <ChevronLeft className="h-4 w-4" />}
              {status === 'success' ? 'Go to Calendar' : 'Go Back'}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default AuthCallback;
