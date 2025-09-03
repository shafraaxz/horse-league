// ===========================================
// FILE: models/Match.js (ENHANCED WITH BETTER DATE HANDLING)
// ===========================================
import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  type: { 
    type: String, 
    enum: ['goal', 'yellow_card', 'red_card', 'substitution', 'other'],
    required: true 
  },
  team: { 
    type: String, 
    enum: ['home', 'away'],
    required: true 
  },
  minute: { type: Number, required: true },
  player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
  description: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const liveDataSchema = new mongoose.Schema({
  currentMinute: { type: Number, default: 0, min: 0, max: 120 },
  isLive: { type: Boolean, default: false },
  startedAt: { type: Date, default: null },
  pausedAt: { type: Date, default: null },
  resumedAt: { type: Date, default: null },
  endedAt: { type: Date, default: null },
  lastUpdate: { type: Date, default: Date.now }
}, { _id: false });

const matchSchema = new mongoose.Schema({
  homeTeam: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Team', 
    required: true 
  },
  awayTeam: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Team', 
    required: true 
  },
  matchDate: { 
    type: Date, 
    required: true,
    validate: {
      validator: function(value) {
        return value instanceof Date && !isNaN(value.getTime());
      },
      message: 'Match date must be a valid date'
    }
  },
  season: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Season', 
    required: true 
  },
  venue: { 
    type: String, 
    default: '',
    trim: true,
    maxlength: [200, 'Venue name cannot exceed 200 characters']
  },
  round: { 
    type: String, 
    default: 'Regular Season',
    trim: true,
    maxlength: [100, 'Round name cannot exceed 100 characters']
  },
  referee: { 
    type: String, 
    default: '',
    trim: true,
    maxlength: [100, 'Referee name cannot exceed 100 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['scheduled', 'live', 'completed', 'postponed', 'cancelled'],
      message: 'Status must be one of: scheduled, live, completed, postponed, cancelled'
    },
    default: 'scheduled'
  },
  homeScore: { 
    type: Number, 
    default: 0,
    min: [0, 'Score cannot be negative'],
    max: [50, 'Score cannot exceed 50'], // Reasonable limit
    validate: {
      validator: function(value) {
        return Number.isInteger(value);
      },
      message: 'Score must be an integer'
    }
  },
  awayScore: { 
    type: Number, 
    default: 0,
    min: [0, 'Score cannot be negative'],
    max: [50, 'Score cannot exceed 50'], // Reasonable limit
    validate: {
      validator: function(value) {
        return Number.isInteger(value);
      },
      message: 'Score must be an integer'
    }
  },
  // Events stored at match level (not inside liveData)
  events: [eventSchema],
  
  // Live match data
  liveData: {
    type: liveDataSchema,
    default: () => ({
      currentMinute: 0,
      isLive: false,
      lastUpdate: new Date()
    })
  },
  
  // Track if team stats have been updated for this match
  statsUpdated: {
    type: Boolean,
    default: false
  },
  
  notes: { 
    type: String, 
    default: '',
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },

  // Additional metadata for better tracking
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
matchSchema.index({ season: 1, matchDate: 1 });
matchSchema.index({ status: 1 });
matchSchema.index({ 'liveData.isLive': 1 });
matchSchema.index({ homeTeam: 1, awayTeam: 1 });
matchSchema.index({ matchDate: 1 }); // For date-based queries
matchSchema.index({ homeTeam: 1, matchDate: 1 }); // Team schedule queries
matchSchema.index({ awayTeam: 1, matchDate: 1 }); // Team schedule queries

// Compound index to prevent duplicate matches
matchSchema.index({ 
  homeTeam: 1, 
  awayTeam: 1, 
  matchDate: 1, 
  season: 1 
}, { 
  unique: true,
  name: 'unique_match_constraint'
});

// Validation to prevent team playing against itself
matchSchema.pre('save', function(next) {
  if (this.homeTeam && this.awayTeam && this.homeTeam.equals(this.awayTeam)) {
    next(new Error('A team cannot play against itself'));
  } else {
    next();
  }
});

// Validation for scores based on status
matchSchema.pre('save', function(next) {
  if (this.status === 'scheduled' || this.status === 'postponed' || this.status === 'cancelled') {
    // Reset scores for non-active matches
    if (this.homeScore > 0 || this.awayScore > 0) {
      this.homeScore = 0;
      this.awayScore = 0;
    }
  }
  next();
});

// Update lastUpdate when liveData changes
matchSchema.pre('save', function(next) {
  if (this.isModified('liveData') && this.liveData) {
    this.liveData.lastUpdate = new Date();
  }
  next();
});

// Validation for match date (cannot be too far in the past for live matches)
matchSchema.pre('save', function(next) {
  if (this.status === 'live' && this.matchDate) {
    const now = new Date();
    const matchDate = new Date(this.matchDate);
    const hoursDifference = Math.abs(now - matchDate) / (1000 * 60 * 60);
    
    // Allow live matches only if within 24 hours of scheduled time
    if (hoursDifference > 24) {
      next(new Error('Cannot set match as live if more than 24 hours from scheduled time'));
    }
  }
  next();
});

// Virtual for match display name
matchSchema.virtual('displayName').get(function() {
  return `${this.homeTeam?.name || 'TBD'} vs ${this.awayTeam?.name || 'TBD'}`;
});

// Virtual to check if match is in the future
matchSchema.virtual('isFuture').get(function() {
  return this.matchDate && new Date(this.matchDate) > new Date();
});

// Virtual to check if match is today
matchSchema.virtual('isToday').get(function() {
  if (!this.matchDate) return false;
  const today = new Date();
  const matchDate = new Date(this.matchDate);
  return today.toDateString() === matchDate.toDateString();
});

// Virtual for formatted date (useful for templates)
matchSchema.virtual('formattedDate').get(function() {
  if (!this.matchDate) return '';
  return this.matchDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Method to check if teams can play (not conflicting with other matches)
matchSchema.methods.checkTeamAvailability = async function() {
  const Match = this.constructor;
  const twoHoursBefore = new Date(this.matchDate.getTime() - 2 * 60 * 60 * 1000);
  const twoHoursAfter = new Date(this.matchDate.getTime() + 2 * 60 * 60 * 1000);

  const conflictingMatch = await Match.findOne({
    _id: { $ne: this._id }, // Exclude current match
    $or: [
      { homeTeam: this.homeTeam },
      { awayTeam: this.homeTeam },
      { homeTeam: this.awayTeam },
      { awayTeam: this.awayTeam }
    ],
    matchDate: {
      $gte: twoHoursBefore,
      $lte: twoHoursAfter
    },
    status: { $ne: 'cancelled' }
  });

  return !conflictingMatch;
};

// Method to get match duration (for completed matches)
matchSchema.methods.getMatchDuration = function() {
  if (!this.liveData || !this.liveData.startedAt || !this.liveData.endedAt) {
    return null;
  }
  
  const duration = this.liveData.endedAt - this.liveData.startedAt;
  const minutes = Math.floor(duration / (1000 * 60));
  return minutes;
};

// Static method to find matches by date range
matchSchema.statics.findByDateRange = function(startDate, endDate, options = {}) {
  const query = {
    matchDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };

  if (options.season) {
    query.season = options.season;
  }

  if (options.status) {
    query.status = options.status;
  }

  return this.find(query)
    .populate('homeTeam', 'name logo')
    .populate('awayTeam', 'name logo')
    .populate('season', 'name isActive')
    .sort({ matchDate: 1 });
};

// Static method to find live matches
matchSchema.statics.findLive = function() {
  return this.find({ status: 'live' })
    .populate('homeTeam', 'name logo')
    .populate('awayTeam', 'name logo')
    .sort({ matchDate: 1 });
};

export default mongoose.models.Match || mongoose.model('Match', matchSchema);
