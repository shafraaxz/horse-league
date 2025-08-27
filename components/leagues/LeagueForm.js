// components/leagues/LeagueForm.js - Enhanced with all required fields
import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  X, 
  Camera, 
  Image, 
  Trophy, 
  MapPin, 
  Calendar, 
  Target, 
  Users, 
  Settings,
  AlertCircle,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const LeagueForm = ({ league, onSuccess, onCancel }) => {
  const { createLeague, updateLeague, loading } = useApp();
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    shortName: '',
    description: '',
    
    // Competition Details
    type: 'league',
    sport: 'football',
    status: 'upcoming',
    season: '',
    
    // Visual & Location
    logo: '',
    location: '',
    
    // Schedule
    startDate: '',
    endDate: '',
    
    // Competition Structure
    maxTeams: 20,
    
    // Scoring System
    pointsForWin: 3,
    pointsForDraw: 1,
    pointsForLoss: 0,
    
    // Match Settings
    matchDuration: 90,
    extraTime: false,
    penalties: false,
    
    // Additional Information
    rules: '',
    prizeMoney: 0,
    sponsor: '',
    
    // Visibility
    isPublic: true,
    allowSpectators: true
  });

  // Form state management
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('basic');
  
  // Logo upload states
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

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
        logo: league.logo || '',
        location: league.location || '',
        startDate: league.startDate ? new Date(league.startDate).toISOString().split('T')[0] : '',
        endDate: league.endDate ? new Date(league.endDate).toISOString().split('T')[0] : '',
        maxTeams: league.maxTeams || 20,
        pointsForWin: league.pointsForWin || 3,
        pointsForDraw: league.pointsForDraw || 1,
        pointsForLoss: league.pointsForLoss || 0,
        matchDuration: league.matchDuration || 90,
        extraTime: league.extraTime || false,
        penalties: league.penalties || false,
        rules: league.rules || '',
        prizeMoney: league.prizeMoney || 0,
        sponsor: league.sponsor || '',
        isPublic: league.isPublic !== undefined ? league.isPublic : true,
        allowSpectators: league.allowSpectators !== undefined ? league.allowSpectators : true
      });
      
      if (league.logo) {
        setLogoPreview(league.logo);
      }
    }
  }, [league]);

  // Validation
  const validateForm = () => {
    const newErrors = {};
    
    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'League name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'League name must be at least 3 characters';
    } else if (formData.name.length > 100) {
      newErrors.name = 'League name cannot exceed 100 characters';
    }
    
    if (formData.shortName && formData.shortName.length > 10) {
      newErrors.shortName = 'Short name cannot exceed 10 characters';
    }
    
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description cannot exceed 500 characters';
    }
    
    if (formData.maxTeams < 2 || formData.maxTeams > 50) {
      newErrors.maxTeams = 'Maximum teams must be between 2 and 50';
    }
    
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        newErrors.endDate = 'End date must be after start date';
      }
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    
    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }
    
    if (formData.matchDuration < 1) {
      newErrors.matchDuration = 'Match duration must be at least 1 minute';
    }
    
    if (formData.prizeMoney < 0) {
      newErrors.prizeMoney = 'Prize money cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setUploadError('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setUploadError('File size must be less than 5MB');
        return;
      }

      setUploadError('');
      setLogoFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload logo
  const uploadLogo = async (file) => {
    const uploadFormData = new FormData();
    uploadFormData.append('image', file);
    uploadFormData.append('type', 'league-logo');

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: uploadFormData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Upload error:', error);
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
  };

  // Handle form changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploadError('');

    if (!validateForm()) {
      return;
    }

    try {
      let logoUrl = formData.logo;

      // Upload new logo if selected
      if (logoFile) {
        setUploading(true);
        try {
          logoUrl = await uploadLogo(logoFile);
        } catch (uploadErr) {
          setUploadError('Failed to upload logo: ' + uploadErr.message);
          setUploading(false);
          return;
        }
        setUploading(false);
      }

      // Prepare submit data
      const submitData = {
        ...formData,
        logo: logoUrl,
        maxTeams: parseInt(formData.maxTeams),
        pointsForWin: parseInt(formData.pointsForWin),
        pointsForDraw: parseInt(formData.pointsForDraw),
        pointsForLoss: parseInt(formData.pointsForLoss),
        matchDuration: parseInt(formData.matchDuration),
        prizeMoney: parseFloat(formData.prizeMoney) || 0
      };

      // Submit
      if (league) {
        await updateLeague(league._id, submitData);
      } else {
        await createLeague(submitData);
      }
      
      onSuccess && onSuccess();
    } catch (error) {
      console.error('Form submission error:', error);
      setUploadError('Failed to save league: ' + error.message);
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
    { value: 'baseball', label: 'Baseball ⚾' },
    { value: 'futsal', label: 'Futsal ⚽' }
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

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Trophy },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'rules', label: 'Rules & Scoring', icon: Target },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {league ? 'Edit League' : 'Create New League'}
        </h2>
        <p className="text-gray-600">
          {league ? 'Update your league information' : 'Set up a new league or tournament'}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information Tab */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            {/* Logo Upload Section */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Image className="h-5 w-5 mr-2 text-blue-500" />
                League Logo
              </h3>
              
              <div className="flex items-start space-x-6">
                {/* Logo Preview */}
                <div className="flex-shrink-0">
                  {logoPreview ? (
                    <div className="relative">
                      <img
                        src={logoPreview}
                        alt="League logo preview"
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
                      <Camera className="h-8 w-8 text-gray-400" />
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
                      disabled={uploading || loading}
                      className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <Upload className="h-4 w-4" />
                      <span>{logoPreview ? 'Change Logo' : 'Upload Logo'}</span>
                    </button>
                    
                    <div className="text-sm text-gray-500">
                      <p>• Recommended: 500x500 pixels</p>
                      <p>• Formats: JPG, PNG, WebP</p>
                      <p>• Maximum: 5MB</p>
                    </div>
                  </div>
                </div>
              </div>

              {uploadError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                    <span className="text-sm text-red-600">{uploadError}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Basic Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* League Name */}
              <div className="md:col-span-2">
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
                />
                {errors.maxTeams && (
                  <p className="mt-1 text-sm text-red-600">{errors.maxTeams}</p>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
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

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                maxLength="500"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe your league, rules, format, prizes, etc..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                {formData.description.length}/500 characters
              </p>
            </div>
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.startDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
                )}
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date <span className="text-red-500">*</span>
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

            {/* Match Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Match Duration (minutes)
              </label>
              <input
                type="number"
                name="matchDuration"
                value={formData.matchDuration}
                onChange={handleChange}
                min="1"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.matchDuration ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.matchDuration && (
                <p className="mt-1 text-sm text-red-600">{errors.matchDuration}</p>
              )}
            </div>

            {/* Match Options */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900">Match Options</h4>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="extraTime"
                    checked={formData.extraTime}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Allow Extra Time</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="penalties"
                    checked={formData.penalties}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Allow Penalty Shootouts</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Rules & Scoring Tab */}
        {activeTab === 'rules' && (
          <div className="space-y-6">
            {/* Points System */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Points System</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Points for Win
                  </label>
                  <input
                    type="number"
                    name="pointsForWin"
                    value={formData.pointsForWin}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Points for Draw
                  </label>
                  <input
                    type="number"
                    name="pointsForDraw"
                    value={formData.pointsForDraw}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Points for Loss
                  </label>
                  <input
                    type="number"
                    name="pointsForLoss"
                    value={formData.pointsForLoss}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Rules */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                League Rules
              </label>
              <textarea
                name="rules"
                value={formData.rules}
                onChange={handleChange}
                rows="6"
                maxLength="2000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                placeholder="Enter detailed rules and regulations for your league..."
              />
              <p className="mt-1 text-sm text-gray-500">
                {formData.rules.length}/2000 characters
              </p>
            </div>

            {/* Prize Money */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prize Money ($)
              </label>
              <input
                type="number"
                name="prizeMoney"
                value={formData.prizeMoney}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.prizeMoney ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.prizeMoney && (
                <p className="mt-1 text-sm text-red-600">{errors.prizeMoney}</p>
              )}
            </div>

            {/* Sponsor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sponsor
              </label>
              <input
                type="text"
                name="sponsor"
                value={formData.sponsor}
                onChange={handleChange}
                maxLength="100"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="e.g., Nike, Adidas, Local Business"
              />
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-gray-900">Visibility & Access</h4>
            
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-700">Public League</div>
                  <div className="text-sm text-gray-500">Allow anyone to view this league</div>
                </div>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="allowSpectators"
                  checked={formData.allowSpectators}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-700">Allow Spectators</div>
                  <div className="text-sm text-gray-500">Permit spectators to watch matches</div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel || onSuccess}
            disabled={loading || uploading}
            className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || uploading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Uploading...</span>
              </>
            ) : loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>{league ? 'Update League' : 'Create League'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeagueForm;