import { VercelRequest, VercelResponse } from '@vercel/node';
import RecallAPIClient from '../../src/lib/recall-api';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('[Recall API] Bots endpoint called:', req.method);
    
    // Get Recall API key from environment
    const recallApiKey = process.env.RECALL_API_KEY;
    if (!recallApiKey) {
      throw new Error('RECALL_API_KEY environment variable is not set');
    }

    const recallClient = new RecallAPIClient(recallApiKey);

    switch (req.method) {
      case 'POST':
        // Create a bot
        const { meeting_url, join_at, bot_name, transcription_options } = req.body;
        
        if (!meeting_url || !join_at) {
          return res.status(400).json({ 
            error: 'meeting_url and join_at are required' 
          });
        }

        console.log('[Recall API] Creating bot for meeting:', meeting_url);
        const bot = await recallClient.createBot(meeting_url, join_at, {
          bot_name,
          transcription_options,
        });
        
        return res.json(bot);

      case 'GET':
        // Get bot status
        const { bot_id } = req.query;
        
        if (!bot_id) {
          return res.status(400).json({ error: 'bot_id is required' });
        }

        console.log('[Recall API] Getting bot status:', bot_id);
        const bot = await recallClient.getBot(bot_id as string);
        
        return res.json(bot);

      case 'DELETE':
        // Delete a bot
        const { bot_id: deleteBotId } = req.query;
        
        if (!deleteBotId) {
          return res.status(400).json({ error: 'bot_id is required' });
        }

        console.log('[Recall API] Deleting bot:', deleteBotId);
        await recallClient.deleteBot(deleteBotId as string);
        
        return res.json({ success: true });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('[Recall API] Bots error:', error);
    return res.status(500).json({ 
      error: 'Failed to process bot request',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
