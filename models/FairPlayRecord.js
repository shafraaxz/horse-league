// ===========================================
// FILE: models/FairPlay.js (NEW - Fair Play Model)
// ===========================================
import mongoose from 'mongoose';

const fairPlaySchema = new mongoose.Schema({
  team: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Team', 
    required: true 
  },
  player: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Player' 
    // Optional - null for team-level penalties
  },
  season: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Season', 
    required: true 
  },
  match: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Match' 
    // Optional - may not be match-related
  },
  actionType: {
    type: String,
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
    ],
    required: true
  },
  points: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
    default: 5
  },
  description: {
    type: String,
    required: true,
    maxLength: 500
  },
  actionDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  reference: {
    type: String, // Case/incident reference number
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'appealed', 'overturned', 'reduced'],
    default: 'active'
  },
  appealDate: {
    type: Date
  },
  appealNotes: {
    type: String,
    maxLength: 500
  },
  originalPoints: {
    type: Number // Store original points if reduced
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
fairPlaySchema.index({ team: 1, season: 1 });
fairPlaySchema.index({ player: 1, season: 1 });
fairPlaySchema.index({ season: 1, actionDate: -1 });
fairPlaySchema.index({ status: 1 });

// Virtual for effective points (considers status)
fairPlaySchema.virtual('effectivePoints').get(function() {
  switch (this.status) {
    case 'overturned':
      return 0;
    case 'reduced':
      return this.points; // Current points after reduction
    default:
      return this.points;
  }
});

export default mongoose.models.FairPlay || mongoose.model('FairPlay', fairPlaySchema);
