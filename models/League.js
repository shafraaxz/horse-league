// models/League.js
import mongoose from 'mongoose';

const LeagueSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, sparse: true, trim: true },
  currentSeason: { type: String, default: '2025/26' },

  type: { type: String, enum: ['league', 'cup'], default: 'league' },
  sport: { type: String, enum: ['football', 'futsal', 'other'], default: 'football' },

  shortName: { type: String, trim: true, maxlength: 20 },
  description: { type: String, trim: true },
  logo: { type: String },
  banner: { type: String },
  rules: { type: String },

  status: { type: String, enum: ['draft', 'active', 'completed', 'archived'], default: 'active' },
  startDate: { type: Date },
  endDate: { type: Date },

  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

LeagueSchema.virtual('teamsCount').get(function () {
  return Array.isArray(this.teams) ? this.teams.length : 0;
});

export default mongoose.models.League || mongoose.model('League', LeagueSchema);
