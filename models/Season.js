// models/Season.js - Enhanced Season Management
import mongoose from 'mongoose';

const SeasonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    // Format: "2024/25", "2025/26", etc.
    match: /^\d{4}\/\d{2}$/,
    index: true
  },
  displayName: {
    type: String,
    trim: true
    // e.g., "2024-2025 Season", "Spring 2025"
  },
  
  // League Association
  league: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'League',
    required: true,
    index: true
  },
  
  // Season Status
  status: {
    type: String,
    enum: ['draft', 'upcoming', 'active', 'completed', 'archived'],
    default: 'draft',
    index: true
  },
  
  // Season Dates
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  registrationDeadline: {
    type: Date,
    required: true
  },
  transferWindowStart: {
    type: Date,
    required: true
  },
  transferWindowEnd: {
    type: Date,
    required: true
  },
  
  // Season Configuration
  maxTeams: {
    type: Number,
    default: 16,
    min: 4,
    max: 32
  },
  maxPlayersPerTeam: {
    type: Number,
    default: 20,
    min: 11,
    max: 30
  },
  minPlayersPerTeam: {
    type: Number,
    default: 11,
    min: 7,
    max: 15
  },
  
  // Competition Format
  format: {
    type: String,
    enum: ['single_round_robin', 'double_round_robin', 'playoffs', 'groups_and_playoffs'],
    default: 'double_round_robin'
  },
  numberOfRounds: {
    type: Number,
    default: 2 // 1 for single round robin, 2 for double
  },
  
  // Points System
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
  
  // Season Statistics (computed fields)
  totalMatches: {
    type: Number,
    default: 0
  },
  completedMatches: {
    type: Number,
    default: 0
  },
  totalGoals: {
    type: Number,
    default: 0
  },
  
  // Participating Teams
  teams: [{
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true
    },
    registrationDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['registered', 'confirmed', 'withdrawn'],
      default: 'registered'
    },
    registrationFee: {
      type: Number,
      default: 0
    }
  }],
  
  // Season Awards
  awards: {
    champion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    runnerUp: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    topScorer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    topAssists: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    bestGoalkeeper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    fairPlayAward: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    }
  },
  
  // Administrative
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    trim: true
  },
  
  // Meta Information
  isActive: {
    type: Boolean,
    default: true
  },
  archived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
SeasonSchema.index({ league: 1, status: 1 });
SeasonSchema.index({ startDate: 1, endDate: 1 });
SeasonSchema.index({ name: 1, league: 1 }, { unique: true });

// Virtual for progress percentage
SeasonSchema.virtual('progress').get(function() {
  if (this.totalMatches === 0) return 0;
  return Math.round((this.completedMatches / this.totalMatches) * 100);
});

// Virtual for season duration
SeasonSchema.virtual('duration').get(function() {
  if (!this.startDate || !this.endDate) return 0;
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

// Virtual for registration status
SeasonSchema.virtual('registrationOpen').get(function() {
  const now = new Date();
  return now <= this.registrationDeadline && this.status !== 'completed';
});

// Virtual for transfer window status
SeasonSchema.virtual('transferWindowOpen').get(function() {
  const now = new Date();
  return now >= this.transferWindowStart && now <= this.transferWindowEnd && this.status === 'active';
});

// Static method to get current active season
SeasonSchema.statics.getCurrentSeason = function(leagueId) {
  return this.findOne({ 
    league: leagueId, 
    status: 'active',
    isActive: true 
  }).populate('league', 'name shortName');
};

// Static method to get seasons by status
SeasonSchema.statics.getByStatus = function(leagueId, status) {
  return this.find({ 
    league: leagueId, 
    status: status,
    isActive: true 
  }).populate('teams.team', 'name shortName logo')
    .populate('league', 'name shortName')
    .sort({ startDate: -1 });
};

// Instance method to check if season can be edited
SeasonSchema.methods.canEdit = function() {
  return ['draft', 'upcoming'].includes(this.status);
};

// Instance method to activate season
SeasonSchema.methods.activate = async function() {
  if (this.status !== 'upcoming') {
    throw new Error('Only upcoming seasons can be activated');
  }
  
  // Deactivate other active seasons in the same league
  await this.constructor.updateMany(
    { league: this.league, status: 'active' },
    { status: 'completed' }
  );
  
  this.status = 'active';
  return this.save();
};

// Instance method to add team to season
SeasonSchema.methods.addTeam = async function(teamId, registrationFee = 0) {
  // Check if team already exists
  const existingTeam = this.teams.find(t => t.team.toString() === teamId.toString());
  if (existingTeam) {
    throw new Error('Team is already registered for this season');
  }
  
  // Check max teams limit
  if (this.teams.length >= this.maxTeams) {
    throw new Error('Season is full - maximum teams reached');
  }
  
  this.teams.push({
    team: teamId,
    registrationDate: new Date(),
    registrationFee: registrationFee,
    status: 'registered'
  });
  
  return this.save();
};

// Pre-save validation
SeasonSchema.pre('save', function(next) {
  // Validate date ranges
  if (this.startDate >= this.endDate) {
    return next(new Error('Season end date must be after start date'));
  }
  
  if (this.registrationDeadline >= this.startDate) {
    return next(new Error('Registration deadline must be before season start'));
  }
  
  if (this.transferWindowStart < this.startDate) {
    return next(new Error('Transfer window cannot start before season begins'));
  }
  
  // Auto-generate display name if not provided
  if (!this.displayName && this.name) {
    const year1 = this.name.split('/')[0];
    const year2 = '20' + this.name.split('/')[1];
    this.displayName = `${year1}-${year2} Season`;
  }
  
  next();
});

// Post-save hook to update league's current season if this season is active
SeasonSchema.post('save', async function() {
  if (this.status === 'active') {
    const League = mongoose.model('League');
    await League.findByIdAndUpdate(this.league, { 
      currentSeason: this.name,
      currentSeasonId: this._id 
    });
  }
});

export default mongoose.models.Season || mongoose.model('Season', SeasonSchema);