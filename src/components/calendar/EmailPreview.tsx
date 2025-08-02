
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Mail, MapPin, Clock, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { Attendee } from './AttendeeManagement';

interface EmailPreviewProps {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  meetingUrl?: string;
  attendees: Attendee[];
  includeGoogleMeet: boolean;
  includeCalendarFile: boolean;
  includeLocation: boolean;
  onIncludeGoogleMeetChange: (value: boolean) => void;
  onIncludeCalendarFileChange: (value: boolean) => void;
  onIncludeLocationChange: (value: boolean) => void;
}

const EmailPreview: React.FC<EmailPreviewProps> = ({
  title,
  description,
  startTime,
  endTime,
  location,
  meetingUrl,
  attendees,
  includeGoogleMeet,
  includeCalendarFile,
  includeLocation,
  onIncludeGoogleMeetChange,
  onIncludeCalendarFileChange,
  onIncludeLocationChange
}) => {
  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'EEEE, MMMM d, yyyy • h:mm a');
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a');
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium flex items-center gap-2">
        <Mail className="h-4 w-4" />
        Email Preview
      </h4>

      {/* Email Options */}
      <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="include-meet"
            checked={includeGoogleMeet}
            onCheckedChange={onIncludeGoogleMeetChange}
          />
          <label htmlFor="include-meet" className="text-sm font-medium">
            Include Google Meet link ✅
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="include-calendar"
            checked={includeCalendarFile}
            onCheckedChange={onIncludeCalendarFileChange}
          />
          <label htmlFor="include-calendar" className="text-sm font-medium">
            Include calendar file ✅
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="include-location"
            checked={includeLocation}
            onCheckedChange={onIncludeLocationChange}
          />
          <label htmlFor="include-location" className="text-sm font-medium">
            Include location ✅
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="send-later"
            checked={false}
            disabled
          />
          <label htmlFor="send-later" className="text-sm font-medium text-muted-foreground">
            Send later (Coming soon)
          </label>
        </div>
      </div>

      {/* Email Preview Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Meeting Invite: {title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Meeting Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{formatDateTime(startTime)} - {formatTime(endTime)}</span>
            </div>
            
            {includeLocation && location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{location}</span>
              </div>
            )}
            
            {includeGoogleMeet && meetingUrl && (
              <div className="flex items-center gap-2 text-sm">
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <span className="text-blue-600">Join with Google Meet</span>
              </div>
            )}
          </div>

          {/* Description */}
          {description && (
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Description:</p>
              <p>{description}</p>
            </div>
          )}

          {/* Attendees */}
          {attendees.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Attendees ({attendees.length}):</p>
              <div className="flex flex-wrap gap-2">
                {attendees.map((attendee) => (
                  <Badge key={attendee.email} variant="secondary" className="text-xs">
                    {attendee.name || attendee.email}
                    {attendee.role === 'optional' && ' (Optional)'}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground border-t pt-2">
            This invitation will be sent via Google Calendar
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailPreview;
