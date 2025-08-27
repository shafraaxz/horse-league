// components/player/PlayerEditForm.js - Player Edit Form Component
import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Calendar, Phone, Mail, MapPin, AlertCircle, X, Save, Upload, Trophy
} from 'lucide-react';

const PlayerEditForm = ({ player, teams, onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    jerseyNumber: '',
    position: 'Forward',
    dateOfBirth: '',
    nationality: '',
    height: '',
    weight: '',
    preferredFoot: 'Right',
    team: '',
    email: '',
    phone: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    passportNumber: '',
    idNumber: '',
    photo: '',
    previousClubs: ''
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  
  // Photo upload states
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    console.log('🔄 PlayerEditForm received player:', player);
    if (player) {
      const formattedData = {
        name: player.name || '',
        jerseyNumber: player.jerseyNumber ? String(player.jerseyNumber) : '',
        position: player.position || 'Forward',
        dateOfBirth: player.dateOfBirth ? new Date(player.dateOfBirth).toISOString().split('T')[0] : '',
        nationality: player.nationality || '',
        height: player.height ? String(player.height) : '',
        weight: player.weight ? String(player.weight) : '',
        preferredFoot: player.preferredFoot || 'Right',
        team: (player.team?._id || player.currentTeam?._id || player.team || player.currentTeam || ''),
        email: player.email || '',
        phone: player.phone || '',
        address: player.address || '',
        emergencyContact: player.emergencyContact || '',
        emergencyPhone: player.emergencyPhone || '',
        passportNumber: player.passportNumber || '',
        idNumber: player.idNumber || '',
        photo: player.photo || '',
        previousClubs: player.previousClubs || ''
      };
      
      console.log('📋 Setting player form data:', formattedData);
      setFormData(formattedData);
      
      // Set photo preview if player has existing photo
      if (player.photo) {
        setPhotoPreview(player.photo);
      }
    }
  }, [player]);

  // Handle file selection for photo upload
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
      setPhotoFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload photo to server
  const uploadPhoto = async (file) => {
    console.log('📤 Starting photo upload...');
    
    const uploadFormData = new FormData();
    uploadFormData.append('image', file);
    uploadFormData.append('type', 'player-photo');

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

  // Remove photo
  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
    setFormData(prev => ({ ...prev, photo: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setUploadError('');
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Player name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Player name must be at least 2 characters';
    }
    
    if (formData.jerseyNumber && (parseInt(formData.jerseyNumber) < 1 || parseInt(formData.jerseyNumber) > 99)) {
      newErrors.jerseyNumber = 'Jersey number must be between 1 and 99';
    }
    
    if (formData.height && (parseInt(formData.height) < 100 || parseInt(formData.height) > 250)) {
      newErrors.height = 'Height must be between 100-250 cm';
    }
    
    if (formData.weight && (parseInt(formData.weight) < 30 || parseInt(formData.weight) > 200)) {
      newErrors.weight = 'Weight must be between 30-200 kg';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 12 || age > 50) {
        newErrors.dateOfBirth = 'Player age must be between 12 and 50 years';
      }
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
      let photoUrl = formData.photo;

      // Upload new photo if selected
      if (photoFile) {
        setUploading(true);
        try {
          photoUrl = await uploadPhoto(photoFile);
          console.log('✅ Photo uploaded successfully:', photoUrl);
        } catch (uploadErr) {
          console.error('❌ Photo upload failed:', uploadErr);
          setUploadError('Failed to upload photo: ' + uploadErr.message);
          setUploading(false);
          setSaving(false);
          return;
        }
        setUploading(false);
      }

      const submitData = {
        ...formData,
        photo: photoUrl,
        jerseyNumber: formData.jerseyNumber ? parseInt(formData.jerseyNumber) : null,
        height: formData.height ? parseInt(formData.height) : null,
        weight: formData.weight ? parseInt(formData.weight) : null,
        team: formData.team || null,
        dateOfBirth: formData.dateOfBirth || null
      };
      
      console.log('💾 Submitting player update:', submitData);
      console.log('🆔 Player ID:', player?._id);
      
      await onSave(submitData);
    } catch (error) {
      console.error('❌ Error saving player:', error);
      setErrors({ submit: error.message || 'Failed to save player. Please try again.' });
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

  const positionOptions = [
    { value: 'Goalkeeper', label: 'Goalkeeper 🥅' },
    { value: 'Defender', label: 'Defender 🛡️' },
    { value: 'Midfielder', label: 'Midfielder ⚽' },
    { value: 'Forward', label: 'Forward 🎯' }
  ];

  const footOptions = [
    { value: 'Left', label: 'Left Foot' },
    { value: 'Right', label: 'Right Foot' },
    { value: 'Both', label: 'Both Feet' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs text-yellow-700">
            Debug: Player ID = {player?._id} | Team Count = {teams?.length}
          </p>
        </div>
      )}

      {/* Photo Upload Section */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <User className="h-5 w-5 text-blue-500 mr-2" />
          Player Photo
        </h3>
        
        <div className="flex items-start space-x-6">
          {/* Photo Preview */}
          <div className="flex-shrink-0">
            {photoPreview ? (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Player photo preview"
                  className="w-24 h-24 rounded-xl object-cover border-2 border-gray-200 shadow-sm"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
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
                  <User className="h-8 w-8 text-gray-400 mx-auto mb-1" />
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
                    <span>{photoPreview ? 'Change Photo' : 'Upload Photo'}</span>
                  </>
                )}
              </button>
              
              <div className="text-sm text-gray-500">
                <p>• Recommended: Square format (400x400)</p>
                <p>• Formats: JPG, PNG, WebP</p>
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
          <User className="h-5 w-5 text-blue-500 mr-2" />
          Basic Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Player Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., John Smith"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Jersey Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jersey Number
            </label>
            <input
              type="number"
              name="jerseyNumber"
              value={formData.jerseyNumber}
              onChange={handleChange}
              min="1"
              max="99"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.jerseyNumber ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., 10"
            />
            {errors.jerseyNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.jerseyNumber}</p>
            )}
          </div>

          {/* Position */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Position <span className="text-red-500">*</span>
            </label>
            <select
              name="position"
              value={formData.position}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              {positionOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Team */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Trophy className="h-4 w-4 inline mr-1" />
              Current Team
            </label>
            <select
              name="team"
              value={formData.team}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              <option value="">Free Agent</option>
              {teams?.map(team => (
                <option key={team._id} value={team._id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Date of Birth
            </label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.dateOfBirth && (
              <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
            )}
          </div>

          {/* Nationality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nationality
            </label>
            <input
              type="text"
              name="nationality"
              value={formData.nationality}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="e.g., English"
            />
          </div>
        </div>
      </div>

      {/* Physical Information */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Physical Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Height */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Height (cm)
            </label>
            <input
              type="number"
              name="height"
              value={formData.height}
              onChange={handleChange}
              min="100"
              max="250"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.height ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., 180"
            />
            {errors.height && (
              <p className="mt-1 text-sm text-red-600">{errors.height}</p>
            )}
          </div>

          {/* Weight */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight (kg)
            </label>
            <input
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              min="30"
              max="200"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.weight ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., 75"
            />
            {errors.weight && (
              <p className="mt-1 text-sm text-red-600">{errors.weight}</p>
            )}
          </div>

          {/* Preferred Foot */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Foot
            </label>
            <select
              name="preferredFoot"
              value={formData.preferredFoot}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              {footOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Phone className="h-5 w-5 text-green-500 mr-2" />
          Contact Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="h-4 w-4 inline mr-1" />
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
              placeholder="john@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="h-4 w-4 inline mr-1" />
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

          {/* Address */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="h-4 w-4 inline mr-1" />
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="123 Main St, City, Country"
            />
          </div>

          {/* Emergency Contact */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Emergency Contact
            </label>
            <input
              type="text"
              name="emergencyContact"
              value={formData.emergencyContact}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Contact Name"
            />
          </div>

          {/* Emergency Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Emergency Phone
            </label>
            <input
              type="tel"
              name="emergencyPhone"
              value={formData.emergencyPhone}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="+1 234 567 8900"
            />
          </div>
        </div>
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
              <span>Uploading Photo...</span>
            </>
          ) : saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Player</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default PlayerEditForm;