// pages/index.js - Enhanced with League Delete and Admin Management
import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import Dashboard from '../components/Dashboard';
import Schedule from '../components/Schedule';
import LeagueTable from '../components/LeagueTable';
import Teams from '../components/Teams';
import Statistics from '../components/Statistics';

// Admin components
import AdminLogin from '../components/AdminLogin';
import LeagueModal from '../components/admin/LeagueModal';
import TeamModal from '../components/admin/TeamModal';
import PlayerModal from '../components/admin/PlayerModal';
import MatchModal from '../components/admin/MatchModal';
import AdminUserModal from '../components/admin/AdminUserModal';
import ScheduleGenerator from '../components/ScheduleGenerator';

import { X, Plus, Shield, Users, User, Edit, Trash2 } from 'lucide-react';

const API_BASE = '/api';

// Toast Component
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    success: { icon: '✅', bg: 'bg-green-500', border: 'border-green-400' },
    error: { icon: '❌', bg: 'bg-red-500', border: 'border-red-400' },
    warning: { icon: '⚠️', bg: 'bg-yellow-500', border: 'border-yellow-400' },
    info: { icon: 'ℹ️', bg: 'bg-blue-500', border: 'border-blue-400' }
  };

  const { icon, bg, border } = config[type];

  return (
    <div className={`fixed top-4 right-4 ${bg} text-white px-6 py-4 rounded-xl shadow-2xl z-50 transition-all duration-500 transform hover:scale-105 border ${border} max-w-sm`}>
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0">{icon}</span>
        <div className="flex-1">
          <p className="font-medium">{message}</p>
        </div>
        <button 
          onClick={onClose} 
          className="text-white hover:text-gray-200 transition-colors flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default function Home() {
  // Application State
  const [activeSection, setActiveSection] = useState('dashboard');
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [leagues, setLeagues] = useState([]);
  const [leagueData, setLeagueData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // Admin Management State
  const [adminUsers, setAdminUsers] = useState([]);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  // Modal State
  const [modals, setModals] = useState({
    league: { open: false, data: null },
    team: { open: false, data: null },
    player: { open: false, data: null },
    match: { open: false, data: null },
    schedule: { open: false, data: null }
  });

  // Navigation items - Enhanced with admin panel
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠', alwaysShow: true },
    { id: 'schedule', label: 'Schedule', icon: '📅', requiresLeague: true },
    { id: 'table', label: 'League Table', icon: '📊', requiresLeague: true },
    { id: 'teams', label: 'Teams', icon: '👥', requiresLeague: true },
    { id: 'statistics', label: 'Statistics', icon: '📈', requiresLeague: true },
    { id: 'live', label: 'Live', icon: '🔴', requiresLeague: true, requiresLive: true },
    { id: 'admin', label: 'Admin Panel', icon: '🛡️', requiresAdmin: true }
  ];

  // Show toast function
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  // API Functions
  // In your pages/index.js - Replace your apiCall function with this
const apiCall = useCallback(async (endpoint, options = {}) => {
  try {
    const headers = { 'Content-Type': 'application/json' };
    
    // ✅ ALWAYS get fresh token from localStorage
    const token = localStorage.getItem('adminToken');
    console.log('🔑 API Call to:', endpoint);
    console.log('🔑 Token found?', !!token);
    console.log('🔑 Method:', options.method || 'GET');
    
    // ✅ CRITICAL: Send token for admin endpoints and write operations
    const needsAuth = endpoint.includes('/admin') || 
                     endpoint.includes('/matches') || 
                     endpoint.includes('/teams') || 
                     endpoint.includes('/players') || 
                     endpoint.includes('/leagues') ||
                     ['POST', 'PUT', 'DELETE'].includes(options.method);
    
    if (token && needsAuth) {
      headers.Authorization = `Bearer ${token}`;
      console.log('✅ Added Authorization header for', endpoint);
    } else if (needsAuth && !token) {
      console.log('⚠️ Endpoint needs auth but no token found');
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers,
      ...options
    });

    console.log('📡 Response status:', response.status, 'for', endpoint);

    if (response.status === 401) {
      console.log('❌ 401 Unauthorized - clearing auth state');
      handleLogout();
      return null;
    }
    
    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      const error = await response.json();
      console.error('❌ API Error:', error);
      throw new Error(error.error || 'API call failed');
    }
  } catch (error) {
    console.error('❌ API Call failed:', error);
    throw error;
  }
}, []);

  // Modal Management
  const openModal = useCallback((type, data = null) => {
    const modalData = data ? JSON.parse(JSON.stringify(data)) : null;
    setModals(prev => ({
      ...prev,
      [type]: { 
        open: true, 
        data: modalData 
      }
    }));
  }, []);

  const closeModal = useCallback((type) => {
    setModals(prev => ({
      ...prev,
      [type]: { open: false, data: null }
    }));
  }, []);

  // League Management - Enhanced with delete functionality
  const handleDeleteLeague = useCallback(async (leagueId) => {
    if (!isLoggedIn) {
      showToast('Please login to delete leagues', 'warning');
      return;
    }

    const leagueToDelete = leagues.find(l => l._id === leagueId);
    if (!leagueToDelete) {
      showToast('League not found', 'error');
      return;
    }

    const confirmMessage = `Are you sure you want to delete "${leagueToDelete.name}"?\n\nThis will permanently delete:\n- All teams in this league\n- All players in this league\n- All matches in this league\n- All statistics\n\nThis action cannot be undone.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setIsLoading(true);
      
      // Call delete API
      await apiCall(`/leagues?id=${leagueId}`, { 
        method: 'DELETE' 
      });

      // If deleted league was selected, clear selection
      if (selectedLeague === leagueId) {
        setSelectedLeague(null);
        setLeagueData(null);
      }

      // Reload leagues list
      await loadLeagues();
      
      showToast(`League "${leagueToDelete.name}" deleted successfully`, 'success');
    } catch (error) {
      showToast('Failed to delete league: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, leagues, selectedLeague, apiCall, showToast]);

  // Admin User Management
  const loadAdminUsers = useCallback(async () => {
    if (!isLoggedIn) return;
    
    try {
      const result = await apiCall('/admin');
      setAdminUsers(result || []);
    } catch (error) {
      console.error('Failed to load admin users:', error);
    }
  }, [isLoggedIn, apiCall]);

  const handleCreateAdmin = useCallback(() => {
    if (!isLoggedIn || currentUser?.role !== 'admin') {
      showToast('Only administrators can create new admin users', 'warning');
      return;
    }
    setSelectedAdmin(null);
    setShowAdminModal(true);
  }, [isLoggedIn, currentUser, showToast]);

  const handleEditAdmin = useCallback((admin) => {
    if (!isLoggedIn || currentUser?.role !== 'admin') {
      showToast('Only administrators can edit admin users', 'warning');
      return;
    }
    setSelectedAdmin(admin);
    setShowAdminModal(true);
  }, [isLoggedIn, currentUser, showToast]);

  const handleSaveAdmin = useCallback(async (adminData) => {
    try {
      setIsLoading(true);
      
      const method = adminData._id ? 'PUT' : 'POST';
      await apiCall('/admin', {
        method,
        body: JSON.stringify(adminData)
      });

      await loadAdminUsers();
      setShowAdminModal(false);
      setSelectedAdmin(null);
      showToast(adminData._id ? 'Admin updated successfully!' : 'Admin created successfully!');
    } catch (error) {
      showToast('Failed to save admin: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [apiCall, loadAdminUsers, showToast]);

  const handleDeleteAdmin = useCallback(async (username) => {
    if (!isLoggedIn || currentUser?.role !== 'admin') {
      showToast('Only administrators can delete admin users', 'warning');
      return;
    }

    if (username === currentUser.username) {
      showToast('You cannot delete your own account', 'warning');
      return;
    }

    if (!confirm(`Are you sure you want to delete admin user "${username}"?`)) {
      return;
    }

    try {
      await apiCall(`/admin?username=${username}`, { method: 'DELETE' });
      await loadAdminUsers();
      showToast('Admin user deleted successfully');
    } catch (error) {
      showToast('Failed to delete admin user: ' + error.message, 'error');
    }
  }, [isLoggedIn, currentUser, apiCall, loadAdminUsers, showToast]);

  // Admin Panel Rendering
  const renderAdminPanel = () => {
    if (!isLoggedIn) {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-xl font-semibold text-white mb-2">Access Denied</h3>
          <p className="text-slate-400">Please login with admin credentials to access this panel</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
            <p className="text-slate-400">
              Manage administrators and system settings
            </p>
          </div>
          
          {currentUser?.role === 'admin' && (
            <button
              onClick={handleCreateAdmin}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Admin
            </button>
          )}
        </div>

        {/* Current User Info */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            Your Account
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-slate-400 text-sm">Username</label>
              <div className="text-white font-semibold">{currentUser?.username}</div>
            </div>
            <div>
              <label className="text-slate-400 text-sm">Role</label>
              <div className="text-white font-semibold capitalize">{currentUser?.role}</div>
            </div>
            <div>
              <label className="text-slate-400 text-sm">Status</label>
              <div className="text-green-400 font-semibold">Active</div>
            </div>
          </div>
        </div>

        {/* Admin Users List */}
        {currentUser?.role === 'admin' && (
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Admin Users</h3>
            
            {adminUsers.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No admin users found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {adminUsers.map(admin => (
                  <div key={admin._id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-white font-semibold flex items-center gap-2">
                          {admin.username}
                          {admin.username === currentUser.username && (
                            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">YOU</span>
                          )}
                        </div>
                        <div className="text-slate-400 text-sm capitalize">{admin.role}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        admin.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {admin.isActive ? 'Active' : 'Inactive'}
                      </span>
                      
                      <button
                        onClick={() => handleEditAdmin(admin)}
                        className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                        title="Edit Admin"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      {admin.username !== currentUser.username && admin.username !== 'admin' && (
                        <button
                          onClick={() => handleDeleteAdmin(admin.username)}
                          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                          title="Delete Admin"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* System Settings */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">System Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-700/30 rounded-lg">
              <h4 className="font-semibold text-white mb-2">Database Status</h4>
              <p className="text-green-400 text-sm">✅ Connected</p>
            </div>
            <div className="p-4 bg-slate-700/30 rounded-lg">
              <h4 className="font-semibold text-white mb-2">Current League</h4>
              <p className="text-blue-400 text-sm">{leagueData?.league?.name || 'No league selected'}</p>
            </div>
            <div className="p-4 bg-slate-700/30 rounded-lg">
              <h4 className="font-semibold text-white mb-2">Total Teams</h4>
              <p className="text-orange-400 text-sm">{leagueData?.teams?.length || 0}</p>
            </div>
            <div className="p-4 bg-slate-700/30 rounded-lg">
              <h4 className="font-semibold text-white mb-2">Total Matches</h4>
              <p className="text-purple-400 text-sm">{leagueData?.matches?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Team Management
  const handleCreateTeam = useCallback(() => {
    if (!isLoggedIn) {
      showToast('Please login to create teams', 'warning');
      return;
    }
    
    if (!selectedLeague) {
      showToast('Please select a league first', 'warning');
      return;
    }
    
    openModal('team', null);
  }, [isLoggedIn, selectedLeague, openModal, showToast]);

  const handleEditTeam = useCallback((team) => {
    if (!isLoggedIn) {
      showToast('Please login to edit teams', 'warning');
      return;
    }
    
    if (!team || !team._id) {
      showToast('Invalid team data', 'error');
      return;
    }
    
    openModal('team', team);
  }, [isLoggedIn, openModal, showToast]);

  const handleDeleteTeam = useCallback(async (teamId) => {
    if (!isLoggedIn) {
      showToast('Please login to delete teams', 'warning');
      return;
    }

    if (!confirm('Are you sure you want to delete this team? This will also delete all players in the team.')) {
      return;
    }

    try {
      await apiCall(`/teams?id=${teamId}`, { method: 'DELETE' });
      await loadLeagueData(selectedLeague);
      showToast('Team deleted successfully');
    } catch (error) {
      showToast('Failed to delete team: ' + error.message, 'error');
    }
  }, [isLoggedIn, selectedLeague, apiCall, showToast]);

  // Player Management
  const handleCreatePlayer = useCallback(async (playerData) => {
    if (!isLoggedIn) {
      showToast('Please login to create players', 'warning');
      return;
    }

    try {
      const payload = {
        name: playerData.name,
        number: parseInt(playerData.number),
        position: playerData.position,
        photo: playerData.photo || '',
        team: playerData.teamId || playerData.team,
        league: selectedLeague,
        age: playerData.age ? parseInt(playerData.age) : null,
        nationality: playerData.nationality || '',
        height: playerData.height ? parseInt(playerData.height) : null,
        weight: playerData.weight ? parseInt(playerData.weight) : null,
        stats: playerData.stats || {
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          appearances: 0,
          minutesPlayed: 0
        }
      };

      await apiCall('/players', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      await loadLeagueData(selectedLeague);
      showToast('Player created successfully');
    } catch (error) {
      showToast('Failed to create player: ' + error.message, 'error');
      throw error;
    }
  }, [isLoggedIn, selectedLeague, apiCall, showToast]);

  const handleEditPlayer = useCallback((player) => {
    if (!isLoggedIn) {
      showToast('Please login to edit players', 'warning');
      return;
    }
    
    openModal('player', player);
  }, [isLoggedIn, openModal, showToast]);

  const handleDeletePlayer = useCallback(async (playerId) => {
    if (!isLoggedIn) {
      showToast('Please login to delete players', 'warning');
      return;
    }

    if (!confirm('Are you sure you want to delete this player?')) return;

    try {
      await apiCall(`/players?id=${playerId}`, { method: 'DELETE' });
      await loadLeagueData(selectedLeague);
      showToast('Player deleted successfully');
    } catch (error) {
      showToast('Failed to delete player: ' + error.message, 'error');
    }
  }, [isLoggedIn, selectedLeague, apiCall, showToast]);

  // Save Handlers
  const handleSaveLeague = useCallback(async (formData) => {
    try {
      setIsLoading(true);
      
      const method = formData._id ? 'PUT' : 'POST';
      const payload = formData._id ? 
        { id: formData._id, ...formData } : 
        formData;

      await apiCall('/leagues', {
        method,
        body: JSON.stringify(payload)
      });

      await loadLeagues();
      closeModal('league');
      showToast(formData._id ? 'League updated!' : 'League created!');
    } catch (error) {
      showToast('Failed to save league: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [apiCall, closeModal, showToast]);

  const handleSaveTeam = useCallback(async (formData) => {
    try {
      setIsLoading(true);
      
      const method = formData._id ? 'PUT' : 'POST';
      
      const payload = {
        name: formData.name,
        coach: formData.coach || '',
        stadium: formData.stadium || '',
        logo: formData.logo || '',
        founded: formData.founded ? parseInt(formData.founded) : null,
        description: formData.description || '',
        colors: formData.colors || '',
        website: formData.website || '',
        email: formData.email || '',
        phone: formData.phone || '',
        captain: formData.captain || '',
        homeVenue: formData.homeVenue || formData.stadium || '',
        awayVenue: formData.awayVenue || ''
      };

      if (formData._id) {
        payload.id = formData._id;
      } else {
        payload.leagueId = selectedLeague;
      }

      await apiCall('/teams', {
        method,
        body: JSON.stringify(payload)
      });

      await loadLeagueData(selectedLeague);
      closeModal('team');
      showToast(formData._id ? 'Team updated!' : 'Team created!');
    } catch (error) {
      showToast('Failed to save team: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedLeague, apiCall, closeModal, showToast]);

  const handleSavePlayer = useCallback(async (formData) => {
    try {
      setIsLoading(true);
      
      const method = formData._id ? 'PUT' : 'POST';
      
      const payload = {
        name: formData.name,
        number: parseInt(formData.number),
        position: formData.position,
        photo: formData.photo || '',
        team: formData.team || formData.teamId,
        league: selectedLeague,
        age: formData.age ? parseInt(formData.age) : null,
        nationality: formData.nationality || '',
        height: formData.height ? parseInt(formData.height) : null,
        weight: formData.weight ? parseInt(formData.weight) : null,
        stats: formData.stats || {
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          appearances: 0,
          minutesPlayed: 0
        }
      };

      if (formData._id) {
        payload.id = formData._id;
      }

      await apiCall('/players', {
        method,
        body: JSON.stringify(payload)
      });

      await loadLeagueData(selectedLeague);
      closeModal('player');
      showToast(formData._id ? 'Player updated!' : 'Player created!');
    } catch (error) {
      showToast('Failed to save player: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedLeague, apiCall, closeModal, showToast]);

  const handleSaveMatch = useCallback(async (formData) => {
    try {
      setIsLoading(true);
      
      const method = formData._id ? 'PUT' : 'POST';
      
      const payload = {
        leagueId: selectedLeague,
        homeTeam: formData.homeTeam,
        awayTeam: formData.awayTeam,
        date: formData.date,
        time: formData.time,
        round: parseInt(formData.round) || 1,
        venue: formData.venue || 'Manadhoo Futsal Ground',
        referee: formData.referee || '',
        status: formData.status || 'scheduled'
      };

      if (formData._id) {
        payload.id = formData._id;
      }

      if (formData.homeScore !== undefined) {
        payload.homeScore = parseInt(formData.homeScore) || 0;
      }
      
      if (formData.awayScore !== undefined) {
        payload.awayScore = parseInt(formData.awayScore) || 0;
      }

      await apiCall('/matches', {
        method,
        body: JSON.stringify(payload)
      });

      await loadLeagueData(selectedLeague);
      closeModal('match');
      showToast(formData._id ? 'Match updated!' : 'Match created!');
    } catch (error) {
      showToast('Failed to save match: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedLeague, apiCall, closeModal, showToast]);

  // Admin Login
  const handleLogin = async (credentials) => {
    setIsLoginLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      if (response.ok) {
        const result = await response.json();
        setIsLoggedIn(true);
        setCurrentUser(result.user);
        localStorage.setItem('adminToken', result.token);
        localStorage.setItem('adminUser', JSON.stringify(result.user));
        setShowAdminLogin(false);
        showToast('Welcome back! Admin privileges enabled 🛡️', 'success');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    showToast('Logged out successfully', 'info');
  }, [showToast]);

  // Load league data
  const loadLeagueData = useCallback(async (leagueId, silent = false) => {
    if (!leagueId) {
      setLeagueData(null);
      return;
    }

    if (!silent) setIsLoading(true);
    
    try {
      const [summary, matches, teams, players] = await Promise.all([
        apiCall(`/leagues/${leagueId}/summary`),
        apiCall(`/matches?league=${leagueId}`),
        apiCall(`/teams?leagueId=${leagueId}`),
        apiCall(`/players?leagueId=${leagueId}`)
      ]);

      if (summary) {
        const leagueDataObj = {
          league: summary.league,
          teams: teams || summary.teams || [],
          players: players || [],
          matches: matches || [],
          liveMatches: summary.liveMatches || [],
          statistics: {
            totalTeams: teams?.length || 0,
            totalMatches: matches?.length || 0,
            liveCount: summary.liveMatches?.length || 0,
            finishedMatches: matches?.filter(m => m.status === 'finished').length || 0,
            scheduledMatches: matches?.filter(m => m.status === 'scheduled').length || 0,
            topScorers: players?.sort((a, b) => (b.stats?.goals || 0) - (a.stats?.goals || 0)).slice(0, 5) || []
          }
        };

        setLeagueData(leagueDataObj);
      }
    } catch (error) {
      if (!silent) showToast('Failed to load league data', 'error');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [apiCall, showToast]);

  // Load leagues
  const loadLeagues = useCallback(async () => {
    try {
      const result = await apiCall('/leagues');
      if (result && result.length > 0) {
        setLeagues(result);
        return result;
      }
      return [];
    } catch (error) {
      return [];
    }
  }, [apiCall]);

  // Schedule generation handler
  const handleScheduleGenerated = useCallback(async (result) => {
    try {
      if (result.success) {
        await loadLeagueData(selectedLeague);
        closeModal('schedule');
        
        if (result.cleared) {
          showToast(`Cleared ${result.matchesDeleted || 0} matches!`, 'success');
        } else {
          const matchCount = result.matchesCreated || result.data?.matchesCreated || 0;
          showToast(`Generated ${matchCount} matches successfully!`, 'success');
        }
      } else {
        showToast('Failed to generate schedule', 'error');
      }
    } catch (error) {
      showToast('Failed to process schedule generation', 'error');
    }
  }, [selectedLeague, loadLeagueData, closeModal, showToast]);

  // Match actions
  const handleEditMatch = useCallback((match) => {
    if (!isLoggedIn) {
      showToast('Please login to edit matches', 'warning');
      return;
    }
    openModal('match', match);
  }, [isLoggedIn, openModal, showToast]);

  const handleDeleteMatch = useCallback(async (matchId) => {
    if (!isLoggedIn) {
      showToast('Please login to delete matches', 'warning');
      return;
    }

    if (!confirm('Are you sure you want to delete this match?')) return;

    try {
      await apiCall(`/matches?id=${matchId}`, { method: 'DELETE' });
      await loadLeagueData(selectedLeague);
      showToast('Match deleted successfully');
    } catch (error) {
      showToast('Failed to delete match', 'error');
    }
  }, [isLoggedIn, selectedLeague, apiCall, loadLeagueData, showToast]);

  const handleStartLiveMatch = useCallback(async (matchId) => {
    if (!isLoggedIn) {
      showToast('Please login to start live matches', 'warning');
      return;
    }

    try {
      await apiCall('/matches/live', {
        method: 'POST',
        body: JSON.stringify({
          action: 'start_match',
          matchId: matchId
        })
      });

      await loadLeagueData(selectedLeague);
      showToast('Match is now live! 🔴', 'success');
    } catch (error) {
      showToast('Failed to start live match', 'error');
    }
  }, [isLoggedIn, selectedLeague, apiCall, loadLeagueData, showToast]);

  // Navigation
  const handleSectionChange = useCallback((section) => {
    setActiveSection(section);
    
    if (selectedLeague) {
      setTimeout(() => {
        loadLeagueData(selectedLeague, true);
      }, 100);
    }
  }, [selectedLeague, loadLeagueData]);

  const handleLeagueChange = useCallback((leagueId) => {
    setSelectedLeague(leagueId);
    if (leagueId) {
      loadLeagueData(leagueId);
    } else {
      setLeagueData(null);
    }
  }, [loadLeagueData]);

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      
      const token = localStorage.getItem('adminToken');
      const user = localStorage.getItem('adminUser');
      
      if (token && user) {
        try {
          setIsLoggedIn(true);
          setCurrentUser(JSON.parse(user));
        } catch (error) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
        }
      }
      
      // Load leagues but don't auto-select
      await loadLeagues();
      
      setIsLoading(false);
    };

    initializeApp();
  }, []);

  // Load admin users when logging in
  useEffect(() => {
    if (isLoggedIn && currentUser?.role === 'admin') {
      loadAdminUsers();
    }
  }, [isLoggedIn, currentUser, loadAdminUsers]);

  // Auto-refresh live matches
  useEffect(() => {
    if (leagueData?.liveMatches?.length > 0 || activeSection === 'live') {
      const interval = setInterval(() => {
        if (selectedLeague) {
          apiCall(`/leagues/${selectedLeague}/summary`).then(summary => {
            if (summary?.liveMatches) {
              setLeagueData(prev => ({
                ...prev,
                liveMatches: summary.liveMatches
              }));
            }
          }).catch(() => {
            // Silent fail for auto-refresh
          });
        }
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [leagueData?.liveMatches, activeSection, selectedLeague, apiCall]);

  // Render sections
  const renderCurrentSection = () => {
    const commonProps = {
      teams: leagueData?.teams || [],
      players: leagueData?.players || [],
      matches: leagueData?.matches || [],
      liveMatches: leagueData?.liveMatches || [],
      selectedLeague,
      onRefresh: () => loadLeagueData(selectedLeague),
      isLoggedIn,
      onEditMatch: handleEditMatch,
      onDeleteMatch: handleDeleteMatch,
      onStartLiveMatch: handleStartLiveMatch
    };

    switch (activeSection) {
      case 'dashboard':
        return (
          <Dashboard 
            leagueData={leagueData} 
            isLoading={isLoading}
            leagues={leagues}
            selectedLeague={selectedLeague}
            onLeagueSelect={handleLeagueChange}
            onCreateLeague={() => openModal('league')}
            isLoggedIn={isLoggedIn}
          />
        );
      case 'schedule':
        return <Schedule {...commonProps} />;
      case 'table':
        return <LeagueTable {...commonProps} />;
      case 'teams':
        return (
          <Teams 
            {...commonProps}
            onCreateTeam={handleCreateTeam}
            onEditTeam={handleEditTeam}
            onDeleteTeam={handleDeleteTeam}
            onCreatePlayer={handleCreatePlayer}
            onEditPlayer={handleEditPlayer}
            onDeletePlayer={handleDeletePlayer}
          />
        );
      case 'statistics':
        return <Statistics {...commonProps} />;
      case 'admin':
        return renderAdminPanel();
      case 'live':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/30 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                Live Matches ({commonProps.liveMatches.length})
              </h2>
              {commonProps.liveMatches.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">⚽</div>
                  <h3 className="text-xl font-semibold text-white mb-2">No Live Matches</h3>
                  <p className="text-slate-400">
                    {isLoggedIn ? 'Start a match from the schedule to see live updates here' : 'Live matches will appear here when available'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {commonProps.liveMatches.map(match => (
                    <div key={match._id} className="bg-slate-800/50 rounded-xl p-6 border border-red-500/20">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-lg font-bold text-white">{match.homeTeam?.name || 'TBD'}</div>
                            <div className="text-3xl font-bold text-blue-400">{match.score?.home || 0}</div>
                          </div>
                          <div className="text-center px-4">
                            <div className="text-sm text-slate-400">VS</div>
                            <div className="text-lg font-bold text-white">-</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-white">{match.awayTeam?.name || 'TBD'}</div>
                            <div className="text-3xl font-bold text-red-400">{match.score?.away || 0}</div>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400">{match.liveData?.currentMinute || 0}'</div>
                          <div className="text-sm text-slate-400">{match.status === 'halftime' ? 'HALF TIME' : 'LIVE'}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      default:
        return <Dashboard leagueData={leagueData} isLoading={isLoading} />;
    }
  };

  return (
    <>
      <Layout
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        leagues={leagues}
        selectedLeague={selectedLeague}
        onLeagueChange={handleLeagueChange}
        liveMatchCount={leagueData?.liveMatches?.length || 0}
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        onLogout={handleLogout}
        onShowLogin={() => setShowAdminLogin(true)}
        navItems={navItems}
        onCreateLeague={() => openModal('league')}
        onCreateTeam={handleCreateTeam}
        onCreatePlayer={() => openModal('player')}
        onGenerateSchedule={() => openModal('schedule')}
        onDeleteLeague={handleDeleteLeague}
      >
        {renderCurrentSection()}
      </Layout>

      {/* Modals */}
      <AdminLogin
        isOpen={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
        onLogin={handleLogin}
        isLoading={isLoginLoading}
      />

      <LeagueModal
        isOpen={modals.league.open}
        onClose={() => closeModal('league')}
        league={modals.league.data}
        onSave={handleSaveLeague}
        onDelete={handleDeleteLeague}
      />

      <TeamModal
        isOpen={modals.team.open}
        onClose={() => closeModal('team')}
        team={modals.team.data}
        selectedLeague={selectedLeague}
        onSave={handleSaveTeam}
      />

      <PlayerModal
        isOpen={modals.player.open}
        onClose={() => closeModal('player')}
        data={modals.player.data}
        teams={leagueData?.teams || []}
        selectedLeague={selectedLeague}
        onSave={handleSavePlayer}
      />

      <MatchModal
        isOpen={modals.match.open}
        onClose={() => closeModal('match')}
        match={modals.match.data}
        teams={leagueData?.teams || []}
        selectedLeague={selectedLeague}
        onSave={handleSaveMatch}
      />

      <ScheduleGenerator
        isOpen={modals.schedule.open}
        onClose={() => closeModal('schedule')}
        teams={leagueData?.teams || []}
        selectedLeague={selectedLeague}
        onScheduleGenerated={handleScheduleGenerated}
        currentMatches={leagueData?.matches || []}
      />

      <AdminUserModal
        isOpen={showAdminModal}
        onClose={() => {
          setShowAdminModal(false);
          setSelectedAdmin(null);
        }}
        admin={selectedAdmin}
        onSave={handleSaveAdmin}
        currentUser={currentUser}
      />

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </>
  );
}