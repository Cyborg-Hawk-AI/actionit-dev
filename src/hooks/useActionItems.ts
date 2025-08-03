import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ActionItem {
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
  snoozedUntil?: string;
}

export function useActionItems() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch action items from key_insights table
  const { data: actionItems, isLoading, error } = useQuery({
    queryKey: ['action-items', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No user authenticated');
      
      // Get key insights with action items
      const { data: keyInsights, error: insightsError } = await supabase
        .from('key_insights')
        .select(`
          *,
          meetings!inner (
            id,
            title,
            start_time
          )
        `)
        .eq('user_id', user.id)
        .not('action_items', 'is', null)
        .order('created_at', { ascending: false });

      if (insightsError) {
        console.error('Error fetching key insights:', insightsError);
        throw insightsError;
      }

      // Transform action items from key insights
      const transformedActionItems: ActionItem[] = [];
      
      keyInsights?.forEach((insight) => {
        if (insight.action_items && Array.isArray(insight.action_items)) {
          insight.action_items.forEach((item: any, index: number) => {
            // Handle different action item formats
            let title = '';
            let description = '';
            let assignedTo = '';
            let priority: 'low' | 'medium' | 'high' = 'medium';
            
            if (typeof item === 'string') {
              title = item;
            } else if (typeof item === 'object') {
              title = item.text || item.title || item.action || '';
              description = item.description || '';
              assignedTo = item.assignee || item.assignedTo || '';
              priority = item.priority || 'medium';
            }
            
            if (title) {
              transformedActionItems.push({
                id: `${insight.id}-${index}`,
                title,
                description,
                status: 'pending',
                assignedTo,
                meetingId: insight.meeting_id,
                meetingTitle: insight.meetings?.title || 'Unknown Meeting',
                priority,
                createdAt: insight.created_at,
                dueDate: undefined, // Will be calculated based on meeting date
                snoozedUntil: undefined
              });
            }
          });
        }
      });

      // Also check transcripts for action items
      const { data: transcripts, error: transcriptsError } = await supabase
        .from('transcripts')
        .select(`
          *,
          meetings!inner (
            id,
            title,
            start_time
          )
        `)
        .eq('user_id', user.id)
        .not('key_items_and_action_items', 'is', null)
        .order('created_at', { ascending: false });

      if (!transcriptsError && transcripts) {
        transcripts.forEach((transcript) => {
          if (transcript.key_items_and_action_items) {
            const actionItemsText = transcript.key_items_and_action_items;
            const lines = actionItemsText.split('\n').filter(line => line.trim());
            
            lines.forEach((line, index) => {
              if (line.trim() && !line.startsWith('#')) {
                transformedActionItems.push({
                  id: `transcript-${transcript.id}-${index}`,
                  title: line.trim(),
                  description: '',
                  status: 'pending',
                  assignedTo: '',
                  meetingId: transcript.meeting_id,
                  meetingTitle: transcript.meetings?.title || 'Unknown Meeting',
                  priority: 'medium',
                  createdAt: transcript.created_at,
                  dueDate: undefined,
                  snoozedUntil: undefined
                });
              }
            });
          }
        });
      }

      // Sort by creation date (newest first)
      return transformedActionItems.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    enabled: !!user,
  });

  // Update action item status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ itemId, status }: { itemId: string; status: ActionItem['status'] }) => {
      // For now, we'll store status updates in localStorage since we don't have a dedicated action_items table
      // In a production app, you'd want a separate action_items table
      const storedItems = JSON.parse(localStorage.getItem(`action-items-${user?.id}`) || '{}');
      storedItems[itemId] = { ...storedItems[itemId], status };
      localStorage.setItem(`action-items-${user?.id}`, JSON.stringify(storedItems));
      
      return { itemId, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['action-items', user?.id] });
      toast({
        title: "Action item updated",
        description: "The action item status has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating action item",
        description: "Failed to update the action item status.",
        variant: "destructive",
      });
    },
  });

  // Snooze action item
  const snoozeMutation = useMutation({
    mutationFn: async ({ itemId, days }: { itemId: string; days: number }) => {
      const snoozedUntil = new Date();
      snoozedUntil.setDate(snoozedUntil.getDate() + days);
      
      const storedItems = JSON.parse(localStorage.getItem(`action-items-${user?.id}`) || '{}');
      storedItems[itemId] = { 
        ...storedItems[itemId], 
        status: 'snoozed',
        snoozedUntil: snoozedUntil.toISOString()
      };
      localStorage.setItem(`action-items-${user?.id}`, JSON.stringify(storedItems));
      
      return { itemId, snoozedUntil: snoozedUntil.toISOString(), days };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['action-items', user?.id] });
      toast({
        title: "Action item snoozed",
        description: `Action item has been snoozed for ${data.days} day${data.days > 1 ? 's' : ''}.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error snoozing action item",
        description: "Failed to snooze the action item.",
        variant: "destructive",
      });
    },
  });

  // Apply stored status updates to action items
  const processedActionItems = actionItems?.map(item => {
    const storedItems = JSON.parse(localStorage.getItem(`action-items-${user?.id}`) || '{}');
    const storedItem = storedItems[item.id];
    
    if (storedItem) {
      return {
        ...item,
        status: storedItem.status || item.status,
        snoozedUntil: storedItem.snoozedUntil
      };
    }
    
    return item;
  }) || [];

  return {
    actionItems: processedActionItems,
    isLoading,
    error,
    updateStatus: updateStatusMutation.mutate,
    snooze: snoozeMutation.mutate,
    isUpdating: updateStatusMutation.isPending,
    isSnoozing: snoozeMutation.isPending,
  };
} 