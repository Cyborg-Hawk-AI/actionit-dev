import fetch from 'node-fetch';

const WEBHOOK_URL = 'https://vfsnygvfgtqwjwrwnseg.supabase.co/functions/v1/recall-webhook';

// Test payloads for different events
const testPayloads = [
  {
    event: "bot_joined",
    data: {
      bot_id: "test-bot-123",
      meeting_url: "https://meet.google.com/test-meeting"
    }
  },
  {
    event: "bot_left",
    data: {
      bot_id: "test-bot-123",
      meeting_url: "https://meet.google.com/test-meeting"
    }
  },
  {
    event: "recording_started",
    data: {
      bot_id: "test-bot-123",
      meeting_url: "https://meet.google.com/test-meeting"
    }
  },
  {
    event: "recording_stopped",
    data: {
      bot_id: "test-bot-123",
      meeting_url: "https://meet.google.com/test-meeting"
    }
  },
  {
    event: "transcript_available",
    data: {
      bot_id: "test-bot-123",
      transcript_id: "test-transcript-456",
      meeting_url: "https://meet.google.com/test-meeting"
    }
  }
];

async function testWebhook() {
  console.log('🧪 Testing Recall Webhook Function...\n');
  
  for (const [index, payload] of testPayloads.entries()) {
    console.log(`📤 Testing event ${index + 1}: ${payload.event}`);
    
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Note: This will fail without proper auth, but we can see the response
        },
        body: JSON.stringify(payload)
      });
      
      const responseText = await response.text();
      console.log(`  Status: ${response.status}`);
      console.log(`  Response: ${responseText.substring(0, 200)}...`);
      console.log('');
      
    } catch (error) {
      console.error(`  Error: ${error.message}`);
      console.log('');
    }
  }
  
  console.log('✅ Webhook testing completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Check if webhook URL is accessible');
  console.log('2. Verify event handling logic');
  console.log('3. Test with proper authentication');
  console.log('4. Monitor Supabase function logs');
}

testWebhook(); 