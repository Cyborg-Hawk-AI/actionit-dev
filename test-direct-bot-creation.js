// Test direct bot creation without calendar
const RECALL_API_KEY = '8c0933578c0fbc870e520b43432b392aba8c3da9';
const RECALL_API_BASE_URL = 'https://us-west-2.recall.ai';

async function testDirectBotCreation() {
  console.log('🔍 Testing direct bot creation...');
  
  try {
    const botData = {
      meeting_url: 'https://meet.google.com/abc-defg-hij',
      bot_name: 'Action.IT Test Bot',
      recording_config: {
        transcript: {
          provider: {
            meeting_captions: {}
          }
        },
        audio_mixed_raw: {},
        participant_events: {},
        meeting_metadata: {},
        start_recording_on: 'participant_join'
      },
      output_media: {
        camera: {
          kind: 'webpage',
          config: {
            url: 'https://vfsnygvfgtqwjwrwnseg.supabase.co/storage/v1/object/public/web-assets//ehanced%20logo.png'
          }
        }
      }
    };
    
    console.log('📤 Bot creation data:', JSON.stringify(botData, null, 2));
    
    const response = await fetch(`${RECALL_API_BASE_URL}/api/v1/bot/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${RECALL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(botData)
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const botData = await response.json();
      console.log('✅ Bot created successfully:', JSON.stringify(botData, null, 2));
      console.log('🎯 New Bot ID:', botData.id);
    } else {
      const errorText = await response.text();
      console.log('❌ Bot creation failed:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error creating bot:', error);
  }
}

// Run the test
testDirectBotCreation(); 