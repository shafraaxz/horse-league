// pages/index.js - FIXED VERSION with proper modal data passing
import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import Dashboard from '../components/Dashboard';
import Schedule from '../components/Schedule';
import LeagueTable from '../components/LeagueTable';
import Teams from '../components/Teams';
import Statistics from '../components/Statistics';

// Import admin components
import AdminLogin from '../components/AdminLogin';
import LeagueModal from '../components/admin/LeagueModal';
import TeamModal from '../components/admin/TeamModal';
import PlayerModal from '../components/admin/PlayerModal';
import MatchModal from '../components/admin/MatchModal';
import ScheduleGenerator from '../components/ScheduleGenerator';

import { X, Key, Shield, UserPlus, Settings, Save, Eye, EyeOff, AlertCircle, CheckCircle, Edit, Trash2, Plus, Calendar, MapPin } from 'lucide-react';

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

  // ✅ FIXED: Enhanced Modal State Management
  const [modals, setModals] = useState({
    league: { open: false, data: null },
    team: { open: false, data: null },
    player: { open: false, data: null },
    match: { open: false, data: null },
    schedule: { open: false, data: null },
    admin: { open: false, data: null },
    passwordChange: { open: false, data: null }
  });

  // Navigation items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠', alwaysShow: true },
    { id: 'schedule', label: 'Schedule', icon: '📅', requiresLeague: true },
    { id: 'table', label: 'League Table', icon: '📊', requiresLeague: true },
    { id: 'teams', label: 'Teams', icon: '👥', requiresLeague: true },
    { id: 'statistics', label: 'Statistics', icon: '📈', requiresLeague: true },
    { id: 'live', label: 'Live', icon: '🔴', requiresLeague: true, requiresLive: true },
    { id: 'admin', label: 'Admin Users', icon: '🛡️', requiresAuth: true }
  ];

  // Show toast function
  const showToast = useCallback((message, type = 'success') => {
    console.log(`📢 Toast: [${type.toUpperCase()}] ${message}`);
    setToast({ message, type });
  }, []);

  // API Functions
  const apiCall = useCallback(async (endpoint, options = {}) => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      
      const token = localStorage.getItem('adminToken');
      if (token && (options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE')) {
        headers.Authorization = `Bearer ${token}`;
      }

      console.log(`🌐 API Call: ${options.method || 'GET'} ${API_BASE}${endpoint}`);

      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers,
        ...options
      });

      if (response.status === 401) {
        console.log('🔒 Authentication failed');
        handleLogout();
        return null;
      }
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ API Success: ${endpoint}`, data);
        return data;
      } else {
        const error = await response.json();
        console.error(`❌ API Error: ${endpoint}`, error);
        throw new Error(error.error || 'API call failed');
      }
    } catch (error) {
      console.error(`💥 API Error for ${endpoint}:`, error);
      throw error;
    }
  }, []);

  // ✅ FIXED: Enhanced Modal Management
  const openModal = useCallback((type, data = null) => {
    console.log(`🔧 Opening ${type} modal with data:`, data);
    
    // Create a deep copy of the data to prevent reference issues
    const modalData = data ? JSON.parse(JSON.stringify(data)) : null;
    
    setModals(prev => ({
      ...prev,
      [type]: { 
        open: true, 
        data: modalData 
      }
    }));
    
    console.log(`✅ Modal ${type} opened with data:`, modalData);
  }, []);

  const closeModal = useCallback((type) => {
    console.log(`🔧 Closing ${type} modal`);
    setModals(prev => ({
      ...prev,
      [type]: { open: false, data: null }
    }));
  }, []);

  // ✅ FIXED: Enhanced Team Management Handlers
  const handleCreateTeam = useCallback(() => {
    if (!isLoggedIn) {
      showToast('Please login to create teams', 'warning');
      return;
    }
    
    if (!selectedLeague) {
      showToast('Please select a league first', 'warning');
      return;
    }
    
    console.log('✅ Creating new team for league:', selectedLeague);
    openModal('team', null); // null for create mode
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
    
    console.log('✅ Editing team:', team);
    openModal('team', team); // Pass team data for edit mode
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
      console.log('🗑️ Deleting team:', teamId);
      await apiCall(`/teams?id=${teamId}`, { method: 'DELETE' });
      await loadLeagueData(selectedLeague);
      showToast('Team deleted successfully');
    } catch (error) {
      console.error('Delete team error:', error);
      showToast('Failed to delete team: ' + error.message, 'error');
    }
  }, [isLoggedIn, selectedLeague, apiCall, showToast]);

  // ✅ FIXED: Enhanced Player Management
  const handleCreatePlayer = useCallback(async (playerData) => {
    if (!isLoggedIn) {
      showToast('Please login to create players', 'warning');
      return;
    }

    try {
      console.log('✅ Creating player:', playerData);
      
      // ✅ FIXED: Correct API payload structure
      const payload = {
        name: playerData.name,
        number: parseInt(playerData.number),
        position: playerData.position,
        photo: playerData.photo || '',
        team: playerData.teamId || playerData.team, // API expects 'team'
        league: selectedLeague, // API expects 'league'
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

      console.log('📤 Player API payload:', payload);

      await apiCall('/players', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      await loadLeagueData(selectedLeague);
      showToast('Player created successfully');
    } catch (error) {
      console.error('Failed to create player:', error);
      showToast('Failed to create player: ' + error.message, 'error');
      throw error;
    }
  }, [isLoggedIn, selectedLeague, apiCall, showToast]);

  const handleEditPlayer = useCallback((player) => {
    if (!isLoggedIn) {
      showToast('Please login to edit players', 'warning');
      return;
    }
    
    console.log('✅ Editing player:', player);
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

  // ✅ FIXED: Enhanced Save Handlers
  const handleSaveLeague = useCallback(async (formData) => {
    try {
      setIsLoading(true);
      console.log('💾 Saving league:', formData);
      
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
      console.error('Save league error:', error);
      showToast('Failed to save league: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [apiCall, closeModal, showToast]);

  const handleSaveTeam = useCallback(async (formData) => {
    try {
      setIsLoading(true);
      console.log('💾 Saving team:', formData);
      
      const method = formData._id ? 'PUT' : 'POST';
      
      // ✅ FIXED: Proper team payload structure
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

      console.log('📤 Team API payload:', payload);

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
      setIsLoading(false);
    }
  }, [selectedLeague, apiCall, closeModal, showToast]);

  const handleSavePlayer = useCallback(async (formData) => {
    try {
      setIsLoading(true);
      console.log('💾 Saving player:', formData);
      
      const method = formData._id ? 'PUT' : 'POST';
      
      // ✅ FIXED: Proper player payload structure
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

      console.log('📤 Player API payload:', payload);

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
      setIsLoading(false);
    }
  }, [selectedLeague, apiCall, closeModal, showToast]);

  const handleSaveMatch = useCallback(async (formData) => {
    try {
      setIsLoading(true);
      console.log('💾 Saving match:', formData);
      
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
      console.error('Save match error:', error);
      showToast('Failed to save match: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedLeague, apiCall, closeModal, showToast]);

  // Admin Login Function
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
      console.log(`📄 Loading league data for: ${leagueId}`);
      
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
          admins: [],
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
        console.log(`✅ League data loaded: ${matches?.length || 0} matches, ${teams?.length || 0} teams, ${players?.length || 0} players`);
      }
    } catch (error) {
      console.error('Failed to load league data:', error);
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
      console.error('Failed to load leagues:', error);
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
          showToast(`🗑️ Cleared ${result.matchesDeleted || 0} matches!`, 'success');
        } else {
          const matchCount = result.matchesCreated || result.data?.matchesCreated || 0;
          showToast(`✅ Generated ${matchCount} matches successfully!`, 'success');
        }
      } else {
        showToast('Failed to generate schedule', 'error');
      }
    } catch (error) {
      showToast('Failed to process schedule generation', 'error');
    }
  }, [selectedLeague, loadLeagueData, closeModal, showToast]);

  // Admin actions for matches
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
      
      const loadedLeagues = await loadLeagues();
      
      if (loadedLeagues.length > 0 && !selectedLeague) {
        const firstLeague = loadedLeagues[0];
        setSelectedLeague(firstLeague._id);
        await loadLeagueData(firstLeague._id);
      }
      
      setIsLoading(false);
    };

    initializeApp();
  }, []); // Empty dependency array

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
        return <Dashboard leagueData={leagueData} isLoading={isLoading} />;
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
      >
        {renderCurrentSection()}
      </Layout>

      {/* ✅ FIXED: Modals with proper data passing */}
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