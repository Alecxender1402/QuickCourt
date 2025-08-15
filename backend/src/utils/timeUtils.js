/**
 * Time utility functions to handle time formatting without timezone issues
 */

/**
 * Convert time string (HH:mm) to UTC Date object for database storage
 * @param {string} timeString - Time in format "HH:mm" (e.g., "14:30")
 * @returns {Date} UTC Date object with time set correctly
 */
export const timeStringToUTCDate = (timeString) => {
  if (!timeString || !timeString.includes(':')) {
    throw new Error('Invalid time format. Expected HH:mm');
  }

  const [hours, minutes] = timeString.split(':').map(Number);
  
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error('Invalid time values. Hours: 0-23, Minutes: 0-59');
  }

  const baseDate = new Date('1970-01-01T00:00:00.000Z');
  const timeDate = new Date(baseDate);
  timeDate.setUTCHours(hours, minutes, 0, 0);
  
  return timeDate;
};

/**
 * Convert UTC Date object from database to time string (HH:mm)
 * @param {Date} dateObject - UTC Date object from database
 * @returns {string} Time string in format "HH:mm"
 */
export const utcDateToTimeString = (dateObject) => {
  if (!dateObject || !(dateObject instanceof Date)) {
    throw new Error('Invalid date object');
  }

  const hours = dateObject.getUTCHours().toString().padStart(2, '0');
  const minutes = dateObject.getUTCMinutes().toString().padStart(2, '0');
  
  return `${hours}:${minutes}`;
};

/**
 * Format time for display (12-hour format with AM/PM)
 * @param {string|Date} time - Time string "HH:mm" or Date object
 * @returns {string} Formatted time like "2:30 PM"
 */
export const formatTimeForDisplay = (time) => {
  let hours, minutes;

  if (typeof time === 'string') {
    [hours, minutes] = time.split(':').map(Number);
  } else if (time instanceof Date) {
    hours = time.getUTCHours();
    minutes = time.getUTCMinutes();
  } else {
    throw new Error('Invalid time format');
  }

  const today = new Date();
  const timeDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, 0);
  
  return timeDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Validate time string format
 * @param {string} timeString - Time string to validate
 * @returns {boolean} True if valid format
 */
export const isValidTimeFormat = (timeString) => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
};

/**
 * Calculate duration between two time strings in minutes
 * @param {string} startTime - Start time "HH:mm"
 * @param {string} endTime - End time "HH:mm"
 * @returns {number} Duration in minutes
 */
export const calculateDurationMinutes = (startTime, endTime) => {
  if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
    throw new Error('Invalid time format');
  }

  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  
  return endMinutes - startMinutes;
};
