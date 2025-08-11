// Test different Recall.ai regions
const RECALL_API_KEY = process.env.RECALL_API_KEY || 'your-recall-api-key-here';

const regions = [
  'https://us-east-1.recall.ai',
  'https://us-west-2.recall.ai', 
  'https://eu-central-1.recall.ai',
  'https://ap-northeast-1.recall.ai'
];

async function testRegions() {
  console.log('🔍 Testing different Recall.ai regions...');
  
  for (const region of regions) {
    console.log(`\n🌐 Testing region: ${region}`);
    
    try {
      const response = await fetch(`${region}/api/v1/bot/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${RECALL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📥 Response status:', response.status);
      
      if (response.ok) {
        console.log('✅ This region works!');
        const bots = await response.json();
        console.log('📊 Bots found:', bots.length || 0);
        return region; // Found the correct region
      } else if (response.status === 401) {
        const errorData = await response.json();
        console.log('❌ Authentication failed:', errorData.detail);
      } else {
        const errorText = await response.text();
        console.log('❌ Other error:', errorText.substring(0, 100));
      }
      
    } catch (error) {
      console.log('❌ Network error:', error.message);
    }
  }
  
  console.log('\n❌ No working region found. Please check your API key.');
}

// Run the test
testRegions(); 