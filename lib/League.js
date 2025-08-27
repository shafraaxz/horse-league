// models/League.js
import mongoose from 'mongoose';

const LeagueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['league', 'cup'],
    default: 'league'
  },
  sport: {
    type: String,
    enum: ['football', 'futsal'],
    default: 'football'
  },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed'],
    default: 'upcoming'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  description: String,
  logo: String,
  teams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }],
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }],
  currentRound: {
    type: Number,
    default: 1
  },
  totalRounds: Number,
  pointsForWin: {
    type: Number,
    default: 3
  },
  pointsForDraw: {
    type: Number,
    default: 1
  },
  pointsForLoss: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
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

export default mongoose.models.League || mongoose.model('League', LeagueSchema);
