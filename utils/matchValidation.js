// ===========================================
// FILE: utils/matchValidation.js
// Match validation utilities for date and status validation
// ===========================================

import { isValid, parseISO, format } from 'date-fns';

/**
 * Validate match date based on status with enhanced logic
 * @param {string|Date} dateInput - The date to validate
 * @param {string} status - Match status (scheduled, live, completed, etc.)
 * @returns {Object} - { isValid: boolean, error: string, date: Date }
 */
export function validateMatchDate(dateInput, status = 'scheduled') {
  if (!dateInput) {
    return { isValid: false, error: 'Match date is required', date: null };
  }

  let date;
  
  // Parse the date
  try {
    if (typeof dateInput === 'string') {
      date = dateInput.includes('T') ? parseISO(dateInput) : new Date(dateInput);
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      date = new Date(dateInput);
    }
  } catch (error) {
    return { isValid: false, error: 'Invalid date format', date: null };
  }

  // Check if date is valid
  if (!isValid(date)) {
    return { isValid: false, error: 'Invalid date', date: null };
  }

  const now = new Date();
  const timeDifference = date.getTime() - now.getTime();
  const hoursDifference = Math.abs(timeDifference) / (1000 * 60 * 60);

  // Validation rules based on status
  switch (status) {
    case 'scheduled':
      if (date < now) {
        return { 
          isValid: false, 
          error: 'Scheduled match date cannot be in the past', 
          date 
        };
      }
      break;

    case 'live':
      // Live matches should be within reasonable time of current time
      if (hoursDifference > 24) {
        return { 
          isValid: false, 
          error: 'Live match date should be within 24 hours of current time', 
          date 
        };
      }
      break;

    case 'completed':
      // Completed matches can be in the past, but not too far in the future
      if (timeDifference > 24 * 60 * 60 * 1000) { // More than 24 hours in future
        return { 
          isValid: false, 
          error: 'Completed match date cannot be more than 24 hours in the future', 
          date 
        };
      }
      break;

    case 'postponed':
    case 'cancelled':
      // These can have any date, but let's be reasonable
      break;

    default:
      // Unknown status, use scheduled rules
      if (date < now) {
        return { 
          isValid: false, 
          error: 'Match date cannot be in the past', 
          date 
        };
      }
  }

  return { isValid: true, error: null, date };
}

/**
 * Validate match teams
 * @param {string} homeTeamId - Home team ID
 * @param {string} awayTeamId - Away team ID
 * @returns {Object} - { isValid: boolean, error: string }
 */
export function validateMatchTeams(homeTeamId, awayTeamId) {
  if (!homeTeamId || !awayTeamId) {
    return { isValid: false, error: 'Both home and away teams must be selected' };
  }

  if (homeTeamId === awayTeamId) {
    return { isValid: false, error: 'Home and away teams cannot be the same' };
  }

  return { isValid: true, error: null };
}

/**
 * Validate match scores based on status
 * @param {number} homeScore - Home team score
 * @param {number} awayScore - Away team score
 * @param {string} status - Match status
 * @returns {Object} - { isValid: boolean, error: string }
 */
export function validateMatchScores(homeScore, awayScore, status) {
  const home = parseInt(homeScore) || 0;
  const away = parseInt(awayScore) || 0;

  // Scores should be non-negative
  if (home < 0 || away < 0) {
    return { isValid: false, error: 'Scores cannot be negative' };
  }

  // Reasonable upper limit
  if (home > 50 || away > 50) {
    return { isValid: false, error: 'Scores cannot exceed 50' };
  }

  // Status-based validation
  if (status === 'scheduled' || status === 'postponed' || status === 'cancelled') {
    if (home > 0 || away > 0) {
      return { 
        isValid: false, 
        error: `${status} matches should not have scores` 
      };
    }
  }

  return { isValid: true, error: null };
}

/**
 * Validate match events array
 * @param {Array} events - Array of match events
 * @param {string} status - Match status
 * @returns {Object} - { isValid: boolean, error: string, processedEvents: Array }
 */
export function validateMatchEvents(events = [], status) {
  if (!Array.isArray(events)) {
    return { isValid: false, error: 'Events must be an array', processedEvents: [] };
  }

  // Events should only exist for completed or live matches
  if ((status === 'scheduled' || status === 'postponed' || status === 'cancelled') && events.length > 0) {
    return { 
      isValid: false, 
      error: `${status} matches should not have events`,
      processedEvents: []
    };
  }

  const validEventTypes = ['goal', 'assist', 'yellow_card', 'red_card', 'substitution', 'other'];
  const validTeams = ['home', 'away'];
  const processedEvents = [];

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    
    if (!event.type || !validEventTypes.includes(event.type)) {
      return { 
        isValid: false, 
        error: `Invalid event type at index ${i}: ${event.type}`,
        processedEvents: []
      };
    }

    if (!event.team || !validTeams.includes(event.team)) {
      return { 
        isValid: false, 
        error: `Invalid team at index ${i}: ${event.team}`,
        processedEvents: []
      };
    }

    if (event.minute !== undefined) {
      const minute = parseInt(event.minute);
      if (isNaN(minute) || minute < 0 || minute > 120) {
        return { 
          isValid: false, 
          error: `Invalid minute at index ${i}: ${event.minute}`,
          processedEvents: []
        };
      }
    }

    // Process the event
    const processedEvent = {
      id: event.id || Date.now() + i,
      type: event.type,
      team: event.team,
      minute: parseInt(event.minute) || 0,
      player: event.player || null,
      playerName: event.playerName || '',
      description: event.description || `${event.type.replace('_', ' ').toUpperCase()}`,
      timestamp: event.timestamp ? new Date(event.timestamp) : new Date()
    };

    processedEvents.push(processedEvent);
  }

  return { isValid: true, error: null, processedEvents };
}

/**
 * Comprehensive match data validation
 * @param {Object} matchData - Complete match data object
 * @returns {Object} - { isValid: boolean, errors: Array, warnings: Array }
 */
export function validateCompleteMatch(matchData) {
  const errors = [];
  const warnings = [];

  // Required fields
  if (!matchData.homeTeam) errors.push('Home team is required');
  if (!matchData.awayTeam) errors.push('Away team is required');
  if (!matchData.season) errors.push('Season is required');
  if (!matchData.matchDate) errors.push('Match date is required');

  // Team validation
  const teamValidation = validateMatchTeams(matchData.homeTeam, matchData.awayTeam);
  if (!teamValidation.isValid) {
    errors.push(teamValidation.error);
  }

  // Date validation
  const dateValidation = validateMatchDate(matchData.matchDate, matchData.status);
  if (!dateValidation.isValid) {
    errors.push(dateValidation.error);
  }

  // Score validation
  const scoreValidation = validateMatchScores(
    matchData.homeScore, 
    matchData.awayScore, 
    matchData.status
  );
  if (!scoreValidation.isValid) {
    errors.push(scoreValidation.error);
  }

  // Events validation
  const eventsValidation = validateMatchEvents(matchData.events, matchData.status);
  if (!eventsValidation.isValid) {
    errors.push(eventsValidation.error);
  }

  // Warnings for potential issues
  if (matchData.status === 'completed' && (!matchData.events || matchData.events.length === 0)) {
    warnings.push('Completed match has no events - player statistics will not be updated');
  }

  if (matchData.venue && matchData.venue.length > 200) {
    warnings.push('Venue name is very long');
  }

  if (matchData.notes && matchData.notes.length > 1000) {
    warnings.push('Notes are very long');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    processedEvents: eventsValidation.processedEvents || []
  };
}

/**
 * Format validation errors for user display
 * @param {Array} errors - Array of error strings
 * @param {Array} warnings - Array of warning strings
 * @returns {string} - Formatted message
 */
export function formatValidationMessage(errors = [], warnings = []) {
  let message = '';

  if (errors.length > 0) {
    message += 'Errors:\n' + errors.map(e => `• ${e}`).join('\n');
  }

  if (warnings.length > 0) {
    if (message) message += '\n\n';
    message += 'Warnings:\n' + warnings.map(w => `• ${w}`).join('\n');
  }

  return message;
}

/**
 * Client-side validation for match forms
 * @param {Object} formData - Form data object
 * @returns {Object} - { isValid: boolean, errors: Object, canSubmit: boolean }
 */
export function validateMatchForm(formData) {
  const fieldErrors = {};
  let canSubmit = true;

  // Team validation
  if (!formData.homeTeam) {
    fieldErrors.homeTeam = 'Home team is required';
    canSubmit = false;
  }

  if (!formData.awayTeam) {
    fieldErrors.awayTeam = 'Away team is required';
    canSubmit = false;
  } else if (formData.homeTeam === formData.awayTeam) {
    fieldErrors.awayTeam = 'Away team cannot be the same as home team';
    canSubmit = false;
  }

  // Date validation
  const dateValidation = validateMatchDate(formData.matchDate, formData.status);
  if (!dateValidation.isValid) {
    fieldErrors.matchDate = dateValidation.error;
    canSubmit = false;
  }

  // Season validation
  if (!formData.season) {
    fieldErrors.season = 'Season is required';
    canSubmit = false;
  }

  // Score validation for completed/live matches
  if (formData.status === 'completed' || formData.status === 'live') {
    const scoreValidation = validateMatchScores(
      formData.homeScore, 
      formData.awayScore, 
      formData.status
    );
    if (!scoreValidation.isValid) {
      fieldErrors.scores = scoreValidation.error;
      canSubmit = false;
    }
  }

  // Optional field length validation
  if (formData.venue && formData.venue.length > 200) {
    fieldErrors.venue = 'Venue name cannot exceed 200 characters';
    canSubmit = false;
  }

  if (formData.referee && formData.referee.length > 100) {
    fieldErrors.referee = 'Referee name cannot exceed 100 characters';
    canSubmit = false;
  }

  if (formData.round && formData.round.length > 100) {
    fieldErrors.round = 'Round name cannot exceed 100 characters';
    canSubmit = false;
  }

  if (formData.notes && formData.notes.length > 1000) {
    fieldErrors.notes = 'Notes cannot exceed 1000 characters';
    canSubmit = false;
  }

  return {
    isValid: Object.keys(fieldErrors).length === 0,
    errors: fieldErrors,
    canSubmit
  };
}
