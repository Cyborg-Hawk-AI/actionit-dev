import { VercelRequest, VercelResponse } from '@vercel/node';
import RecallAPIClient from '../../src/lib/recall-api';

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
    console.log('[Recall Test] Testing Recall.ai API connection');
    
    // Get Recall API key from environment
    const recallApiKey = process.env.RECALL_API_KEY;
    if (!recallApiKey) {
      return res.status(500).json({ 
        error: 'RECALL_API_KEY environment variable is not set',
        status: 'missing_api_key'
      });
    }

    console.log('[Recall Test] API key found, testing connection...');
    
    const recallClient = new RecallAPIClient(recallApiKey);
    
    // Test the API by listing calendars (this should work even with no calendars)
    console.log('[Recall Test] Attempting to list calendars...');
    const calendars = await recallClient.listCalendars();
    
    console.log('[Recall Test] API connection successful');
    
    return res.json({
      status: 'success',
      message: 'Recall.ai API connection successful',
      api_key_prefix: recallApiKey.substring(0, 8) + '...',
      calendars_count: calendars.results?.length || 0,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Recall Test] API test failed:', error);
    
    return res.status(500).json({ 
      status: 'error',
      message: 'Recall.ai API connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
}
