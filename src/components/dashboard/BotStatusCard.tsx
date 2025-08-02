import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Bot, 
  Calendar, 
  Clock, 
  Users, 
  Mic,
  Video,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle,
  Settings
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface BotMeeting {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  autoJoin: boolean;
  autoRecord: boolean;
  joinMode: 'audio_only' | 'speaker_view';
  status: 'scheduled' | 'joining' | 'recording' | 'completed';
}

interface BotStatusCardProps {
  botMeetings: BotMeeting[];
  isOnline: boolean;
  syncStatus: 'synced' | 'syncing' | 'error';
  onToggleAutoJoin: (meetingId: string, enabled: boolean) => void;
  onToggleAutoRecord: (meetingId: string, enabled: boolean) => void;
  onSetJoinMode: (meetingId: string, mode: 'audio_only' | 'speaker_view') => void;
  onTroubleshoot: () => void;
  className?: string;
}

export function BotStatusCard({ 
  botMeetings, 
  isOnline, 
  syncStatus,
  onToggleAutoJoin,
  onToggleAutoRecord,
  onSetJoinMode,
  onTroubleshoot,
  className 
}: BotStatusCardProps) {
  const upcomingMeetings = botMeetings.filter(meeting => 
    new Date(meeting.startTime) > new Date()
  ).slice(0, 3);

  const getStatusIcon = (status: BotMeeting['status']) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'joining':
        return <Bot className="h-4 w-4 text-amber-600 animate-pulse" />;
      case 'recording':
        return <Mic className="h-4 w-4 text-green-600 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: BotMeeting['status']) => {
    const variants = {
      scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      joining: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      recording: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      completed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    };
    
    return (
      <Badge className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getSyncStatusColor = () => {
    switch (syncStatus) {
      case 'synced':
        return 'text-green-600 dark:text-green-400';
      case 'syncing':
        return 'text-amber-600 dark:text-amber-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
    }
  };

  return (
    <Card className={`bg-gradient-to-br from-teal-50/80 via-cyan-50/40 to-blue-50/30 dark:from-teal-950/20 dark:via-cyan-950/10 dark:to-blue-950/10 backdrop-blur-sm border-teal-200/50 dark:border-teal-800/30 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] rounded-xl ${className}`}>
      <CardHeader className="bg-gradient-to-r from-teal-100/50 to-cyan-100/50 dark:from-teal-900/20 dark:to-cyan-900/20 border-b border-teal-200/30 dark:border-teal-800/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-full p-2">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-teal-900 dark:text-teal-100">
                Bot Status
              </CardTitle>
              <CardDescription className="text-teal-700/70 dark:text-teal-300/70">
                AI assistant & auto-recording
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 text-xs ${getSyncStatusColor()}`}>
              {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            <Badge className="bg-teal-100/50 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300">
              {upcomingMeetings.filter(m => m.autoJoin).length} scheduled
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Sync Status */}
        <div className="p-4 pb-2">
          <div className="flex items-center justify-between p-3 bg-teal-50/50 dark:bg-teal-950/20 rounded-lg">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${syncStatus === 'synced' ? 'bg-green-500' : syncStatus === 'syncing' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-sm font-medium text-teal-900 dark:text-teal-100">
                {syncStatus === 'synced' ? 'All synced' : syncStatus === 'syncing' ? 'Syncing...' : 'Sync error'}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={onTroubleshoot}
              className="text-xs border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-950/20"
            >
              <Settings className="h-3 w-3 mr-1" />
              Troubleshoot
            </Button>
          </div>
        </div>

        {/* Upcoming Meetings */}
        <div className="px-4 pb-4 space-y-3">
          {upcomingMeetings.length === 0 ? (
            <div className="text-center py-8">
              <div className="bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Bot className="h-8 w-8 text-teal-600 dark:text-teal-400" />
              </div>
              <h4 className="text-base font-medium mb-2 text-teal-900 dark:text-teal-100">
                No upcoming meetings
              </h4>
              <p className="text-sm text-teal-700/70 dark:text-teal-300/70">
                Bot will join meetings automatically when scheduled
              </p>
            </div>
          ) : (
            upcomingMeetings.map((meeting) => (
              <div 
                key={meeting.id}
                className="p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg border border-teal-200/30 dark:border-teal-800/30"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(meeting.status)}
                    <h4 className="font-medium text-teal-900 dark:text-teal-100">
                      {meeting.title}
                    </h4>
                  </div>
                  {getStatusBadge(meeting.status)}
                </div>
                
                <div className="flex items-center gap-4 text-xs text-teal-600/70 dark:text-teal-400/70 mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{format(parseISO(meeting.startTime), 'MMM d, h:mm a')}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{format(parseISO(meeting.endTime), 'h:mm a')}</span>
                  </div>
                </div>
                
                {/* Bot Settings */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-teal-600" />
                      <span className="text-sm font-medium text-teal-900 dark:text-teal-100">
                        Auto-join meeting
                      </span>
                    </div>
                    <Switch 
                      checked={meeting.autoJoin}
                      onCheckedChange={(checked) => onToggleAutoJoin(meeting.id, checked)}
                    />
                  </div>
                  
                  {meeting.autoJoin && (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mic className="h-4 w-4 text-teal-600" />
                          <span className="text-sm font-medium text-teal-900 dark:text-teal-100">
                            Record meeting
                          </span>
                        </div>
                        <Switch 
                          checked={meeting.autoRecord}
                          onCheckedChange={(checked) => onToggleAutoRecord(meeting.id, checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4 text-teal-600" />
                          <span className="text-sm font-medium text-teal-900 dark:text-teal-100">
                            Join mode
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant={meeting.joinMode === 'audio_only' ? 'default' : 'outline'}
                            onClick={() => onSetJoinMode(meeting.id, 'audio_only')}
                            className="text-xs h-7 px-2"
                          >
                            Audio
                          </Button>
                          <Button
                            size="sm"
                            variant={meeting.joinMode === 'speaker_view' ? 'default' : 'outline'}
                            onClick={() => onSetJoinMode(meeting.id, 'speaker_view')}
                            className="text-xs h-7 px-2"
                          >
                            Video
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
} 