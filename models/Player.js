// models/Player.js - Fixed schema with proper league association
import mongoose from 'mongoose';

const PlayerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  jerseyNumber: {
    type: Number,
    required: false, // ✅ Changed to optional since not always provided initially
    sparse: true // Allows multiple null values, but unique when provided
  },
  position: {
    type: String,
    enum: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
    required: true
  },
  dateOfBirth: Date,
  nationality: String,
  height: Number,
  weight: Number,
  preferredFoot: {
    type: String,
    enum: ['Left', 'Right', 'Both'],
    default: 'Right'
  },
  
  // Team Association
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  currentTeam: { // Alternative field name for current team
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  
  // League Association - ADDED
  league: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'League',
    required: true // Players must be associated with a league
  },
  leagues: [{ // For multi-league players
    type: mongoose.Schema.Types.ObjectId,
    ref: 'League'
  }],
  
  // Registration Information
  registrationDate: {
    type: Date,
    default: Date.now
  },
  contractType: {
    type: String,
    enum: ['full_season', 'half_season', 'temporary'],
    default: 'full_season'
  },
  registrationFee: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'transferred'],
    default: 'active'
  },
  
  // Contact Information
  email: String,
  phone: String,
  address: String,
  emergencyContact: String,
  emergencyPhone: String,
  
  // Documents
  passportNumber: String,
  idNumber: String,
  medicalCertificate: String,
  photo: String,
  
  // Previous Clubs
  previousClubs: String,
  
  // Transfer History
  transferHistory: [{
    fromTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    toTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    transferDate: Date,
    transferFee: Number,
    transferType: {
      type: String,
      enum: ['permanent', 'loan', 'temporary', 'free_transfer']
    }
  }],
  
  // Performance Statistics
  statistics: {
    matchesPlayed: { type: Number, default: 0 },
    goals: { type: Number, default: 0 },
    assists: { type: Number, default: 0 },
    yellowCards: { type: Number, default: 0 },
    redCards: { type: Number, default: 0 },
    cleanSheets: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    minutesPlayed: { type: Number, default: 0 }
  },
  
  isActive: {
    type: Boolean,
    default: true
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

// Indexes for better query performance
PlayerSchema.index({ league: 1 });
PlayerSchema.index({ team: 1 });
PlayerSchema.index({ status: 1 });
PlayerSchema.index({ name: 1 });
PlayerSchema.index({ jerseyNumber: 1, team: 1 }, { sparse: true }); // Unique jersey per team

// Middleware to update the updatedAt field
PlayerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for age calculation
PlayerSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age > 0 ? age : null;
});

// Instance method to get current team
PlayerSchema.methods.getCurrentTeam = function() {
  return this.currentTeam || this.team;
};

// Static method to find players by league
PlayerSchema.statics.findByLeague = function(leagueId) {
  return this.find({
    $or: [
      { league: leagueId },
      { leagues: { $in: [leagueId] } }
    ],
    isActive: true
  }).populate('team currentTeam league');
};

// Static method to find free agents in a league
PlayerSchema.statics.findFreeAgents = function(leagueId) {
  return this.find({
    $or: [
      { league: leagueId },
      { leagues: { $in: [leagueId] } }
    ],
    team: { $exists: false },
    currentTeam: { $exists: false },
    isActive: true
  }).populate('league');
};

export default mongoose.models.Player || mongoose.model('Player', PlayerSchema);