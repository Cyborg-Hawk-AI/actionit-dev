
import React from 'react';
import { addHours } from 'date-fns';
import { cn } from '@/lib/utils';

interface TimeSlotGridProps {
  selectedDate: Date;
  businessHours: number[];
  is24Hour: boolean;
  onTimeSlotClick: (startTime: Date, endTime: Date) => void;
  className?: string;
}

const TimeSlotGrid: React.FC<TimeSlotGridProps> = ({
  selectedDate,
  businessHours,
  is24Hour,
  onTimeSlotClick,
  className
}) => {
  const handleSlotClick = (hour: number) => {
    const startTime = new Date(selectedDate);
    startTime.setHours(hour, 0, 0, 0);
    const endTime = addHours(startTime, 1);
    
    onTimeSlotClick(startTime, endTime);
  };

  return (
    <div className={cn("grid grid-cols-1", className)}>
      {businessHours.map((hour) => (
        <div
          key={`slot-${hour}`}
          className={cn(
            "h-20 border-b border-muted/40 cursor-pointer transition-colors",
            "hover:bg-blue-50/50 dark:hover:bg-blue-950/20",
            hour >= 9 && hour <= 17 && "bg-blue-50/20 dark:bg-blue-950/10"
          )}
          onClick={() => handleSlotClick(hour)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleSlotClick(hour);
            }
          }}
        />
      ))}
    </div>
  );
};

export default TimeSlotGrid;
