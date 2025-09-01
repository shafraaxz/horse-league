import mongoose from 'mongoose';

const SeasonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  maxTeams: {
    type: Number,
    default: 16,
  },
  registrationDeadline: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    default: '',
  }
}, {
  timestamps: true,
});

export default mongoose.models.Season || mongoose.model('Season', SeasonSchema);
