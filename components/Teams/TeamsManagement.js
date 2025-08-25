import React, { useState, useEffect, useRef } from 'react';
import { Plus, Upload, Edit, Trash2, Users, Trophy, Calendar, Search, Filter, X, Save, Camera } from 'lucide-react';
import { useAPI } from '../../hooks/useAPI';

const TeamsManagement = ({ showNotification, currentSeason, setCurrentView, onTeamEdit, onTeamDelete, onTeamAdd }) => {
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const { get, post, put, del, loading, error } = useAPI();

  useEffect(() => {
    loadData();
  }, [currentSeason]);

  // Listen for data refresh events from parent
  useEffect(() => {
    const handleDataRefresh = (event) => {
      if (event.detail.type === 'teams' || event.detail.type === 'players') {
        loadData();
      }
    };

    window.addEventListener('dataRefresh', handleDataRefresh);
    return () => window.removeEventListener('dataRefresh', handleDataRefresh);
  }, []);

  const loadData = async () => {
    try {
      console.log('🔄 Loading teams for season:', currentSeason?.id);
      
      // REAL DATABASE CALLS - NO MORE localStorage
      const [teamsResponse, playersResponse] = await Promise.all([
        get('teams', { season: currentSeason?.id }),
        get('players', { season: currentSeason?.id })
      ]);
      
      // Calculate player counts for each team
      const teamsWithPlayerCounts = (teamsResponse || []).map(team => ({
        ...team,
        playerCount: (playersResponse || []).filter(p => 
          p.currentTeam === team._id || p.currentTeam === team.id
        ).length,
        activePlayers: (playersResponse || []).filter(p => 
          p.currentTeam === team._id || p.currentTeam === team.id
        )
      }));

      setTeams(teamsWithPlayerCounts);
      setPlayers(playersResponse || []);
      
      console.log('✅ Teams loaded:', teamsWithPlayerCounts.length);
      
    } catch (error) {
      console.error('❌ Failed to load teams:', error);
      showNotification?.('error', 'Failed to load teams from database');
    }
  };

  const deleteTeam = async (teamId) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      try {
        console.log('🗑️ Deleting team:', teamId);
        
        // DELETE FROM DATABASE
        await del(`teams/${teamId}`);
        
        setTeams(prev => prev.filter(team => 
          team._id !== teamId && team.id !== teamId
        ));
        
        showNotification?.('success', 'Team deleted successfully');
        
      } catch (error) {
        console.error('❌ Error deleting team:', error);
        showNotification?.('error', 'Failed to delete team');
      }
    }
  };

  const releaseAllPlayers = async (teamId) => {
    if (window.confirm('Are you sure you want to release all players from this team?')) {
      try {
        const team = teams.find(t => t._id === teamId || t.id === teamId);
        const teamPlayers = team.activePlayers || [];
        
        // Release all players from this team
        for (const player of teamPlayers) {
          await put(`players/${player._id || player.id}`, {
            currentTeam: null,
            status: 'available'
          });
        }
        
        // Refresh data
        await loadData();
        showNotification?.('success', `Released all players from ${team.name}`);
        
      } catch (error) {
        console.error('❌ Error releasing players:', error);
        showNotification?.('error', 'Failed to release players');
      }
    }
  };

  // Filter teams based on search
  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.coach?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Teams Management</h2>
              <p className="text-gray-600 mt-2">Season: {currentSeason?.name}</p>
            </div>
            <button
              onClick={onTeamAdd}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              <span>Add Team</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 pt-4 pb-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search teams..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">Loading teams from database...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">❌ Connection Error</div>
            <p className="text-gray-600">Make sure your Express server is running on port 3001</p>
            <button 
              onClick={loadData}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : filteredTeams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map(team => (
              <TeamCard
                key={team._id || team.id}
                team={team}
                players={players}
                onEdit={onTeamEdit}
                onDelete={(teamId) => deleteTeam(teamId)}
                onReleaseAllPlayers={(teamId) => releaseAllPlayers(teamId)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Trophy className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm 
                ? 'No teams match your search'
                : 'No teams created yet'
              }
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? 'Try adjusting your search term'
                : 'Start by creating your first team for this season'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={onTeamAdd}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create First Team
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Team Card Component
const TeamCard = ({ team, players, onEdit, onDelete, onReleaseAllPlayers }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const teamPlayers = team.activePlayers || [];
  const canDelete = teamPlayers.length === 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {/* Team Header */}
      <div className="relative">
        <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
            {team.logo ? (
              <img src={team.logo} alt={team.name} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <Trophy size={24} className="text-blue-600" />
            )}
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 text-lg">{team.name}</h3>
          {team.coach && (
            <p className="text-sm text-gray-600">Coach: {team.coach}</p>
          )}
          {team.founded && (
            <p className="text-sm text-gray-600">Founded: {team.founded}</p>
          )}
        </div>

        {/* Team Stats */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <p className="font-medium text-gray-900">{teamPlayers.length}</p>
              <p className="text-gray-600">Players</p>
            </div>
            <div className="text-center">
              <p className="font-medium text-gray-900">{team.stats?.points || 0}</p>
              <p className="text-gray-600">Points</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <div className="flex space-x-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
            >
              {showDetails ? 'Hide' : 'Details'}
            </button>
            <button
              onClick={() => onEdit(team)}
              className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
            >
              <Edit size={14} />
              <span>Edit</span>
            </button>
          </div>

          <div className="flex space-x-2">
            {teamPlayers.length > 0 && (
              <button
                onClick={() => onReleaseAllPlayers(team._id || team.id)}
                className="flex-1 bg-orange-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
              >
                Release All Players
              </button>
            )}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-red-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center space-x-1"
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Players List */}
        {teamPlayers.length > 0 && showDetails && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-medium text-gray-900 mb-2">Players ({teamPlayers.length})</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {teamPlayers.map(player => (
                <div key={player._id || player.id} className="flex justify-between items-center text-sm">
                  <span>{player.name}</span>
                  <span className="text-gray-500">{player.position}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 mb-3">
              {!canDelete 
                ? `Cannot delete ${team.name}. Release all ${teamPlayers.length} players first.`
                : `Are you sure you want to delete ${team.name}?`
              }
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-1 px-3 rounded text-sm hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              {canDelete && (
                <button
                  onClick={() => {
                    onDelete(team._id || team.id);
                    setShowDeleteConfirm(false);
                  }}
                  className="flex-1 bg-red-600 text-white py-1 px-3 rounded text-sm hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamsManagement;