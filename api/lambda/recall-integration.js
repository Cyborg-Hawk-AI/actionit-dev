import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const LAMBDA_FUNCTION_NAME = process.env.RECALL_LAMBDA_FUNCTION_NAME || 'axnt-recall-integration';

export default async function handler(req, res) {
  try {
    console.log('[Lambda API] ===== RECALL INTEGRATION LAMBDA INVOCATION =====');
    console.log('[Lambda API] Environment check:', {
      hasLambdaFunctionName: !!process.env.RECALL_LAMBDA_FUNCTION_NAME,
      hasAwsRegion: !!process.env.AWS_REGION,
      hasAwsAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasAwsSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV
    });

    const { userId, googleTokens } = req.body;

    if (!userId || !googleTokens) {
      return res.status(400).json({
        error: 'Missing required parameters: userId and googleTokens'
      });
    }

    console.log('[Lambda API] Invoking Lambda function:', {
      functionName: LAMBDA_FUNCTION_NAME,
      userId: userId,
      hasAccessToken: !!googleTokens.access_token,
      hasRefreshToken: !!googleTokens.refresh_token,
      expiresAt: googleTokens.expires_at
    });

    // Create Lambda client
    const lambdaClient = new LambdaClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });

    // Prepare payload for Lambda function
    const payload = {
      userId: userId,
      googleTokens: googleTokens,
      timestamp: new Date().toISOString()
    };

    // Invoke Lambda function
    const command = new InvokeCommand({
      FunctionName: LAMBDA_FUNCTION_NAME,
      InvocationType: 'RequestResponse', // Synchronous invocation
      Payload: JSON.stringify(payload)
    });

    console.log('[Lambda API] Sending invocation command...');
    const response = await lambdaClient.send(command);

    console.log('[Lambda API] Lambda response received:', {
      statusCode: response.StatusCode,
      hasPayload: !!response.Payload,
      hasLogResult: !!response.LogResult
    });

    if (response.StatusCode !== 200) {
      console.error('[Lambda API] Lambda function failed:', {
        statusCode: response.StatusCode,
        logResult: response.LogResult
      });
      return res.status(500).json({
        error: 'Lambda function execution failed',
        statusCode: response.StatusCode,
        logResult: response.LogResult
      });
    }

    // Parse Lambda response
    const lambdaResult = JSON.parse(new TextDecoder().decode(response.Payload));
    console.log('[Lambda API] Lambda function result:', lambdaResult);

    if (lambdaResult.errorMessage) {
      console.error('[Lambda API] Lambda function returned error:', lambdaResult.errorMessage);
      return res.status(500).json({
        error: 'Lambda function error',
        details: lambdaResult.errorMessage
      });
    }

    console.log('[Lambda API] ===== LAMBDA INVOCATION COMPLETED SUCCESSFULLY =====');
    return res.status(200).json({
      success: true,
      result: lambdaResult,
      message: 'Recall.ai integration completed successfully'
    });

  } catch (error) {
    console.error('[Lambda API] ===== LAMBDA INVOCATION FAILED =====');
    console.error('[Lambda API] Error type:', typeof error);
    console.error('[Lambda API] Error name:', error.name);
    console.error('[Lambda API] Error message:', error.message);
    console.error('[Lambda API] Error stack:', error.stack);

    return res.status(500).json({
      error: 'Failed to invoke Lambda function',
      details: error.message
    });
  }
}
