import mongoose from 'mongoose';

const TeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  logo: {
    url: String,
    publicId: String,
  },
  foundedYear: {
    type: Number,
  },
  description: {
    type: String,
    default: '',
  },
  homeColor: {
    type: String,
    default: '#ffffff',
  },
  awayColor: {
    type: String,
    default: '#000000',
  },
  manager: {
    type: String,
    default: '',
  },
  contact: {
    email: String,
    phone: String,
  },
  season: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Season',
    required: true,
  },
  stats: {
    matchesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    goalsFor: { type: Number, default: 0 },
    goalsAgainst: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
});

export default mongoose.models.Team || mongoose.model('Team', TeamSchema);
