// ===========================================
// FILE: utils/dateUtils.js
// ===========================================
import { format, parseISO, isValid } from 'date-fns';

/**
 * Safely parses various date formats from MongoDB and JavaScript
 * @param {*} dateInput - Can be timestamp, ISO string, Date object, or MongoDB date object
 * @returns {Date|null} - Valid Date object or null if invalid
 */
export function parseMongoDate(dateInput) {
  if (!dateInput) return null;

  try {
    let date;

    // Handle different input types
    if (typeof dateInput === 'number') {
      // Direct timestamp (milliseconds)
      date = new Date(dateInput);
    } else if (typeof dateInput === 'string') {
      // ISO string or date string
      date = parseISO(dateInput) || new Date(dateInput);
    } else if (dateInput instanceof Date) {
      // Already a Date object
      date = dateInput;
    } else if (dateInput.$date) {
      // MongoDB date object with $date field
      if (typeof dateInput.$date === 'number') {
        date = new Date(dateInput.$date);
      } else if (dateInput.$date.$numberLong) {
        // MongoDB extended JSON format
        date = new Date(parseInt(dateInput.$date.$numberLong));
      } else {
        date = new Date(dateInput.$date);
      }
    } else {
      // Try to parse as generic object
      date = new Date(dateInput);
    }

    // Validate the parsed date
    if (!isValid(date)) {
      console.warn('Invalid date parsed:', { input: dateInput, result: date });
      return null;
    }

    return date;
  } catch (error) {
    console.error('Error parsing date:', { input: dateInput, error: error.message });
    return null;
  }
}

/**
 * Formats date for display in tables and UI
 * @param {*} dateInput - Various date formats
 * @param {string} formatString - date-fns format string
 * @returns {string} - Formatted date string
 */
export function formatDisplayDate(dateInput, formatString = 'MMM dd, yyyy') {
  const date = parseMongoDate(dateInput);
  if (!date) return 'Invalid Date';
  
  try {
    return format(date, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Format Error';
  }
}

/**
 * Formats time for display in tables and UI
 * @param {*} dateInput - Various date formats
 * @param {string} formatString - date-fns format string
 * @returns {string} - Formatted time string
 */
export function formatDisplayTime(dateInput, formatString = 'HH:mm') {
  const date = parseMongoDate(dateInput);
  if (!date) return '';
  
  try {
    return format(date, formatString);
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Format Error';
  }
}

/**
 * Formats date and time together
 * @param {*} dateInput - Various date formats
 * @returns {string} - Formatted date and time
 */
export function formatDisplayDateTime(dateInput) {
  const date = parseMongoDate(dateInput);
  if (!date) return 'Invalid DateTime';
  
  try {
    return format(date, 'MMM dd, yyyy HH:mm');
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return 'Format Error';
  }
}

/**
 * Formats a date for datetime-local input
 * Preserves the actual date/time without timezone conversion
 * @param {*} dateInput - Various date formats
 * @returns {string} - Format suitable for datetime-local input
 */
export function formatToLocalDateTime(dateInput) {
  if (!dateInput) return '';
  
  const date = parseMongoDate(dateInput);
  if (!date) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Converts datetime-local input value to ISO string for backend
 * @param {string} datetimeLocalValue - Value from datetime-local input
 * @returns {string|null} - ISO string or null
 */
export function parseLocalDateTimeToISO(datetimeLocalValue) {
  if (!datetimeLocalValue) return null;
  
  try {
    const date = new Date(datetimeLocalValue);
    if (!isValid(date)) return null;
    return date.toISOString();
  } catch (error) {
    console.error('Error parsing datetime-local value:', error);
    return null;
  }
}

/**
 * Check if a date is today
 * @param {*} dateInput - Various date formats
 * @returns {boolean}
 */
export function isToday(dateInput) {
  const date = parseMongoDate(dateInput);
  if (!date) return false;
  
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

/**
 * Check if a date is in the future
 * @param {*} dateInput - Various date formats
 * @returns {boolean}
 */
export function isFuture(dateInput) {
  const date = parseMongoDate(dateInput);
  if (!date) return false;
  
  return date > new Date();
}

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 * @param {*} dateInput - Various date formats
 * @returns {string}
 */
export function getRelativeTime(dateInput) {
  const date = parseMongoDate(dateInput);
  if (!date) return 'Invalid date';
  
  const now = new Date();
  const diffMs = date - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.ceil(diffMs / (1000 * 60));
  
  if (Math.abs(diffDays) >= 1) {
    return diffDays > 0 ? `in ${diffDays} days` : `${Math.abs(diffDays)} days ago`;
  } else if (Math.abs(diffHours) >= 1) {
    return diffHours > 0 ? `in ${diffHours} hours` : `${Math.abs(diffHours)} hours ago`;
  } else if (Math.abs(diffMinutes) >= 1) {
    return diffMinutes > 0 ? `in ${diffMinutes} minutes` : `${Math.abs(diffMinutes)} minutes ago`;
  } else {
    return 'now';
  }
}

/**
 * Debug function to log date parsing information
 * @param {*} dateInput - Various date formats
 * @param {string} label - Label for debugging
 */
export function debugDate(dateInput, label = 'Date') {
  console.log(`${label} Debug:`, {
    input: dateInput,
    inputType: typeof dateInput,
    parsed: parseMongoDate(dateInput),
    formatted: formatDisplayDateTime(dateInput),
    timestamp: parseMongoDate(dateInput)?.getTime()
  });
}

// Validation helpers
export const isValidDate = (dateInput) => {
  const date = parseMongoDate(dateInput);
  return date !== null;
};

export const isSameDay = (date1, date2) => {
  const d1 = parseMongoDate(date1);
  const d2 = parseMongoDate(date2);
  if (!d1 || !d2) return false;
  return d1.toDateString() === d2.toDateString();
};

// Export default object for convenience
export default {
  parseMongoDate,
  formatDisplayDate,
  formatDisplayTime,
  formatDisplayDateTime,
  formatToLocalDateTime,
  parseLocalDateTimeToISO,
  isToday,
  isFuture,
  getRelativeTime,
  debugDate,
  isValidDate,
  isSameDay
};