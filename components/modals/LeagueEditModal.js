// components/modals/LeagueEditModal.js - Edit League Form Modal
import React, { useState, useEffect } from 'react';
import { X, Save, Upload, AlertCircle, Trophy, MapPin, Calendar, Users, Target } from 'lucide-react';

const LeagueEditModal = ({ isOpen, onClose, league, onSave, loading = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    description: '',
    type: 'league',
    sport: 'football',
    status: 'upcoming',
    season: '',
    location: '',
    startDate: '',
    endDate: '',
    maxTeams: '',
    logo: ''
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (league) {
      setFormData({
        name: league.name || '',
        shortName: league.shortName || '',
        description: league.description || '',
        type: league.type || 'league',
        sport: league.sport || 'football',
        status: league.status || 'upcoming',
        season: league.season || '',
        location: league.location || '',
        startDate: league.startDate ? new Date(league.startDate).toISOString().split('T')[0] : '',
        endDate: league.endDate ? new Date(league.endDate).toISOString().split('T')[0] : '',
        maxTeams: league.maxTeams || '',
        logo: league.logo || ''
      });
    }
  }, [league]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'League name is required';
    }
    
    if (formData.name.length < 3) {
      newErrors.name = 'League name must be at least 3 characters';
    }
    
    if (formData.shortName && formData.shortName.length > 10) {
      newErrors.shortName = 'Short name must be 10 characters or less';
    }
    
    if (formData.maxTeams && (formData.maxTeams < 2 || formData.maxTeams > 50)) {
      newErrors.maxTeams = 'Max teams must be between 2 and 50';
    }
    
    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const submitData = {
        ...formData,
        maxTeams: formData.maxTeams ? parseInt(formData.maxTeams) : null,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null
      };
      
      await onSave(submitData);
      onClose();
    } catch (error) {
      console.error('Error saving league:', error);
      setErrors({ submit: 'Failed to save league. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const sportOptions = [
    { value: 'football', label: 'Football ⚽' },
    { value: 'basketball', label: 'Basketball 🏀' },
    { value: 'tennis', label: 'Tennis 🎾' },
    { value: 'volleyball', label: 'Volleyball 🏐' },
    { value: 'cricket', label: 'Cricket 🏏' },
    { value: 'rugby', label: 'Rugby 🏉' },
    { value: 'hockey', label: 'Hockey 🏒' },
    { value: 'baseball', label: 'Baseball ⚾' }
  ];

  const typeOptions = [
    { value: 'league', label: 'League' },
    { value: 'tournament', label: 'Tournament' },
    { value: 'cup', label: 'Cup Competition' },
    { value: 'friendly', label: 'Friendly Tournament' }
  ];

  const statusOptions = [
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Trophy className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Edit League: {league?.name}
              </h2>
            </div>
            <button
              onClick={onClose}
              disabled={saving}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Basic Information Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Trophy className="h-5 w-5 text-blue-500 mr-2" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* League Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  League Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Premier League 2024"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Short Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Name
                </label>
                <input
                  type="text"
                  name="shortName"
                  value={formData.shortName}
                  onChange={handleChange}
                  maxLength="10"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.shortName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., PL2024"
                />
                {errors.shortName && (
                  <p className="mt-1 text-sm text-red-600">{errors.shortName}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  {formData.shortName.length}/10 characters
                </p>
              </div>

              {/* Sport */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sport
                </label>
                <select
                  name="sport"
                  value={formData.sport}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  {sportOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Competition Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  {typeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Competition Details Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="h-5 w-5 text-green-500 mr-2" />
              Competition Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Season */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Season
                </label>
                <input
                  type="text"
                  name="season"
                  value={formData.season}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="e.g., 2024/25, Spring 2024"
                />
              </div>

              {/* Max Teams */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Teams
                </label>
                <input
                  type="number"
                  name="maxTeams"
                  value={formData.maxTeams}
                  onChange={handleChange}
                  min="2"
                  max="50"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.maxTeams ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 20"
                />
                {errors.maxTeams && (
                  <p className="mt-1 text-sm text-red-600">{errors.maxTeams}</p>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="e.g., London, England"
                />
              </div>
            </div>
          </div>

          {/* Schedule Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 text-purple-500 mr-2" />
              Schedule
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.endDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
                )}
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
              placeholder="Describe your league, rules, format, prizes, etc..."
            />
            <p className="mt-1 text-sm text-gray-500">
              {formData.description.length}/500 characters
            </p>
          </div>

          {/* Logo Section */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              League Logo URL
            </label>
            <div className="flex space-x-4">
              <input
                type="url"
                name="logo"
                value={formData.logo}
                onChange={handleChange}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="https://example.com/logo.png"
              />
              {formData.logo && (
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-300 bg-gray-50 flex items-center justify-center">
                  <img
                    src={formData.logo}
                    alt="League logo preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="hidden items-center justify-center text-gray-400">
                    <Trophy className="h-6 w-6" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save League</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeagueEditModal;