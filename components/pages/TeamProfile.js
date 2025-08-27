// components/pages/TeamProfile.js - Fixed with edit options and proper navigation
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Trophy, 
  Calendar, 
  BarChart, 
  Plus, 
  Edit, 
  Trash2,
  Target,
  Shield,
  Clock,
  MapPin,
  User,
  ArrowLeft,
  RefreshCw,
  Star,
  Award,
  TrendingUp,
  Activity,
  Eye,
  MoreVertical,
  Settings,
  UserPlus,
  X,
  Check
} from 'lucide-react';

const TeamProfile = ({ teamId, leagueId, onNavigate, onBack }) => {
  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPlayerMenu, setShowPlayerMenu] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(null);

  // Get current user for permissions
  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
  
  // Check permissions
  const canEditTeam = currentUser && (
    currentUser.role === 'super_admin' ||
    currentUser.role === 'league_admin' ||
    currentUser.assignedTeams?.includes(teamId) ||
    currentUser.permissions?.canManageTeams
  );

  useEffect(() => {
    if (teamId) {
      loadTeamData();
    }
  }, [teamId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowPlayerMenu(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  const showMessage = (message, type = 'success') => {
    if (type === 'success') {
      setSuccess(message);
      setError('');
      setTimeout(() => setSuccess(''), 5000);
    } else {
      setError(message);
      setSuccess('');
      setTimeout(() => setError(''), 8000);
    }
  };

  const loadTeamData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Fetch team details
      console.log('📄 Fetching team details for ID:', teamId);
      const teamResponse = await fetch(`/api/teams/${teamId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (teamResponse.ok) {
        const teamData = await teamResponse.json();
        console.log('✅ Team data received:', teamData);
        setTeam(teamData.data || teamData.team || teamData);
      } else {
        console.error('❌ Failed to fetch team:', teamResponse.status);
        setError('Failed to load team information');
      }

      // Fetch team players
      console.log('📄 Fetching players for team:', teamId);
      const playersResponse = await fetch(`/api/teams/${teamId}/players`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (playersResponse.ok) {
        const playersData = await playersResponse.json();
        console.log('✅ Players data received:', playersData);
        setPlayers(playersData.data || playersData.players || []);
      } else {
        console.log('⚠️ Players endpoint not available, trying alternative');
        try {
          const allPlayersResponse = await fetch('/api/players', {
            headers: getAuthHeaders()
          });
          if (allPlayersResponse.ok) {
            const allPlayersData = await allPlayersResponse.json();
            const teamPlayers = (allPlayersData.data || []).filter(
              player => player.currentTeam === teamId || player.team === teamId
            );
            setPlayers(teamPlayers);
          }
        } catch (err) {
          console.error('Error fetching players:', err);
        }
      }

      // Fetch team matches (simplified for now)
      try {
        const allMatchesResponse = await fetch('/api/matches', {
          headers: getAuthHeaders()
        });
        if (allMatchesResponse.ok) {
          const allMatchesData = await allMatchesResponse.json();
          const allMatches = allMatchesData.data || [];
          const teamMatches = allMatches.filter(match => 
            match.homeTeam?._id === teamId || 
            match.awayTeam?._id === teamId
          );
          setMatches(teamMatches);
        }
      } catch (err) {
        console.error('Error fetching matches:', err);
      }

    } catch (error) {
      console.error('❌ Error loading team data:', error);
      setError('Failed to load team data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerAction = (action, player, event) => {
    event.stopPropagation();
    setShowPlayerMenu(null);
    
    switch (action) {
      case 'edit':
        setEditingPlayer(player);
        break;
      case 'view':
        // Navigate to player profile
        if (onNavigate) {
          onNavigate('player-profile', { playerId: player._id, teamId });
        }
        break;
      case 'delete':
        handleDeletePlayer(player);
        break;
      default:
        break;
    }
  };

  const handleDeletePlayer = async (player) => {
    if (!confirm(`Remove ${player.name} from the team? This action can be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/players/${player._id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...player,
          currentTeam: null,
          team: null
        })
      });

      if (response.ok) {
        setPlayers(prev => prev.filter(p => p._id !== player._id));
        showMessage(`${player.name} removed from team successfully`);
      } else {
        throw new Error('Failed to remove player');
      }
    } catch (error) {
      console.error('Error removing player:', error);
      showMessage('Failed to remove player from team', 'error');
    }
  };

  const handleAddPlayer = () => {
    if (onNavigate) {
      onNavigate('player-create', { teamId, returnTo: 'team-profile' });
    }
  };

  const handleEditTeam = () => {
    if (onNavigate) {
      onNavigate('team-edit', { teamId });
    }
  };

  const calculateTeamStats = () => {
    const completedMatches = matches.filter(match => match.status === 'completed');
    let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;

    completedMatches.forEach(match => {
      const isHome = match.homeTeam?._id === teamId || match.homeTeam === teamId;
      const teamScore = isHome ? (match.homeScore || 0) : (match.awayScore || 0);
      const opponentScore = isHome ? (match.awayScore || 0) : (match.homeScore || 0);

      goalsFor += teamScore;
      goalsAgainst += opponentScore;

      if (teamScore > opponentScore) wins++;
      else if (teamScore === opponentScore) draws++;
      else losses++;
    });

    const totalPlayerGoals = players.reduce((sum, p) => sum + (p.statistics?.goals || 0), 0);
    const totalPlayerAssists = players.reduce((sum, p) => sum + (p.statistics?.assists || 0), 0);
    const averageAge = players.length > 0 ? 
      (players.reduce((sum, p) => sum + (p.age || 25), 0) / players.length).toFixed(1) : 0;

    return {
      matchesPlayed: completedMatches.length,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst,
      points: wins * 3 + draws,
      winPercentage: completedMatches.length > 0 ? ((wins / completedMatches.length) * 100).toFixed(1) : 0,
      totalPlayers: players.length,
      goalkeepers: players.filter(p => p.position === 'Goalkeeper').length,
      defenders: players.filter(p => p.position === 'Defender').length,
      midfielders: players.filter(p => p.position === 'Midfielder').length,
      forwards: players.filter(p => p.position === 'Forward').length,
      totalPlayerGoals,
      totalPlayerAssists,
      averageAge,
      topScorer: players.reduce((top, player) => 
        (player.statistics?.goals || 0) > (top.statistics?.goals || 0) ? player : top, 
        players[0] || null
      ),
      mostAssists: players.reduce((top, player) => 
        (player.statistics?.assists || 0) > (top.statistics?.assists || 0) ? player : top, 
        players[0] || null
      )
    };
  };

  const getPositionColor = (position) => {
    const colors = {
      'Goalkeeper': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Defender': 'bg-blue-100 text-blue-800 border-blue-200',
      'Midfielder': 'bg-green-100 text-green-800 border-green-200',
      'Forward': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[position] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getMatchResult = (match) => {
    if (match.status !== 'completed') {
      return { result: '-', color: 'bg-gray-100 text-gray-800' };
    }

    const isHome = match.homeTeam?._id === teamId || match.homeTeam === teamId;
    const teamScore = isHome ? (match.homeScore || 0) : (match.awayScore || 0);
    const opponentScore = isHome ? (match.awayScore || 0) : (match.homeScore || 0);

    if (teamScore > opponentScore) return { result: 'W', color: 'bg-green-100 text-green-800' };
    if (teamScore === opponentScore) return { result: 'D', color: 'bg-yellow-100 text-yellow-800' };
    return { result: 'L', color: 'bg-red-100 text-red-800' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const stats = calculateTeamStats();
  const completedMatches = matches.filter(match => match.status === 'completed');
  const upcomingMatches = matches.filter(match => match.status === 'scheduled');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart },
    { id: 'squad', label: 'Squad', icon: Users, count: players.length },
    { id: 'matches', label: 'Matches', icon: Calendar, count: matches.length },
    { id: 'statistics', label: 'Statistics', icon: Trophy }
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading team data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="text-center">
            <Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading Team</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="space-x-4">
              <button
                onClick={loadTeamData}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Try Again
              </button>
              <button
                onClick={onBack}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Team Not Found</h2>
          <p className="text-gray-600 mb-4">The team you're looking for doesn't exist or couldn't be loaded.</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="mb-6 flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back</span>
      </button>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Check className="w-5 h-5 text-green-500" />
            <span className="text-green-700">{success}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <X className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Team Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {team.logo ? (
              <img 
                src={team.logo} 
                alt={team.name}
                className="w-20 h-20 rounded-lg object-cover"
              />
            ) : (
              <div 
                className="w-20 h-20 rounded-lg flex items-center justify-center text-white text-2xl font-bold"
                style={{ backgroundColor: team.primaryColor || '#3b82f6' }}
              >
                {team.shortName || team.name?.charAt(0) || 'T'}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{team.name || 'Unknown Team'}</h1>
              {team.shortName && <p className="text-gray-600 mt-1">{team.shortName}</p>}
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                {team.coach && (
                  <>
                    <div className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>Coach: {team.coach}</span>
                    </div>
                    <span>•</span>
                  </>
                )}
                {team.homeGround && (
                  <>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>Home: {team.homeGround}</span>
                    </div>
                    <span>•</span>
                  </>
                )}
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>Players: {players.length}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {canEditTeam && (
              <button
                onClick={handleEditTeam}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Team</span>
              </button>
            )}
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">{stats.points}</div>
              <div className="text-sm text-gray-600">Points</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-2xl font-bold text-green-600">{stats.wins}</div>
          <div className="text-sm text-gray-600">Wins</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats.draws}</div>
          <div className="text-sm text-gray-600">Draws</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-2xl font-bold text-red-600">{stats.losses}</div>
          <div className="text-sm text-gray-600">Losses</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.goalsFor}</div>
          <div className="text-sm text-gray-600">Goals For</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-2xl font-bold text-purple-600">{stats.goalsAgainst}</div>
          <div className="text-sm text-gray-600">Goals Against</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`${
                      activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    } ml-2 py-0.5 px-2 rounded-full text-xs font-medium`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Squad Tab - Enhanced with edit options */}
          {activeTab === 'squad' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Squad ({players.length} players)
                </h3>
                <div className="flex items-center space-x-4">
                  {/* Squad breakdown */}
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>GK: {stats.goalkeepers}</span>
                    <span>DEF: {stats.defenders}</span>
                    <span>MID: {stats.midfielders}</span>
                    <span>FWD: {stats.forwards}</span>
                  </div>
                  {canEditTeam && (
                    <button
                      onClick={handleAddPlayer}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Add Player</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Players List */}
              {players.length > 0 ? (
                <div className="space-y-3">
                  {players.map((player, index) => (
                    <div 
                      key={player._id || index} 
                      className="relative flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-all border border-transparent hover:border-blue-200"
                    >
                      <div className="flex items-center space-x-4">
                        {/* Jersey Number */}
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {player.jerseyNumber || player.number || '?'}
                        </div>
                        
                        {/* Player Photo */}
                        {player.photo ? (
                          <img
                            src={player.photo}
                            alt={player.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        
                        {/* Player Info */}
                        <div>
                          <h4 className="font-medium text-gray-900 flex items-center">
                            {player.name || 'Unknown Player'}
                            {(player.statistics?.goals || 0) > 5 && (
                              <Star className="w-4 h-4 text-yellow-500 ml-2" />
                            )}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-block px-2 py-1 text-xs rounded-full border ${getPositionColor(player.position)}`}>
                              {player.position || 'Unknown'}
                            </span>
                            {player.age && (
                              <span className="text-xs text-gray-500">
                                Age: {player.age}
                              </span>
                            )}
                            {player.nationality && (
                              <span className="text-xs text-gray-500">
                                {player.nationality}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Player Stats and Actions */}
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="text-center">
                            <div className="font-bold text-gray-900">
                              {player.statistics?.goals || 0}
                            </div>
                            <div className="text-gray-600">Goals</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-gray-900">
                              {player.statistics?.assists || 0}
                            </div>
                            <div className="text-gray-600">Assists</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-gray-900">
                              {player.statistics?.matches || 0}
                            </div>
                            <div className="text-gray-600">Matches</div>
                          </div>
                        </div>

                        {/* Action Menu */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowPlayerMenu(showPlayerMenu === player._id ? null : player._id);
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          
                          {showPlayerMenu === player._id && (
                            <div className="absolute right-0 top-10 w-48 bg-white rounded-md shadow-lg border z-10">
                              <div className="py-1">
                                <button
                                  onClick={(e) => handlePlayerAction('view', player, e)}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                >
                                  <Eye className="w-4 h-4 mr-3 text-blue-500" />
                                  View Profile
                                </button>
                                {canEditTeam && (
                                  <>
                                    <button
                                      onClick={(e) => handlePlayerAction('edit', player, e)}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                    >
                                      <Edit className="w-4 h-4 mr-3 text-green-500" />
                                      Edit Player
                                    </button>
                                    <hr className="my-1" />
                                    <button
                                      onClick={(e) => handlePlayerAction('delete', player, e)}
                                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                                    >
                                      <Trash2 className="w-4 h-4 mr-3 text-red-500" />
                                      Remove from Team
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No players in squad</p>
                  {canEditTeam && (
                    <button
                      onClick={handleAddPlayer}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Add First Player
                    </button>
                  )}
                </div>
              )}

              {/* Top Players Section */}
              {stats.topScorer && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-900 mb-2 flex items-center">
                      <Trophy className="w-5 h-5 mr-2" />
                      Top Scorer
                    </h4>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
                        {stats.topScorer.jerseyNumber || '?'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{stats.topScorer.name}</div>
                        <div className="text-sm text-gray-600">
                          {stats.topScorer.statistics?.goals || 0} goals
                        </div>
                      </div>
                    </div>
                  </div>

                  {stats.mostAssists && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-medium text-green-900 mb-2 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2" />
                        Most Assists
                      </h4>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                          {stats.mostAssists.jerseyNumber || '?'}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{stats.mostAssists.name}</div>
                          <div className="text-sm text-gray-600">
                            {stats.mostAssists.statistics?.assists || 0} assists
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Team Information</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                      <dd className="text-sm text-gray-900">{team.name || 'N/A'}</dd>
                    </div>
                    {team.shortName && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Short Name</dt>
                        <dd className="text-sm text-gray-900">{team.shortName}</dd>
                      </div>
                    )}
                    {team.coach && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Coach</dt>
                        <dd className="text-sm text-gray-900">{team.coach}</dd>
                      </div>
                    )}
                    {team.homeGround && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Home Ground</dt>
                        <dd className="text-sm text-gray-900">{team.homeGround}</dd>
                      </div>
                    )}
                    {team.founded && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Founded</dt>
                        <dd className="text-sm text-gray-900">{team.founded}</dd>
                      </div>
                    )}
                  </dl>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Season Statistics</h3>
                  <dl className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Matches Played</span>
                      <span className="font-medium">{stats.matchesPlayed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Win Rate</span>
                      <span className="font-medium">{stats.winPercentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Goal Difference</span>
                      <span className={`font-medium ${
                        stats.goalDifference >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stats.goalDifference >= 0 ? '+' : ''}{stats.goalDifference}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Goals Per Match</span>
                      <span className="font-medium">
                        {stats.matchesPlayed > 0 ? (stats.goalsFor / stats.matchesPlayed).toFixed(1) : '0.0'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Age</span>
                      <span className="font-medium">{stats.averageAge} years</span>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Recent Matches */}
              {completedMatches.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Results</h3>
                  <div className="space-y-2">
                    {completedMatches.slice(-5).reverse().map((match, index) => {
                      const isHome = match.homeTeam?._id === teamId || match.homeTeam === teamId;
                      const opponent = isHome ? match.awayTeam : match.homeTeam;
                      const result = getMatchResult(match);
                      
                      return (
                        <div key={match._id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${result.color}`}>
                              {result.result}
                            </span>
                            <span className="text-sm">
                              {isHome ? 'vs' : '@'} {opponent?.name || 'Unknown Team'}
                            </span>
                          </div>
                          <div className="text-sm font-medium">
                            {isHome ? `${match.homeScore}-${match.awayScore}` : `${match.awayScore}-${match.homeScore}`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Matches Tab */}
          {activeTab === 'matches' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Matches</h3>
              {matches.length > 0 ? (
                <div className="space-y-4">
                  {matches.map((match, index) => {
                    const isHome = match.homeTeam?._id === teamId || match.homeTeam === teamId;
                    const opponent = isHome ? match.awayTeam : match.homeTeam;
                    const result = getMatchResult(match);
                    
                    return (
                      <div key={match._id || index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              {isHome ? 'vs' : '@'} {opponent?.name || 'Unknown Team'}
                            </div>
                            <div className="text-sm text-gray-600">
                              {formatDate(match.matchDate)} {match.kickoffTime && `at ${match.kickoffTime}`}
                            </div>
                          </div>
                          <div className="text-right">
                            {match.status === 'completed' ? (
                              <>
                                <div className="font-bold text-lg">
                                  {isHome ? `${match.homeScore}-${match.awayScore}` : `${match.awayScore}-${match.homeScore}`}
                                </div>
                                <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${result.color}`}>
                                  {result.result}
                                </span>
                              </>
                            ) : (
                              <span className="inline-block px-2 py-1 text-xs rounded-full font-medium bg-gray-100 text-gray-800">
                                {match.status.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No matches scheduled</p>
                </div>
              )}
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'statistics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Team Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Add detailed statistics here */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Attack</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Goals</span>
                      <span className="font-medium">{stats.goalsFor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Goals per Match</span>
                      <span className="font-medium">
                        {stats.matchesPlayed > 0 ? (stats.goalsFor / stats.matchesPlayed).toFixed(1) : '0.0'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2">Defense</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Goals Conceded</span>
                      <span className="font-medium">{stats.goalsAgainst}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Goals per Match</span>
                      <span className="font-medium">
                        {stats.matchesPlayed > 0 ? (stats.goalsAgainst / stats.matchesPlayed).toFixed(1) : '0.0'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">Overall</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Win Rate</span>
                      <span className="font-medium">{stats.winPercentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Points per Match</span>
                      <span className="font-medium">
                        {stats.matchesPlayed > 0 ? (stats.points / stats.matchesPlayed).toFixed(1) : '0.0'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamProfile;