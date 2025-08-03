import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testMeetingAnalytics() {
  console.log('🧪 Testing Meeting Analytics Functionality...\n');

  // Test user ID - replace with actual test user
  const testUserId = 'test-user-id'; // Replace with actual user ID from your database

  try {
    // Fetch meetings for analytics
    console.log('📊 Fetching meetings data...');
    const { data: meetings, error: meetingsError } = await supabase
      .from('meetings')
      .select('*')
      .eq('user_id', testUserId)
      .order('start_time', { ascending: false });

    if (meetingsError) {
      throw new Error(`Failed to fetch meetings: ${meetingsError.message}`);
    }

    console.log(`✅ Found ${meetings?.length || 0} meetings`);

    // Fetch key insights
    console.log('🔍 Fetching key insights...');
    const { data: keyInsights, error: insightsError } = await supabase
      .from('key_insights')
      .select('*')
      .eq('user_id', testUserId);

    if (insightsError) {
      throw new Error(`Failed to fetch key insights: ${insightsError.message}`);
    }

    console.log(`✅ Found ${keyInsights?.length || 0} key insights`);

    // Calculate analytics (simulating the hook logic)
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPreviousWeek = new Date(startOfWeek);
    startOfPreviousWeek.setDate(startOfPreviousWeek.getDate() - 7);
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Calculate analytics
    const totalMeetings = meetings?.length || 0;
    
    const thisWeekMeetings = meetings?.filter(meeting => 
      new Date(meeting.start_time) >= startOfWeek
    ).length || 0;

    const thisMonthMeetings = meetings?.filter(meeting => 
      new Date(meeting.start_time) >= startOfMonth
    ).length || 0;

    const previousWeekMeetings = meetings?.filter(meeting => {
      const meetingDate = new Date(meeting.start_time);
      return meetingDate >= startOfPreviousWeek && meetingDate < startOfWeek;
    }).length || 0;

    const previousMonthMeetings = meetings?.filter(meeting => {
      const meetingDate = new Date(meeting.start_time);
      return meetingDate >= startOfPreviousMonth && meetingDate < startOfMonth;
    }).length || 0;

    // Calculate average duration
    const completedMeetings = meetings?.filter(meeting => 
      meeting.end_time && meeting.start_time
    ) || [];

    const totalDuration = completedMeetings.reduce((total, meeting) => {
      const start = new Date(meeting.start_time);
      const end = new Date(meeting.end_time);
      return total + (end.getTime() - start.getTime());
    }, 0);

    const averageDuration = completedMeetings.length > 0 
      ? Math.round(totalDuration / completedMeetings.length / (1000 * 60)) // Convert to minutes
      : 0;

    // Calculate completion rate
    const completionRate = totalMeetings > 0 
      ? Math.round((completedMeetings.length / totalMeetings) * 100)
      : 0;

    // Calculate productivity metrics
    const insightsGenerated = keyInsights?.length || 0;
    const actionItemsCreated = keyInsights?.reduce((total, insight) => {
      if (insight.action_items && typeof insight.action_items === 'object') {
        const items = Array.isArray(insight.action_items) ? insight.action_items : [];
        return total + items.length;
      }
      return total;
    }, 0) || 0;

    const decisionsRecorded = keyInsights?.reduce((total, insight) => {
      if (insight.decisions && typeof insight.decisions === 'object') {
        const decisions = Array.isArray(insight.decisions) ? insight.decisions : [];
        return total + decisions.length;
      }
      return total;
    }, 0) || 0;

    // Calculate productivity score
    const productivityScore = Math.min(100, Math.round(
      (completionRate * 0.3) + 
      (insightsGenerated * 2) + 
      (actionItemsCreated * 3) + 
      (decisionsRecorded * 2)
    ));

    // Analyze meeting types
    const meetingTypeCounts = {};
    meetings?.forEach(meeting => {
      const title = meeting.title?.toLowerCase() || '';
      let type = 'Other';
      
      if (title.includes('standup') || title.includes('daily')) type = 'Standup';
      else if (title.includes('review') || title.includes('retro')) type = 'Review';
      else if (title.includes('planning') || title.includes('sprint')) type = 'Planning';
      else if (title.includes('client') || title.includes('customer')) type = 'Client';
      else if (title.includes('sync') || title.includes('catch')) type = 'Sync';
      
      meetingTypeCounts[type] = (meetingTypeCounts[type] || 0) + 1;
    });

    const topMeetingTypes = Object.entries(meetingTypeCounts)
      .map(([type, count]) => ({
        type,
        count,
        percentage: totalMeetings > 0 ? Math.round((count / totalMeetings) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Display results
    console.log('\n📈 Meeting Analytics Results:');
    console.log('=============================');
    console.log(`Total Meetings: ${totalMeetings}`);
    console.log(`This Week: ${thisWeekMeetings} (${previousWeekMeetings} previous week)`);
    console.log(`This Month: ${thisMonthMeetings} (${previousMonthMeetings} previous month)`);
    console.log(`Average Duration: ${averageDuration} minutes`);
    console.log(`Completion Rate: ${completionRate}%`);
    console.log(`Productivity Score: ${productivityScore}/100`);
    console.log(`Insights Generated: ${insightsGenerated}`);
    console.log(`Action Items Created: ${actionItemsCreated}`);
    console.log(`Decisions Recorded: ${decisionsRecorded}`);
    
    console.log('\n📊 Top Meeting Types:');
    topMeetingTypes.forEach(type => {
      console.log(`  - ${type.type}: ${type.count} meetings (${type.percentage}%)`);
    });

    console.log('\n✅ Meeting Analytics test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing Meeting Analytics:', error.message);
  }
}

testMeetingAnalytics(); 