// components/pages/LeagueManagement.js - Updated with working API integration
import React, { useState, useEffect } from 'react';
import { Plus, Grid, List, Trophy, Calendar, Users, Settings, RefreshCw, AlertCircle, Check, X } from 'lucide-react';

// Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// Tab Navigation Component
const TabNavigation = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`${
                activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              } ml-2 py-0.5 px-2 rounded-full text-xs font-medium`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

// League Form Component
const LeagueForm = ({ league, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: league?.name || '',
    type: league?.type || 'league',
    sport: league?.sport || 'football',
    status: league?.status || 'upcoming',
    startDate: league?.startDate ? new Date(league.startDate).toISOString().split('T')[0] : '',
    endDate: league?.endDate ? new Date(league.endDate).toISOString().split('T')[0] : '',
    pointsForWin: league?.pointsForWin || 3,
    pointsForDraw: league?.pointsForDraw || 1,
    pointsForLoss: league?.pointsForLoss || 0,
    rules: league?.rules || '',
    prizeMoney: league?.prizeMoney || 0,
    sponsor: league?.sponsor || ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const url = league ? `/api/leagues/${league._id}` : '/api/leagues';
      const method = league ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(league ? 'League updated successfully!' : 'League created successfully!');
        setTimeout(() => {
          onSuccess(data.data);
        }, 1500);
      } else {
        setError(data.message || 'Failed to save league');
      }
    } catch (error) {
      console.error('Error saving league:', error);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Success Message */}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Check className="h-5 w-5 text-green-500" />
            <span className="text-green-700">{success}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">League Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="league">League</option>
              <option value="cup">Cup</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sport</label>
            <select
              value={formData.sport}
              onChange={(e) => setFormData(prev => ({ ...prev, sport: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="football">Football</option>
              <option value="futsal">Futsal</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="upcoming">Upcoming</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Points for Win</label>
            <input
              type="number"
              value={formData.pointsForWin}
              onChange={(e) => setFormData(prev => ({ ...prev, pointsForWin: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Points for Draw</label>
            <input
              type="number"
              value={formData.pointsForDraw}
              onChange={(e) => setFormData(prev => ({ ...prev, pointsForDraw: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Points for Loss</label>
            <input
              type="number"
              value={formData.pointsForLoss}
              onChange={(e) => setFormData(prev => ({ ...prev, pointsForLoss: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prize Money</label>
            <input
              type="number"
              value={formData.prizeMoney}
              onChange={(e) => setFormData(prev => ({ ...prev, prizeMoney: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sponsor</label>
            <input
              type="text"
              value={formData.sponsor}
              onChange={(e) => setFormData(prev => ({ ...prev, sponsor: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Sponsor name"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rules</label>
          <textarea
            value={formData.rules}
            onChange={(e) => setFormData(prev => ({ ...prev, rules: e.target.value }))}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="League rules and regulations..."
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : (league ? 'Update League' : 'Create League')}
          </button>
        </div>
      </form>
    </div>
  );
};

// League List Component
const LeagueList = ({ leagues, viewMode, onEdit, onDelete, loading, onNavigate }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading leagues...</p>
        </div>
      </div>
    );
  }

  if (leagues.length === 0) {
    return (
      <div className="text-center py-8">
        <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No leagues found</h3>
        <p className="text-gray-600">Get started by creating your first league.</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {leagues.map((league) => (
          <div key={league._id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-medium text-gray-900">{league.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(league.status)}`}>
                      {league.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {league.type === 'cup' ? '🏆 Cup Tournament' : '⚽ League Competition'} • {league.sport}
                  </p>
                  <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                    <span>{league.teamCount || 0} teams</span>
                    <span>•</span>
                    <span>{league.matchCount || 0} matches</span>
                    {league.startDate && (
                      <>
                        <span>•</span>
                        <span>Starts: {new Date(league.startDate).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onNavigate('league-details', league._id)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="View Details"
                >
                  <Users className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onEdit(league)}
                  className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                  title="Edit League"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {leagues.map((league) => (
        <div key={league._id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Trophy className="h-6 w-6 text-blue-600" />
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(league.status)}`}>
                {league.status}
              </span>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{league.name}</h3>
            <p className="text-sm text-gray-600 mb-4">
              {league.type === 'cup' ? '🏆 Cup Tournament' : '⚽ League Competition'} • {league.sport}
            </p>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Teams:</span>
                <span className="font-medium">{league.teamCount || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Matches:</span>
                <span className="font-medium">{league.matchCount || 0}</span>
              </div>
              {league.startDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Start Date:</span>
                  <span className="font-medium">{new Date(league.startDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <button
                onClick={() => onNavigate('league-details', league._id)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View Details
              </button>
              <button
                onClick={() => onEdit(league)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Main LeagueManagement Component
const LeagueManagement = ({ onNavigate }) => {
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadLeagues();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  const loadLeagues = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/leagues?populate=true', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Leagues loaded:', data.data?.length || 0);
        setLeagues(data.data || []);
      } else {
        console.error('❌ Failed to load leagues');
        setError('Failed to load leagues');
      }
    } catch (error) {
      console.error('❌ Error loading leagues:', error);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleLeagueSuccess = (savedLeague) => {
    if (selectedLeague) {
      // Update existing league
      setLeagues(prev => 
        prev.map(league => 
          league._id === savedLeague._id ? savedLeague : league
        )
      );
    } else {
      // Add new league
      setLeagues(prev => [savedLeague, ...prev]);
    }
    setShowForm(false);
    setSelectedLeague(null);
  };

  const handleEdit = (league) => {
    setSelectedLeague(league);
    setShowForm(true);
  };

  const handleDelete = async (leagueId) => {
    if (!confirm('Are you sure you want to delete this league? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/leagues/${leagueId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setLeagues(prev => prev.filter(league => league._id !== leagueId));
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to delete league');
      }
    } catch (error) {
      console.error('Error deleting league:', error);
      alert('Failed to delete league');
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedLeague(null);
  };

  const tabs = [
    { id: 'all', label: 'All Leagues', count: leagues.length },
    { id: 'active', label: 'Active', count: leagues.filter(l => l.status === 'active').length },
    { id: 'upcoming', label: 'Upcoming', count: leagues.filter(l => l.status === 'upcoming').length },
    { id: 'completed', label: 'Completed', count: leagues.filter(l => l.status === 'completed').length }
  ];

  const filteredLeagues = activeTab === 'all' 
    ? leagues 
    : leagues.filter(l => l.status === activeTab);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">League Management</h1>
        <p className="text-gray-600">Create and manage your football and futsal leagues</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
            <button
              onClick={loadLeagues}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-gray-100 rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-white shadow' : ''} rounded-l-md`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-white shadow' : ''} rounded-r-md`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={loadLeagues}
              disabled={loading}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create League</span>
            </button>
          </div>
        </div>
      </div>

      {/* League List */}
      <LeagueList
        leagues={filteredLeagues}
        viewMode={viewMode}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onNavigate={onNavigate}
        loading={loading && leagues.length === 0}
      />

      {/* League Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={handleCloseForm}
        title={selectedLeague ? 'Edit League' : 'Create New League'}
      >
        <LeagueForm
          league={selectedLeague}
          onSuccess={handleLeagueSuccess}
          onCancel={handleCloseForm}
        />
      </Modal>
    </div>
  );
};

export default LeagueManagement;