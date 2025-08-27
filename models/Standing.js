// models/Standing.js
// =====================================================

import mongoose from 'mongoose';

const StandingSchema = new mongoose.Schema({
  league: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'League',
    required: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  position: {
    type: Number,
    required: true,
    min: 1
  },
  played: {
    type: Number,
    default: 0,
    min: 0
  },
  won: {
    type: Number,
    default: 0,
    min: 0
  },
  drawn: {
    type: Number,
    default: 0,
    min: 0
  },
  lost: {
    type: Number,
    default: 0,
    min: 0
  },
  goalsFor: {
    type: Number,
    default: 0,
    min: 0
  },
  goalsAgainst: {
    type: Number,
    default: 0,
    min: 0
  },
  goalDifference: {
    type: Number,
    default: 0
  },
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  form: {
    type: [String], // Last 5 matches: ['W', 'D', 'L', 'W', 'W']
    default: []
  },
  homeRecord: {
    played: { type: Number, default: 0 },
    won: { type: Number, default: 0 },
    drawn: { type: Number, default: 0 },
    lost: { type: Number, default: 0 },
    goalsFor: { type: Number, default: 0 },
    goalsAgainst: { type: Number, default: 0 }
  },
  awayRecord: {
    played: { type: Number, default: 0 },
    won: { type: Number, default: 0 },
    drawn: { type: Number, default: 0 },
    lost: { type: Number, default: 0 },
    goalsFor: { type: Number, default: 0 },
    goalsAgainst: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Compound index for unique team per league
StandingSchema.index({ league: 1, team: 1 }, { unique: true });

// Update goal difference before saving
StandingSchema.pre('save', function(next) {
  this.goalDifference = this.goalsFor - this.goalsAgainst;
  next();
});

// Check if model exists before creating
const Standing = mongoose.models.Standing || mongoose.model('Standing', StandingSchema);

export default Standing;