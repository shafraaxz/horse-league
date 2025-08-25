// src/components/Teams/TeamForm.js - COMPLETE WITH LOGO EDIT
import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Camera, 
  Users, 
  Shield, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail,
  FileText,
  Trophy,
  AlertCircle,
  Save,
  Trash2
} from 'lucide-react';
import { useAPI } from '../../hooks/useAPI';

const TeamForm = ({ 
  team = null, 
  onClose, 
  onSave, 
  currentSeason, 
  showNotification 
}) => {
  const { uploadFile, loading: uploadLoading, error: uploadError } = useAPI();

  const [formData, setFormData] = useState({
    name: '',
    coach: '',
    founded: new Date().getFullYear(),
    description: '',
    venue: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    colors: {
      primary: '#3B82F6',
      secondary: '#1E40AF'
    },
    logo: null,
    season: currentSeason?.id || 'default',
    maxPlayers: 15,
    category: 'senior',
    division: 'first'
  });

  const [errors, setErrors] = useState({});
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef();

  // Initialize form data when team prop changes
  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name || '',
        coach: team.coach || '',
        founded: team.founded || new Date().getFullYear(),
        description: team.description || '',
        venue: team.venue || team.homeVenue || '',
        contactEmail: team.contactEmail || '',
        contactPhone: team.contactPhone || '',
        website: team.website || '',
        colors: team.colors || {
          primary: '#3B82F6',
          secondary: '#1E40AF'
        },
        logo: team.logo || null,
        season: team.season || currentSeason?.id || 'default',
        maxPlayers: team.maxPlayers || 15,
        category: team.category || 'senior',
        division: team.division || 'first'
      });
      
      // Set logo preview if team has a logo
      if (team.logo) {
        setLogoPreview(team.logo);
      }
    }
  }, [team, currentSeason]);

  const categories = [
    { value: 'youth', label: 'Youth (Under 18)' },
    { value: 'senior', label: 'Senior (18+)' },
    { value: 'veteran', label: 'Veteran (35+)' },
    { value: 'women', label: 'Women' },
    { value: 'mixed', label: 'Mixed' }
  ];

  const divisions = [
    { value: 'first', label: 'First Division' },
    { value: 'second', label: 'Second Division' },
    { value: 'third', label: 'Third Division' },
    { value: 'amateur', label: 'Amateur League' }
  ];

  // FIXED: Logo upload handler with proper validation
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    
    if (!file) {
      console.log('No file selected');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors({ ...errors, logo: 'Please select an image file' });
      showNotification?.('error', 'Please select an image file (JPG, PNG, GIF)');
      return;
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      setErrors({ ...errors, logo: 'Image must be less than 2MB' });
      showNotification?.('error', 'Image must be less than 2MB');
      return;
    }

    console.log('📁 Logo file selected:', { name: file.name, size: file.size, type: file.type });

    // Clear any previous logo errors
    const newErrors = { ...errors };
    delete newErrors.logo;
    setErrors(newErrors);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target.result);
      setLogoFile(file);
      console.log('✅ Logo preview created');
    };
    reader.readAsDataURL(file);
  };

  // FIXED: Remove logo functionality
  const removeLogo = () => {
    setLogoPreview(null);
    setLogoFile(null);
    setFormData({ ...formData, logo: null });
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Clear logo errors
    const newErrors = { ...errors };
    delete newErrors.logo;
    setErrors(newErrors);
    
    console.log('🗑️ Logo removed');
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    
    // Clear error when user starts typing
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const handleColorChange = (colorType, value) => {
    setFormData({
      ...formData,
      colors: {
        ...formData.colors,
        [colorType]: value
      }
    });
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Team name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Team name must be at least 2 characters';
    }

    if (!formData.coach.trim()) {
      newErrors.coach = 'Coach name is required';
    }

    // Email validation (optional field)
    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address';
    }

    // Phone validation (optional field)
    if (formData.contactPhone && !/^[\+]?[\d\s\-\(\)]+$/.test(formData.contactPhone)) {
      newErrors.contactPhone = 'Please enter a valid phone number';
    }

    // Website validation (optional field)
    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Website must start with http:// or https://';
    }

    // Founded year validation
    const currentYear = new Date().getFullYear();
    if (formData.founded < 1900 || formData.founded > currentYear + 1) {
      newErrors.founded = `Founded year must be between 1900 and ${currentYear + 1}`;
    }

    // Max players validation
    if (formData.maxPlayers < 10 || formData.maxPlayers > 30) {
      newErrors.maxPlayers = 'Maximum players must be between 10 and 30';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showNotification?.('error', 'Please fix the errors in the form');
      return;
    }

    setSaving(true);

    try {
      let logoUrl = formData.logo; // Keep existing logo if no new file

      // FIXED: Upload new logo if file is selected
      if (logoFile) {
        try {
          console.log('🔄 Uploading team logo...');
          const uploadResult = await uploadFile(logoFile, `teams/${currentSeason?.id}`);
          logoUrl = uploadResult.secure_url;
          console.log('✅ Logo uploaded:', logoUrl);
          showNotification?.('success', 'Logo uploaded successfully!');
        } catch (uploadError) {
          console.error('❌ Logo upload failed:', uploadError);
          showNotification?.('warning', 'Team will be saved but logo upload failed');
          // Continue with form submission even if logo upload fails
        }
      }

      // Prepare team data
      const teamData = {
        ...formData,
        logo: logoUrl,
        shortName: formData.name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().substring(0, 3),
        homeVenue: formData.venue, // Map venue to homeVenue for compatibility
        createdAt: team?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Initialize team statistics for new teams
        stats: team?.stats || {
          wins: 0,
          losses: 0,
          draws: 0,
          points: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          matchesPlayed: 0
        },
        // Season association
        season: currentSeason?.id || 'default'
      };

      console.log('💾 Saving team data:', { ...teamData, logo: logoUrl ? '[URL]' : null });

      // Call parent save handler
      await onSave(teamData);
      
      showNotification?.('success', `Team ${team ? 'updated' : 'created'} successfully!`);
      
    } catch (error) {
      console.error('❌ Error saving team:', error);
      setErrors({ submit: 'Failed to save team. Please try again.' });
      showNotification?.('error', `Failed to save team: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const isFormLoading = saving || uploadLoading;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {team ? 'Edit Team' : 'Create New Team'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {currentSeason ? `For season ${currentSeason.name}` : 'Team information and settings'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isFormLoading}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Error Messages */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center">
              <AlertCircle size={16} className="text-red-500 mr-2" />
              <span className="text-red-700 text-sm">{errors.submit}</span>
            </div>
          )}

          {uploadError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center">
              <AlertCircle size={16} className="text-red-500 mr-2" />
              <span className="text-red-700 text-sm">Upload error: {uploadError}</span>
            </div>
          )}

          {/* Logo Upload Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 flex items-center">
              <Camera className="mr-2" size={18} />
              Team Logo
            </h4>
            
            <div className="flex items-start space-x-6">
              {/* Logo Preview */}
              <div className="relative">
                <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300">
                  {logoPreview ? (
                    <img 
                      src={logoPreview} 
                      alt="Team logo preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Shield size={32} className="text-gray-400" />
                  )}
                </div>
                
                {/* Remove Logo Button */}
                {logoPreview && (
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200 transition-colors"
                    disabled={isFormLoading}
                    title="Remove logo"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isFormLoading}
                  >
                    {uploadLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload size={16} className="mr-2" />
                        {logoPreview ? 'Change Logo' : 'Upload Logo'}
                      </>
                    )}
                  </button>
                  
                  {logoPreview && (
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors flex items-center"
                      disabled={isFormLoading}
                    >
                      <Trash2 size={16} className="mr-2" />
                      Remove Logo
                    </button>
                  )}
                </div>
                
                <p className="text-xs text-gray-500 mt-2">
                  Recommended: Square image, max 2MB (JPG, PNG, GIF)
                  {currentSeason && (
                    <>
                      <br />
                      <span className="text-blue-600">Season: {currentSeason.name}</span>
                    </>
                  )}
                </p>
                
                {errors.logo && <p className="text-red-500 text-xs mt-1">{errors.logo}</p>}
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 flex items-center">
              <Users className="mr-2" size={18} />
              Basic Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Team Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter team name"
                  disabled={isFormLoading}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* Coach */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Coach *
                </label>
                <input
                  type="text"
                  value={formData.coach}
                  onChange={(e) => handleInputChange('coach', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.coach ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter coach name"
                  disabled={isFormLoading}
                />
                {errors.coach && <p className="text-red-500 text-xs mt-1">{errors.coach}</p>}
              </div>

              {/* Founded Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Founded Year
                </label>
                <input
                  type="number"
                  value={formData.founded}
                  onChange={(e) => handleInputChange('founded', parseInt(e.target.value))}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.founded ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={isFormLoading}
                />
                {errors.founded && <p className="text-red-500 text-xs mt-1">{errors.founded}</p>}
              </div>

              {/* Home Venue */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Home Venue
                </label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => handleInputChange('venue', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter home venue"
                  disabled={isFormLoading}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isFormLoading}
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Division */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Division
                </label>
                <select
                  value={formData.division}
                  onChange={(e) => handleInputChange('division', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isFormLoading}
                >
                  {divisions.map(division => (
                    <option key={division.value} value={division.value}>
                      {division.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Team Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter team description..."
                disabled={isFormLoading}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 flex items-center">
              <Phone className="mr-2" size={18} />
              Contact Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Contact Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.contactEmail ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="team@email.com"
                  disabled={isFormLoading}
                />
                {errors.contactEmail && <p className="text-red-500 text-xs mt-1">{errors.contactEmail}</p>}
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.contactPhone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="+960 123-4567"
                  disabled={isFormLoading}
                />
                {errors.contactPhone && <p className="text-red-500 text-xs mt-1">{errors.contactPhone}</p>}
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.website ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="https://team-website.com"
                  disabled={isFormLoading}
                />
                {errors.website && <p className="text-red-500 text-xs mt-1">{errors.website}</p>}
              </div>

              {/* Max Players */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Players
                </label>
                <input
                  type="number"
                  value={formData.maxPlayers}
                  onChange={(e) => handleInputChange('maxPlayers', parseInt(e.target.value))}
                  min="10"
                  max="30"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.maxPlayers ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={isFormLoading}
                />
                {errors.maxPlayers && <p className="text-red-500 text-xs mt-1">{errors.maxPlayers}</p>}
              </div>
            </div>
          </div>

          {/* Team Colors */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 flex items-center">
              <Trophy className="mr-2" size={18} />
              Team Colors
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Primary Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.colors.primary}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                    disabled={isFormLoading}
                  />
                  <input
                    type="text"
                    value={formData.colors.primary}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="#3B82F6"
                    disabled={isFormLoading}
                  />
                </div>
              </div>

              {/* Secondary Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Secondary Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.colors.secondary}
                    onChange={(e) => handleColorChange('secondary', e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                    disabled={isFormLoading}
                  />
                  <input
                    type="text"
                    value={formData.colors.secondary}
                    onChange={(e) => handleColorChange('secondary', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="#1E40AF"
                    disabled={isFormLoading}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isFormLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              disabled={isFormLoading}
            >
              {isFormLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{uploadLoading ? 'Uploading...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>{team ? 'Update Team' : 'Create Team'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamForm;