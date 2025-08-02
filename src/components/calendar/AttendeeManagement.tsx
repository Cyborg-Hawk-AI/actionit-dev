
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Mail, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export interface Attendee {
  email: string;
  name?: string;
  role: 'required' | 'optional';
  rsvp_status: 'pending' | 'accepted' | 'declined' | 'tentative';
}

interface AttendeeManagementProps {
  attendees: Attendee[];
  onAttendeesChange: (attendees: Attendee[]) => void;
  disabled?: boolean;
}

const AttendeeManagement: React.FC<AttendeeManagementProps> = ({
  attendees,
  onAttendeesChange,
  disabled = false
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const addAttendee = () => {
    const email = emailInput.trim();
    const name = nameInput.trim();

    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter an email address",
        variant: "destructive"
      });
      return;
    }

    if (!isValidEmail(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    if (attendees.some(a => a.email === email)) {
      toast({
        title: "Duplicate Email",
        description: "This email is already in the attendee list",
        variant: "destructive"
      });
      return;
    }

    const newAttendee: Attendee = {
      email,
      name: name || undefined,
      role: 'required',
      rsvp_status: 'pending'
    };

    onAttendeesChange([...attendees, newAttendee]);
    setEmailInput('');
    setNameInput('');
  };

  const removeAttendee = (email: string) => {
    onAttendeesChange(attendees.filter(a => a.email !== email));
  };

  const updateAttendee = (email: string, updates: Partial<Attendee>) => {
    onAttendeesChange(
      attendees.map(a => a.email === email ? { ...a, ...updates } : a)
    );
  };

  const handleEmailKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addAttendee();
    }
  };

  const getRSVPBadge = (status: string) => {
    const statusConfig = {
      accepted: { text: '✅ Accepted', className: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' },
      declined: { text: '❌ Declined', className: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' },
      tentative: { text: '❓ Maybe', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' },
      pending: { text: '⏳ Pending', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.className}>{config.text}</Badge>;
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium flex items-center gap-2">
        <User className="h-4 w-4" />
        Attendees ({attendees.length})
      </h4>

      {/* Add Attendee Form */}
      <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Input
            type="email"
            placeholder="Email address *"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyPress={handleEmailKeyPress}
            disabled={disabled}
            className={!isValidEmail(emailInput) && emailInput ? 'border-red-500' : ''}
          />
          <Input
            type="text"
            placeholder="Name (optional)"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyPress={handleEmailKeyPress}
            disabled={disabled}
          />
        </div>
        <Button onClick={addAttendee} disabled={disabled} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Attendee
        </Button>
      </div>

      {/* Attendees List */}
      {attendees.length > 0 && (
        <div className="space-y-2">
          {attendees.map((attendee) => (
            <div key={attendee.email} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {attendee.name || attendee.email}
                  </p>
                  {attendee.name && (
                    <p className="text-xs text-muted-foreground truncate">
                      {attendee.email}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={attendee.role}
                    onValueChange={(value) => updateAttendee(attendee.email, { role: value as 'required' | 'optional' })}
                    disabled={disabled}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="required">Required</SelectItem>
                      <SelectItem value="optional">Optional</SelectItem>
                    </SelectContent>
                  </Select>
                  {getRSVPBadge(attendee.rsvp_status)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttendee(attendee.email)}
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttendeeManagement;
