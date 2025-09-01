import mongoose from 'mongoose';

const MatchEventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['goal', 'yellow_card', 'red_card', 'substitution'],
    required: true,
  },
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true,
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
  },
  minute: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    default: '',
  }
});

const MatchSchema = new mongoose.Schema({
  homeTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
  },
  awayTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
  },
  season: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Season',
    required: true,
  },
  matchDate: {
    type: Date,
    required: true,
  },
  venue: {
    type: String,
    default: '',
  },
  round: {
    type: String,
    default: 'Regular Season',
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'postponed', 'cancelled'],
    default: 'scheduled',
  },
  homeScore: {
    type: Number,
    default: 0,
  },
  awayScore: {
    type: Number,
    default: 0,
  },
  events: [MatchEventSchema],
  liveData: {
    currentMinute: { type: Number, default: 0 },
    isLive: { type: Boolean, default: false },
    lastUpdate: { type: Date, default: Date.now },
  },
  referee: {
    type: String,
    default: '',
  },
  notes: {
    type: String,
    default: '',
  }
}, {
  timestamps: true,
});

export default mongoose.models.Match || mongoose.model('Match', MatchSchema);