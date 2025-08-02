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
    <Card className="mb-6 overflow-hidden relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-purple-950/30 border-blue-200/60 dark:border-blue-800/60 shadow-lg">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100/40 to-transparent dark:from-blue-900/20 rounded-full -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-100/40 to-transparent dark:from-purple-900/20 rounded-full translate-y-12 -translate-x-12"></div>
      
      <CardHeader className="pb-4 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-blue-900 dark:text-blue-100 tracking-tight">
                Latest Meeting Summary
              </CardTitle>
              <CardDescription className="text-blue-700/80 dark:text-blue-300/80 mt-1">
                AI-generated insights from your most recent meeting
              </CardDescription>
            </div>
          </div>
          <Badge 
            variant="secondary" 
            className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 border-blue-200 dark:border-blue-700/50 shadow-sm"
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            Fresh
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 relative">
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-xl p-5 border border-white/50 dark:border-slate-700/50 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
              {displaySummary.title}
            </span>
            <div className="flex items-center gap-1 ml-auto text-xs text-blue-600 dark:text-blue-400">
              <Clock className="h-3 w-3" />
              {format(parseISO(displaySummary.date), 'MMM d, h:mm a')}
            </div>
          </div>
          
          <p className="text-slate-700 dark:text-slate-200 mb-4 leading-relaxed text-sm">
            {truncatedSummary}
          </p>
          
          <Link to={`/app/meetings/${displaySummary.meetingId}`}>
            <Button 
              variant="default" 
              size="sm" 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200 group"
            >
              <span className="flex items-center justify-center gap-2">
                View Full Details
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
              </span>
            </Button>
          </Link>
        </div>
        
        {/* Subtle accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-b-lg"></div>
      </CardContent>
    </Card>
  );
}
