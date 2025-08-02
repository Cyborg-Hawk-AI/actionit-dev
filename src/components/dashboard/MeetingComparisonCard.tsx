import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Calendar,
  Users,
  Clock,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface MeetingComparison {
  id: string;
  currentMeeting: {
    id: string;
    title: string;
    date: string;
    duration: number;
    attendees: number;
    decisions: number;
    actionItems: number;
  };
  previousMeetings: {
    id: string;
    title: string;
    date: string;
    duration: number;
    attendees: number;
    decisions: number;
    actionItems: number;
  }[];
  trends: {
    duration: 'up' | 'down' | 'same';
    attendees: 'up' | 'down' | 'same';
    decisions: 'up' | 'down' | 'same';
    actionItems: 'up' | 'down' | 'same';
  };
  improvements: string[];
  unresolvedItems: string[];
}

interface MeetingComparisonCardProps {
  comparison: MeetingComparison;
  onViewComparison: (comparison: MeetingComparison) => void;
  className?: string;
}

export function MeetingComparisonCard({ 
  comparison, 
  onViewComparison,
  className 
}: MeetingComparisonCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getTrendIcon = (trend: 'up' | 'down' | 'same') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'same':
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'same') => {
    switch (trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      case 'same':
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const avgPreviousDuration = comparison.previousMeetings.reduce((sum, m) => sum + m.duration, 0) / comparison.previousMeetings.length;
  const avgPreviousAttendees = comparison.previousMeetings.reduce((sum, m) => sum + m.attendees, 0) / comparison.previousMeetings.length;
  const avgPreviousDecisions = comparison.previousMeetings.reduce((sum, m) => sum + m.decisions, 0) / comparison.previousMeetings.length;
  const avgPreviousActionItems = comparison.previousMeetings.reduce((sum, m) => sum + m.actionItems, 0) / comparison.previousMeetings.length;

  return (
    <Card className={`bg-gradient-to-br from-rose-50/80 via-pink-50/40 to-red-50/30 dark:from-rose-950/20 dark:via-pink-950/10 dark:to-red-950/10 backdrop-blur-sm border-rose-200/50 dark:border-rose-800/30 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] rounded-xl ${className}`}>
      <CardHeader className="bg-gradient-to-r from-rose-100/50 to-pink-100/50 dark:from-rose-900/20 dark:to-pink-900/20 border-b border-rose-200/30 dark:border-rose-800/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-rose-600 to-pink-600 rounded-full p-2">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-rose-900 dark:text-rose-100">
                Meeting Comparison
              </CardTitle>
              <CardDescription className="text-rose-700/70 dark:text-rose-300/70">
                Track trends and improvements
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-rose-100/50 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
              {comparison.previousMeetings.length} previous
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="px-4 pb-4 space-y-4">
          {/* Current Meeting */}
          <div className="p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg border border-rose-200/30 dark:border-rose-800/30">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-rose-900 dark:text-rose-100">
                {comparison.currentMeeting.title}
              </h4>
              <Badge className="bg-rose-100/50 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
                Current
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-rose-600" />
                <span className="text-rose-700/70 dark:text-rose-300/70">
                  {comparison.currentMeeting.duration} min
                </span>
                {getTrendIcon(comparison.trends.duration)}
              </div>
              
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-rose-600" />
                <span className="text-rose-700/70 dark:text-rose-300/70">
                  {comparison.currentMeeting.attendees} attendees
                </span>
                {getTrendIcon(comparison.trends.attendees)}
              </div>
              
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-rose-600" />
                <span className="text-rose-700/70 dark:text-rose-300/70">
                  {comparison.currentMeeting.decisions} decisions
                </span>
                {getTrendIcon(comparison.trends.decisions)}
              </div>
              
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-rose-600" />
                <span className="text-rose-700/70 dark:text-rose-300/70">
                  {comparison.currentMeeting.actionItems} actions
                </span>
                {getTrendIcon(comparison.trends.actionItems)}
              </div>
            </div>
          </div>

          {/* Trends Summary */}
          <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 rounded-lg">
            <h5 className="font-medium text-rose-900 dark:text-rose-100 mb-3">
              Trends vs Previous {comparison.previousMeetings.length} Meetings
            </h5>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-rose-700/70 dark:text-rose-300/70">Duration:</span>
                <div className="flex items-center gap-1">
                  <span className={`font-medium ${getTrendColor(comparison.trends.duration)}`}>
                    {comparison.currentMeeting.duration}min
                  </span>
                  <span className="text-xs text-rose-600/70">
                    (avg: {Math.round(avgPreviousDuration)}min)
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-rose-700/70 dark:text-rose-300/70">Attendees:</span>
                <div className="flex items-center gap-1">
                  <span className={`font-medium ${getTrendColor(comparison.trends.attendees)}`}>
                    {comparison.currentMeeting.attendees}
                  </span>
                  <span className="text-xs text-rose-600/70">
                    (avg: {Math.round(avgPreviousAttendees)})
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-rose-700/70 dark:text-rose-300/70">Decisions:</span>
                <div className="flex items-center gap-1">
                  <span className={`font-medium ${getTrendColor(comparison.trends.decisions)}`}>
                    {comparison.currentMeeting.decisions}
                  </span>
                  <span className="text-xs text-rose-600/70">
                    (avg: {Math.round(avgPreviousDecisions)})
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-rose-700/70 dark:text-rose-300/70">Action Items:</span>
                <div className="flex items-center gap-1">
                  <span className={`font-medium ${getTrendColor(comparison.trends.actionItems)}`}>
                    {comparison.currentMeeting.actionItems}
                  </span>
                  <span className="text-xs text-rose-600/70">
                    (avg: {Math.round(avgPreviousActionItems)})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Improvements & Unresolved */}
          <div className="space-y-3">
            {comparison.improvements.length > 0 && (
              <div className="p-3 bg-green-50/50 dark:bg-green-950/20 rounded-lg">
                <h6 className="font-medium text-green-900 dark:text-green-100 mb-2">
                  ✅ Improvements
                </h6>
                <ul className="text-sm text-green-700/70 dark:text-green-300/70 space-y-1">
                  {comparison.improvements.slice(0, 2).map((improvement, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {comparison.unresolvedItems.length > 0 && (
              <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg">
                <h6 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
                  ⚠️ Unresolved from Previous
                </h6>
                <ul className="text-sm text-amber-700/70 dark:text-amber-300/70 space-y-1">
                  {comparison.unresolvedItems.slice(0, 2).map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-amber-600 mt-2 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewComparison(comparison)}
              className="text-xs border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/20"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              View Full Comparison
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 