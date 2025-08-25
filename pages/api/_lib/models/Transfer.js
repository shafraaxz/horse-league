import mongoose from 'mongoose';

const transferSchema = new mongoose.Schema({
  // Player Information
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: [true, 'Player ID is required']
  },
  playerName: {
    type: String,
    required: [true, 'Player name is required'],
    trim: true
  },

  // Transfer Teams
  fromTeam: {
    type: String,
    default: 'Free Agent' // For players not currently with a team
  },
  fromTeamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null // null for free agents
  },
  toTeam: {
    type: String,
    required: [true, 'Destination team is required']
  },
  toTeamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: [true, 'Destination team ID is required']
  },

  // Transfer Details
  transferType: {
    type: String,
    enum: ['permanent', 'loan', 'free'],
    required: [true, 'Transfer type is required'],
    default: 'permanent'
  },
  transferFee: {
    type: Number,
    default: 0,
    min: [0, 'Transfer fee cannot be negative'],
    max: [10000000, 'Transfer fee seems unrealistic'] // 10 million max
  },
  currency: {
    type: String,
    default: 'MVR', // Maldivian Rufiyaa
    enum: ['MVR', 'USD', 'EUR', 'GBP']
  },

  // Contract Details (for loans)
  contractDuration: {
    type: Number, // months
    min: [1, 'Contract duration must be at least 1 month'],
    max: [24, 'Contract duration cannot exceed 24 months'],
    validate: {
      validator: function(v) {
        return this.transferType !== 'loan' || (v && v > 0);
      },
      message: 'Contract duration is required for loan transfers'
    }
  },
  loanFee: {
    type: Number,
    default: 0,
    min: [0, 'Loan fee cannot be negative']
  },

  // Important Dates
  transferDate: {
    type: Date,
    required: [true, 'Transfer date is required'],
    default: Date.now
  },
  effectiveDate: {
    type: Date,
    required: [true, 'Effective date is required'],
    validate: {
      validator: function(v) {
        return v >= new Date(Date.now() - 24 * 60 * 60 * 1000); // Not more than 1 day in the past
      },
      message: 'Effective date cannot be too far in the past'
    }
  },
  expiryDate: {
    type: Date,
    validate: {
      validator: function(v) {
        return this.transferType !== 'loan' || (v && v > this.effectiveDate);
      },
      message: 'Expiry date is required for loans and must be after effective date'
    }
  },

  // Season Information
  season: {
    type: String,
    required: [true, 'Season is required'],
    index: true
  },

  // Transfer Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'expired'],
    default: 'completed',
    index: true
  },

  // Additional Information
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  reason: {
    type: String,
    enum: ['new_signing', 'team_change', 'loan_move', 'contract_renewal', 'release', 'other'],
    default: 'team_change'
  },

  // Medical and Administrative
  medicalCompleted: {
    type: Boolean,
    default: false
  },
  contractSigned: {
    type: Boolean,
    default: false
  },
  registrationCompleted: {
    type: Boolean,
    default: false
  },

  // Financial Terms
  wages: {
    type: Number,
    min: [0, 'Wages cannot be negative']
  },
  bonuses: {
    signingBonus: {
      type: Number,
      default: 0,
      min: [0, 'Signing bonus cannot be negative']
    },
    performanceBonus: {
      type: Number,
      default: 0,
      min: [0, 'Performance bonus cannot be negative']
    }
  },

  // Approval and Processing
  approvedBy: {
    type: String, // Admin who approved the transfer
    maxlength: [100, 'Approver name cannot exceed 100 characters']
  },
  approvedAt: {
    type: Date
  },
  processedBy: {
    type: String, // Admin who processed the transfer
    maxlength: [100, 'Processor name cannot exceed 100 characters']
  },

  // Related Documents
  documents: [{
    name: {
      type: String,
      required: true,
      maxlength: [200, 'Document name cannot exceed 200 characters']
    },
    url: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Document URL must be valid'
      }
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
transferSchema.index({ season: 1 });
transferSchema.index({ playerId: 1 });
transferSchema.index({ transferDate: 1 });
transferSchema.index({ status: 1 });
transferSchema.index({ toTeamId: 1 });
transferSchema.index({ fromTeamId: 1 });
transferSchema.index({ season: 1, status: 1 });
transferSchema.index({ season: 1, transferDate: -1 });

// Virtual for transfer direction
transferSchema.virtual('isIncoming').get(function() {
  return this.fromTeam === 'Free Agent' || !this.fromTeamId;
});

// Virtual for transfer value formatted
transferSchema.virtual('transferFeeFormatted').get(function() {
  if (this.transferFee === 0) return 'Free Transfer';
  return `${this.currency} ${this.transferFee.toLocaleString()}`;
});

// Virtual for transfer status color
transferSchema.virtual('statusColor').get(function() {
  const colors = {
    pending: 'yellow',
    completed: 'green',
    cancelled: 'red',
    expired: 'gray'
  };
  return colors[this.status] || 'gray';
});

// Virtual for loan return date
transferSchema.virtual('loanReturnDate').get(function() {
  if (this.transferType !== 'loan' || !this.effectiveDate || !this.contractDuration) {
    return null;
  }
  const returnDate = new Date(this.effectiveDate);
  returnDate.setMonth(returnDate.getMonth() + this.contractDuration);
  return returnDate;
});

// Pre-save middleware
transferSchema.pre('save', function(next) {
  // Set expiry date for loans
  if (this.transferType === 'loan' && this.effectiveDate && this.contractDuration && !this.expiryDate) {
    this.expiryDate = new Date(this.effectiveDate);
    this.expiryDate.setMonth(this.expiryDate.getMonth() + this.contractDuration);
  }
  
  // Set approval date if approved
  if (this.status === 'completed' && this.approvedBy && !this.approvedAt) {
    this.approvedAt = new Date();
  }
  
  next();
});

// Instance methods
transferSchema.methods.complete = function(approvedBy) {
  this.status = 'completed';
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  this.medicalCompleted = true;
  this.contractSigned = true;
  this.registrationCompleted = true;
  return this.save();
};

transferSchema.methods.cancel = function(reason) {
  this.status = 'cancelled';
  this.notes = this.notes ? `${this.notes}\nCancelled: ${reason}` : `Cancelled: ${reason}`;
  return this.save();
};

transferSchema.methods.addDocument = function(document) {
  this.documents.push({
    ...document,
    uploadedAt: new Date()
  });
  return this.save();
};

// Static methods
transferSchema.statics.findBySeason = function(season) {
  return this.find({ season }).populate('playerId toTeamId fromTeamId');
};

transferSchema.statics.findByPlayer = function(playerId, season = null) {
  const query = { playerId };
  if (season) query.season = season;
  return this.find(query).sort({ transferDate: -1 });
};

transferSchema.statics.findByTeam = function(teamId, season = null) {
  const query = {
    $or: [
      { toTeamId: teamId },
      { fromTeamId: teamId }
    ]
  };
  if (season) query.season = season;
  return this.find(query).populate('playerId').sort({ transferDate: -1 });
};

transferSchema.statics.findRecent = function(season = null, limit = 10) {
  const query = { status: 'completed' };
  if (season) query.season = season;
  return this.find(query)
    .populate('playerId toTeamId fromTeamId')
    .sort({ transferDate: -1 })
    .limit(limit);
};

transferSchema.statics.getTransferStats = function(season) {
  return this.aggregate([
    { $match: { season, status: 'completed' } },
    {
      $group: {
        _id: null,
        totalTransfers: { $sum: 1 },
        totalValue: { $sum: '$transferFee' },
        averageValue: { $avg: '$transferFee' },
        freeTransfers: {
          $sum: { $cond: [{ $eq: ['$transferFee', 0] }, 1, 0] }
        },
        loanTransfers: {
          $sum: { $cond: [{ $eq: ['$transferType', 'loan'] }, 1, 0] }
        }
      }
    }
  ]);
};

export default mongoose.models.Transfer || mongoose.model('Transfer', transferSchema);