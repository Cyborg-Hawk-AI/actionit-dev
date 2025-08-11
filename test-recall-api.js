// Simple test to check if the calendar ID exists in Recall.ai
const RECALL_API_KEY = process.env.RECALL_API_KEY || 'your-recall-api-key-here';
const RECALL_API_BASE_URL = 'https://us-west-2.recall.ai';
const CALENDAR_ID = 'c64ffc37-1039-4244-b427-eb54268caee7';

async function testRecallApi() {
  console.log('🔍 Testing Recall.ai API with Calendar ID:', CALENDAR_ID);
  console.log('🌐 API Base URL:', RECALL_API_BASE_URL);
  
  try {
    // Test 1: Check if we can access the calendar
    console.log('\n1. Testing calendar access...');
    const calendarResponse = await fetch(`${RECALL_API_BASE_URL}/api/v2/calendar/${CALENDAR_ID}/`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${RECALL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📥 Calendar response status:', calendarResponse.status);
    console.log('📥 Calendar response headers:', Object.fromEntries(calendarResponse.headers.entries()));
    
    if (calendarResponse.ok) {
      const calendarData = await calendarResponse.json();
      console.log('✅ Calendar found:', JSON.stringify(calendarData, null, 2));
    } else {
      const errorText = await calendarResponse.text();
      console.log('❌ Calendar not found:', errorText);
    }
    
    // Test 2: Try to schedule a bot
    console.log('\n2. Testing bot scheduling...');
    const botData = {
      meeting_url: 'https://meet.google.com/abc-defg-hij',
      join_at: new Date().toISOString(),
      bot_name: 'Action.IT Test Bot',
      bot_config: {
        transcription_options: {
          provider: 'meeting_captions'
        },
        recording_mode: 'audio_only'
      },
      deduplication_key: `test-${Date.now()}`
    };
    
    console.log('📤 Bot scheduling data:', JSON.stringify(botData, null, 2));
    
    const botResponse = await fetch(`${RECALL_API_BASE_URL}/api/v2/calendar/${CALENDAR_ID}/schedule-bot/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${RECALL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(botData)
    });
    
    console.log('📥 Bot response status:', botResponse.status);
    console.log('📥 Bot response headers:', Object.fromEntries(botResponse.headers.entries()));
    
    if (botResponse.ok) {
      const botData = await botResponse.json();
      console.log('✅ Bot scheduled successfully:', JSON.stringify(botData, null, 2));
    } else {
      const errorText = await botResponse.text();
      console.log('❌ Bot scheduling failed:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testRecallApi(); 