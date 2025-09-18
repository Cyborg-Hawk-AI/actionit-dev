import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('[Recall.ai Test] ===== TEST API ROUTE =====');
    console.log('[Recall.ai Test] Environment check:', {
      hasAwsRegion: !!process.env.AWS_REGION,
      hasAwsAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasAwsSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV
    });

    // Test AWS SDK import
    let awsSdkAvailable = false;
    try {
      const { SecretsManagerClient } = await import('@aws-sdk/client-secrets-manager');
      awsSdkAvailable = true;
      console.log('[Recall.ai Test] AWS SDK import successful');
    } catch (importError) {
      console.error('[Recall.ai Test] AWS SDK import failed:', importError);
    }

    return NextResponse.json({
      success: true,
      message: 'Test API route working',
      environment: {
        hasAwsRegion: !!process.env.AWS_REGION,
        hasAwsAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
        hasAwsSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV
      },
      awsSdkAvailable
    });

  } catch (error) {
    console.error('[Recall.ai Test] Test API route failed:', error);
    return NextResponse.json(
      { 
        error: 'Test API route failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      },
      { status: 500 }
    );
  }
}
