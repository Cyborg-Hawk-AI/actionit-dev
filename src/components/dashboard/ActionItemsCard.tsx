import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  CheckCircle, 
  Clock, 
  Pause, 
  AlertCircle, 
  Calendar,
  TrendingUp,
  User,
  Target
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface ActionItem {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'completed' | 'snoozed';
  dueDate?: string;
  assignedTo?: string;
  meetingId?: string;
  meetingTitle?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

interface ActionItemsCardProps {
  actionItems: ActionItem[];
  onStatusChange: (itemId: string, status: ActionItem['status']) => void;
  onSnooze: (itemId: string, days: number) => void;
  className?: string;
}

export function ActionItemsCard({ 
  actionItems, 
  onStatusChange, 
  onSnooze,
  className 
}: ActionItemsCardProps) {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'completed' | 'snoozed'>('all');

  const filteredItems = actionItems.filter(item => {
    if (selectedFilter === 'all') return true;
    return item.status === selectedFilter;
  });

  const getStatusIcon = (status: ActionItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'snoozed':
        return <Pause className="h-4 w-4 text-amber-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusBadge = (status: ActionItem['status']) => {
    const variants = {
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      snoozed: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      pending: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    };
    
    return (
      <Badge className={variants[status]}>
        {status === 'completed' && '✅'}
        {status === 'snoozed' && '💤'}
        {status === 'pending' && '⏳'}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPriorityColor = (priority: ActionItem['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-400';
      case 'medium':
        return 'text-amber-600 dark:text-amber-400';
      case 'low':
        return 'text-green-600 dark:text-green-400';
    }
  };

  const pendingCount = actionItems.filter(item => item.status === 'pending').length;
  const completedCount = actionItems.filter(item => item.status === 'completed').length;
  const snoozedCount = actionItems.filter(item => item.status === 'snoozed').length;

  return (
    <Card className={`bg-gradient-to-br from-orange-50/80 via-amber-50/40 to-yellow-50/30 dark:from-orange-950/20 dark:via-amber-950/10 dark:to-yellow-950/10 backdrop-blur-sm border-orange-200/50 dark:border-orange-800/30 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] rounded-xl ${className}`}>
      <CardHeader className="bg-gradient-to-r from-orange-100/50 to-amber-100/50 dark:from-orange-900/20 dark:to-amber-900/20 border-b border-orange-200/30 dark:border-orange-800/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-full p-2">
              <Target className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-orange-900 dark:text-orange-100">
                My Action Items
              </CardTitle>
              <CardDescription className="text-orange-700/70 dark:text-orange-300/70">
                AI-powered follow-up & accountability
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-orange-100/50 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
              {pendingCount} pending
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Filter Tabs */}
        <div className="flex gap-1 p-4 pb-2">
          {[
            { key: 'all', label: 'All', count: actionItems.length },
            { key: 'pending', label: 'Pending', count: pendingCount },
            { key: 'completed', label: 'Completed', count: completedCount },
            { key: 'snoozed', label: 'Snoozed', count: snoozedCount }
          ].map((filter) => (
            <Button
              key={filter.key}
              variant={selectedFilter === filter.key ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedFilter(filter.key as any)}
              className="text-xs h-8 px-3"
            >
              {filter.label} ({filter.count})
            </Button>
          ))}
        </div>

        {/* Action Items List */}
        <div className="px-4 pb-4 space-y-3">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <div className="bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h4 className="text-base font-medium mb-2 text-orange-900 dark:text-orange-100">
                {selectedFilter === 'all' ? 'No action items' : `No ${selectedFilter} items`}
              </h4>
              <p className="text-sm text-orange-700/70 dark:text-orange-300/70">
                {selectedFilter === 'all' 
                  ? 'Great job! All caught up.' 
                  : `All ${selectedFilter} items have been handled.`
                }
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div 
                key={item.id}
                className="group p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg border border-orange-200/30 dark:border-orange-800/30 hover:border-orange-300/50 dark:hover:border-orange-700/50 transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={item.status === 'completed'}
                    onCheckedChange={(checked) => 
                      onStatusChange(item.id, checked ? 'completed' : 'pending')
                    }
                    className="mt-1"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className={`font-medium text-orange-900 dark:text-orange-100 ${item.status === 'completed' ? 'line-through opacity-60' : ''}`}>
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(item.status)}
                        <div className={`text-xs font-medium ${getPriorityColor(item.priority)}`}>
                          {item.priority.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    
                    {item.description && (
                      <p className="text-sm text-orange-700/70 dark:text-orange-300/70 mb-2">
                        {item.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-orange-600/70 dark:text-orange-400/70">
                      {item.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Due {format(parseISO(item.dueDate), 'MMM d')}</span>
                        </div>
                      )}
                      
                      {item.assignedTo && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{item.assignedTo}</span>
                        </div>
                      )}
                      
                      {item.meetingTitle && (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          <span className="truncate">{item.meetingTitle}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                {item.status === 'pending' && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-orange-200/30 dark:border-orange-800/30">
                                         <Button
                       size="sm"
                       variant="outline"
                       onClick={() => onSnooze(item.id, 1)}
                       className="text-xs h-7 border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                     >
                       <Pause className="h-3 w-3 mr-1" />
                       Snooze 1 day
                     </Button>
                     <Button
                       size="sm"
                       variant="outline"
                       onClick={() => onSnooze(item.id, 7)}
                       className="text-xs h-7 border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                     >
                       <Pause className="h-3 w-3 mr-1" />
                       Snooze 1 week
                     </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
} 