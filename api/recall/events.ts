import { VercelRequest, VercelResponse } from '@vercel/node';
import RecallAPIClient from '../../src/lib/recall-api';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('[Recall API] Events endpoint called:', req.method);
    
    // Get Recall API key from environment
    const recallApiKey = process.env.RECALL_API_KEY;
    if (!recallApiKey) {
      throw new Error('RECALL_API_KEY environment variable is not set');
    }

    const recallClient = new RecallAPIClient(recallApiKey);

    if (req.method === 'GET') {
      // List calendar events with filters
      const { 
        calendar_id, 
        updated_at__gte, 
        start_time__gte, 
        end_time__lte 
      } = req.query;

      const filters = {
        calendar_id: calendar_id as string,
        updated_at__gte: updated_at__gte as string,
        start_time__gte: start_time__gte as string,
        end_time__lte: end_time__lte as string,
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (!filters[key as keyof typeof filters]) {
          delete filters[key as keyof typeof filters];
        }
      });

      console.log('[Recall API] Listing events with filters:', filters);
      const events = await recallClient.listCalendarEvents(filters);
      
      return res.json(events);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[Recall API] Events error:', error);
    return res.status(500).json({ 
      error: 'Failed to process events request',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
