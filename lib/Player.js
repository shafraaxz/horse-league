// models/Player.js
import mongoose from 'mongoose';

const PlayerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  jerseyNumber: {
    type: Number,
    required: true
  },
  position: {
    type: String,
    enum: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
    required: true
  },
  dateOfBirth: Date,
  nationality: String,
  height: Number,
  weight: Number,
  preferredFoot: {
    type: String,
    enum: ['Left', 'Right', 'Both']
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  statistics: {
    matchesPlayed: { type: Number, default: 0 },
    goals: { type: Number, default: 0 },
    assists: { type: Number, default: 0 },
    yellowCards: { type: Number, default: 0 },
    redCards: { type: Number, default: 0 },
    cleanSheets: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    minutesPlayed: { type: Number, default: 0 }
  },
  photo: String,
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Player || mongoose.model('Player', PlayerSchema);
