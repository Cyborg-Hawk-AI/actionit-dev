
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';

// Format time string from ISO format to readable time
export const getFormattedTime = (timeString: string): string => {
  const date = new Date(timeString);
  return format(date, 'h:mm a');
};

// Get the start date of the week containing the given date
export const getWeekStart = (date: Date): Date => {
  return startOfWeek(date, { weekStartsOn: 0 }); // 0 = Sunday
};

// Get the end date of the week containing the given date
export const getWeekEnd = (date: Date): Date => {
  return endOfWeek(date, { weekStartsOn: 0 }); // 0 = Sunday
};

// Generate an array of dates for a week starting with the given date
export const getWeekDates = (startDate: Date): Date[] => {
  const weekStart = getWeekStart(startDate);
  return Array.from({ length: 7 }).map((_, index) => addDays(weekStart, index));
};

// Format date range for display (e.g., "May 1 - 7, 2023")
export const formatDateRange = (startDate: Date, endDate: Date): string => {
  if (startDate.getMonth() === endDate.getMonth()) {
    return `${format(startDate, 'MMMM d')} - ${format(endDate, 'd, yyyy')}`;
  }
  return `${format(startDate, 'MMMM d')} - ${format(endDate, 'MMMM d, yyyy')}`;
};

// Check if a date is today
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

// Get time slots for a day (30-minute intervals)
export const getDayTimeSlots = (startHour = 0, endHour = 24): Date[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const slots: Date[] = [];
  for (let hour = startHour; hour < endHour; hour++) {
    const timeSlot1 = new Date(today);
    timeSlot1.setHours(hour, 0, 0, 0);
    slots.push(timeSlot1);
    
    const timeSlot2 = new Date(today);
    timeSlot2.setHours(hour, 30, 0, 0);
    slots.push(timeSlot2);
  }
  
  return slots;
};

// Get a readable format for a time slot
export const formatTimeSlot = (date: Date): string => {
  return format(date, 'h:mm a');
};
