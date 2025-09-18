export default function handler(req, res) {
  try {
    console.log('[Test Env] Checking environment variables...');
    
    const envCheck = {
      hasRecallApiKey: !!process.env.RECALL_API_KEY,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasAwsRegion: !!process.env.AWS_REGION,
      hasAwsAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasAwsSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV
    };
    
    console.log('[Test Env] Environment check result:', envCheck);
    
    res.status(200).json({
      success: true,
      message: 'Environment variables check',
      environment: envCheck,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Test Env] Environment check failed:', error);
    res.status(500).json({
      error: 'Environment check failed',
      details: error.message
    });
  }
}
