import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://vfsnygvfgtqwjwrwnseg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmc255Z3ZmZ3Rxd2p3cnduc2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzE5NzQsImV4cCI6MjA1MDU0Nzk3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCalendarId() {
  const calendarId = 'c64ffc37-1039-4244-b427-eb54268caee7';
  
  console.log('🔍 Testing Calendar ID:', calendarId);
  
  try {
    // 1. Check if calendar exists in database
    console.log('\n1. Checking if calendar exists in database...');
    const { data: calendar, error: calendarError } = await supabase
      .from('recall_calendars')
      .select('*')
      .eq('id', calendarId)
      .single();
    
    if (calendarError) {
      console.error('❌ Calendar not found in database:', calendarError.message);
      return;
    }
    
    console.log('✅ Calendar found in database:', {
      id: calendar.id,
      user_id: calendar.user_id,
      recall_calendar_id: calendar.recall_calendar_id,
      platform: calendar.platform
    });
    
    // 2. Test bot scheduling with this calendar
    console.log('\n2. Testing bot scheduling...');
    const testMeetingData = {
      action: 'join-meeting-now',
      userId: calendar.user_id,
      meetingId: 'test-meeting-' + Date.now(),
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
      meetingTitle: 'Test Meeting',
      botName: 'Action.IT Test Bot',
      joinMode: 'audio_only'
    };
    
    console.log('📤 Sending test data:', testMeetingData);
    
    const response = await fetch(`${supabaseUrl}/functions/v1/recall-api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify(testMeetingData)
    });
    
    const responseData = await response.json();
    console.log('📥 Response status:', response.status);
    console.log('📥 Response data:', JSON.stringify(responseData, null, 2));
    
    if (response.ok) {
      console.log('✅ Bot scheduling test successful!');
    } else {
      console.log('❌ Bot scheduling test failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testCalendarId(); 