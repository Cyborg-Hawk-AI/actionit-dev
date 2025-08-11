// Test the current recall-api function
const SUPABASE_URL = 'https://vfsnygvfgtqwjwrwnseg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmc255Z3ZmZ3Rxd2p3cnduc2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzE5NzQsImV4cCI6MjA1MDU0Nzk3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

async function testCurrentFunction() {
  console.log('🔍 Testing current recall-api function...');
  
  try {
    const testData = {
      action: 'join-meeting-now',
      userId: 'test-user-123',
      meetingId: 'test-meeting-' + Date.now(),
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
      meetingTitle: 'Test Meeting',
      botName: 'Action.IT Test Bot',
      joinMode: 'audio_only'
    };
    
    console.log('📤 Test data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/recall-api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseData = await response.json();
    console.log('📥 Response data:', JSON.stringify(responseData, null, 2));
    
    if (response.ok) {
      console.log('✅ Function test successful!');
      console.log('🎯 Bot ID:', responseData.bot_id);
      console.log('🎯 Recording ID:', responseData.recording_id);
    } else {
      console.log('❌ Function test failed');
      console.log('❌ Error:', responseData.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testCurrentFunction(); 