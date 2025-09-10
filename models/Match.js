// ===========================================
// FILE: models/Match.js (ENHANCED WITH OWN GOALS & OFFICIAL CARDS)
// ===========================================
import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  type: { 
    type: String, 
    enum: ['goal', 'own_goal', 'yellow_card', 'red_card', 'substitution', 'assist', 'other'],
    required: true 
  },
  team: { 
    type: String, 
    enum: ['home', 'away'],
    required: true 
  },
  minute: { type: Number, required: true, min: 0, max: 120 },
  
  // Enhanced player/official handling
  player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
  playerName: { type: String }, // For officials or custom names
  isOfficial: { type: Boolean, default: false }, // Flag for non-player events
  
  // Enhanced fields for different event types
  assistedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
  description: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  
  // Own goal specific fields
  isOwnGoal: { type: Boolean, default: false },
  beneficiaryTeam: { 
    type: String, 
    enum: ['home', 'away']
  },
  
  // Substitution specific fields
  playerOut: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
  playerIn: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' }
}, { _id: false });

const matchStatsSchema = new mongoose.Schema({
  // Traditional stats
  homeScore: { type: Number, default: 0, min: 0 },
  awayScore: { type: Number, default: 0, min: 0 },
  
  // ENHANCED: Detailed goal breakdown
  homeGoals: {
    regular: { type: Number, default: 0 }, // Goals scored by home team players
    ownGoals: { type: Number, default: 0 }, // Own goals by away team benefiting home
    total: { type: Number, default: 0 } // Sum of regular + ownGoals
  },
  awayGoals: {
    regular: { type: Number, default: 0 }, // Goals scored by away team players  
    ownGoals: { type: Number, default: 0 }, // Own goals by home team benefiting away
    total: { type: Number, default: 0 } // Sum of regular + ownGoals
  },
  
  // Additional match statistics
  totalGoals: { type: Number, default: 0 },
  yellowCards: { home: { type: Number, default: 0 }, away: { type: Number, default: 0 } },
  redCards: { home: { type: Number, default: 0 }, away: { type: Number, default: 0 } }
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
    enum: ['scheduled', 'live', 'completed', 'postponed', 'cancelled'],
    default: 'scheduled'
  },
  
  // ENHANCED: Use detailed match stats instead of simple scores
  stats: {
    type: matchStatsSchema,
    default: () => ({
      homeScore: 0,
      awayScore: 0,
      homeGoals: { regular: 0, ownGoals: 0, total: 0 },
      awayGoals: { regular: 0, ownGoals: 0, total: 0 },
      totalGoals: 0,
      yellowCards: { home: 0, away: 0 },
      redCards: { home: 0, away: 0 }
    })
  },
  
  // DEPRECATED: Keep for backward compatibility
  homeScore: { type: Number, default: 0 },
  awayScore: { type: Number, default: 0 },
  
  events: [eventSchema],
  liveData: {
    type: liveDataSchema,
    default: () => ({
      currentMinute: 0,
      isLive: false,
      lastUpdate: new Date()
    })
  },
  
  statsUpdated: { type: Boolean, default: false },
  notes: { type: String, default: '', trim: true }
}, {
  timestamps: true
});

// Indexes for efficient queries
matchSchema.index({ 
  homeTeam: 1, 
  awayTeam: 1, 
  matchDate: 1,
  season: 1 
}, { 
  unique: true,
  name: 'unique_match_constraint'
});

// Pre-save middleware to calculate stats from events
matchSchema.pre('save', function(next) {
  if (this.events && this.events.length > 0) {
    this.calculateMatchStats();
  }
  next();
});

// Method to calculate match statistics from events
matchSchema.methods.calculateMatchStats = function() {
  const stats = {
    homeGoals: { regular: 0, ownGoals: 0, total: 0 },
    awayGoals: { regular: 0, ownGoals: 0, total: 0 },
    yellowCards: { home: 0, away: 0 },
    redCards: { home: 0, away: 0 }
  };

  this.events.forEach(event => {
    switch (event.type) {
      case 'goal':
        if (event.team === 'home') {
          stats.homeGoals.regular++;
        } else {
          stats.awayGoals.regular++;
        }
        break;
        
      case 'own_goal':
        // Own goal benefits the opposing team
        if (event.team === 'home') {
          // Home player scored own goal, benefits away team
          stats.awayGoals.ownGoals++;
        } else {
          // Away player scored own goal, benefits home team
          stats.homeGoals.ownGoals++;
        }
        break;
        
      case 'yellow_card':
        if (event.team === 'home') {
          stats.yellowCards.home++;
        } else {
          stats.yellowCards.away++;
        }
        break;
        
      case 'red_card':
        if (event.team === 'home') {
          stats.redCards.home++;
        } else {
          stats.redCards.away++;
        }
        break;
    }
  });

  // Calculate totals
  stats.homeGoals.total = stats.homeGoals.regular + stats.homeGoals.ownGoals;
  stats.awayGoals.total = stats.awayGoals.regular + stats.awayGoals.ownGoals;
  stats.totalGoals = stats.homeGoals.total + stats.awayGoals.total;

  // Update both new and legacy fields
  this.stats = {
    homeScore: stats.homeGoals.total,
    awayScore: stats.awayGoals.total,
    homeGoals: stats.homeGoals,
    awayGoals: stats.awayGoals,
    totalGoals: stats.totalGoals,
    yellowCards: stats.yellowCards,
    redCards: stats.redCards
  };
  
  // Legacy compatibility
  this.homeScore = stats.homeGoals.total;
  this.awayScore = stats.awayGoals.total;
};

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

export default mongoose.models.Match || mongoose.model('Match', matchSchema);
