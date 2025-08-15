// components/admin/PlayerModal.js - Enhanced with photo upload
import React, { useState, useEffect } from 'react';
import { X, User, Save, Camera } from 'lucide-react';
import { CircularImageUpload } from '../ImageUpload';

const PlayerModal = ({ 
  isOpen, 
  onClose, 
  data, 
  teams = [], 
  selectedLeague, 
  onSave 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    position: 'Forward',
    team: '',
    photo: '',
    age: '',
    nationality: '',
    height: '',
    weight: '',
    stats: {
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      appearances: 0,
      minutesPlayed: 0
    }
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Position options
  const positions = [
    'Goalkeeper',
    'Defender', 
    'Midfielder',
    'Forward',
    'Winger'
  ];

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (data) {
        // Editing existing player
        setFormData({
          _id: data._id,
          name: data.name || '',
          number: data.number || '',
          position: data.position || 'Forward',
          team: data.team?._id || data.team || '',
          photo: data.photo || '',
          age: data.age || '',
          nationality: data.nationality || '',
          height: data.height || '',
          weight: data.weight || '',
          stats: {
            goals: data.stats?.goals || 0,
            assists: data.stats?.assists || 0,
            yellowCards: data.stats?.yellowCards || 0,
            redCards: data.stats?.redCards || 0,
            appearances: data.stats?.appearances || 0,
            minutesPlayed: data.stats?.minutesPlayed || 0
          }
        });
      } else {
        // Creating new player
        setFormData({
          name: '',
          number: '',
          position: 'Forward',
          team: teams.length > 0 ? teams[0]._id : '',
          photo: '',
          age: '',
          nationality: '',
          height: '',
          weight: '',
          stats: {
            goals: 0,
            assists: 0,
            yellowCards: 0,
            redCards: 0,
            appearances: 0,
            minutesPlayed: 0
          }
        });
      }
      setErrors({});
    }
  }, [isOpen, data, teams]);

  // Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Player name is required';
    }

    if (!formData.number) {
      newErrors.number = 'Jersey number is required';
    } else {
      const num = parseInt(formData.number);
      if (isNaN(num) || num < 1 || num > 99) {
        newErrors.number = 'Jersey number must be between 1 and 99';
      }
    }

    if (!formData.team) {
      newErrors.team = 'Team selection is required';
    }

    if (!formData.position) {
      newErrors.position = 'Position is required';
    }

    // Check for duplicate jersey numbers in the same team
    if (formData.team && formData.number) {
      // This would need to be checked against existing players
      // For now, we'll let the backend handle this validation
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // ✅ FIXED: Use correct field names that match the API
      const submitData = {
        ...formData,
        league: selectedLeague, // API expects 'league', not 'leagueId'
        team: formData.team     // API expects 'team', not 'teamId'
      };
      
      console.log('🎯 Submitting player data:', submitData);
      await onSave(submitData);
      onClose();
    } catch (error) {
      console.error('Error saving player:', error);
      setErrors({ submit: 'Failed to save player. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle stats changes
  const handleStatsChange = (statField, value) => {
    const numValue = parseInt(value) || 0;
    setFormData(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        [statField]: Math.max(0, numValue)
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <User className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-white">
                  {data ? 'Edit Player' : 'Add New Player'}
                </h3>
                <p className="text-slate-400 text-sm">
                  {data ? `Update ${data.name}'s information` : 'Create a new player profile'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Photo and Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Player Photo */}
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-slate-300 mb-3">Player Photo</label>
              <div className="flex flex-col items-center">
                <CircularImageUpload
                  value={formData.photo}
                  onChange={(url) => handleInputChange('photo', url)}
                  type="player"
                  size="w-24 h-24"
                  disabled={isLoading}
                />
                <p className="text-xs text-slate-400 mt-2 text-center">
                  Upload player photo<br/>JPEG, PNG, WebP (Max 5MB)
                </p>
              </div>
            </div>

            {/* Basic Information */}
            <div className="md:col-span-3 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Player Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 ${
                      errors.name 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-slate-600 focus:ring-blue-500'
                    }`}
                    placeholder="Enter player's full name"
                    disabled={isLoading}
                  />
                  {errors.name && (
                    <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Jersey Number *
                  </label>
                  <input
                    type="number"
                    value={formData.number}
                    onChange={(e) => handleInputChange('number', e.target.value)}
                    className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 ${
                      errors.number 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-slate-600 focus:ring-blue-500'
                    }`}
                    placeholder="1-99"
                    min="1"
                    max="99"
                    disabled={isLoading}
                  />
                  {errors.number && (
                    <p className="text-red-400 text-sm mt-1">{errors.number}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Position *
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 ${
                      errors.position 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-slate-600 focus:ring-blue-500'
                    }`}
                    disabled={isLoading}
                  >
                    {positions.map(position => (
                      <option key={position} value={position}>{position}</option>
                    ))}
                  </select>
                  {errors.position && (
                    <p className="text-red-400 text-sm mt-1">{errors.position}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Team *
                  </label>
                  <select
                    value={formData.team}
                    onChange={(e) => handleInputChange('team', e.target.value)}
                    className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 ${
                      errors.team 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-slate-600 focus:ring-blue-500'
                    }`}
                    disabled={isLoading}
                  >
                    <option value="">Select a team</option>
                    {teams.map(team => (
                      <option key={team._id} value={team._id}>{team.name}</option>
                    ))}
                  </select>
                  {errors.team && (
                    <p className="text-red-400 text-sm mt-1">{errors.team}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Additional Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Age"
                  min="16"
                  max="50"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nationality</label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => handleInputChange('nationality', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Country"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Height (cm)</label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => handleInputChange('height', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="170"
                  min="150"
                  max="220"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Weight (kg)</label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="70"
                  min="50"
                  max="120"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Player Statistics */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Player Statistics</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Goals</label>
                <input
                  type="number"
                  value={formData.stats.goals}
                  onChange={(e) => handleStatsChange('goals', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Assists</label>
                <input
                  type="number"
                  value={formData.stats.assists}
                  onChange={(e) => handleStatsChange('assists', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Yellow Cards</label>
                <input
                  type="number"
                  value={formData.stats.yellowCards}
                  onChange={(e) => handleStatsChange('yellowCards', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Red Cards</label>
                <input
                  type="number"
                  value={formData.stats.redCards}
                  onChange={(e) => handleStatsChange('redCards', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Appearances</label>
                <input
                  type="number"
                  value={formData.stats.appearances}
                  onChange={(e) => handleStatsChange('appearances', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Minutes Played</label>
                <input
                  type="number"
                  value={formData.stats.minutesPlayed}
                  onChange={(e) => handleStatsChange('minutesPlayed', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Error Display */}
          {errors.submit && (
            <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400">{errors.submit}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Save className="w-5 h-5" />
                  {data ? 'Update Player' : 'Create Player'}
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlayerModal;