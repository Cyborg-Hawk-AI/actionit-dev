// List all calendars in Recall.ai
const RECALL_API_KEY = process.env.RECALL_API_KEY || 'your-recall-api-key-here';
const RECALL_API_BASE_URL = 'https://us-west-2.recall.ai';

async function listCalendars() {
  console.log('🔍 Listing all calendars in Recall.ai...');
  
  try {
    const response = await fetch(`${RECALL_API_BASE_URL}/api/v2/calendar/`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${RECALL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const calendars = await response.json();
      console.log('✅ Calendars found:', JSON.stringify(calendars, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ Failed to list calendars:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error listing calendars:', error);
  }
}

// Run the test
listCalendars(); 