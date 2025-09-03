// ===========================================
// FILE: models/Player.js (UPDATED WITH CONTRACT STATUS)
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

// NEW: Contract history schema
const contractHistorySchema = new mongoose.Schema({
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  season: { type: mongoose.Schema.Types.ObjectId, ref: 'Season', required: true },
  contractType: { 
    type: String, 
    enum: ['normal', 'seasonal'], 
    default: 'normal' 
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date }, // null for open-ended contracts
  status: { 
    type: String, 
    enum: ['active', 'expired', 'terminated'], 
    default: 'active' 
  },
  contractValue: { type: Number, default: 0 }, // in MVR
  notes: { type: String, default: '' }
}, { timestamps: true });

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
  
  // ID CARD NUMBER - PRIVATE SKU (not shown to public)
  idCardNumber: {
    type: String,
    unique: true,
    sparse: true, // Allows null values but enforces uniqueness when present
    trim: true,
    index: true
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
  
  // FUTSAL: Position is optional since players can play multiple roles
  position: { 
    type: String, 
    enum: ['Goalkeeper', 'Outfield Player'],
    // No required: true - makes it optional for futsal
  },
  
  jerseyNumber: { 
    type: Number,
    min: 1,
    max: 99,
    sparse: true // Allows null values but enforces uniqueness when present
  },
  height: { 
    type: Number // in cm
  },
  weight: { 
    type: Number // in kg
  },
  photo: { 
    type: String // Cloudinary URL or direct URL string
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
  
  // NEW: Contract Information
  contractStatus: {
    type: String,
    enum: ['normal', 'seasonal', 'free_agent'],
    default: 'free_agent'
  },
  currentContract: {
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    season: { type: mongoose.Schema.Types.ObjectId, ref: 'Season' },
    contractType: { 
      type: String, 
      enum: ['normal', 'seasonal'], 
      default: 'normal' 
    },
    startDate: { type: Date },
    endDate: { type: Date }, // null for open-ended normal contracts
    contractValue: { type: Number, default: 0 }, // in MVR
    transferEligible: { type: Boolean, default: true }, // computed field
    notes: { type: String, default: '' }
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
  contractHistory: [contractHistorySchema], // NEW: Track all contracts
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
playerSchema.index({ name: 1 });
playerSchema.index({ idCardNumber: 1 }, { sparse: true, unique: true });
playerSchema.index({ contractStatus: 1 }); // NEW: Index for contract queries

// FIXED: Jersey number uniqueness only when both team and number exist
playerSchema.index(
  { 'currentTeam': 1, 'jerseyNumber': 1 }, 
  { 
    unique: true, 
    sparse: true,
    partialFilterExpression: { 
      jerseyNumber: { $exists: true, $ne: null },
      currentTeam: { $exists: true, $ne: null }
    }
  }
);

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

// NEW: Virtual for transfer eligibility
playerSchema.virtual('isTransferEligible').get(function() {
  if (this.contractStatus === 'free_agent') return true;
  
  const contract = this.currentContract;
  if (!contract || !contract.team) return true;
  
  // Normal contracts: can transfer anytime
  if (contract.contractType === 'normal') return true;
  
  // Seasonal contracts: only at season end or if season is inactive
  if (contract.contractType === 'seasonal') {
    // This would need to check if the current season is active
    // For now, we'll assume they can transfer if no active season
    return false; // Will be computed in business logic
  }
  
  return false;
});

// Virtual for current season stats
playerSchema.virtual('currentSeasonStats').get(function() {
  if (!this.seasonStats || this.seasonStats.size === 0) return null;
  
  const seasons = Array.from(this.seasonStats.keys());
  const latestSeason = seasons[seasons.length - 1];
  return this.seasonStats.get(latestSeason);
});

// Method to get stats for specific season
playerSchema.methods.getSeasonStats = function(seasonId) {
  if (!this.seasonStats) return null;
  return this.seasonStats.get(seasonId.toString()) || null;
};

// NEW: Method to check if player can be transferred
playerSchema.methods.canTransfer = async function(targetSeason) {
  if (this.contractStatus === 'free_agent') return { canTransfer: true, reason: 'Free agent' };
  
  const contract = this.currentContract;
  if (!contract || !contract.team) {
    return { canTransfer: true, reason: 'No active contract' };
  }
  
  // Normal contracts: can transfer anytime
  if (contract.contractType === 'normal') {
    return { canTransfer: true, reason: 'Normal contract allows mid-season transfers' };
  }
  
  // Seasonal contracts: only when season ends
  if (contract.contractType === 'seasonal') {
    // Check if current season is still active
    const Season = mongoose.model('Season');
    const currentSeason = await Season.findById(contract.season);
    
    if (!currentSeason) {
      return { canTransfer: true, reason: 'Contract season no longer exists' };
    }
    
    if (!currentSeason.isActive) {
      return { canTransfer: true, reason: 'Contract season has ended' };
    }
    
    return { 
      canTransfer: false, 
      reason: 'Seasonal contract - transfers only allowed when season ends',
      contractEndDate: contract.endDate || currentSeason.endDate
    };
  }
  
  return { canTransfer: false, reason: 'Unknown contract type' };
};

// NEW: Method to sign contract with team
playerSchema.methods.signContract = function(contractData) {
  // End current contract if exists
  if (this.currentContract && this.currentContract.team) {
    this.contractHistory.push({
      ...this.currentContract,
      status: 'terminated',
      endDate: new Date()
    });
  }
  
  // Set new contract
  this.currentContract = {
    team: contractData.team,
    season: contractData.season,
    contractType: contractData.contractType || 'normal',
    startDate: contractData.startDate || new Date(),
    endDate: contractData.endDate || null,
    contractValue: contractData.contractValue || 0,
    notes: contractData.notes || ''
  };
  
  // Update contract status
  this.contractStatus = contractData.contractType || 'normal';
  
  // Add to contract history
  this.contractHistory.push({
    ...this.currentContract,
    status: 'active'
  });
  
  return this;
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

// UPDATED: Pre-save middleware with contract validation
playerSchema.pre('save', async function(next) {
  try {
    // Only check jersey number if both team and jersey number are provided
    if (this.jerseyNumber && this.currentTeam && (this.isModified('jerseyNumber') || this.isModified('currentTeam'))) {
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
    
    // Check ID card number uniqueness
    if (this.idCardNumber && this.isModified('idCardNumber')) {
      const existingPlayer = await this.constructor.findOne({
        idCardNumber: this.idCardNumber,
        _id: { $ne: this._id }
      });
      
      if (existingPlayer) {
        const error = new Error(`Player with this ID card number already exists`);
        error.code = 'DUPLICATE_ID_CARD';
        return next(error);
      }
    }
    
    // NEW: Update contract status based on current contract
    if (this.currentContract && this.currentContract.team) {
      this.contractStatus = this.currentContract.contractType || 'normal';
    } else {
      this.contractStatus = 'free_agent';
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

export default mongoose.models.Player || mongoose.model('Player', playerSchema);
