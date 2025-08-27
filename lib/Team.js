// models/Team.js
import mongoose from 'mongoose';

const TeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  shortName: {
    type: String,
    maxLength: 3
  },
  logo: String,
  primaryColor: String,
  secondaryColor: String,
  homeGround: String,
  founded: Number,
  coach: String,
  captain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  },
  leagues: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'League'
  }],
  players: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  }],
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
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Team || mongoose.model('Team', TeamSchema);
