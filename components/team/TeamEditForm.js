// components/team/TeamEditForm.js - Team Edit Form Component
import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, Calendar, MapPin, AlertCircle, X, Save, Upload, Trophy, Palette
} from 'lucide-react';

const TeamEditForm = ({ team, onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    description: '',
    foundedYear: '',
    homeVenue: '',
    city: '',
    country: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#1e40af',
    logo: '',
    website: '',
    email: '',
    phone: '',
    address: '',
    manager: '',
    captain: ''
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
    console.log('🔄 TeamEditForm received team:', team);
    if (team) {
      const formattedData = {
        name: team.name || '',
        shortName: team.shortName || '',
        description: team.description || '',
        foundedYear: team.foundedYear ? String(team.foundedYear) : '',
        homeVenue: team.homeVenue || '',
        city: team.city || '',
        country: team.country || '',
        primaryColor: team.primaryColor || '#3b82f6',
        secondaryColor: team.secondaryColor || '#1e40af',
        logo: team.logo || '',
        website: team.website || '',
        email: team.email || '',
        phone: team.phone || '',
        address: team.address || '',
        manager: team.manager || '',
        captain: team.captain?._id || team.captain || ''
      };
      
      console.log('📋 Setting team form data:', formattedData);
      setFormData(formattedData);
      
      // Set logo preview if team has existing logo
      if (team.logo) {
        setLogoPreview(team.logo);
      }
    }
  }, [team]);

  // Handle file selection for logo upload
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setUploadError('Please select an image file');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('File size must be less than 5MB');
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

  // Upload logo to server
  const uploadLogo = async (file) => {
    console.log('📤 Starting logo upload...');
    
    const uploadFormData = new FormData();
    uploadFormData.append('image', file);
    uploadFormData.append('type', 'team-logo');

    try {
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
      
      if (!data.success && !data.url) {
        throw new Error(data.error || 'Upload failed');
      }
      
      return data.url || data.data?.url || data.filePath;
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
      newErrors.name = 'Team name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Team name must be at least 2 characters';
    }
    
    if (formData.shortName && formData.shortName.length > 5) {
      newErrors.shortName = 'Short name must be 5 characters or less';
    }
    
    if (formData.foundedYear) {
      const year = parseInt(formData.foundedYear);
      const currentYear = new Date().getFullYear();
      if (year < 1800 || year > currentYear) {
        newErrors.foundedYear = `Founded year must be between 1800 and ${currentYear}`;
      }
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Website must start with http:// or https://';
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
        foundedYear: formData.foundedYear ? parseInt(formData.foundedYear) : null,
        captain: formData.captain || null
      };
      
      console.log('💾 Submitting team update:', submitData);
      console.log('🆔 Team ID:', team?._id);
      
      await onSave(submitData);
    } catch (error) {
      console.error('❌ Error saving team:', error);
      setErrors({ submit: error.message || 'Failed to save team. Please try again.' });
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

  // Color preview component
  const ColorPreview = ({ color, label }) => (
    <div className="flex items-center space-x-2">
      <div
        className="w-6 h-6 rounded-lg border-2 border-gray-300 shadow-sm"
        style={{ backgroundColor: color }}
      ></div>
      <span className="text-sm text-gray-600">{label}</span>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs text-yellow-700">
            Debug: Team ID = {team?._id}
          </p>
        </div>
      )}

      {/* Logo Upload Section */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Shield className="h-5 w-5 text-blue-500 mr-2" />
          Team Logo
        </h3>
        
        <div className="flex items-start space-x-6">
          {/* Logo Preview */}
          <div className="flex-shrink-0">
            {logoPreview ? (
              <div className="relative">
                <img
                  src={logoPreview}
                  alt="Team logo preview"
                  className="w-24 h-24 rounded-xl object-cover border-2 border-gray-200 shadow-sm"
                />
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-sm"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div 
                className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-white hover:border-blue-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-center">
                  <Shield className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">Click to upload</p>
                </div>
              </div>
            )}
          </div>

          {/* Upload Controls */}
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || saving}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>{logoPreview ? 'Change Logo' : 'Upload Logo'}</span>
                  </>
                )}
              </button>
              
              <div className="text-sm text-gray-500">
                <p>• Recommended: Square format (500x500)</p>
                <p>• Formats: JPG, PNG, WebP, SVG</p>
                <p>• Maximum: 5MB</p>
              </div>

              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                    <span className="text-sm text-red-600">{uploadError}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Basic Information Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Shield className="h-5 w-5 text-blue-500 mr-2" />
          Basic Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Team Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Manchester United"
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
              maxLength="5"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.shortName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., MAN U"
            />
            {errors.shortName && (
              <p className="mt-1 text-sm text-red-600">{errors.shortName}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              {formData.shortName.length}/5 characters
            </p>
          </div>

          {/* Founded Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Founded Year
            </label>
            <input
              type="number"
              name="foundedYear"
              value={formData.foundedYear}
              onChange={handleChange}
              min="1800"
              max={new Date().getFullYear()}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.foundedYear ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., 1878"
            />
            {errors.foundedYear && (
              <p className="mt-1 text-sm text-red-600">{errors.foundedYear}</p>
            )}
          </div>

          {/* Home Venue */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Trophy className="h-4 w-4 inline mr-1" />
              Home Venue
            </label>
            <input
              type="text"
              name="homeVenue"
              value={formData.homeVenue}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="e.g., Old Trafford"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="h-4 w-4 inline mr-1" />
              City
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="e.g., Manchester"
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="e.g., England"
            />
          </div>
        </div>
      </div>

      {/* Team Colors Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Palette className="h-5 w-5 text-purple-500 mr-2" />
          Team Colors
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Primary Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Color
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="color"
                name="primaryColor"
                value={formData.primaryColor}
                onChange={handleChange}
                className="w-16 h-12 border-2 border-gray-300 rounded-lg cursor-pointer"
              />
              <div className="flex-1">
                <input
                  type="text"
                  name="primaryColor"
                  value={formData.primaryColor}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors font-mono"
                  placeholder="#3b82f6"
                />
              </div>
            </div>
            <div className="mt-2">
              <ColorPreview color={formData.primaryColor} label="Primary" />
            </div>
          </div>

          {/* Secondary Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Secondary Color
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="color"
                name="secondaryColor"
                value={formData.secondaryColor}
                onChange={handleChange}
                className="w-16 h-12 border-2 border-gray-300 rounded-lg cursor-pointer"
              />
              <div className="flex-1">
                <input
                  type="text"
                  name="secondaryColor"
                  value={formData.secondaryColor}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors font-mono"
                  placeholder="#1e40af"
                />
              </div>
            </div>
            <div className="mt-2">
              <ColorPreview color={formData.secondaryColor} label="Secondary" />
            </div>
          </div>
        </div>

        {/* Color Combination Preview */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Color Preview</h4>
          <div className="flex items-center space-x-4">
            <div
              className="w-16 h-16 rounded-lg shadow-sm border-2 border-white"
              style={{ backgroundColor: formData.primaryColor }}
            ></div>
            <div
              className="w-16 h-16 rounded-lg shadow-sm border-2 border-white"
              style={{ backgroundColor: formData.secondaryColor }}
            ></div>
            <div
              className="flex-1 h-16 rounded-lg shadow-sm border-2 border-white flex items-center justify-center text-white font-bold"
              style={{ 
                background: `linear-gradient(45deg, ${formData.primaryColor}, ${formData.secondaryColor})` 
              }}
            >
              {formData.shortName || 'TEAM'}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.website ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="https://example.com"
            />
            {errors.website && (
              <p className="mt-1 text-sm text-red-600">{errors.website}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="contact@team.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="+1 234 567 8900"
            />
          </div>

          {/* Manager */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Manager/Coach
            </label>
            <input
              type="text"
              name="manager"
              value={formData.manager}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="e.g., John Smith"
            />
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="2"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
              placeholder="Team headquarters address..."
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Team Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="4"
          maxLength="500"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
          placeholder="Brief description of the team, history, achievements..."
        />
        <p className="mt-1 text-sm text-gray-500">
          {formData.description.length}/500 characters
        </p>
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
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
          onClick={onCancel}
          disabled={saving || uploading}
          className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || uploading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
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
              <span>Save Team</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default TeamEditForm;