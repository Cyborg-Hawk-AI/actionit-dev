
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths } from 'date-fns';

interface CalendarNavigationProps {
  selectedDate: Date;
  view: 'day' | 'week' | 'month' | 'agenda';
  onDateChange: (date: Date) => void;
}

const CalendarNavigation = ({ selectedDate, view, onDateChange }: CalendarNavigationProps) => {
  const handlePrevious = () => {
    let newDate: Date;
    switch (view) {
      case 'day':
        newDate = subDays(selectedDate, 1);
        break;
      case 'week':
        newDate = subWeeks(selectedDate, 1);
        break;
      case 'month':
        newDate = subMonths(selectedDate, 1);
        break;
      case 'agenda':
        newDate = subWeeks(selectedDate, 1); // Use week navigation for agenda view
        break;
      default:
        newDate = selectedDate;
    }
    onDateChange(newDate);
  };

  const handleNext = () => {
    let newDate: Date;
    switch (view) {
      case 'day':
        newDate = addDays(selectedDate, 1);
        break;
      case 'week':
        newDate = addWeeks(selectedDate, 1);
        break;
      case 'month':
        newDate = addMonths(selectedDate, 1);
        break;
      case 'agenda':
        newDate = addWeeks(selectedDate, 1); // Use week navigation for agenda view
        break;
      default:
        newDate = selectedDate;
    }
    onDateChange(newDate);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const getFormattedDateRange = () => {
    switch (view) {
      case 'day': {
        return format(selectedDate, 'EEEE, MMMM d, yyyy');
      }
      case 'week': {
        const startOfWeek = new Date(selectedDate);
        startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return `${format(startOfWeek, 'MMM d')} - ${format(endOfWeek, 'MMM d, yyyy')}`;
      }
      case 'month': {
        return format(selectedDate, 'MMMM yyyy');
      }
      case 'agenda': {
        return format(selectedDate, 'MMMM yyyy');
      }
      default: {
        return format(selectedDate, 'MMMM yyyy');
      }
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 mb-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleToday}
          className="text-xs px-3"
        >
          Today
        </Button>
      </div>
      
      <div className="flex-1 text-center">
        <h2 className="text-lg font-semibold text-foreground">
          {getFormattedDateRange()}
        </h2>
      </div>
      
      <div className="w-20"></div> {/* Spacer to center the date */}
    </div>
  );
};

export default CalendarNavigation;
