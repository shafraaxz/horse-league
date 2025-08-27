// models/Transfer.js
import mongoose from 'mongoose';

const TransferSchema = new mongoose.Schema({
  league: { type: mongoose.Schema.Types.ObjectId, ref: 'League', index: true },
  player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true, index: true },
  fromTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  toTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  fee: { type: String },
  season: { type: String },
  date: { type: Date, default: Date.now },
  notes: { type: String }
}, { timestamps: true });

export default mongoose.models.Transfer || mongoose.model('Transfer', TransferSchema);

