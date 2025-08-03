import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Bot, 
  Mic, 
  Video, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  StopCircle, 
  Play, 
  Pause,
  Eye,
  FileText,
  Zap,
  Loader2,
  X,
  Maximize2,
  Minimize2,
  Wifi,
  WifiOff,
  Shield,
  ShieldOff
} from 'lucide-react';
import { format } from 'date-fns';
import { Meeting } from '@/services/calendarService';
import { cn } from '@/lib/utils';

interface LiveMeetingViewProps {
  meeting: Meeting;
  isVisible: boolean;
  onClose: () => void;
  onStopBot: () => void;
  onRetryJoin: () => void;
  onViewSummary: () => void;
  onJoinMeeting: (meetingUrl: string) => void;
  onExpand?: () => void;
  onMinimize?: () => void;
}

interface BotStatus {
  isRecording: boolean;
  isConnected: boolean;
  recordingDuration: number;
  transcriptProgress: number;
  lastError?: string;
  joinAttempts: number;
  isOffline: boolean;
  securityMode: 'secure' | 'insecure';
  networkStatus: 'connected' | 'disconnected';
  audioLevel: number;
  participantsDetected: number;
}

const LiveMeetingView: React.FC<LiveMeetingViewProps> = ({
  meeting,
  isVisible,
  onClose,
  onStopBot,
  onRetryJoin,
  onViewSummary,
  onJoinMeeting,
  onExpand,
  onMinimize
}) => {
  const [botStatus, setBotStatus] = useState<BotStatus>({
    isRecording: true,
    isConnected: true,
    recordingDuration: 0,
    transcriptProgress: 45,
    joinAttempts: 1,
    isOffline: false,
    securityMode: 'secure',
    networkStatus: 'connected',
    audioLevel: 75,
    participantsDetected: 3
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Simulate real-time updates
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setBotStatus(prev => ({
        ...prev,
        recordingDuration: prev.recordingDuration + 1,
        transcriptProgress: Math.min(prev.transcriptProgress + 0.5, 100),
        audioLevel: Math.max(20, Math.min(90, prev.audioLevel + (Math.random() - 0.5) * 10))
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    if (!botStatus.isConnected) return 'text-red-500';
    if (botStatus.isRecording) return 'text-green-500';
    return 'text-yellow-500';
  };

  const getStatusIcon = () => {
    if (!botStatus.isConnected) return <AlertTriangle className="h-4 w-4" />;
    if (botStatus.isRecording) return <Mic className="h-4 w-4" />;
    return <Pause className="h-4 w-4" />;
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
    onExpand?.();
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
    onMinimize?.();
  };

  if (!isVisible) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-64 border-blue-200 dark:border-blue-800 shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", getStatusColor())}></div>
                <span className="text-sm font-medium truncate">{meeting.title}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMinimize}
                  className="h-6 w-6 p-0"
                >
                  <Maximize2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">
                {formatDuration(botStatus.recordingDuration)}
              </span>
              <span className="text-xs text-muted-foreground">
                {botStatus.participantsDetected} participants
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className={cn(
        "border-blue-200 dark:border-blue-800 shadow-lg transition-all duration-300",
        isExpanded ? "w-96" : "w-80"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Bot className="h-4 w-4 text-blue-600" />
              Live Meeting
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMinimize}
                className="h-6 w-6 p-0"
              >
                <Minimize2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Meeting Info */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm truncate">{meeting.title}</h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {format(new Date(meeting.start_time), 'h:mm a')} - {format(new Date(meeting.end_time), 'h:mm a')}
            </div>
          </div>

          {/* Bot Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Bot Status</span>
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className={cn("text-sm", getStatusColor())}>
                  {botStatus.isRecording ? 'Recording' : 'Paused'}
                </span>
              </div>
            </div>

            {/* Recording Duration */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-medium">{formatDuration(botStatus.recordingDuration)}</span>
            </div>

            {/* Transcript Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Transcript</span>
                <span className="font-medium">{Math.round(botStatus.transcriptProgress)}%</span>
              </div>
              <Progress value={botStatus.transcriptProgress} className="h-2" />
            </div>

            {/* Audio Level */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Audio Level</span>
                <span className="font-medium">{botStatus.audioLevel}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${botStatus.audioLevel}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Security & Network Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-2 rounded-lg border">
              {botStatus.securityMode === 'secure' ? (
                <Shield className="h-4 w-4 text-green-600" />
              ) : (
                <ShieldOff className="h-4 w-4 text-red-600" />
              )}
              <div>
                <p className="text-xs font-medium">Security</p>
                <p className="text-xs text-muted-foreground capitalize">{botStatus.securityMode}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-2 rounded-lg border">
              {botStatus.networkStatus === 'connected' ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600" />
              )}
              <div>
                <p className="text-xs font-medium">Network</p>
                <p className="text-xs text-muted-foreground capitalize">{botStatus.networkStatus}</p>
              </div>
            </div>
          </div>

          {/* Participants */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Participants Detected</span>
            <span className="font-medium">{botStatus.participantsDetected}</span>
          </div>

          {/* Error Display */}
          {botStatus.lastError && (
            <div className="p-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">Connection Error</p>
                  <p className="text-xs text-red-600 dark:text-red-300">{botStatus.lastError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onStopBot}
              className="flex-1"
            >
              <StopCircle className="h-3 w-3 mr-1" />
              Stop Bot
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onRetryJoin}
              className="flex-1"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onJoinMeeting(meeting.url)}
              className="flex-1"
            >
              <Eye className="h-3 w-3 mr-1" />
              Join Meeting
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onViewSummary}
              className="flex-1"
            >
              <FileText className="h-3 w-3 mr-1" />
              View Summary
            </Button>
          </div>

          {/* Quick Stats */}
          {isExpanded && (
            <div className="grid grid-cols-2 gap-3 pt-3 border-t">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Join Attempts</p>
                <p className="text-sm font-medium">{botStatus.joinAttempts}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Offline Mode</p>
                <p className="text-sm font-medium">{botStatus.isOffline ? 'Yes' : 'No'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveMeetingView; 