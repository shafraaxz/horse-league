// ===========================================
// FILE: models/Player.js (UPDATED WITH STATISTICS)
// ===========================================
import mongoose from 'mongoose';

const matchHistorySchema = new mongoose.Schema({
  match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
  season: { type: mongoose.Schema.Types.ObjectId, ref: 'Season', required: true },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  date: { type: Date, required: true },
  opponent: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  homeTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  awayTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  result: { type: String, enum: ['win', 'loss', 'draw'], required: true },
  goals: { type: Number, default: 0 },
  assists: { type: Number, default: 0 },
  yellowCards: { type: Number, default: 0 },
  redCards: { type: Number, default: 0 },
  minutesPlayed: { type: Number, default: 0 }
}, { _id: false });

const seasonStatsSchema = new mongoose.Schema({
  season: { type: mongoose.Schema.Types.ObjectId, ref: 'Season', required: true },
  appearances: { type: Number, default: 0 },
  goals: { type: Number, default: 0 },
  assists: { type: Number, default: 0 },
  yellowCards: { type: Number, default: 0 },
  redCards: { type: Number, default: 0 },
  minutesPlayed: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  draws: { type: Number, default: 0 }
}, { _id: false });

const careerStatsSchema = new mongoose.Schema({
  appearances: { type: Number, default: 0 },
  goals: { type: Number, default: 0 },
  assists: { type: Number, default: 0 },
  yellowCards: { type: Number, default: 0 },
  redCards: { type: Number, default: 0 },
  minutesPlayed: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  draws: { type: Number, default: 0 }
}, { _id: false });

const transferHistorySchema = new mongoose.Schema({
  fromTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  toTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  season: { type: mongoose.Schema.Types.ObjectId, ref: 'Season', required: true },
  transferDate: { type: Date, required: true },
  transferType: { 
    type: String, 
    enum: ['initial_registration', 'transfer', 'loan', 'return_from_loan'], 
    default: 'transfer' 
  },
  fee: { type: Number, default: 0 },
  notes: { type: String, default: '' }
});

const playerSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  email: { 
    type: String, 
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  phone: { 
    type: String,
    trim: true
  },
  dateOfBirth: { 
    type: Date 
  },
  nationality: { 
    type: String,
    trim: true
  },
  position: { 
    type: String, 
    enum: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
    required: true 
  },
  jerseyNumber: { 
    type: Number,
    min: 1,
    max: 99
  },
  height: { 
    type: Number // in cm
  },
  weight: { 
    type: Number // in kg
  },
  photo: { 
    type: String // Cloudinary URL
  },
  currentTeam: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Team'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'injured', 'suspended', 'retired'],
    default: 'active'
  },
  
  // Statistics
  seasonStats: {
    type: Map,
    of: seasonStatsSchema,
    default: () => new Map()
  },
  careerStats: {
    type: careerStatsSchema,
    default: () => ({})
  },
  
  // History
  transferHistory: [transferHistorySchema],
  matchHistory: [matchHistorySchema],
  currentTeamHistory: [{
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    season: { type: mongoose.Schema.Types.ObjectId, ref: 'Season', required: true },
    joinedDate: { type: Date, default: Date.now },
    leftDate: { type: Date },
    isActive: { type: Boolean, default: true }
  }],
  
  // Additional Info
  emergencyContact: {
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    relationship: { type: String, trim: true }
  },
  medicalInfo: {
    bloodType: { type: String, trim: true },
    allergies: [{ type: String, trim: true }],
    conditions: [{ type: String, trim: true }],
    notes: { type: String, trim: true }
  },
  notes: { 
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
playerSchema.index({ currentTeam: 1, status: 1 });
playerSchema.index({ email: 1 }, { sparse: true });
playerSchema.index({ 'currentTeam': 1, 'jerseyNumber': 1 }, { 
  unique: true, 
  sparse: true,
  partialFilterExpression: { jerseyNumber: { $exists: true } }
});

// Virtual for age calculation
playerSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Virtual for current season stats
playerSchema.virtual('currentSeasonStats').get(function() {
  if (!this.seasonStats || this.seasonStats.size === 0) return null;
  
  // Get the most recent season stats (you might want to get active season instead)
  const seasons = Array.from(this.seasonStats.keys());
  const latestSeason = seasons[seasons.length - 1];
  return this.seasonStats.get(latestSeason);
});

// Method to get stats for specific season
playerSchema.methods.getSeasonStats = function(seasonId) {
  if (!this.seasonStats) return null;
  return this.seasonStats.get(seasonId.toString()) || null;
};

// Method to add transfer record
playerSchema.methods.addTransfer = function(transferData) {
  this.transferHistory.push({
    ...transferData,
    transferDate: transferData.transferDate || new Date()
  });
  
  // Update current team
  this.currentTeam = transferData.toTeam;
  
  // Update current team history
  // Close previous team record
  if (this.currentTeamHistory.length > 0) {
    const lastRecord = this.currentTeamHistory[this.currentTeamHistory.length - 1];
    if (lastRecord.isActive) {
      lastRecord.isActive = false;
      lastRecord.leftDate = transferData.transferDate || new Date();
    }
  }
  
  // Add new team record
  this.currentTeamHistory.push({
    team: transferData.toTeam,
    season: transferData.season,
    joinedDate: transferData.transferDate || new Date(),
    isActive: true
  });
};

// Pre-save middleware to validate jersey number uniqueness per team
playerSchema.pre('save', async function(next) {
  if (!this.isModified('jerseyNumber') && !this.isModified('currentTeam')) {
    return next();
  }
  
  if (this.jerseyNumber && this.currentTeam) {
    const existingPlayer = await this.constructor.findOne({
      currentTeam: this.currentTeam,
      jerseyNumber: this.jerseyNumber,
      _id: { $ne: this._id },
      status: { $in: ['active', 'injured', 'suspended'] }
    });
    
    if (existingPlayer) {
      const error = new Error(`Jersey number ${this.jerseyNumber} is already taken in this team`);
      error.code = 'DUPLICATE_JERSEY';
      return next(error);
    }
  }
  
  next();
});

export default mongoose.models.Player || mongoose.model('Player', playerSchema);