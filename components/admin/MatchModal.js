// components/admin/MatchModal.js - FIXED: Responsive Design
import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Users, Trophy, Save, AlertCircle } from 'lucide-react';

const MatchModal = ({ 
  isOpen, 
  onClose, 
  match = null, 
  teams = [], 
  selectedLeague, 
  onSave 
}) => {
  const [formData, setFormData] = useState({
    homeTeam: '',
    awayTeam: '',
    date: '',
    time: '18:00',
    venue: 'Manadhoo Futsal Ground',
    referee: '',
    round: 1,
    status: 'scheduled',
    homeScore: 0,
    awayScore: 0
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Venue options
  const venueOptions = [
    'Manadhoo Futsal Ground',
    'Central Arena',
    'Sports Complex A',
    'Community Ground',
    'Training Ground'
  ];

  // Status options
  const statusOptions = [
    { value: 'scheduled', label: '📅 Scheduled' },
    { value: 'live', label: '🔴 Live' },
    { value: 'halftime', label: '⏸️ Half Time' },
    { value: 'finished', label: '✅ Finished' },
    { value: 'postponed', label: '⏳ Postponed' },
    { value: 'cancelled', label: '❌ Cancelled' }
  ];

  // Initialize form data when modal opens or match changes
  useEffect(() => {
    if (match) {
      // ✅ Edit mode - populate with existing match data
      setFormData({
        homeTeam: match.homeTeam?._id || match.homeTeam || '',
        awayTeam: match.awayTeam?._id || match.awayTeam || '',
        date: match.date || '',
        time: match.time || '18:00',
        venue: match.venue || 'Manadhoo Futsal Ground',
        referee: match.referee || '',
        round: match.round || 1,
        status: match.status || 'scheduled',
        homeScore: match.score?.home || 0,
        awayScore: match.score?.away || 0
      });
    } else {
      // ✅ Create mode - set defaults
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      setFormData({
        homeTeam: '',
        awayTeam: '',
        date: tomorrow.toISOString().split('T')[0],
        time: '18:00',
        venue: 'Manadhoo Futsal Ground',
        referee: '',
        round: 1,
        status: 'scheduled',
        homeScore: 0,
        awayScore: 0
      });
    }
    
    // Clear errors when modal opens
    setErrors({});
  }, [match, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.homeTeam) {
      newErrors.homeTeam = 'Home team is required';
    }

    if (!formData.awayTeam) {
      newErrors.awayTeam = 'Away team is required';
    }

    if (formData.homeTeam === formData.awayTeam) {
      newErrors.awayTeam = 'Away team must be different from home team';
    }

    if (!formData.date) {
      newErrors.date = 'Match date is required';
    }

    if (!formData.time) {
      newErrors.time = 'Match time is required';
    }

    if (!formData.venue) {
      newErrors.venue = 'Venue is required';
    }

    if (!formData.round || formData.round < 1) {
      newErrors.round = 'Round must be a positive number';
    }

    // Score validation for finished matches
    if (formData.status === 'finished') {
      if (formData.homeScore < 0 || formData.awayScore < 0) {
        newErrors.score = 'Scores cannot be negative';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        ...formData
      };

      // Add match ID for edit mode
      if (match?._id) {
        submitData._id = match._id;
      }

      console.log('💾 Submitting match data:', submitData);
      
      await onSave(submitData);
      
      // Reset form and close modal on success
      setFormData({
        homeTeam: '',
        awayTeam: '',
        date: '',
        time: '18:00',
        venue: 'Manadhoo Futsal Ground',
        referee: '',
        round: 1,
        status: 'scheduled',
        homeScore: 0,
        awayScore: 0
      });
      
    } catch (error) {
      console.error('Save match error:', error);
      setErrors({ submit: error.message || 'Failed to save match' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvailableAwayTeams = () => {
    return teams.filter(team => team._id !== formData.homeTeam);
  };

  const getAvailableHomeTeams = () => {
    return teams.filter(team => team._id !== formData.awayTeam);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      {/* ✅ FIXED: Responsive modal size */}
      <div className="bg-slate-800 rounded-xl sm:rounded-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden border border-slate-700 shadow-2xl">
        
        {/* Header - Fixed height, responsive padding */}
        <div className="p-4 sm:p-6 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Trophy className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-white">
                  {match ? 'Edit Match' : 'Create New Match'}
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm hidden sm:block">
                  {match ? 'Update match details' : 'Schedule a new match for the league'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="overflow-y-auto flex-1" style={{ maxHeight: 'calc(95vh - 140px)' }}>
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            
            {/* Team Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Users className="w-4 h-4 inline mr-2" />
                  Home Team *
                </label>
                <select
                  value={formData.homeTeam}
                  onChange={(e) => handleInputChange('homeTeam', e.target.value)}
                  className={`w-full px-3 py-2 sm:px-4 sm:py-3 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${
                    errors.homeTeam ? 'border-red-500' : 'border-slate-600'
                  }`}
                  disabled={isSubmitting}
                >
                  <option value="">Select Home Team</option>
                  {getAvailableHomeTeams().map(team => (
                    <option key={team._id} value={team._id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                {errors.homeTeam && (
                  <p className="text-red-400 text-xs sm:text-sm mt-1">{errors.homeTeam}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Users className="w-4 h-4 inline mr-2" />
                  Away Team *
                </label>
                <select
                  value={formData.awayTeam}
                  onChange={(e) => handleInputChange('awayTeam', e.target.value)}
                  className={`w-full px-3 py-2 sm:px-4 sm:py-3 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${
                    errors.awayTeam ? 'border-red-500' : 'border-slate-600'
                  }`}
                  disabled={isSubmitting}
                >
                  <option value="">Select Away Team</option>
                  {getAvailableAwayTeams().map(team => (
                    <option key={team._id} value={team._id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                {errors.awayTeam && (
                  <p className="text-red-400 text-xs sm:text-sm mt-1">{errors.awayTeam}</p>
                )}
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Match Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className={`w-full px-3 py-2 sm:px-4 sm:py-3 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${
                    errors.date ? 'border-red-500' : 'border-slate-600'
                  }`}
                  disabled={isSubmitting}
                />
                {errors.date && (
                  <p className="text-red-400 text-xs sm:text-sm mt-1">{errors.date}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Match Time *
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  className={`w-full px-3 py-2 sm:px-4 sm:py-3 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${
                    errors.time ? 'border-red-500' : 'border-slate-600'
                  }`}
                  disabled={isSubmitting}
                />
                {errors.time && (
                  <p className="text-red-400 text-xs sm:text-sm mt-1">{errors.time}</p>
                )}
              </div>
            </div>

            {/* Venue and Round */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Venue *
                </label>
                <select
                  value={formData.venue}
                  onChange={(e) => handleInputChange('venue', e.target.value)}
                  className={`w-full px-3 py-2 sm:px-4 sm:py-3 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${
                    errors.venue ? 'border-red-500' : 'border-slate-600'
                  }`}
                  disabled={isSubmitting}
                >
                  {venueOptions.map(venue => (
                    <option key={venue} value={venue}>{venue}</option>
                  ))}
                </select>
                {errors.venue && (
                  <p className="text-red-400 text-xs sm:text-sm mt-1">{errors.venue}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Round Number *
                </label>
                <input
                  type="number"
                  value={formData.round}
                  onChange={(e) => handleInputChange('round', parseInt(e.target.value) || 1)}
                  className={`w-full px-3 py-2 sm:px-4 sm:py-3 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${
                    errors.round ? 'border-red-500' : 'border-slate-600'
                  }`}
                  min="1"
                  disabled={isSubmitting}
                />
                {errors.round && (
                  <p className="text-red-400 text-xs sm:text-sm mt-1">{errors.round}</p>
                )}
              </div>
            </div>

            {/* Status and Referee */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Match Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  disabled={isSubmitting}
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Referee (Optional)
                </label>
                <input
                  type="text"
                  value={formData.referee}
                  onChange={(e) => handleInputChange('referee', e.target.value)}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  placeholder="Enter referee name"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Score Section - Only show for finished matches */}
            {formData.status === 'finished' && (
              <div className="space-y-3 sm:space-y-4">
                <h4 className="text-base sm:text-lg font-semibold text-white">Final Score</h4>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Home Team Score
                    </label>
                    <input
                      type="number"
                      value={formData.homeScore}
                      onChange={(e) => handleInputChange('homeScore', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                      min="0"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Away Team Score
                    </label>
                    <input
                      type="number"
                      value={formData.awayScore}
                      onChange={(e) => handleInputChange('awayScore', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                      min="0"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                {errors.score && (
                  <p className="text-red-400 text-xs sm:text-sm">{errors.score}</p>
                )}
              </div>
            )}

            {/* Match Preview */}
            {formData.homeTeam && formData.awayTeam && (
              <div className="bg-slate-700/30 rounded-lg p-3 sm:p-4">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Match Preview</h4>
                <div className="flex items-center justify-center gap-2 sm:gap-4">
                  <div className="text-center">
                    <div className="text-white font-semibold text-sm sm:text-base">
                      {teams.find(t => t._id === formData.homeTeam)?.name || 'Home Team'}
                    </div>
                    <div className="text-slate-400 text-xs">HOME</div>
                  </div>
                  <div className="text-lg sm:text-2xl font-bold text-slate-400">VS</div>
                  <div className="text-center">
                    <div className="text-white font-semibold text-sm sm:text-base">
                      {teams.find(t => t._id === formData.awayTeam)?.name || 'Away Team'}
                    </div>
                    <div className="text-slate-400 text-xs">AWAY</div>
                  </div>
                </div>
                <div className="text-center mt-2 sm:mt-3 text-slate-400 text-xs sm:text-sm">
                  {formData.date && new Date(formData.date).toLocaleDateString()} • {formData.time} • {formData.venue}
                </div>
              </div>
            )}

            {/* Teams Warning */}
            {teams.length < 2 && (
              <div className="p-3 sm:p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-400">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-medium text-sm sm:text-base">Insufficient Teams</span>
                </div>
                <p className="text-yellow-300 text-xs sm:text-sm mt-1">
                  You need at least 2 teams to create a match. Please add teams to the league first.
                </p>
              </div>
            )}

            {/* Error Messages */}
            {errors.submit && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-xs sm:text-sm">{errors.submit}</p>
              </div>
            )}
          </form>
        </div>

        {/* Fixed Footer with Action Buttons */}
        <div className="p-4 sm:p-6 border-t border-slate-700 flex-shrink-0 bg-slate-800">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 sm:px-6 sm:py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting || teams.length < 2}
              className="flex-1 px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="hidden sm:inline">{match ? 'Updating...' : 'Creating...'}</span>
                  <span className="sm:hidden">Saving...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">{match ? 'Update Match' : 'Create Match'}</span>
                  <span className="sm:hidden">{match ? 'Update' : 'Create'}</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchModal;