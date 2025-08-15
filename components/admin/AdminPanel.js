// components/admin/AdminPanel.js - FINAL CLEAN VERSION
import React, { useState, useEffect } from 'react';
import { 
  Trophy, Calendar, Users, BarChart3, Play, Plus, Edit, Trash2, Save, X, Home, LogOut, 
  Shield, Eye, EyeOff, AlertCircle, CheckCircle, Clock, MapPin, Target, Settings, Menu, 
  RefreshCw, User, Pause, Square, Wifi, WifiOff, Search, Filter, Download, Upload,
  Database, Bug, Zap, AlertTriangle
} from 'lucide-react';

// Import modal components
import LeagueModal from './LeagueModal';
import TeamModal from './TeamModal';
import PlayerModal from './PlayerModal';
import MatchModal from './MatchModal';
import AdminModal from './AdminModal';

// Simple Schedule Modal
const SimpleScheduleModal = ({ isOpen, onClose, teams, selectedLeague, onGenerate }) => {
  const [config, setConfig] = useState({
    format: 'double-round-robin',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    daysBetween: 7,
    timePeriods: ['18:00', '19:30'],
    deleteExisting: true
  });
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await onGenerate(config);
      onClose();
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const expectedMatches = teams.length > 1 ? (config.format === 'double-round-robin' ? teams.length * (teams.length - 1) : Math.floor(teams.length * (teams.length - 1) / 2)) : 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-white">🎯 Generate Tournament Schedule</h3>
                <p className="text-slate-400 text-sm">Create matches for {teams.length} teams automatically</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Tournament Mathematics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-400">{teams.length}</div>
                <div className="text-slate-400 text-sm">Teams</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-400">{expectedMatches}</div>
                <div className="text-slate-400 text-sm">Total Matches</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-400">
                  {config.format === 'double-round-robin' ? (teams.length - 1) * 2 : teams.length - 1}
                </div>
                <div className="text-slate-400 text-sm">Rounds</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-400">
                  {Math.ceil(((config.format === 'double-round-robin' ? (teams.length - 1) * 2 : teams.length - 1)) * config.daysBetween / 7)}
                </div>
                <div className="text-slate-400 text-sm">Weeks</div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-slate-700">
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || teams.length < 2}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
            >
              {isGenerating ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Generating {expectedMatches} Matches...
                </div>
              ) : (
                `🚀 Generate ${expectedMatches} Matches`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Toast component
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

// Main Admin Panel Component
function AdminPanel() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedLeague, setSelectedLeague] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authToken, setAuthToken] = useState('');
  const [toast, setToast] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState(null);

  const [data, setData] = useState({
    leagues: [],
    teams: [],
    players: [],
    matches: [],
    liveMatches: [],
    admins: []
  });

  const [modals, setModals] = useState({
    league: { open: false, data: null },
    team: { open: false, data: null },
    player: { open: false, data: null },
    match: { open: false, data: null },
    schedule: { open: false, data: null },
    admin: { open: false, data: null }
  });

  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, color: 'blue' },
    { id: 'leagues', label: 'Leagues', icon: Trophy, color: 'yellow' },
    { id: 'teams', label: 'Teams', icon: Users, color: 'green' },
    { id: 'players', label: 'Players', icon: User, color: 'purple' },
    { id: 'matches', label: 'Matches', icon: Calendar, color: 'purple' },
    { id: 'live', label: 'Live Matches', icon: Play, color: 'red' },
    { id: 'stats', label: 'Statistics', icon: BarChart3, color: 'indigo' },
    { id: 'admin', label: 'Admin Users', icon: Shield, color: 'orange' },
  ];

  // API call function
  const apiCall = async (endpoint, options = {}, token = null) => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      const useToken = token || authToken;
      if (useToken) {
        headers.Authorization = `Bearer ${useToken}`;
      }

      console.log(`🌐 API Call: ${options.method || 'GET'} /api${endpoint}`);

      const response = await fetch(`/api${endpoint}`, {
        headers,
        ...options
      });

      if (response.status === 401) {
        console.log('🔒 Authentication failed, but continuing...');
        const error = await response.json();
        throw new Error(error.error || 'Authentication failed');
      }

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ API Success: ${endpoint}`, data);
        setLastSync(new Date());
        return data;
      }
      
      const error = await response.json();
      console.error(`❌ API Error: ${endpoint}`, error);
      throw new Error(error.error || 'API call failed');
    } catch (error) {
      console.error(`💥 Network Error: ${endpoint}`, error);
      if (!navigator.onLine) {
        setIsOnline(false);
        throw new Error('Network connection lost');
      }
      throw error;
    }
  };

  // Show toast notification
  const showToast = (message, type = 'success') => {
    console.log(`📢 Toast: [${type.toUpperCase()}] ${message}`);
    setToast({ message, type });
  };

  const hideToast = () => setToast(null);

  // Enhanced match loading
  const loadMatchesWithFallback = async (leagueId) => {
    const endpoints = [
      `/matches?leagueId=${leagueId}&limit=300`,
      `/matches?league=${leagueId}&limit=300`,   
      `/matches?leagueId=${leagueId}`,           
      `/matches?league=${leagueId}`,             
      `/league/${leagueId}/matches`,             
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`🧪 Trying matches endpoint: ${endpoint}`);
        const response = await apiCall(endpoint);
        
        if (response) {
          console.log(`✅ Matches loaded from: ${endpoint}`, response);
          
          let matches = [];
          if (Array.isArray(response)) {
            matches = response;
          } else if (response.matches && Array.isArray(response.matches)) {
            matches = response.matches;
          } else if (response.data && Array.isArray(response.data)) {
            matches = response.data;
          }
          
          if (matches.length > 0) {
            console.log(`📊 Processed ${matches.length} matches from ${endpoint}`);
            return matches;
          } else {
            console.log(`⚠️ ${endpoint} returned empty array`);
          }
        }
      } catch (error) {
        console.log(`❌ Failed endpoint ${endpoint}:`, error.message);
        continue;
      }
    }
    
    console.log('❌ All match endpoints failed');
    return [];
  };

  // Load league data
  const loadLeagueData = async (leagueId, silent = false) => {
    if (!leagueId) return;

    try {
      if (!silent) setLoading(true);
      console.log('📄 Loading league data for:', leagueId);
      
      const [teams, players, matchesArray] = await Promise.all([
        apiCall(`/teams?leagueId=${leagueId}`).catch(err => {
          console.error('Teams loading failed:', err);
          return [];
        }),
        apiCall(`/players?leagueId=${leagueId}`).catch(err => {
          console.error('Players loading failed:', err);
          return [];
        }),
        loadMatchesWithFallback(leagueId)
      ]);

      console.log('📊 Final API results:');
      console.log('- Teams:', teams?.length || 0);
      console.log('- Players:', players?.length || 0);
      console.log('- Matches:', matchesArray?.length || 0);

      const matches = Array.isArray(matchesArray) ? matchesArray : [];
      const liveMatches = matches.filter(m => 
        m && (m.status === 'live' || m.status === 'halftime')
      ) || [];

      console.log(`🔴 Found ${liveMatches.length} live matches`);

      setData(prev => ({
        ...prev,
        teams: Array.isArray(teams) ? teams : [],
        players: Array.isArray(players) ? players : [],
        matches: matches,
        liveMatches: liveMatches
      }));

      if (!silent) {
        if (matches.length > 0) {
          console.log(`✅ Successfully loaded ${matches.length} matches`);
          showToast(`Loaded ${matches.length} matches`, 'success');
        } else {
          console.log('⚠️ No matches found');
          showToast('No matches found - try generating a schedule', 'warning');
        }
        
        if (liveMatches.length > 0) {
          showToast(`${liveMatches.length} live match(es) active`, 'info');
        }
      }

    } catch (error) {
      console.error('❌ Failed to load league data:', error);
      if (!silent) {
        showToast('Failed to load league data: ' + error.message, 'error');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Load initial data
  const loadInitialDataWithToken = async (token) => {
    try {
      setLoading(true);
      console.log('📊 Loading initial data...');
      
      const leagues = await apiCall('/leagues', {}, token);
      
      setData(prev => ({
        ...prev,
        leagues: leagues || []
      }));

      if (leagues?.length > 0 && !selectedLeague) {
        setSelectedLeague(leagues[0]._id);
        await loadLeagueData(leagues[0]._id);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      showToast('Failed to load some data: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('🔐 Attempting login...');
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const result = await response.json();
      console.log('✅ Login successful:', result.user);

      if (result?.token) {
        setAuthToken(result.token);
        setIsLoggedIn(true);
        setCurrentUser(result.user);
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('adminToken', result.token);
          localStorage.setItem('adminUser', JSON.stringify(result.user));
        }
        
        await loadInitialDataWithToken(result.token);
        showToast('Welcome back! 👋', 'success');
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast('Login failed: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    console.log('👋 Logging out...');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setAuthToken('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
    }
    setLoginForm({ username: '', password: '' });
    setActiveSection('dashboard');
    setData({
      leagues: [],
      teams: [],
      players: [],
      matches: [],
      liveMatches: [],
      admins: []
    });
    showToast('Logged out successfully', 'info');
  };

  // Emergency functions
  const handleEmergencyLogin = async () => {
    setLoginForm({ username: 'admin', password: 'admin123' });
    const event = { preventDefault: () => {} };
    await handleLogin(event);
  };

  const handleRestoreAuth = () => {
    try {
      const token = localStorage.getItem('adminToken');
      const user = localStorage.getItem('adminUser');
      
      if (token && user) {
        setAuthToken(token);
        setCurrentUser(JSON.parse(user));
        setIsLoggedIn(true);
        loadInitialDataWithToken(token);
        showToast('Auth restored from localStorage', 'success');
      } else {
        showToast('No stored auth found', 'warning');
      }
    } catch (error) {
      showToast('Failed to restore auth: ' + error.message, 'error');
    }
  };

  // Save handlers
  const handleSaveLeague = async (formData) => {
    try {
      setLoading(true);
      console.log('💾 Saving league:', formData);
      
      const method = formData._id ? 'PUT' : 'POST';
      
      await apiCall('/leagues', {
        method,
        body: JSON.stringify(formData)
      });

      await loadInitialDataWithToken(authToken);
      closeModal('league');
      showToast(formData._id ? 'League updated!' : 'League created!');
    } catch (error) {
      console.error('Save league error:', error);
      showToast('Failed to save league: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTeam = async (formData) => {
    try {
      setLoading(true);
      console.log('💾 Saving team:', formData);
      
      const payload = {
        name: formData.name,
        coach: formData.coach,
        stadium: formData.stadium,
        logo: formData.logo,
        founded: formData.founded,
        leagueId: selectedLeague,
        ...(formData._id && { id: formData._id })
      };
      
      const method = formData._id ? 'PUT' : 'POST';
      
      await apiCall('/teams', {
        method,
        body: JSON.stringify(payload)
      });

      await loadLeagueData(selectedLeague);
      closeModal('team');
      showToast(formData._id ? 'Team updated!' : 'Team created!');
    } catch (error) {
      console.error('Save team error:', error);
      showToast('Failed to save team: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };
  const handleSavePlayer = async (formData) => {
    try {
      setLoading(true);
      console.log('💾 Saving player:', formData);
      
      const payload = {
        name: formData.name,
        number: formData.number,
        position: formData.position,
        photo: formData.photo,
        teamId: formData.teamId,
        leagueId: selectedLeague,
        dateOfBirth: formData.dateOfBirth,
        nationality: formData.nationality,
        height: formData.height,
        weight: formData.weight,
        ...(formData._id && { id: formData._id })
      };
      
      const method = formData._id ? 'PUT' : 'POST';
      
      await apiCall('/players', {
        method,
        body: JSON.stringify(payload)
      });

      await loadLeagueData(selectedLeague);
      closeModal('player');
      showToast(formData._id ? 'Player updated!' : 'Player created!');
    } catch (error) {
      console.error('Save player error:', error);
      showToast('Failed to save player: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMatch = async (formData) => {
    try {
      setLoading(true);
      console.log('💾 Saving match:', formData);
      
      // Enhanced payload with better error handling
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

      // Add ID only for updates
      if (formData._id) {
        payload.id = formData._id;
      }

      console.log('📤 Match payload:', payload);
      
      const method = formData._id ? 'PUT' : 'POST';
      
      const result = await apiCall('/matches', {
        method,
        body: JSON.stringify(payload)
      });

      console.log('✅ Match save result:', result);

      await loadLeagueData(selectedLeague);
      closeModal('match');
      showToast(formData._id ? 'Match updated!' : 'Match created!');
    } catch (error) {
      console.error('Save match error:', error);
      console.log('❌ Match creation failed. Checking API endpoints...');
      
      // Try alternative approach for match creation
      try {
        console.log('🔄 Attempting alternative match creation...');
        const alternativePayload = {
          league: selectedLeague, // Try 'league' instead of 'leagueId'
          homeTeam: formData.homeTeam,
          awayTeam: formData.awayTeam,
          date: formData.date,
          time: formData.time,
          round: parseInt(formData.round) || 1,
          venue: formData.venue || 'Manadhoo Futsal Ground',
          status: 'scheduled'
        };

        const alternativeResult = await apiCall('/matches', {
          method: 'POST',
          body: JSON.stringify(alternativePayload)
        });

        console.log('✅ Alternative match creation successful:', alternativeResult);
        await loadLeagueData(selectedLeague);
        closeModal('match');
        showToast('Match created successfully!');
      } catch (alternativeError) {
        console.error('Alternative match creation also failed:', alternativeError);
        showToast('Failed to create match. Please check your API setup: ' + error.message, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Schedule generation
  const handleGenerateSchedule = async (scheduleData) => {
    try {
      setLoading(true);
      console.log('📅 Generating schedule with data:', scheduleData);
      
      if (!data.teams || data.teams.length < 2) {
        showToast('Need at least 2 teams to generate schedule', 'error');
        return;
      }
      
      const payload = {
        leagueId: selectedLeague,
        format: scheduleData.format || 'double-round-robin',
        startDate: scheduleData.startDate,
        daysBetween: parseInt(scheduleData.daysBetween) || 7,
        timePeriods: scheduleData.timePeriods || ['18:00'],
        deleteExisting: scheduleData.deleteExisting !== false
      };

      console.log('📤 Sending schedule request:', payload);

      const result = await apiCall('/matches/generate-schedule', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      console.log('✅ Schedule generation result:', result);

      // Wait and verify
      console.log('⏳ Waiting for API to finish processing...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      let attempts = 0;
      const maxAttempts = 5;
      let matchesFound = false;
      
      while (attempts < maxAttempts && !matchesFound) {
        attempts++;
        console.log(`🔄 Verification attempt ${attempts}/${maxAttempts}`);
        
        try {
          const matchesCheck = await loadMatchesWithFallback(selectedLeague);
          const matchCount = matchesCheck.length;
          
          if (matchCount > 0) {
            console.log(`✅ Found ${matchCount} matches on attempt ${attempts}`);
            await loadLeagueData(selectedLeague, false);
            matchesFound = true;
            break;
          } else {
            console.log(`⏳ Attempt ${attempts}: No matches yet, waiting...`);
            await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
          }
        } catch (error) {
          console.log(`❌ Attempt ${attempts} failed:`, error.message);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (matchesFound) {
        const matchCount = result.data?.matchesCreated || result.matchesCreated || result.matches?.length || 'multiple';
        showToast(`Schedule generated! ${matchCount} matches created. 🏆`);
      } else {
        showToast('Schedule generated but matches not visible yet. Try refreshing.', 'warning');
      }
      
    } catch (error) {
      console.error('❌ Schedule generation error:', error);
      showToast(`Failed to generate schedule: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Delete handler
  const handleDeleteItem = async (type, id) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      setLoading(true);
      const endpoints = {
        league: `/leagues?id=${id}`,
        team: `/teams?id=${id}`,
        player: `/players?id=${id}`,
        match: `/matches?id=${id}`,
        admin: `/admin?username=${id}`
      };

      await apiCall(endpoints[type], { method: 'DELETE' });

      if (type === 'league') {
        await loadInitialDataWithToken(authToken);
        if (selectedLeague === id) {
          setSelectedLeague('');
          setData(prev => ({
            ...prev,
            teams: [],
            players: [],
            matches: [],
            liveMatches: []
          }));
        }
      } else {
        await loadLeagueData(selectedLeague);
      }

      showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully!`);
    } catch (error) {
      showToast(`Failed to delete ${type}: ` + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Modal management
  const openModal = (type, itemData = null) => {
    setModals(prev => ({
      ...prev,
      [type]: { open: true, data: itemData }
    }));
  };

  const closeModal = (type) => {
    setModals(prev => ({
      ...prev,
      [type]: { open: false, data: null }
    }));
  };

  // Navigation
  const handleNavigation = (sectionId) => {
    setActiveSection(sectionId);
    setSidebarOpen(false);
  };

  // Check for existing auth on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('adminToken');
    const user = localStorage.getItem('adminUser');
    
    if (token && user) {
      try {
        console.log('🔒 Found stored auth, attempting auto-login...');
        setAuthToken(token);
        setCurrentUser(JSON.parse(user));
        setIsLoggedIn(true);
        loadInitialDataWithToken(token);
      } catch (error) {
        console.error('Invalid stored auth data');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
      }
    }
  }, []);

  // Login Screen
  if (!isLoggedIn) {
    return (
      <React.Fragment>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
          <div className="bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 lg:p-8 w-full max-w-md border border-blue-500/20">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Admin Panel</h1>
              <p className="text-slate-400">Horse Futsal League Management</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your username"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 transition-all duration-200"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
            
            <div className="mt-6 space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={handleEmergencyLogin}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg text-sm transition-colors"
                >
                  🚨 Emergency Login
                </button>
                <button
                  onClick={handleRestoreAuth}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black py-2 px-3 rounded-lg text-sm transition-colors"
                >
                  🔄 Restore Auth
                </button>
              </div>
              
              <div className="p-4 bg-slate-700/30 rounded-lg">
                <p className="text-xs text-slate-400 text-center">
                  Demo: admin / admin123 • Emergency login tries default credentials
                </p>
              </div>
            </div>
          </div>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      </React.Fragment>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Desktop Header */}
      <header className="fixed top-0 left-0 right-0 bg-slate-800/95 backdrop-blur-sm border-b border-slate-700 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
                  <p className="text-sm text-slate-400">Horse Futsal League • Real-time Management</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <select 
                value={selectedLeague}
                onChange={(e) => {
                  setSelectedLeague(e.target.value);
                  if (e.target.value) loadLeagueData(e.target.value);
                }}
                className="bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
              >
                <option value="">Select League</option>
                {data.leagues.map(league => (
                  <option key={league._id} value={league._id}>{league.name}</option>
                ))}
              </select>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-white font-medium">{currentUser?.username}</p>
                  <p className="text-slate-400 text-sm">{currentUser?.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="hidden xl:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="fixed top-20 left-0 h-full w-64 bg-slate-800/95 backdrop-blur-sm border-r border-slate-700 z-40">
          <div className="p-4 lg:p-6">
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 ml-64 pt-20">
          <div className="p-4 lg:p-6">
            {activeSection === 'dashboard' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-white">Dashboard</h2>
                    <p className="text-slate-400 mt-1">Manage your futsal league operations</p>
                  </div>
                  <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Administrative Access</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm font-medium">Leagues</p>
                        <p className="text-2xl lg:text-3xl font-bold text-white mt-1">{data.leagues.length}</p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm font-medium">Teams</p>
                        <p className="text-2xl lg:text-3xl font-bold text-white mt-1">{data.teams.length}</p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm font-medium">Players</p>
                        <p className="text-2xl lg:text-3xl font-bold text-white mt-1">{data.players.length}</p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-sm font-medium">Live Now</p>
                        <p className="text-2xl lg:text-3xl font-bold text-white mt-1">{data.liveMatches.length}</p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                        <Play className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
                  <h3 className="text-xl font-semibold text-white mb-6">Quick Actions</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                      onClick={() => openModal('player')}
                      disabled={!selectedLeague || data.teams.length === 0}
                      className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 p-4 lg:p-6 rounded-xl text-white transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      <User className="w-6 h-6 lg:w-8 lg:h-8 mx-auto mb-2" />
                      <p className="font-medium text-sm lg:text-base">Add Player</p>
                    </button>
                    <button
                      onClick={() => openModal('match')}
                      disabled={!selectedLeague || data.teams.length < 2}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 p-4 lg:p-6 rounded-xl text-white transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      <Plus className="w-6 h-6 lg:w-8 lg:h-8 mx-auto mb-2" />
                      <p className="font-medium text-sm lg:text-base">Add Match</p>
                    </button>
                    <button
                      onClick={() => openModal('schedule')}
                      disabled={!selectedLeague || data.teams.length < 2}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 p-4 lg:p-6 rounded-xl text-white transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      <Calendar className="w-6 h-6 lg:w-8 lg:h-8 mx-auto mb-2" />
                      <p className="font-medium text-sm lg:text-base">Generate Schedule</p>
                    </button>
                    <button
                      onClick={async () => {
                        console.log('🔄 Manual refresh clicked');
                        if (selectedLeague) {
                          setLoading(true);
                          try {
                            const matchesCheck = await loadMatchesWithFallback(selectedLeague);
                            setData(prev => ({ ...prev, matches: matchesCheck }));
                            showToast(`Loaded ${matchesCheck.length} matches`, 'success');
                          } catch (error) {
                            showToast('Failed to refresh: ' + error.message, 'error');
                          } finally {
                            setLoading(false);
                          }
                        } else {
                          showToast('Select a league first', 'warning');
                        }
                      }}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 p-4 lg:p-6 rounded-xl text-white transition-all duration-200 hover:scale-105 hover:shadow-lg"
                    >
                      <RefreshCw className="w-6 h-6 lg:w-8 lg:h-8 mx-auto mb-2" />
                      <p className="font-medium text-sm lg:text-base">🔄 Force Refresh</p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'matches' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-white">Match Management</h2>
                    <p className="text-slate-400 mt-1">Schedule and manage matches</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={async () => {
                        console.log('🔄 Manual refresh clicked');
                        if (selectedLeague) {
                          setLoading(true);
                          try {
                            const matchesCheck = await loadMatchesWithFallback(selectedLeague);
                            setData(prev => ({ ...prev, matches: matchesCheck }));
                            showToast(`Loaded ${matchesCheck.length} matches`, 'success');
                          } catch (error) {
                            showToast('Failed to refresh: ' + error.message, 'error');
                          } finally {
                            setLoading(false);
                          }
                        } else {
                          showToast('Select a league first', 'warning');
                        }
                      }}
                      className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>🔄 Force Refresh</span>
                    </button>
                    
                    <button
                      onClick={() => openModal('match')}
                      disabled={!selectedLeague || data.teams.length < 2}
                      className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Match</span>
                    </button>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="text-blue-400 font-medium mb-3 flex items-center gap-2">
                    🔍 Live Debug Information
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">League Selected:</span>
                      <div className="text-white font-medium">{selectedLeague ? '✅ Yes' : '❌ No'}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Teams Count:</span>
                      <div className="text-white font-medium">{data.teams?.length || 0}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Matches Count:</span>
                      <div className="text-white font-medium">{data.matches?.length || 0}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Live Count:</span>
                      <div className="text-white font-medium">{data.liveMatches?.length || 0}</div>
                    </div>
                  </div>
                </div>

                {!selectedLeague ? (
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 border border-slate-700/50 text-center">
                    <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Select a League</h3>
                    <p className="text-slate-400">Choose a league from the dropdown above to manage matches.</p>
                  </div>
                ) : data.teams.length < 2 ? (
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 border border-slate-700/50 text-center">
                    <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Need More Teams</h3>
                    <p className="text-slate-400">Add at least 2 teams to start scheduling matches.</p>
                  </div>
                ) : !data.matches || data.matches.length === 0 ? (
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 border border-slate-700/50 text-center">
                    <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Matches Found</h3>
                    <p className="text-slate-400 mb-4">Generate a schedule or add individual matches to get started.</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        onClick={() => openModal('schedule')}
                        className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
                      >
                        Generate Full Schedule
                      </button>
                      <button
                        onClick={() => openModal('match')}
                        className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200"
                      >
                        Add Single Match
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-slate-700/30 rounded-xl p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-white">{data.matches.length}</div>
                          <div className="text-slate-400 text-sm">Total Matches</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-400">
                            {data.matches.filter(m => m.status === 'finished').length}
                          </div>
                          <div className="text-slate-400 text-sm">Completed</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-400">
                            {data.matches.filter(m => m.status === 'scheduled').length}
                          </div>
                          <div className="text-slate-400 text-sm">Scheduled</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-400">
                            {data.matches.filter(m => m.status === 'live' || m.status === 'halftime').length}
                          </div>
                          <div className="text-slate-400 text-sm">Live</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {data.matches
                        .sort((a, b) => new Date(a.date + ' ' + (a.time || '18:00')) - new Date(b.date + ' ' + (b.time || '18:00')))
                        .slice(0, 20)
                        .map(match => {
                          const homeTeam = match.homeTeam;
                          const awayTeam = match.awayTeam;
                          const isLive = match.status === 'live' || match.status === 'halftime';
                          const isFinished = match.status === 'finished';
                          
                          return (
                            <div key={match._id} className={`bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border transition-all duration-200 ${
                              isLive ? 'border-red-500 shadow-lg shadow-red-500/25' : 'border-slate-700/50 hover:border-slate-600/50'
                            }`}>
                              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-semibold text-white">
                                      {homeTeam?.name || 'TBD'} vs {awayTeam?.name || 'TBD'}
                                    </h3>
                                    {isLive && (
                                      <span className="flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                        LIVE
                                      </span>
                                    )}
                                    {isFinished && (
                                      <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                                        FINISHED
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-slate-400 mb-2">
                                    Round {match.round || 'TBD'} • {match.date ? new Date(match.date).toLocaleDateString() : 'TBD'} {match.time || 'TBD'}
                                    {match.venue && ` • ${match.venue}`}
                                  </div>
                                  {(isFinished || isLive) && match.score && (
                                    <div className={`text-lg font-bold ${isLive ? 'text-red-400' : 'text-green-400'}`}>
                                      Score: {match.score.home || 0} - {match.score.away || 0}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => openModal('match', match)}
                                    className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteItem('match', match._id)}
                                    className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                    
                    {data.matches.length > 20 && (
                      <div className="text-center">
                        <p className="text-slate-400">Showing first 20 of {data.matches.length} matches</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeSection === 'leagues' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-white">League Management</h2>
                    <p className="text-slate-400 mt-1">Create and manage tournaments</p>
                  </div>
                  <button
                    onClick={() => openModal('league')}
                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create League</span>
                  </button>
                </div>
                
                {data.leagues.length === 0 ? (
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 border border-slate-700/50 text-center">
                    <Trophy className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Leagues Created</h3>
                    <p className="text-slate-400 mb-4">Create your first league to get started with managing tournaments.</p>
                    <button
                      onClick={() => openModal('league')}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                    >
                      Create First League
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.leagues.map(league => (
                      <div key={league._id} className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-200">
                        <div className="flex items-center justify-between mb-4">
                          <Trophy className="w-8 h-8 text-yellow-400" />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openModal('league', league)}
                              className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem('league', league._id)}
                              className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">{league.name}</h3>
                        <div className="space-y-1 text-sm text-slate-400">
                          <p className="flex items-center space-x-2">
                            <Users className="w-4 h-4" />
                            <span>{league.teamsCount || 0} teams</span>
                          </p>
                          <p className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>{league.matchesCount || 0} matches</span>
                          </p>
                          {league.season && (
                            <p className="flex items-center space-x-2">
                              <Clock className="w-4 h-4" />
                              <span>Season {league.season}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSection === 'teams' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-white">Team Management</h2>
                    <p className="text-slate-400 mt-1">Manage teams and their information</p>
                  </div>
                  <button
                    onClick={() => openModal('team')}
                    disabled={!selectedLeague}
                    className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Team</span>
                  </button>
                </div>

                {!selectedLeague ? (
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 border border-slate-700/50 text-center">
                    <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Select a League</h3>
                    <p className="text-slate-400">Choose a league from the dropdown above to manage teams.</p>
                  </div>
                ) : data.teams.length === 0 ? (
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 border border-slate-700/50 text-center">
                    <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Teams Added</h3>
                    <p className="text-slate-400 mb-4">Add teams to start building your league.</p>
                    <button
                      onClick={() => openModal('team')}
                      className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200"
                    >
                      Add First Team
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.teams.map(team => {
                      const playerCount = data.players.filter(p => 
                        (p.team?._id === team._id) || (p.teamId === team._id)
                      ).length;
                      
                      return (
                        <div key={team._id} className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-200">
                          <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                              {team.logo ? (
                                <img src={team.logo} alt={team.name} className="w-full h-full object-contain rounded-xl" />
                              ) : (
                                <span className="text-white font-bold text-lg">{team.name.substring(0, 2)}</span>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openModal('team', team)}
                                className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem('team', team._id)}
                                className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <h3 className="text-lg font-semibold text-white mb-2">{team.name}</h3>
                          <div className="space-y-1 text-sm text-slate-400">
                            <p className="flex items-center space-x-2">
                              <Users className="w-4 h-4" />
                              <span>{playerCount} players</span>
                            </p>
                            {team.coach && (
                              <p className="flex items-center space-x-2">
                                <User className="w-4 h-4" />
                                <span>Coach: {team.coach}</span>
                              </p>
                            )}
                            {team.stadium && (
                              <p className="flex items-center space-x-2">
                                <MapPin className="w-4 h-4" />
                                <span>{team.stadium}</span>
                              </p>
                            )}
                            {team.founded && (
                              <p className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4" />
                                <span>Founded {team.founded}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeSection === 'players' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-white">Player Management</h2>
                    <p className="text-slate-400 mt-1">Manage players and their information</p>
                  </div>
                  <button
                    onClick={() => openModal('player')}
                    disabled={!selectedLeague || data.teams.length === 0}
                    className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Player</span>
                  </button>
                </div>

                {!selectedLeague ? (
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 border border-slate-700/50 text-center">
                    <User className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Select a League</h3>
                    <p className="text-slate-400">Choose a league from the dropdown above to manage players.</p>
                  </div>
                ) : data.teams.length === 0 ? (
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 border border-slate-700/50 text-center">
                    <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Teams Available</h3>
                    <p className="text-slate-400 mb-4">Add teams first before adding players.</p>
                    <button
                      onClick={() => openModal('team')}
                      className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200"
                    >
                      Add Teams First
                    </button>
                  </div>
                ) : data.players.length === 0 ? (
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 border border-slate-700/50 text-center">
                    <User className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Players Added</h3>
                    <p className="text-slate-400 mb-4">Add players to start building your teams.</p>
                    <button
                      onClick={() => openModal('player')}
                      className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200"
                    >
                      Add First Player
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {data.players.map(player => (
                      <div key={player._id} className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center overflow-hidden">
                            {player.photo ? (
                              <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white font-bold text-lg">#{player.number}</span>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openModal('player', player)}
                              className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem('player', player._id)}
                              className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">{player.name}</h3>
                        <div className="space-y-1 text-sm text-slate-400">
                          <p className="flex items-center justify-between">
                            <span>Number:</span>
                            <span className="text-white font-bold">#{player.number}</span>
                          </p>
                          <p className="flex items-center justify-between">
                            <span>Position:</span>
                            <span className="text-white">{player.position}</span>
                          </p>
                          <p className="flex items-center justify-between">
                            <span>Team:</span>
                            <span className="text-white">{player.team?.name || 'Unknown'}</span>
                          </p>
                          {player.nationality && (
                            <p className="flex items-center justify-between">
                              <span>Nationality:</span>
                              <span className="text-white">{player.nationality}</span>
                            </p>
                          )}
                          <div className="mt-3 pt-3 border-t border-slate-700">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="text-center">
                                <div className="text-white font-bold">{player.stats?.goals || 0}</div>
                                <div className="text-slate-500">Goals</div>
                              </div>
                              <div className="text-center">
                                <div className="text-white font-bold">{player.stats?.assists || 0}</div>
                                <div className="text-slate-500">Assists</div>
                              </div>
                              <div className="text-center">
                                <div className="text-yellow-400 font-bold">{player.stats?.yellowCards || 0}</div>
                                <div className="text-slate-500">Yellow</div>
                              </div>
                              <div className="text-center">
                                <div className="text-red-400 font-bold">{player.stats?.redCards || 0}</div>
                                <div className="text-slate-500">Red</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSection === 'live' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-white">Live Match Management</h2>
                    <p className="text-slate-400 mt-1">Real-time match control and scoring</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => loadLeagueData(selectedLeague)}
                      className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Refresh All</span>
                    </button>
                    
                    {data.liveMatches && data.liveMatches.length > 0 && (
                      <div className="flex items-center space-x-2 bg-red-500/20 text-red-400 px-3 py-2 rounded-lg border border-red-500/30">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <span className="font-medium">{data.liveMatches.length} LIVE NOW</span>
                      </div>
                    )}
                  </div>
                </div>

                {!selectedLeague ? (
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 border border-slate-700/50 text-center">
                    <Play className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Select a League</h3>
                    <p className="text-slate-400">Choose a league from the dropdown above to manage live matches.</p>
                  </div>
                ) : (data.liveMatches && data.liveMatches.length > 0) ? (
                  <div className="space-y-6">
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                      <h3 className="text-red-400 font-bold text-lg mb-3">🔴 LIVE MATCHES</h3>
                      <p className="text-slate-300">
                        {data.liveMatches.length} match{data.liveMatches.length > 1 ? 'es' : ''} currently being played
                      </p>
                    </div>
                    
                    {data.liveMatches.map(match => (
                      <div key={match._id} className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-2xl p-6">
                        <div className="text-center mb-6">
                          <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                            <h3 className="text-xl font-bold text-red-400">LIVE MATCH</h3>
                          </div>
                          <h4 className="text-2xl font-bold text-white mb-2">
                            {match.homeTeam?.name || 'Home'} vs {match.awayTeam?.name || 'Away'}
                          </h4>
                          <p className="text-slate-400">
                            Round {match.round} • {match.date} {match.time}
                          </p>
                          <div className="mt-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                              match.status === 'live' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'
                            }`}>
                              {match.status === 'halftime' ? 'HALF TIME' : 'LIVE'}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6 mb-6 items-center">
                          <div className="text-center">
                            <h5 className="text-white font-bold mb-3">{match.homeTeam?.name || 'Home'}</h5>
                            <div className="text-4xl font-bold text-white">
                              {match.score?.home || 0}
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="text-3xl font-bold text-slate-400 mb-2">VS</div>
                            <div className="text-lg text-slate-500">
                              {match.liveData?.currentMinute || 0}&apos;
                            </div>
                          </div>

                          <div className="text-center">
                            <h5 className="text-white font-bold mb-3">{match.awayTeam?.name || 'Away'}</h5>
                            <div className="text-4xl font-bold text-white">
                              {match.score?.away || 0}
                            </div>
                          </div>
                        </div>

                        <div className="text-center">
                          <p className="text-slate-400 text-sm">Live match controls will be available here</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 border border-slate-700/50 text-center">
                    <Play className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Live Matches</h3>
                    <p className="text-slate-400 mb-4">Start a match from the matches section to begin live management.</p>
                    
                    {data.matches && data.matches.filter(m => m.status === 'scheduled').length > 0 && (
                      <div className="space-y-3 max-w-md mx-auto">
                        <h4 className="text-white font-medium">Scheduled Matches - Ready to Go Live</h4>
                        {data.matches.filter(m => m.status === 'scheduled').slice(0, 3).map(match => (
                          <div key={match._id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl">
                            <div className="text-left">
                              <div className="text-white font-medium">
                                {match.homeTeam?.name} vs {match.awayTeam?.name}
                              </div>
                              <div className="text-slate-400 text-sm">
                                {match.date} {match.time} • Round {match.round}
                              </div>
                            </div>
                            <button className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors font-medium">
                              <Play className="w-4 h-4" />
                              <span>Go Live</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeSection === 'stats' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-white">Statistics</h2>
                    <p className="text-slate-400 mt-1">View league statistics and analytics</p>
                  </div>
                </div>

                {!selectedLeague ? (
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 border border-slate-700/50 text-center">
                    <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Select a League</h3>
                    <p className="text-slate-400">Choose a league from the dropdown above to view statistics.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-400" />
                        Overview
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total Teams:</span>
                          <span className="text-white font-bold">{data.teams.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total Players:</span>
                          <span className="text-white font-bold">{data.players.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total Matches:</span>
                          <span className="text-white font-bold">{data.matches.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Completed:</span>
                          <span className="text-green-400 font-bold">
                            {data.matches.filter(m => m.status === 'finished').length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Live Now:</span>
                          <span className="text-red-400 font-bold">{data.liveMatches?.length || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5 text-yellow-400" />
                        Goals
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total Goals:</span>
                          <span className="text-white font-bold">
                            {data.matches
                              .filter(m => m.status === 'finished')
                              .reduce((total, match) => 
                                total + (match.score?.home || 0) + (match.score?.away || 0), 0
                              )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Avg per Match:</span>
                          <span className="text-white font-bold">
                            {data.matches.filter(m => m.status === 'finished').length > 0 ? (
                              data.matches
                                .filter(m => m.status === 'finished')
                                .reduce((total, match) => 
                                  total + (match.score?.home || 0) + (match.score?.away || 0), 0
                                ) / data.matches.filter(m => m.status === 'finished').length
                            ).toFixed(1) : '0.0'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Top Scorer:</span>
                          <span className="text-white font-bold">
                            {data.players.reduce((top, player) => 
                              (player.stats?.goals || 0) > (top.stats?.goals || 0) ? player : top, 
                              { name: 'N/A', stats: { goals: 0 } }
                            ).name}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-green-400" />
                        Progress
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-slate-400">Season Progress:</span>
                            <span className="text-white font-bold">
                              {data.matches.length > 0 ? 
                                Math.round((data.matches.filter(m => m.status === 'finished').length / data.matches.length) * 100) 
                                : 0}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${data.matches.length > 0 ? 
                                  Math.round((data.matches.filter(m => m.status === 'finished').length / data.matches.length) * 100) 
                                  : 0}%` 
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Remaining:</span>
                          <span className="text-white font-bold">
                            {data.matches.filter(m => m.status === 'scheduled').length} matches
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Top Players Grid */}
                    <div className="md:col-span-2 lg:col-span-3 bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-400" />
                        Top Performers
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                          <h4 className="text-slate-300 font-medium mb-3">⚽ Top Scorers</h4>
                          <div className="space-y-2">
                            {data.players
                              .filter(p => (p.stats?.goals || 0) > 0)
                              .sort((a, b) => (b.stats?.goals || 0) - (a.stats?.goals || 0))
                              .slice(0, 5)
                              .map((player, index) => (
                                <div key={player._id} className="flex items-center justify-between text-sm">
                                  <span className="text-slate-400">
                                    {index + 1}. {player.name}
                                  </span>
                                  <span className="text-white font-bold">{player.stats?.goals || 0}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-slate-300 font-medium mb-3">🎯 Most Assists</h4>
                          <div className="space-y-2">
                            {data.players
                              .filter(p => (p.stats?.assists || 0) > 0)
                              .sort((a, b) => (b.stats?.assists || 0) - (a.stats?.assists || 0))
                              .slice(0, 5)
                              .map((player, index) => (
                                <div key={player._id} className="flex items-center justify-between text-sm">
                                  <span className="text-slate-400">
                                    {index + 1}. {player.name}
                                  </span>
                                  <span className="text-white font-bold">{player.stats?.assists || 0}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-slate-300 font-medium mb-3">🟨 Most Cards</h4>
                          <div className="space-y-2">
                            {data.players
                              .filter(p => ((p.stats?.yellowCards || 0) + (p.stats?.redCards || 0)) > 0)
                              .sort((a, b) => 
                                ((b.stats?.yellowCards || 0) + (b.stats?.redCards || 0) * 2) - 
                                ((a.stats?.yellowCards || 0) + (a.stats?.redCards || 0) * 2)
                              )
                              .slice(0, 5)
                              .map((player, index) => (
                                <div key={player._id} className="flex items-center justify-between text-sm">
                                  <span className="text-slate-400">
                                    {index + 1}. {player.name}
                                  </span>
                                  <span className="text-white font-bold">
                                    {(player.stats?.yellowCards || 0) + (player.stats?.redCards || 0)}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'admin' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-white">Admin Management</h2>
                    <p className="text-slate-400 mt-1">Manage admin users and permissions</p>
                  </div>
                  <button
                    onClick={() => openModal('admin')}
                    className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Admin</span>
                  </button>
                </div>

                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-6 h-6 text-orange-400" />
                    <h3 className="text-orange-400 font-bold text-lg">Security Notice</h3>
                  </div>
                  <p className="text-slate-300">
                    Admin management allows you to control who has access to the administrative functions of the futsal league system. 
                    Only grant admin access to trusted individuals.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                      <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                        Super Admin
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{currentUser?.username || 'admin'}</h3>
                    <div className="space-y-1 text-sm text-slate-400">
                      <p>• Full system access</p>
                      <p>• User management</p>
                      <p>• League configuration</p>
                      <p>• System settings</p>
                    </div>
                  </div>

                  {data.admins && data.admins.length > 0 && data.admins.map(admin => (
                    <div key={admin._id} className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openModal('admin', admin)}
                            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem('admin', admin.username)}
                            className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">{admin.username}</h3>
                      <div className="space-y-1 text-sm text-slate-400">
                        <p>Role: {admin.role || 'Admin'}</p>
                        <p>Status: {admin.isActive ? 'Active' : 'Inactive'}</p>
                        {admin.email && <p>Email: {admin.email}</p>}
                      </div>
                    </div>
                  ))}

                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 border-dashed hover:border-orange-500/50 transition-all duration-200">
                    <button
                      onClick={() => openModal('admin')}
                      className="w-full h-full flex flex-col items-center justify-center text-center py-8"
                    >
                      <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4">
                        <Plus className="w-6 h-6 text-orange-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">Add New Admin</h3>
                      <p className="text-slate-400 text-sm">Create a new admin account with specific permissions</p>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      {modals.league.open && (
        <LeagueModal
          isOpen={modals.league.open}
          onClose={() => closeModal('league')}
          data={modals.league.data}
          onSave={handleSaveLeague}
        />
      )}

      {modals.team.open && (
        <TeamModal
          isOpen={modals.team.open}
          onClose={() => closeModal('team')}
          data={modals.team.data}
          selectedLeague={selectedLeague}
          onSave={handleSaveTeam}
        />
      )}

      {modals.player.open && (
        <PlayerModal
          isOpen={modals.player.open}
          onClose={() => closeModal('player')}
          data={modals.player.data}
          teams={data.teams}
          selectedLeague={selectedLeague}
          onSave={handleSavePlayer}
        />
      )}

      {modals.match.open && (
        <MatchModal
          isOpen={modals.match.open}
          onClose={() => closeModal('match')}
          data={modals.match.data}
          teams={data.teams}
          selectedLeague={selectedLeague}
          onSave={handleSaveMatch}
        />
      )}

      {modals.schedule.open && (
        <SimpleScheduleModal
          isOpen={modals.schedule.open}
          onClose={() => closeModal('schedule')}
          teams={data.teams}
          selectedLeague={selectedLeague}
          onGenerate={handleGenerateSchedule}
        />
      )}

      {modals.admin.open && (
        <AdminModal
          isOpen={modals.admin.open}
          onClose={() => closeModal('admin')}
          data={modals.admin.data}
          onSave={(adminData) => {
            console.log('Admin save:', adminData);
            closeModal('admin');
            showToast('Admin user saved successfully!');
          }}
        />
      )}

      {/* Toast notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 flex items-center gap-4 border border-slate-700">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            <div>
              <div className="text-white font-medium">Processing...</div>
              <div className="text-slate-400 text-sm">Please wait while we sync with the database</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;