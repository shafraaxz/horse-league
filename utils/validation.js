// utils/validation.js - Comprehensive validation schemas
import Joi from 'joi';

// Custom validators
const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/).message('Invalid ID format');

// Login validation
export const validateLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters',
        'any.required': 'Password is required'
      })
  });
  
  return schema.validate(data);
};

// League validation
export const validateLeague = (data, isUpdate = false) => {
  const schema = Joi.object({
    name: isUpdate 
      ? Joi.string().min(3).max(100).optional()
      : Joi.string().min(3).max(100).required(),
    type: Joi.string()
      .valid('league', 'cup')
      .optional(),
    sport: Joi.string()
      .valid('football', 'futsal')
      .optional(),
    status: Joi.string()
      .valid('upcoming', 'active', 'completed')
      .optional(),
    startDate: isUpdate
      ? Joi.date().iso().optional()
      : Joi.date().iso().required(),
    endDate: isUpdate
      ? Joi.date().iso().greater(Joi.ref('startDate')).optional()
      : Joi.date().iso().greater(Joi.ref('startDate')).required(),
    description: Joi.string()
      .max(500)
      .optional()
      .allow(''),
    logo: Joi.string()
      .uri()
      .optional()
      .allow(''),
    pointsForWin: Joi.number()
      .min(0)
      .max(10)
      .optional(),
    pointsForDraw: Joi.number()
      .min(0)
      .max(10)
      .optional(),
    pointsForLoss: Joi.number()
      .min(0)
      .max(10)
      .optional(),
    teams: Joi.array()
      .items(objectId)
      .optional()
  }).messages({
    'date.greater': 'End date must be after start date',
    'string.min': '{#label} must be at least {#limit} characters',
    'string.max': '{#label} must not exceed {#limit} characters',
    'any.required': '{#label} is required'
  });
  
  return schema.validate(data, { abortEarly: false });
};

// Team validation
export const validateTeam = (data, isUpdate = false) => {
  const schema = Joi.object({
    name: isUpdate
      ? Joi.string().min(2).max(100).optional()
      : Joi.string().min(2).max(100).required(),
    shortName: Joi.string()
      .max(3)
      .uppercase()
      .optional()
      .allow(''),
    logo: Joi.string()
      .uri()
      .optional()
      .allow(''),
    primaryColor: Joi.string()
      .pattern(/^#[0-9A-F]{6}$/i)
      .optional()
      .messages({
        'string.pattern.base': 'Primary color must be a valid hex color'
      }),
    secondaryColor: Joi.string()
      .pattern(/^#[0-9A-F]{6}$/i)
      .optional()
      .messages({
        'string.pattern.base': 'Secondary color must be a valid hex color'
      }),
    homeGround: Joi.string()
      .max(100)
      .optional()
      .allow(''),
    founded: Joi.number()
      .min(1800)
      .max(new Date().getFullYear())
      .optional()
      .messages({
        'number.min': 'Founded year cannot be before 1800',
        'number.max': 'Founded year cannot be in the future'
      }),
    coach: Joi.string()
      .max(100)
      .optional()
      .allow(''),
    leagues: Joi.array()
      .items(objectId)
      .optional()
  });
  
  return schema.validate(data, { abortEarly: false });
};

// Player validation
export const validatePlayer = (data, isUpdate = false) => {
  const schema = Joi.object({
    name: isUpdate
      ? Joi.string().min(2).max(100).optional()
      : Joi.string().min(2).max(100).required(),
    jerseyNumber: isUpdate
      ? Joi.number().min(1).max(99).optional()
      : Joi.number().min(1).max(99).required(),
    position: Joi.string()
      .valid('Goalkeeper', 'Defender', 'Midfielder', 'Forward')
      .optional(),
    dateOfBirth: Joi.date()
      .max('now')
      .optional()
      .messages({
        'date.max': 'Date of birth cannot be in the future'
      }),
    nationality: Joi.string()
      .max(50)
      .optional()
      .allow(''),
    height: Joi.number()
      .min(100)
      .max(250)
      .optional()
      .messages({
        'number.min': 'Height must be between 100-250 cm',
        'number.max': 'Height must be between 100-250 cm'
      }),
    weight: Joi.number()
      .min(40)
      .max(150)
      .optional()
      .messages({
        'number.min': 'Weight must be between 40-150 kg',
        'number.max': 'Weight must be between 40-150 kg'
      }),
    preferredFoot: Joi.string()
      .valid('Left', 'Right', 'Both')
      .optional(),
    team: isUpdate
      ? Joi.optional()
      : objectId.required(),
    photo: Joi.string()
      .uri()
      .optional()
      .allow(''),
    isActive: Joi.boolean()
      .optional()
  });
  
  return schema.validate(data, { abortEarly: false });
};

// Match validation
export const validateMatch = (data, isUpdate = false) => {
  const schema = Joi.object({
    league: isUpdate
      ? Joi.optional()
      : objectId.required(),
    round: Joi.number()
      .min(1)
      .optional(),
    homeTeam: isUpdate
      ? Joi.optional()
      : objectId.required(),
    awayTeam: isUpdate
      ? Joi.optional()
      : objectId.required()
      .invalid(Joi.ref('homeTeam'))
      .messages({
        'any.invalid': 'Home and away teams cannot be the same'
      }),
    matchDate: isUpdate
      ? Joi.date().iso().optional()
      : Joi.date().iso().required(),
    venue: Joi.string()
      .max(100)
      .optional()
      .allow(''),
    referee: Joi.string()
      .max(100)
      .optional()
      .allow(''),
    status: Joi.string()
      .valid('scheduled', 'live', 'completed', 'postponed', 'cancelled')
      .optional()
  });
  
  return schema.validate(data, { abortEarly: false });
};

// Match event validation
export const validateMatchEvent = (data) => {
  const schema = Joi.object({
    action: Joi.string()
      .valid('start', 'goal', 'event', 'updateMinute', 'end')
      .required(),
    data: Joi.when('action', {
      is: 'goal',
      then: Joi.object({
        type: Joi.string().valid('goal', 'own_goal', 'penalty').required(),
        minute: Joi.number().min(0).max(120).required(),
        team: objectId.required(),
        player: objectId.optional()
      }),
      is: 'event',
      then: Joi.object({
        type: Joi.string()
          .valid('yellow_card', 'red_card', 'substitution')
          .required(),
        minute: Joi.number().min(0).max(120).required(),
        team: objectId.required(),
        player: objectId.optional()
      }),
      is: 'updateMinute',
      then: Joi.object({
        minute: Joi.number().min(0).max(120).required()
      }),
      otherwise: Joi.optional()
    })
  });
  
  return schema.validate(data);
};

// Admin validation
export const validateAdmin = (data, isUpdate = false) => {
  const schema = Joi.object({
    name: isUpdate
      ? Joi.string().min(2).max(100).optional()
      : Joi.string().min(2).max(100).required(),
    email: isUpdate
      ? Joi.string().email().optional()
      : Joi.string().email().required(),
    password: isUpdate
      ? Joi.string().min(8).optional()
      : Joi.string()
          .min(8)
          .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
          .required()
          .messages({
            'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
            'string.min': 'Password must be at least 8 characters'
          }),
    role: Joi.string()
      .valid('super_admin', 'league_admin', 'team_manager', 'viewer')
      .optional(),
    assignedLeagues: Joi.array()
      .items(objectId)
      .optional(),
    assignedTeams: Joi.array()
      .items(objectId)
      .optional(),
    permissions: Joi.object({
      canCreateLeague: Joi.boolean(),
      canEditLeague: Joi.boolean(),
      canDeleteLeague: Joi.boolean(),
      canManageTeams: Joi.boolean(),
      canManageMatches: Joi.boolean(),
      canManagePlayers: Joi.boolean(),
      canViewReports: Joi.boolean()
    }).optional(),
    isActive: Joi.boolean()
      .optional()
  });
  
  return schema.validate(data, { abortEarly: false });
};

// Search/Filter validation
export const validateSearchParams = (data) => {
  const schema = Joi.object({
    q: Joi.string()
      .max(100)
      .optional()
      .messages({
        'string.max': 'Search query too long'
      }),
    page: Joi.number()
      .min(1)
      .optional(),
    limit: Joi.number()
      .min(1)
      .max(100)
      .optional(),
    sort: Joi.string()
      .valid('name', 'createdAt', 'updatedAt', '-name', '-createdAt', '-updatedAt')
      .optional(),
    status: Joi.string()
      .optional(),
    leagueId: objectId.optional(),
    teamId: objectId.optional()
  });
  
  return schema.validate(data);
};

// Sanitize input to prevent XSS
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove script tags and dangerous HTML
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

// Validate and sanitize object
export const validateAndSanitize = (data, validator) => {
  // First validate
  const validation = validator(data);
  
  if (validation.error) {
    return validation;
  }
  
  // Then sanitize string fields
  const sanitized = {};
  for (const [key, value] of Object.entries(validation.value)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeInput(item) : item
      );
    } else {
      sanitized[key] = value;
    }
  }
  
  return { value: sanitized, error: null };
};

// Batch validation for multiple items
export const validateBatch = (items, validator) => {
  const errors = [];
  const validated = [];
  
  items.forEach((item, index) => {
    const validation = validator(item);
    if (validation.error) {
      errors.push({
        index,
        errors: validation.error.details
      });
    } else {
      validated.push(validation.value);
    }
  });
  
  return {
    valid: errors.length === 0,
    validated,
    errors
  };
};

// Install Joi package
// npm install joi