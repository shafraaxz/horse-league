// api/_lib/utils.js
import { ObjectId } from 'mongodb';

// Generate unique ID
export function generateId() {
  return new ObjectId();
}

// Sanitize input
export function sanitizeInput(input) {
  if (typeof input === 'string') {
    return input.trim().replace(/[<>]/g, '');
  }
  return input;
}

// Format response
export function formatResponse(data, message = 'Success', statusCode = 200) {
  return {
    status: statusCode,
    message,
    data,
    timestamp: new Date().toISOString()
  };
}

// Format error response
export function formatError(error, statusCode = 500) {
  return {
    status: statusCode,
    error: error.message || error,
    timestamp: new Date().toISOString()
  };
}

// Pagination helper
export function paginate(page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return { skip, limit: parseInt(limit) };
}

// Search helper
export function buildSearchQuery(searchTerm, fields = []) {
  if (!searchTerm) return {};

  const searchRegex = new RegExp(searchTerm, 'i');
  
  if (fields.length === 0) {
    return {};
  }

  if (fields.length === 1) {
    return { [fields[0]]: searchRegex };
  }

  return {
    $or: fields.map(field => ({
      [field]: searchRegex
    }))
  };
}

// Sort helper
export function buildSortQuery(sortBy, sortOrder = 'desc') {
  if (!sortBy) return { createdAt: -1 };
  
  return {
    [sortBy]: sortOrder === 'desc' ? -1 : 1
  };
}

// Filter helper
export function buildFilterQuery(filters = {}) {
  const query = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (key === 'season' || key === 'status' || key === 'position' || key === 'category') {
        query[key] = value;
      } else if (key === 'dateFrom') {
        query.date = { ...query.date, $gte: new Date(value) };
      } else if (key === 'dateTo') {
        query.date = { ...query.date, $lte: new Date(value) };
      } else if (key === 'minAge') {
        query.age = { ...query.age, $gte: parseInt(value) };
      } else if (key === 'maxAge') {
        query.age = { ...query.age, $lte: parseInt(value) };
      }
    }
  });

  return query;
}

// Season helper
export function getCurrentSeason() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  // Season typically starts in July/August
  if (currentMonth >= 7) {
    return `${currentYear}/${currentYear + 1}`;
  } else {
    return `${currentYear - 1}/${currentYear}`;
  }
}

// Validate ObjectId
export function isValidObjectId(id) {
  return ObjectId.isValid(id);
}

// Convert to ObjectId
export function toObjectId(id) {
  return new ObjectId(id);
}

// Statistics helpers
export function calculateTeamStats(matches) {
  const stats = {
    wins: 0,
    losses: 0,
    draws: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0
  };

  matches.forEach(match => {
    if (match.status === 'completed') {
      stats.goalsFor += match.homeScore || 0;
      stats.goalsAgainst += match.awayScore || 0;

      if (match.homeScore > match.awayScore) {
        stats.wins++;
        stats.points += 3;
      } else if (match.homeScore < match.awayScore) {
        stats.losses++;
      } else {
        stats.draws++;
        stats.points += 1;
      }
    }
  });

  return stats;
}

export function calculatePlayerStats(matches, playerId) {
  const stats = {
    goals: 0,
    assists: 0,
    matches: 0,
    yellowCards: 0,
    redCards: 0,
    saves: 0
  };

  matches.forEach(match => {
    if (match.status === 'completed') {
      const playerEvents = match.events?.filter(event => 
        event.playerId?.toString() === playerId.toString()
      ) || [];

      if (playerEvents.length > 0) {
        stats.matches++;
      }

      playerEvents.forEach(event => {
        switch (event.type) {
          case 'goal':
            stats.goals++;
            break;
          case 'assist':
            stats.assists++;
            break;
          case 'yellow-card':
            stats.yellowCards++;
            break;
          case 'red-card':
            stats.redCards++;
            break;
          case 'save':
            stats.saves++;
            break;
        }
      });
    }
  });

  return stats;
}

// Image upload helpers (for Cloudinary)
export function generateCloudinarySignature(params, apiSecret) {
  const crypto = require('crypto');
  
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  return crypto
    .createHash('sha1')
    .update(sortedParams + apiSecret)
    .digest('hex');
}

export function validateImageFile(file) {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.');
  }

  if (file.size > maxSize) {
    throw new Error('File size too large. Maximum size is 10MB.');
  }

  return true;
}

// Date helpers
export function formatDate(date, format = 'YYYY-MM-DD') {
  const d = new Date(date);
  
  if (format === 'YYYY-MM-DD') {
    return d.toISOString().split('T')[0];
  }
  
  if (format === 'DD/MM/YYYY') {
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  }

  return d.toISOString();
}

export function isDateInRange(date, startDate, endDate) {
  const d = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return d >= start && d <= end;
}

// Match time helpers
export function formatMatchTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function calculateMatchDuration(startTime, endTime, pausedTime = 0) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const durationMs = end - start - (pausedTime * 1000);
  return Math.floor(durationMs / 1000);
}