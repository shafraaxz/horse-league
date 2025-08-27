// models/Match.js
import mongoose from 'mongoose';

const MatchEventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['goal', 'assist', 'yellow_card', 'red_card', 'substitution', 'penalty', 'own_goal'],
    required: true
  },
  minute: Number,
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  },
  assistedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }
});

const MatchSchema = new mongoose.Schema({
  league: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'League',
    required: true
  },
  round: Number,
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
  homeScore: {
    type: Number,
    default: 0
  },
  awayScore: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'postponed', 'cancelled'],
    default: 'scheduled'
  },
  matchDate: {
    type: Date,
    required: true
  },
  venue: String,
  referee: String,
  attendance: Number,
  events: [MatchEventSchema],
  lineups: {
    home: {
      starting: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
      }],
      substitutes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
      }]
    },
    away: {
      starting: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
      }],
      substitutes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
      }]
    }
  },
  statistics: {
    home: {
      possession: Number,
      shots: Number,
      shotsOnTarget: Number,
      corners: Number,
      fouls: Number,
      yellowCards: Number,
      redCards: Number
    },
    away: {
      possession: Number,
      shots: Number,
      shotsOnTarget: Number,
      corners: Number,
      fouls: Number,
      yellowCards: Number,
      redCards: Number
    }
  },
  isLive: {
    type: Boolean,
    default: false
  },
  currentMinute: {
    type: Number,
    default: 0
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

export default mongoose.models.Match || mongoose.model('Match', MatchSchema);
