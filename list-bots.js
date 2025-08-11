// List all bots in Recall.ai
const RECALL_API_KEY = process.env.RECALL_API_KEY || 'your-recall-api-key-here';
const RECALL_API_BASE_URL = 'https://us-west-2.recall.ai';

async function listBots() {
  console.log('🔍 Listing all bots in Recall.ai...');
  
  try {
    const response = await fetch(`${RECALL_API_BASE_URL}/api/v1/bot/`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${RECALL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const bots = await response.json();
      console.log('✅ Bots found:', JSON.stringify(bots, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ Failed to list bots:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error listing bots:', error);
  }
}

// Run the test
listBots(); 