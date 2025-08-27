// models/Admin.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const AdminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['super_admin', 'league_admin', 'team_manager', 'viewer'],
    default: 'viewer'
  },
  assignedLeagues: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'League'
  }],
  assignedTeams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }],
  permissions: {
    canCreateLeague: { type: Boolean, default: false },
    canEditLeague: { type: Boolean, default: false },
    canDeleteLeague: { type: Boolean, default: false },
    canManageTeams: { type: Boolean, default: false },
    canManageMatches: { type: Boolean, default: false },
    canManagePlayers: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: true }
  },
  avatar: String,
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
AdminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
AdminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.Admin || mongoose.model('Admin', AdminSchema);
