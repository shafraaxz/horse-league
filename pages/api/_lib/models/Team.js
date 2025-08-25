import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true,
    minlength: [2, 'Team name must be at least 2 characters'],
    maxlength: [100, 'Team name cannot exceed 100 characters']
  },
  coach: {
    type: String,
    required: [true, 'Coach name is required'],
    trim: true,
    maxlength: [100, 'Coach name cannot exceed 100 characters']
  },
  founded: {
    type: Number,
    min: [1900, 'Founded year must be after 1900'],
    max: [new Date().getFullYear(), 'Founded year cannot be in the future']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },

  // Contact Information
  venue: {
    type: String,
    maxlength: [200, 'Venue name cannot exceed 200 characters']
  },
  contactEmail: {
    type: String,
    lowercase: true,
    validate: {
      validator: function(v) {
        return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  contactPhone: {
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
  },

  // Visual Identity
  colors: {
    primary: {
      type: String,
      default: '#3B82F6',
      match: /^#[0-9A-F]{6}$/i
    },
    secondary: {
      type: String,
      default: '#1E40AF',
      match: /^#[0-9A-F]{6}$/i
    }
  },
  logo: {
    type: String, // Cloudinary URL
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Logo must be a valid URL'
    }
  },

  // Season and Category
  season: {
    type: String,
    required: [true, 'Season is required'],
    index: true
  },
  category: {
    type: String,
    enum: ['youth', 'senior', 'veteran', 'women', 'mixed'],
    default: 'senior'
  },
  division: {
    type: String,
    enum: ['first', 'second', 'third', 'amateur'],
    default: 'first'
  },
  maxPlayers: {
    type: Number,
    default: 15,
    min: [5, 'Team must have at least 5 players'],
    max: [30, 'Team cannot have more than 30 players']
  },

  // Performance Statistics (season-specific)
  wins: {
    type: Number,
    default: 0,
    min: [0, 'Wins cannot be negative']
  },
  losses: {
    type: Number,
    default: 0,
    min: [0, 'Losses cannot be negative']
  },
  draws: {
    type: Number,
    default: 0,
    min: [0, 'Draws cannot be negative']
  },
  points: {
    type: Number,
    default: 0,
    min: [0, 'Points cannot be negative']
  },
  goalsFor: {
    type: Number,
    default: 0,
    min: [0, 'Goals for cannot be negative']
  },
  goalsAgainst: {
    type: Number,
    default: 0,
    min: [0, 'Goals against cannot be negative']
  },
  playerCount: {
    type: Number,
    default: 0,
    min: [0, 'Player count cannot be negative']
  },

  // Player Management
  players: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  }],

  // Match History
  matches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
teamSchema.index({ season: 1 });
teamSchema.index({ name: 'text' });
teamSchema.index({ season: 1, division: 1 });
teamSchema.index({ season: 1, category: 1 });
teamSchema.index({ name: 1, season: 1 }, { unique: true });

// Virtual for total matches played
teamSchema.virtual('matchesPlayed').get(function() {
  return this.wins + this.losses + this.draws;
});

// Virtual for win percentage
teamSchema.virtual('winPercentage').get(function() {
  const totalMatches = this.matchesPlayed;
  return totalMatches > 0 ? Math.round((this.wins / totalMatches) * 100) : 0;
});

// Virtual for goal difference
teamSchema.virtual('goalDifference').get(function() {
  return this.goalsFor - this.goalsAgainst;
});

// Pre-save middleware to calculate points automatically
teamSchema.pre('save', function(next) {
  this.points = (this.wins * 3) + (this.draws * 1);
  next();
});

export default mongoose.models.Team || mongoose.model('Team', teamSchema);