// Simple test to check if webhook is accessible
const SUPABASE_URL = 'https://vfsnygvfgtqwjwrwnseg.supabase.co';

async function testWebhookAccess() {
  console.log('🔍 Testing webhook accessibility...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/recall-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: 'test',
        data: { test: true }
      })
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseData = await response.json();
    console.log('📥 Response data:', JSON.stringify(responseData, null, 2));
    
    if (response.status === 401) {
      console.log('❌ Webhook still requires authentication');
      console.log('💡 You may need to:');
      console.log('   1. Wait a few minutes for deployment to propagate');
      console.log('   2. Check Supabase dashboard function settings');
      console.log('   3. Ensure JWT authentication is disabled');
    } else if (response.status === 200) {
      console.log('✅ Webhook is accessible!');
    } else {
      console.log('⚠️  Unexpected response:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testWebhookAccess(); 