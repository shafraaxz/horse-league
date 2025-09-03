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
 * Debug function to log date parsing information
 * @param {*} dateInput - Various date formats
 * @param {string} label - Label for debugging
 */
export function debugDate(dateInput, label = 'Date') {
  console.log(`${label} Debug:`, {
    input: dateInput,
    inputType: typeof dateInput,
    parsed: parseMongoDate(dateInput),
    formatted: formatDisplayDate(dateInput) + ' ' + formatDisplayTime(dateInput),
    timestamp: parseMongoDate(dateInput)?.getTime()
  });
}
