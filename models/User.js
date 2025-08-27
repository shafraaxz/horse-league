// models/User.js - User Model for Authentication
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-zA-Z0-9_]+$/
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  
  // Role and Permissions
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'moderator', 'scorer', 'user'],
    default: 'user',
    index: true
  },
  permissions: [{
    type: String,
    enum: [
      'manage_teams', 
      'manage_players', 
      'manage_matches',
      'manage_seasons', 
      'manage_transfers', 
      'view_reports',
      'manage_users', 
      'system_settings'
    ]
  }],
  
  // Profile Information
  avatar: {
    type: String // URL to profile picture
  },
  phone: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    maxlength: 500
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  
  // Activity Tracking
  lastLogin: {
    type: Date
  },
  loginCount: {
    type: Number,
    default: 0
  },
  
  // Password Reset
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  
  // Email Verification
  emailVerificationToken: {
    type: String
  },
  emailVerificationExpires: {
    type: Date
  },
  
  // Preferences
  preferences: {
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    }
  },
  
  // League Association (for multi-league support)
  leagues: [{
    league: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'League'
    },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'scorer'],
      default: 'moderator'
    },
    joinedDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Audit Trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Additional Notes
  notes: {
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.resetPasswordToken;
      delete ret.emailVerificationToken;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for performance
UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ lastLogin: -1 });
UserSchema.index({ 'leagues.league': 1 });

// Virtual for full name display
UserSchema.virtual('displayName').get(function() {
  return this.name || this.username;
});

// Virtual to check if user is admin
UserSchema.virtual('isAdmin').get(function() {
  return ['super_admin', 'admin'].includes(this.role);
});

// Virtual to check if user can moderate
UserSchema.virtual('canModerate').get(function() {
  return ['super_admin', 'admin', 'moderator'].includes(this.role);
});

// Static method to find active users
UserSchema.statics.findActiveUsers = function(role = null) {
  const query = { isActive: true };
  if (role) query.role = role;
  
  return this.find(query)
    .select('-password')
    .sort({ lastLogin: -1 });
};

// Static method to find users by league
UserSchema.statics.findByLeague = function(leagueId) {
  return this.find({
    'leagues.league': leagueId,
    isActive: true
  }).select('-password')
    .populate('leagues.league', 'name shortName')
    .sort({ name: 1 });
};

// Instance method to check permissions
UserSchema.methods.hasPermission = function(permission) {
  // Super admin has all permissions
  if (this.role === 'super_admin') return true;
  
  // Check if user has specific permission
  return this.permissions.includes(permission);
};

// Instance method to add league association
UserSchema.methods.addToLeague = function(leagueId, role = 'moderator') {
  // Check if already associated with this league
  const existingAssociation = this.leagues.find(
    l => l.league.toString() === leagueId.toString()
  );
  
  if (existingAssociation) {
    existingAssociation.role = role;
  } else {
    this.leagues.push({
      league: leagueId,
      role: role,
      joinedDate: new Date()
    });
  }
  
  return this.save();
};

// Instance method to remove league association
UserSchema.methods.removeFromLeague = function(leagueId) {
  this.leagues = this.leagues.filter(
    l => l.league.toString() !== leagueId.toString()
  );
  
  return this.save();
};

// Instance method to update login info
UserSchema.methods.updateLoginInfo = function() {
  this.lastLogin = new Date();
  this.loginCount = (this.loginCount || 0) + 1;
  return this.save();
};

// Pre-save middleware
UserSchema.pre('save', function(next) {
  // Ensure username and email are lowercase
  if (this.isModified('username')) {
    this.username = this.username.toLowerCase();
  }
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase();
  }
  
  // Set default permissions based on role
  if (this.isModified('role') && (!this.permissions || this.permissions.length === 0)) {
    switch (this.role) {
      case 'super_admin':
        this.permissions = [
          'manage_teams', 'manage_players', 'manage_matches',
          'manage_seasons', 'manage_transfers', 'view_reports',
          'manage_users', 'system_settings'
        ];
        break;
      case 'admin':
        this.permissions = [
          'manage_teams', 'manage_players', 'manage_matches',
          'manage_seasons', 'manage_transfers', 'view_reports'
        ];
        break;
      case 'moderator':
        this.permissions = ['manage_matches', 'view_reports'];
        break;
      case 'scorer':
        this.permissions = ['manage_matches'];
        break;
      default:
        this.permissions = [];
    }
  }
  
  next();
});

// Pre-remove middleware
UserSchema.pre('remove', function(next) {
  // Could add cleanup logic here (remove user references from other collections)
  next();
});

export default mongoose.models.User || mongoose.model('User', UserSchema);