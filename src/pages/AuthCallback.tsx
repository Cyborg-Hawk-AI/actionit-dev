import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Calendar, Loader2, AlertCircle, CheckCircle, RefreshCw, ChevronLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleOAuthCallback } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authentication...');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
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
      navigate('/app/settings');
    }
  }, [redirectCountdown, isProcessing, isRetrying, navigate]);
  
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        setMessage('Completing authentication process...');
        addDebugLog('Starting Google OAuth callback processing');
        
        // Get the code from the URL
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        const state = searchParams.get('state');
        
        addDebugLog(`URL parameters - code: ${code ? 'present' : 'missing'}, error: ${error || 'none'}`);
        addDebugLog(`Current origin: ${window.location.origin}`);
        addDebugLog(`Current full URL: ${window.location.href}`);
        
        if (!code) {
          const errorMsg = errorDescription || error || 'Authentication failed';
          setStatus('error');
          setMessage(`Error: ${errorMsg}`);
          setErrorDetails(`Google OAuth returned error: ${errorMsg}`);
          toast({
            title: "Authentication failed", 
            description: errorMsg, 
            variant: "destructive"
          });
          setIsProcessing(false);
          return;
        }
        
        setMessage('Exchanging authorization code for tokens...');
        addDebugLog('Calling handleOAuthCallback with authorization code');
        
        // Handle the OAuth callback
        await handleOAuthCallback(code, state || undefined);
        
        addDebugLog('OAuth callback completed successfully');
        setStatus('success');
        setMessage('Successfully signed in with Google!');
        toast({
          title: "Success", 
          description: "Google authentication completed successfully", 
          variant: "default"
        });
        
        setIsProcessing(false);
        
      } catch (error: any) {
        addDebugLog(`OAuth callback error: ${error.message || error}`);
        console.error('[Auth Callback] OAuth callback error:', error);
        setStatus('error');
        setMessage('Error: Authentication failed');
        setErrorDetails(`Authentication failed: ${error.message || 'Please try again later.'}`);
        toast({
            title: "Authentication failed", 
            description: error.message || "An unexpected error occurred", 
            variant: "destructive"
        });
        setIsProcessing(false);
      }
    };
    
    handleCallback();
  }, [searchParams, handleOAuthCallback]);
  
  const handleRetry = () => {
    setIsRetrying(true);
    setStatus('processing');
    setMessage('Retrying authentication process...');
    setErrorDetails(null);
    setTimeout(() => {
      setRetryCount(prev => prev + 1);
      setIsRetrying(false);
      setIsProcessing(true);
      // Trigger the callback again
      window.location.reload();
    }, 1000);
  };
  
  const goToSettings = () => {
    navigate('/app/settings', { replace: true });
  };
  
  const goBack = () => {
    navigate(-1);
  };
  
  
  
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
                ? `Automatically redirecting to settings in ${redirectCountdown} seconds...` 
                : 'You can retry or go back to the settings page.'}
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
              onClick={status === 'success' ? goToSettings : goBack}
              variant={status === 'success' ? "default" : "outline"}
              className="flex items-center gap-1"
            >
              {status !== 'success' && <ChevronLeft className="h-4 w-4" />}
              {status === 'success' ? 'Go to Settings' : 'Go Back'}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default AuthCallback;
