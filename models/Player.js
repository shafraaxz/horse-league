import mongoose from 'mongoose';

const PlayerSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  nationality: {
    type: String,
    required: true,
  },
  position: {
    type: String,
    enum: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
    required: true,
  },
  jerseyNumber: {
    type: Number,
    min: 1,
    max: 99,
  },
  photo: {
    url: String,
    publicId: String,
  },
  currentTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null,
  },
  season: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Season',
    required: true,
  },
  stats: {
    matchesPlayed: { type: Number, default: 0 },
    goals: { type: Number, default: 0 },
    assists: { type: Number, default: 0 },
    yellowCards: { type: Number, default: 0 },
    redCards: { type: Number, default: 0 },
    minutesPlayed: { type: Number, default: 0 },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  registrationDate: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

// Ensure jersey number is unique per team per season
PlayerSchema.index({ jerseyNumber: 1, currentTeam: 1, season: 1 }, { 
  unique: true, 
  sparse: true 
});

export default mongoose.models.Player || mongoose.model('Player', PlayerSchema);
