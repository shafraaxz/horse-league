// ===========================================
// FILE: models/FairPlayRecord.js (ENHANCED WITH OFFICIAL SUPPORT)
// ===========================================
import mongoose from 'mongoose';

const fairPlayRecordSchema = new mongoose.Schema({
  // Core Information
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    default: null // Null means it's a team-wide penalty or official
  },
  
  // NEW: Official/Custom name support
  customName: {
    type: String,
    default: null,
    trim: true,
    maxlength: 100
  },
  isOfficial: {
    type: Boolean,
    default: false // True for officials, false for players
  },
  
  season: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Season',
    required: true
  },
  
  // Action Details
  actionType: {
    type: String,
    required: true,
    enum: [
      'violent_conduct',
      'serious_foul_play',
      'offensive_language',
      'dissent_by_word_action',
      'unsporting_behavior',
      'referee_abuse',
      'crowd_trouble',
      'administrative_breach',
      'misconduct_off_field',
      'suspended_player_participated',
      'other'
    ]
  },
  points: {
    type: Number,
    required: true,
    min: 1 // Must be positive
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  actionDate: {
    type: Date,
    default: Date.now
  },
  reference: {
    type: String, // Case/incident reference number
    default: null,
    trim: true
  },
  
  // Administrative
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'appealed', 'overturned', 'reduced'],
    default: 'active'
  },
  
  // Appeal Information (if applicable)
  appealDate: {
    type: Date,
    default: null
  },
  appealResult: {
    type: String,
    enum: ['pending', 'upheld', 'reduced', 'overturned'],
    default: null
  },
  originalPoints: {
    type: Number,
    default: null // Store original points if reduced on appeal
  },
  appealNotes: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
fairPlayRecordSchema.index({ team: 1, season: 1 });
fairPlayRecordSchema.index({ player: 1, season: 1 });
fairPlayRecordSchema.index({ season: 1, actionDate: -1 });
fairPlayRecordSchema.index({ status: 1 });
fairPlayRecordSchema.index({ isOfficial: 1 });

// Virtual for display name
fairPlayRecordSchema.virtual('displayName').get(function() {
  if (this.isOfficial && this.customName) {
    return `${this.customName} (Official)`;
  }
  if (this.player && this.player.name) {
    return `${this.player.name} (Player)`;
  }
  if (this.customName) {
    return `${this.customName} (Custom)`;
  }
  return `${this.team?.name || 'Unknown Team'} (Team)`;
});

// Virtual for subject type
fairPlayRecordSchema.virtual('subjectType').get(function() {
  if (this.isOfficial) return 'official';
  if (this.player) return 'player';
  return 'team';
});

// Pre-save validation
fairPlayRecordSchema.pre('save', function(next) {
  // Ensure either player or customName is provided for officials
  if (this.isOfficial && !this.customName) {
    return next(new Error('Custom name is required for official misconduct'));
  }
  
  // Ensure player is provided for non-officials (unless it's a team penalty)
  if (!this.isOfficial && !this.player && !this.customName) {
    return next(new Error('Either player or custom name must be provided'));
  }
  
  // Clear player field if it's an official
  if (this.isOfficial) {
    this.player = null;
  }
  
  next();
});

// Ensure virtuals are included in JSON
fairPlayRecordSchema.set('toJSON', { virtuals: true });
fairPlayRecordSchema.set('toObject', { virtuals: true });

const FairPlayRecord = mongoose.models.FairPlayRecord || mongoose.model('FairPlayRecord', fairPlayRecordSchema);

export default FairPlayRecord;
