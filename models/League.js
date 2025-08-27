// models/League.js - Updated for The Horse Futsal League
import mongoose from 'mongoose';

const LeagueSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    default: 'The Horse Futsal League'
  },
  shortName: {
    type: String,
    trim: true,
    maxlength: 20,
    default: 'HFL'
  },
  slug: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true,
    default: 'the-horse-futsal-league'
  },
  
  // League Type and Sport
  type: {
    type: String,
    enum: ['league', 'cup', 'tournament'],
    default: 'league'
  },
  sport: {
    type: String,
    enum: ['football', 'futsal'],
    default: 'futsal', // Changed default to futsal
    required: true
  },
  
  // League Description and Branding
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: 'The premier futsal competition featuring the best teams and players'
  },
  logo: {
    type: String, // Cloudinary URL
    default: null
  },
  logoPublicId: {
    type: String // Cloudinary Public ID for deletion
  },
  banner: {
    type: String, // Cloudinary URL for banner/cover image
    default: null
  },
  bannerPublicId: {
    type: String
  },
  
  // League Status and Dates
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'archived', 'suspended'],
    default: 'active',
    index: true
  },
  establishedDate: {
    type: Date,
    default: Date.now
  },
  
  // Current Season Information
  currentSeason: {
    type: String,
    default: '2025/26',
    match: /^\d{4}\/\d{2}$/
  },
  currentSeasonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Season',
    index: true
  },
  
  // League Configuration
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
  
  // Competition Rules
  rules: {
    matchDuration: {
      type: Number,
      default: 40, // 40 minutes for futsal (2 x 20min halves)
      min: 20,
      max: 90
    },
    halfTimeDuration: {
      type: Number,
      default: 10, // 10 minutes half-time
      min: 5,
      max: 20
    },
    substitutionsAllowed: {
      type: Number,
      default: 5, // Futsal allows unlimited substitutions, but we can set a reasonable limit
      min: 3,
      max: 10
    },
    playersOnField: {
      type: Number,
      default: 5, // Futsal has 5 players per team on field
      min: 5,
      max: 11
    }
  },
  
  // Points System
  pointsForWin: {
    type: Number,
    default: 3,
    min: 1,
    max: 5
  },
  pointsForDraw: {
    type: Number,
    default: 1,
    min: 0,
    max: 3
  },
  pointsForLoss: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  
  // League Statistics
  totalSeasons: {
    type: Number,
    default: 0
  },
  totalMatches: {
    type: Number,
    default: 0
  },
  totalGoals: {
    type: Number,
    default: 0
  },
  totalPlayers: {
    type: Number,
    default: 0
  },
  totalTeams: {
    type: Number,
    default: 0
  },
  
  // Featured Teams (for homepage display)
  featuredTeams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }],
  
  // League Records
  records: {
    highestScoringMatch: {
      match: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match'
      },
      totalGoals: {
        type: Number,
        default: 0
      },
      season: String
    },
    biggestWin: {
      match: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match'
      },
      goalDifference: {
        type: Number,
        default: 0
      },
      season: String
    },
    allTimeTopScorer: {
      player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
      },
      goals: {
        type: Number,
        default: 0
      }
    },
    mostSuccessfulTeam: {
      team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
      },
      championships: {
        type: Number,
        default: 0
      }
    }
  },
  
  // Administrative Settings
  settings: {
    allowPlayerTransfers: {
      type: Boolean,
      default: true
    },
    requirePlayerPhotos: {
      type: Boolean,
      default: true
    },
    requireMedicalCertificates: {
      type: Boolean,
      default: false
    },
    autoGenerateSchedule: {
      type: Boolean,
      default: true
    },
    publicRegistration: {
      type: Boolean,
      default: false
    },
    enableLiveScoring: {
      type: Boolean,
      default: true
    },
    enableStatistics: {
      type: Boolean,
      default: true
    }
  },
  
  // Contact and Social Information
  contact: {
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    website: {
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
    socialMedia: {
      facebook: String,
      twitter: String,
      instagram: String,
      youtube: String
    }
  },
  
  // Sponsors and Partners
  sponsors: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    logo: String, // Cloudinary URL
    website: String,
    level: {
      type: String,
      enum: ['title', 'main', 'official', 'partner'],
      default: 'partner'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // Administrative
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  administrators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['super_admin', 'admin', 'moderator', 'scorer'],
      default: 'moderator'
    },
    permissions: [{
      type: String,
      enum: [
        'manage_teams', 'manage_players', 'manage_matches', 
        'manage_seasons', 'manage_transfers', 'view_reports',
        'manage_users', 'system_settings'
      ]
    }],
    addedDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Meta Information
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isDefault: {
    type: Boolean,
    default: true // Since this is the main league
  },
  archived: {
    type: Boolean,
    default: false
  },
  
  // SEO and Metadata
  metadata: {
    keywords: [String],
    metaDescription: String,
    ogImage: String // Open Graph image for social sharing
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
LeagueSchema.index({ slug: 1 }, { unique: true });
LeagueSchema.index({ status: 1, isActive: 1 });
LeagueSchema.index({ currentSeason: 1 });
LeagueSchema.index({ sport: 1, status: 1 });

// Virtual for current season display
LeagueSchema.virtual('currentSeasonDisplay').get(function() {
  if (!this.currentSeason) return 'No Season';
  const year1 = this.currentSeason.split('/')[0];
  const year2 = '20' + this.currentSeason.split('/')[1];
  return `${year1}-${year2}`;
});

// Virtual for league age
LeagueSchema.virtual('age').get(function() {
  if (!this.establishedDate) return 0;
  const now = new Date();
  return now.getFullYear() - this.establishedDate.getFullYear();
});

// Virtual for teams count
LeagueSchema.virtual('teamsCount').get(function() {
  return this.totalTeams || 0;
});

// Static method to get the main league (since we're focusing on single league)
LeagueSchema.statics.getMainLeague = function() {
  return this.findOne({ 
    isDefault: true, 
    isActive: true 
  }).populate('currentSeasonId')
    .populate('administrators.user', 'name email role');
};

// Static method to ensure the Horse Futsal League exists
LeagueSchema.statics.ensureHorseFutsalLeague = async function() {
  let league = await this.findOne({ 
    slug: 'the-horse-futsal-league' 
  });
  
  if (!league) {
    // Create the default league if it doesn't exist
    league = await this.create({
      name: 'The Horse Futsal League',
      shortName: 'HFL',
      slug: 'the-horse-futsal-league',
      sport: 'futsal',
      description: 'The premier futsal competition featuring the best teams and players',
      status: 'active',
      isDefault: true,
      currentSeason: '2025/26',
      createdBy: null // Will be set when admin creates it
    });
  }
  
  return league;
};

// Instance method to update statistics
LeagueSchema.methods.updateStatistics = async function() {
  const Team = mongoose.model('Team');
  const Player = mongoose.model('Player');
  const Match = mongoose.model('Match');
  const Season = mongoose.model('Season');
  
  // Count totals
  this.totalTeams = await Team.countDocuments({ league: this._id, isActive: true });
  this.totalPlayers = await Player.countDocuments({ league: this._id, isActive: true });
  this.totalSeasons = await Season.countDocuments({ league: this._id, isActive: true });
  
  // Count matches and goals would require aggregation
  const matchStats = await Match.aggregate([
    { $match: { league: this._id } },
    { $group: {
        _id: null,
        totalMatches: { $sum: 1 },
        totalGoals: { $sum: { $add: ['$homeScore', '$awayScore'] } }
      }
    }
  ]);
  
  if (matchStats.length > 0) {
    this.totalMatches = matchStats[0].totalMatches || 0;
    this.totalGoals = matchStats[0].totalGoals || 0;
  }
  
  return this.save();
};

// Instance method to add administrator
LeagueSchema.methods.addAdministrator = function(userId, role = 'moderator', permissions = []) {
  // Check if user is already an admin
  const existingAdmin = this.administrators.find(admin => 
    admin.user.toString() === userId.toString()
  );
  
  if (existingAdmin) {
    throw new Error('User is already an administrator');
  }
  
  // Set default permissions based on role
  let defaultPermissions = [];
  switch (role) {
    case 'super_admin':
      defaultPermissions = [
        'manage_teams', 'manage_players', 'manage_matches', 
        'manage_seasons', 'manage_transfers', 'view_reports',
        'manage_users', 'system_settings'
      ];
      break;
    case 'admin':
      defaultPermissions = [
        'manage_teams', 'manage_players', 'manage_matches', 
        'manage_seasons', 'manage_transfers', 'view_reports'
      ];
      break;
    case 'moderator':
      defaultPermissions = ['manage_matches', 'view_reports'];
      break;
    case 'scorer':
      defaultPermissions = ['manage_matches'];
      break;
  }
  
  this.administrators.push({
    user: userId,
    role: role,
    permissions: permissions.length > 0 ? permissions : defaultPermissions
  });
  
  return this.save();
};

// Pre-save hooks
LeagueSchema.pre('save', function(next) {
  // Generate slug if not provided
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  
  // Set default short name
  if (!this.shortName && this.name) {
    // Extract first letters of each word
    this.shortName = this.name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 5);
  }
  
  next();
});

// Post-save hook to update related documents
LeagueSchema.post('save', async function() {
  // If this league becomes the default, remove default from others
  if (this.isDefault) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id }, isDefault: true },
      { isDefault: false }
    );
  }
});

export default mongoose.models.League || mongoose.model('League', LeagueSchema);