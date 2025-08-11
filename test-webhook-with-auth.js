// Test webhook with authentication to see if function works
const SUPABASE_URL = 'https://vfsnygvfgtqwjwrwnseg.supabase.co';

async function testWebhookWithAuth() {
  console.log('🔍 Testing webhook with authentication...');
  
  // You'll need to replace this with your actual Supabase Anon Key
  // Get it from: https://supabase.com/dashboard/project/vfsnygvfgtqwjwrwnseg/settings/api
  const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE'; // Replace with your actual key
  
  if (SUPABASE_ANON_KEY === 'YOUR_ANON_KEY_HERE') {
    console.log('❌ Please replace SUPABASE_ANON_KEY with your actual Supabase Anon Key');
    console.log('💡 Get it from: https://supabase.com/dashboard/project/vfsnygvfgtqwjwrwnseg/settings/api');
    return;
  }
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/recall-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        event: 'bot.done',
        data: {
          bot: {
            id: '38f98d39-d97c-484d-9782-bbc6b55ad1dd',
            metadata: {}
          },
          data: {
            code: 'done',
            sub_code: null,
            updated_at: '2025-08-04T02:34:49.684054+00:00'
          }
        }
      })
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseData = await response.json();
    console.log('📥 Response data:', JSON.stringify(responseData, null, 2));
    
    if (response.ok) {
      console.log('✅ Webhook function works with authentication!');
      console.log('💡 The issue is that Recall.ai cannot send auth headers');
      console.log('💡 You need to make the function publicly accessible');
    } else {
      console.log('❌ Webhook function failed even with authentication');
      console.log('❌ Error:', responseData);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testWebhookWithAuth(); 