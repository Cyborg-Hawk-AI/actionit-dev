
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Video, Link as LinkIcon, Bot } from 'lucide-react';
import { JoinMode } from '@/services/recallService';

interface JoinMeetingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoinMeeting: (meetingInfo: {
    url: string;
    title: string;
    joinMode: JoinMode;
    useBot: boolean;
  }) => Promise<void>;
}

const JoinMeetingModal: React.FC<JoinMeetingModalProps> = ({
  open,
  onOpenChange,
  onJoinMeeting
}) => {
  const [meetingUrl, setMeetingUrl] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [joinMode, setJoinMode] = useState<JoinMode>('audio_only');
  const [useBot, setUseBot] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    if (!meetingUrl.trim()) {
      return;
    }

    setIsJoining(true);
    try {
      await onJoinMeeting({
        url: meetingUrl,
        title: meetingTitle || 'Meeting',
        joinMode,
        useBot
      });
      
      // Reset form
      setMeetingUrl('');
      setMeetingTitle('');
      setJoinMode('audio_only');
      setUseBot(true);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to join meeting:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleClose = () => {
    if (!isJoining) {
      setMeetingUrl('');
      setMeetingTitle('');
      setJoinMode('audio_only');
      setUseBot(true);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Join Meeting
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meeting-url">Meeting URL *</Label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="meeting-url"
                type="url"
                placeholder="https://meet.google.com/abc-defg-hij"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                className="pl-10"
                disabled={isJoining}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meeting-title">Meeting Title (optional)</Label>
            <Input
              id="meeting-title"
              type="text"
              placeholder="Meeting title"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              disabled={isJoining}
            />
          </div>

          <div className="space-y-2">
            <Label>Bot Join Mode</Label>
            <Select value={joinMode} onValueChange={(value: JoinMode) => setJoinMode(value)} disabled={isJoining}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="audio_only">Audio Only</SelectItem>
                <SelectItem value="audio_video">Audio & Video</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Use Action.IT Bot</Label>
              <p className="text-sm text-muted-foreground">
                Record and transcribe the meeting automatically
              </p>
            </div>
            <Switch
              checked={useBot}
              onCheckedChange={setUseBot}
              disabled={isJoining}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={handleClose} disabled={isJoining}>
              Cancel
            </Button>
            <Button 
              onClick={handleJoin} 
              disabled={!meetingUrl.trim() || isJoining}
              className="min-w-[100px]"
            >
              {isJoining ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
                  Joining...
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4 mr-2" />
                  Join Meeting
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JoinMeetingModal;
