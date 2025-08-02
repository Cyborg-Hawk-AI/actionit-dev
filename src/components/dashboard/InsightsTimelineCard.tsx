import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Calendar, 
  Users, 
  Tag, 
  ArrowRight,
  Lightbulb,
  Clock,
  CheckCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Insight {
  id: string;
  title: string;
  description: string;
  type: 'decision' | 'action' | 'blocker' | 'milestone';
  tags: string[];
  meetingId: string;
  meetingTitle: string;
  meetingDate: string;
  attendees: string[];
  status: 'active' | 'resolved' | 'pending';
  createdAt: string;
}

interface InsightsTimelineCardProps {
  insights: Insight[];
  onInsightClick: (insight: Insight) => void;
  className?: string;
}

export function InsightsTimelineCard({ 
  insights, 
  onInsightClick,
  className 
}: InsightsTimelineCardProps) {
  const [selectedType, setSelectedType] = useState<'all' | 'decision' | 'action' | 'blocker' | 'milestone'>('all');
  const [showAll, setShowAll] = useState(false);

  const filteredInsights = insights.filter(insight => {
    if (selectedType === 'all') return true;
    return insight.type === selectedType;
  });

  const displayInsights = showAll ? filteredInsights : filteredInsights.slice(0, 5);

  const getTypeIcon = (type: Insight['type']) => {
    switch (type) {
      case 'decision':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'action':
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'blocker':
        return <Clock className="h-4 w-4 text-red-600" />;
      case 'milestone':
        return <Lightbulb className="h-4 w-4 text-purple-600" />;
    }
  };

  const getTypeBadge = (type: Insight['type']) => {
    const variants = {
      decision: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      action: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      blocker: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      milestone: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
    };
    
    return (
      <Badge className={variants[type]}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const getStatusColor = (status: Insight['status']) => {
    switch (status) {
      case 'active':
        return 'text-green-600 dark:text-green-400';
      case 'resolved':
        return 'text-blue-600 dark:text-blue-400';
      case 'pending':
        return 'text-amber-600 dark:text-amber-400';
    }
  };

  const getTagColor = (tag: string) => {
    const tagColors: { [key: string]: string } = {
      'budget': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'technical': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'blocker': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      'customer': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
      'priority': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
    };
    
    return tagColors[tag.toLowerCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  };

  const typeCounts = {
    decision: insights.filter(i => i.type === 'decision').length,
    action: insights.filter(i => i.type === 'action').length,
    blocker: insights.filter(i => i.type === 'blocker').length,
    milestone: insights.filter(i => i.type === 'milestone').length
  };

  return (
    <Card className={`bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-pink-50/30 dark:from-indigo-950/20 dark:via-purple-950/10 dark:to-pink-950/10 backdrop-blur-sm border-indigo-200/50 dark:border-indigo-800/30 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] rounded-xl ${className}`}>
      <CardHeader className="bg-gradient-to-r from-indigo-100/50 to-purple-100/50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b border-indigo-200/30 dark:border-indigo-800/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full p-2">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">
                Insights Timeline
              </CardTitle>
              <CardDescription className="text-indigo-700/70 dark:text-indigo-300/70">
                Track decisions and insight evolution
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-indigo-100/50 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
              {insights.length} insights
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Filter Tabs */}
        <div className="flex gap-1 p-4 pb-2">
          {[
            { key: 'all', label: 'All', count: insights.length },
            { key: 'decision', label: 'Decisions', count: typeCounts.decision },
            { key: 'action', label: 'Actions', count: typeCounts.action },
            { key: 'blocker', label: 'Blockers', count: typeCounts.blocker },
            { key: 'milestone', label: 'Milestones', count: typeCounts.milestone }
          ].map((filter) => (
            <Button
              key={filter.key}
              variant={selectedType === filter.key ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedType(filter.key as any)}
              className="text-xs h-8 px-3"
            >
              {filter.label} ({filter.count})
            </Button>
          ))}
        </div>

        {/* Insights Timeline */}
        <div className="px-4 pb-4 space-y-3">
          {displayInsights.length === 0 ? (
            <div className="text-center py-8">
              <div className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h4 className="text-base font-medium mb-2 text-indigo-900 dark:text-indigo-100">
                No insights yet
              </h4>
              <p className="text-sm text-indigo-700/70 dark:text-indigo-300/70">
                Start recording meetings to see AI-generated insights here
              </p>
            </div>
          ) : (
            <>
              {displayInsights.map((insight, index) => (
                <div 
                  key={insight.id}
                  className="group p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg border border-indigo-200/30 dark:border-indigo-800/30 hover:border-indigo-300/50 dark:hover:border-indigo-700/50 transition-all duration-200 cursor-pointer"
                  onClick={() => onInsightClick(insight)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getTypeIcon(insight.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-indigo-900 dark:text-indigo-100 group-hover:text-indigo-800 dark:group-hover:text-indigo-50 transition-colors">
                          {insight.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          {getTypeBadge(insight.type)}
                          <div className={`text-xs font-medium ${getStatusColor(insight.status)}`}>
                            {insight.status.toUpperCase()}
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-indigo-700/70 dark:text-indigo-300/70 mb-3">
                        {insight.description}
                      </p>
                      
                      {/* Tags */}
                      {insight.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {insight.tags.map((tag) => (
                            <Badge 
                              key={tag} 
                              className={`text-xs ${getTagColor(tag)}`}
                            >
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-indigo-600/70 dark:text-indigo-400/70">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(parseISO(insight.meetingDate), 'MMM d')}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{insight.attendees.length} attendees</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          <span className="truncate">{insight.meetingTitle}</span>
                        </div>
                      </div>
                    </div>
                    
                    <ArrowRight className="h-4 w-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
              
              {/* Show More/Less Button */}
              {filteredInsights.length > 5 && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAll(!showAll)}
                    className="text-xs border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                  >
                    {showAll ? 'Show Less' : `Show ${filteredInsights.length - 5} More`}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 