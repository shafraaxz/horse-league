import mongoose from 'mongoose';

const seasonSchema = new mongoose.Schema({
  // Season Identification
  id: {
    type: String,
    required: [true, 'Season ID is required'],
    unique: true,
    trim: true,
    match: [/^\d{4}\/\d{2}$/, 'Season ID must be in format YYYY/YY (e.g., 2025/26)']
  },
  name: {
    type: String,
    required: [true, 'Season name is required'],
    trim: true,
    maxlength: [100, 'Season name cannot exceed 100 characters']
  },
  displayName: {
    type: String, // e.g., "2025/26 Season", "Championship 2025/26"
    maxlength: [150, 'Display name cannot exceed 150 characters']
  },

  // Season Years
  startYear: {
    type: Number,
    required: [true, 'Start year is required'],
    min: [2020, 'Start year must be 2020 or later'],
    max: [2050, 'Start year cannot exceed 2050']
  },
  endYear: {
    type: Number,
    required: [true, 'End year is required'],
    validate: {
      validator: function(v) {
        return v === this.startYear + 1;
      },
      message: 'End year must be start year + 1'
    }
  },

  // Season Status
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed', 'cancelled', 'archived'],
    default: 'upcoming',
    index: true
  },

  // Important Dates
  startDate: {
    type: Date,
    required: [true, 'Season start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'Season end date is required'],
    validate: {
      validator: function(v) {
        return v > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  registrationStart: {
    type: Date
  },
  registrationEnd: {
    type: Date,
    validate: {
      validator: function(v) {
        return !this.registrationStart || v > this.registrationStart;
      },
      message: 'Registration end must be after registration start'
    }
  },
  transferWindowStart: {
    type: Date
  },
  transferWindowEnd: {
    type: Date,
    validate: {
      validator: function(v) {
        return !this.transferWindowStart || v > this.transferWindowStart;
      },
      message: 'Transfer window end must be after transfer window start'
    }
  },

  // Season Settings and Rules
  settings: {
    maxTeams: {
      type: Number,
      default: 16,
      min: [4, 'Minimum 4 teams required'],
      max: [32, 'Maximum 32 teams allowed']
    },
    maxPlayersPerTeam: {
      type: Number,
      default: 15,
      min: [5, 'Minimum 5 players per team'],
      max: [30, 'Maximum 30 players per team']
    },
    minPlayersPerTeam: {
      type: Number,
      default: 7,
      min: [5, 'Minimum 5 players required'],
      max: [15, 'Cannot exceed max players per team']
    },
    matchDuration: {
      type: Number,
      default: 40, // minutes
      min: [20, 'Match duration must be at least 20 minutes'],
      max: [90, 'Match duration cannot exceed 90 minutes']
    },
    pointsForWin: {
      type: Number,
      default: 3,
      min: [1, 'Points for win must be at least 1']
    },
    pointsForDraw: {
      type: Number,
      default: 1,
      min: [0, 'Points for draw cannot be negative']
    },
    pointsForLoss: {
      type: Number,
      default: 0,
      min: [0, 'Points for loss cannot be negative']
    },
    allowExtraTime: {
      type: Boolean,
      default: false
    },
    allowPenalties: {
      type: Boolean,
      default: false
    },
    maxSubstitutions: {
      type: Number,
      default: 5,
      min: [0, 'Substitutions cannot be negative'],
      max: [7, 'Maximum 7 substitutions allowed']
    },
    // Financial Rules
    salaryCapEnabled: {
      type: Boolean,
      default: false
    },
    salaryCap: {
      type: Number,
      min: [0, 'Salary cap cannot be negative']
    },
    transferFeeLimit: {
      type: Number,
      min: [0, 'Transfer fee limit cannot be negative']
    }
  },

  // Season Statistics
  stats: {
    totalTeams: {
      type: Number,
      default: 0,
      min: [0, 'Total teams cannot be negative']
    },
    totalPlayers: {
      type: Number,
      default: 0,
      min: [0, 'Total players cannot be negative']
    },
    totalMatches: {
      type: Number,
      default: 0,
      min: [0, 'Total matches cannot be negative']
    },
    completedMatches: {
      type: Number,
      default: 0,
      min: [0, 'Completed matches cannot be negative']
    },
    totalGoals: {
      type: Number,
      default: 0,
      min: [0, 'Total goals cannot be negative']
    },
    totalTransfers: {
      type: Number,
      default: 0,
      min: [0, 'Total transfers cannot be negative']
    },
    totalTransferValue: {
      type: Number,
      default: 0,
      min: [0, 'Total transfer value cannot be negative']
    }
  },

  // Competition Format
  format: {
    type: {
      type: String,
      enum: ['league', 'knockout', 'group-then-knockout', 'round-robin'],
      default: 'league'
    },
    rounds: {
      type: Number,
      default: 1,
      min: [1, 'Must have at least 1 round']
    },
    homeAndAway: {
      type: Boolean,
      default: true
    },
    playoffs: {
      enabled: {
        type: Boolean,
        default: false
      },
      teams: {
        type: Number,
        default: 4,
        min: [2, 'Playoffs need at least 2 teams']
      }
    }
  },

  // Awards and Recognition
  awards: {
    champion: {
      teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
      },
      teamName: String
    },
    runnerUp: {
      teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
      },
      teamName: String
    },
    topScorer: {
      playerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
      },
      playerName: String,
      goals: {
        type: Number,
        min: [0, 'Goals cannot be negative']
      }
    },
    bestPlayer: {
      playerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
      },
      playerName: String
    },
    fairPlayTeam: {
      teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
      },
      teamName: String
    }
  },

  // Administrative Information
  organizer: {
    name: {
      type: String,
      default: 'Horse Futsal League',
      maxlength: [200, 'Organizer name cannot exceed 200 characters']
    },
    contact: {
      email: {
        type: String,
        validate: {
          validator: function(v) {
            return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
          },
          message: 'Please enter a valid email address'
        }
      },
      phone: {
        type: String,
        validate: {
          validator: function(v) {
            return !v || /^[\+]?[\d\s\-\(\)]+$/.test(v);
          },
          message: 'Please enter a valid phone number'
        }
      },
      website: {
        type: String,
        validate: {
          validator: function(v) {
            return !v || /^https?:\/\/.+\..+/.test(v);
          },
          message: 'Please enter a valid website URL'
        }
      }
    }
  },

  // Season Description and Notes
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },

  // Media and Assets
  logo: {
    type: String, // Cloudinary URL
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Logo must be a valid URL'
    }
  },
  sponsors: [{
    name: {
      type: String,
      required: true,
      maxlength: [100, 'Sponsor name cannot exceed 100 characters']
    },
    logo: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'Sponsor logo must be a valid URL'
      }
    },
    website: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/.+\..+/.test(v);
        },
        message: 'Sponsor website must be a valid URL'
      }
    },
    tier: {
      type: String,
      enum: ['title', 'main', 'official', 'supporter'],
      default: 'supporter'
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
seasonSchema.index({ id: 1 }, { unique: true });
seasonSchema.index({ status: 1 });
seasonSchema.index({ startYear: 1 });
seasonSchema.index({ startDate: 1 });

// Virtual for season progress
seasonSchema.virtual('progress').get(function() {
  const now = new Date();
  const total = this.endDate - this.startDate;
  const elapsed = Math.max(0, Math.min(now - this.startDate, total));
  return Math.round((elapsed / total) * 100);
});

// Virtual for registration status
seasonSchema.virtual('registrationOpen').get(function() {
  if (!this.registrationStart || !this.registrationEnd) return false;
  const now = new Date();
  return now >= this.registrationStart && now <= this.registrationEnd;
});

// Virtual for transfer window status
seasonSchema.virtual('transferWindowOpen').get(function() {
  if (!this.transferWindowStart || !this.transferWindowEnd) return true; // Always open if not set
  const now = new Date();
  return now >= this.transferWindowStart && now <= this.transferWindowEnd;
});

// Virtual for season duration in days
seasonSchema.virtual('duration').get(function() {
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

// Virtual for matches per team
seasonSchema.virtual('matchesPerTeam').get(function() {
  if (this.stats.totalTeams <= 1) return 0;
  const teamsMinusOne = this.stats.totalTeams - 1;
  return this.format.homeAndAway ? teamsMinusOne * 2 * this.format.rounds : teamsMinusOne * this.format.rounds;
});

// Pre-save middleware
seasonSchema.pre('save', function(next) {
  // Set display name if not provided
  if (!this.displayName) {
    this.displayName = `${this.name} Season`;
  }
  
  // Validate settings consistency
  if (this.settings.minPlayersPerTeam > this.settings.maxPlayersPerTeam) {
    return next(new Error('Minimum players per team cannot exceed maximum players per team'));
  }
  
  next();
});

// Instance methods
seasonSchema.methods.activate = function() {
  // Deactivate other seasons first
  return this.constructor.updateMany(
    { _id: { $ne: this._id } },
    { status: 'completed' }
  ).then(() => {
    this.status = 'active';
    return this.save();
  });
};

seasonSchema.methods.complete = function(awards = {}) {
  this.status = 'completed';
  if (awards.champion) this.awards.champion = awards.champion;
  if (awards.runnerUp) this.awards.runnerUp = awards.runnerUp;
  if (awards.topScorer) this.awards.topScorer = awards.topScorer;
  if (awards.bestPlayer) this.awards.bestPlayer = awards.bestPlayer;
  if (awards.fairPlayTeam) this.awards.fairPlayTeam = awards.fairPlayTeam;
  return this.save();
};

seasonSchema.methods.updateStats = function(stats) {
  Object.keys(stats).forEach(key => {
    if (this.stats.hasOwnProperty(key)) {
      this.stats[key] = stats[key];
    }
  });
  return this.save();
};

seasonSchema.methods.addSponsor = function(sponsor) {
  this.sponsors.push(sponsor);
  return this.save();
};

// Static methods
seasonSchema.statics.getActiveSeason = function() {
  return this.findOne({ status: 'active' });
};

seasonSchema.statics.getCurrentSeasons = function() {
  const now = new Date();
  return this.find({
    startDate: { $lte: now },
    endDate: { $gte: now }
  }).sort({ startDate: -1 });
};

seasonSchema.statics.createNewSeason = function(startYear) {
  const endYear = startYear + 1;
  const id = `${startYear}/${endYear.toString().slice(-2)}`;
  
  return this.create({
    id,
    name: id,
    startYear,
    endYear,
    startDate: new Date(startYear, 8, 1), // September 1st
    endDate: new Date(endYear, 4, 31), // May 31st
    status: 'upcoming'
  });
};

export default mongoose.models.Season || mongoose.model('Season', seasonSchema);