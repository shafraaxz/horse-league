import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  // Teams
  homeTeam: {
    type: String,
    required: [true, 'Home team is required']
  },
  homeTeamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: [true, 'Home team ID is required']
  },
  awayTeam: {
    type: String,
    required: [true, 'Away team is required']
  },
  awayTeamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: [true, 'Away team ID is required']
  },

  // Schedule Information
  date: {
    type: Date,
    required: [true, 'Match date is required']
  },
  time: {
    type: String, // Format: "19:00"
    validate: {
      validator: function(v) {
        return !v || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Time must be in HH:MM format'
    }
  },
  venue: {
    type: String,
    required: [true, 'Venue is required'],
    maxlength: [200, 'Venue cannot exceed 200 characters']
  },

  // Competition Information
  season: {
    type: String,
    required: [true, 'Season is required'],
    index: true
  },
  round: {
    type: Number,
    min: [1, 'Round must be at least 1']
  },
  roundName: {
    type: String // "Final", "Semi-Final", "Quarter-Final", etc.
  },
  matchday: {
    type: Number,
    min: [1, 'Matchday must be at least 1']
  },
  tournamentType: {
    type: String,
    enum: ['round-robin', 'knockout', 'double-elimination', 'swiss'],
    default: 'round-robin'
  },

  // Match Status
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled', 'postponed'],
    default: 'scheduled',
    index: true
  },

  // Scores
  homeScore: {
    type: Number,
    default: null,
    min: [0, 'Score cannot be negative']
  },
  awayScore: {
    type: Number,
    default: null,
    min: [0, 'Score cannot be negative']
  },

  // Live Match Data
  liveData: {
    timeElapsed: {
      type: Number,
      default: 0, // seconds
      min: [0, 'Time elapsed cannot be negative']
    },
    isRunning: {
      type: Boolean,
      default: false
    },
    period: {
      type: Number,
      default: 1, // 1st half, 2nd half, overtime
      min: [1, 'Period must be at least 1']
    },
    events: [{
      type: {
        type: String,
        enum: ['goal', 'assist', 'yellow_card', 'red_card', 'substitution', 'timeout'],
        required: true
      },
      team: {
        type: String,
        enum: ['home', 'away'],
        required: true
      },
      player: {
        type: String,
        required: true
      },
      playerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
      },
      time: {
        type: Number, // seconds from start
        required: true,
        min: [0, 'Event time cannot be negative']
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      description: {
        type: String,
        maxlength: [200, 'Event description cannot exceed 200 characters']
      }
    }]
  },

  // Match Settings
  duration: {
    type: Number,
    default: 40, // minutes
    min: [20, 'Match duration must be at least 20 minutes'],
    max: [120, 'Match duration cannot exceed 120 minutes']
  },

  // Officials
  referee: {
    type: String,
    maxlength: [100, 'Referee name cannot exceed 100 characters']
  },
  assistantReferees: [{
    type: String,
    maxlength: [100, 'Assistant referee name cannot exceed 100 characters']
  }],

  // Additional Information
  weather: {
    type: String,
    maxlength: [100, 'Weather description cannot exceed 100 characters']
  },
  temperature: {
    type: Number // Celsius
  },
  attendance: {
    type: Number,
    min: [0, 'Attendance cannot be negative']
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },

  // Timestamps
  scheduledTime: {
    type: Date
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
matchSchema.index({ season: 1 });
matchSchema.index({ date: 1 });
matchSchema.index({ status: 1 });
matchSchema.index({ homeTeamId: 1 });
matchSchema.index({ awayTeamId: 1 });
matchSchema.index({ season: 1, status: 1 });
matchSchema.index({ season: 1, date: 1 });

// Virtual for match result
matchSchema.virtual('result').get(function() {
  if (this.status !== 'completed' || this.homeScore === null || this.awayScore === null) {
    return null;
  }
  
  if (this.homeScore > this.awayScore) return 'home_win';
  if (this.awayScore > this.homeScore) return 'away_win';
  return 'draw';
});

// Virtual for total goals
matchSchema.virtual('totalGoals').get(function() {
  if (this.homeScore === null || this.awayScore === null) return 0;
  return this.homeScore + this.awayScore;
});

// Virtual for match duration in minutes
matchSchema.virtual('actualDuration').get(function() {
  if (!this.startTime || !this.endTime) return null;
  return Math.round((this.endTime - this.startTime) / 60000); // milliseconds to minutes
});

// Virtual for formatted score
matchSchema.virtual('scoreString').get(function() {
  if (this.homeScore === null || this.awayScore === null) return 'vs';
  return `${this.homeScore} - ${this.awayScore}`;
});

// Pre-save middleware
matchSchema.pre('save', function(next) {
  // Set scheduled time if not set
  if (!this.scheduledTime && this.date) {
    this.scheduledTime = new Date(this.date);
  }
  
  // Ensure teams are different
  if (this.homeTeamId && this.awayTeamId && this.homeTeamId.toString() === this.awayTeamId.toString()) {
    return next(new Error('Home team and away team cannot be the same'));
  }
  
  next();
});

// Methods for live match management
matchSchema.methods.startLive = function() {
  this.status = 'live';
  this.startTime = new Date();
  this.liveData.isRunning = true;
  return this.save();
};

matchSchema.methods.pauseLive = function() {
  this.liveData.isRunning = false;
  return this.save();
};

matchSchema.methods.resumeLive = function() {
  this.liveData.isRunning = true;
  return this.save();
};

matchSchema.methods.endLive = function() {
  this.status = 'completed';
  this.endTime = new Date();
  this.liveData.isRunning = false;
  return this.save();
};

matchSchema.methods.addEvent = function(eventData) {
  this.liveData.events.push({
    ...eventData,
    timestamp: new Date()
  });
  return this.save();
};

matchSchema.methods.updateScore = function(homeScore, awayScore) {
  this.homeScore = homeScore;
  this.awayScore = awayScore;
  return this.save();
};

// Static methods
matchSchema.statics.findBySeason = function(season) {
  return this.find({ season });
};

matchSchema.statics.findLiveMatches = function(season = null) {
  const query = { status: 'live' };
  if (season) query.season = season;
  return this.find(query);
};

matchSchema.statics.findUpcomingMatches = function(season = null, limit = 10) {
  const query = { 
    status: 'scheduled', 
    date: { $gte: new Date() } 
  };
  if (season) query.season = season;
  return this.find(query).sort({ date: 1 }).limit(limit);
};

export default mongoose.models.Match || mongoose.model('Match', matchSchema);