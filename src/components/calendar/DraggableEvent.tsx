
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Meeting } from '@/services/calendarService';
import { format, parseISO, differenceInMinutes } from 'date-fns';

interface DraggableEventProps {
  meeting: Meeting;
  timePosition: number;
  duration: number;
  isNow: boolean;
  status: string;
  onEventClick: (meeting: Meeting, event: React.MouseEvent) => void;
  onEventDrop: (meetingId: string, newStartTime: Date, newEndTime: Date) => void;
  getFormattedTime: (date: Date) => string;
  syncStatus?: 'syncing' | 'synced' | 'failed';
}

const DraggableEvent: React.FC<DraggableEventProps> = ({
  meeting,
  timePosition,
  duration,
  isNow,
  status,
  onEventClick,
  onEventDrop,
  getFormattedTime,
  syncStatus = 'synced'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('.event-resize-handle')) {
      return; // Don't start drag if clicking resize handle
    }
    
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !dragStart) return;
    
    // Visual feedback during drag
    const deltaY = e.clientY - dragStart.y;
    const hourHeight = 80; // 80px per hour
    const hoursMove = Math.round(deltaY / hourHeight);
    
    if (Math.abs(hoursMove) >= 1) {
      // Calculate new times
      const originalStart = parseISO(meeting.start_time);
      const originalEnd = parseISO(meeting.end_time);
      const newStart = new Date(originalStart.getTime() + (hoursMove * 60 * 60 * 1000));
      const newEnd = new Date(originalEnd.getTime() + (hoursMove * 60 * 60 * 1000));
      
      onEventDrop(meeting.id, newStart, newEnd);
      setIsDragging(false);
      setDragStart(null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />;
      case 'synced':
        return <div className="w-2 h-2 rounded-full bg-green-500" />;
      case 'failed':
        return <div className="w-2 h-2 rounded-full bg-red-500" />;
      default:
        return null;
    }
  };

  const top = timePosition * 80; // 80px per hour
  const height = Math.max(duration * 80, 24); // Minimum 24px height

  return (
    <div
      className={cn(
        "absolute left-1.5 right-4 rounded p-2.5 overflow-hidden cursor-move transition-all z-20 group",
        "hover:shadow-lg hover:z-30 hover:left-1 hover:right-3 hover:scale-[1.02]",
        isNow ? "border-l-4 border-green-500 ring-2 ring-green-200" : "border-l-4",
        isDragging && "opacity-70 scale-105 shadow-2xl",
        status === "Completed" && "opacity-70"
      )}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        backgroundColor: meeting.calendar_color || '#4285F4',
        borderLeftColor: isNow ? '#22c55e' : meeting.calendar_color || '#4285F4',
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => !isDragging && onEventClick(meeting, e)}
      title={`${meeting.title} - ${getFormattedTime(parseISO(meeting.start_time))} to ${getFormattedTime(parseISO(meeting.end_time))}`}
    >
      <div className="text-white font-medium truncate text-sm">
        {meeting.title}
      </div>
      <div className="text-white text-xs opacity-90 flex items-center justify-between">
        <span>
          {getFormattedTime(parseISO(meeting.start_time))} - {getFormattedTime(parseISO(meeting.end_time))}
        </span>
        {getSyncStatusIcon()}
      </div>
      
      {/* Status badges */}
      <div className="absolute top-1 right-1 flex gap-1">
        {isNow && (
          <Badge className="bg-green-600 text-xs px-1 py-0">LIVE</Badge>
        )}
        {meeting.meeting_url && (
          <Badge className="bg-blue-600 text-xs px-1 py-0">📹</Badge>
        )}
      </div>

      {/* Resize handle */}
      <div className="event-resize-handle absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-white/20 transition-opacity" />
    </div>
  );
};

export default DraggableEvent;
