import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[Simple Test] API endpoint called');
    
    return res.json({
      status: 'success',
      message: 'Simple API endpoint is working - updated',
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        HAS_RECALL_API_KEY: !!process.env.RECALL_API_KEY,
        HAS_AWS_REGION: !!process.env.AWS_REGION,
      },
      newFiles: 'Testing if new API routes are deployed'
    });
    
  } catch (error) {
    console.error('[Simple Test] Error:', error);
    
    return res.status(500).json({ 
      status: 'error',
      message: 'Simple API endpoint failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
