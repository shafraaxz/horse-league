// components/pages/AdminPage.js - Modern Admin Settings for Horse Futsal League
import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, 
  Users, 
  Shield, 
  Calendar,
  Trophy,
  Upload,
  Save,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Check,
  X,
  Image as ImageIcon,
  UserPlus,
  Crown
} from 'lucide-react';

// Modern Card Component
const Card = ({ title, icon: Icon, children, className = '', actions }) => (
  <div className={`bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden ${className}`}>
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-6 h-6 text-white" />}
          <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
);

// Modern Input Component
const Input = ({ label, error, icon: Icon, ...props }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />}
      <input
        className={`w-full px-4 py-3 ${Icon ? 'pl-11' : ''} border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${error ? 'border-red-300 bg-red-50' : ''}`}
        {...props}
      />
    </div>
    {error && <p className="text-sm text-red-600">{error}</p>}
  </div>
);

// Modern Select Component
const Select = ({ label, options, error, ...props }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <select
      className={`w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${error ? 'border-red-300 bg-red-50' : ''}`}
      {...props}
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && <p className="text-sm text-red-600">{error}</p>}
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
    md: 'px-4 py-3 text-sm gap-2',
    lg: 'px-6 py-4 text-base gap-3'
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

// Image Upload Component
const ImageUpload = ({ label, currentImage, onUpload, onRemove, uploading = false }) => {
  const fileInputRef = useRef(null);
  
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      onUpload(file);
    }
  };
  
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      
      {currentImage ? (
        <div className="relative inline-block">
          <img 
            src={currentImage} 
            alt="Current" 
            className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200" 
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-gray-400" />
        </div>
      )}
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          icon={Upload}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

// League Settings Component
const LeagueSettings = () => {
  const [settings, setSettings] = useState({
    name: 'The Horse Futsal League',
    shortName: 'HFL',
    description: 'The premier futsal competition featuring the best teams and players',
    currentSeason: '2025/26',
    maxTeams: 16,
    maxPlayersPerTeam: 20,
    minPlayersPerTeam: 11,
    matchDuration: 40,
    pointsForWin: 3,
    pointsForDraw: 1,
    pointsForLoss: 0,
    logo: null,
    banner: null
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const uploadImage = async (file, type) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', type);
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSettings(prev => ({ ...prev, [type === 'league-logo' ? 'logo' : 'banner']: result.data.url }));
        setMessage({ type: 'success', text: `${type.replace('-', ' ')} uploaded successfully!` });
        return result.data.url;
      } else {
        setMessage({ type: 'error', text: result.message || 'Upload failed' });
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: error.message || 'Upload failed' });
      throw error;
    } finally {
      setUploading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/league-settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      
      const result = await response.json();
      if (result.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  return (
    <Card title="League Configuration" icon={Trophy}>
      <div className="space-y-6">
        {message.text && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Input
            label="League Name"
            value={settings.name}
            onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
            placeholder="The Horse Futsal League"
          />
          
          <Input
            label="Short Name"
            value={settings.shortName}
            onChange={(e) => setSettings(prev => ({ ...prev, shortName: e.target.value }))}
            placeholder="HFL"
            maxLength={5}
          />
          
          <Input
            label="Current Season"
            value={settings.currentSeason}
            onChange={(e) => setSettings(prev => ({ ...prev, currentSeason: e.target.value }))}
            placeholder="2025/26"
            pattern="^\d{4}\/\d{2}$"
          />
          
          <Input
            label="Maximum Teams"
            type="number"
            value={settings.maxTeams}
            onChange={(e) => setSettings(prev => ({ ...prev, maxTeams: parseInt(e.target.value) }))}
            min={4}
            max={32}
          />
          
          <Input
            label="Max Players per Team"
            type="number"
            value={settings.maxPlayersPerTeam}
            onChange={(e) => setSettings(prev => ({ ...prev, maxPlayersPerTeam: parseInt(e.target.value) }))}
            min={11}
            max={30}
          />
          
          <Input
            label="Min Players per Team"
            type="number"
            value={settings.minPlayersPerTeam}
            onChange={(e) => setSettings(prev => ({ ...prev, minPlayersPerTeam: parseInt(e.target.value) }))}
            min={7}
            max={15}
          />
          
          <Input
            label="Match Duration (minutes)"
            type="number"
            value={settings.matchDuration}
            onChange={(e) => setSettings(prev => ({ ...prev, matchDuration: parseInt(e.target.value) }))}
            min={20}
            max={90}
          />
          
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Points for Win"
              type="number"
              value={settings.pointsForWin}
              onChange={(e) => setSettings(prev => ({ ...prev, pointsForWin: parseInt(e.target.value) }))}
              min={1}
              max={5}
            />
            <Input
              label="Points for Draw"
              type="number"
              value={settings.pointsForDraw}
              onChange={(e) => setSettings(prev => ({ ...prev, pointsForDraw: parseInt(e.target.value) }))}
              min={0}
              max={3}
            />
            <Input
              label="Points for Loss"
              type="number"
              value={settings.pointsForLoss}
              onChange={(e) => setSettings(prev => ({ ...prev, pointsForLoss: parseInt(e.target.value) }))}
              min={0}
              max={1}
            />
          </div>
        </div>
        
        <div className="border-t pt-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">League Description</h4>
          <textarea
            value={settings.description}
            onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter league description..."
          />
        </div>
        
        <div className="border-t pt-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Branding</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ImageUpload
              label="League Logo"
              currentImage={settings.logo}
              onUpload={(file) => uploadImage(file, 'league-logo')}
              onRemove={() => setSettings(prev => ({ ...prev, logo: null }))}
              uploading={uploading}
            />
            
            <ImageUpload
              label="League Banner"
              currentImage={settings.banner}
              onUpload={(file) => uploadImage(file, 'league-banner')}
              onRemove={() => setSettings(prev => ({ ...prev, banner: null }))}
              uploading={uploading}
            />
          </div>
        </div>
        
        <div className="flex justify-end pt-6 border-t">
          <Button
            icon={Save}
            onClick={saveSettings}
            disabled={saving || uploading}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Season Management Component
const SeasonManagement = () => {
  const [seasons, setSeasons] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSeason, setEditingSeason] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    transferWindowStart: '',
    transferWindowEnd: '',
    status: 'draft',
    maxTeams: 16
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Implementation for creating/updating season
    console.log('Season form submitted:', formData);
  };

  return (
    <Card 
      title="Season Management" 
      icon={Calendar}
      actions={
        <Button size="sm" icon={Plus} onClick={() => setShowForm(true)}>
          New Season
        </Button>
      }
    >
      {showForm && (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg">
          <h4 className="text-lg font-semibold mb-4">
            {editingSeason ? 'Edit Season' : 'Create New Season'}
          </h4>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Season Name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="2025/26"
              pattern="^\d{4}\/\d{2}$"
              required
            />
            
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              options={[
                { value: 'draft', label: 'Draft' },
                { value: 'upcoming', label: 'Upcoming' },
                { value: 'active', label: 'Active' },
                { value: 'completed', label: 'Completed' }
              ]}
            />
            
            <Input
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              required
            />
            
            <Input
              label="End Date"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              required
            />
            
            <Input
              label="Registration Deadline"
              type="date"
              value={formData.registrationDeadline}
              onChange={(e) => setFormData(prev => ({ ...prev, registrationDeadline: e.target.value }))}
              required
            />
            
            <Input
              label="Max Teams"
              type="number"
              value={formData.maxTeams}
              onChange={(e) => setFormData(prev => ({ ...prev, maxTeams: parseInt(e.target.value) }))}
              min={4}
              max={32}
            />
            
            <div className="md:col-span-2 flex gap-2 pt-4">
              <Button type="submit" icon={Save}>
                {editingSeason ? 'Update Season' : 'Create Season'}
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => {
                  setShowForm(false);
                  setEditingSeason(null);
                  setFormData({
                    name: '',
                    startDate: '',
                    endDate: '',
                    registrationDeadline: '',
                    transferWindowStart: '',
                    transferWindowEnd: '',
                    status: 'draft',
                    maxTeams: 16
                  });
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
      
      <div className="space-y-4">
        {seasons.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No seasons created yet. Create your first season to get started.</p>
          </div>
        ) : (
          seasons.map(season => (
            <div key={season._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h5 className="font-semibold">{season.name}</h5>
                <p className="text-sm text-gray-600">
                  {season.startDate} - {season.endDate} | Status: {season.status}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" icon={Edit}>
                  Edit
                </Button>
                <Button size="sm" variant="danger" icon={Trash2}>
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

// User Management Component
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'moderator',
    password: '',
    permissions: []
  });

  return (
    <Card 
      title="User Management" 
      icon={Users}
      actions={
        <Button size="sm" icon={UserPlus} onClick={() => setShowAddUser(true)}>
          Add User
        </Button>
      }
    >
      {showAddUser && (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg">
          <h4 className="text-lg font-semibold mb-4">Add New User</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={newUser.name}
              onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter user's name"
            />
            
            <Input
              label="Email"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
              placeholder="user@example.com"
            />
            
            <Input
              label="Password"
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Temporary password"
            />
            
            <Select
              label="Role"
              value={newUser.role}
              onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
              options={[
                { value: 'super_admin', label: 'Super Admin' },
                { value: 'admin', label: 'Administrator' },
                { value: 'moderator', label: 'Moderator' },
                { value: 'scorer', label: 'Scorer' }
              ]}
            />
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  'manage_teams',
                  'manage_players', 
                  'manage_matches',
                  'manage_seasons',
                  'manage_transfers',
                  'view_reports',
                  'manage_users',
                  'system_settings'
                ].map(permission => (
                  <label key={permission} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newUser.permissions.includes(permission)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewUser(prev => ({ 
                            ...prev, 
                            permissions: [...prev.permissions, permission] 
                          }));
                        } else {
                          setNewUser(prev => ({ 
                            ...prev, 
                            permissions: prev.permissions.filter(p => p !== permission) 
                          }));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {permission.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="md:col-span-2 flex gap-2 pt-4">
              <Button icon={Save}>
                Add User
              </Button>
              <Button variant="secondary" onClick={() => setShowAddUser(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    A
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">Admin User</div>
                    <div className="text-sm text-gray-500">admin@horsefutsal.com</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                  <Crown className="w-3 h-3" />
                  Super Admin
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  <Check className="w-3 h-3" />
                  Active
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" icon={Edit}>
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" icon={Shield}>
                    Permissions
                  </Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
};

// System Statistics Component
const SystemStatistics = () => {
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalPlayers: 0,
    totalMatches: 0,
    currentSeason: '2025/26',
    activeTransfers: 0,
    totalGoals: 0
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100">Total Teams</p>
            <p className="text-3xl font-bold">{stats.totalTeams}</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
            <Trophy className="w-6 h-6" />
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100">Total Players</p>
            <p className="text-3xl font-bold">{stats.totalPlayers}</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100">Total Matches</p>
            <p className="text-3xl font-bold">{stats.totalMatches}</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Admin Page Component
const AdminPage = ({ user, onMessage }) => {
  const [activeTab, setActiveTab] = useState('settings');
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'settings', label: 'League Settings', icon: Settings },
    { id: 'seasons', label: 'Seasons', icon: Calendar },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'system', label: 'System', icon: Shield }
  ];

  if (!user || !['admin', 'super_admin'].includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">Access Denied</h2>
          <p className="text-gray-500">You don't have permission to access admin settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600">Manage The Horse Futsal League system settings</p>
          </div>
        </div>
        
        {/* Statistics Cards */}
        <SystemStatistics />
      </div>

      {/* Navigation Tabs */}
      <div className="mb-8">
        <nav className="flex space-x-1 bg-gray-100 rounded-xl p-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-8">
        {activeTab === 'settings' && <LeagueSettings />}
        {activeTab === 'seasons' && <SeasonManagement />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'system' && (
          <Card title="System Information" icon={Shield}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Application Info</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Version:</span>
                    <span className="font-medium">2.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Database:</span>
                    <span className="font-medium text-green-600">Connected</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cloudinary:</span>
                    <span className="font-medium text-green-600">Connected</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h4>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    Export League Data
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Backup Database
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    System Logs
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminPage;