// ===========================================
// FILE: models/Player.js (UPDATED WITH ENHANCED OWN GOALS SUPPORT)
// ===========================================
import mongoose from 'mongoose';

// ENHANCED: Match history schema with own goals tracking
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
  ownGoals: { type: Number, default: 0 }, // NEW: Own goals tracking
  assists: { type: Number, default: 0 },
  yellowCards: { type: Number, default: 0 },
  redCards: { type: Number, default: 0 },
  minutesPlayed: { type: Number, default: 0 }
}, { _id: false });

// ENHANCED: Season stats schema with own goals tracking
const seasonStatsSchema = new mongoose.Schema({
  season: { type: mongoose.Schema.Types.ObjectId, ref: 'Season', required: true },
  appearances: { type: Number, default: 0 },
  goals: { type: Number, default: 0 },
  ownGoals: { type: Number, default: 0 }, // NEW: Own goals tracking
  assists: { type: Number, default: 0 },
  yellowCards: { type: Number, default: 0 },
  redCards: { type: Number, default: 0 },
  minutesPlayed: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  draws: { type: Number, default: 0 }
}, { _id: false });

// ENHANCED: Career stats schema with own goals tracking
const careerStatsSchema = new mongoose.Schema({
  appearances: { type: Number, default: 0 },
  goals: { type: Number, default: 0 },
  ownGoals: { type: Number, default: 0 }, // NEW: Own goals tracking
  assists: { type: Number, default: 0 },
  yellowCards: { type: Number, default: 0 },
  redCards: { type: Number, default: 0 },
  minutesPlayed: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  draws: { type: Number, default: 0 }
}, { _id: false });

// Contract history schema (unchanged)
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

// Transfer history schema (unchanged)
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
    required: [true, 'Player name is required'],
    trim: true,
    minlength: [2, 'Player name must be at least 2 characters long'],
    maxlength: [100, 'Player name cannot exceed 100 characters']
  },
  
  // ID CARD NUMBER - MANDATORY AND UNIQUE
  idCardNumber: {
    type: String,
    required: [true, 'ID card number is required'],
    unique: true,
    trim: true,
    index: true,
    uppercase: true,
    minlength: [5, 'ID card number must be at least 5 characters long'],
    maxlength: [20, 'ID card number cannot exceed 20 characters'],
    validate: {
      validator: function(v) {
        // Allow alphanumeric characters, hyphens, and slashes
        return /^[A-Za-z0-9\-\/]+$/.test(v);
      },
      message: 'ID card number can only contain letters, numbers, hyphens, and slashes'
    }
  },
  
  email: { 
    type: String, 
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please provide a valid email address'
    }
  },
  
  phone: { 
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^[\d\+\-\(\)\s]+$/.test(v);
      },
      message: 'Please provide a valid phone number'
    }
  },
  
  dateOfBirth: { 
    type: Date,
    validate: {
      validator: function(v) {
        if (!v) return true;
        const today = new Date();
        const minDate = new Date(today.getFullYear() - 100, 0, 1);
        const maxDate = new Date(today.getFullYear() - 10, 11, 31);
        return v >= minDate && v <= maxDate;
      },
      message: 'Date of birth must be between 10 and 100 years ago'
    }
  },
  
  nationality: { 
    type: String,
    trim: true,
    maxlength: [50, 'Nationality cannot exceed 50 characters']
  },
  
  // FUTSAL: Position is optional since players can play multiple roles
  position: { 
    type: String, 
    enum: {
      values: ['Goalkeeper', 'Outfield Player'],
      message: 'Position must be either Goalkeeper or Outfield Player'
    }
  },
  
  jerseyNumber: { 
    type: Number,
    min: [1, 'Jersey number must be between 1 and 99'],
    max: [99, 'Jersey number must be between 1 and 99'],
    sparse: true // Allows null values but enforces uniqueness when present
  },
  
  height: { 
    type: Number, // in cm
    min: [100, 'Height must be at least 100 cm'],
    max: [250, 'Height cannot exceed 250 cm']
  },
  
  weight: { 
    type: Number, // in kg
    min: [30, 'Weight must be at least 30 kg'],
    max: [200, 'Weight cannot exceed 200 kg']
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
  
  // CONTRACT INFORMATION
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
  
  // ENHANCED: Statistics with own goals support
  seasonStats: {
    type: Map,
    of: seasonStatsSchema,
    default: () => new Map()
  },
  careerStats: {
    type: careerStatsSchema,
    default: () => ({
      appearances: 0,
      goals: 0,
      ownGoals: 0, // NEW: Initialize own goals
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      minutesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0
    })
  },
  
  // History
  transferHistory: [transferHistorySchema],
  matchHistory: [matchHistorySchema],
  contractHistory: [contractHistorySchema],
  currentTeamHistory: [{
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    season: { type: mongoose.Schema.Types.ObjectId, ref: 'Season', required: true },
    joinedDate: { type: Date, default: Date.now },
    leftDate: { type: Date },
    isActive: { type: Boolean, default: true }
  }],
  
  // Additional Info
  emergencyContact: {
    name: { 
      type: String, 
      trim: true,
      maxlength: [100, 'Emergency contact name cannot exceed 100 characters'] 
    },
    phone: { 
      type: String, 
      trim: true 
    },
    relationship: { 
      type: String, 
      trim: true,
      maxlength: [50, 'Emergency contact relationship cannot exceed 50 characters'] 
    }
  },
  medicalInfo: {
    bloodType: { 
      type: String, 
      trim: true,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', '']
    },
    allergies: [{ type: String, trim: true }],
    conditions: [{ type: String, trim: true }],
    notes: { 
      type: String, 
      trim: true,
      maxlength: [1000, 'Medical notes cannot exceed 1000 characters']
    }
  },
  notes: { 
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// INDEXES for performance and uniqueness
playerSchema.index({ currentTeam: 1, status: 1 });
playerSchema.index({ email: 1 }, { sparse: true });
playerSchema.index({ name: 1 });
playerSchema.index({ idCardNumber: 1 }, { unique: true });
playerSchema.index({ contractStatus: 1 });

// Jersey number uniqueness only when both team and number exist
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

// Virtual for transfer eligibility
playerSchema.virtual('isTransferEligible').get(function() {
  if (this.contractStatus === 'free_agent') return true;
  
  const contract = this.currentContract;
  if (!contract || !contract.team) return true;
  
  // Normal contracts: can transfer anytime
  if (contract.contractType === 'normal') return true;
  
  // Seasonal contracts: only at season end or if season is inactive
  if (contract.contractType === 'seasonal') {
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

// NEW: Virtual for enhanced goal statistics
playerSchema.virtual('enhancedGoalStats').get(function() {
  const career = this.careerStats || {};
  return {
    totalGoals: (career.goals || 0) + (career.ownGoals || 0),
    regularGoals: career.goals || 0,
    ownGoals: career.ownGoals || 0,
    goalRatio: career.appearances ? 
      ((career.goals || 0) / career.appearances).toFixed(2) : '0.00',
    ownGoalRatio: career.appearances ? 
      ((career.ownGoals || 0) / career.appearances).toFixed(2) : '0.00'
  };
});

// Method to get stats for specific season
playerSchema.methods.getSeasonStats = function(seasonId) {
  if (!this.seasonStats) return null;
  return this.seasonStats.get(seasonId.toString()) || null;
};

// NEW: Method to get enhanced season stats including own goals
playerSchema.methods.getEnhancedSeasonStats = function(seasonId) {
  const stats = this.getSeasonStats(seasonId);
  if (!stats) return null;
  
  return {
    ...stats.toObject(),
    totalGoals: (stats.goals || 0) + (stats.ownGoals || 0),
    goalRatio: stats.appearances ? 
      ((stats.goals || 0) / stats.appearances).toFixed(2) : '0.00',
    ownGoalRatio: stats.appearances ? 
      ((stats.ownGoals || 0) / stats.appearances).toFixed(2) : '0.00'
  };
};

// NEW: Method to update stats from match events
playerSchema.methods.updateStatsFromMatch = function(matchData, playerEvents) {
  const { matchId, seasonId, teamId, result, minutesPlayed = 40 } = matchData;
  
  // Calculate stats from events
  const matchStats = {
    goals: 0,
    ownGoals: 0,
    assists: 0,
    yellowCards: 0,
    redCards: 0
  };
  
  playerEvents.forEach(event => {
    switch (event.type) {
      case 'goal':
        matchStats.goals++;
        break;
      case 'own_goal':
        matchStats.ownGoals++;
        break;
      case 'assist':
        matchStats.assists++;
        break;
      case 'yellow_card':
        matchStats.yellowCards++;
        break;
      case 'red_card':
        matchStats.redCards++;
        break;
    }
  });
  
  // Update career stats
  if (!this.careerStats) {
    this.careerStats = {
      appearances: 0, goals: 0, ownGoals: 0, assists: 0,
      yellowCards: 0, redCards: 0, minutesPlayed: 0,
      wins: 0, losses: 0, draws: 0
    };
  }
  
  this.careerStats.appearances += 1;
  this.careerStats.goals += matchStats.goals;
  this.careerStats.ownGoals += matchStats.ownGoals;
  this.careerStats.assists += matchStats.assists;
  this.careerStats.yellowCards += matchStats.yellowCards;
  this.careerStats.redCards += matchStats.redCards;
  this.careerStats.minutesPlayed += minutesPlayed;
  
  // Update result stats
  if (result === 'win') this.careerStats.wins += 1;
  else if (result === 'loss') this.careerStats.losses += 1;
  else if (result === 'draw') this.careerStats.draws += 1;
  
  // Update season stats
  if (!this.seasonStats) {
    this.seasonStats = new Map();
  }
  
  let seasonStats = this.seasonStats.get(seasonId.toString());
  if (!seasonStats) {
    seasonStats = {
      season: seasonId,
      appearances: 0, goals: 0, ownGoals: 0, assists: 0,
      yellowCards: 0, redCards: 0, minutesPlayed: 0,
      wins: 0, losses: 0, draws: 0
    };
  }
  
  seasonStats.appearances += 1;
  seasonStats.goals += matchStats.goals;
  seasonStats.ownGoals += matchStats.ownGoals;
  seasonStats.assists += matchStats.assists;
  seasonStats.yellowCards += matchStats.yellowCards;
  seasonStats.redCards += matchStats.redCards;
  seasonStats.minutesPlayed += minutesPlayed;
  
  if (result === 'win') seasonStats.wins += 1;
  else if (result === 'loss') seasonStats.losses += 1;
  else if (result === 'draw') seasonStats.draws += 1;
  
  this.seasonStats.set(seasonId.toString(), seasonStats);
  
  return this;
};

// Method to check if player can be transferred
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

// Method to sign contract with team
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

// Pre-save middleware with enhanced ID card validation
playerSchema.pre('save', async function(next) {
  try {
    // Normalize ID card number
    if (this.idCardNumber) {
      this.idCardNumber = this.idCardNumber.trim().replace(/\s+/g, '').toUpperCase();
    }
    
    // Check ID card number uniqueness manually (for better error messages)
    if (this.isModified('idCardNumber')) {
      const existingPlayer = await this.constructor.findOne({
        idCardNumber: this.idCardNumber,
        _id: { $ne: this._id }
      });
      
      if (existingPlayer) {
        const error = new Error(`Player with ID card number ${this.idCardNumber} already exists: ${existingPlayer.name}`);
        error.code = 'DUPLICATE_ID_CARD';
        return next(error);
      }
    }
    
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
    
    // Update contract status based on current contract
    if (this.currentContract && this.currentContract.team) {
      this.contractStatus = this.currentContract.contractType || 'normal';
    } else {
      this.contractStatus = 'free_agent';
    }
    
    // Initialize careerStats with own goals if not present
    if (!this.careerStats) {
      this.careerStats = {
        appearances: 0, goals: 0, ownGoals: 0, assists: 0,
        yellowCards: 0, redCards: 0, minutesPlayed: 0,
        wins: 0, losses: 0, draws: 0
      };
    } else if (this.careerStats.ownGoals === undefined) {
      this.careerStats.ownGoals = 0;
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Post-save middleware for logging
playerSchema.post('save', function(doc) {
  console.log(`Player ${doc.name} (ID: ${doc.idCardNumber}) saved successfully`);
});

export default mongoose.models.Player || mongoose.model('Player', playerSchema);
