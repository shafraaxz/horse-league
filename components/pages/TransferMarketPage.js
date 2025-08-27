// components/pages/TransferMarketPage.js - Modern Transfer Market Interface
import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Search, 
  Filter,
  UserPlus,
  ArrowRight,
  Clock,
  MapPin,
  Calendar,
  Trophy,
  Star,
  Eye,
  UserCheck,
  UserX,
  Upload,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  User
} from 'lucide-react';

// Modern Card Component
const Card = ({ children, className = '', hover = false }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${hover ? 'hover:shadow-md transition-shadow' : ''} ${className}`}>
    {children}
  </div>
);

// Modern Button Component
const Button = ({ variant = 'primary', size = 'md', icon: Icon, children, className = '', ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500',
    success: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 focus:ring-green-500',
    danger: 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 focus:ring-red-500',
    outline: 'border-2 border-gray-200 text-gray-700 hover:bg-gray-50 focus:ring-gray-500'
  };
  
  const sizes = {
    sm: 'px-3 py-2 text-sm gap-2',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-3'
  };
  
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </button>
  );
};

// Player Card Component
const PlayerCard = ({ player, onSelect, onAssign, onRelease, showActions = true }) => {
  const [imageError, setImageError] = useState(false);
  
  return (
    <Card hover className="overflow-hidden">
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Player Photo */}
          <div className="w-16 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
            {player.photo && !imageError ? (
              <img 
                src={player.photo} 
                alt={player.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
                <User className="w-8 h-8 text-gray-600" />
              </div>
            )}
          </div>
          
          {/* Player Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-bold text-gray-900 truncate">{player.name}</h3>
              {player.jerseyNumber && (
                <span className="px-2 py-1 text-xs font-bold bg-blue-100 text-blue-800 rounded">
                  #{player.jerseyNumber}
                </span>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  {player.position}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {player.age} years
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {player.nationality}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                  player.isAvailable 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {player.isAvailable ? (
                    <>
                      <CheckCircle className="w-3 h-3" />
                      Free Agent
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3 h-3" />
                      {player.teamName}
                    </>
                  )}
                </span>
                
                {player.statistics && (
                  <div className="text-xs text-gray-500">
                    {player.statistics.totalMatches || 0}M • {player.statistics.totalGoals || 0}G • {player.statistics.totalAssists || 0}A
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        {showActions && (
          <div className="mt-4 flex gap-2">
            <Button size="sm" variant="outline" icon={Eye} onClick={() => onSelect?.(player)}>
              View Details
            </Button>
            
            {player.isAvailable ? (
              <Button size="sm" icon={UserPlus} onClick={() => onAssign?.(player)}>
                Assign to Team
              </Button>
            ) : (
              <Button size="sm" variant="danger" icon={UserX} onClick={() => onRelease?.(player)}>
                Release
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

// Player Registration Modal
const PlayerRegistrationModal = ({ isOpen, onClose, onSubmit, teams = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    firstName: '',
    lastName: '',
    position: '',
    dateOfBirth: '',
    nationality: '',
    email: '',
    phone: '',
    height: '',
    weight: '',
    preferredFoot: 'Right',
    photo: null,
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
      email: ''
    }
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const uploadPhoto = async (file) => {
    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);
      uploadFormData.append('type', 'player-photo');
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData
      });
      
      const result = await response.json();
      if (result.success) {
        setFormData(prev => ({ ...prev, photo: result.data.url }));
      } else {
        alert(result.message || 'Upload failed');
      }
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await onSubmit(formData);
      // Reset form
      setFormData({
        name: '',
        firstName: '',
        lastName: '',
        position: '',
        dateOfBirth: '',
        nationality: '',
        email: '',
        phone: '',
        height: '',
        weight: '',
        preferredFoot: 'Right',
        photo: null,
        emergencyContact: {
          name: '',
          relationship: '',
          phone: '',
          email: ''
        }
      });
      onClose();
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Register New Player</h2>
            <button 
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Photo Upload */}
          <div className="flex items-center gap-6">
            <div className="w-24 h-32 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
              {formData.photo ? (
                <img src={formData.photo} alt="Player" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
                  <User className="w-12 h-12 text-gray-600" />
                </div>
              )}
            </div>
            
            <div>
              <Button
                type="button"
                variant="outline"
                icon={Upload}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Upload Photo'}
              </Button>
              <p className="text-sm text-gray-500 mt-1">Optional player photo</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files[0] && uploadPhoto(e.target.files[0])}
                className="hidden"
              />
            </div>
          </div>
          
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter player's full name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="First name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Last name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Position *</label>
              <select
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.position}
                onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
              >
                <option value="">Select position</option>
                <option value="Goalkeeper">Goalkeeper</option>
                <option value="Defender">Defender</option>
                <option value="Midfielder">Midfielder</option>
                <option value="Forward">Forward</option>
                <option value="Pivot">Pivot</option>
                <option value="Wing">Wing</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
              <input
                type="date"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nationality *</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.nationality}
                onChange={(e) => setFormData(prev => ({ ...prev, nationality: e.target.value }))}
                placeholder="e.g., Maldivian"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="player@email.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+960 123-4567"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
              <input
                type="number"
                min="140"
                max="220"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.height}
                onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                placeholder="175"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
              <input
                type="number"
                min="40"
                max="150"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.weight}
                onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                placeholder="70"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Foot</label>
              <select
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.preferredFoot}
                onChange={(e) => setFormData(prev => ({ ...prev, preferredFoot: e.target.value }))}
              >
                <option value="Right">Right</option>
                <option value="Left">Left</option>
                <option value="Both">Both</option>
              </select>
            </div>
          </div>
          
          {/* Emergency Contact */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.emergencyContact.name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                  }))}
                  placeholder="Emergency contact name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.emergencyContact.relationship}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
                  }))}
                  placeholder="e.g., Parent, Spouse"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                <input
                  type="tel"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.emergencyContact.phone}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                  }))}
                  placeholder="+960 123-4567"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.emergencyContact.email}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    emergencyContact: { ...prev.emergencyContact, email: e.target.value }
                  }))}
                  placeholder="contact@email.com"
                />
              </div>
            </div>
          </div>
          
          {/* Submit Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" icon={Save} disabled={submitting}>
              {submitting ? 'Registering...' : 'Register Player'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Transfer Market Component
const TransferMarketPage = ({ user, onMessage }) => {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('available');
  const [showRegistration, setShowRegistration] = useState(false);
  const [filters, setFilters] = useState({
    position: '',
    team: '',
    search: ''
  });

  const tabs = [
    { id: 'available', label: 'Free Agents', count: players.filter(p => p.isAvailable).length },
    { id: 'all', label: 'All Players', count: players.length },
    { id: 'transfer_listed', label: 'Transfer Listed', count: players.filter(p => p.transferListed).length }
  ];

  const loadPlayers = async (type = selectedTab) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type,
        limit: '100'
      });

      if (filters.position) params.append('position', filters.position);
      if (filters.team) params.append('team', filters.team);

      const response = await fetch(`/api/transfers?${params}`);
      const result = await response.json();

      if (result.success) {
        setPlayers(result.data || []);
      } else {
        onMessage?.(result.message || 'Failed to load players', 'error');
      }
    } catch (error) {
      console.error('Error loading players:', error);
      onMessage?.('Failed to load players', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      const result = await response.json();
      if (result.success) {
        setTeams(result.data || []);
      }
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  };

  const registerPlayer = async (playerData) => {
    try {
      const response = await fetch('/api/transfers/register-player', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(playerData)
      });

      const result = await response.json();

      if (result.success) {
        onMessage?.(`${result.data.name} has been registered successfully!`, 'success');
        loadPlayers(); // Reload players list
      } else {
        throw new Error(result.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const assignPlayer = async (player) => {
    const teamId = prompt(`Enter team ID to assign ${player.name}:`);
    if (!teamId) return;

    try {
      const response = await fetch('/api/transfers/assign-player', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: player._id,
          teamId,
          transferType: 'assignment'
        })
      });

      const result = await response.json();

      if (result.success) {
        onMessage?.(result.message, 'success');
        loadPlayers();
      } else {
        onMessage?.(result.message || 'Assignment failed', 'error');
      }
    } catch (error) {
      console.error('Assignment error:', error);
      onMessage?.('Assignment failed', 'error');
    }
  };

  const releasePlayer = async (player) => {
    const reason = prompt(`Reason for releasing ${player.name}:`);
    if (!reason) return;

    try {
      const response = await fetch('/api/transfers/release-player', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: player._id,
          reason
        })
      });

      const result = await response.json();

      if (result.success) {
        onMessage?.(result.message, 'success');
        loadPlayers();
      } else {
        onMessage?.(result.message || 'Release failed', 'error');
      }
    } catch (error) {
      console.error('Release error:', error);
      onMessage?.('Release failed', 'error');
    }
  };

  useEffect(() => {
    loadPlayers();
    loadTeams();
  }, []);

  useEffect(() => {
    loadPlayers(selectedTab);
  }, [selectedTab]);

  // Filter players based on search
  const filteredPlayers = players.filter(player => {
    const matchesSearch = !filters.search || 
      player.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      player.position.toLowerCase().includes(filters.search.toLowerCase()) ||
      player.nationality.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transfer Market</h1>
            <p className="text-gray-600">The Horse Futsal League player registration and transfers</p>
          </div>
        </div>
        
        {user && ['admin', 'super_admin', 'moderator'].includes(user.role) ? (
          <Button 
            icon={UserPlus} 
            onClick={() => setShowRegistration(true)}
          >
            Register New Player
          </Button>
        ) : (
          <div className="text-sm text-gray-600">
            Login as admin to manage players
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-xl p-1 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
            <span className={`px-2 py-1 text-xs rounded-full ${
              selectedTab === tab.id
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search players..."
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            
            <select
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.position}
              onChange={(e) => setFilters(prev => ({ ...prev, position: e.target.value }))}
            >
              <option value="">All Positions</option>
              <option value="Goalkeeper">Goalkeeper</option>
              <option value="Defender">Defender</option>
              <option value="Midfielder">Midfielder</option>
              <option value="Forward">Forward</option>
              <option value="Pivot">Pivot</option>
              <option value="Wing">Wing</option>
            </select>
            
            <select
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.team}
              onChange={(e) => setFilters(prev => ({ ...prev, team: e.target.value }))}
            >
              <option value="">All Teams</option>
              {teams.map(team => (
                <option key={team._id} value={team._id}>
                  {team.name}
                </option>
              ))}
            </select>
            
            <Button 
              variant="outline" 
              icon={Filter}
              onClick={() => loadPlayers()}
              disabled={loading}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Players Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredPlayers.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Players Found</h3>
            <p className="text-gray-500">
              {selectedTab === 'available' 
                ? 'No free agents available at the moment.' 
                : 'No players match your current filters.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlayers.map(player => (
            <PlayerCard
              key={player._id}
              player={player}
              onAssign={user && ['admin', 'super_admin', 'moderator'].includes(user.role) ? assignPlayer : undefined}
              onRelease={user && ['admin', 'super_admin', 'moderator'].includes(user.role) ? releasePlayer : undefined}
              showActions={user && ['admin', 'super_admin', 'moderator'].includes(user.role)}
            />
          ))}
        </div>
      )}

      {/* Player Registration Modal */}
      <PlayerRegistrationModal
        isOpen={showRegistration}
        onClose={() => setShowRegistration(false)}
        onSubmit={registerPlayer}
        teams={teams}
      />
    </div>
  );
};

export default TransferMarketPage;