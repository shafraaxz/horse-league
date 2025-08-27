// components/pages/PublicTeamView.js - Simplified public view of team and players
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Trophy, 
  Target, 
  MapPin, 
  User, 
  ArrowLeft,
  Star,
  Award,
  Calendar,
  Eye,
  BarChart3,
  Activity
} from 'lucide-react';

const PublicTeamView = ({ teamId, leagueId, team, league, onBack, onNavigate }) => {
  const [players, setPlayers] = useState([]);
  const [teamStats, setTeamStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (teamId) {
      loadPublicTeamData();
    }
  }, [teamId]);

  const loadPublicTeamData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load team players (public endpoint)
      const playersResponse = await fetch(`/api/public/teams/${teamId}/players`);
      if (playersResponse.ok) {
        const playersData = await playersResponse.json();
        setPlayers(playersData.data || playersData.players || []);
      } else {
        // Fallback to general players endpoint
        const allPlayersResponse = await fetch('/api/players');
        if (allPlayersResponse.ok) {
          const allPlayersData = await allPlayersResponse.json();
          const teamPlayers = (allPlayersData.data || []).filter(
            player => player.currentTeam === teamId || player.team === teamId
          );
          setPlayers(teamPlayers);
        }
      }

      // Calculate basic team statistics
      calculatePublicStats();
    } catch (err) {
      console.error('Error loading public team data:', err);
      setError('Failed to load team information');
    } finally {
      setLoading(false);
    }
  };

  const calculatePublicStats = () => {
    if (!players.length) return;

    const stats = {
      totalPlayers: players.length,
      goalkeepers: players.filter(p => p.position === 'Goalkeeper').length,
      defenders: players.filter(p => p.position === 'Defender').length,
      midfielders: players.filter(p => p.position === 'Midfielder').length,
      forwards: players.filter(p => p.position === 'Forward').length,
      totalGoals: players.reduce((sum, p) => sum + (p.statistics?.goals || 0), 0),
      totalAssists: players.reduce((sum, p) => sum + (p.statistics?.assists || 0), 0),
      averageAge: players.length > 0 ? 
        (players.reduce((sum, p) => sum + (p.age || 25), 0) / players.length).toFixed(1) : 0,
      topScorer: players.reduce((top, player) => 
        (player.statistics?.goals || 0) > (top.statistics?.goals || 0) ? player : top, 
        players[0] || null
      )
    };

    setTeamStats(stats);
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

  const handlePlayerClick = (player) => {
    console.log('👤 Public player view:', player.name);
    if (onNavigate) {
      onNavigate('player-profile', { 
        playerId: player._id, 
        teamId: teamId,
        team: team,
        isPublic: true
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading team information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Team</h2>
          <p className="text-gray-600 mb-4">{error}</p>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to {league?.name || 'League'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Team Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {team?.logo ? (
                <img 
                  src={team.logo} 
                  alt={team.name}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              ) : (
                <div 
                  className="w-20 h-20 rounded-lg flex items-center justify-center text-white text-2xl font-bold"
                  style={{ backgroundColor: team?.primaryColor || '#3b82f6' }}
                >
                  {team?.shortName || team?.name?.charAt(0) || 'T'}
                </div>
              )}
              
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">{team?.name || 'Team'}</h1>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                  {team?.coach && (
                    <>
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>Coach: {team.coach}</span>
                      </div>
                      <span>•</span>
                    </>
                  )}
                  {team?.homeGround && (
                    <>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{team.homeGround}</span>
                      </div>
                      <span>•</span>
                    </>
                  )}
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{players.length} Players</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {teamStats?.totalGoals || 0}
              </div>
              <div className="text-sm text-gray-600">Season Goals</div>
            </div>
          </div>
        </div>

        {/* Team Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Players</p>
                <p className="text-2xl font-semibold text-gray-900">{teamStats?.totalPlayers || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-50 rounded-lg">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Goals</p>
                <p className="text-2xl font-semibold text-gray-900">{teamStats?.totalGoals || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Assists</p>
                <p className="text-2xl font-semibold text-gray-900">{teamStats?.totalAssists || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <Calendar className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Avg Age</p>
                <p className="text-2xl font-semibold text-gray-900">{teamStats?.averageAge || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-50 rounded-lg">
                <Star className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Top Scorer</p>
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {teamStats?.topScorer?.name || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Squad Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Squad Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{teamStats?.goalkeepers || 0}</div>
              <div className="text-sm text-yellow-700">Goalkeepers</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{teamStats?.defenders || 0}</div>
              <div className="text-sm text-blue-700">Defenders</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{teamStats?.midfielders || 0}</div>
              <div className="text-sm text-green-700">Midfielders</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{teamStats?.forwards || 0}</div>
              <div className="text-sm text-red-700">Forwards</div>
            </div>
          </div>
        </div>

        {/* Players List */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Squad ({players.length} players)
            </h3>
            <div className="text-sm text-gray-600">
              Click on a player to view detailed statistics
            </div>
          </div>

          {players.length > 0 ? (
            <div className="space-y-3">
              {players.map((player, index) => (
                <div 
                  key={player._id || index} 
                  onClick={() => handlePlayerClick(player)}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-blue-50 hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-blue-200 group"
                >
                  <div className="flex items-center space-x-4">
                    {/* Jersey Number */}
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold group-hover:bg-blue-600 transition-colors">
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
                      <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors flex items-center">
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
                  
                  {/* Player Stats */}
                  <div className="flex items-center space-x-6 text-sm">
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
                    <Eye className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No players found for this team</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicTeamView;