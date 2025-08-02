import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowLeft, Download, Share, ChevronDown, AlertTriangle, Users, CheckCircle, Clock, MessageSquare, Target, FileText, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { format, parseISO } from 'date-fns';
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';

interface MeetingData {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  description?: string;
  attendees_count: number;
  meeting_url?: string;
  calendar_name?: string;
  calendar_color?: string;
}

interface TranscriptData {
  meeting_title?: string;
  meeting_summary?: string;
  key_points_by_speaker?: string;
  key_items_and_action_items?: string;
  next_steps_and_follow_ups?: string;
  considerations_and_open_issues?: string;
  notes_for_next_meeting?: string;
  tone_and_sentiment_analysis?: string;
  transcript_text?: string;
}

const MeetingDetail = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meetingData, setMeetingData] = useState<MeetingData | null>(null);
  const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tocOpen, setTocOpen] = useState(false);

  useGoogleAnalytics();

  useEffect(() => {
    if (meetingId && user) {
      loadMeetingData();
    } else {
      setIsLoading(false);
      setError('Invalid meeting ID or user not authenticated');
    }
  }, [meetingId, user]);

  const loadMeetingData = async () => {
    if (!meetingId || !user) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log(`[MeetingDetail] Loading meeting data for ID: ${meetingId}`);
      
      // Load meeting data
      const { data: meeting, error: meetingError } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', meetingId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (meetingError) {
        console.error('[MeetingDetail] Error loading meeting:', meetingError);
        setError('Failed to load meeting data');
        return;
      }

      if (!meeting) {
        console.log('[MeetingDetail] No meeting found');
        setError('Meeting not found');
        return;
      }

      console.log('[MeetingDetail] Meeting loaded successfully:', meeting.title);
      setMeetingData(meeting);

      // Load transcript data - use the first transcript for this meeting
      const { data: transcript, error: transcriptError } = await supabase
        .from('transcripts')
        .select(`
          meeting_title,
          meeting_summary,
          key_points_by_speaker,
          key_items_and_action_items,
          next_steps_and_follow_ups,
          considerations_and_open_issues,
          notes_for_next_meeting,
          tone_and_sentiment_analysis,
          transcript_text
        `)
        .eq('meeting_id', meetingId)
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (transcriptError) {
        console.error('[MeetingDetail] Error loading transcript:', transcriptError);
      } else if (transcript) {
        console.log('[MeetingDetail] Transcript loaded successfully');
        setTranscriptData(transcript);
      } else {
        console.log('[MeetingDetail] No transcript found for this meeting');
      }
    } catch (err) {
      console.error('[MeetingDetail] Unexpected error:', err);
      setError('Failed to load meeting data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'EEEE, MMMM d, yyyy • h:mm a');
    } catch (e) {
      return dateString;
    }
  };

  const parseJsonField = (field: string | null): any[] => {
    if (!field) return [];
    try {
      const parsed = JSON.parse(field);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return field.split('\n').filter(line => line.trim());
    }
  };

  const parseSpeakerPoints = (field: string | null): { [speaker: string]: string[] } => {
    if (!field) return {};
    try {
      const parsed = JSON.parse(field);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed as { [speaker: string]: string[] };
      }
      return {};
    } catch {
      // Try to parse as simple text format
      const lines = field.split('\n').filter(line => line.trim());
      const speakers: { [speaker: string]: string[] } = {};
      let currentSpeaker = '';
      
      for (const line of lines) {
        if (line.includes(':') && !line.startsWith('-') && !line.startsWith('•')) {
          currentSpeaker = line.split(':')[0].trim();
          const point = line.split(':').slice(1).join(':').trim();
          if (point) {
            speakers[currentSpeaker] = speakers[currentSpeaker] || [];
            speakers[currentSpeaker].push(point);
          }
        } else if (currentSpeaker && (line.startsWith('-') || line.startsWith('•'))) {
          speakers[currentSpeaker] = speakers[currentSpeaker] || [];
          speakers[currentSpeaker].push(line.replace(/^[-•]\s*/, ''));
        }
      }
      
      return speakers;
    }
  };

  const scrollToTranscript = () => {
    const transcriptTab = document.querySelector('[data-value="transcript"]') as HTMLElement;
    if (transcriptTab) {
      transcriptTab.click();
      setTimeout(() => {
        const transcriptSection = document.getElementById('transcript-content');
        if (transcriptSection) {
          transcriptSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <p className="text-sm text-muted-foreground">Loading meeting details...</p>
        </div>
      </div>
    );
  }

  if (error || !meetingData) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-2">Meeting Not Found</h2>
        <p className="text-muted-foreground mb-4">{error || 'The requested meeting could not be found.'}</p>
        <Button variant="outline" onClick={() => navigate('/app/calendar')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Calendar
        </Button>
      </div>
    );
  }

  const actionItems = parseJsonField(transcriptData?.key_items_and_action_items);
  const nextSteps = parseJsonField(transcriptData?.next_steps_and_follow_ups);
  const considerations = parseJsonField(transcriptData?.considerations_and_open_issues);
  const notesForNext = parseJsonField(transcriptData?.notes_for_next_meeting);
  const speakerPoints = parseSpeakerPoints(transcriptData?.key_points_by_speaker);

  const duration = Math.round((new Date(meetingData.end_time).getTime() - new Date(meetingData.start_time).getTime()) / (1000 * 60));

  const summaryCards = [
    {
      id: 'summary',
      title: 'Meeting Summary',
      icon: FileText,
      content: transcriptData?.meeting_summary || null,
      color: 'blue',
      type: 'text'
    },
    {
      id: 'speakers',
      title: 'Key Points by Speaker',
      icon: Users,
      content: Object.keys(speakerPoints).length > 0 ? speakerPoints : null,
      color: 'green',
      type: 'speakers'
    },
    {
      id: 'actions',
      title: 'Action Items & Decisions',
      icon: CheckCircle,
      content: actionItems.length > 0 ? actionItems : null,
      color: 'orange',
      type: 'list'
    },
    {
      id: 'next-steps',
      title: 'Next Steps & Follow-Ups',
      icon: Clock,
      content: nextSteps.length > 0 ? nextSteps : null,
      color: 'purple',
      type: 'list'
    },
    {
      id: 'issues',
      title: 'Open Issues / Considerations',
      icon: AlertTriangle,
      content: considerations.length > 0 ? considerations : null,
      color: 'red',
      type: 'list'
    },
    {
      id: 'notes',
      title: 'Notes for Next Meeting',
      icon: MessageSquare,
      content: notesForNext.length > 0 ? notesForNext : null,
      color: 'indigo',
      type: 'list'
    },
    {
      id: 'sentiment',
      title: 'Sentiment & Tone Overview',
      icon: Target,
      content: transcriptData?.tone_and_sentiment_analysis || null,
      color: 'teal',
      type: 'text'
    }
  ];

  const renderCardContent = (card: any) => {
    if (!card.content) {
      return <p className="text-sm text-gray-500 italic">No data available for this section.</p>;
    }

    switch (card.type) {
      case 'speakers':
        return (
          <div className="space-y-4">
            {Object.entries(card.content as { [key: string]: string[] }).map(([speaker, points]) => (
              <div key={speaker} className="border-l-4 border-blue-200 pl-4">
                <h4 className="font-semibold text-blue-800 mb-2">{speaker}</h4>
                <ul className="space-y-1">
                  {points.map((point, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        );
      case 'list':
        return (
          <ul className="space-y-2">
            {(card.content as string[]).map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                {card.id === 'actions' && (
                  <Checkbox className="mt-0.5" />
                )}
                <span className={`w-1.5 h-1.5 bg-${card.color}-400 rounded-full mt-2 flex-shrink-0`}></span>
                <span className="text-sm text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        );
      case 'text':
      default:
        return <p className="text-sm text-gray-700 leading-relaxed">{card.content as string}</p>;
    }
  };

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={() => navigate('/app/calendar')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Calendar
          </Button>
        </div>
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {meetingData.title}
            </h1>
            {transcriptData?.meeting_title && transcriptData.meeting_title !== meetingData.title && (
              <p className="text-lg text-gray-600 mb-2">
                "{transcriptData.meeting_title}"
              </p>
            )}
            <p className="text-gray-600 mb-3">
              {formatDateTime(meetingData.start_time)} • {duration} minutes
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-sm text-gray-500">
                {meetingData.attendees_count} participant{meetingData.attendees_count !== 1 ? 's' : ''}
              </div>
              {meetingData.calendar_name && (
                <Badge variant="outline" className="text-xs">
                  {meetingData.calendar_name}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm">
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="summary" className="text-sm font-medium">AI Summary</TabsTrigger>
          <TabsTrigger value="transcript" data-value="transcript" className="text-sm font-medium">Full Transcript</TabsTrigger>
          <TabsTrigger value="recording" className="text-sm font-medium">Recording</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary" className="animate-slide-up">
          <div className="flex gap-8">
            {/* Table of Contents Sidebar */}
            <div className="w-64 flex-shrink-0">
              <div className="sticky top-6">
                <Collapsible open={tocOpen} onOpenChange={setTocOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-between mb-4">
                      Table of Contents
                      <ChevronDown className={`w-4 h-4 transition-transform ${tocOpen ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2">
                    {summaryCards.map((card) => (
                      <button
                        key={card.id}
                        onClick={() => document.getElementById(card.id)?.scrollIntoView({ behavior: 'smooth' })}
                        className="flex items-center gap-2 w-full text-left p-2 rounded-md hover:bg-gray-100 text-sm transition-colors"
                      >
                        <card.icon className="w-4 h-4" />
                        {card.title}
                      </button>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>

            {/* Content Cards */}
            <div className="flex-1 space-y-8">
              {summaryCards.map((card, index) => (
                <div key={card.id}>
                  <Card id={card.id} className="shadow-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <card.icon className={`w-5 h-5 text-${card.color}-600`} />
                        {card.title}
                        {card.content && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={scrollToTranscript}
                            className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View in Transcript
                          </Button>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {renderCardContent(card)}
                    </CardContent>
                  </Card>
                  {index < summaryCards.length - 1 && (
                    <div className="flex items-center justify-center py-4">
                      <Separator className="flex-1" />
                      <div className="px-4">
                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      </div>
                      <Separator className="flex-1" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="transcript" className="animate-slide-up">
          <Card>
            <CardHeader>
              <CardTitle>Full Transcript</CardTitle>
              <CardDescription>Complete meeting conversation</CardDescription>
            </CardHeader>
            <CardContent>
              <div id="transcript-content">
                {transcriptData?.transcript_text ? (
                  <div className="whitespace-pre-wrap text-sm leading-relaxed font-mono bg-gray-50 p-4 rounded-lg">
                    {transcriptData.transcript_text}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No transcript available for this meeting.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recording" className="animate-slide-up">
          <Card>
            <CardHeader>
              <CardTitle>Meeting Recording</CardTitle>
              <CardDescription>Recorded audio and video of the meeting</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="w-full aspect-video bg-gray-900 rounded-lg mb-4 flex items-center justify-center text-white">
                <div className="text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Recording Not Available</p>
                  <p className="text-sm opacity-75">Recording functionality coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MeetingDetail;
