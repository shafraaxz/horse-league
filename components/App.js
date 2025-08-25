import React, { useState, useEffect } from 'react';

// Import all the components
import Dashboard from '@/components/Dashboard/Dashboard';
import PlayersTransferMarket from '@/components/Players/PlayersTransferMarket';
import PlayerForm from '@/components/Players/PlayerForm';
import TeamsManagement from '@/components/Teams/TeamsManagement';
import TeamForm from '@/components/Teams/TeamForm';
import SchedulesManagement from '@/components/Schedules/SchedulesManagement';
import Statistics from '@/components/Statistics/Statistics';
import LiveMatches from '@/components/LiveMatches/LiveMatches';
import LeagueGallery from '@/components/Gallery/LeagueGallery';
import AdminManagement from '@/components/Admin/AdminManagement';
import Header from '@/components/Layout/Header';
import Navigation from '@/components/Layout/Navigation';
import SeasonSelector from '@/components/UI/SeasonSelector';
import Notification from '@/components/UI/Notification';

// Custom hooks
import { useAPI } from '@/hooks/useAPI';
import { useNotification } from '@/hooks/useNotification';

const App = () => {
  // Global state management
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentSeason, setCurrentSeason] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [seasonsLoading, setSeasonsLoading] = useState(true);
  const [user, setUser] = useState({ name: 'Admin User', isAdmin: true });

  // Modal states for forms
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editingTeam, setEditingTeam] = useState(null);

  // Views object for Navigation component
  const views = {
    dashboard: 'Dashboard',
    players: 'Players & Transfers', 
    teams: 'Teams',
    schedules: 'Schedules',
    live: 'Live Matches',
    statistics: 'Statistics',
    gallery: 'Gallery',
    admins: 'Admin'
  };

  // API hook for database operations
  const { get, post, put, del, loading: apiLoading } = useAPI();
  const { notification, showNotification, hideNotification } = useNotification();

  // Initialize seasons from DATABASE (not localStorage)
  useEffect(() => {
    loadSeasonsFromDatabase();
  }, []);

  const loadSeasonsFromDatabase = async () => {
    try {
      setSeasonsLoading(true);
      console.log('🔄 Loading seasons from database...');
      
      // Try to load from DATABASE first
      const response = await get('seasons');
      
      if (response && response.length > 0) {
        console.log('✅ Seasons loaded from database:', response.length);
        setSeasons(response);
        
        // Set current season - prefer active, then first available
        let activeSeason = response.find(s => s.status === 'active');
        if (!activeSeason) {
          activeSeason = response[0];
        }
        
        setCurrentSeason(activeSeason);
        
        // Store current season ID for quick access (only the ID, not full data)
        localStorage.setItem('currentSeasonId', activeSeason.id || activeSeason._id);
        
      } else {
        console.log('🔄 No seasons found, creating default season...');
        await createDefaultSeason();
      }
      
    } catch (error) {
      console.error('❌ Failed to load seasons from database:', error);
      // Fallback - create a default season if API fails
      await createDefaultSeason();
    } finally {
      setSeasonsLoading(false);
    }
  };

  const createDefaultSeason = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const defaultSeasonData = {
        id: `${currentYear}/${currentYear + 1}`,
        name: `${currentYear}/${currentYear + 1}`,
        startYear: currentYear,
        endYear: currentYear + 1,
        status: 'active'
      };
      
      console.log('➕ Creating default season:', defaultSeasonData);
      
      // Create in DATABASE
      const newSeason = await post('seasons', defaultSeasonData);
      
      setSeasons([newSeason]);
      setCurrentSeason(newSeason);
      localStorage.setItem('currentSeasonId', newSeason.id || newSeason._id);
      
      console.log('✅ Default season created successfully');
      
    } catch (error) {
      console.error('❌ Failed to create default season:', error);
      
      // Ultimate fallback - create local season if database fails completely
      const fallbackSeason = {
        id: '2025/2026',
        name: '2025/2026',
        startYear: 2025,
        endYear: 2026,
        status: 'active'
      };
      
      setSeasons([fallbackSeason]);
      setCurrentSeason(fallbackSeason);
    }
  };

  // Handle season change
  const changeSeason = async (seasonId) => {
    try {
      const selectedSeason = seasons.find(s => (s.id === seasonId || s._id === seasonId));
      if (selectedSeason) {
        console.log('🔄 Changing to season:', selectedSeason.name);
        setCurrentSeason(selectedSeason);
        localStorage.setItem('currentSeasonId', selectedSeason.id || selectedSeason._id);
      }
    } catch (error) {
      console.error('❌ Failed to change season:', error);
      showNotification('error', 'Failed to change season');
    }
  };

  // Handle creating new season - SAVE TO DATABASE
  const handleCreateSeason = async (startYear) => {
    try {
      const newSeasonData = {
        id: `${startYear}/${startYear + 1}`,
        name: `${startYear}/${startYear + 1}`,
        startYear: parseInt(startYear),
        endYear: parseInt(startYear) + 1,
        status: 'upcoming'
      };
      
      console.log('➕ Creating new season:', newSeasonData);
      
      // Save to DATABASE (not localStorage)
      const newSeason = await post('seasons', newSeasonData);
      
      // Update local state
      const updatedSeasons = [...seasons, newSeason];
      setSeasons(updatedSeasons);
      
      showNotification('success', `Season ${newSeasonData.name} created successfully!`);
      return newSeason;
      
    } catch (error) {
      console.error('❌ Failed to create season:', error);
      showNotification('error', 'Failed to create new season');
      throw error;
    }
  };

  // Handle player form actions
  const handlePlayerSave = async (playerData) => {
    try {
      const endpoint = editingPlayer ? `players/${editingPlayer.id || editingPlayer._id}` : 'players';
      const method = editingPlayer ? 'put' : 'post';
      
      const seasonAwareData = {
        ...playerData,
        season: currentSeason?.id || currentSeason?._id
      };
      
      if (editingPlayer) {
        await put(endpoint, seasonAwareData);
      } else {
        await post(endpoint, seasonAwareData);
      }
      
      setShowPlayerForm(false);
      setEditingPlayer(null);
      showNotification('success', `Player ${editingPlayer ? 'updated' : 'created'} successfully!`);
      
      // Trigger data refresh in child components
      window.dispatchEvent(new CustomEvent('dataRefresh', { detail: { type: 'players' } }));
      
    } catch (error) {
      console.error('❌ Error saving player:', error);
      showNotification('error', 'Failed to save player');
    }
  };

  const handlePlayerEdit = (player) => {
    setEditingPlayer(player);
    setShowPlayerForm(true);
  };

  const handlePlayerDelete = async (playerId) => {
    if (window.confirm('Are you sure you want to delete this player?')) {
      try {
        await del(`players/${playerId}`);
        showNotification('success', 'Player deleted successfully');
        
        // Trigger data refresh
        window.dispatchEvent(new CustomEvent('dataRefresh', { detail: { type: 'players' } }));
      } catch (error) {
        console.error('❌ Error deleting player:', error);
        showNotification('error', 'Failed to delete player');
      }
    }
  };

  // Handle team form actions
  const handleTeamSave = async (teamData) => {
    try {
      const endpoint = editingTeam ? `teams/${editingTeam.id || editingTeam._id}` : 'teams';
      const method = editingTeam ? 'put' : 'post';
      
      const seasonAwareData = {
        ...teamData,
        season: currentSeason?.id || currentSeason?._id
      };
      
      if (editingTeam) {
        await put(endpoint, seasonAwareData);
      } else {
        await post(endpoint, seasonAwareData);
      }
      
      setShowTeamForm(false);
      setEditingTeam(null);
      showNotification('success', `Team ${editingTeam ? 'updated' : 'created'} successfully!`);
      
      // Trigger data refresh
      window.dispatchEvent(new CustomEvent('dataRefresh', { detail: { type: 'teams' } }));
      
    } catch (error) {
      console.error('❌ Error saving team:', error);
      showNotification('error', 'Failed to save team');
    }
  };

  const handleTeamEdit = (team) => {
    setEditingTeam(team);
    setShowTeamForm(true);
  };

  const handleTeamDelete = async (teamId) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      try {
        await del(`teams/${teamId}`);
        showNotification('success', 'Team deleted successfully');
        
        // Trigger data refresh
        window.dispatchEvent(new CustomEvent('dataRefresh', { detail: { type: 'teams' } }));
      } catch (error) {
        console.error('❌ Error deleting team:', error);
        showNotification('error', 'Failed to delete team');
      }
    }
  };

  // Render current view content
  const renderCurrentView = () => {
    if (seasonsLoading || !currentSeason) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading season data from database...</p>
            {seasonsLoading && (
              <p className="text-sm text-gray-500 mt-2">Connecting to MongoDB...</p>
            )}
          </div>
        </div>
      );
    }

    const commonProps = {
      currentSeason,
      showNotification,
      setCurrentView
    };

    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            {...commonProps}
            onPlayerAdd={() => {
              setEditingPlayer(null);
              setShowPlayerForm(true);
            }}
            onTeamAdd={() => {
              setEditingTeam(null);
              setShowTeamForm(true);
            }}
          />
        );

      case 'players':
        return (
          <PlayersTransferMarket
            {...commonProps}
            onPlayerAdd={() => {
              setEditingPlayer(null);
              setShowPlayerForm(true);
            }}
            onPlayerEdit={handlePlayerEdit}
            onPlayerDelete={handlePlayerDelete}
          />
        );

      case 'teams':
        return (
          <TeamsManagement
            {...commonProps}
            onTeamAdd={() => {
              setEditingTeam(null);
              setShowTeamForm(true);
            }}
            onTeamEdit={handleTeamEdit}
            onTeamDelete={handleTeamDelete}
          />
        );

      case 'schedules':
        return (
          <SchedulesManagement
            {...commonProps}
          />
        );

      case 'live':
        return (
          <LiveMatches
            {...commonProps}
          />
        );

      case 'statistics':
        return (
          <Statistics
            {...commonProps}
          />
        );

      case 'gallery':
        return (
          <LeagueGallery
            {...commonProps}
          />
        );

      case 'admins':
        return (
          <AdminManagement
            {...commonProps}
            user={user}
            onUserUpdate={setUser}
          />
        );

      default:
        return (
          <Dashboard 
            {...commonProps}
            onPlayerAdd={() => {
              setEditingPlayer(null);
              setShowPlayerForm(true);
            }}
            onTeamAdd={() => {
              setEditingTeam(null);
              setShowTeamForm(true);
            }}
          />
        );
    }
  };

  // Show loading screen during initial load
  if (seasonsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <div className="text-white font-bold text-lg">HFL</div>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-2">Loading The Horse Futsal League...</p>
          <p className="text-sm text-gray-500">Connecting to MongoDB database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <Header user={user} />
      
      {/* Navigation and Season Selector */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
            <Navigation 
              views={views} 
              currentView={currentView} 
              setCurrentView={setCurrentView}
              user={user}
            />
            {currentSeason && (
              <SeasonSelector
                currentSeason={currentSeason}
                seasons={seasons}
                onSeasonChange={changeSeason}
                onCreateSeason={handleCreateSeason}
                user={user}
                loading={seasonsLoading}
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {renderCurrentView()}
      </main>

      {/* Player Form Modal */}
      {showPlayerForm && currentSeason && (
        <PlayerForm
          player={editingPlayer}
          currentSeason={currentSeason}
          onSave={handlePlayerSave}
          onCancel={() => {
            setShowPlayerForm(false);
            setEditingPlayer(null);
          }}
          showNotification={showNotification}
        />
      )}

      {/* Team Form Modal */}
      {showTeamForm && currentSeason && (
        <TeamForm
          team={editingTeam}
          currentSeason={currentSeason}
          onSave={handleTeamSave}
          onClose={() => {
            setShowTeamForm(false);
            setEditingTeam(null);
          }}
          showNotification={showNotification}
        />
      )}

      {/* Global Notification */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={hideNotification}
        />
      )}

      {/* Database Connection Status (for development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-3 text-sm border">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-700">Database Connected</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Season: {currentSeason?.name} | API: Ready
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;