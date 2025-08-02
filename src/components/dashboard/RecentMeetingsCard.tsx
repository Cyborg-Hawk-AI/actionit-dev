import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Loader2, Sparkles, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';


interface RecentRecording {
  title?: string;
  date?: string;
  duration?: string;
  hasTranscript?: boolean;
  hasInsights?: boolean;
  summary?: string;
  meetingId?: string;
  meeting_summary?: string;
}

interface RecentMeetingsCardProps {
  recentRecordings: RecentRecording[];
  isLoadingInsights: boolean;
  onRecentRecordingClick: (recording: RecentRecording) => void;
}

export function RecentMeetingsCard({ 
  recentRecordings, 
  isLoadingInsights, 
  onRecentRecordingClick 
}: RecentMeetingsCardProps) {
  // Always use real data - no mock data
  const displayRecordings = recentRecordings;
  
  const handleMeetingClick = (recording: RecentRecording, event: React.MouseEvent) => {
    event.preventDefault();
    console.log('[RecentMeetingsCard] Meeting clicked, triggering popup:', recording);
    onRecentRecordingClick(recording);
  };

  return (
    <Card variant="apple" className="gradient-activity border-purple-200/40 dark:border-purple-800/30 relative overflow-hidden">
      <div className="card-ai-overlay"></div>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-md">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="sf-display text-purple-900 dark:text-purple-100">Recent Meetings</CardTitle>
            <CardTitle className="sf-text text-purple-700/70 dark:text-purple-300/70 text-sm font-normal">Meetings with AI transcripts</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingInsights ? (
          <div className="flex justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              <p className="sf-text text-sm text-purple-600/60 dark:text-purple-400/60">Loading meeting insights...</p>
            </div>
          </div>
        ) : displayRecordings && displayRecordings.length > 0 ? (
          <div className="space-y-4">
            {displayRecordings.map((recording, i) => (
              <div 
                key={recording.meetingId || i} 
                className="group cursor-pointer hover:bg-purple-50/50 dark:hover:bg-purple-950/20 rounded-xl p-4 transition-all duration-200 border border-purple-200/20 dark:border-purple-700/20 hover:border-purple-300/40 dark:hover:border-purple-600/40 hover:shadow-md interactive-element"
                onClick={(e) => handleMeetingClick(recording, e)}
              >
                <div className="flex flex-col space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="sf-display font-medium text-purple-900 dark:text-purple-100 group-hover:text-purple-800 dark:group-hover:text-purple-50 transition-colors">
                          {recording.title || 'Untitled Meeting'}
                        </h4>
                        <ExternalLink className="h-4 w-4 text-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="sf-text text-sm text-purple-700/70 dark:text-purple-300/70">
                          {recording.date ? format(new Date(recording.date), 'EEE, MMM d') : 'No date'}
                        </p>
                        <p className="sf-text text-sm text-purple-700/70 dark:text-purple-300/70">
                          {recording.duration || 'Duration unknown'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {recording.hasTranscript && (
                        <Badge variant="outline" className="sf-text text-xs bg-purple-100/50 text-purple-700 border-purple-300/50 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/50">
                          Transcript
                        </Badge>
                      )}
                      {recording.hasInsights && (
                        <Badge variant="outline" className="sf-text text-xs bg-gradient-to-r from-purple-100/50 to-pink-100/50 text-purple-700 border-purple-300/50 dark:from-purple-900/30 dark:to-pink-900/30 dark:text-purple-300 dark:border-purple-700/50">
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI Insights
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Enhanced meeting summary display with improved contrast */}
                  {recording.meeting_summary && (
                    <div className="relative">
                      <div className="sf-text text-sm text-purple-800/90 dark:text-[#E5E7EB] leading-relaxed bg-gradient-to-r from-purple-50/80 to-violet-50/50 dark:from-purple-900/20 dark:to-violet-900/10 rounded-lg p-4 border border-purple-200/30 dark:border-purple-700/30 group-hover:from-purple-100/80 group-hover:to-violet-100/60 dark:group-hover:from-purple-900/30 dark:group-hover:to-violet-900/20 transition-all duration-200">
                        <div className="absolute top-3 right-3">
                          <Sparkles className="h-3 w-3 text-purple-500/40" />
                        </div>
                        {recording.meeting_summary.split('\n')[0].substring(0, 160)}
                        {recording.meeting_summary.split('\n')[0].length > 160 && '...'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-purple-600/60 dark:text-purple-400/60">
            <Activity className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <h3 className="sf-display font-medium mb-2">No meetings with transcripts yet</h3>
            <p className="sf-text text-sm">Start recording meetings to see AI-powered insights here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
