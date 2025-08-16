import { format } from "date-fns";

/**
 * Formats a time string or timestamp to display only the time in HH:mm format
 * Handles various input formats:
 * - Full timestamps: "1970-01-01T08:31:00.000Z"
 * - Time strings: "08:31:00" or "08:31"
 * - ISO date strings with time
 */
export const formatTimeOnly = (timeString: string): string => {
  try {
    // If it's a full timestamp (contains T or Z), parse as Date
    if (timeString.includes('T') || timeString.includes('Z')) {
      const date = new Date(timeString);
      return format(date, 'HH:mm');
    }
    
    // If it's already in HH:mm:ss or HH:mm format, extract hours and minutes
    if (timeString.includes(':')) {
      const timeParts = timeString.split(':');
      const hours = timeParts[0].padStart(2, '0');
      const minutes = timeParts[1].padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    
    // Return as-is if format is not recognized
    return timeString;
  } catch (error) {
    console.warn('Error formatting time:', timeString, error);
    return timeString;
  }
};

/**
 * Formats a time string to 12-hour format with AM/PM
 */
export const formatTime12Hour = (timeString: string): string => {
  try {
    // If it's a full timestamp, parse as Date
    if (timeString.includes('T') || timeString.includes('Z')) {
      const date = new Date(timeString);
      return format(date, 'h:mm a');
    }
    
    // If it's in HH:mm:ss or HH:mm format
    if (timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':').map(Number);
      
      // Create a date with current date to avoid timezone issues
      const today = new Date();
      const timeDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, 0);
      
      return timeDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
    
    return timeString;
  } catch (error) {
    console.warn('Error formatting time to 12-hour:', timeString, error);
    return timeString;
  }
};

/**
 * Formats a time range display
 */
export const formatTimeRange = (startTime: string, endTime: string, use12Hour: boolean = false): string => {
  const formatter = use12Hour ? formatTime12Hour : formatTimeOnly;
  return `${formatter(startTime)} - ${formatter(endTime)}`;
};
