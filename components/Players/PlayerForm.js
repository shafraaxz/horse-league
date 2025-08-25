import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Users, 
  Activity, 
  Award,
  Save,
  AlertCircle,
  Camera
} from 'lucide-react';

// Import the API hook
import { useAPI } from '../../hooks/useAPI';

const PlayerForm = ({ 
  player, 
  teams = [], 
  onSave, 
  onCancel, 
  currentSeason, 
  showNotification,
  isAdmin = false 
}) => {
  // Use the API hook for Cloudinary uploads
  const { uploadFile, loading: uploadLoading, error: uploadError } = useAPI();

  const [formData, setFormData] = useState({
    name: player?.name || '',
    age: player?.age || '',
    position: player?.position || 'midfielder',
    email: player?.email || '',
    phone: player?.phone || '',
    dateOfBirth: player?.dateOfBirth || '',
    nationality: player?.nationality || 'Maldivian',
    height: player?.height || '',
    weight: player?.weight || '',
    jerseyNumber: player?.jerseyNumber || '',
    emergencyContact: player?.emergencyContact || '',
    emergencyPhone: player?.emergencyPhone || '',
    medicalInfo: player?.medicalInfo || '',
    experience: player?.experience || 0,
    preferredFoot: player?.preferredFoot || 'right',
    currentTeam: player?.currentTeam || '',
    currentTeamId: player?.currentTeamId || '',
    avatar: player?.avatar || null,
    status: player?.status || 'available',
    season: currentSeason?.id || 'default'
  });

  const [errors, setErrors] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(player?.avatar || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const positions = [
    { value: 'goalkeeper', label: 'Goalkeeper' },
    { value: 'defender', label: 'Defender' },
    { value: 'midfielder', label: 'Midfielder' },
    { value: 'forward', label: 'Forward' },
    { value: 'pivot', label: 'Pivot' }
  ];

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Player name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Player name must be at least 2 characters';
    }

    // Age validation (now optional, but validate if provided)
    if (formData.age && (formData.age < 16 || formData.age > 50)) {
      newErrors.age = 'Age must be between 16 and 50';
    }

    // Email validation (only if provided)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation (only if provided)
    if (formData.phone && !/^[\+]?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Emergency contact validation (only if provided)
    if (formData.emergencyContact && !formData.emergencyPhone.trim()) {
      newErrors.emergencyPhone = 'Emergency phone is required when emergency contact is provided';
    }

    if (formData.emergencyPhone && !/^[\+]?[\d\s\-\(\)]+$/.test(formData.emergencyPhone)) {
      newErrors.emergencyPhone = 'Please enter a valid emergency phone number';
    }

    // Physical info validation (only if provided)
    if (formData.height && (formData.height < 120 || formData.height > 220)) {
      newErrors.height = 'Height must be between 120cm and 220cm';
    }

    if (formData.weight && (formData.weight < 30 || formData.weight > 150)) {
      newErrors.weight = 'Weight must be between 30kg and 150kg';
    }

    // Jersey number validation (only if provided)
    if (formData.jerseyNumber && (formData.jerseyNumber < 1 || formData.jerseyNumber > 99)) {
      newErrors.jerseyNumber = 'Jersey number must be between 1 and 99';
    }

    // Date of birth validation (only if both age and DOB are provided)
    if (formData.dateOfBirth && formData.age) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const calculatedAge = today.getFullYear() - birthDate.getFullYear();
      
      if (Math.abs(calculatedAge - formData.age) > 1) {
        newErrors.dateOfBirth = 'Date of birth should match the age provided';
      }
    }

    // Experience validation
    if (formData.experience < 0 || formData.experience > 30) {
      newErrors.experience = 'Experience must be between 0 and 30 years';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors({ ...errors, avatar: 'Please select an image file' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, avatar: 'Image size must be less than 5MB' });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target.result);
      setAvatarFile(file);
      // Clear any previous avatar errors
      const newErrors = { ...errors };
      delete newErrors.avatar;
      setErrors(newErrors);
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setAvatarPreview(null);
    setAvatarFile(null);
    setFormData({ ...formData, avatar: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Auto-calculate age from date of birth
  const handleDateOfBirthChange = (dateString) => {
    setFormData({ ...formData, dateOfBirth: dateString });
    
    if (dateString) {
      const birthDate = new Date(dateString);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      
      // Adjust if birthday hasn't occurred this year
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      
      // Auto-fill age if it's reasonable
      if (calculatedAge >= 16 && calculatedAge <= 50) {
        setFormData(prev => ({ ...prev, age: calculatedAge, dateOfBirth: dateString }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setUploading(true);
      let avatarUrl = formData.avatar;

      // If there's a new avatar file, upload to Cloudinary using the hook
      if (avatarFile) {
        try {
          const uploadResponse = await uploadFile(avatarFile, 'player-photos', currentSeason);
          avatarUrl = uploadResponse.secure_url;
          showNotification?.('success', 'Photo uploaded successfully!');
        } catch (uploadError) {
          console.error('Avatar upload failed:', uploadError);
          showNotification?.('warning', 'Player will be saved but photo upload failed');
          // Continue with form submission even if avatar upload fails
        }
      }

      // Calculate age from date of birth if provided and age is not manually set
      let finalAge = formData.age;
      if (formData.dateOfBirth && !formData.age) {
        const birthDate = new Date(formData.dateOfBirth);
        const today = new Date();
        finalAge = today.getFullYear() - birthDate.getFullYear();
        
        // Adjust if birthday hasn't occurred this year
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          finalAge--;
        }
      }

      const playerData = {
        ...formData,
        age: finalAge || null, // Allow null age
        avatar: avatarUrl,
        // Add metadata
        createdAt: player?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        season: currentSeason?.id || 'default',
        // Initialize player statistics for new players
        stats: player?.stats || {
          goals: 0,
          assists: 0,
          matches: 0,
          yellowCards: 0,
          redCards: 0,
          minutesPlayed: 0,
          cleanSheets: formData.position === 'goalkeeper' ? 0 : undefined
        },
        // Registration info
        registrationDate: player?.registrationDate || new Date().toISOString(),
        // Contact info object
        contactInfo: {
          email: formData.email,
          phone: formData.phone,
          emergencyContact: formData.emergencyContact,
          emergencyPhone: formData.emergencyPhone
        },
        // Physical info
        physicalInfo: {
          height: formData.height,
          weight: formData.weight,
          preferredFoot: formData.preferredFoot
        },
        // Professional info
        professionalInfo: {
          experience: formData.experience,
          jerseyNumber: formData.jerseyNumber,
          medicalInfo: formData.medicalInfo
        }
      };

      await onSave(playerData);
      showNotification?.('success', `Player ${player ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error('Error saving player:', error);
      setErrors({ submit: 'Failed to save player. Please try again.' });
      showNotification?.('error', 'Failed to save player: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Handle team selection
  const handleTeamChange = (teamId) => {
    const selectedTeam = teams.find(team => team.id === teamId || team._id === teamId);
    setFormData({
      ...formData,
      currentTeamId: teamId,
      currentTeam: selectedTeam?.name || '',
      status: teamId ? 'transferred' : 'available'
    });
  };

  const isFormUploading = uploading || uploadLoading;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 my-8 max-h-[95vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="text-blue-600" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {player ? 'Edit Player' : 'Add New Player'}
                </h2>
                <p className="text-sm text-gray-600">
                  Season: {currentSeason?.name || 'Unknown'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isFormUploading}
            >
              <X size={24} />
            </button>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={16} className="text-red-500" />
              <span className="text-red-700 text-sm">{errors.submit}</span>
            </div>
          )}

          {/* Upload Error */}
          {uploadError && (
            <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={16} className="text-red-500" />
              <span className="text-red-700 text-sm">Upload error: {uploadError}</span>
            </div>
          )}

          {/* Photo Upload Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 flex items-center">
              <Camera className="mr-2" size={18} />
              Player Photo
            </h4>
            
            <div className="flex items-start space-x-4">
              {/* Photo Preview */}
              <div className="relative">
                <div className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-300">
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview} 
                      alt="Player avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={32} className="text-gray-400" />
                  )}
                </div>
                
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200 transition-colors"
                    disabled={isFormUploading}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isFormUploading}
                >
                  {uploadLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={16} className="mr-2" />
                      {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                    </>
                  )}
                </button>
                
                <p className="text-xs text-gray-500 mt-2">
                  Recommended: Square image, max 5MB (JPG, PNG, GIF)
                  {currentSeason && (
                    <>
                      <br />
                      <span className="text-blue-600">Photos are organized by season: {currentSeason.name}</span>
                    </>
                  )}
                </p>
                
                {errors.avatar && <p className="text-red-500 text-xs mt-1">{errors.avatar}</p>}
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 flex items-center">
              <User className="mr-2" size={18} />
              Basic Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter player's full name"
                  disabled={isFormUploading}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleDateOfBirthChange(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isFormUploading}
                />
                {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>}
                <p className="text-xs text-gray-500 mt-1">Age will be calculated automatically</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || '' })}
                  min="16"
                  max="50"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.age ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Age (optional)"
                  disabled={isFormUploading}
                />
                {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
                <p className="text-xs text-gray-500 mt-1">Optional - leave blank if date of birth is provided</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position *
                </label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isFormUploading}
                >
                  {positions.map(position => (
                    <option key={position.value} value={position.value}>
                      {position.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nationality
                </label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nationality"
                  disabled={isFormUploading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Team
                </label>
                <select
                  value={formData.currentTeamId}
                  onChange={(e) => handleTeamChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isFormUploading}
                >
                  <option value="">Free Agent</option>
                  {teams.map(team => (
                    <option key={team.id || team._id} value={team.id || team._id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 flex items-center">
              <Mail className="mr-2" size={18} />
              Contact Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Email address"
                  disabled={isFormUploading}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Phone number"
                  disabled={isFormUploading}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emergency Contact
                </label>
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Emergency contact name"
                  disabled={isFormUploading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emergency Phone
                </label>
                <input
                  type="tel"
                  value={formData.emergencyPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.emergencyPhone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Emergency contact phone"
                  disabled={isFormUploading}
                />
                {errors.emergencyPhone && <p className="text-red-500 text-xs mt-1">{errors.emergencyPhone}</p>}
              </div>
            </div>
          </div>

          {/* Physical Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 flex items-center">
              <Activity className="mr-2" size={18} />
              Physical Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) || '' })}
                  min="120"
                  max="220"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.height ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Height in cm"
                  disabled={isFormUploading}
                />
                {errors.height && <p className="text-red-500 text-xs mt-1">{errors.height}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || '' })}
                  min="30"
                  max="150"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.weight ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Weight in kg"
                  disabled={isFormUploading}
                />
                {errors.weight && <p className="text-red-500 text-xs mt-1">{errors.weight}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Foot
                </label>
                <select
                  value={formData.preferredFoot}
                  onChange={(e) => setFormData({ ...formData, preferredFoot: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isFormUploading}
                >
                  <option value="right">Right</option>
                  <option value="left">Left</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 flex items-center">
              <Award className="mr-2" size={18} />
              Professional Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Experience (years)
                </label>
                <input
                  type="number"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
                  min="0"
                  max="30"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.experience ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Years of experience"
                  disabled={isFormUploading}
                />
                {errors.experience && <p className="text-red-500 text-xs mt-1">{errors.experience}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jersey Number
                </label>
                <input
                  type="number"
                  value={formData.jerseyNumber}
                  onChange={(e) => setFormData({ ...formData, jerseyNumber: parseInt(e.target.value) || '' })}
                  min="1"
                  max="99"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.jerseyNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Jersey number (1-99)"
                  disabled={isFormUploading}
                />
                {errors.jerseyNumber && <p className="text-red-500 text-xs mt-1">{errors.jerseyNumber}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medical Information
              </label>
              <textarea
                value={formData.medicalInfo}
                onChange={(e) => setFormData({ ...formData, medicalInfo: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any medical conditions, allergies, or notes..."
                disabled={isFormUploading}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isFormUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isFormUploading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isFormUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{uploadLoading ? 'Uploading...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>{player ? 'Update Player' : 'Add Player'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlayerForm;