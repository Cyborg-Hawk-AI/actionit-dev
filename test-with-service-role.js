// Test with service role key for proper authentication
const SUPABASE_URL = 'https://vfsnygvfgtqwjwrwnseg.supabase.co';
// Note: You'll need to get your service role key from Supabase dashboard
const SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY'; // Replace with your actual service role key

async function testWithServiceRole() {
  console.log('🔍 Testing with service role authentication...');
  
  if (SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY') {
    console.log('❌ Please replace SERVICE_ROLE_KEY with your actual service role key');
    console.log('📋 To get your service role key:');
    console.log('1. Go to https://supabase.com/dashboard/project/vfsnygvfgtqwjwrwnseg');
    console.log('2. Click Settings > API');
    console.log('3. Copy the "service_role" key');
    return;
  }
  
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
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📥 Response status:', response.status);
    
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
testWithServiceRole(); 