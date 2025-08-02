import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Save, X, Link, Video } from 'lucide-react';
import { format } from 'date-fns';
import { useCreateEvent } from '@/hooks/useEventManagement';
import { toast } from '@/hooks/use-toast';
import AttendeeManagement, { Attendee } from './AttendeeManagement';

interface EventCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStartTime: Date;
  initialEndTime: Date;
  calendarId: string;
  onEventCreated: () => void;
}

const EventCreationModal: React.FC<EventCreationModalProps> = ({
  open,
  onOpenChange,
  initialStartTime,
  initialEndTime,
  calendarId,
  onEventCreated
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    meeting_type: 'manual' as 'manual' | 'google_meet',
    meeting_url: '',
    start_time: format(initialStartTime, "yyyy-MM-dd'T'HH:mm"),
    end_time: format(initialEndTime, "yyyy-MM-dd'T'HH:mm")
  });

  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const createEventMutation = useCreateEvent();

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for the event",
        variant: "destructive"
      });
      return;
    }

    try {
      const eventData = {
        title: formData.title,
        description: formData.description || undefined,
        location: formData.location || undefined,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        calendar_external_id: calendarId,
        meeting_type: formData.meeting_type,
        meeting_url: formData.meeting_url || undefined,
        attendees: attendees.length > 0 ? attendees.map(attendee => ({
          email: attendee.email,
          name: attendee.name,
          responseStatus: 'needsAction' as const
        })) : undefined
      };

      await createEventMutation.mutateAsync(eventData);
      onEventCreated();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        location: '',
        meeting_type: 'manual',
        meeting_url: '',
        start_time: format(initialStartTime, "yyyy-MM-dd'T'HH:mm"),
        end_time: format(initialEndTime, "yyyy-MM-dd'T'HH:mm")
      });
      setAttendees([]);
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Create New Event
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Event title"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Your timezone: {userTimezone}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Add description..."
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Add location"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Meeting Link</Label>
              <div className="space-y-2">
                <Select
                  value={formData.meeting_type}
                  onValueChange={(value: 'manual' | 'google_meet') => 
                    setFormData(prev => ({ 
                      ...prev, 
                      meeting_type: value,
                      meeting_url: value === 'google_meet' ? '' : prev.meeting_url 
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Paste Meeting Link</SelectItem>
                    <SelectItem value="google_meet">Create Google Meet Link</SelectItem>
                  </SelectContent>
                </Select>

                {formData.meeting_type === 'manual' ? (
                  <div className="relative">
                    <Link className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={formData.meeting_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, meeting_url: e.target.value }))}
                      placeholder="Add meeting URL (optional)"
                      className="pl-10"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Video className="h-4 w-4" />
                    <span>A Google Meet link will be automatically generated when the event is created</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Attendees */}
          <AttendeeManagement
            attendees={attendees}
            onAttendeesChange={setAttendees}
            disabled={createEventMutation.isPending}
          />

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createEventMutation.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createEventMutation.isPending || !formData.title.trim()}
            >
              {createEventMutation.isPending ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {createEventMutation.isPending ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventCreationModal;
