import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Loader2, RefreshCw, ExternalLink, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCalendarData } from '@/hooks/useCalendarData';
import EventList from '@/components/calendar/EventList';
import CollapsibleSidebar from '@/components/calendar/CollapsibleSidebar';
import CalendarNavigation from '@/components/calendar/CalendarNavigation';
import { Link, useNavigate } from 'react-router-dom';
import { DayCalendarView, WeekCalendarView, MonthCalendarView } from '@/components/calendar/CalendarViews';
import AgendaView from '@/components/calendar/AgendaView';
import { JoinMode } from '@/services/recallService';
import { Meeting } from '@/services/calendarService';
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';

const CalendarPage = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month' | 'agenda'>('week');
  const [is24Hour, setIs24Hour] = useState<boolean>(false);

  const { 
    meetings,
    todayMeetings,
    upcomingMeetings,
    calendars,
    isLoading,
    isSyncing,
    error,
    refreshData,
    scheduleBotForMeeting,
    joinMeetingWithBot,
    updateMeeting,
    joiningMeetings,
    meetingJoinModes
  } = useCalendarData();

  const [enabledCalendars, setEnabledCalendars] = useState<{[id: string]: boolean}>({});
  
  // Set initial enabled calendars
  useEffect(() => {
    if (calendars.length > 0) {
      const initial: {[id: string]: boolean} = {};
      calendars.forEach(cal => {
        initial[cal.id] = true;
      });
      setEnabledCalendars(initial);
    }
  }, [calendars]);
  
  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
  };
  
  const handleCalendarToggle = (calendarId: string, checked: boolean) => {
    console.log(`Toggling calendar ${calendarId} to ${checked}`);
    setEnabledCalendars(prev => ({
      ...prev,
      [calendarId]: checked
    }));
  };
  
  const handleJoinMeeting = (meetingUrl: string) => {
    window.open(meetingUrl, '_blank');
  };
  
  const handleJoinWithBot = async (meetingId: string): Promise<void> => {
    try {
      await joinMeetingWithBot(meetingId, 'audio_only', true);
    } catch (error) {
      console.error('Failed to join meeting with bot:', error);
    }
  };
  
  const handleSetJoinMode = (meetingId: string, mode: JoinMode) => {
    console.log(`Setting join mode for meeting ${meetingId} to ${mode}`);
  };
  
  const handleUpdateMeeting = (meetingId: string, setting: 'auto_join' | 'auto_record', currentValue: boolean) => {
    updateMeeting(meetingId, setting, !currentValue);
  };
  
  const handleEventClick = (meeting: Meeting) => {
    console.log('Meeting clicked:', meeting);
    navigate(`/app/meetings/${meeting.id}`);
  };
  
  // Filter meetings based on enabled calendars
  const filteredMeetings = meetings.filter(meeting => {
    if (!meeting.calendar_external_id) return true;
    
    const calendar = calendars.find(cal => cal.external_id === meeting.calendar_external_id);
    
    if (calendar) {
      return enabledCalendars[calendar.id] === true;
    }
    
    return true;
  });

  useGoogleAnalytics();

  return (
    <div className="h-full flex flex-col">
      {/* Enhanced header with gradient background */}
      <div className="gradient-calendar border-b border-blue-200/40 dark:border-blue-800/30">
        <div className="container mx-auto p-3 md:p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 md:gap-4 mb-3 md:mb-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-blue-900 dark:text-blue-100">Calendar</h1>
              <p className="text-sm md:text-base text-blue-700/70 dark:text-blue-300/70">
                Manage your meetings and Action.IT bot settings.
              </p>
              <div className="text-xs md:text-sm text-blue-600/60 dark:text-blue-400/60 mt-1">
                <Link to="/docs/action-it-bot-meeting-functionality" className="text-blue-600 dark:text-blue-400 inline-flex items-center hover:underline">
                  <ExternalLink className="h-3 w-3 md:h-3.5 md:w-3.5 mr-1" />
                  <span className="hidden md:inline">Learn how the bot works with your calendar</span>
                  <span className="md:hidden">Bot guide</span>
                </Link>
              </div>
            </div>
            
            <div className="flex items-center gap-3 md:gap-4">
              <Button 
                onClick={refreshData} 
                disabled={isSyncing}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white shadow-md text-sm md:text-base px-3 py-2 md:px-4 md:py-2"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" />
                    <span className="hidden md:inline">Syncing...</span>
                    <span className="md:hidden">...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                    <span className="hidden md:inline">Refresh</span>
                    <span className="md:hidden">Sync</span>
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Enhanced tabs with colorful styling */}
          <Tabs defaultValue={view} onValueChange={(v) => setView(v as any)} className="mb-4 md:mb-6">
            <div className="flex items-center justify-between mb-2">
              <TabsList className="bg-white/70 dark:bg-[#1A1A1A]/70 border border-blue-200/50 dark:border-blue-800/50 grid grid-cols-4 w-full max-w-md">
                <TabsTrigger value="day" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 dark:data-[state=active]:bg-blue-900 dark:data-[state=active]:text-blue-100 text-xs md:text-sm">Day</TabsTrigger>
                <TabsTrigger value="week" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 dark:data-[state=active]:bg-blue-900 dark:data-[state=active]:text-blue-100 text-xs md:text-sm">Week</TabsTrigger>
                <TabsTrigger value="month" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 dark:data-[state=active]:bg-blue-900 dark:data-[state=active]:text-blue-100 text-xs md:text-sm">Month</TabsTrigger>
                <TabsTrigger value="agenda" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900 dark:data-[state=active]:bg-blue-900 dark:data-[state=active]:text-blue-100 text-xs md:text-sm">Agenda</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="24-hour"
                  checked={is24Hour}
                  onCheckedChange={setIs24Hour}
                />
                <Label htmlFor="24-hour" className="text-blue-700 dark:text-blue-300 text-sm">
                  <span className="hidden md:inline">24-hour</span>
                  <span className="md:hidden">24h</span>
                </Label>
              </div>
            </div>
          </Tabs>

          <CalendarNavigation
            selectedDate={date || new Date()}
            view={view}
            onDateChange={(newDate) => setDate(newDate)}
          />
        </div>
      </div>

      <div className="flex h-full">
        <div className="hidden md:block">
          <CollapsibleSidebar
            selectedDate={date || new Date()}
            onDateSelect={handleDateSelect}
            calendars={calendars}
            onCalendarToggle={handleCalendarToggle}
            enabledCalendars={enabledCalendars}
            className="border-r dark:border-[#2C2C2C]"
          />
        </div>

        <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-50/30 to-blue-50/20 dark:from-gray-950/30 dark:to-blue-950/20">
          {isLoading ? (
            <div className="py-8 flex items-center justify-center h-full">
              <Loader2 className="mr-2 h-6 w-6 animate-spin text-blue-500" />
              <span className="text-blue-700 dark:text-blue-300">Loading calendar data...</span>
            </div>
          ) : error ? (
            <div className="text-red-500 p-4">{error}</div>
          ) : (
            <>
              {view === 'day' && (
                <div className="h-full gradient-day-view">
                  <DayCalendarView
                    selectedDate={date || new Date()}
                    meetings={filteredMeetings}
                    enabledCalendars={enabledCalendars}
                    calendars={calendars}
                    is24Hour={is24Hour}
                    joiningMeetings={joiningMeetings}
                    meetingJoinModes={meetingJoinModes}
                    onJoinMeeting={handleJoinMeeting}
                    onJoinMeetingWithBot={handleJoinWithBot}
                    onSetJoinMode={handleSetJoinMode}
                    onUpdateMeeting={handleUpdateMeeting}
                    onEventClick={handleEventClick}
                  />
                </div>
              )}
              
              {view === 'week' && (
                <div className="h-full gradient-week-view">
                  <WeekCalendarView
                    selectedDate={date || new Date()}
                    meetings={filteredMeetings}
                    enabledCalendars={enabledCalendars}
                    calendars={calendars}
                    is24Hour={is24Hour}
                    joiningMeetings={joiningMeetings}
                    meetingJoinModes={meetingJoinModes}
                    onJoinMeeting={handleJoinMeeting}
                    onJoinMeetingWithBot={handleJoinWithBot}
                    onSetJoinMode={handleSetJoinMode}
                    onUpdateMeeting={handleUpdateMeeting}
                    onEventClick={handleEventClick}
                  />
                </div>
              )}
              
              {view === 'month' && (
                <div className="h-full gradient-month-view">
                  <MonthCalendarView
                    selectedDate={date || new Date()}
                    meetings={filteredMeetings}
                    enabledCalendars={enabledCalendars}
                    calendars={calendars}
                    is24Hour={is24Hour}
                    joiningMeetings={joiningMeetings}
                    meetingJoinModes={meetingJoinModes}
                    onJoinMeeting={handleJoinMeeting}
                    onJoinMeetingWithBot={handleJoinWithBot}
                    onSetJoinMode={handleSetJoinMode}
                    onUpdateMeeting={handleUpdateMeeting}
                    onEventClick={handleEventClick}
                  />
                </div>
              )}
              
              {view === 'agenda' && (
                <div className="h-full gradient-agenda-view">
                  <AgendaView
                    selectedDate={date || new Date()}
                    meetings={filteredMeetings}
                    enabledCalendars={enabledCalendars}
                    calendars={calendars}
                    is24Hour={is24Hour}
                    joiningMeetings={joiningMeetings}
                    meetingJoinModes={meetingJoinModes}
                    onJoinMeeting={handleJoinMeeting}
                    onJoinMeetingWithBot={handleJoinWithBot}
                    onSetJoinMode={handleSetJoinMode}
                    onUpdateMeeting={handleUpdateMeeting}
                    onEventClick={handleEventClick}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
