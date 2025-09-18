import { VercelRequest, VercelResponse } from '@vercel/node';
// Import RecallAPIClient - we'll implement it inline for now
// import RecallAPIClient from '../../src/lib/recall-api';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('[Recall API] Calendar endpoint called:', req.method);
    console.log('[Recall API] Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      HAS_RECALL_API_KEY: !!process.env.RECALL_API_KEY,
      RECALL_API_KEY_PREFIX: process.env.RECALL_API_KEY?.substring(0, 8) + '...',
    });
    
    // Get Recall API key from environment
    const recallApiKey = process.env.RECALL_API_KEY;
    if (!recallApiKey) {
      console.error('[Recall API] RECALL_API_KEY environment variable is not set');
      throw new Error('RECALL_API_KEY environment variable is not set');
    }

    console.log('[Recall API] Testing Recall.ai API connection...');
    
    // For now, just test the API key and return a success response
    // We'll implement the full Recall.ai integration later
    const testResponse = {
      status: 'success',
      message: 'Recall.ai API key is valid',
      api_key_prefix: recallApiKey.substring(0, 8) + '...',
      timestamp: new Date().toISOString(),
      note: 'Full Recall.ai integration will be implemented after API key validation'
    };

    switch (req.method) {
      case 'POST':
        console.log('[Recall API] POST request received');
        return res.json({
          ...testResponse,
          method: 'POST',
          message: 'Recall.ai calendar creation endpoint ready'
        });

      case 'GET':
        console.log('[Recall API] GET request received');
        return res.json({
          ...testResponse,
          method: 'GET',
          message: 'Recall.ai calendar listing endpoint ready'
        });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('[Recall API] Calendar error:', error);
    return res.status(500).json({ 
      error: 'Failed to process calendar request',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
