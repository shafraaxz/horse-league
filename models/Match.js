// ===========================================
// FILE: models/Match.js (UPDATED WITH LIVE DATA)
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
  description: { type: String, required: true }
}, { _id: false });

const liveDataSchema = new mongoose.Schema({
  currentMinute: { type: Number, default: 0 },
  events: [eventSchema],
  isLive: { type: Boolean, default: false },
  startedAt: { type: Date },
  pausedAt: { type: Date },
  endedAt: { type: Date }
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
    default: 0 
  },
  awayScore: { 
    type: Number, 
    default: 0 
  },
  liveData: {
    type: liveDataSchema,
    default: () => ({})
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
matchSchema.index({ homeTeam: 1, awayTeam: 1 });

// Virtual for match display name
matchSchema.virtual('displayName').get(function() {
  return `${this.homeTeam?.name || 'TBD'} vs ${this.awayTeam?.name || 'TBD'}`;
});

export default mongoose.models.Match || mongoose.model('Match', matchSchema);