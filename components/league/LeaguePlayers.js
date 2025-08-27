// components/league/LeaguePlayers.js - Players list with navigation
import React, { useState } from 'react';
import { 
  Users, 
  User, 
  Target, 
  Trophy, 
  Search, 
  Filter, 
  Grid, 
  List,
  Crown,
  Medal,
  MapPin,
  Calendar,
  Plus,
  ExternalLink
} from 'lucide-react';

const LeaguePlayers = ({ 
  players, 
  teams, 
  matches, 
  onNavigate,  // This is crucial for navigation
  onPlayerClick, // Alternative handler
  isAdmin, 
  league,
  onCreatePlayer 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid');

  // Calculate player statistics
  const playersWithStats = players?.map(player => {
    const playerMatches = matches?.filter(match => 
      match.status === 'completed' && (
        match.homeTeam?.players?.some(p => p._id === player._id) ||
        match.awayTeam?.players?.some(p => p._id === player._id)
      )
    ) || [];

    return {
      ...player,
      stats: {
        matchesPlayed: player.statistics?.matchesPlayed || 0,
        goals: player.statistics?.goals || 0,
        assists: player.statistics?.assists || 0,
        yellowCards: player.statistics?.yellowCards || 0,
        redCards: player.statistics?.redCards || 0,
        minutesPlayed: player.statistics?.minutesPlayed || 0,
        cleanSheets: player.statistics?.cleanSheets || 0
      }
    };
  }) || [];

  // Filter players
  const filteredPlayers = playersWithStats.filter(player => {
    const matchesSearch = player.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = positionFilter === 'all' || player.position === positionFilter;
    const matchesTeam = teamFilter === 'all' || player.team?._id === teamFilter;
    
    return matchesSearch && matchesPosition && matchesTeam;
  });

  // Sort players
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'goals':
        return (b.stats.goals || 0) - (a.stats.goals || 0);
      case 'assists':
        return (b.stats.assists || 0) - (a.stats.assists || 0);
      case 'matches':
        return (b.stats.matchesPlayed || 0) - (a.stats.matchesPlayed || 0);
      default:
        return 0;
    }
  });

  // Get top performers
  const topScorers = [...playersWithStats]
    .sort((a, b) => (b.stats.goals || 0) - (a.stats.goals || 0))
    .slice(0, 3);

  // Handle player click - this is the key function for navigation
  const handlePlayerClick = (player) => {
    console.log('Player clicked:', player); // Debug log
    
    if (onNavigate) {
      // Navigate to player profile with all context
      onNavigate('player-profile', { 
        playerId: player._id, 
        leagueId: league._id,
        teamId: player.team?._id,
        player,
        league,
        team: player.team 
      });
    } else if (onPlayerClick) {
      // Fallback to onPlayerClick if provided
      onPlayerClick(player);
    } else {
      console.error('No navigation handler provided');
    }
  };

  // Get unique positions and teams for filters
  const positions = [...new Set(players?.map(p => p.position).filter(Boolean))];
  const teamsWithPlayers = teams?.filter(team => 
    players?.some(player => player.team?._id === team._id)
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <Users className="h-7 w-7 text-blue-500" />
          <div>
            <h3 className="text-2xl font-bold text-gray-900">League Players ({filteredPlayers.length})</h3>
            <p className="text-gray-600">Browse and view player profiles</p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => onCreatePlayer?.()}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5" />
            <span>Add Player</span>
          </button>
        )}
      </div>

      {/* Top Performers */}
      {topScorers.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-100">
          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Trophy className="h-6 w-6 text-yellow-500 mr-2" />
            Top Scorers
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topScorers.map((player, index) => (
              <div 
                key={player._id}
                className="bg-white rounded-xl p-4 border-2 border-yellow-200 hover:border-yellow-300 cursor-pointer transition-all hover:shadow-md"
                onClick={() => handlePlayerClick(player)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    'bg-orange-400 text-white'
                  }`}>
                    {index === 0 && <Crown className="h-5 w-5" />}
                    {index > 0 && <Medal className="h-5 w-5" />}
                  </div>
                  
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                    {player.photo ? (
                      <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-gray-900 truncate">{player.name}</h5>
                    <p className="text-sm text-gray-600">{player.position}</p>
                    {player.team && (
                      <p className="text-xs text-blue-600">{player.team.name}</p>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{player.stats.goals}</div>
                    <div className="text-xs text-gray-500">Goals</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search players..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center space-x-4">
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Positions</option>
              {positions.map(position => (
                <option key={position} value={position}>{position}</option>
              ))}
            </select>

            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Teams</option>
              {teamsWithPlayers.map(team => (
                <option key={team._id} value={team._id}>{team.name}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="name">Sort by Name</option>
              <option value="goals">Sort by Goals</option>
              <option value="assists">Sort by Assists</option>
              <option value="matches">Sort by Matches</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow' : ''}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow' : ''}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Players Grid/List */}
      {sortedPlayers.length > 0 ? (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          : "space-y-4"
        }>
          {sortedPlayers.map((player) => (
            viewMode === 'grid' ? (
              <PlayerCard 
                key={player._id} 
                player={player} 
                onClick={() => handlePlayerClick(player)}
              />
            ) : (
              <PlayerListItem 
                key={player._id} 
                player={player} 
                onClick={() => handlePlayerClick(player)}
              />
            )
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Users className="h-16 w-16 text-gray-300 mx-auto mb-6" />
          <h4 className="text-xl font-medium text-gray-900 mb-3">No Players Found</h4>
          <p className="text-gray-500 mb-6">
            {searchTerm || positionFilter !== 'all' || teamFilter !== 'all'
              ? 'Try adjusting your filters to see more players.'
              : 'This league doesn\'t have any players yet.'
            }
          </p>
          {isAdmin && (
            <button
              onClick={() => onCreatePlayer?.()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add First Player
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Player Card Component for Grid View
const PlayerCard = ({ player, onClick }) => (
  <div 
    className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all duration-200 cursor-pointer overflow-hidden group"
    onClick={() => onClick(player)}
  >
    {/* Player Photo */}
    <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 relative flex items-center justify-center">
      <div className="w-20 h-20 rounded-full overflow-hidden bg-white border-4 border-white shadow-lg">
        {player.photo ? (
          <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <User className="h-8 w-8 text-gray-400" />
          </div>
        )}
      </div>
    </div>

    {/* Player Info */}
    <div className="p-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
          {player.name}
        </h3>
        <p className="text-sm text-gray-600">{player.position}</p>
        {player.team && (
          <div className="flex items-center justify-center mt-2 text-sm text-blue-600">
            <Users className="h-4 w-4 mr-1" />
            <span>{player.team.name}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-xl font-bold text-gray-900">{player.stats.goals}</div>
          <div className="text-xs text-gray-500">Goals</div>
        </div>
        <div>
          <div className="text-xl font-bold text-gray-900">{player.stats.assists}</div>
          <div className="text-xs text-gray-500">Assists</div>
        </div>
        <div>
          <div className="text-xl font-bold text-gray-900">{player.stats.matchesPlayed}</div>
          <div className="text-xs text-gray-500">Matches</div>
        </div>
      </div>

      {/* Action Indicator */}
      <div className="mt-4 pt-4 border-t border-gray-100 text-center">
        <span className="text-xs text-gray-400 group-hover:text-blue-600 transition-colors flex items-center justify-center">
          <ExternalLink className="w-3 h-3 mr-1" />
          View player profile
        </span>
      </div>
    </div>
  </div>
);

// Player List Item Component for List View
const PlayerListItem = ({ player, onClick }) => (
  <div 
    className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-pointer p-4"
    onClick={() => onClick(player)}
  >
    <div className="flex items-center space-x-4">
      {/* Photo */}
      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
        {player.photo ? (
          <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="h-6 w-6 text-gray-400" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{player.name}</h3>
          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
            {player.position}
          </span>
        </div>
        {player.team && (
          <div className="flex items-center mt-1 text-sm text-gray-600">
            <Users className="h-4 w-4 mr-1" />
            <span>{player.team.name}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center space-x-6 text-center">
        <div>
          <div className="text-lg font-bold text-gray-900">{player.stats.goals}</div>
          <div className="text-xs text-gray-500">Goals</div>
        </div>
        <div>
          <div className="text-lg font-bold text-gray-900">{player.stats.assists}</div>
          <div className="text-xs text-gray-500">Assists</div>
        </div>
        <div>
          <div className="text-lg font-bold text-gray-900">{player.stats.matchesPlayed}</div>
          <div className="text-xs text-gray-500">Matches</div>
        </div>
      </div>

      {/* Arrow */}
      <div className="flex-shrink-0">
        <ExternalLink className="h-5 w-5 text-gray-400" />
      </div>
    </div>
  </div>
);

export default LeaguePlayers;