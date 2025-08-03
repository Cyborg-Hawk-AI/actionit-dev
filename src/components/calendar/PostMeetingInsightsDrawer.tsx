import React, { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  Clock, 
  TrendingUp, 
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Send,
  Database,
  Zap,
  Target,
  Calendar
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Meeting } from '@/services/calendarService';
import { cn } from '@/lib/utils';

interface PostMeetingInsightsDrawerProps {
  meeting: Meeting | null;
  isOpen: boolean;
  onClose: () => void;
  onPushToCRM: (insights: MeetingInsights) => void;
  onFeedback: (accurate: boolean) => void;
}

interface MeetingInsights {
  summary: string;
  decisions: string[];
  actionItems: ActionItem[];
  keyTopics: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  participants: Participant[];
  duration: number;
  wordCount: number;
}

interface ActionItem {
  id: string;
  title: string;
  assignee: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
}

interface Participant {
  name: string;
  email: string;
  speakingTime: number;
  contribution: string;
}

const PostMeetingInsightsDrawer: React.FC<PostMeetingInsightsDrawerProps> = ({
  meeting,
  isOpen,
  onClose,
  onPushToCRM,
  onFeedback
}) => {
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);
  const [isPushingToCRM, setIsPushingToCRM] = useState(false);

  // Mock insights data - in real implementation, this would come from AI processing
  const insights: MeetingInsights = {
    summary: "The team discussed Q1 goals and project timelines. Key decisions were made regarding the new feature launch and marketing campaign. Several action items were identified for follow-up.",
    decisions: [
      "Approve new feature launch timeline for March 15th",
      "Increase marketing budget by 20% for Q1 campaign",
      "Hire additional developer for mobile app development"
    ],
    actionItems: [
      {
        id: '1',
        title: 'Follow up with marketing on campaign launch',
        assignee: 'Sarah Johnson',
        dueDate: '2024-01-20',
        priority: 'high',
        status: 'pending'
      },
      {
        id: '2',
        title: 'Schedule technical review meeting',
        assignee: 'Mike Chen',
        dueDate: '2024-01-18',
        priority: 'medium',
        status: 'pending'
      },
      {
        id: '3',
        title: 'Update project documentation',
        assignee: 'Alex Rodriguez',
        dueDate: '2024-01-25',
        priority: 'low',
        status: 'pending'
      }
    ],
    keyTopics: [
      'Q1 Goals & Objectives',
      'Feature Launch Timeline',
      'Marketing Campaign',
      'Team Hiring',
      'Budget Allocation'
    ],
    sentiment: 'positive',
    participants: [
      {
        name: 'Sarah Johnson',
        email: 'sarah@company.com',
        speakingTime: 35,
        contribution: 'Led discussion on marketing strategy'
      },
      {
        name: 'Mike Chen',
        email: 'mike@company.com',
        speakingTime: 25,
        contribution: 'Presented technical roadmap'
      },
      {
        name: 'Alex Rodriguez',
        email: 'alex@company.com',
        speakingTime: 20,
        contribution: 'Provided budget analysis'
      }
    ],
    duration: 45,
    wordCount: 1247
  };

  const handlePushToCRM = async () => {
    setIsPushingToCRM(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    onPushToCRM(insights);
    setIsPushingToCRM(false);
  };

  const handleFeedback = (type: 'positive' | 'negative') => {
    setFeedback(type);
    onFeedback(type === 'positive');
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 bg-green-50 dark:bg-green-950/20';
      case 'negative':
        return 'text-red-600 bg-red-50 dark:bg-red-950/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 dark:bg-red-950/20';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20';
      case 'low':
        return 'text-green-600 bg-green-50 dark:bg-green-950/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  if (!meeting) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:w-[700px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Meeting Insights
          </SheetTitle>
          <SheetDescription>
            AI-generated summary and action items from "{meeting.title}"
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Meeting Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                Meeting Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{meeting.title}</span>
                <Badge variant="outline" className={cn("text-xs", getSentimentColor(insights.sentiment))}>
                  {insights.sentiment.charAt(0).toUpperCase() + insights.sentiment.slice(1)}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {insights.duration} minutes
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {insights.participants.length} participants
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {insights.wordCount} words
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {insights.summary}
              </p>
            </CardContent>
          </Card>

          {/* Decisions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4" />
                Key Decisions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {insights.decisions.map((decision, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></div>
                    <span>{decision}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Action Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4" />
                Action Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.actionItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{item.title}</span>
                        <Badge variant="outline" className={cn("text-xs", getPriorityColor(item.priority))}>
                          {item.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Assigned to {item.assignee}</span>
                        <span>Due {format(parseISO(item.dueDate), 'MMM d')}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Key Topics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4" />
                Key Topics Discussed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {insights.keyTopics.map((topic, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {topic}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" />
                Participant Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.participants.map((participant, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="text-sm font-medium">{participant.name}</div>
                      <div className="text-xs text-muted-foreground">{participant.contribution}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {participant.speakingTime}% speaking time
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                onClick={handlePushToCRM}
                disabled={isPushingToCRM}
                className="flex-1"
              >
                {isPushingToCRM ? (
                  <>
                    <Database className="h-4 w-4 mr-2 animate-spin" />
                    Pushing to CRM...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Push to CRM
                  </>
                )}
              </Button>
              
              <Button variant="outline" className="flex-1">
                <ExternalLink className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>

            {/* Feedback */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Was this summary accurate?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Button
                    variant={feedback === 'positive' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFeedback('positive')}
                    className="flex-1"
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    Yes
                  </Button>
                  <Button
                    variant={feedback === 'negative' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFeedback('negative')}
                    className="flex-1"
                  >
                    <ThumbsDown className="h-4 w-4 mr-1" />
                    No
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PostMeetingInsightsDrawer; 