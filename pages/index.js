// pages/index.js - Complete Fixed Version with All Handlers
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

import { X } from 'lucide-react';

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

  // Modal State
  const [modals, setModals] = useState({
    league: { open: false, data: null },
    team: { open: false, data: null },
    player: { open: false, data: null },
    match: { open: false, data: null },
    schedule: { open: false, data: null }
  });

  // Navigation items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠', alwaysShow: true },
    { id: 'schedule', label: 'Schedule', icon: '📅', requiresLeague: true },
    { id: 'table', label: 'League Table', icon: '📊', requiresLeague: true },
    { id: 'teams', label: 'Teams', icon: '👥', requiresLeague: true },
    { id: 'statistics', label: 'Statistics', icon: '📈', requiresLeague: true },
    { id: 'live', label: 'Live', icon: '🔴', requiresLeague: true, requiresLive: true }
  ];

  // Show toast function
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  // Make showToast globally available
  useEffect(() => {
    window.showToast = showToast;
    return () => {
      delete window.showToast;
    };
  }, [showToast]);

  // API Functions
  const apiCall = useCallback(async (endpoint, options = {}) => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      
      const token = localStorage.getItem('adminToken');
      if (token && (options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE')) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers,
        ...options
      });

      if (response.status === 401) {
        handleLogout();
        return null;
      }
      
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return null;
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      return null;
    }
  }, []);

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

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    showToast('Logged out successfully', 'info');
  };

  // Modal Functions
  const openModal = (type, data = null) => {
    setModals(prev => ({
      ...prev,
      [type]: { open: true, data }
    }));
  };

  const closeModal = (type) => {
    setModals(prev => ({
      ...prev,
      [type]: { open: false, data: null }
    }));
  };

  // ✅ OPTIMIZED: Load league data with all matches and players
  const loadLeagueData = useCallback(async (leagueId, silent = false) => {
    if (!leagueId) {
      setLeagueData(null);
      return;
    }

    setIsLoading(true);
    
    try {
      console.log(`📄 Loading league data for: ${leagueId}`);
      
      // Load data in parallel for better performance
      const [summary, matches, teams, players] = await Promise.all([
        apiCall(`/leagues/${leagueId}/summary`),
        apiCall(`/matches?league=${leagueId}`), // Load ALL matches
        apiCall(`/teams?leagueId=${leagueId}`),
        apiCall(`/players?leagueId=${leagueId}`) // ✅ Load players for live match manager
      ]);

      if (summary) {
        const leagueDataObj = {
          league: summary.league,
          teams: teams || summary.teams || [],
          players: players || [], // ✅ Include players
          matches: matches || [], // All matches loaded
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
        console.log(`✅ League data loaded: ${matches?.length || 0} matches, ${teams?.length || 0} teams, ${players?.length || 0} players`);
      }
    } catch (error) {
      console.error('Failed to load league data:', error);
      showToast('Failed to load league data', 'error');
    } finally {
      setIsLoading(false);
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

  // ✅ FIXED: Team Management Handlers
  const handleCreateTeam = () => {
    if (!isLoggedIn) {
      showToast('Please login to create teams', 'warning');
      return;
    }
    console.log('✅ Create team called');
    openModal('team', null);
  };

  const handleEditTeam = (team) => {
    if (!isLoggedIn) {
      showToast('Please login to edit teams', 'warning');
      return;
    }
    console.log('✅ Edit team called:', team);
    openModal('team', team);
  };

  const handleDeleteTeam = async (teamId) => {
    if (!isLoggedIn) {
      showToast('Please login to delete teams', 'warning');
      return;
    }

    if (!confirm('Are you sure you want to delete this team?')) return;

    try {
      await apiCall(`/teams?id=${teamId}`, { method: 'DELETE' });
      await loadLeagueData(selectedLeague);
      showToast('Team deleted successfully');
    } catch (error) {
      showToast('Failed to delete team: ' + error.message, 'error');
    }
  };

  // ✅ FIXED: Player Management Handlers
  const handleCreatePlayer = async (playerData) => {
    if (!isLoggedIn) {
      showToast('Please login to create players', 'warning');
      return;
    }

    try {
      console.log('✅ Creating player:', playerData);
      
      // Format player data correctly for API
      const payload = {
        name: playerData.name,
        number: playerData.number,
        position: playerData.position,
        photo: playerData.photo,
        teamId: playerData.teamId,
        leagueId: selectedLeague,
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
      console.error('Failed to create player:', error);
      showToast('Failed to create player: ' + error.message, 'error');
      throw error; // Re-throw so Teams component can handle it
    }
  };

  const handleEditPlayer = (player) => {
    if (!isLoggedIn) {
      showToast('Please login to edit players', 'warning');
      return;
    }
    console.log('✅ Edit player called:', player);
    openModal('player', player);
  };

  const handleDeletePlayer = async (playerId) => {
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
  };

  // Admin Functions
  const handleSaveLeague = async (formData) => {
    try {
      const method = formData._id ? 'PUT' : 'POST';
      await apiCall('/leagues', {
        method,
        body: JSON.stringify(formData)
      });

      await loadLeagues();
      closeModal('league');
      showToast(formData._id ? 'League updated!' : 'League created!');
    } catch (error) {
      showToast('Failed to save league', 'error');
    }
  };

  const handleSaveTeam = async (formData) => {
    try {
      const method = formData._id ? 'PUT' : 'POST';
      const payload = formData._id ? 
        { id: formData._id, ...formData } : 
        { ...formData, leagueId: selectedLeague };
      
      await apiCall('/teams', {
        method,
        body: JSON.stringify(payload)
      });

      await loadLeagueData(selectedLeague);
      closeModal('team');
      showToast(formData._id ? 'Team updated!' : 'Team created!');
    } catch (error) {
      showToast('Failed to save team', 'error');
    }
  };

  const handleSavePlayer = async (formData) => {
    try {
      const method = formData._id ? 'PUT' : 'POST';
      const payload = formData._id ? 
        { id: formData._id, ...formData } : 
        { ...formData, leagueId: selectedLeague };
      
      await apiCall('/players', {
        method,
        body: JSON.stringify(payload)
      });

      await loadLeagueData(selectedLeague);
      closeModal('player');
      showToast(formData._id ? 'Player updated!' : 'Player created!');
    } catch (error) {
      showToast('Failed to save player', 'error');
    }
  };

  const handleSaveMatch = async (formData) => {
    try {
      const method = formData._id ? 'PUT' : 'POST';
      const payload = formData._id ? 
        { id: formData._id, ...formData } : 
        { ...formData, leagueId: selectedLeague };
      
      await apiCall('/matches', {
        method,
        body: JSON.stringify(payload)
      });

      await loadLeagueData(selectedLeague);
      closeModal('match');
      showToast(formData._id ? 'Match updated!' : 'Match created!');
    } catch (error) {
      showToast('Failed to save match', 'error');
    }
  };

  // Schedule generation handler
  const handleScheduleGenerated = async (result) => {
    try {
      if (result.success) {
        await loadLeagueData(selectedLeague);
        closeModal('schedule');
        
        if (result.cleared) {
          showToast(`🗑️ Cleared ${result.matchesDeleted || 0} matches!`, 'success');
        } else {
          const matchCount = result.matchesCreated || 0;
          showToast(`✅ Generated ${matchCount} matches successfully!`, 'success');
        }
      } else {
        showToast('Failed to generate schedule', 'error');
      }
    } catch (error) {
      showToast('Failed to process schedule generation', 'error');
    }
  };

  // Admin actions for matches
  const handleEditMatch = (match) => {
    if (!isLoggedIn) {
      showToast('Please login to edit matches', 'warning');
      return;
    }
    openModal('match', match);
  };

  const handleDeleteMatch = async (matchId) => {
    if (!isLoggedIn) {
      showToast('Please login to delete matches', 'warning');
      return;
    }

    try {
      await apiCall(`/matches?id=${matchId}`, { method: 'DELETE' });
      await loadLeagueData(selectedLeague);
      showToast('Match deleted successfully');
    } catch (error) {
      showToast('Failed to delete match', 'error');
    }
  };

  const handleStartLiveMatch = async (matchId) => {
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
  };

  const handleDeleteItem = async (type, id) => {
    if (!isLoggedIn) {
      showToast('Please login to delete items', 'warning');
      return;
    }

    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      await apiCall(`/${type}s?id=${id}`, { method: 'DELETE' });
      
      if (type === 'league') {
        await loadLeagues();
        if (selectedLeague === id) {
          setSelectedLeague('');
          setLeagueData(null);
        }
      } else {
        await loadLeagueData(selectedLeague);
      }
      
      showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted!`);
    } catch (error) {
      showToast(`Failed to delete ${type}`, 'error');
    }
  };

  // Navigation
  const handleSectionChange = (section) => {
    setActiveSection(section);
    
    // Load additional data if needed for new section
    if (selectedLeague) {
      setTimeout(() => {
        loadLeagueData(selectedLeague);
      }, 100);
    }
  };

  const handleLeagueChange = (leagueId) => {
    setSelectedLeague(leagueId);
    if (leagueId) {
      loadLeagueData(leagueId);
    } else {
      setLeagueData(null);
    }
  };

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      
      // Check for existing auth
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
  }, []);

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
          });
        }
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [leagueData?.liveMatches, activeSection, selectedLeague, apiCall]);

  // ✅ FIXED: Render sections with ALL required props
  const renderCurrentSection = () => {
    const commonProps = {
      teams: leagueData?.teams || [],
      players: leagueData?.players || [], // ✅ Include players
      matches: leagueData?.matches || [],
      liveMatches: leagueData?.liveMatches || [],
      selectedLeague,
      onRefresh: () => loadLeagueData(selectedLeague),
      isLoggedIn, // Pass admin status to all components
      onEditMatch: handleEditMatch,
      onDeleteMatch: handleDeleteMatch,
      onStartLiveMatch: handleStartLiveMatch
    };

    switch (activeSection) {
      case 'dashboard':
        return <Dashboard leagueData={leagueData} isLoading={isLoading} />;
      case 'schedule':
        return <Schedule {...commonProps} />; // ✅ Now includes players
      case 'table':
        return <LeagueTable {...commonProps} />;
      case 'teams':
        return (
          <Teams 
            {...commonProps}
            // ✅ CRITICAL: Add all the missing team/player handlers
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
        // Admin quick actions in header
        onCreateLeague={() => openModal('league')}
        onCreateTeam={() => openModal('team')}
        onCreatePlayer={() => openModal('player')}
        onGenerateSchedule={() => openModal('schedule')}
      >
        {renderCurrentSection()}
      </Layout>

      {/* Admin Login Modal */}
      <AdminLogin
        isOpen={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
        onLogin={handleLogin}
        isLoading={isLoginLoading}
      />

      {/* Essential Admin Modals */}
      <LeagueModal
        isOpen={modals.league.open}
        onClose={() => closeModal('league')}
        data={modals.league.data}
        onSave={handleSaveLeague}
      />

      <TeamModal
        isOpen={modals.team.open}
        onClose={() => closeModal('team')}
        data={modals.team.data}
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
        data={modals.match.data}
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

      {/* Toast Notifications */}
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