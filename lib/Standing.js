// models/Standing.js
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
  position: Number,
  played: { type: Number, default: 0 },
  won: { type: Number, default: 0 },
  drawn: { type: Number, default: 0 },
  lost: { type: Number, default: 0 },
  goalsFor: { type: Number, default: 0 },
  goalsAgainst: { type: Number, default: 0 },
  goalDifference: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  form: [String], // Last 5 matches: W, D, L
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Standing || mongoose.model('Standing', StandingSchema);