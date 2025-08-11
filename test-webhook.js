// Test the webhook with the actual bot.done event
const SUPABASE_URL = 'https://vfsnygvfgtqwjwrwnseg.supabase.co';

async function testWebhook() {
  console.log('🔍 Testing webhook with bot.done event...');
  
  // Simulate the exact webhook payload you received
  const webhookPayload = {
    "data": {
      "bot": {
        "id": "38f98d39-d97c-484d-9782-bbc6b55ad1dd",
        "metadata": {}
      },
      "data": {
        "code": "done",
        "sub_code": null,
        "updated_at": "2025-08-04T02:34:49.684054+00:00"
      }
    },
    "event": "bot.done"
  };
  
  console.log('📤 Webhook payload:', JSON.stringify(webhookPayload, null, 2));
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/recall-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'svix-id': 'msg_30nsu69P7bdVJgY0NEP33IJCdln',
        'svix-signature': 'v1,xzDSUrmUvm1oWQydId68if7yK65XEhLIr98WuNTO0Cg=',
        'svix-timestamp': '1754274895'
      },
      body: JSON.stringify(webhookPayload)
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseData = await response.json();
    console.log('📥 Response data:', JSON.stringify(responseData, null, 2));
    
    if (response.ok) {
      console.log('✅ Webhook test successful!');
    } else {
      console.log('❌ Webhook test failed');
      console.log('❌ Error:', responseData);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testWebhook(); 