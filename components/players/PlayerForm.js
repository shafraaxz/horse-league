// components/players/PlayerForm.js - Enhanced with validation and admin controls
import React, { useState, useEffect } from 'react';
import { Upload, X, User, Calendar, MapPin, Ruler, Weight, Zap } from 'lucide-react';

const PlayerForm = ({ player, teamId, onSuccess, onCancel, currentUser }) => {
  const [formData, setFormData] = useState({
    name: '',
    jerseyNumber: '',
    position: 'Forward',
    dateOfBirth: '',
    nationality: '',
    height: '',
    weight: '',
    preferredFoot: 'Right',
    photo: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Check if user can manage players
  const canManagePlayer = currentUser && (
    currentUser.role === 'super_admin' ||
    currentUser.role === 'league_admin' ||
    currentUser.permissions?.canManagePlayers ||
    currentUser.assignedTeams?.includes(teamId)
  );

  useEffect(() => {
    if (player) {
      setFormData({
        name: player.name || '',
        jerseyNumber: player.jerseyNumber || '',
        position: player.position || 'Forward',
        dateOfBirth: player.dateOfBirth ? new Date(player.dateOfBirth).toISOString().split('T')[0] : '',
        nationality: player.nationality || '',
        height: player.height || '',
        weight: player.weight || '',
        preferredFoot: player.preferredFoot || 'Right',
        photo: player.photo || ''
      });
      if (player.photo) {
        setPhotoPreview(player.photo);
      }
    }
  }, [player]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Player name is required';
    }

    if (!formData.jerseyNumber) {
      newErrors.jerseyNumber = 'Jersey number is required';
    } else if (formData.jerseyNumber < 1 || formData.jerseyNumber > 99) {
      newErrors.jerseyNumber = 'Jersey number must be between 1 and 99';
    }

    if (!formData.position) {
      newErrors.position = 'Position is required';
    }

    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 16 || age > 50) {
        newErrors.dateOfBirth = 'Player age should be between 16 and 50';
      }
    }

    if (formData.height && (formData.height < 150 || formData.height > 220)) {
      newErrors.height = 'Height should be between 150cm and 220cm';
    }

    if (formData.weight && (formData.weight < 50 || formData.weight > 120)) {
      newErrors.weight = 'Weight should be between 50kg and 120kg';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, photo: 'Please select a valid image file' }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, photo: 'Image file must be less than 5MB' }));
        return;
      }

      setPhotoFile(file);
      setErrors(prev => ({ ...prev, photo: '' }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!canManagePlayer) {
      alert('You do not have permission to manage players');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      let photoUrl = formData.photo;

      // Upload photo if a new file is selected
      if (photoFile) {
        const photoFormData = new FormData();
        photoFormData.append('image', photoFile);
        photoFormData.append('type', 'player-photo');

        const uploadResponse = await fetch('/api/upload/image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: photoFormData,
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          photoUrl = uploadResult.secure_url;
        } else {
          throw new Error('Failed to upload photo');
        }
      }

      const playerData = {
        ...formData,
        photo: photoUrl,
        team: teamId,
        jerseyNumber: parseInt(formData.jerseyNumber),
        height: formData.height ? parseInt(formData.height) : null,
        weight: formData.weight ? parseInt(formData.weight) : null,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : null
      };

      await onSuccess(playerData);
    } catch (error) {
      console.error('Error submitting player:', error);
      setErrors({ submit: error.message || 'Failed to save player' });
    } finally {
      setLoading(false);
    }
  };

  if (!canManagePlayer) {
    return (
      <div className="text-center py-8">
        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You don't have permission to manage players for this team.</p>
        <button
          onClick={onCancel}
          className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          Close
        </button>
      </div>
    );
  }

  const age = calculateAge(formData.dateOfBirth);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Player Photo */}
      <div className="text-center">
        <div className="mb-4">
          {photoPreview ? (
            <img
              src={photoPreview}
              alt="Player photo preview"
              className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-gray-200"
            />
          ) : (
            <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center bg-gray-200 border-4 border-gray-200">
              <User className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>
        <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
          <Upload className="w-4 h-4 mr-2" />
          Upload Photo
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </label>
        {errors.photo && <p className="text-red-500 text-sm mt-1">{errors.photo}</p>}
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <User className="w-4 h-4 inline mr-1" />
            Player Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter player name"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Jersey Number *
          </label>
          <input
            type="number"
            name="jerseyNumber"
            value={formData.jerseyNumber}
            onChange={handleInputChange}
            required
            min="1"
            max="99"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.jerseyNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="1-99"
          />
          {errors.jerseyNumber && <p className="text-red-500 text-sm mt-1">{errors.jerseyNumber}</p>}
        </div>
      </div>

      {/* Position and Preferred Foot */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Position *
          </label>
          <select
            name="position"
            value={formData.position}
            onChange={handleInputChange}
            required
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.position ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="Goalkeeper">Goalkeeper</option>
            <option value="Defender">Defender</option>
            <option value="Midfielder">Midfielder</option>
            <option value="Forward">Forward</option>
          </select>
          {errors.position && <p className="text-red-500 text-sm mt-1">{errors.position}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Zap className="w-4 h-4 inline mr-1" />
            Preferred Foot
          </label>
          <select
            name="preferredFoot"
            value={formData.preferredFoot}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Left">Left</option>
            <option value="Right">Right</option>
            <option value="Both">Both</option>
          </select>
        </div>
      </div>

      {/* Personal Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Calendar className="w-4 h-4 inline mr-1" />
            Date of Birth
          </label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {age && <p className="text-sm text-gray-600 mt-1">Age: {age} years</p>}
          {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <MapPin className="w-4 h-4 inline mr-1" />
            Nationality
          </label>
          <input
            type="text"
            name="nationality"
            value={formData.nationality}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Brazilian, English"
          />
        </div>
      </div>

      {/* Physical Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Ruler className="w-4 h-4 inline mr-1" />
            Height (cm)
          </label>
          <input
            type="number"
            name="height"
            value={formData.height}
            onChange={handleInputChange}
            min="150"
            max="220"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.height ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., 180"
          />
          {errors.height && <p className="text-red-500 text-sm mt-1">{errors.height}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Weight className="w-4 h-4 inline mr-1" />
            Weight (kg)
          </label>
          <input
            type="number"
            name="weight"
            value={formData.weight}
            onChange={handleInputChange}
            min="50"
            max="120"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.weight ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., 75"
          />
          {errors.weight && <p className="text-red-500 text-sm mt-1">{errors.weight}</p>}
        </div>
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm">{errors.submit}</p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex space-x-4 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !formData.name.trim() || !formData.jerseyNumber}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </span>
          ) : (
            player ? 'Update Player' : 'Add Player'
          )}
        </button>
      </div>
    </form>
  );
};

export default PlayerForm;