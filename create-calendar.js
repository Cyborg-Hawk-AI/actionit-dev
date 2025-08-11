// Create a new calendar in Recall.ai
const RECALL_API_KEY = '8c0933578c0fbc870e520b43432b392aba8c3da9';
const RECALL_API_BASE_URL = 'https://us-west-2.recall.ai';

async function createCalendar() {
  console.log('🔍 Creating a new calendar in Recall.ai...');
  
  try {
    // Note: This is a test - you'll need real Google OAuth credentials
    const calendarData = {
      platform: 'google_calendar',
      oauth_client_id: 'test-client-id', // Replace with real Google Client ID
      oauth_client_secret: 'test-client-secret', // Replace with real Google Client Secret
      oauth_refresh_token: 'test-refresh-token' // Replace with real Google Refresh Token
    };
    
    console.log('📤 Calendar creation data:', JSON.stringify(calendarData, null, 2));
    
    const response = await fetch(`${RECALL_API_BASE_URL}/api/v2/calendar/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${RECALL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(calendarData)
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const calendarData = await response.json();
      console.log('✅ Calendar created successfully:', JSON.stringify(calendarData, null, 2));
      console.log('🎯 New Calendar ID:', calendarData.id);
    } else {
      const errorText = await response.text();
      console.log('❌ Calendar creation failed:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error creating calendar:', error);
  }
}

// Run the test
createCalendar(); 