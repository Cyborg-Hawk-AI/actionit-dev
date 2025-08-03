import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, TrendingDown, Clock, Target, Zap, Users } from 'lucide-react';
import { MeetingAnalytics } from '@/hooks/useMeetingAnalytics';

interface MeetingAnalyticsCardProps {
  analytics: MeetingAnalytics;
  isLoading?: boolean;
  className?: string;
}

export function MeetingAnalyticsCard({ analytics, isLoading = false, className }: MeetingAnalyticsCardProps) {
  if (isLoading) {
    return (
      <Card className={`glass-card border-emerald-200/50 dark:border-emerald-800/30 ${className}`}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Meeting Analytics
          </CardTitle>
          <CardDescription>Your meeting performance insights</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-3 w-3 text-red-600" />;
    return null;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <Card className={`glass-card border-emerald-200/50 dark:border-emerald-800/30 ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          Meeting Analytics
        </CardTitle>
        <CardDescription>Your meeting performance insights</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Productivity Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Target className="h-3 w-3" />
              Productivity Score
            </span>
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              {analytics.productivityScore}/100
            </span>
          </div>
          <Progress value={analytics.productivityScore} className="h-2" />
        </div>

        {/* Completion Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Completion Rate
            </span>
            <span className="text-sm font-medium">{analytics.completionRate}%</span>
          </div>
          <Progress value={analytics.completionRate} className="h-2" />
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total Meetings</span>
              <span className="text-xs font-medium">{analytics.totalMeetings}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">This Week</span>
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium">{analytics.thisWeekMeetings}</span>
                {getTrendIcon(analytics.weeklyTrend.change)}
                <span className={`text-xs ${getTrendColor(analytics.weeklyTrend.change)}`}>
                  {analytics.weeklyTrend.change > 0 ? '+' : ''}{analytics.weeklyTrend.change}%
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Avg Duration
              </span>
              <span className="text-xs font-medium">{analytics.averageDuration}m</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">This Month</span>
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium">{analytics.thisMonthMeetings}</span>
                {getTrendIcon(analytics.monthlyTrend.change)}
                <span className={`text-xs ${getTrendColor(analytics.monthlyTrend.change)}`}>
                  {analytics.monthlyTrend.change > 0 ? '+' : ''}{analytics.monthlyTrend.change}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights Summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              AI Insights Generated
            </span>
            <span className="text-sm font-medium">{analytics.insightsGenerated}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Action Items</span>
            <span className="text-xs font-medium">{analytics.actionItemsCreated}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Decisions Recorded</span>
            <span className="text-xs font-medium">{analytics.decisionsRecorded}</span>
          </div>
        </div>

        {/* Top Meeting Types */}
        {analytics.topMeetingTypes.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground">Top Meeting Types</span>
            <div className="flex flex-wrap gap-1">
              {analytics.topMeetingTypes.map((type) => (
                <Badge key={type.type} variant="secondary" className="text-xs">
                  {type.type} ({type.percentage}%)
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 