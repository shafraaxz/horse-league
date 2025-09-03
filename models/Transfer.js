// ===========================================
// FILE: models/Transfer.js (FIXED - Allow null toTeam for free agent moves)
// ===========================================
import mongoose from 'mongoose';

const transferSchema = new mongoose.Schema({
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true,
    index: true
  },
  fromTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null // Can be null for initial registrations
  },
  toTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null // FIXED: Can be null for free agent releases
  },
  season: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Season',
    required: true,
    index: true
  },
  transferDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  transferType: {
    type: String,
    enum: [
      'registration',    // Initial player registration
      'transfer',        // Team to team transfer
      'loan',           // Temporary loan
      'return_from_loan', // Return from loan
      'release',        // Release to free agency
      'retirement'      // Player retirement
    ],
    default: 'transfer'
  },
  transferFee: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'completed'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Admin who approved the transfer
  },
  approvedDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  // Additional metadata
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
transferSchema.index({ player: 1, transferDate: -1 });
transferSchema.index({ season: 1, transferDate: -1 });
transferSchema.index({ fromTeam: 1, transferDate: -1 });
transferSchema.index({ toTeam: 1, transferDate: -1 });
transferSchema.index({ transferType: 1 });
transferSchema.index({ status: 1 });

// Virtual for transfer description
transferSchema.virtual('description').get(function() {
  if (this.transferType === 'registration' && !this.fromTeam) {
    return this.toTeam ? 'Initial registration' : 'Registered as free agent';
  }
  if (this.transferType === 'release' && !this.toTeam) {
    return 'Released to free agency';
  }
  if (this.transferType === 'transfer' && this.fromTeam && this.toTeam) {
    return 'Transfer between teams';
  }
  return `${this.transferType.charAt(0).toUpperCase() + this.transferType.slice(1)}`;
});

// Method to get transfer direction
transferSchema.methods.getDirection = function() {
  if (!this.fromTeam && this.toTeam) return 'incoming'; // Joining from free agency
  if (this.fromTeam && !this.toTeam) return 'outgoing'; // Leaving to free agency
  if (this.fromTeam && this.toTeam) return 'transfer'; // Team to team
  return 'registration'; // Initial registration as free agent
};

// FIXED: Remove validation that required toTeam
// Pre-save validation - ensure at least one team is involved (except for free agent registrations)
transferSchema.pre('save', function(next) {
  // Allow transfers where both teams are null for free agent registrations
  if (!this.fromTeam && !this.toTeam && this.transferType !== 'registration') {
    return next(new Error('Transfer must involve at least one team'));
  }
  
  // Auto-approve certain transfer types
  if (['registration', 'release'].includes(this.transferType) && this.status === 'pending') {
    this.status = 'completed';
    this.approvedDate = new Date();
  }
  
  next();
});

export default mongoose.models.Transfer || mongoose.model('Transfer', transferSchema);
