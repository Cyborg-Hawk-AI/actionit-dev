
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { startOfDay, endOfDay } from 'date-fns';

export const useTodayMeetings = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['today-meetings', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const today = new Date();
      const startOfToday = startOfDay(today).toISOString();
      const endOfToday = endOfDay(today).toISOString();

      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', startOfToday)
        .lte('start_time', endOfToday)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('[Today Meetings Hook] Error fetching meetings:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};
