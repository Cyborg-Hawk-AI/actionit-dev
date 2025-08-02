import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  Calendar, 
  MessageSquare, 
  TrendingUp,
  Building,
  User,
  ExternalLink,
  Clock
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  meetingCount: number;
  lastMeeting: string;
  totalDuration: number; // in minutes
  crmData?: {
    company?: string;
    dealValue?: number;
    dealStage?: string;
    ticketCount?: number;
  };
}

interface AttendeeIntelligenceCardProps {
  collaborators: Collaborator[];
  onCollaboratorClick: (collaborator: Collaborator) => void;
  className?: string;
}

export function AttendeeIntelligenceCard({ 
  collaborators, 
  onCollaboratorClick,
  className 
}: AttendeeIntelligenceCardProps) {
  const topCollaborators = collaborators
    .sort((a, b) => b.meetingCount - a.meetingCount)
    .slice(0, 5);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getDealStageColor = (stage?: string) => {
    if (!stage) return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    
    const colors: { [key: string]: string } = {
      'prospecting': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'qualification': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      'proposal': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'negotiation': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      'closed_won': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'closed_lost': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    };
    
    return colors[stage.toLowerCase()] || colors['prospecting'];
  };

  return (
    <Card className={`bg-gradient-to-br from-violet-50/80 via-purple-50/40 to-fuchsia-50/30 dark:from-violet-950/20 dark:via-purple-950/10 dark:to-fuchsia-950/10 backdrop-blur-sm border-violet-200/50 dark:border-violet-800/30 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] rounded-xl ${className}`}>
      <CardHeader className="bg-gradient-to-r from-violet-100/50 to-purple-100/50 dark:from-violet-900/20 dark:to-purple-900/20 border-b border-violet-200/30 dark:border-violet-800/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-full p-2">
              <Users className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-violet-900 dark:text-violet-100">
                Top Collaborators
              </CardTitle>
              <CardDescription className="text-violet-700/70 dark:text-violet-300/70">
                CRM-aware meeting intelligence
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-violet-100/50 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300">
              {collaborators.length} contacts
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="px-4 pb-4 space-y-3">
          {topCollaborators.length === 0 ? (
            <div className="text-center py-8">
              <div className="bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-violet-600 dark:text-violet-400" />
              </div>
              <h4 className="text-base font-medium mb-2 text-violet-900 dark:text-violet-100">
                No collaborators yet
              </h4>
              <p className="text-sm text-violet-700/70 dark:text-violet-300/70">
                Start recording meetings to see your top contacts here
              </p>
            </div>
          ) : (
            topCollaborators.map((collaborator) => (
              <div 
                key={collaborator.id}
                className="group p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg border border-violet-200/30 dark:border-violet-800/30 hover:border-violet-300/50 dark:hover:border-violet-700/50 transition-all duration-200 cursor-pointer"
                onClick={() => onCollaboratorClick(collaborator)}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={collaborator.avatar} alt={collaborator.name} />
                    <AvatarFallback className="bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300">
                      {getInitials(collaborator.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-violet-900 dark:text-violet-100 group-hover:text-violet-800 dark:group-hover:text-violet-50 transition-colors">
                          {collaborator.name}
                        </h4>
                        <p className="text-sm text-violet-700/70 dark:text-violet-300/70">
                          {collaborator.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-violet-100/50 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300">
                          {collaborator.meetingCount} meetings
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Meeting Stats */}
                    <div className="flex items-center gap-4 text-xs text-violet-600/70 dark:text-violet-400/70 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Last: {format(parseISO(collaborator.lastMeeting), 'MMM d')}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDuration(collaborator.totalDuration)} total</span>
                      </div>
                    </div>
                    
                    {/* CRM Data */}
                    {collaborator.crmData && (
                      <div className="space-y-2">
                        {collaborator.crmData.company && (
                          <div className="flex items-center gap-2 text-xs">
                            <Building className="h-3 w-3 text-violet-600" />
                            <span className="text-violet-700/70 dark:text-violet-300/70">
                              {collaborator.crmData.company}
                            </span>
                          </div>
                        )}
                        
                        {collaborator.crmData.dealValue && (
                          <div className="flex items-center gap-2 text-xs">
                            <TrendingUp className="h-3 w-3 text-violet-600" />
                            <span className="text-violet-700/70 dark:text-violet-300/70">
                              Deal: ${collaborator.crmData.dealValue.toLocaleString()}
                            </span>
                            {collaborator.crmData.dealStage && (
                              <Badge className={`text-xs ${getDealStageColor(collaborator.crmData.dealStage)}`}>
                                {collaborator.crmData.dealStage.replace('_', ' ')}
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        {collaborator.crmData.ticketCount && (
                          <div className="flex items-center gap-2 text-xs">
                            <MessageSquare className="h-3 w-3 text-violet-600" />
                            <span className="text-violet-700/70 dark:text-violet-300/70">
                              {collaborator.crmData.ticketCount} tickets
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <ExternalLink className="h-4 w-4 text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
} 