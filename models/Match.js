// models/Match.js - Match Schema
import mongoose from 'mongoose';

const MatchSchema = new mongoose.Schema({
  // Teams
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
  
  // League Association
  league: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'League',
    required: true
  },
  
  // Match Details
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  venue: {
    type: String,
    trim: true
  },
  
  // Match Status
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'postponed', 'cancelled'],
    default: 'scheduled'
  },
  
  // Scores
  homeScore: {
    type: Number,
    default: 0,
    min: 0
  },
  awayScore: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Match Events
  events: [{
    type: {
      type: String,
      enum: ['goal', 'yellow_card', 'red_card', 'substitution', 'penalty', 'own_goal']
    },
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    minute: Number,
    description: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Match Officials
  referee: {
    type: String,
    trim: true
  },
  assistantReferees: [String],
  
  // Match Statistics
  statistics: {
    homeTeamStats: {
      possession: { type: Number, min: 0, max: 100 },
      shots: { type: Number, default: 0 },
      shotsOnTarget: { type: Number, default: 0 },
      corners: { type: Number, default: 0 },
      fouls: { type: Number, default: 0 },
      yellowCards: { type: Number, default: 0 },
      redCards: { type: Number, default: 0 }
    },
    awayTeamStats: {
      possession: { type: Number, min: 0, max: 100 },
      shots: { type: Number, default: 0 },
      shotsOnTarget: { type: Number, default: 0 },
      corners: { type: Number, default: 0 },
      fouls: { type: Number, default: 0 },
      yellowCards: { type: Number, default: 0 },
      redCards: { type: Number, default: 0 }
    }
  },
  
  // Additional Info
  attendance: {
    type: Number,
    min: 0
  },
  weather: {
    temperature: Number,
    condition: String,
    humidity: Number
  },
  notes: {
    type: String,
    trim: true
  },
  
  // Round/Week information
  round: {
    type: Number,
    min: 1
  },
  matchweek: {
    type: Number,
    min: 1
  }
}, {
  timestamps: true
});

// Indexes for better performance
MatchSchema.index({ league: 1, date: 1 });
MatchSchema.index({ homeTeam: 1, awayTeam: 1, date: 1 });
MatchSchema.index({ status: 1, date: 1 });

// Virtual for total goals
MatchSchema.virtual('totalGoals').get(function() {
  return (this.homeScore || 0) + (this.awayScore || 0);
});

// Virtual for match result from home team perspective
MatchSchema.virtual('result').get(function() {
  if (this.status !== 'completed') return null;
  if (this.homeScore > this.awayScore) return 'home_win';
  if (this.homeScore < this.awayScore) return 'away_win';
  return 'draw';
});

// Static method to find matches by team
MatchSchema.statics.findByTeam = function(teamId) {
  return this.find({
    $or: [
      { homeTeam: teamId },
      { awayTeam: teamId }
    ]
  }).populate('homeTeam awayTeam', 'name shortName logo')
    .populate('league', 'name')
    .sort({ date: -1 });
};

// Static method to find matches by league
MatchSchema.statics.findByLeague = function(leagueId) {
  return this.find({ league: leagueId })
    .populate('homeTeam awayTeam', 'name shortName logo')
    .populate('league', 'name')
    .sort({ date: -1 });
};

// Instance method to add match event
MatchSchema.methods.addEvent = function(eventData) {
  this.events.push({
    ...eventData,
    timestamp: new Date()
  });
  return this.save();
};

// Pre-save validation
MatchSchema.pre('save', function(next) {
  // Teams cannot play against themselves
  if (this.homeTeam.toString() === this.awayTeam.toString()) {
    const err = new Error('A team cannot play against itself');
    return next(err);
  }
  
  // Match date cannot be in the far past
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  if (this.date < oneYearAgo) {
    const err = new Error('Match date cannot be more than one year in the past');
    return next(err);
  }
  
  next();
});

// Ensure virtual fields are serialised
MatchSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

const Match = mongoose.models.Match || mongoose.model('Match', MatchSchema);

// models/Transfer.js - Transfer Schema
const TransferSchema = new mongoose.Schema({
  // Player and Teams
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  fromTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  toTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  
  // League Association
  league: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'League',
    required: true
  },
  
  // Transfer Details
  transferDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  transferType: {
    type: String,
    enum: ['permanent', 'loan', 'free_transfer', 'release', 'new_signing'],
    required: true,
    default: 'permanent'
  },
  transferFee: {
    type: Number,
    min: 0,
    default: 0
  },
  contractLength: {
    type: Number, // in months
    min: 1,
    max: 60
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'rejected'],
    default: 'completed'
  },
  
  // Additional Information
  reason: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  
  // Administrative
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better performance
TransferSchema.index({ league: 1, transferDate: -1 });
TransferSchema.index({ player: 1, transferDate: -1 });
TransferSchema.index({ fromTeam: 1, toTeam: 1 });

// Virtual for transfer direction
TransferSchema.virtual('direction').get(function() {
  if (!this.fromTeam) return 'signing';
  if (!this.toTeam) return 'release';
  return 'transfer';
});

// Static method to find transfers by league
TransferSchema.statics.findByLeague = function(leagueId) {
  return this.find({ league: leagueId })
    .populate('player', 'name position photo')
    .populate('fromTeam toTeam', 'name shortName logo')
    .populate('league', 'name')
    .sort({ transferDate: -1 });
};

// Static method to find transfers by team
TransferSchema.statics.findByTeam = function(teamId) {
  return this.find({
    $or: [
      { fromTeam: teamId },
      { toTeam: teamId }
    ]
  }).populate('player', 'name position photo')
    .populate('fromTeam toTeam', 'name shortName logo')
    .populate('league', 'name')
    .sort({ transferDate: -1 });
};

// Static method to get recent transfers
TransferSchema.statics.getRecentTransfers = function(leagueId, days = 7) {
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);
  
  return this.find({
    league: leagueId,
    transferDate: { $gte: dateFrom },
    status: 'completed'
  }).populate('player', 'name position photo')
    .populate('fromTeam toTeam', 'name shortName logo')
    .sort({ transferDate: -1 });
};

// Ensure virtual fields are serialised
TransferSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

const Transfer = mongoose.models.Transfer || mongoose.model('Transfer', TransferSchema);

export { Match, Transfer };
export default Match;