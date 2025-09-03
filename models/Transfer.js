// ===========================================
// FILE: models/Transfer.js (MINIMAL FIX - Just remove required from toTeam)
// ===========================================
import mongoose from 'mongoose';

const TransferSchema = new mongoose.Schema({
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true,
  },
  fromTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null, // null for first registration
  },
  toTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null, // FIXED: Removed required: true to allow free agent releases
  },
  season: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Season',
    required: true,
  },
  transferDate: {
    type: Date,
    default: Date.now,
  },
  transferFee: {
    type: Number,
    default: 0,
  },
  transferType: {
    type: String,
    enum: ['registration', 'transfer', 'loan', 'release'], // Added 'release' for free agent moves
    default: 'registration',
  },
  notes: {
    type: String,
    default: '',
  }
}, {
  timestamps: true,
});

export default mongoose.models.Transfer || mongoose.model('Transfer', TransferSchema);
