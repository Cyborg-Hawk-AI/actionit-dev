
import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { type UserCalendar } from '@/services/calendarService';

// Define an interface for UserCalendar with selected property
interface ExtendedUserCalendar extends Omit<UserCalendar, 'is_selected'> {
  selected?: boolean;
  is_selected?: boolean;
}

interface CollapsibleSidebarProps {
  selectedDate: Date;
  onDateSelect: (date: Date | undefined) => void;
  calendars?: ExtendedUserCalendar[];
  onCalendarToggle?: (calendarId: string, checked: boolean) => void;
  enabledCalendars?: {[id: string]: boolean};
  className?: string;
}

const CollapsibleSidebar = ({
  selectedDate,
  onDateSelect,
  calendars = [],
  onCalendarToggle,
  enabledCalendars = {},
  className
}: CollapsibleSidebarProps) => {
  const [collapsed, setCollapsed] = useState(true);

  // Helper function to determine if a calendar is selected
  const isCalendarSelected = (calendar: ExtendedUserCalendar): boolean => {
    // First check in enabledCalendars prop
    if (enabledCalendars && typeof enabledCalendars[calendar.id] !== 'undefined') {
      return enabledCalendars[calendar.id];
    }
    
    // Then check selected prop
    if (typeof calendar.selected !== 'undefined') {
      return calendar.selected;
    }
    
    // Finally check is_selected if it exists
    if (typeof calendar.is_selected !== 'undefined') {
      return calendar.is_selected;
    }
    
    // Default to true if none of the above exist
    return true;
  };

  return (
    <div
      className={cn(
        "transition-all duration-300 ease-in-out border-r border-border overflow-hidden bg-background",
        collapsed ? "w-16" : "w-72",
        className
      )}
    >
      {/* Toggle button */}
      <div className="flex justify-end p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hover:bg-muted/50"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>

      {/* When collapsed, show icons only */}
      {collapsed ? (
        <div className="flex flex-col items-center gap-6 px-2 py-4">
          <div className="flex flex-col items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-primary" />
          </div>
          <div className="h-px w-full bg-border" />
          <div className="flex flex-col gap-4">
            {calendars.map(calendar => (
              <div 
                key={calendar.id}
                className="cursor-pointer group"
                onClick={() => onCalendarToggle?.(calendar.id, !isCalendarSelected(calendar))}
                title={calendar.name}
              >
                <div 
                  className="w-6 h-6 rounded-full group-hover:scale-110 transition-transform"
                  style={{ 
                    backgroundColor: calendar.color || '#6E59A5',
                    opacity: isCalendarSelected(calendar) ? 1 : 0.4
                  }}
                >
                  {isCalendarSelected(calendar) && (
                    <div className="flex items-center justify-center h-full">
                      <Check className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Expanded sidebar content */
        <div className="p-4 space-y-6">
          {/* Mini calendar */}
          <div>
            <h3 className="font-medium mb-3 text-sm">Date</h3>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={onDateSelect}
              className="rounded border border-border/40 bg-card p-3"
            />
          </div>

          {/* Calendar list */}
          <div>
            <h3 className="font-medium mb-3 text-sm">My Calendars</h3>
            <div className="space-y-2">
              {calendars.map(calendar => (
                <div key={calendar.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`calendar-${calendar.id}`}
                    checked={isCalendarSelected(calendar)}
                    onCheckedChange={() => {
                      if (onCalendarToggle) {
                        // Toggle to opposite of current value
                        onCalendarToggle(calendar.id, !isCalendarSelected(calendar));
                      }
                    }}
                  />
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: calendar.color || '#6E59A5' }}
                  />
                  <Label
                    htmlFor={`calendar-${calendar.id}`}
                    className="text-sm font-normal cursor-pointer flex-1 truncate"
                    onClick={() => {
                      if (onCalendarToggle) {
                        // Also allow toggling by clicking the label
                        onCalendarToggle(calendar.id, !isCalendarSelected(calendar));
                      }
                    }}
                  >
                    {calendar.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollapsibleSidebar;
