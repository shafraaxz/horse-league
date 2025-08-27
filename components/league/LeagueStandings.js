// 1. Fix for League Table Not Showing
// components/league/LeagueStandings.js - Enhanced with better error handling

import React, { useState, useEffect } from 'react';
import { Trophy, Award, Target, Crown, TrendingUp, TrendingDown } from 'lucide-react';

const LeagueStandings = ({ league, teams, matches, onNavigate, setActiveTab }) => {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (league?._id) {
      calculateStandings();
    }
  }, [league, teams, matches]);

  const calculateStandings = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Calculate standings from matches data
      if (teams && matches) {
        const calculatedStandings = calculateStandingsFromMatches(teams, matches);
        setStandings(calculatedStandings);
      } else {
        // Fallback to API
        await fetchStandingsFromAPI();
      }
    } catch (error) {
      console.error('Error calculating standings:', error);
      setError('Failed to load standings');
    } finally {
      setLoading(false);
    }
  };

  const calculateStandingsFromMatches = (teams, matches) => {
    const teamStats = {};
    
    // Initialize team stats
    teams.forEach(team => {
      teamStats[team._id] = {
        _id: team._id,
        name: team.name,
        logo: team.logo,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        form: []
      };
    });

    // Process completed matches
    const completedMatches = matches?.filter(match => match.status === 'completed') || [];
    
    completedMatches.forEach(match => {
      const homeTeam = match.homeTeam._id || match.homeTeam;
      const awayTeam = match.awayTeam._id || match.awayTeam;
      const homeScore = match.homeScore || 0;
      const awayScore = match.awayScore || 0;

      if (teamStats[homeTeam] && teamStats[awayTeam]) {
        // Update home team
        teamStats[homeTeam].played++;
        teamStats[homeTeam].goalsFor += homeScore;
        teamStats[homeTeam].goalsAgainst += awayScore;

        // Update away team
        teamStats[awayTeam].played++;
        teamStats[awayTeam].goalsFor += awayScore;
        teamStats[awayTeam].goalsAgainst += homeScore;

        // Determine result
        if (homeScore > awayScore) {
          teamStats[homeTeam].wins++;
          teamStats[homeTeam].points += 3;
          teamStats[homeTeam].form.unshift('W');
          teamStats[awayTeam].losses++;
          teamStats[awayTeam].form.unshift('L');
        } else if (homeScore < awayScore) {
          teamStats[awayTeam].wins++;
          teamStats[awayTeam].points += 3;
          teamStats[awayTeam].form.unshift('W');
          teamStats[homeTeam].losses++;
          teamStats[homeTeam].form.unshift('L');
        } else {
          teamStats[homeTeam].draws++;
          teamStats[homeTeam].points++;
          teamStats[homeTeam].form.unshift('D');
          teamStats[awayTeam].draws++;
          teamStats[awayTeam].points++;
          teamStats[awayTeam].form.unshift('D');
        }

        // Calculate goal difference
        teamStats[homeTeam].goalDifference = teamStats[homeTeam].goalsFor - teamStats[homeTeam].goalsAgainst;
        teamStats[awayTeam].goalDifference = teamStats[awayTeam].goalsFor - teamStats[awayTeam].goalsAgainst;

        // Keep only last 5 form results
        if (teamStats[homeTeam].form.length > 5) teamStats[homeTeam].form = teamStats[homeTeam].form.slice(0, 5);
        if (teamStats[awayTeam].form.length > 5) teamStats[awayTeam].form = teamStats[awayTeam].form.slice(0, 5);
      }
    });

    // Sort standings
    return Object.values(teamStats).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });
  };

  const fetchStandingsFromAPI = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/leagues/${league._id}/standings`, {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStandings(data.data || data.standings || []);
      } else {
        throw new Error('Failed to fetch standings');
      }
    } catch (error) {
      console.error('API fetch error:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading standings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={calculateStandings}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (standings.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">No Standings Available</h3>
        <p className="text-gray-500">Play some matches to see the league table</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Award className="h-7 w-7 text-yellow-500" />
            <div>
              <h3 className="text-2xl font-bold text-gray-900">League Standings</h3>
              <p className="text-gray-600">Current season table</p>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            {standings.length} Teams
          </div>
        </div>
      </div>

      {/* Standings Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Pos</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Team</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">P</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">W</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">D</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">L</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">GF</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">GA</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">GD</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Pts</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Form</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {standings.map((team, index) => {
                const position = index + 1;
                const isChampion = position === 1;
                const isEurope = position <= 4;
                const isRelegation = position > standings.length - 3;

                return (
                  <tr 
                    key={team._id}
                    className={`hover:bg-gray-50 transition-colors ${
                      isChampion ? 'bg-yellow-50' : 
                      isEurope ? 'bg-blue-50' : 
                      isRelegation ? 'bg-red-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          isChampion ? 'bg-yellow-500 text-white' :
                          isEurope ? 'bg-blue-500 text-white' :
                          isRelegation ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {position}
                        </span>
                        {isChampion && <Crown className="h-4 w-4 text-yellow-500" />}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                          {team.logo ? (
                            <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Trophy className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{team.name}</p>
                          <p className="text-sm text-gray-500">{team.shortName || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium">{team.played}</td>
                    <td className="px-6 py-4 text-center text-sm">{team.wins}</td>
                    <td className="px-6 py-4 text-center text-sm">{team.draws}</td>
                    <td className="px-6 py-4 text-center text-sm">{team.losses}</td>
                    <td className="px-6 py-4 text-center text-sm">{team.goalsFor}</td>
                    <td className="px-6 py-4 text-center text-sm">{team.goalsAgainst}</td>
                    <td className={`px-6 py-4 text-center text-sm font-medium ${
                      team.goalDifference > 0 ? 'text-green-600' : 
                      team.goalDifference < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-bold">{team.points}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        {team.form.map((result, i) => (
                          <span
                            key={i}
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                              result === 'W' ? 'bg-green-500' :
                              result === 'D' ? 'bg-gray-400' : 'bg-red-500'
                            }`}
                          >
                            {result}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeagueStandings;

// 2. Fix for Logo Upload Issues
// components/shared/ImageUpload.js - Reusable image upload component

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';

const ImageUpload = ({ 
  currentImage, 
  onImageChange, 
  type = 'image',
  maxSize = 5, // MB
  acceptedTypes = 'image/*',
  className = '',
  placeholder = 'Upload Image',
  showPreview = true 
}) => {
  const [preview, setPreview] = useState(currentImage || '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select an image file');
    }

    // Check file size
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new Error(`File size must be less than ${maxSize}MB`);
    }

    return true;
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setError('');
      validateFile(file);
      setUploading(true);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);

      // Upload file
      const uploadedUrl = await uploadFile(file);
      
      // Call parent callback
      onImageChange(uploadedUrl);
      
    } catch (error) {
      console.error('File upload error:', error);
      setError(error.message);
      setPreview(currentImage || '');
    } finally {
      setUploading(false);
    }
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);

    const token = localStorage.getItem('token');
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Upload failed');
    }

    const data = await response.json();
    return data.url || data.filePath || data.data?.url;
  };

  const handleRemove = () => {
    setPreview('');
    setError('');
    onImageChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {showPreview && preview && (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Preview"
            className="w-20 h-20 rounded-lg object-cover border border-gray-200"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            disabled={uploading}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        {uploading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Uploading...</span>
          </>
        ) : (
          <>
            {preview ? <ImageIcon className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
            <span>{preview ? 'Change Image' : placeholder}</span>
          </>
        )}
      </button>

      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Supports JPG, PNG, WebP up to {maxSize}MB
      </p>
    </div>
  );
};

export default ImageUpload;

// 3. Fixed Admin Panel Settings
// components/admin/AdminSettings.js - Enhanced admin panel settings

import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, Check, AlertTriangle } from 'lucide-react';
import ImageUpload from '../shared/ImageUpload';

const AdminSettings = ({ league, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    description: '',
    logo: '',
    banner: '',
    type: 'league',
    sport: 'football',
    status: 'active'
  });
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (league) {
      setFormData({
        name: league.name || '',
        shortName: league.shortName || '',
        description: league.description || '',
        logo: league.logo || '',
        banner: league.banner || '',
        type: league.type || 'league',
        sport: league.sport || 'football',
        status: league.status || 'active'
      });
    }
  }, [league]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (field, url) => {
    setFormData(prev => ({
      ...prev,
      [field]: url
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/leagues/${league._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: 'Settings updated successfully!' });
        onUpdate?.(data.data || data);
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Settings update error:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3">
          <Settings className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">League Settings</h2>
            <p className="text-gray-600">Manage your league configuration and branding</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                League Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Short Name
              </label>
              <input
                type="text"
                name="shortName"
                value={formData.shortName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                maxLength="10"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Competition Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Competition Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="league">League</option>
                <option value="cup">Cup</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sport
              </label>
              <select
                name="sport"
                value={formData.sport}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="football">Football</option>
                <option value="futsal">Futsal</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Branding & Media</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                League Logo
              </label>
              <ImageUpload
                currentImage={formData.logo}
                onImageChange={(url) => handleImageChange('logo', url)}
                type="league-logo"
                placeholder="Upload Logo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                League Banner
              </label>
              <ImageUpload
                currentImage={formData.banner}
                onImageChange={(url) => handleImageChange('banner', url)}
                type="league-banner"
                placeholder="Upload Banner"
                maxSize={10}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            {message.text && (
              <div className={`flex items-center space-x-2 ${
                message.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`}>
                {message.type === 'success' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <span className="text-sm">{message.text}</span>
              </div>
            )}

            <div className="flex items-center space-x-3 ml-auto">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Settings</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;