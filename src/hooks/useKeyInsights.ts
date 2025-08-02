
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';


export interface KeyInsight {
  id: string;
  user_id: string;
  meeting_id: string;
  insight_type: string;
  insight_summary?: string;
  action_items?: string[];
  key_decisions?: string[];
  participants?: Array<{
    name: string;
    role: string;
    speaking_time: string;
  }>;
  sentiment_analysis?: {
    overall_tone: string;
    confidence_level: string;
    key_emotions: string[];
  };
  meeting_metrics?: {
    total_speaking_time: string;
    participation_score: number;
    agenda_adherence: string;
    decision_velocity: string;
  };
  created_at: string;
  updated_at: string;
}

export function useKeyInsights() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['key-insights', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No user authenticated');
      
      const { data, error } = await supabase
        .from('key_insights')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching key insights:', error);
        throw error;
      }

      return data;
    },
    enabled: !!user,
  });
}
