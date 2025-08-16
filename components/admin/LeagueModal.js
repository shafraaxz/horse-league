// components/admin/LeagueModal.js - Enhanced with Delete Functionality
import { useState, useEffect } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';

const LeagueModal = ({ isOpen, onClose, league, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    description: '',
    season: '',
    startDate: '',
    endDate: '',
    status: 'active'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Reset form when modal opens/closes or league changes
  useEffect(() => {
    if (isOpen) {
      if (league) {
        // Editing existing league
        setFormData({
          _id: league._id,
          name: league.name || '',
          logo: league.logo || '',
          description: league.description || '',
          season: league.season || new Date().getFullYear().toString(),
          startDate: league.startDate ? new Date(league.startDate).toISOString().split('T')[0] : '',
          endDate: league.endDate ? new Date(league.endDate).toISOString().split('T')[0] : '',
          status: league.status || 'active'
        });
      } else {
        // Creating new league
        setFormData({
          name: '',
          logo: '',
          description: '',
          season: new Date().getFullYear().toString(),
          startDate: '',
          endDate: '',
          status: 'active'
        });
      }
      setErrors({});
    }
  }, [isOpen, league]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'League name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'League name must be at least 3 characters';
    }

    if (!formData.season.trim()) {
      newErrors.season = 'Season is required';
    }

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        newErrors.endDate = 'End date must be after start date';
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

    setIsLoading(true);

    try {
      const submitData = {
        name: formData.name.trim(),
        logo: formData.logo.trim(),
        description: formData.description.trim(),
        season: formData.season.trim(),
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        status: formData.status
      };

      if (league?._id) {
        submitData._id = league._id;
      }

      await onSave(submitData);
    } catch (error) {
      console.error('Failed to save league:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    if (!league || !onDelete) return;

    const confirmMessage = `Are you sure you want to delete "${league.name}"?\n\nThis will permanently delete:\n• All teams in this league\n• All players in this league\n• All matches in this league\n• All statistics\n\nThis action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
      onDelete(league._id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl max-w-2xl w-full border border-slate-700">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-white">
              {league ? 'Edit League' : 'Create New League'}
            </h3>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* League Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              League Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                errors.name 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-slate-600 focus:ring-blue-500'
              }`}
              placeholder="Enter league name"
            />
            {errors.name && (
              <p className="text-red-400 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Season and Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Season *
              </label>
              <input
                type="text"
                name="season"
                value={formData.season}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                  errors.season 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-slate-600 focus:ring-blue-500'
                }`}
                placeholder="2024"
              />
              {errors.season && (
                <p className="text-red-400 text-sm mt-1">{errors.season}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <option value="active">Active</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 transition-colors ${
                  errors.endDate 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-slate-600 focus:ring-blue-500'
                }`}
              />
              {errors.endDate && (
                <p className="text-red-400 text-sm mt-1">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Logo URL
            </label>
            <input
              type="url"
              name="logo"
              value={formData.logo}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              placeholder="https://example.com/logo.png"
            />
            <p className="text-slate-400 text-sm mt-1">
              Optional: URL to league logo image
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none"
              placeholder="Enter league description..."
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 flex gap-3">
          {/* Delete Button - Only show for existing leagues */}
          {league && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
              title="Delete League"
            >
              <Trash2 className="w-4 h-4" />
              Delete League
            </button>
          )}
          
          {/* Spacer */}
          <div className="flex-1" />
          
          {/* Cancel Button */}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          
          {/* Save Button */}
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : league ? 'Update League' : 'Create League'}
          </button>
        </div>

        {/* Delete Warning for existing leagues */}
        {league && (
          <div className="px-6 pb-6">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-red-400 font-medium mb-1">Danger Zone</h4>
                  <p className="text-red-300 text-sm">
                    Deleting this league will permanently remove all associated teams, players, matches, and statistics. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeagueModal;