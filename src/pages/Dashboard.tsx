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
import { OfflineModeCard } from '@/components/dashboard/OfflineModeCard';
import { Meeting } from '@/services/calendarService';
import { JoinMode } from '@/services/recallService';
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';
import { Database } from 'lucide-react';

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

  useGoogleAnalytics();

  // Mock data for new dashboard components
  const mockActionItems = [
    {
      id: '1',
      title: 'Follow up with client on proposal',
      description: 'Send updated proposal to ABC Corp by Friday',
      status: 'pending' as const,
      dueDate: '2024-01-20',
      assignedTo: 'John Doe',
      meetingId: 'meeting-1',
      meetingTitle: 'Client Review Meeting',
      priority: 'high' as const,
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      title: 'Schedule team retrospective',
      description: 'Plan quarterly team retrospective meeting',
      status: 'completed' as const,
      dueDate: '2024-01-18',
      assignedTo: 'Jane Smith',
      meetingId: 'meeting-2',
      meetingTitle: 'Sprint Planning',
      priority: 'medium' as const,
      createdAt: '2024-01-14T14:00:00Z'
    },
    {
      id: '3',
      title: 'Review budget allocation',
      description: 'Analyze Q1 budget vs actual spending',
      status: 'snoozed' as const,
      dueDate: '2024-01-25',
      assignedTo: 'Mike Johnson',
      meetingId: 'meeting-3',
      meetingTitle: 'Budget Review',
      priority: 'low' as const,
      createdAt: '2024-01-13T09:00:00Z'
    }
  ];

  const mockInsights = [
    {
      id: '1',
      title: 'Customer feedback indicates need for mobile app',
      description: 'Multiple clients mentioned mobile accessibility as a priority',
      type: 'decision' as const,
      tags: ['customer', 'mobile', 'priority'],
      meetingId: 'meeting-1',
      meetingTitle: 'Product Strategy Meeting',
      meetingDate: '2024-01-15T10:00:00Z',
      attendees: ['John Doe', 'Jane Smith', 'Client Rep'],
      status: 'active' as const,
      createdAt: '2024-01-15T12:00:00Z'
    },
    {
      id: '2',
      title: 'Technical debt needs immediate attention',
      description: 'Legacy system causing 30% performance degradation',
      type: 'blocker' as const,
      tags: ['technical', 'blocker', 'performance'],
      meetingId: 'meeting-2',
      meetingTitle: 'Engineering Standup',
      meetingDate: '2024-01-14T09:00:00Z',
      attendees: ['Dev Team', 'Tech Lead'],
      status: 'pending' as const,
      createdAt: '2024-01-14T10:00:00Z'
    }
  ];

  const mockBotMeetings = [
    {
      id: '1',
      title: 'Weekly Team Sync',
      startTime: '2024-01-20T10:00:00Z',
      endTime: '2024-01-20T11:00:00Z',
      autoJoin: true,
      autoRecord: true,
      joinMode: 'audio_only' as const,
      status: 'scheduled' as const
    },
    {
      id: '2',
      title: 'Client Presentation',
      startTime: '2024-01-21T14:00:00Z',
      endTime: '2024-01-21T15:00:00Z',
      autoJoin: true,
      autoRecord: false,
      joinMode: 'speaker_view' as const,
      status: 'scheduled' as const
    }
  ];

  const mockCollaborators = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@company.com',
      avatar: undefined,
      meetingCount: 15,
      lastMeeting: '2024-01-15T10:00:00Z',
      totalDuration: 1200,
      crmData: {
        company: 'ABC Corp',
        dealValue: 50000,
        dealStage: 'negotiation',
        ticketCount: 3
      }
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@company.com',
      avatar: undefined,
      meetingCount: 12,
      lastMeeting: '2024-01-14T14:00:00Z',
      totalDuration: 900,
      crmData: {
        company: 'XYZ Inc',
        dealValue: 75000,
        dealStage: 'proposal',
        ticketCount: 1
      }
    }
  ];

  const mockMeetingComparison = {
    id: '1',
    currentMeeting: {
      id: 'current-1',
      title: 'Weekly Team Sync',
      date: '2024-01-15T10:00:00Z',
      duration: 60,
      attendees: 8,
      decisions: 3,
      actionItems: 5
    },
    previousMeetings: [
      {
        id: 'prev-1',
        title: 'Weekly Team Sync',
        date: '2024-01-08T10:00:00Z',
        duration: 75,
        attendees: 7,
        decisions: 2,
        actionItems: 4
      },
      {
        id: 'prev-2',
        title: 'Weekly Team Sync',
        date: '2024-01-01T10:00:00Z',
        duration: 90,
        attendees: 9,
        decisions: 4,
        actionItems: 6
      }
    ],
    trends: {
      duration: 'down' as const,
      attendees: 'up' as const,
      decisions: 'up' as const,
      actionItems: 'down' as const
    },
    improvements: [
      'Meeting duration reduced by 20%',
      'More focused decision making',
      'Better time management'
    ],
    unresolvedItems: [
      'Technical debt discussion postponed',
      'Budget approval still pending'
    ]
  };

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
    console.log('Action item status changed:', itemId, status);
    toast({
      title: "Action item updated",
      description: `Item marked as ${status}`,
    });
  };

  const handleActionItemSnooze = (itemId: string, days: number) => {
    console.log('Action item snoozed:', itemId, days);
    toast({
      title: "Action item snoozed",
      description: `Reminder set for ${days} day${days > 1 ? 's' : ''} from now`,
    });
  };

  const handleInsightClick = (insight: any) => {
    console.log('Insight clicked:', insight);
    navigate(`/app/insights/${insight.id}`);
  };

  const handleBotToggleAutoJoin = (meetingId: string, enabled: boolean) => {
    console.log('Bot auto-join toggled:', meetingId, enabled);
    toast({
      title: enabled ? "Bot will auto-join" : "Bot auto-join disabled",
      description: `Meeting: ${meetingId}`,
    });
  };

  const handleBotToggleAutoRecord = (meetingId: string, enabled: boolean) => {
    console.log('Bot auto-record toggled:', meetingId, enabled);
    toast({
      title: enabled ? "Bot will record meeting" : "Bot recording disabled",
      description: `Meeting: ${meetingId}`,
    });
  };

  const handleBotSetJoinMode = (meetingId: string, mode: 'audio_only' | 'speaker_view') => {
    console.log('Bot join mode set:', meetingId, mode);
    toast({
      title: "Bot join mode updated",
      description: `Mode: ${mode}`,
    });
  };

  const handleBotTroubleshoot = () => {
    console.log('Bot troubleshoot clicked');
    toast({
      title: "Troubleshooting",
      description: "Running diagnostics...",
    });
  };

  const handleCollaboratorClick = (collaborator: any) => {
    console.log('Collaborator clicked:', collaborator);
    navigate(`/app/contacts/${collaborator.id}`);
  };

  const handleViewComparison = (comparison: any) => {
    console.log('View comparison clicked:', comparison);
    navigate(`/app/comparisons/${comparison.id}`);
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
      <div className="container mx-auto p-4 md:p-6 space-y-6 md:space-y-8">
        {/* Enhanced Header with Apple-inspired design */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full p-2">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sf-display">
                Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
              </h1>
            </div>
            <p className="text-base text-gray-600 dark:text-gray-400 sf-text">
              {format(new Date(), 'EEEE, MMMM d, yyyy')} • {format(new Date(), 'h:mm a')}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchInput 
              placeholder="Search meetings..."
            />
            <Button 
              onClick={() => refreshData()}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Calendar className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Refresh Calendar</span>
              <span className="sm:hidden">Refresh</span>
            </Button>
          </div>
        </div>

        {error && (
          <Card className="border-red-200 dark:border-red-800 bg-red-50/80 dark:bg-red-950/20 backdrop-blur-sm rounded-xl">
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {/* Calendar & Meeting Colors */}
              <Card className="bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-purple-50/30 dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-purple-950/10 backdrop-blur-sm border-blue-200/50 dark:border-blue-800/30 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] rounded-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    Today's Meetings
                  </CardTitle>
                  <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-2">
                    <CalendarCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl md:text-3xl font-bold text-blue-900 dark:text-blue-100 mb-1">
                    {todayMeetings.length}
                  </div>
                  <p className="text-xs text-blue-700/70 dark:text-blue-300/70">
                    {todayMeetings.filter(m => new Date(m.start_time) > new Date()).length} upcoming
                  </p>
                </CardContent>
              </Card>

              {/* Insights & Analytics Colors */}
              <Card className="bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-cyan-50/30 dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-cyan-950/10 backdrop-blur-sm border-emerald-200/50 dark:border-emerald-800/30 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] rounded-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                    This Week
                  </CardTitle>
                  <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-full p-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl md:text-3xl font-bold text-emerald-900 dark:text-emerald-100 mb-2">
                    {thisWeekMeetings.length}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-700/70 dark:text-emerald-300/70">Progress</span>
                      <span className="text-emerald-700/70 dark:text-emerald-300/70 font-medium">
                        {weeklyProgress}%
                      </span>
                    </div>
                    <Progress value={weeklyProgress} className="h-2 bg-emerald-100 dark:bg-emerald-900/30" />
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity Colors */}
              <Card className="bg-gradient-to-br from-purple-50/80 via-violet-50/40 to-fuchsia-50/30 dark:from-purple-950/20 dark:via-violet-950/10 dark:to-fuchsia-950/10 backdrop-blur-sm border-purple-200/50 dark:border-purple-800/30 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] rounded-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                    Key Insights
                  </CardTitle>
                  <div className="bg-purple-100 dark:bg-purple-900/30 rounded-full p-2">
                    <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl md:text-3xl font-bold text-purple-900 dark:text-purple-100 mb-1">
                    {insightsArray.length}
                  </div>
                  <p className="text-xs text-purple-700/70 dark:text-purple-300/70">
                    {insightsArray.filter(i => Array.isArray(i.action_items) && i.action_items.length > 0).length} with actions
                  </p>
                </CardContent>
              </Card>

              {/* System Status Colors */}
              <Card className="bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-red-50/30 dark:from-amber-950/20 dark:via-orange-950/10 dark:to-red-950/10 backdrop-blur-sm border-amber-200/50 dark:border-amber-800/30 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] rounded-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                    Next Meeting
                  </CardTitle>
                  <div className="bg-amber-100 dark:bg-amber-900/30 rounded-full p-2">
                    <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xl md:text-2xl font-bold text-amber-900 dark:text-amber-100 mb-1">
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
                  actionItems={mockActionItems}
                  onStatusChange={handleActionItemStatusChange}
                  onSnooze={handleActionItemSnooze}
                />

                {/* New Insights Timeline Card */}
                <InsightsTimelineCard 
                  insights={mockInsights}
                  onInsightClick={handleInsightClick}
                />

                {/* New Bot Status Card */}
                <BotStatusCard 
                  botMeetings={mockBotMeetings}
                  isOnline={true}
                  syncStatus="synced"
                  onToggleAutoJoin={handleBotToggleAutoJoin}
                  onToggleAutoRecord={handleBotToggleAutoRecord}
                  onSetJoinMode={handleBotSetJoinMode}
                  onTroubleshoot={handleBotTroubleshoot}
                />

                {/* New Attendee Intelligence Card */}
                <AttendeeIntelligenceCard 
                  collaborators={mockCollaborators}
                  onCollaboratorClick={handleCollaboratorClick}
                />

                {/* New Meeting Comparison Card */}
                <MeetingComparisonCard 
                  comparison={mockMeetingComparison}
                  onViewComparison={handleViewComparison}
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
                
                {/* Enhanced Quick Actions with Apple-inspired design */}
                <Card className="glass-card border-purple-200/50 dark:border-purple-800/30">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      Quick Actions
                    </CardTitle>
                    <CardDescription>Common tasks and shortcuts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-200 hover:scale-[1.02]" 
                      asChild
                    >
                      <Link to="/app/calendar">
                        <Calendar className="mr-2 h-4 w-4" />
                        View Full Calendar
                      </Link>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-start hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-all duration-200 hover:scale-[1.02]" 
                      onClick={() => setShowJoinModal(true)}
                    >
                      <Bot className="mr-2 h-4 w-4" />
                      Join Meeting with Bot
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-start hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all duration-200 hover:scale-[1.02]" 
                      onClick={() => refreshData()}
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      Sync Calendar Data
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-start hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all duration-200 hover:scale-[1.02]" 
                      asChild
                    >
                      <Link to="/app/settings">
                        <Users className="mr-2 h-4 w-4" />
                        Manage Settings
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                {/* New Analytics Card */}
                <Card className="glass-card border-emerald-200/50 dark:border-emerald-800/30">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      Meeting Analytics
                    </CardTitle>
                    <CardDescription>Your meeting performance insights</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Weekly Completion</span>
                      <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        {weeklyProgress}%
                      </span>
                    </div>
                    <Progress value={weeklyProgress} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Meetings</span>
                      <span className="text-sm font-medium">{meetings.length}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">This Week</span>
                      <span className="text-sm font-medium">{thisWeekMeetings.length}</span>
                    </div>
                  </CardContent>
                </Card>

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
