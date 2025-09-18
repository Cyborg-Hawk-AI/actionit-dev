import { 
  generateGoogleAuthUrl, 
  exchangeCodeForTokens, 
  getGoogleUserInfo,
  storeUserSession,
  type GoogleUserInfo,
  type OAuthTokens
} from './google-oauth';
import { 
  storeOAuthTokens, 
  getOAuthTokens, 
  logOAuthFlow,
  getUserOAuthTokens,
  type OAuthTokenRecord 
} from './dynamodb-storage';

// Testing configuration
const TESTING_CONFIG = {
  ENABLE_LOGGING: true,
  LOG_LEVEL: 'debug' as 'debug' | 'info' | 'warn' | 'error',
  CAPTURE_RESPONSES: true,
  STORE_IN_DYNAMODB: true,
} as const;

// Test session tracking
interface TestSession {
  sessionId: string;
  userId?: string;
  flowId: string;
  startTime: string;
  steps: TestStep[];
  responses: any[];
  errors: any[];
  ipAddress?: string;
  userAgent?: string;
}

interface TestStep {
  step: string;
  timestamp: string;
  data?: any;
  success: boolean;
  error?: string;
  duration?: number;
}

/**
 * Creates a new test session for OAuth flow testing
 */
export function createTestSession(ipAddress?: string, userAgent?: string): TestSession {
  const sessionId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const flowId = `flow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const session: TestSession = {
    sessionId,
    flowId,
    startTime: new Date().toISOString(),
    steps: [],
    responses: [],
    errors: [],
    ipAddress,
    userAgent,
  };
  
  if (TESTING_CONFIG.ENABLE_LOGGING) {
    console.log(`[OAuth Testing] Created test session: ${sessionId}`);
  }
  
  return session;
}

/**
 * Logs a test step with timing
 */
export function logTestStep(
  session: TestSession, 
  step: string, 
  data?: any, 
  success: boolean = true, 
  error?: string
): void {
  const stepData: TestStep = {
    step,
    timestamp: new Date().toISOString(),
    data,
    success,
    error,
  };
  
  session.steps.push(stepData);
  
  if (TESTING_CONFIG.ENABLE_LOGGING) {
    const logLevel = success ? 'info' : 'error';
    console[logLevel](`[OAuth Testing] ${step}: ${success ? 'SUCCESS' : 'FAILED'}`, {
      sessionId: session.sessionId,
      step,
      data,
      error,
    });
  }
  
  if (!success && error) {
    session.errors.push({ step, error, timestamp: stepData.timestamp });
  }
}

/**
 * Captures and stores OAuth response data
 */
export function captureResponse(session: TestSession, responseType: string, data: any): void {
  const response = {
    type: responseType,
    timestamp: new Date().toISOString(),
    data,
  };
  
  session.responses.push(response);
  
  if (TESTING_CONFIG.ENABLE_LOGGING) {
    console.log(`[OAuth Testing] Captured ${responseType} response:`, data);
  }
}

/**
 * Tests the complete Google OAuth flow
 */
export async function testGoogleOAuthFlow(
  session: TestSession,
  code?: string,
  state?: string
): Promise<{
  success: boolean;
  session: TestSession;
  tokens?: OAuthTokens;
  userInfo?: GoogleUserInfo;
  dynamoRecord?: OAuthTokenRecord;
}> {
  try {
    // Step 1: Generate OAuth URL
    logTestStep(session, 'generate_auth_url');
    const authUrl = await generateGoogleAuthUrl(state);
    captureResponse(session, 'auth_url', { url: authUrl });
    
    if (!code) {
      // Return URL for manual testing
      return {
        success: true,
        session,
      };
    }
    
    // Step 2: Exchange code for tokens
    logTestStep(session, 'exchange_code_for_tokens');
    const tokens = await exchangeCodeForTokens(code);
    captureResponse(session, 'tokens', tokens);
    
    // Step 3: Get user info
    logTestStep(session, 'get_user_info');
    const userInfo = await getGoogleUserInfo(tokens.access_token);
    captureResponse(session, 'user_info', userInfo);
    
    session.userId = userInfo.id;
    
    // Step 4: Store in DynamoDB (if enabled)
    let dynamoRecord: OAuthTokenRecord | undefined;
    if (TESTING_CONFIG.STORE_IN_DYNAMODB) {
      logTestStep(session, 'store_in_dynamodb');
      dynamoRecord = await storeOAuthTokens(
        userInfo.id,
        userInfo.email,
        'google',
        userInfo,
        tokens
      );
      captureResponse(session, 'dynamo_record', dynamoRecord);
    }
    
    // Step 5: Store in local session
    logTestStep(session, 'store_local_session');
    const localSession = await storeUserSession(userInfo, tokens);
    captureResponse(session, 'local_session', localSession);
    
    // Log successful flow
    await logOAuthFlow(
      session.userId!,
      session.flowId,
      'stored',
      { sessionId: session.sessionId },
      undefined,
      session.ipAddress,
      session.userAgent
    );
    
    return {
      success: true,
      session,
      tokens,
      userInfo,
      dynamoRecord,
    };
    
  } catch (error: any) {
    logTestStep(session, 'oauth_flow_error', undefined, false, error.message);
    
    // Log failed flow
    if (session.userId) {
      await logOAuthFlow(
        session.userId,
        session.flowId,
        'failed',
        { sessionId: session.sessionId },
        error.message,
        session.ipAddress,
        session.userAgent
      );
    }
    
    return {
      success: false,
      session,
    };
  }
}

/**
 * Tests token retrieval from DynamoDB
 */
export async function testTokenRetrieval(
  session: TestSession,
  userId: string
): Promise<{
  success: boolean;
  tokens?: any;
  userTokens?: OAuthTokenRecord[];
}> {
  try {
    logTestStep(session, 'retrieve_tokens_from_dynamodb');
    
    // Get tokens for specific provider
    const tokens = await getOAuthTokens(userId, 'google');
    captureResponse(session, 'retrieved_tokens', tokens);
    
    // Get all user tokens
    const userTokens = await getUserOAuthTokens(userId);
    captureResponse(session, 'all_user_tokens', userTokens);
    
    return {
      success: true,
      tokens,
      userTokens,
    };
    
  } catch (error: any) {
    logTestStep(session, 'token_retrieval_error', undefined, false, error.message);
    return {
      success: false,
    };
  }
}

/**
 * Generates a comprehensive test report
 */
export function generateTestReport(session: TestSession): {
  summary: {
    sessionId: string;
    flowId: string;
    duration: number;
    totalSteps: number;
    successRate: number;
    errorCount: number;
  };
  steps: TestStep[];
  responses: any[];
  errors: any[];
  recommendations: string[];
} {
  const endTime = new Date();
  const startTime = new Date(session.startTime);
  const duration = endTime.getTime() - startTime.getTime();
  
  const successfulSteps = session.steps.filter(step => step.success).length;
  const successRate = (successfulSteps / session.steps.length) * 100;
  
  const recommendations: string[] = [];
  
  if (successRate < 100) {
    recommendations.push('Review failed steps and error messages');
  }
  
  if (session.errors.length > 0) {
    recommendations.push('Check error logs for detailed failure information');
  }
  
  if (session.responses.length === 0) {
    recommendations.push('No responses captured - check if CAPTURE_RESPONSES is enabled');
  }
  
  return {
    summary: {
      sessionId: session.sessionId,
      flowId: session.flowId,
      duration,
      totalSteps: session.steps.length,
      successRate,
      errorCount: session.errors.length,
    },
    steps: session.steps,
    responses: session.responses,
    errors: session.errors,
    recommendations,
  };
}

/**
 * Exports test session data for analysis
 */
export function exportTestData(session: TestSession): string {
  const report = generateTestReport(session);
  return JSON.stringify(report, null, 2);
}

/**
 * Validates OAuth flow configuration
 */
export async function validateOAuthConfiguration(): Promise<{
  valid: boolean;
  issues: string[];
  recommendations: string[];
}> {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Check environment variables
  const requiredEnvVars = [
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'GOOGLE_OAUTH_SECRET_NAME',
    'KMS_KEY_ALIAS',
  ];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      issues.push(`Missing environment variable: ${envVar}`);
    }
  }
  
  // Check DynamoDB table configuration
  if (!process.env.DYNAMODB_OAUTH_TABLE) {
    issues.push('DYNAMODB_OAUTH_TABLE environment variable not set');
    recommendations.push('Set DYNAMODB_OAUTH_TABLE to your DynamoDB table name');
  }
  
  // Check testing configuration
  if (!TESTING_CONFIG.ENABLE_LOGGING) {
    recommendations.push('Enable logging for better debugging');
  }
  
  if (!TESTING_CONFIG.CAPTURE_RESPONSES) {
    recommendations.push('Enable response capturing for detailed analysis');
  }
  
  return {
    valid: issues.length === 0,
    issues,
    recommendations,
  };
}
