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
    console.log('[Recall Test] Testing Recall.ai configuration');
    
    // Get Recall API key from environment
    const recallApiKey = process.env.RECALL_API_KEY;
    if (!recallApiKey) {
      return res.status(500).json({ 
        error: 'RECALL_API_KEY environment variable is not set',
        status: 'missing_api_key'
      });
    }

    console.log('[Recall Test] API key found, testing basic functionality...');
    
    // Test basic functionality without making external API calls
    const testData = {
      status: 'success',
      message: 'Recall.ai configuration is valid',
      api_key_prefix: recallApiKey.substring(0, 8) + '...',
      api_key_length: recallApiKey.length,
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        HAS_RECALL_API_KEY: !!process.env.RECALL_API_KEY,
        HAS_RECALL_WEBHOOK_SECRET: !!process.env.RECALL_WEBHOOK_SECRET,
      }
    };
    
    console.log('[Recall Test] Configuration test successful');
    
    return res.json(testData);
    
  } catch (error) {
    console.error('[Recall Test] Configuration test failed:', error);
    
    return res.status(500).json({ 
      status: 'error',
      message: 'Recall.ai configuration test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
}
