// models/Player.js - Enhanced Player Model with Transfer Market Logic
import mongoose from 'mongoose';

const PlayerSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  
  // Jersey and Position
  jerseyNumber: {
    type: Number,
    min: 1,
    max: 99,
    sparse: true // Allows multiple null values but ensures uniqueness when provided
  },
  position: {
    type: String,
    enum: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Pivot', 'Wing'],
    required: true
  },
  preferredPosition: {
    type: String,
    enum: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Pivot', 'Wing']
  },
  
  // Personal Details
  dateOfBirth: {
    type: Date,
    required: true
  },
  nationality: {
    type: String,
    required: true,
    trim: true
  },
  height: {
    type: Number, // in cm
    min: 140,
    max: 220
  },
  weight: {
    type: Number, // in kg
    min: 40,
    max: 150
  },
  preferredFoot: {
    type: String,
    enum: ['Left', 'Right', 'Both'],
    default: 'Right'
  },
  
  // League and Team Association - KEY CHANGES FOR TRANSFER LOGIC
  league: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'League',
    required: true,
    index: true
  },
  currentTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    index: true
    // null = Free Agent/In Market
  },
  currentSeason: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Season',
    index: true
  },
  
  // Registration Status - IMPORTANT FOR TRANSFER LOGIC
  registrationStatus: {
    type: String,
    enum: ['unregistered', 'pending', 'registered', 'transferred', 'released'],
    default: 'unregistered',
    index: true
  },
  
  // Market Status - NEW FIELD FOR TRANSFER MARKET
  marketStatus: {
    type: String,
    enum: ['available', 'assigned', 'transfer_listed', 'on_loan', 'retired'],
    default: 'available',
    index: true
  },
  
  // Transfer Market Information
  isAvailableForTransfer: {
    type: Boolean,
    default: true,
    index: true
  },
  transferListed: {
    type: Boolean,
    default: false
  },
  transferPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  lastTransferDate: {
    type: Date
  },
  
  // Contract Information
  contractStartDate: {
    type: Date
  },
  contractEndDate: {
    type: Date
  },
  contractType: {
    type: String,
    enum: ['full_season', 'half_season', 'temporary', 'trial', 'loan'],
    default: 'full_season'
  },
  salary: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Registration Details
  registrationDate: {
    type: Date,
    default: Date.now
  },
  registrationNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  registrationFee: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Contact Information
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
    email: String
  },
  
  // Documents and Media
  photo: {
    type: String, // Cloudinary URL
    default: null
  },
  photoPublicId: {
    type: String // Cloudinary Public ID for deletion
  },
  documents: {
    passport: String,
    nationalId: String,
    birthCertificate: String,
    medicalCertificate: String,
    parentalConsent: String // For minors
  },
  
  // Previous Experience
  previousClubs: [{
    clubName: String,
    country: String,
    period: String,
    achievements: String
  }],
  
  // Transfer History - ENHANCED
  transferHistory: [{
    fromTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    toTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    season: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Season'
    },
    transferDate: {
      type: Date,
      required: true
    },
    transferType: {
      type: String,
      enum: ['new_registration', 'transfer', 'loan', 'return_from_loan', 'release', 'free_agent_signing'],
      required: true
    },
    transferFee: {
      type: Number,
      default: 0
    },
    reason: String,
    notes: String,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Performance Statistics
  statistics: {
    seasons: [{
      season: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Season'
      },
      team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
      },
      matchesPlayed: { type: Number, default: 0 },
      goals: { type: Number, default: 0 },
      assists: { type: Number, default: 0 },
      yellowCards: { type: Number, default: 0 },
      redCards: { type: Number, default: 0 },
      cleanSheets: { type: Number, default: 0 }, // For goalkeepers
      saves: { type: Number, default: 0 }, // For goalkeepers
      minutesPlayed: { type: Number, default: 0 }
    }],
    
    // Career totals
    totalMatches: { type: Number, default: 0 },
    totalGoals: { type: Number, default: 0 },
    totalAssists: { type: Number, default: 0 },
    totalYellowCards: { type: Number, default: 0 },
    totalRedCards: { type: Number, default: 0 },
    totalCleanSheets: { type: Number, default: 0 },
    totalSaves: { type: Number, default: 0 }
  },
  
  // Player Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'injured', 'retired'],
    default: 'active',
    index: true
  },
  suspensionEnd: {
    type: Date
  },
  medicalStatus: {
    type: String,
    enum: ['fit', 'injured', 'recovering', 'medical_clearance_pending'],
    default: 'fit'
  },
  
  // Administrative
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
PlayerSchema.index({ league: 1, registrationStatus: 1 });
PlayerSchema.index({ league: 1, marketStatus: 1 });
PlayerSchema.index({ currentTeam: 1, jerseyNumber: 1 }, { unique: true, sparse: true });
PlayerSchema.index({ league: 1, currentTeam: 1 });
PlayerSchema.index({ registrationNumber: 1 }, { unique: true, sparse: true });
PlayerSchema.index({ isActive: 1, status: 1 });

// Virtual for age
PlayerSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birth = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
});

// Virtual for full name
PlayerSchema.virtual('fullName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.name;
});

// Virtual to check if player is a minor
PlayerSchema.virtual('isMinor').get(function() {
  return this.age < 18;
});

// Virtual for current contract status
PlayerSchema.virtual('contractStatus').get(function() {
  if (!this.contractEndDate) return 'no_contract';
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
  
  if (this.contractEndDate < today) return 'expired';
  if (this.contractEndDate < thirtyDaysFromNow) return 'expiring_soon';
  return 'active';
});

// Static method to find available players (for transfer market)
PlayerSchema.statics.findAvailablePlayers = function(leagueId, filters = {}) {
  const query = {
    league: leagueId,
    isActive: true,
    marketStatus: 'available',
    registrationStatus: 'registered',
    status: { $in: ['active', 'inactive'] }
  };
  
  // Apply additional filters
  if (filters.position) query.position = filters.position;
  if (filters.maxAge) {
    const maxBirthDate = new Date();
    maxBirthDate.setFullYear(maxBirthDate.getFullYear() - filters.maxAge);
    query.dateOfBirth = { $gte: maxBirthDate };
  }
  if (filters.minAge) {
    const minBirthDate = new Date();
    minBirthDate.setFullYear(minBirthDate.getFullYear() - filters.minAge);
    query.dateOfBirth = { $lte: minBirthDate };
  }
  
  return this.find(query)
    .populate('currentTeam', 'name shortName logo')
    .populate('league', 'name')
    .sort({ name: 1 });
};

// Static method to find free agents
PlayerSchema.statics.findFreeAgents = function(leagueId) {
  return this.find({
    league: leagueId,
    currentTeam: null,
    marketStatus: 'available',
    registrationStatus: 'registered',
    isActive: true,
    status: { $in: ['active', 'inactive'] }
  }).populate('league', 'name')
    .sort({ name: 1 });
};

// Instance method to register player to league
PlayerSchema.methods.registerToLeague = async function(leagueId, registeredBy) {
  if (this.registrationStatus === 'registered') {
    throw new Error('Player is already registered');
  }
  
  this.league = leagueId;
  this.registrationStatus = 'registered';
  this.registrationDate = new Date();
  this.marketStatus = 'available';
  
  // Generate registration number
  const count = await this.constructor.countDocuments({ league: leagueId });
  this.registrationNumber = `${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
  
  // Add to transfer history
  this.transferHistory.push({
    transferDate: new Date(),
    transferType: 'new_registration',
    reason: 'Initial player registration',
    processedBy: registeredBy
  });
  
  return this.save();
};

// Instance method to assign player to team
PlayerSchema.methods.assignToTeam = async function(teamId, seasonId, assignedBy, jerseyNumber = null) {
  if (this.registrationStatus !== 'registered') {
    throw new Error('Player must be registered before team assignment');
  }
  
  if (this.marketStatus !== 'available') {
    throw new Error('Player is not available for assignment');
  }
  
  // Check jersey number availability if provided
  if (jerseyNumber) {
    const existingPlayer = await this.constructor.findOne({
      currentTeam: teamId,
      jerseyNumber: jerseyNumber,
      isActive: true,
      _id: { $ne: this._id }
    });
    
    if (existingPlayer) {
      throw new Error(`Jersey number ${jerseyNumber} is already taken by ${existingPlayer.name}`);
    }
  }
  
  const previousTeam = this.currentTeam;
  
  this.currentTeam = teamId;
  this.currentSeason = seasonId;
  this.marketStatus = 'assigned';
  this.jerseyNumber = jerseyNumber;
  this.contractStartDate = new Date();
  this.lastTransferDate = new Date();
  
  // Add to transfer history
  const transferType = previousTeam ? 'transfer' : 'free_agent_signing';
  this.transferHistory.push({
    fromTeam: previousTeam,
    toTeam: teamId,
    season: seasonId,
    transferDate: new Date(),
    transferType: transferType,
    reason: `Player ${transferType.replace('_', ' ')}`,
    processedBy: assignedBy
  });
  
  return this.save();
};

// Instance method to release player from team
PlayerSchema.methods.releaseFromTeam = async function(reason = 'Released to market', releasedBy) {
  if (!this.currentTeam) {
    throw new Error('Player is not assigned to any team');
  }
  
  const previousTeam = this.currentTeam;
  const previousJersey = this.jerseyNumber;
  
  this.currentTeam = null;
  this.jerseyNumber = null;
  this.marketStatus = 'available';
  this.contractEndDate = new Date();
  this.lastTransferDate = new Date();
  
  // Add to transfer history
  this.transferHistory.push({
    fromTeam: previousTeam,
    toTeam: null,
    season: this.currentSeason,
    transferDate: new Date(),
    transferType: 'release',
    reason: reason,
    processedBy: releasedBy
  });
  
  return this.save();
};

// Pre-save validation and hooks
PlayerSchema.pre('save', function(next) {
  // Ensure jersey number is unique within team
  if (this.isModified('jerseyNumber') && this.jerseyNumber && this.currentTeam) {
    // This will be caught by the unique index, but we can add custom validation here if needed
  }
  
  // Auto-generate full name if not provided
  if (!this.name && this.firstName && this.lastName) {
    this.name = `${this.firstName} ${this.lastName}`;
  }
  
  next();
});

// Pre-remove hook to clean up related data
PlayerSchema.pre('remove', async function(next) {
  // Remove player references from matches, statistics, etc.
  // This would need to be implemented based on your match model
  next();
});

export default mongoose.models.Player || mongoose.model('Player', PlayerSchema);