// ===========================================
// FILE: models/Match.js (FIXED - Unified Structure)
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
    required: true 
  },
  season: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Season', 
    required: true 
  },
  venue: { 
    type: String, 
    default: '' 
  },
  round: { 
    type: String, 
    default: 'Regular Season' 
  },
  referee: { 
    type: String, 
    default: '' 
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'postponed', 'cancelled'],
    default: 'scheduled'
  },
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
    default: '' 
  }
}, {
  timestamps: true
});

// Indexes for better query performance
matchSchema.index({ season: 1, matchDate: 1 });
matchSchema.index({ status: 1 });
matchSchema.index({ 'liveData.isLive': 1 });
matchSchema.index({ homeTeam: 1, awayTeam: 1 });

// Validation to prevent team playing against itself
matchSchema.pre('save', function(next) {
  if (this.homeTeam && this.awayTeam && this.homeTeam.equals(this.awayTeam)) {
    next(new Error('A team cannot play against itself'));
  } else {
    next();
  }
});

// Update lastUpdate when liveData changes
matchSchema.pre('save', function(next) {
  if (this.isModified('liveData') && this.liveData) {
    this.liveData.lastUpdate = new Date();
  }
  next();
});

// Virtual for match display name
matchSchema.virtual('displayName').get(function() {
  return `${this.homeTeam?.name || 'TBD'} vs ${this.awayTeam?.name || 'TBD'}`;
});

export default mongoose.models.Match || mongoose.model('Match', matchSchema);