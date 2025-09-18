import { VercelRequest, VercelResponse } from '@vercel/node';
import RecallAPIClient from '../../src/lib/recall-api';

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
    
    // Get Recall API key from environment
    const recallApiKey = process.env.RECALL_API_KEY;
    if (!recallApiKey) {
      throw new Error('RECALL_API_KEY environment variable is not set');
    }

    const recallClient = new RecallAPIClient(recallApiKey);

    switch (req.method) {
      case 'POST':
        // Create calendar connection
        const { user_id, google_tokens } = req.body;
        
        if (!user_id || !google_tokens) {
          return res.status(400).json({ 
            error: 'user_id and google_tokens are required' 
          });
        }

        console.log('[Recall API] Creating calendar for user:', user_id);
        const calendar = await recallClient.createCalendar(user_id, google_tokens);
        
        return res.json(calendar);

      case 'GET':
        // List calendars
        const { user_id: queryUserId } = req.query;
        
        console.log('[Recall API] Listing calendars for user:', queryUserId);
        const calendars = await recallClient.listCalendars(queryUserId as string);
        
        return res.json(calendars);

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
