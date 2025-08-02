
import { supabase } from '@/integrations/supabase/client';

export interface SearchResult {
  id: string;
  type: 'meeting' | 'transcript' | 'action_item';
  title: string;
  snippet: string;
  date: string;
  meetingId: string;
  matchField?: string;
  relevanceScore: number;
}

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
}

export const searchGlobal = async (query: string, limit: number = 7): Promise<SearchResponse> => {
  if (!query.trim()) {
    return { results: [], totalCount: 0 };
  }

  console.log('[SearchService] Performing global search for:', query);

  try {
    const searchTerm = query.trim().toLowerCase();
    const results: SearchResult[] = [];

    // Search meetings by title
    const { data: meetings, error: meetingsError } = await supabase
      .from('meetings')
      .select('id, title, start_time, description')
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order('start_time', { ascending: false })
      .limit(limit);

    if (meetingsError) {
      console.error('[SearchService] Error searching meetings:', meetingsError);
    } else if (meetings) {
      meetings.forEach(meeting => {
        const titleMatch = meeting.title?.toLowerCase().includes(searchTerm);
        const descMatch = meeting.description?.toLowerCase().includes(searchTerm);
        
        results.push({
          id: `meeting-${meeting.id}`,
          type: 'meeting',
          title: meeting.title || 'Untitled Meeting',
          snippet: titleMatch ? meeting.title : (meeting.description || ''),
          date: meeting.start_time,
          meetingId: meeting.id,
          matchField: titleMatch ? 'title' : 'description',
          relevanceScore: titleMatch ? 10 : 5
        });
      });
    }

    // Search transcripts
    const { data: transcripts, error: transcriptsError } = await supabase
      .from('transcripts')
      .select('id, meeting_id, meeting_title, meeting_summary, key_items_and_action_items, key_points_by_speaker, created_at')
      .or(`meeting_summary.ilike.%${searchTerm}%,key_items_and_action_items.ilike.%${searchTerm}%,key_points_by_speaker.ilike.%${searchTerm}%,meeting_title.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (transcriptsError) {
      console.error('[SearchService] Error searching transcripts:', transcriptsError);
    } else if (transcripts) {
      transcripts.forEach(transcript => {
        let matchField = '';
        let snippet = '';
        let relevanceScore = 0;

        if (transcript.meeting_title?.toLowerCase().includes(searchTerm)) {
          matchField = 'meeting_title';
          snippet = transcript.meeting_title;
          relevanceScore = 8;
        } else if (transcript.meeting_summary?.toLowerCase().includes(searchTerm)) {
          matchField = 'meeting_summary';
          snippet = extractSnippet(transcript.meeting_summary, searchTerm);
          relevanceScore = 7;
        } else if (transcript.key_items_and_action_items?.toLowerCase().includes(searchTerm)) {
          matchField = 'key_items_and_action_items';
          snippet = extractSnippet(transcript.key_items_and_action_items, searchTerm);
          relevanceScore = 6;
        } else if (transcript.key_points_by_speaker?.toLowerCase().includes(searchTerm)) {
          matchField = 'key_points_by_speaker';
          snippet = extractSnippet(transcript.key_points_by_speaker, searchTerm);
          relevanceScore = 5;
        }

        results.push({
          id: `transcript-${transcript.id}`,
          type: 'transcript',
          title: transcript.meeting_title || 'Meeting Transcript',
          snippet,
          date: transcript.created_at,
          meetingId: transcript.meeting_id,
          matchField,
          relevanceScore
        });
      });
    }

    // Search key insights for action items
    const { data: insights, error: insightsError } = await supabase
      .from('key_insights')
      .select('id, meeting_id, action_items, decisions, created_at')
      .or(`action_items::text.ilike.%${searchTerm}%,decisions::text.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (insightsError) {
      console.error('[SearchService] Error searching insights:', insightsError);
    } else if (insights) {
      insights.forEach(insight => {
        const actionItemsText = JSON.stringify(insight.action_items || []);
        const decisionsText = JSON.stringify(insight.decisions || []);
        
        if (actionItemsText.toLowerCase().includes(searchTerm)) {
          results.push({
            id: `action-${insight.id}`,
            type: 'action_item',
            title: 'Action Item',
            snippet: extractSnippet(actionItemsText, searchTerm),
            date: insight.created_at,
            meetingId: insight.meeting_id,
            matchField: 'action_items',
            relevanceScore: 4
          });
        }

        if (decisionsText.toLowerCase().includes(searchTerm)) {
          results.push({
            id: `decision-${insight.id}`,
            type: 'action_item',
            title: 'Decision',
            snippet: extractSnippet(decisionsText, searchTerm),
            date: insight.created_at,
            meetingId: insight.meeting_id,
            matchField: 'decisions',
            relevanceScore: 4
          });
        }
      });
    }

    // Sort by relevance and recency
    const sortedResults = results
      .sort((a, b) => {
        if (a.relevanceScore !== b.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      })
      .slice(0, limit);

    console.log('[SearchService] Search completed, found results:', sortedResults.length);
    return { results: sortedResults, totalCount: sortedResults.length };

  } catch (error) {
    console.error('[SearchService] Search error:', error);
    return { results: [], totalCount: 0 };
  }
};

const extractSnippet = (text: string, searchTerm: string, maxLength: number = 100): string => {
  if (!text) return '';
  
  const lowerText = text.toLowerCase();
  const lowerTerm = searchTerm.toLowerCase();
  const index = lowerText.indexOf(lowerTerm);
  
  if (index === -1) return text.substring(0, maxLength) + '...';
  
  const start = Math.max(0, index - 20);
  const end = Math.min(text.length, index + searchTerm.length + 50);
  
  let snippet = text.substring(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  
  return snippet;
};

export const highlightMatch = (text: string, searchTerm: string): string => {
  if (!searchTerm) return text;
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-100 dark:bg-yellow-700 px-1 rounded">$1</mark>');
};
