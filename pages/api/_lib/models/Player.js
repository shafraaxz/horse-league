import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  // Basic Information (only name is required)
  name: {
    type: String,
    required: [true, 'Player name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  age: {
    type: Number,
    min: [10, 'Age must be at least 10'],
    max: [60, 'Age cannot exceed 60']
  },
  position: {
    type: String,
    enum: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Winger']
  },
  experience: {
    type: Number,
    min: [0, 'Experience cannot be negative'],
    max: [30, 'Experience cannot exceed 30 years']
  },

  // Contact Information (all optional)
  phone: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^[\+]?[\d\s\-\(\)]+$/.test(v);
      },
      message: 'Please enter a valid phone number'
    }
  },
  email: {
    type: String,
    lowercase: true,
    validate: {
      validator: function(v) {
        return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  address: {
    type: String,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },

  // Personal Details (all optional)
  nationality: {
    type: String,
    default: 'Maldivian',
    enum: ['Maldivian', 'Indian', 'Sri Lankan', 'Bangladeshi', 'Pakistani', 'British', 'Other']
  },
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(v) {
        return !v || v < new Date();
      },
      message: 'Date of birth cannot be in the future'
    }
  },
  height: {
    type: Number,
    min: [120, 'Height must be at least 120cm'],
    max: [220, 'Height cannot exceed 220cm']
  },
  weight: {
    type: Number,
    min: [30, 'Weight must be at least 30kg'],
    max: [150, 'Weight cannot exceed 150kg']
  },
  preferredFoot: {
    type: String,
    enum: ['right', 'left', 'both'],
    default: 'right'
  },
  jerseyNumber: {
    type: Number,
    min: [1, 'Jersey number must be at least 1'],
    max: [99, 'Jersey number cannot exceed 99']
  },

  // Emergency Contact (optional)
  emergencyContact: {
    type: String,
    maxlength: [100, 'Emergency contact name cannot exceed 100 characters']
  },
  emergencyPhone: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^[\+]?[\d\s\-\(\)]+$/.test(v);
      },
      message: 'Please enter a valid emergency phone number'
    }
  },

  // Additional Information (optional)
  previousClubs: {
    type: String,
    maxlength: [1000, 'Previous clubs cannot exceed 1000 characters']
  },
  medicalInfo: {
    type: String,
    maxlength: [1000, 'Medical information cannot exceed 1000 characters']
  },

  // Status and Team
  status: {
    type: String,
    enum: ['available', 'transferred', 'contracted', 'inactive', 'injured'],
    default: 'available'
  },
  currentTeam: {
    type: String
  },
  currentTeamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },

  // Media
  avatar: {
    type: String, // Cloudinary URL
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Avatar must be a valid URL'
    }
  },

  // Season Association
  season: {
    type: String,
    required: [true, 'Season is required'],
    index: true
  },

  // Statistics (season-specific)
  stats: {
    goals: {
      type: Number,
      default: 0,
      min: [0, 'Goals cannot be negative']
    },
    assists: {
      type: Number,
      default: 0,
      min: [0, 'Assists cannot be negative']
    },
    matches: {
      type: Number,
      default: 0,
      min: [0, 'Matches cannot be negative']
    },
    yellowCards: {
      type: Number,
      default: 0,
      min: [0, 'Yellow cards cannot be negative']
    },
    redCards: {
      type: Number,
      default: 0,
      min: [0, 'Red cards cannot be negative']
    },
    saves: {
      type: Number,
      default: 0,
      min: [0, 'Saves cannot be negative']
    },
    cleanSheets: {
      type: Number,
      default: 0,
      min: [0, 'Clean sheets cannot be negative']
    }
  },

  // Transfer History
  transfers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transfer'
  }],

  // Timestamps
  registrationDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
playerSchema.index({ season: 1 });
playerSchema.index({ status: 1 });
playerSchema.index({ currentTeamId: 1 });
playerSchema.index({ name: 'text' });
playerSchema.index({ season: 1, status: 1 });

// Virtual for calculating player rating
playerSchema.virtual('rating').get(function() {
  let rating = 50; // Base rating
  rating += Math.min((this.experience || 0) * 2, 20); // Experience bonus (max 20)
  rating += Math.min((this.stats?.goals || 0) * 0.5, 15); // Goals bonus (max 15)
  rating += Math.min((this.stats?.assists || 0) * 0.3, 10); // Assists bonus (max 10)
  rating += Math.min((this.stats?.matches || 0) * 0.1, 5); // Matches bonus (max 5)
  
  // Age factor
  if (this.age >= 18 && this.age <= 28) rating += 5; // Prime age
  else if (this.age > 35) rating -= 5; // Veteran penalty
  
  return Math.min(Math.max(Math.round(rating), 1), 100);
});

export default mongoose.models.Player || mongoose.model('Player', playerSchema);