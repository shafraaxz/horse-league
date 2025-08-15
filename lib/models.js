// Fixed lib/models.js - Remove dotenv import and duplicate indexes
import mongoose from 'mongoose';

// Admin Schema
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['admin', 'moderator', 'scorer'] },
  email: { type: String },
  fullName: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// League Schema
const leagueSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  logo: { type: String, default: '' },
  season: { type: String, default: '2024/25' },
  status: { type: String, enum: ['active', 'inactive', 'completed'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  teamsCount: { type: Number, default: 0 },
  matchesCount: { type: Number, default: 0 },
  settings: {
    pointsForWin: { type: Number, default: 3 },
    pointsForDraw: { type: Number, default: 1 },
    pointsForLoss: { type: Number, default: 0 }
  }
}, { timestamps: true });

// Team Schema
const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logo: { type: String, default: '' },
  league: { type: mongoose.Schema.Types.ObjectId, ref: 'League', required: true },
  founded: { type: String, default: '' },
  stadium: { type: String, default: '' },
  coach: { type: String, default: '' },
  description: { type: String, default: '' },
  colors: {
    primary: { type: String, default: '' },
    secondary: { type: String, default: '' }
  },
  website: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  playersCount: { type: Number, default: 0 }
}, { timestamps: true });

// Player Schema
const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  number: { type: Number, required: true },
  position: { 
    type: String, 
    required: true, 
    enum: ['GK', 'DEF', 'MID', 'FW', 'Goalkeeper', 'Defender', 'Midfielder', 'Forward'] 
  },
  photo: { type: String, default: '' },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  league: { type: mongoose.Schema.Types.ObjectId, ref: 'League', required: true },
  dateOfBirth: { type: Date },
  nationality: { type: String, default: '' },
  height: { type: Number }, // in cm
  weight: { type: Number }, // in kg
  preferredFoot: { type: String, enum: ['Left', 'Right', 'Both', ''], default: '' },
  bio: { type: String, default: '' },
  previousClubs: { type: String, default: '' },
  
  // Statistics
  stats: {
    appearances: { type: Number, default: 0 },
    goals: { type: Number, default: 0 },
    assists: { type: Number, default: 0 },
    yellowCards: { type: Number, default: 0 },
    redCards: { type: Number, default: 0 },
    minutesPlayed: { type: Number, default: 0 },
    saves: { type: Number, default: 0 }, // for goalkeepers
    cleanSheets: { type: Number, default: 0 } // for goalkeepers
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Match Schema
const matchSchema = new mongoose.Schema({
  homeTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  awayTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  league: { type: mongoose.Schema.Types.ObjectId, ref: 'League', required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  round: { type: Number, required: true },
  matchday: { type: Number, required: true },
  venue: { type: String, default: 'Manadhoo Futsal Ground' },
  referee: { type: String, default: '' },
  notes: { type: String, default: '' },
  
  // Match Status
  status: { 
    type: String, 
    enum: ['scheduled', 'live', 'halftime', 'finished', 'postponed', 'cancelled'], 
    default: 'scheduled' 
  },
  
  // Scores
  score: {
    home: { type: Number, default: 0 },
    away: { type: Number, default: 0 },
    halfTime: {
      home: { type: Number, default: 0 },
      away: { type: Number, default: 0 }
    }
  },
  
  // Match Events
  events: [{
    type: { 
      type: String, 
      enum: ['goal', 'yellow_card', 'red_card', 'substitution', 'kickoff', 'halftime', 'fulltime'],
      required: true
    },
    minute: { type: Number, required: true },
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    description: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now }
  }],
  
  // Live Match Data
  liveData: {
    currentMinute: { type: Number, default: 0 },
    isLive: { type: Boolean, default: false },
    period: { 
      type: String, 
      enum: ['first_half', 'halftime', 'second_half', 'extra_time', 'penalties', 'finished'], 
      default: 'first_half' 
    }
  },
  
  // Match Statistics
  statistics: {
    home: {
      possession: { type: Number, default: 0 },
      shots: { type: Number, default: 0 },
      shotsOnTarget: { type: Number, default: 0 },
      corners: { type: Number, default: 0 },
      fouls: { type: Number, default: 0 },
      yellowCards: { type: Number, default: 0 },
      redCards: { type: Number, default: 0 }
    },
    away: {
      possession: { type: Number, default: 0 },
      shots: { type: Number, default: 0 },
      shotsOnTarget: { type: Number, default: 0 },
      corners: { type: Number, default: 0 },
      fouls: { type: Number, default: 0 },
      yellowCards: { type: Number, default: 0 },
      redCards: { type: Number, default: 0 }
    }
  }
}, { timestamps: true });

// Season Schema
const seasonSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "2024/25"
  league: { type: mongoose.Schema.Types.ObjectId, ref: 'League', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  settings: {
    numberOfRounds: { type: Number, default: 1 }, // 1 for single round-robin, 2 for double
    playoffTeams: { type: Number, default: 0 },
    relegationTeams: { type: Number, default: 0 }
  }
}, { timestamps: true });

// ================================================================================
// ✅ FIXED INDEXES - Removed duplicate indexes that conflict with unique fields
// ================================================================================

// ❌ REMOVED THESE DUPLICATE LINES:
// adminSchema.index({ username: 1 });  // Duplicate - username is already unique
// adminSchema.index({ email: 1 });     // Duplicate - email creates its own index

// ✅ Only necessary custom indexes:
adminSchema.index({ role: 1, isActive: 1 });

leagueSchema.index({ name: 1 });
leagueSchema.index({ status: 1 });
leagueSchema.index({ createdBy: 1 });

teamSchema.index({ league: 1, name: 1 });
teamSchema.index({ league: 1 });

playerSchema.index({ team: 1, league: 1 });
playerSchema.index({ team: 1, number: 1 }, { unique: true }); // Unique jersey number per team
playerSchema.index({ league: 1 });
playerSchema.index({ name: 1 });

matchSchema.index({ league: 1, date: 1, round: 1 });
matchSchema.index({ homeTeam: 1, awayTeam: 1, date: 1 });
matchSchema.index({ status: 1 });
matchSchema.index({ league: 1, status: 1 });

seasonSchema.index({ league: 1, isActive: 1 });

// Export models with proper error handling for Next.js
export const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
export const League = mongoose.models.League || mongoose.model('League', leagueSchema);
export const Team = mongoose.models.Team || mongoose.model('Team', teamSchema);
export const Player = mongoose.models.Player || mongoose.model('Player', playerSchema);
export const Match = mongoose.models.Match || mongoose.model('Match', matchSchema);
export const Season = mongoose.models.Season || mongoose.model('Season', seasonSchema);