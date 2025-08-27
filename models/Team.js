// models/Team.js - Team Schema
import mongoose from 'mongoose';

const TeamSchema = new mongoose.Schema({
  // Store a normalized lowercase name for uniqueness checks
  nameLower: {
    type: String,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  shortName: {
    type: String,
    trim: true,
    maxlength: 5
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // League Association
  league: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'League',
    required: true
  },
  
  // Team Details
  foundedYear: {
    type: Number,
    min: 1800,
    max: new Date().getFullYear()
  },
  homeVenue: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true
  },
  
  // Visual Identity
  primaryColor: {
    type: String,
    default: '#3b82f6',
    validate: {
      validator: function(v) {
        return /^#[0-9A-F]{6}$/i.test(v);
      },
      message: 'Primary color must be a valid hex color'
    }
  },
  secondaryColor: {
    type: String,
    default: '#1e40af',
    validate: {
      validator: function(v) {
        return /^#[0-9A-F]{6}$/i.test(v);
      },
      message: 'Secondary color must be a valid hex color'
    }
  },
  logo: {
    type: String,
    trim: true
  },
  
  // Contact Information
  website: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Website must be a valid URL'
    }
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  
  // Team Management
  manager: {
    type: String,
    trim: true
  },
  captain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  },
  
  // Team Statistics
  statistics: {
    matchesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    goalsFor: { type: Number, default: 0 },
    goalsAgainst: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    cleanSheets: { type: Number, default: 0 }
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'disbanded'],
    default: 'active'
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
TeamSchema.index({ league: 1, name: 1 });
TeamSchema.index({ league: 1, status: 1 });
TeamSchema.index({ name: 'text', description: 'text' });

// Virtual for goal difference
TeamSchema.virtual('goalDifference').get(function() {
  return (this.statistics?.goalsFor || 0) - (this.statistics?.goalsAgainst || 0);
});

// Virtual for player count
TeamSchema.virtual('playerCount', {
  ref: 'Player',
  localField: '_id',
  foreignField: 'team',
  count: true
});

// Virtual for win percentage
TeamSchema.virtual('winPercentage').get(function() {
  const matchesPlayed = this.statistics?.matchesPlayed || 0;
  if (matchesPlayed === 0) return 0;
  return Math.round(((this.statistics?.wins || 0) / matchesPlayed) * 100);
});

// Instance method to get team players
TeamSchema.methods.getPlayers = function() {
  return mongoose.model('Player').find({
    $or: [
      { team: this._id },
      { currentTeam: this._id }
    ],
    isActive: true
  });
};

// Instance method to get team matches
TeamSchema.methods.getMatches = function() {
  return mongoose.model('Match').find({
    $or: [
      { homeTeam: this._id },
      { awayTeam: this._id }
    ]
  }).sort({ date: -1 });
};

// Static method to find teams by league
TeamSchema.statics.findByLeague = function(leagueId) {
  return this.find({ 
    league: leagueId, 
    isActive: true 
  }).populate('captain', 'name position')
    .populate('league', 'name');
};

// Static method to get league standings
TeamSchema.statics.getStandings = function(leagueId) {
  return this.find({ 
    league: leagueId, 
    isActive: true 
  })
  .sort({ 
    'statistics.points': -1, 
    goalDifference: -1, 
    'statistics.goalsFor': -1 
  })
  .populate('captain', 'name position')
  .populate('league', 'name');
};

// Pre-save middleware to update points
TeamSchema.pre('save', function(next) {
  if (this.isModified('statistics')) {
    const stats = this.statistics;
    this.statistics.points = (stats.wins * 3) + (stats.draws * 1);
  }
  next();
});

// Ensure virtual fields are serialised
TeamSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

export default mongoose.models.Team || mongoose.model('Team', TeamSchema);

/**
 * Normalize name to lowercase into nameLower for unique index
 */
TeamSchema.pre('validate', function(next) {
  if (this.name) {
    this.nameLower = this.name.toLowerCase().trim();
  }
  next();
});
