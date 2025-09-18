import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Database, 
  Key, 
  User, 
  RefreshCw,
  Download,
  Trash2
} from 'lucide-react';
import { 
  createTestSession, 
  testGoogleOAuthFlow, 
  testTokenRetrieval,
  generateTestReport,
  exportTestData,
  validateOAuthConfiguration,
  type TestSession 
} from '@/lib/oauth-testing';
import { getUserOAuthTokens, cleanupExpiredTokens } from '@/lib/dynamodb-storage';

export function OAuthTestPanel() {
  const [testSession, setTestSession] = useState<TestSession | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [configValidation, setConfigValidation] = useState<any>(null);
  const [userTokens, setUserTokens] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Validate configuration on component mount
  useEffect(() => {
    const validateConfig = async () => {
      const validation = await validateOAuthConfiguration();
      setConfigValidation(validation);
    };
    validateConfig();
  }, []);

  const startOAuthTest = async () => {
    try {
      setIsRunning(true);
      const session = createTestSession();
      setTestSession(session);
      setTestResults(null);
      
      // For testing, we'll simulate the OAuth flow
      // In a real scenario, you'd redirect to Google OAuth
      const result = await testGoogleOAuthFlow(session);
      setTestResults(result);
      
    } catch (error) {
      console.error('OAuth test failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const testTokenRetrieval = async () => {
    if (!testSession?.userId) return;
    
    try {
      setIsLoading(true);
      const result = await testTokenRetrieval(testSession, testSession.userId);
      setTestResults(prev => ({ ...prev, tokenRetrieval: result }));
    } catch (error) {
      console.error('Token retrieval test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserTokens = async () => {
    if (!testSession?.userId) return;
    
    try {
      setIsLoading(true);
      const tokens = await getUserOAuthTokens(testSession.userId);
      setUserTokens(tokens);
    } catch (error) {
      console.error('Failed to load user tokens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cleanupTokens = async () => {
    try {
      setIsLoading(true);
      const cleanedCount = await cleanupExpiredTokens();
      alert(`Cleaned up ${cleanedCount} expired tokens`);
      if (testSession?.userId) {
        await loadUserTokens();
      }
    } catch (error) {
      console.error('Failed to cleanup tokens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportTestReport = () => {
    if (!testSession) return;
    
    const report = generateTestReport(testSession);
    const dataStr = exportTestData(testSession);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `oauth-test-${testSession.sessionId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (success: boolean) => {
    return success ? (
      <Badge variant="default" className="bg-green-500">
        <CheckCircle className="w-3 h-3 mr-1" />
        Success
      </Badge>
    ) : (
      <Badge variant="destructive">
        <XCircle className="w-3 h-3 mr-1" />
        Failed
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Play className="w-5 h-5 mr-2" />
            OAuth Flow Testing
          </CardTitle>
          <CardDescription>
            Test Google OAuth authentication flow and DynamoDB storage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Configuration Validation */}
          {configValidation && (
            <Alert className={configValidation.valid ? "border-green-200" : "border-red-200"}>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>
                Configuration {configValidation.valid ? 'Valid' : 'Invalid'}
              </AlertTitle>
              <AlertDescription>
                {configValidation.valid ? (
                  'All required configuration is present'
                ) : (
                  <div>
                    <p>Issues found:</p>
                    <ul className="list-disc list-inside mt-2">
                      {configValidation.issues.map((issue: string, index: number) => (
                        <li key={index} className="text-sm">{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Test Controls */}
          <div className="flex gap-2">
            <Button 
              onClick={startOAuthTest} 
              disabled={isRunning}
              className="flex items-center"
            >
              {isRunning ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              {isRunning ? 'Running Test...' : 'Start OAuth Test'}
            </Button>
            
            {testSession && (
              <>
                <Button 
                  onClick={testTokenRetrieval} 
                  disabled={!testSession.userId || isLoading}
                  variant="outline"
                >
                  <Database className="w-4 h-4 mr-2" />
                  Test Token Retrieval
                </Button>
                
                <Button 
                  onClick={loadUserTokens} 
                  disabled={!testSession.userId || isLoading}
                  variant="outline"
                >
                  <User className="w-4 h-4 mr-2" />
                  Load User Tokens
                </Button>
                
                <Button 
                  onClick={exportTestReport} 
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </>
            )}
          </div>

          {/* Test Results */}
          {testResults && (
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="steps">Steps</TabsTrigger>
                <TabsTrigger value="responses">Responses</TabsTrigger>
                <TabsTrigger value="errors">Errors</TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Test Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Session ID</p>
                        <p className="font-mono text-sm">{testSession?.sessionId}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Flow ID</p>
                        <p className="font-mono text-sm">{testSession?.flowId}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        {getStatusBadge(testResults.success)}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">User ID</p>
                        <p className="font-mono text-sm">{testSession?.userId || 'N/A'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="steps" className="space-y-2">
                {testSession?.steps.map((step, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{step.step}</p>
                          <p className="text-sm text-muted-foreground">{step.timestamp}</p>
                        </div>
                        {getStatusBadge(step.success)}
                      </div>
                      {step.error && (
                        <Alert className="mt-2" variant="destructive">
                          <AlertDescription>{step.error}</AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
              
              <TabsContent value="responses" className="space-y-2">
                {testSession?.responses.map((response, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-sm">{response.type}</CardTitle>
                      <CardDescription>{response.timestamp}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-auto">
                        {JSON.stringify(response.data, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
              
              <TabsContent value="errors" className="space-y-2">
                {testSession?.errors.length === 0 ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>No Errors</AlertTitle>
                    <AlertDescription>No errors occurred during the test.</AlertDescription>
                  </Alert>
                ) : (
                  testSession?.errors.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertTitle>{error.step}</AlertTitle>
                      <AlertDescription>{error.error}</AlertDescription>
                    </Alert>
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* User Tokens */}
          {userTokens.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>User Tokens in DynamoDB</span>
                  <Button 
                    onClick={cleanupTokens} 
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Cleanup Expired
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {userTokens.map((token, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{token.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Provider: {token.provider} | Active: {token.isActive ? 'Yes' : 'No'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          Created: {new Date(token.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Last Used: {token.lastUsed ? new Date(token.lastUsed).toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
