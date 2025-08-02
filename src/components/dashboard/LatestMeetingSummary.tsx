import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, ArrowRight, Calendar, Sparkles, TrendingUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';


interface LatestMeetingSummaryProps {
  meetingSummary: {
    title: string;
    summary: string;
    date: string;
    meetingId: string;
  } | null;
}

export function LatestMeetingSummary({ meetingSummary }: LatestMeetingSummaryProps) {
  // Always use real data - no mock data
  const displaySummary = meetingSummary;
  
  if (!displaySummary) {
    return null;
  }

  // Truncate summary to approximately 150 characters
  const truncatedSummary = displaySummary.summary.length > 150 
    ? displaySummary.summary.substring(0, 150) + '...'
    : displaySummary.summary;

  return (
    <Card className="overflow-hidden relative bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-cyan-50/30 dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-cyan-950/10 backdrop-blur-sm border-emerald-200/50 dark:border-emerald-800/30 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] rounded-xl">
      <CardHeader className="bg-gradient-to-r from-emerald-100/50 to-teal-100/50 dark:from-emerald-900/20 dark:to-teal-900/20 border-b border-emerald-200/30 dark:border-emerald-800/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full p-2">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                Latest Meeting Summary
              </CardTitle>
              <CardDescription className="text-emerald-700/70 dark:text-emerald-300/70">
                AI-generated insights from your most recent meeting
              </CardDescription>
            </div>
          </div>
          <Badge 
            className="bg-emerald-100/50 text-emerald-800 border-emerald-300/50 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700/50 shadow-sm"
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            Fresh
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 relative">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl p-5 border border-emerald-200/30 dark:border-emerald-800/30 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
              {displaySummary.title}
            </span>
            <div className="flex items-center gap-1 ml-auto text-xs text-emerald-600 dark:text-emerald-400">
              <Clock className="h-3 w-3" />
              {format(parseISO(displaySummary.date), 'MMM d, h:mm a')}
            </div>
          </div>
          
          <p className="text-gray-700 dark:text-gray-200 mb-4 leading-relaxed text-sm">
            {truncatedSummary}
          </p>
          
          <Link to={`/app/meetings/${displaySummary.meetingId}`}>
            <Button 
              variant="default" 
              size="sm" 
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] group"
            >
              <span className="flex items-center justify-center gap-2">
                View Full Details
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
              </span>
            </Button>
          </Link>
        </div>
        
        {/* Subtle accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-b-lg"></div>
      </CardContent>
    </Card>
  );
}
