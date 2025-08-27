// components/matches/MatchForm.js - Complete responsive match creation form
import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Trophy, 
  Users, 
  Save, 
  X,
  AlertCircle,
  Check
} from 'lucide-react';

const MatchForm = ({ match = null, onSuccess, onCancel, leagues = [], teams = [] }) => {
  const [formData, setFormData] = useState({
    league: match?.league?._id || '',
    homeTeam: match?.homeTeam?._id || '',
    awayTeam: match?.awayTeam?._id || '',
    matchDate: match?.matchDate ? new Date(match.matchDate).toISOString().split('T')[0] : '',
    kickoffTime: match?.kickoffTime || '15:00',
    venue: match?.venue || '',
    referee: match?.referee || '',
    round: match?.round || 1,
    status: match?.status || 'scheduled'
  });

  const [availableTeams, setAvailableTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (formData.league) {
      loadLeagueTeams(formData.league);
    }
  }, [formData.league]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  const loadLeagueTeams = async (leagueId) => {
    try {
      const response = await fetch(`/api/leagues/${leagueId}/teams`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableTeams(data.data || data || []);
      } else {
        // Fallback: load all teams and filter client-side
        const allTeamsResponse = await fetch('/api/teams', {
          headers: getAuthHeaders()
        });
        
        if (allTeamsResponse.ok) {
          const allTeamsData = await allTeamsResponse.json();
          const allTeams = allTeamsData.data || [];
          const leagueTeams = allTeams.filter(team => 
            team.leagues && team.leagues.some(l => 
              (typeof l === 'string' ? l : l._id) === leagueId
            )
          );
          setAvailableTeams(leagueTeams);
        }
      }
    } catch (error) {
      console.error('Error loading league teams:', error);
      setAvailableTeams(teams); // Fallback to provided teams
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear team selections if league changes
    if (field === 'league') {
      setFormData(prev => ({
        ...prev,
        homeTeam: '',
        awayTeam: ''
      }));
    }

    // Clear error when user makes changes
    if (error) setError('');
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.league) errors.push('League is required');
    if (!formData.homeTeam) errors.push('Home team is required');
    if (!formData.awayTeam) errors.push('Away team is required');
    if (!formData.matchDate) errors.push('Match date is required');
    if (!formData.kickoffTime) errors.push('Kickoff time is required');

    if (formData.homeTeam === formData.awayTeam) {
      errors.push('Home team and away team cannot be the same');
    }

    if (formData.matchDate) {
      const matchDate = new Date(formData.matchDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (matchDate < today) {
        errors.push('Match date cannot be in the past');
      }
    }

    if (formData.round < 1) {
      errors.push('Round must be at least 1');
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const url = match ? `/api/matches/${match._id}` : '/api/matches';
      const method = match ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(match ? 'Match updated successfully!' : 'Match created successfully!');
        setTimeout(() => {
          onSuccess(data.data);
        }, 1500);
      } else {
        setError(data.message || 'Failed to save match');
      }
    } catch (error) {
      console.error('Error saving match:', error);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const getTeamName = (teamId) => {
    const team = availableTeams.find(t => t._id === teamId);
    return team ? team.name : 'Unknown Team';
  };

  const getLeagueName = (leagueId) => {
    const league = leagues.find(l => l._id === leagueId);
    return league ? league.name : 'Unknown League';
  };

  return (
    <div className="bg-white rounded-lg p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">
          {match ? 'Edit Match' : 'Create New Match'}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-4 sm:mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Check className="h-5 w-5 text-green-500" />
            <span className="text-green-700 text-sm sm:text-base">{success}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700 text-sm sm:text-base">{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* League Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Trophy className="inline h-4 w-4 mr-1" />
            League *
          </label>
          <select
            value={formData.league}
            onChange={(e) => handleInputChange('league', e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          >
            <option value="">Select League</option>
            {leagues.map(league => (
              <option key={league._id} value={league._id}>
                {league.name} ({league.type})
              </option>
            ))}
          </select>
        </div>

        {/* Teams Selection - Responsive Grid */}
        <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="inline h-4 w-4 mr-1" />
              Home Team *
            </label>
            <select
              value={formData.homeTeam}
              onChange={(e) => handleInputChange('homeTeam', e.target.value)}
              required
              disabled={!formData.league}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm sm:text-base"
            >
              <option value="">Select Home Team</option>
              {availableTeams.map(team => (
                <option 
                  key={team._id} 
                  value={team._id}
                  disabled={team._id === formData.awayTeam}
                >
                  {team.name}
                </option>
              ))}
            </select>
            {!formData.league && (
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Select a league first</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="inline h-4 w-4 mr-1" />
              Away Team *
            </label>
            <select
              value={formData.awayTeam}
              onChange={(e) => handleInputChange('awayTeam', e.target.value)}
              required
              disabled={!formData.league}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm sm:text-base"
            >
              <option value="">Select Away Team</option>
              {availableTeams.map(team => (
                <option 
                  key={team._id} 
                  value={team._id}
                  disabled={team._id === formData.homeTeam}
                >
                  {team.name}
                </option>
              ))}
            </select>
            {!formData.league && (
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Select a league first</p>
            )}
          </div>
        </div>

        {/* Match Preview */}
        {formData.homeTeam && formData.awayTeam && formData.league && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">Match Preview</h3>
            <div className="text-center">
              <div className="text-base sm:text-lg font-semibold text-blue-800">
                {getTeamName(formData.homeTeam)} vs {getTeamName(formData.awayTeam)}
              </div>
              <div className="text-xs sm:text-sm text-blue-600">
                {getLeagueName(formData.league)} - Round {formData.round}
              </div>
            </div>
          </div>
        )}

        {/* Date and Time - Responsive Grid */}
        <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Match Date *
            </label>
            <input
              type="date"
              value={formData.matchDate}
              onChange={(e) => handleInputChange('matchDate', e.target.value)}
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="inline h-4 w-4 mr-1" />
              Kickoff Time *
            </label>
            <input
              type="time"
              value={formData.kickoffTime}
              onChange={(e) => handleInputChange('kickoffTime', e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Additional Details - Responsive Grid */}
        <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="inline h-4 w-4 mr-1" />
              Venue
            </label>
            <input
              type="text"
              value={formData.venue}
              onChange={(e) => handleInputChange('venue', e.target.value)}
              placeholder="Stadium or ground name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline h-4 w-4 mr-1" />
              Referee
            </label>
            <input
              type="text"
              value={formData.referee}
              onChange={(e) => handleInputChange('referee', e.target.value)}
              placeholder="Referee name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Round and Status - Responsive Grid */}
        <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Round
            </label>
            <input
              type="number"
              value={formData.round}
              onChange={(e) => handleInputChange('round', parseInt(e.target.value) || 1)}
              min="1"
              max="50"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            >
              <option value="scheduled">Scheduled</option>
              <option value="postponed">Postponed</option>
              <option value="cancelled">Cancelled</option>
              {match && (
                <>
                  <option value="live">Live</option>
                  <option value="completed">Completed</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Form Actions - Responsive */}
        <div className="flex flex-col sm:flex-row items-center justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            <Save className="h-4 w-4" />
            <span>{loading ? 'Saving...' : (match ? 'Update Match' : 'Create Match')}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default MatchForm;