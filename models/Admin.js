// models/Admin.js - Fixed and simplified version
import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'], // Changed from 8 to 6
    select: false // Don't return password by default
  },
  role: {
    type: String,
    enum: ['super_admin', 'league_admin', 'team_manager', 'viewer'],
    default: 'viewer',
    required: true
  },
  assignedLeagues: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'League'
  }],
  permissions: {
    canCreateLeague: { type: Boolean, default: false },
    canEditLeague: { type: Boolean, default: false },
    canDeleteLeague: { type: Boolean, default: false },
    canManageTeams: { type: Boolean, default: false },
    canManageMatches: { type: Boolean, default: false },
    canManagePlayers: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: true },
    canManageAdmins: { type: Boolean, default: false }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockedUntil: {
    type: Date,
    default: null
  }
}, {
  timestamps: true, // This adds createdAt and updatedAt automatically
  // Remove password from JSON output by default
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

// Indexes for better performance
AdminSchema.index({ email: 1 });
AdminSchema.index({ role: 1 });
AdminSchema.index({ isActive: 1 });

// Static method to check if any admin exists
AdminSchema.statics.hasAnyAdmin = async function() {
  const count = await this.countDocuments();
  return count > 0;
};

// Check if model exists before creating to avoid OverwriteModelError
const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

export default Admin;