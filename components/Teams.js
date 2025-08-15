// components/Teams.js - Complete Enhanced Version with Error Handling
import React, { useState } from 'react';
import { 
  Users, Trophy, Target, Plus, Edit, Trash2, 
  User, Award, Calendar, MapPin, Camera,
  ChevronDown, ChevronRight, Search, Filter,
  Zap, Star, Shield, Clock, AlertCircle
} from 'lucide-react';
import { CircularImageUpload } from './ImageUpload';

const Teams = ({ 
  teams = [], 
  players = [], 
  selectedLeague, 
  isLoggedIn,
  onRefresh,
  onCreateTeam,
  onEditTeam,
  onDeleteTeam,
  onCreatePlayer,
  onEditPlayer,
  onDeletePlayer
}) => {
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [showPlayerForm, setShowPlayerForm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    number: '',
    position: 'Forward',
    photo: '',
    teamId: ''
  });

  // Debug: Log all props to help identify issues
  React.useEffect(() => {
    console.log('Teams component props:', {
      teamsCount: teams?.length || 0,
      playersCount: players?.length || 0,
      selectedLeague,
      isLoggedIn,
      onRefresh: typeof onRefresh,
      onCreateTeam: typeof onCreateTeam,
      onEditTeam: typeof onEditTeam,
      onDeleteTeam: typeof onDeleteTeam,
      onCreatePlayer: typeof onCreatePlayer,
      onEditPlayer: typeof onEditPlayer,
      onDeletePlayer: typeof onDeletePlayer
    });
  }, [teams, players, selectedLeague, isLoggedIn, onRefresh, onCreateTeam, onEditTeam, onDeleteTeam, onCreatePlayer, onEditPlayer, onDeletePlayer]);

  // ✅ SAFE: Properly group players by team with error handling
  const getPlayersForTeam = (teamId) => {
    try {
      if (!players || !Array.isArray(players)) {
        console.warn('Players is not an array:', players);
        return [];
      }
      
      return players.filter(player => {
        if (!player) return false;
        
        // Handle different possible team reference formats
        const playerTeamId = player.team?._id || player.team || player.teamId;
        return playerTeamId === teamId;
      });
    } catch (error) {
      console.error('Error filtering players for team:', error);
      return [];
    }
  };

  // Filter and sort teams with error handling
  const filteredTeams = React.useMemo(() => {
    try {
      if (!teams || !Array.isArray(teams)) {
        console.warn('Teams is not an array:', teams);
        return [];
      }

      return teams
        .filter(team => {
          if (!team || !team.name) return false;
          return team.name.toLowerCase().includes(searchTerm.toLowerCase());
        })
        .sort((a, b) => {
          try {
            switch (sortBy) {
              case 'name':
                return (a.name || '').localeCompare(b.name || '');
              case 'players':
                return getPlayersForTeam(b._id).length - getPlayersForTeam(a._id).length;
              case 'goals':
                const aGoals = getPlayersForTeam(a._id).reduce((sum, p) => sum + (p.stats?.goals || 0), 0);
                const bGoals = getPlayersForTeam(b._id).reduce((sum, p) => sum + (p.stats?.goals || 0), 0);
                return bGoals - aGoals;
              default:
                return 0;
            }
          } catch (error) {
            console.error('Error sorting teams:', error);
            return 0;
          }
        });
    } catch (error) {
      console.error('Error filtering teams:', error);
      return [];
    }
  }, [teams, searchTerm, sortBy, players]);

  // Safe handler functions with error checking
  const safeHandleEditTeam = (team) => {
    try {
      if (onEditTeam && typeof onEditTeam === 'function') {
        console.log('✅ Calling onEditTeam with:', team);
        onEditTeam(team);
      } else {
        console.error('❌ onEditTeam is not a function:', typeof onEditTeam);
        setError('Edit team function is not available');
      }
    } catch (error) {
      console.error('Error calling onEditTeam:', error);
      setError('Failed to edit team: ' + error.message);
    }
  };

  const safeHandleDeleteTeam = (teamId) => {
    try {
      if (onDeleteTeam && typeof onDeleteTeam === 'function') {
        if (confirm('Are you sure you want to delete this team?')) {
          console.log('✅ Calling onDeleteTeam with:', teamId);
          onDeleteTeam(teamId);
        }
      } else {
        console.error('❌ onDeleteTeam is not a function:', typeof onDeleteTeam);
        setError('Delete team function is not available');
      }
    } catch (error) {
      console.error('Error calling onDeleteTeam:', error);
      setError('Failed to delete team: ' + error.message);
    }
  };

  const safeHandleCreateTeam = () => {
    try {
      if (onCreateTeam && typeof onCreateTeam === 'function') {
        console.log('✅ Calling onCreateTeam');
        onCreateTeam();
      } else {
        console.error('❌ onCreateTeam is not a function:', typeof onCreateTeam);
        setError('Create team function is not available');
      }
    } catch (error) {
      console.error('Error calling onCreateTeam:', error);
      setError('Failed to create team: ' + error.message);
    }
  };

  const safeHandleEditPlayer = (player) => {
    try {
      if (onEditPlayer && typeof onEditPlayer === 'function') {
        console.log('✅ Calling onEditPlayer with:', player);
        onEditPlayer(player);
      } else {
        console.error('❌ onEditPlayer is not a function:', typeof onEditPlayer);
        setError('Edit player function is not available');
      }
    } catch (error) {
      console.error('Error calling onEditPlayer:', error);
      setError('Failed to edit player: ' + error.message);
    }
  };

  const safeHandleDeletePlayer = (playerId) => {
    try {
      if (onDeletePlayer && typeof onDeletePlayer === 'function') {
        if (confirm('Are you sure you want to delete this player?')) {
          console.log('✅ Calling onDeletePlayer with:', playerId);
          onDeletePlayer(playerId);
        }
      } else {
        console.error('❌ onDeletePlayer is not a function:', typeof onDeletePlayer);
        setError('Delete player function is not available');
      }
    } catch (error) {
      console.error('Error calling onDeletePlayer:', error);
      setError('Failed to delete player: ' + error.message);
    }
  };

  // Handle player creation with enhanced error handling
  const handleCreatePlayer = async (teamId) => {
    if (!newPlayer.name || !newPlayer.number) {
      setError('Please fill in player name and number');
      return;
    }

    if (!onCreatePlayer || typeof onCreatePlayer !== 'function') {
      setError('Create player function is not available');
      return;
    }

    const playerData = {
      ...newPlayer,
      teamId: teamId,
      leagueId: selectedLeague,
      stats: {
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        appearances: 0,
        minutesPlayed: 0
      }
    };

    try {
      setIsLoading(true);
      setError('');
      
      console.log('✅ Creating player with data:', playerData);
      await onCreatePlayer(playerData);
      
      // Reset form
      setNewPlayer({
        name: '',
        number: '',
        position: 'Forward',
        photo: '',
        teamId: ''
      });
      setShowPlayerForm(null);
      
      if (onRefresh && typeof onRefresh === 'function') {
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to create player:', error);
      setError('Failed to create player: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle team expansion
  const toggleTeamExpansion = (teamId) => {
    setExpandedTeam(expandedTeam === teamId ? null : teamId);
  };

  // Position options
  const positions = [
    'Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Winger'
  ];

  // Get team statistics with error handling
  const getTeamStats = (teamId) => {
    try {
      const teamPlayers = getPlayersForTeam(teamId);
      return {
        totalPlayers: teamPlayers.length,
        totalGoals: teamPlayers.reduce((sum, p) => sum + (p.stats?.goals || 0), 0),
        totalAssists: teamPlayers.reduce((sum, p) => sum + (p.stats?.assists || 0), 0),
        topScorer: teamPlayers.reduce((top, p) => 
          (p.stats?.goals || 0) > (top.stats?.goals || 0) ? p : top, 
          { stats: { goals: 0 }, name: 'None' }
        )
      };
    } catch (error) {
      console.error('Error calculating team stats:', error);
      return {
        totalPlayers: 0,
        totalGoals: 0,
        totalAssists: 0,
        topScorer: { stats: { goals: 0 }, name: 'None' }
      };
    }
  };

  // Clear error after 5 seconds
  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (!teams || teams.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Teams Found</h3>
        <p className="text-slate-400 mb-6">
          {selectedLeague ? 'Create teams to get started with your league' : 'Select a league first'}
        </p>
        {isLoggedIn && selectedLeague && (
          <button
            onClick={safeHandleCreateTeam}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5 mr-2 inline" />
            Create First Team
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Error</span>
          </div>
          <p className="text-red-300 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Teams & Players</h2>
          <p className="text-slate-400">
            {teams.length} team{teams.length !== 1 ? 's' : ''} • {players.length} player{players.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isLoggedIn && (
          <button
            onClick={safeHandleCreateTeam}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5 mr-2 inline" />
            Add Team
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            >
              <option value="name">Sort by Name</option>
              <option value="players">Sort by Players</option>
              <option value="goals">Sort by Goals</option>
            </select>
          </div>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="space-y-4">
        {filteredTeams.map(team => {
          const teamPlayers = getPlayersForTeam(team._id);
          const teamStats = getTeamStats(team._id);
          const isExpanded = expandedTeam === team._id;

          return (
            <div key={team._id} className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
              
              {/* Team Header */}
              <div 
                className="p-6 cursor-pointer hover:bg-slate-700/30 transition-colors"
                onClick={() => toggleTeamExpansion(team._id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-700 rounded-xl flex items-center justify-center overflow-hidden">
                      {team.logo ? (
                        <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
                      ) : (
                        <Shield className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                        {team.name}
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        )}
                      </h3>
                      <p className="text-slate-400">{team.description || 'No description'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Team Stats */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-blue-400">{teamStats.totalPlayers}</div>
                        <div className="text-xs text-slate-400">Players</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-green-400">{teamStats.totalGoals}</div>
                        <div className="text-xs text-slate-400">Goals</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-orange-400">{teamStats.totalAssists}</div>
                        <div className="text-xs text-slate-400">Assists</div>
                      </div>
                    </div>

                    {/* Admin Actions */}
                    {isLoggedIn && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            safeHandleEditTeam(team);
                          }}
                          className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                          title="Edit Team"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            safeHandleDeleteTeam(team._id);
                          }}
                          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                          title="Delete Team"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content - Players */}
              {isExpanded && (
                <div className="border-t border-slate-700 p-6">
                  
                  {/* Add Player Button */}
                  {isLoggedIn && (
                    <div className="mb-6">
                      {showPlayerForm === team._id ? (
                        <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
                          <h4 className="text-lg font-semibold text-white">Add New Player</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">Player Name *</label>
                              <input
                                type="text"
                                value={newPlayer.name}
                                onChange={(e) => setNewPlayer(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                                placeholder="Enter player name"
                                disabled={isLoading}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">Jersey Number *</label>
                              <input
                                type="number"
                                value={newPlayer.number}
                                onChange={(e) => setNewPlayer(prev => ({ ...prev, number: e.target.value }))}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                                placeholder="1-99"
                                min="1"
                                max="99"
                                disabled={isLoading}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">Position</label>
                              <select
                                value={newPlayer.position}
                                onChange={(e) => setNewPlayer(prev => ({ ...prev, position: e.target.value }))}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                                disabled={isLoading}
                              >
                                {positions.map(pos => (
                                  <option key={pos} value={pos}>{pos}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">Player Photo</label>
                              <CircularImageUpload
                                value={newPlayer.photo}
                                onChange={(url) => setNewPlayer(prev => ({ ...prev, photo: url }))}
                                type="player"
                                size="w-16 h-16"
                                disabled={isLoading}
                              />
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={() => handleCreatePlayer(team._id)}
                              disabled={isLoading}
                              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                              {isLoading ? 'Adding...' : 'Add Player'}
                            </button>
                            <button
                              onClick={() => {
                                setShowPlayerForm(null);
                                setNewPlayer({ name: '', number: '', position: 'Forward', photo: '', teamId: '' });
                                setError('');
                              }}
                              disabled={isLoading}
                              className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowPlayerForm(team._id)}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          <Plus className="w-4 h-4 mr-2 inline" />
                          Add Player to {team.name}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Players List */}
                  {teamPlayers.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No players in this team yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {teamPlayers.map(player => (
                        <div key={player._id} className="bg-slate-700/30 rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center overflow-hidden">
                              {player.photo ? (
                                <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-6 h-6 text-slate-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h5 className="font-semibold text-white">{player.name}</h5>
                              <p className="text-sm text-slate-400">
                                #{player.number} • {player.position}
                              </p>
                            </div>
                            {isLoggedIn && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => safeHandleEditPlayer(player)}
                                  className="p-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                                  title="Edit Player"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => safeHandleDeletePlayer(player._id)}
                                  className="p-1 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                                  title="Delete Player"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Player Stats */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="text-center">
                              <div className="font-bold text-green-400">{player.stats?.goals || 0}</div>
                              <div className="text-slate-400">Goals</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-blue-400">{player.stats?.assists || 0}</div>
                              <div className="text-slate-400">Assists</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-yellow-400">{player.stats?.yellowCards || 0}</div>
                              <div className="text-slate-400">Yellow</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-red-400">{player.stats?.redCards || 0}</div>
                              <div className="text-slate-400">Red</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Teams;