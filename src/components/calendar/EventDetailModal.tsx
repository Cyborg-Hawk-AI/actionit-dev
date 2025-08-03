
import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, ExternalLink, Bot, Loader2, Brain, Database, FileText, TrendingUp, AlertCircle, CheckCircle, Eye, EyeOff, RefreshCw, Zap, Target, Building2, DollarSign, Tag, ChevronRight, AlertTriangle, Lightbulb, CheckSquare, Square, UserCheck, CalendarDays, Clock3, Target as TargetIcon, AlertCircle as AlertCircleIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Meeting } from '@/services/calendarService';
import { JoinMode } from '@/services/recallService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

interface EventDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Meeting | null;
  onJoinClick: (meetingUrl: string) => void;
  onJoinWithBot: (meetingId: string) => Promise<void>;
  joiningMeetings: {[key: string]: boolean};
}

interface PrepBrief {
  previousMeeting?: {
    title: string;
    date: string;
    summary: string;
    actionItems: string[];
    decisions: string[];
  };
  prepChecklist: Array<{
    id: string;
    text: string;
    completed: boolean;
    priority: 'high' | 'medium' | 'low';
  }>;
  risks: Array<{
    id: string;
    type: 'attendee' | 'technical' | 'content' | 'timing';
    description: string;
    severity: 'high' | 'medium' | 'low';
  }>;
  relatedTasks: Array<{
    id: string;
    title: string;
    status: 'pending' | 'in_progress' | 'completed';
    dueDate?: string;
  }>;
  aiInsights: {
    meetingPurpose: string;
    keyStakeholders: string[];
    suggestedAgenda: string[];
    successMetrics: string[];
  };
}

interface CRMContext {
  recordType: 'lead' | 'deal' | 'task' | 'contact';
  title: string;
  status: string;
  value?: number;
  progress?: number;
  id: string;
  lastActivity?: string;
  nextSteps?: string[];
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({
  open,
  onOpenChange,
  event,
  onJoinClick,
  onJoinWithBot,
  joiningMeetings
}) => {
  const [selectedJoinMode, setSelectedJoinMode] = useState<JoinMode>('audio_only');
  const [activeTab, setActiveTab] = useState<'details' | 'prep' | 'insights'>('details');
  const [prepBrief, setPrepBrief] = useState<PrepBrief | null>(null);
  const [crmContext, setCrmContext] = useState<CRMContext | null>(null);
  const [isLoadingPrep, setIsLoadingPrep] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [completedChecklist, setCompletedChecklist] = useState<Set<string>>(new Set());

  // Enhanced CRM context detection
  useEffect(() => {
    if (event) {
      // Simulate CRM context detection based on meeting title
      const title = event.title.toLowerCase();
      if (title.includes('sales') || title.includes('deal') || title.includes('proposal')) {
        setCrmContext({
          recordType: 'deal',
          title: 'Enterprise Deal - ABC Corp',
          status: 'In Progress',
          value: 50000,
          progress: 80,
          id: 'deal-123',
          lastActivity: '2024-01-15T10:00:00Z',
          nextSteps: [
            'Schedule technical demo',
            'Prepare pricing proposal',
            'Follow up with decision maker'
          ]
        });
      } else if (title.includes('client') || title.includes('customer')) {
        setCrmContext({
          recordType: 'contact',
          title: 'Client Check-in - XYZ Company',
          status: 'Active',
          id: 'contact-456',
          lastActivity: '2024-01-14T14:30:00Z',
          nextSteps: [
            'Review support tickets',
            'Discuss renewal options',
            'Gather feedback on recent features'
          ]
        });
      }
      
      // Load prep brief
      loadPrepBrief(event);
    }
  }, [event]);

  const loadPrepBrief = async (meeting: Meeting) => {
    setIsLoadingPrep(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setPrepBrief({
        previousMeeting: {
          title: 'Weekly Team Sync',
          date: '2024-01-15',
          summary: 'Discussed Q1 goals and project timelines. Team alignment on new features. Key decisions made on product roadmap.',
          actionItems: [
            'Follow up with marketing on campaign launch',
            'Schedule technical review meeting',
            'Update project documentation'
          ],
          decisions: [
            'Approved new feature development timeline',
            'Decided to prioritize mobile app improvements',
            'Agreed on quarterly budget allocation'
          ]
        },
        prepChecklist: [
          { id: '1', text: 'Review previous meeting notes and action items', completed: false, priority: 'high' },
          { id: '2', text: 'Prepare agenda with key discussion points', completed: false, priority: 'high' },
          { id: '3', text: 'Check attendee availability and roles', completed: false, priority: 'medium' },
          { id: '4', text: 'Gather relevant documents and data', completed: false, priority: 'medium' },
          { id: '5', text: 'Set meeting objectives and success criteria', completed: false, priority: 'high' },
          { id: '6', text: 'Test meeting link and audio/video', completed: false, priority: 'low' },
          { id: '7', text: 'Prepare backup materials for technical issues', completed: false, priority: 'low' }
        ],
        risks: [
          { id: '1', type: 'attendee', description: 'Key stakeholder unavailable - may need to reschedule', severity: 'high' },
          { id: '2', type: 'technical', description: 'New software demo planned - ensure stable connection', severity: 'medium' },
          { id: '3', type: 'content', description: 'Sensitive financial data to be discussed', severity: 'medium' },
          { id: '4', type: 'timing', description: 'Meeting scheduled during lunch hour - may have interruptions', severity: 'low' }
        ],
        relatedTasks: [
          { id: '1', title: 'Prepare quarterly report', status: 'in_progress', dueDate: '2024-01-20' },
          { id: '2', title: 'Update project timeline', status: 'pending', dueDate: '2024-01-18' },
          { id: '3', title: 'Schedule follow-up meeting', status: 'completed' }
        ],
        aiInsights: {
          meetingPurpose: 'Strategic planning and team alignment for Q1 initiatives',
          keyStakeholders: ['Project Manager', 'Technical Lead', 'Product Owner'],
          suggestedAgenda: [
            'Review previous action items (10 min)',
            'Discuss current project status (20 min)',
            'Plan next sprint priorities (15 min)',
            'Address team concerns (10 min)',
            'Set next meeting agenda (5 min)'
          ],
          successMetrics: [
            'Clear action items assigned',
            'Timeline agreed upon',
            'Team alignment achieved'
          ]
        }
      });
      setIsLoadingPrep(false);
    }, 1500);
  };

  const handleChecklistToggle = (itemId: string) => {
    setCompletedChecklist(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 dark:text-red-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getRiskIcon = (type: string) => {
    switch (type) {
      case 'attendee': return <Users className="h-4 w-4" />;
      case 'technical': return <AlertTriangle className="h-4 w-4" />;
      case 'content': return <FileText className="h-4 w-4" />;
      case 'timing': return <Clock3 className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getRiskColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20';
      case 'medium': return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20';
      case 'low': return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20';
      default: return 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/20';
    }
  };

  // Memoize the join handler to prevent re-renders
  const handleJoinWithBot = useCallback(async () => {
    if (!event) return;
    
    try {
      await onJoinWithBot(event.id);
    } catch (error) {
      console.error('Failed to join with bot:', error);
    }
  }, [event, onJoinWithBot]);

  // Memoize the direct join handler
  const handleDirectJoin = useCallback(() => {
    if (!event?.meeting_url) return;
    onJoinClick(event.meeting_url);
  }, [event, onJoinClick]);

  if (!event) return null;

  const startTime = parseISO(event.start_time);
  const endTime = parseISO(event.end_time);
  const isJoining = joiningMeetings[event.id] || false;
  const isMeetingNow = new Date() >= startTime && new Date() <= endTime;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5" />
              <div>
                <DialogTitle className="text-xl">{event.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{format(startTime, 'MMM d, yyyy')} • {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}</span>
                  </div>
                  {isMeetingNow && (
                    <Badge className="bg-green-500 text-white">
                      <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                      Live Now
                    </Badge>
                  )}
                </DialogDescription>
              </div>
            </div>
            
            {/* CRM Context Badge */}
            {crmContext && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-blue-200 text-blue-700">
                  <Database className="h-3 w-3 mr-1" />
                  {crmContext.recordType === 'deal' ? 'Deal' : 'CRM'}
                </Badge>
              </div>
            )}
          </div>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Meeting Details</TabsTrigger>
            <TabsTrigger value="prep">Prep Brief</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-6">
            {/* Meeting Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">
                    {format(startTime, 'MMM d, yyyy')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                  </div>
                </div>
              </div>
              
              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{event.location}</span>
                </div>
              )}
              
              {event.attendees_count && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{event.attendees_count} attendees</span>
                </div>
              )}
              
              {event.calendar_name && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{event.calendar_name}</span>
                </div>
              )}
            </div>

            {/* CRM Context Card */}
            {crmContext && (
              <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4" />
                    CRM Context
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{crmContext.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {crmContext.status}
                    </Badge>
                  </div>
                  
                  {crmContext.value && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm">${crmContext.value.toLocaleString()}</span>
                    </div>
                  )}
                  
                  {crmContext.progress && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span>Progress</span>
                        <span>{crmContext.progress}%</span>
                      </div>
                      <Progress value={crmContext.progress} className="h-2" />
                    </div>
                  )}
                  
                  <Button variant="outline" size="sm" className="w-full">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View CRM Record
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Bot Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Bot className="h-4 w-4" />
                  Bot Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-join" className="text-sm">Auto-join with bot</Label>
                  <Switch id="auto-join" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-record" className="text-sm">Record meeting</Label>
                  <Switch id="auto-record" defaultChecked />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm">Join mode</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={selectedJoinMode === 'audio_only' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedJoinMode('audio_only')}
                    >
                      <Bot className="h-3 w-3 mr-1" />
                      Audio Only
                    </Button>
                    <Button
                      variant={selectedJoinMode === 'speaker_view' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedJoinMode('speaker_view')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Video Recording
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Join Actions */}
            <div className="flex gap-2">
              {event.meeting_url && (
                <>
                  <Button 
                    onClick={handleDirectJoin}
                    className="flex-1"
                  >
                    <ExternalLink className="w-4 h-4 mr-1.5" />
                    Join Meeting
                  </Button>
                  
                  <Button 
                    onClick={handleJoinWithBot}
                    disabled={isJoining}
                    className="flex-1"
                  >
                    {isJoining ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Bot className="w-4 h-4 mr-1.5" />
                    )}
                    Join with Bot
                  </Button>
                </>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="prep" className="space-y-4">
            {isLoadingPrep ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading prep brief...</span>
              </div>
            ) : prepBrief ? (
              <>
                {/* AI Insights Section */}
                <Card className="border-blue-200 dark:border-blue-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Brain className="h-4 w-4 text-blue-600" />
                      AI Meeting Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Meeting Purpose</h4>
                      <p className="text-sm text-muted-foreground">{prepBrief.aiInsights.meetingPurpose}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">Key Stakeholders</h4>
                      <div className="flex flex-wrap gap-1">
                        {prepBrief.aiInsights.keyStakeholders.map((stakeholder, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            <UserCheck className="h-3 w-3 mr-1" />
                            {stakeholder}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">Suggested Agenda</h4>
                      <div className="space-y-2">
                        {prepBrief.aiInsights.suggestedAgenda.map((item, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-sm">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">Success Metrics</h4>
                      <div className="space-y-1">
                        {prepBrief.aiInsights.successMetrics.map((metric, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <TargetIcon className="h-3 w-3 text-green-600" />
                            <span className="text-sm">{metric}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* CRM Context Section */}
                {crmContext && (
                  <Card className="border-purple-200 dark:border-purple-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4 text-purple-600" />
                        CRM Context
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{crmContext.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {crmContext.recordType.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <span className="font-medium">{crmContext.status}</span>
                      </div>
                      
                      {crmContext.value && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Value</span>
                          <span className="font-medium flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ${crmContext.value.toLocaleString()}
                          </span>
                        </div>
                      )}
                      
                      {crmContext.progress && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{crmContext.progress}%</span>
                          </div>
                          <Progress value={crmContext.progress} className="h-2" />
                        </div>
                      )}
                      
                      {crmContext.nextSteps && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Next Steps</h4>
                          <div className="space-y-1">
                            {crmContext.nextSteps.map((step, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                <span className="text-sm">{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Previous Meeting Section */}
                {prepBrief.previousMeeting && (
                  <Card className="border-green-200 dark:border-green-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <CalendarDays className="h-4 w-4 text-green-600" />
                        Previous Meeting
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm mb-1">{prepBrief.previousMeeting.title}</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          {format(parseISO(prepBrief.previousMeeting.date), 'MMM d, yyyy')}
                        </p>
                        <p className="text-sm text-muted-foreground">{prepBrief.previousMeeting.summary}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm mb-2">Action Items</h4>
                        <div className="space-y-1">
                          {prepBrief.previousMeeting.actionItems.map((item, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                              <span className="text-sm">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-sm mb-2">Decisions Made</h4>
                        <div className="space-y-1">
                          {prepBrief.previousMeeting.decisions.map((decision, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{decision}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Prep Checklist */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <TargetIcon className="h-4 w-4" />
                      Prep Checklist
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {prepBrief.prepChecklist.map((item) => (
                        <div key={item.id} className="flex items-start gap-3">
                          <Checkbox
                            id={item.id}
                            checked={completedChecklist.has(item.id)}
                            onCheckedChange={() => handleChecklistToggle(item.id)}
                            className="h-5 w-5"
                          />
                          <label
                            htmlFor={item.id}
                            className={cn(
                              "text-sm",
                              completedChecklist.has(item.id) ? "line-through text-muted-foreground" : "",
                              getPriorityColor(item.priority)
                            )}
                          >
                            {item.text}
                          </label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Risks Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <AlertCircleIcon className="h-4 w-4" />
                      Potential Risks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {prepBrief.risks.map((risk) => (
                        <div key={risk.id} className={cn("p-3 rounded-lg border", getRiskColor(risk.severity))}>
                          <div className="flex items-start gap-2">
                            {getRiskIcon(risk.type)}
                            <div className="flex-1">
                              <p className="text-sm font-medium">{risk.description}</p>
                              <Badge variant="outline" className="text-xs mt-1">
                                {risk.severity} risk
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Related Tasks */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4" />
                      Related Tasks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {prepBrief.relatedTasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-2 rounded-lg border">
                          <div className="flex items-center gap-2">
                            {task.status === 'completed' ? (
                              <CheckSquare className="h-4 w-4 text-green-600" />
                            ) : (
                              <Square className="h-4 w-4 text-gray-400" />
                            )}
                            <span className={cn(
                              "text-sm",
                              task.status === 'completed' ? "line-through text-muted-foreground" : ""
                            )}>
                              {task.title}
                            </span>
                          </div>
                          {task.dueDate && (
                            <Badge variant="outline" className="text-xs">
                              Due: {format(parseISO(task.dueDate), 'MMM d')}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-8">
                <Lightbulb className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No prep brief available for this meeting.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="insights" className="space-y-6">
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Meeting Insights</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Insights will be available after the meeting is completed and processed.
              </p>
              <Button variant="outline" onClick={() => setShowInsights(true)}>
                <Eye className="h-4 w-4 mr-2" />
                View Previous Insights
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailModal;
