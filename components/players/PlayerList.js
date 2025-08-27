// components/players/PlayerList.js
import React, { useState } from 'react';
import { Search, Plus, Filter, Users, Trophy } from 'lucide-react';
import PlayerCard from './PlayerCard';

const PlayerList = ({ 
  players = [], 
  onPlayerClick, 
  onEditPlayer, 
  onDeletePlayer, 
  onCreatePlayer,
  teams = [],
  loading = false 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const positions = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];

  const filteredPlayers = players
    .filter(player => {
      const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           player.nationality?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           player.team?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTeam = !selectedTeam || 
                         (player.team?._id || player.team) === selectedTeam;
      
      const matchesPosition = !selectedPosition || 
                             player.position === selectedPosition;
      
      return matchesSearch && matchesTeam && matchesPosition;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'jersey':
          return (a.jerseyNumber || 0) - (b.jerseyNumber || 0);
        case 'goals':
          return (b.statistics?.goals || 0) - (a.statistics?.goals || 0);
        case 'team':
          const teamA = a.team?.name || '';
          const teamB = b.team?.name || '';
          return teamA.localeCompare(teamB);
        case 'position':
          return a.position.localeCompare(b.position);
        default:
          return 0;
      }
    });

  // Calculate statistics
  const totalPlayers = filteredPlayers.length;
  const positionStats = positions.map(position => ({
    position,
    count: filteredPlayers.filter(p => p.position === position).length
  }));
  const topScorer = filteredPlayers
    .filter(p => p.statistics?.goals > 0)
    .sort((a, b) => (b.statistics?.goals || 0) - (a.statistics?.goals || 0))[0];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Users className="w-8 h-8 mr-2" />
            Players
          </h2>
          <p className="text-gray-600 mt-1">
            {totalPlayers} players registered
          </p>
        </div>
        
        {/* Quick Stats */}
        <div className="flex flex-wrap gap-4">
          {positionStats.map(stat => (
            <div key={stat.position} className="text-center">
              <div className="text-lg font-semibold text-gray-900">{stat.count}</div>
              <div className="text-xs text-gray-600">{stat.position}s</div>
            </div>
          ))}
          {topScorer && (
            <div className="text-center border-l pl-4 ml-4">
              <div className="flex items-center text-sm">
                <Trophy className="w-4 h-4 mr-1 text-yellow-500" />
                <span className="font-medium">{topScorer.name}</span>
              </div>
              <div className="text-xs text-gray-600">
                {topScorer.statistics.goals} goals
              </div>
            </div>
          )}
        </div>
        
        {onCreatePlayer && (
          <button
            onClick={onCreatePlayer}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Player
          </button>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {teams.length > 0 && (
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Teams</option>
              {teams.map(team => (
                <option key={team._id} value={team._id}>
                  {team.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Positions</option>
            {positions.map(position => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="name">Sort by Name</option>
            <option value="jersey">Sort by Jersey #</option>
            <option value="goals">Sort by Goals</option>
            <option value="team">Sort by Team</option>
            <option value="position">Sort by Position</option>
          </select>
        </div>
      </div>

      {/* Players Grid */}
      {filteredPlayers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPlayers.map(player => (
            <PlayerCard
              key={player._id}
              player={player}
              onClick={onPlayerClick}
              onEdit={onEditPlayer}
              onDelete={onDeletePlayer}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <div className="text-gray-400 text-lg mb-2">No players found</div>
          <p className="text-gray-600">
            {searchTerm || selectedTeam || selectedPosition
              ? 'Try adjusting your search criteria'
              : 'Get started by adding your first player'
            }
          </p>
          {onCreatePlayer && !searchTerm && !selectedTeam && !selectedPosition && (
            <button
              onClick={onCreatePlayer}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add First Player
            </button>
          )}
        </div>
      )}

      {/* Position Summary */}
      {filteredPlayers.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Position Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {positionStats.map(stat => (
              <div key={stat.position} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{stat.count}</div>
                <div className="text-sm text-gray-600">{stat.position}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {totalPlayers > 0 ? Math.round((stat.count / totalPlayers) * 100) : 0}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerList;