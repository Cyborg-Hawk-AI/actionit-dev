export default function handler(req, res) {
  try {
    console.log('[Test JS] Simple JavaScript API route working');
    
    res.status(200).json({
      success: true,
      message: 'JavaScript API route is working',
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV
      }
    });

  } catch (error) {
    console.error('[Test JS] JavaScript API route failed:', error);
    res.status(500).json({
      error: 'JavaScript API route failed',
      details: error.message
    });
  }
}
