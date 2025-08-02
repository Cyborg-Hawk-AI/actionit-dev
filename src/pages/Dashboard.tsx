import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, TrendingUp, CalendarCheck, Zap, Search, Bot, ExternalLink, Loader2 } from 'lucide-react';
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50/50 to-blue-50/30 dark:from-gray-950/50 dark:to-blue-950/30">
      <div className="container mx-auto p-4 md:p-6 space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
              </h1>
            </div>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
              {format(new Date(), 'EEEE, MMMM d, yyyy')} • {format(new Date(), 'h:mm a')}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchInput 
              placeholder="Search meetings..."
            />
            <Button 
              onClick={() => refreshData()}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              <Calendar className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Refresh Calendar</span>
              <span className="sm:hidden">Refresh</span>
            </Button>
          </div>
        </div>

        {error && (
          <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
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
            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              <Card className="gradient-calendar hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium text-blue-900 dark:text-blue-100">
                    Today's Meetings
                  </CardTitle>
                  <CalendarCheck className="h-3 w-3 md:h-4 md:w-4 text-blue-600 dark:text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl md:text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {todayMeetings.length}
                  </div>
                  <p className="text-xs text-blue-700/70 dark:text-blue-300/70">
                    {todayMeetings.filter(m => new Date(m.start_time) > new Date()).length} upcoming
                  </p>
                </CardContent>
              </Card>

              <Card className="gradient-insights hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium text-green-900 dark:text-green-100">
                    This Week
                  </CardTitle>
                  <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-600 dark:text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl md:text-2xl font-bold text-green-900 dark:text-green-100">
                    {thisWeekMeetings.length}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Progress value={weeklyProgress} className="flex-1 h-1" />
                    <span className="text-xs text-green-700/70 dark:text-green-300/70">
                      {weeklyProgress}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="gradient-recent hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium text-purple-900 dark:text-purple-100">
                    Key Insights
                  </CardTitle>
                  <Zap className="h-3 w-3 md:h-4 md:w-4 text-purple-600 dark:text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl md:text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {insightsArray.length}
                  </div>
                  <p className="text-xs text-purple-700/70 dark:text-purple-300/70">
                    {insightsArray.filter(i => Array.isArray(i.action_items) && i.action_items.length > 0).length} with actions
                  </p>
                </CardContent>
              </Card>

              <Card className="gradient-status hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium text-amber-900 dark:text-amber-100">
                    Next Meeting
                  </CardTitle>
                  <Clock className="h-3 w-3 md:h-4 md:w-4 text-amber-600 dark:text-amber-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg md:text-xl font-bold text-amber-900 dark:text-amber-100">
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

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              {/* Left Column - Calendar and Recent Meetings */}
              <div className="lg:col-span-2 space-y-6">
                <DashboardCalendarCard 
                  meetings={[...todayMeetings, ...upcomingMeetings]}
                  joiningMeetings={joiningMeetings}
                  meetingJoinModes={meetingJoinModes}
                  onJoinMeeting={handleJoinMeeting}
                  onJoinMeetingWithBot={handleJoinWithBot}
                  onSetJoinMode={handleSetJoinMode}
                  onUpdateMeeting={updateMeeting}
                />
                
                <RecentMeetingsCard 
                  recentRecordings={recentRecordings}
                  isLoadingInsights={insightsLoading}
                  onRecentRecordingClick={handleRecentRecordingClick}
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
                
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                    <CardDescription>Common tasks and shortcuts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      asChild
                    >
                      <Link to="/app/calendar">
                        <Calendar className="mr-2 h-4 w-4" />
                        View Full Calendar
                      </Link>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      onClick={() => setShowJoinModal(true)}
                    >
                      <Bot className="mr-2 h-4 w-4" />
                      Join Meeting with Bot
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      onClick={() => refreshData()}
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      Sync Calendar Data
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      asChild
                    >
                      <Link to="/app/settings">
                        <Users className="mr-2 h-4 w-4" />
                        Manage Settings
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
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
