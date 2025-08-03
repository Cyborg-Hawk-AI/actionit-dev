import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  'https://vfsnygvfgtqwjwrwnseg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmc255Z3ZmZ3Rxd2p3cnduc2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE5NzE5NzQsImV4cCI6MjA0NzU0Nzk3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'
);

async function testBotCreation() {
  console.log('🧪 Testing Bot Creation with Webhook Configuration...\n');
  
  try {
    // Test data
    const testData = {
      action: "join-meeting-now",
      userId: "test-user-123",
      meetingId: "test-meeting-456",
      meetingUrl: "https://meet.google.com/test-meeting-url",
      meetingTitle: "Test Meeting",
      botName: "Action.IT Test Bot",
      joinMode: "audio_only"
    };
    
    console.log('📤 Creating bot with webhook configuration...');
    console.log('Test data:', JSON.stringify(testData, null, 2));
    
    // Call the recall-api function
    const { data, error } = await supabase.functions.invoke('recall-api', {
      body: testData
    });
    
    if (error) {
      console.error('❌ Error creating bot:', error);
      return;
    }
    
    console.log('✅ Bot created successfully!');
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.recording && data.recording.bot_id) {
      console.log(`\n🤖 Bot ID: ${data.recording.bot_id}`);
      console.log('📋 Next Steps:');
      console.log('1. Check Supabase function logs for webhook events');
      console.log('2. Monitor the bot in Recall.ai dashboard');
      console.log('3. End the meeting to trigger webhook events');
      console.log('4. Check database for recording updates');
    }
    
  } catch (error) {
    console.error('❌ Error testing bot creation:', error);
  }
}

testBotCreation(); 