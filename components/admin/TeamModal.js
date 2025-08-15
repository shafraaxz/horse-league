// components/admin/TeamModal.js - FIXED with all team edit functionality
import React, { useState, useEffect } from 'react';
import { X, Users, MapPin, User, Calendar, Save, Shield } from 'lucide-react';
import { ImageUpload } from '../ImageUpload';

const TeamModal = ({ isOpen, onClose, team, onSave, selectedLeague }) => {
  const [formData, setFormData] = useState({
    name: '',
    coach: '',
    stadium: '',
    logo: '',
    founded: '',
    description: '',
    colors: '',
    website: '',
    email: '',
    phone: '',
    captain: '',
    homeVenue: '',
    awayVenue: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (team) {
      // ✅ EDITING EXISTING TEAM: Load all team data
      setFormData({
        name: team.name || '',
        coach: team.coach || '',
        stadium: team.stadium || '',
        logo: team.logo || '',
        founded: team.founded ? new Date(team.founded).getFullYear().toString() : '',
        description: team.description || '',
        colors: team.colors || '',
        website: team.website || '',
        email: team.email || '',
        phone: team.phone || '',
        captain: team.captain || '',
        homeVenue: team.homeVenue || team.stadium || '',
        awayVenue: team.awayVenue || '',
        _id: team._id
      });
      setErrors({});
    } else {
      // ✅ CREATING NEW TEAM: Reset form
      setFormData({
        name: '',
        coach: '',
        stadium: 'Manadhoo Futsal Ground',
        logo: '',
        founded: new Date().getFullYear().toString(),
        description: '',
        colors: '',
        website: '',
        email: '',
        phone: '',
        captain: '',
        homeVenue: 'Manadhoo Futsal Ground',
        awayVenue: ''
      });
      setErrors({});
    }
  }, [team, isOpen]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Team name is required';
    }
    
    if (formData.name.trim().length < 2) {
      newErrors.name = 'Team name must be at least 2 characters';
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (formData.website && !formData.website.startsWith('http')) {
      newErrors.website = 'Website must start with http:// or https://';
    }
    
    if (formData.founded && (parseInt(formData.founded) < 1800 || parseInt(formData.founded) > new Date().getFullYear())) {
      newErrors.founded = 'Please enter a valid founding year';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const submitData = {
        ...formData,
        leagueId: selectedLeague,
        founded: formData.founded ? parseInt(formData.founded) : null
      };
      
      console.log('💾 Saving team data:', submitData);
      await onSave(submitData);
      
    } catch (error) {
      console.error('Error saving team:', error);
      setErrors({ submit: 'Failed to save team. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (imageUrl) => {
    setFormData(prev => ({ ...prev, logo: imageUrl }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-white">
                  {team ? `Edit ${team.name}` : 'Add New Team'}
                </h3>
                <p className="text-slate-400 text-sm">
                  {team ? 'Update team information and settings' : 'Create a new team for the league'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              disabled={loading}
              className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Basic Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Team Logo */}
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-300 mb-3">Team Logo</label>
                <ImageUpload
                  value={formData.logo}
                  onChange={handleImageChange}
                  type="team"
                  placeholder="Upload Team Logo"
                  className="w-full"
                  disabled={loading}
                />
              </div>

              {/* Team Name & Basic Info */}
              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.name ? 'border-red-500' : 'border-slate-600'
                    }`}
                    placeholder="Enter team name"
                    disabled={loading}
                  />
                  {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Coach</label>
                    <input
                      type="text"
                      name="coach"
                      value={formData.coach}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Head coach name"
                      disabled={loading}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Founded Year</label>
                    <input
                      type="number"
                      name="founded"
                      value={formData.founded}
                      onChange={handleChange}
                      min="1800"
                      max={new Date().getFullYear()}
                      className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors.founded ? 'border-red-500' : 'border-slate-600'
                      }`}
                      placeholder="2020"
                      disabled={loading}
                    />
                    {errors.founded && <p className="text-red-400 text-sm mt-1">{errors.founded}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Team Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Brief description of the team..."
                disabled={loading}
              />
            </div>
          </div>

          {/* Stadium & Venue Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Stadium & Venue</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Home Stadium</label>
                <select
                  name="stadium"
                  value={formData.stadium}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={loading}
                >
                  <option value="">Select home stadium</option>
                  <option value="Manadhoo Futsal Ground">Manadhoo Futsal Ground</option>
                  <option value="Central Arena">Central Arena</option>
                  <option value="Sports Complex A">Sports Complex A</option>
                  <option value="Community Ground">Community Ground</option>
                  <option value="Main Stadium">Main Stadium</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Home Venue</label>
                <input
                  type="text"
                  name="homeVenue"
                  value={formData.homeVenue}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Primary home venue"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Team Details */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Team Details</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Team Colors</label>
                <input
                  type="text"
                  name="colors"
                  value={formData.colors}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Red and Blue"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Team Captain</label>
                <input
                  type="text"
                  name="captain"
                  value={formData.captain}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Captain name"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Contact Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.email ? 'border-red-500' : 'border-slate-600'
                  }`}
                  placeholder="team@example.com"
                  disabled={loading}
                />
                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="+960 123 4567"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Website</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.website ? 'border-red-500' : 'border-slate-600'
                }`}
                placeholder="https://teamwebsite.com"
                disabled={loading}
              />
              {errors.website && <p className="text-red-400 text-sm mt-1">{errors.website}</p>}
            </div>
          </div>

          {/* Error Display */}
          {errors.submit && (
            <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400">{errors.submit}</p>
            </div>
          )}

          {/* League Validation */}
          {!selectedLeague && (
            <div className="p-4 bg-orange-500/20 border border-orange-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-orange-400">
                <Shield className="w-5 h-5" />
                <span className="font-medium">League Required</span>
              </div>
              <p className="text-orange-300 text-sm mt-1">Please select a league before creating a team.</p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-6 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim() || !selectedLeague}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {team ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Save className="w-5 h-5" />
                  {team ? 'Update Team' : 'Create Team'}
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamModal;