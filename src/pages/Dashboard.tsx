import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, TrendingUp, CalendarCheck, Zap, Search, Bot, ExternalLink, Loader2, BarChart3, Activity, Target, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, isToday, isTomorrow, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { useCalendarData } from '@/hooks/useCalendarData';
import { useKeyInsights } from '@/hooks/useKeyInsights';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { DashboardCalendarCard } from '@/components/DashboardCalendarCard';
import { RecentMeetingsCard } from '@/components/dashboard/RecentMeetingsCard';
import JoinMeetingModal from '@/components/dashboard/JoinMeetingModal';
import SearchInput from '@/components/dashboard/SearchInput';
import SearchResults from '@/components/dashboard/SearchResults';
import { LatestMeetingSummary } from '@/components/dashboard/LatestMeetingSummary';
import { ActionItemsCard } from '@/components/dashboard/ActionItemsCard';
import { InsightsTimelineCard } from '@/components/dashboard/InsightsTimelineCard';
import { BotStatusCard } from '@/components/dashboard/BotStatusCard';
import { AttendeeIntelligenceCard } from '@/components/dashboard/AttendeeIntelligenceCard';
import { MeetingComparisonCard } from '@/components/dashboard/MeetingComparisonCard';
import { EnterpriseRiskDetectionBadge } from '@/components/dashboard/EnterpriseRiskDetectionBadge';
import { OfflineModeCard } from '@/components/dashboard/OfflineModeCard';
import { Meeting } from '@/services/calendarService';
import { JoinMode } from '@/services/recallService';
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';
import { useActionItems } from '@/hooks/useActionItems';
import { useInsights } from '@/hooks/useInsights';
import { useBotStatus } from '@/hooks/useBotStatus';
import { useCollaborators } from '@/hooks/useCollaborators';
import { useMeetingComparison } from '@/hooks/useMeetingComparison';
import { useEnterpriseRisks } from '@/hooks/useEnterpriseRisks';
import { Database } from 'lucide-react';
import { useMeetingAnalytics } from '@/hooks/useMeetingAnalytics';
import { MeetingAnalyticsCard } from '@/components/dashboard/MeetingAnalyticsCard';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);

  const { 
    meetings, 
    todayMeetings, 
    upcomingMeetings, 
    isLoading, 
    error,
    refreshData,
    joinMeetingWithBot,
    joiningMeetings,
    meetingJoinModes,
    updateMeeting
  } = useCalendarData();

  const { data: insights, isLoading: insightsLoading } = useKeyInsights();
  const insightsArray = insights ? [insights] : [];
  
  const { 
    actionItems, 
    isLoading: actionItemsLoading, 
    updateStatus: updateActionItemStatus, 
    snooze: snoozeActionItem 
  } = useActionItems();

  const { 
    insights: timelineInsights, 
    isLoading: timelineInsightsLoading 
  } = useInsights();

  const { 
    botMeetings, 
    botStatus, 
    isLoading: botStatusLoading,
    toggleAutoJoin: toggleAutoJoinMutation,
    toggleAutoRecord: toggleAutoRecordMutation,
    setJoinMode: setJoinModeMutation,
    troubleshootBot
  } = useBotStatus();

  const { 
    collaborators, 
    isLoading: collaboratorsLoading 
  } = useCollaborators();

  const { 
    meetingComparison, 
    isLoading: meetingComparisonLoading 
  } = useMeetingComparison();

  const { 
    risks: enterpriseRisks, 
    isLoading: enterpriseRisksLoading,
    acknowledgeRisk,
    resolveRisk
  } = useEnterpriseRisks();
  const { data: meetingAnalytics, isLoading: meetingAnalyticsLoading } = useMeetingAnalytics();

  // Wrapper functions to match the expected interface
  const handleBotToggleAutoJoin = (meetingId: string, enabled: boolean) => {
    toggleAutoJoinMutation({ meetingId, enabled });
  };

  const handleBotToggleAutoRecord = (meetingId: string, enabled: boolean) => {
    toggleAutoRecordMutation({ meetingId, enabled });
  };

  const handleBotSetJoinMode = (meetingId: string, mode: 'audio_only' | 'speaker_view') => {
    setJoinModeMutation({ meetingId, mode });
  };

  useGoogleAnalytics();











  const mockSyncQueue = [
    {
      id: '1',
      type: 'meeting' as const,
      title: 'Client Meeting Recording',
      size: 52428800, // 50MB
      status: 'pending' as const,
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      type: 'transcript' as const,
      title: 'Team Sync Transcript',
      size: 1048576, // 1MB
      status: 'synced' as const,
      createdAt: '2024-01-14T14:00:00Z'
    }
  ];

  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(new Date());
  
  const thisWeekMeetings = meetings.filter(meeting => {
    const meetingDate = new Date(meeting.start_time);
    return meetingDate >= weekStart && meetingDate <= weekEnd;
  });

  const completedMeetings = thisWeekMeetings.filter(meeting => 
    new Date(meeting.end_time) < new Date()
  );

  const weeklyProgress = thisWeekMeetings.length > 0 
    ? Math.round((completedMeetings.length / thisWeekMeetings.length) * 100)
    : 0;

  const getTimeUntilMeeting = (meeting: Meeting) => {
    const now = new Date();
    const meetingTime = new Date(meeting.start_time);
    const diffMs = meetingTime.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffMs < 0) return "Started";
    if (diffHours === 0) return `${diffMinutes}m`;
    if (diffHours < 24) return `${diffHours}h ${diffMinutes}m`;
    return format(meetingTime, 'MMM d');
  };

  const handleJoinMeeting = (meetingUrl: string) => {
    window.open(meetingUrl, '_blank');
  };

  const handleJoinWithBot = async (meetingId: string, joinMode: JoinMode = 'audio_only'): Promise<void> => {
    try {
      await joinMeetingWithBot(meetingId, joinMode);
    } catch (error) {
      console.error('Failed to join meeting with bot:', error);
    }
  };

  const handleMeetingClick = (meeting: Meeting) => {
    navigate(`/app/meetings/${meeting.id}`);
  };

  const handleSetJoinMode = (meetingId: string, mode: JoinMode) => {
    console.log('Setting join mode:', meetingId, mode);
  };

  const filteredMeetings = meetings.filter(meeting =>
    meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meeting.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Convert meetings to SearchResult format for SearchResults component
  const searchResults = filteredMeetings.map(meeting => ({
    id: meeting.id,
    title: meeting.title,
    snippet: meeting.description || '',
    date: meeting.start_time,
    meetingId: meeting.id,
    type: 'meeting' as const,
    relevanceScore: 1
  }));

  const nextMeeting = todayMeetings.find(meeting => new Date(meeting.start_time) > new Date()) || 
                    upcomingMeetings[0];

  // Convert search result back to meeting for navigation
  const handleSearchResultClick = (result: any) => {
    const meeting = meetings.find(m => m.id === result.id);
    if (meeting) {
      handleMeetingClick(meeting);
    }
  };

  // Convert meetings to recent recordings format for RecentMeetingsCard
  const recentRecordings = meetings.slice(0, 5).map(meeting => ({
    title: meeting.title,
    date: meeting.start_time,
    duration: 'Unknown',
    hasTranscript: false,
    hasInsights: false,
    meetingId: meeting.id,
    meeting_summary: undefined
  }));

  const handleRecentRecordingClick = (recording: any) => {
    if (recording.meetingId) {
      navigate(`/app/meetings/${recording.meetingId}`);
    }
  };

  // Create an async wrapper for the JoinMeetingModal onJoinMeeting prop
  const handleJoinMeetingFromModal = async (meetingInfo: {
    url: string;
    title: string;
    joinMode: JoinMode;
    useBot: boolean;
  }): Promise<void> => {
    try {
      console.log('Joining meeting from modal:', meetingInfo);
      
      // Open the meeting URL
      if (meetingInfo.url) {
        window.open(meetingInfo.url, '_blank');
      }
      
      if (meetingInfo.useBot) {
        toast({
          title: "Bot joining meeting",
          description: "The Action.IT bot is joining your meeting for recording and transcription.",
        });
        
        // Here you would typically create a meeting record and call joinMeetingWithBot
        // For now, we'll just show the success message
      }
    } catch (error) {
      console.error('Failed to join meeting from modal:', error);
      toast({
        title: "Failed to join meeting",
        description: "There was an error joining the meeting. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Event handlers for new dashboard components
  const handleActionItemStatusChange = (itemId: string, status: 'pending' | 'completed' | 'snoozed') => {
    updateActionItemStatus({ itemId, status });
  };

  const handleActionItemSnooze = (itemId: string, days: number) => {
    snoozeActionItem({ itemId, days });
  };

  const handleInsightClick = (insight: any) => {
    console.log('Insight clicked:', insight);
    navigate(`/app/insights/${insight.id}`);
  };



  const handleCollaboratorClick = (collaborator: any) => {
    console.log('Collaborator clicked:', collaborator);
    navigate(`/app/contacts/${collaborator.id}`);
  };

  const handleViewComparison = (comparison: any) => {
    console.log('View comparison clicked:', comparison);
    navigate(`/app/comparisons/${comparison.id}`);
  };

  const handleViewRisk = (risk: any) => {
    console.log('View risk:', risk);
    // TODO: Implement risk detail view
  };

  const handleAcknowledgeRisk = (riskId: string) => {
    acknowledgeRisk(riskId);
  };

  const handleResolveRisk = (riskId: string) => {
    resolveRisk(riskId);
  };

  const handleToggleOfflineMode = (enabled: boolean) => {
    console.log('Offline mode toggled:', enabled);
    toast({
      title: enabled ? "Offline mode enabled" : "Online mode enabled",
      description: enabled ? "All processing happens locally" : "Cloud processing enabled",
    });
  };

  const handleSyncNow = () => {
    console.log('Sync now clicked');
    toast({
      title: "Syncing data",
      description: "Uploading local data to cloud...",
    });
  };

  const handleViewSyncQueue = () => {
    console.log('View sync queue clicked');
    navigate('/app/sync-queue');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50/50 to-blue-50/30 dark:from-gray-950/50 dark:to-blue-950/30">
        <div className="container mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50/50 via-blue-50/30 to-indigo-50/20 dark:from-gray-950/50 dark:via-blue-950/30 dark:to-indigo-950/20">
      <div className="container mx-auto px-4 py-2">
        {/* Compact Header with Refresh Button */}
        <div className="flex justify-end mb-2">
          <Button 
            onClick={() => refreshData()}
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            title="Refresh Calendar"
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <Card className="border-red-200 dark:border-red-800 bg-red-50/80 dark:bg-red-950/20 backdrop-blur-sm rounded-xl mb-4">
            <CardContent className="pt-6">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Search Results */}
        {searchQuery && (
          <SearchResults 
            results={searchResults}
            isVisible={true}
            onResultClick={handleSearchResultClick}
            onClose={() => setSearchQuery('')}
            searchTerm={searchQuery}
            selectedIndex={-1}
          />
        )}

        {!searchQuery && (
          <>
            {/* Enhanced Stats Overview with functional color coding */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {/* Calendar & Meeting Colors */}
              <Card className="bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-purple-50/30 dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-purple-950/10 backdrop-blur-sm border-blue-200/50 dark:border-blue-800/30 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] rounded-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 py-2">
                  <CardTitle className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                    Today's Meetings
                  </CardTitle>
                  <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-1">
                    <CalendarCheck className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0 px-3 pb-2">
                  <div className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-1">
                    {todayMeetings.length}
                  </div>
                  <p className="text-xs text-blue-700/70 dark:text-blue-300/70">
                    {todayMeetings.filter(m => new Date(m.start_time) > new Date()).length} upcoming
                  </p>
                </CardContent>
              </Card>

              {/* Insights & Analytics Colors */}
              <Card className="bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-cyan-50/30 dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-cyan-950/10 backdrop-blur-sm border-emerald-200/50 dark:border-emerald-800/30 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] rounded-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 py-2">
                  <CardTitle className="text-xs font-semibold text-emerald-900 dark:text-emerald-100">
                    This Week
                  </CardTitle>
                  <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-full p-1">
                    <Activity className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0 px-3 pb-2">
                  <div className="text-xl font-bold text-emerald-900 dark:text-emerald-100 mb-1">
                    {thisWeekMeetings.length}
                  </div>
                  <p className="text-xs text-emerald-700/70 dark:text-emerald-300/70">
                    {weeklyProgress}% completed
                  </p>
                </CardContent>
              </Card>

              {/* System Status Colors */}
              <Card className="bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-red-50/30 dark:from-amber-950/20 dark:via-orange-950/10 dark:to-red-950/10 backdrop-blur-sm border-amber-200/50 dark:border-amber-800/30 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] rounded-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 py-2">
                  <CardTitle className="text-xs font-semibold text-amber-900 dark:text-amber-100">
                    Next Meeting
                  </CardTitle>
                  <div className="bg-amber-100 dark:bg-amber-900/30 rounded-full p-1">
                    <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0 px-3 pb-2">
                  <div className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-1">
                    {nextMeeting ? getTimeUntilMeeting(nextMeeting) : 'None'}
                  </div>
                  {nextMeeting && (
                    <p className="text-xs text-amber-700/70 dark:text-amber-300/70 truncate">
                      {nextMeeting.title}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              {/* Left Column - Calendar and Recent Meetings */}
              <div className="lg:col-span-2 space-y-6">
                <DashboardCalendarCard 
                  meetings={meetings}
                  joiningMeetings={joiningMeetings}
                  meetingJoinModes={meetingJoinModes}
                  onJoinMeeting={handleJoinMeeting}
                  onJoinMeetingWithBot={handleJoinWithBot}
                  onSetJoinMode={handleSetJoinMode}
                  onUpdateMeeting={updateMeeting}
                  className="glass-card"
                />
                
                <RecentMeetingsCard 
                  recentRecordings={recentRecordings}
                  isLoadingInsights={insightsLoading}
                  onRecentRecordingClick={handleRecentRecordingClick}
                />

                {/* New Action Items Card */}
                <ActionItemsCard 
                  actionItems={actionItems || []}
                  onStatusChange={handleActionItemStatusChange}
                  onSnooze={handleActionItemSnooze}
                />

                {/* New Insights Timeline Card */}
                <InsightsTimelineCard 
                  insights={timelineInsights || []}
                  onInsightClick={handleInsightClick}
                />

                {/* New Bot Status Card */}
                <BotStatusCard 
                  botMeetings={botMeetings}
                  isOnline={botStatus.isOnline}
                  syncStatus={botStatus.syncStatus}
                  onToggleAutoJoin={handleBotToggleAutoJoin}
                  onToggleAutoRecord={handleBotToggleAutoRecord}
                  onSetJoinMode={handleBotSetJoinMode}
                  onTroubleshoot={troubleshootBot}
                />

                {/* New Attendee Intelligence Card */}
                <AttendeeIntelligenceCard 
                  collaborators={collaborators}
                  onCollaboratorClick={handleCollaboratorClick}
                />

                {/* New Meeting Comparison Card */}
                {meetingComparison && (
                  <MeetingComparisonCard 
                    comparison={meetingComparison}
                    onViewComparison={handleViewComparison}
                  />
                )}

                {/* New Enterprise Risk Detection Badge */}
                <EnterpriseRiskDetectionBadge 
                  risks={enterpriseRisks}
                  isLoading={enterpriseRisksLoading}
                  onViewRisk={handleViewRisk}
                  onAcknowledgeRisk={handleAcknowledgeRisk}
                  onResolveRisk={handleResolveRisk}
                />
              </div>

              {/* Right Column - Latest Summary and Quick Actions */}
              <div className="space-y-6">
                <LatestMeetingSummary 
                  meetingSummary={insightsArray.length > 0 ? {
                    title: 'Recent Meeting',
                    summary: insightsArray[0].insight_summary || 'No summary available',
                    date: new Date().toISOString(),
                    meetingId: 'latest'
                  } : null}
                />
                


                {/* New Analytics Card */}
                <MeetingAnalyticsCard 
                  analytics={meetingAnalytics}
                  isLoading={meetingAnalyticsLoading}
                />

                {/* New Offline Mode Card */}
                <OfflineModeCard 
                  isOfflineMode={false}
                  onToggleOfflineMode={handleToggleOfflineMode}
                  syncQueue={mockSyncQueue}
                  localStorageUsed={150}
                  totalStorage={1024}
                  onSyncNow={handleSyncNow}
                  onViewSyncQueue={handleViewSyncQueue}
                />
              </div>
            </div>
          </>
        )}

        {/* Join Meeting Modal */}
        <JoinMeetingModal 
          open={showJoinModal}
          onOpenChange={setShowJoinModal}
          onJoinMeeting={handleJoinMeetingFromModal}
        />
      </div>
    </div>
  );
};

export default Dashboard;
