#!/usr/bin/env node

// Real Data Checker
// Helps verify if the application is using real data and identify empty areas

const { createClient } = require('@supabase/supabase-js');

// Configuration
const supabaseUrl = "https://vfsnygvfgtqwjwrwnseg.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmc255Z3ZmZ3Rxd2p3cnduc2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NzEyMzcsImV4cCI6MjA2MjE0NzIzN30.tkYMaq3lvT-qXDqSNLdU2uSr-Puwhzcg-a6Sq10CBNU";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRealData() {
  console.log('🔍 Checking Real Data Status...\n');
  console.log('=' .repeat(50));

  try {
    // Check 1: Authentication Status
    console.log('1. Checking Authentication Status...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session check failed:', sessionError.message);
      return;
    }
    
    if (session) {
      console.log('✅ User is authenticated');
      console.log(`   Email: ${session.user.email}`);
      console.log(`   User ID: ${session.user.id}`);
      console.log(`   Session expires: ${new Date(session.expires_at * 1000).toISOString()}`);
    } else {
      console.log('❌ No active session found');
      console.log('💡 You need to log in to see real data');
      return;
    }

    // Check 2: Calendar Connections
    console.log('\n2. Checking Calendar Connections...');
    const { data: calendarConnections, error: calendarError } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('user_id', session.user.id);

    if (calendarError) {
      console.error('❌ Calendar connections check failed:', calendarError.message);
    } else if (calendarConnections && calendarConnections.length > 0) {
      console.log('✅ Calendar connections found:', calendarConnections.length);
      calendarConnections.forEach(conn => {
        console.log(`   - ${conn.provider} (${conn.calendar_name})`);
      });
    } else {
      console.log('❌ No calendar connections found');
      console.log('💡 Connect your calendar in Settings to see meetings');
    }

    // Check 3: Meetings Data
    console.log('\n3. Checking Meetings Data...');
    const { data: meetings, error: meetingsError } = await supabase
      .from('meetings')
      .select('*')
      .eq('user_id', session.user.id)
      .order('start_time', { ascending: false })
      .limit(10);

    if (meetingsError) {
      console.error('❌ Meetings check failed:', meetingsError.message);
    } else if (meetings && meetings.length > 0) {
      console.log('✅ Meetings found:', meetings.length);
      meetings.slice(0, 3).forEach(meeting => {
        console.log(`   - ${meeting.title} (${new Date(meeting.start_time).toLocaleDateString()})`);
      });
    } else {
      console.log('❌ No meetings found');
      console.log('💡 This could be because:');
      console.log('   - No calendar is connected');
      console.log('   - Calendar sync hasn\'t run yet');
      console.log('   - No meetings in your calendar');
    }

    // Check 4: Transcripts Data
    console.log('\n4. Checking Transcripts Data...');
    const { data: transcripts, error: transcriptsError } = await supabase
      .from('transcripts')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (transcriptsError) {
      console.error('❌ Transcripts check failed:', transcriptsError.message);
    } else if (transcripts && transcripts.length > 0) {
      console.log('✅ Transcripts found:', transcripts.length);
      transcripts.slice(0, 3).forEach(transcript => {
        console.log(`   - Meeting: ${transcript.meeting_id}`);
        console.log(`     Summary: ${transcript.meeting_summary ? 'Yes' : 'No'}`);
        console.log(`     Created: ${new Date(transcript.created_at).toLocaleDateString()}`);
      });
    } else {
      console.log('❌ No transcripts found');
      console.log('💡 Transcripts appear when:');
      console.log('   - Recall.ai bot joins meetings');
      console.log('   - Meetings are recorded and processed');
    }

    // Check 5: Key Insights Data
    console.log('\n5. Checking Key Insights Data...');
    const { data: keyInsights, error: insightsError } = await supabase
      .from('key_insights')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (insightsError) {
      console.error('❌ Key insights check failed:', insightsError.message);
    } else if (keyInsights && keyInsights.length > 0) {
      console.log('✅ Key insights found:', keyInsights.length);
      keyInsights.slice(0, 3).forEach(insight => {
        console.log(`   - Type: ${insight.insight_type}`);
        console.log(`     Summary: ${insight.insight_summary ? 'Yes' : 'No'}`);
        console.log(`     Created: ${new Date(insight.created_at).toLocaleDateString()}`);
      });
    } else {
      console.log('❌ No key insights found');
      console.log('💡 Key insights are generated from:');
      console.log('   - Meeting transcripts');
      console.log('   - AI analysis of meeting content');
    }

    // Check 6: Recall.ai Integration
    console.log('\n6. Checking Recall.ai Integration...');
    const { data: recallConnections, error: recallError } = await supabase
      .from('recall_connections')
      .select('*')
      .eq('user_id', session.user.id);

    if (recallError) {
      console.error('❌ Recall.ai check failed:', recallError.message);
    } else if (recallConnections && recallConnections.length > 0) {
      console.log('✅ Recall.ai connections found:', recallConnections.length);
      recallConnections.forEach(conn => {
        console.log(`   - Calendar ID: ${conn.calendar_id}`);
        console.log(`     Status: ${conn.status}`);
      });
    } else {
      console.log('❌ No Recall.ai connections found');
      console.log('💡 Connect Recall.ai in Settings to:');
      console.log('   - Join meetings automatically');
      console.log('   - Record and transcribe meetings');
      console.log('   - Generate meeting insights');
    }

    // Summary
    console.log('\n' + '=' .repeat(50));
    console.log('📊 Real Data Status Summary');
    console.log('=' .repeat(50));
    
    const hasCalendar = calendarConnections && calendarConnections.length > 0;
    const hasMeetings = meetings && meetings.length > 0;
    const hasTranscripts = transcripts && transcripts.length > 0;
    const hasInsights = keyInsights && keyInsights.length > 0;
    const hasRecall = recallConnections && recallConnections.length > 0;

    console.log(`✅ Authentication: ${session ? 'Active' : 'None'}`);
    console.log(`📅 Calendar Connections: ${hasCalendar ? 'Connected' : 'Not Connected'}`);
    console.log(`📋 Meetings: ${hasMeetings ? `${meetings.length} found` : 'None'}`);
    console.log(`🎙️  Transcripts: ${hasTranscripts ? `${transcripts.length} found` : 'None'}`);
    console.log(`🧠 Key Insights: ${hasInsights ? `${keyInsights.length} found` : 'None'}`);
    console.log(`🤖 Recall.ai: ${hasRecall ? 'Connected' : 'Not Connected'}`);

    // Recommendations
    console.log('\n💡 Recommendations:');
    
    if (!hasCalendar) {
      console.log('   - Connect your Google Calendar in Settings');
    }
    
    if (!hasMeetings && hasCalendar) {
      console.log('   - Run calendar sync to fetch meetings');
    }
    
    if (!hasRecall) {
      console.log('   - Connect Recall.ai to enable meeting recording');
    }
    
    if (!hasTranscripts && hasRecall) {
      console.log('   - Schedule a meeting with bot to generate transcripts');
    }
    
    if (!hasInsights && hasTranscripts) {
      console.log('   - Wait for AI processing to generate insights');
    }

    console.log('\n🎉 Real data check completed!');

  } catch (error) {
    console.error('💥 Check failed with error:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  checkRealData().catch(console.error);
}

module.exports = {
  checkRealData
}; 