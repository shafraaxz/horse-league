// components/league/LeagueEditForm.js - Complete Mobile-Optimized Version
import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Calendar, MapPin, AlertCircle, X, Save
} from 'lucide-react';

const LeagueEditForm = ({ league, onSave, onCancel, loading }) => {
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
  
  // Logo upload states
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    console.log('📄 LeagueEditForm received league:', league);
    if (league) {
      const formattedData = {
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
        maxTeams: league.maxTeams ? String(league.maxTeams) : '',
        logo: league.logo || ''
      };
      
      console.log('📋 Setting form data:', formattedData);
      setFormData(formattedData);
      
      // Set logo preview if league has existing logo
      if (league.logo) {
        setLogoPreview(league.logo);
      }
    }
  }, [league]);

  // Handle file selection for logo upload
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setUploadError('Please select an image file');
        return;
      }

      // Validate file size (10MB max for Cloudinary)
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('File size must be less than 10MB');
        return;
      }

      setUploadError('');
      setLogoFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload logo to Cloudinary
  const uploadLogo = async (file) => {
    console.log('📤 Starting logo upload to Cloudinary...');
    
    const uploadFormData = new FormData();
    uploadFormData.append('image', file);
    uploadFormData.append('type', 'league-logo');

    try {
      console.log('📄 Sending upload request...');
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: uploadFormData
      });

      console.log('📡 Upload response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Upload response error:', errorData);
        throw new Error(errorData.error || errorData.message || 'Upload failed');
      }

      const data = await response.json();
      console.log('✅ Upload successful:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Upload failed');
      }
      
      // Return the Cloudinary URL
      return data.url;
    } catch (error) {
      console.error('❌ Upload error:', error);
      throw error;
    }
  };

  // Remove logo
  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    setFormData(prev => ({ ...prev, logo: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setUploadError('');
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'League name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'League name must be at least 3 characters';
    }
    
    if (formData.shortName && formData.shortName.length > 10) {
      newErrors.shortName = 'Short name must be 10 characters or less';
    }
    
    if (formData.maxTeams && (parseInt(formData.maxTeams) < 2 || parseInt(formData.maxTeams) > 50)) {
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
    setUploadError('');
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      let logoUrl = formData.logo;

      // Upload new logo if selected
      if (logoFile) {
        setUploading(true);
        try {
          logoUrl = await uploadLogo(logoFile);
          console.log('✅ Logo uploaded successfully:', logoUrl);
        } catch (uploadErr) {
          console.error('❌ Logo upload failed:', uploadErr);
          setUploadError('Failed to upload logo: ' + uploadErr.message);
          setUploading(false);
          setSaving(false);
          return;
        }
        setUploading(false);
      }

      const submitData = {
        ...formData,
        logo: logoUrl,
        maxTeams: formData.maxTeams ? parseInt(formData.maxTeams) : null,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null
      };
      
      console.log('💾 Submitting league update:', submitData);
      console.log('🆔 League ID:', league?._id);
      
      await onSave(submitData);
    } catch (error) {
      console.error('❌ Error saving league:', error);
      setErrors({ submit: error.message || 'Failed to save league. Please try again.' });
    } finally {
      setSaving(false);
      setUploading(false);
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
    { value: 'futsal', label: 'Futsal 🏀' },
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

  return (
    <div className="max-w-full overflow-hidden">
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Debug Info (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-700">
              Debug: League ID = {league?._id} | Form Data: {JSON.stringify(formData, null, 2)}
            </p>
          </div>
        )}

        {/* Logo Upload Section - Mobile Optimized */}
        <div className="bg-gray-50 rounded-lg sm:rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
            <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 mr-2" />
            League Logo
          </h3>
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            {/* Logo Preview - Mobile Friendly */}
            <div className="flex-shrink-0">
              {logoPreview ? (
                <div className="relative">
                  <img
                    src={logoPreview}
                    alt="League logo preview"
                    className="w-16 h-16 sm:w-24 sm:h-24 rounded-lg sm:rounded-xl object-cover border-2 border-gray-200 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-sm"
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                </div>
              ) : (
                <div 
                  className="w-16 h-16 sm:w-24 sm:h-24 border-2 border-dashed border-gray-300 rounded-lg sm:rounded-xl flex items-center justify-center bg-white hover:border-blue-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="text-center">
                    <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Upload</p>
                  </div>
                </div>
              )}
            </div>

            {/* Upload Controls - Mobile Friendly */}
            <div className="flex-1 w-full">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div className="space-y-2 sm:space-y-3 text-center sm:text-left">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || saving}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Trophy className="h-4 w-4" />
                      <span>{logoPreview ? 'Change Logo' : 'Upload Logo'}</span>
                    </>
                  )}
                </button>
                
                <div className="text-xs sm:text-sm text-gray-500 space-y-1">
                  <p>• Max: 10MB • JPG, PNG, WebP</p>
                  <p>• Recommended: 500x500px</p>
                </div>

                {uploadError && (
                  <div className="p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 text-red-600 mr-2 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-red-600">{uploadError}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Basic Information Section - Mobile Grid */}
        <div className="space-y-4 sm:space-y-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
            <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 mr-2" />
            Basic Information
          </h3>
          
          <div className="space-y-4 sm:space-y-6">
            {/* League Name - Full width on mobile */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                League Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Premier League 2024"
              />
              {errors.name && (
                <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Mobile: Stack fields, Tablet+: Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base ${
                    errors.shortName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., PL2024"
                />
                {errors.shortName && (
                  <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.shortName}</p>
                )}
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
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base"
                  placeholder="e.g., 2024/25"
                />
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
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base"
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
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base"
                >
                  {typeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
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
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base ${
                    errors.maxTeams ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 20"
                />
                {errors.maxTeams && (
                  <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.maxTeams}</p>
                )}
              </div>
            </div>

            {/* Location - Full width */}
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
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base"
                placeholder="e.g., London, England"
              />
            </div>
          </div>
        </div>

        {/* Schedule Section - Mobile Optimized */}
        <div className="space-y-4 sm:space-y-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 mr-2" />
            Schedule
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base"
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
                className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base ${
                  errors.endDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.endDate && (
                <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.endDate}</p>
              )}
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            maxLength="500"
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none text-sm sm:text-base"
            placeholder="Describe your league..."
          />
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            {formData.description.length}/500 characters
          </p>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 mr-2 flex-shrink-0" />
              <p className="text-xs sm:text-sm text-red-600">{errors.submit}</p>
            </div>
          </div>
        )}

        {/* Action Buttons - Mobile Stacked */}
        <div className="flex flex-col sm:flex-row items-center justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving || uploading}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || uploading}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 text-sm sm:text-base"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Uploading Logo...</span>
              </>
            ) : saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeagueEditForm;