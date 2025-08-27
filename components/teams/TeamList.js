// components/teams/TeamList.js - Enhanced with admin controls
import React, { useState } from 'react';
import { Search, Plus, Filter, Users, Shield, AlertTriangle } from 'lucide-react';
import TeamCard from './TeamCard';

const TeamList = ({ 
  teams = [], 
  onTeamClick, 
  onEditTeam, 
  onDeleteTeam, 
  onCreateTeam,
  leagues = [],
  loading = false,
  currentUser
}) => {
  const uniqueById = (arr) => {
  const seen = new Set();
  return arr.filter(t => {
    if (!t || !t._id) return false;
    if (seen.has(t._id)) return false;
    seen.add(t._id);
    return true;
  });
};

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('all'); // 'all', 'managed', 'assigned'

  // Check permissions
  const canCreateTeam = currentUser && (
    currentUser.role === 'super_admin' ||
    currentUser.role === 'league_admin' ||
    currentUser.permissions?.canManageTeams
  );

  const canManageAllTeams = currentUser && (
    currentUser.role === 'super_admin' ||
    currentUser.role === 'league_admin'
  );

  // Filter teams based on user permissions and view mode
  const getFilteredTeams = () => {
    let filteredTeams = teams;

    // Apply view mode filter
    if (!canManageAllTeams && viewMode === 'managed') {
      filteredTeams = teams.filter(team => 
        currentUser?.assignedTeams?.includes(team._id)
      );
    }

    // Apply search and league filters
    filteredTeams = filteredTeams.filter(team => {
      const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           team.coach?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLeague = !selectedLeague || 
                           team.leagues?.some(l => (l._id || l) === selectedLeague);
      return matchesSearch && matchesLeague;
    });

    // Apply sorting
    return filteredTeams.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'points':
          return (b.statistics?.points || 0) - (a.statistics?.points || 0);
        case 'players':
          return (b.players?.length || 0) - (a.players?.length || 0);
        case 'recent':
          return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
        default:
          return 0;
      }
    });
  };

  const filteredTeams = getFilteredTeams();
  const managedTeams = currentUser?.assignedTeams?.length || 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with role-based info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Users className="w-8 h-8 mr-2 text-blue-600" />
            Teams
          </h2>
          <div className="flex items-center space-x-4 mt-1">
            <span className="text-sm text-gray-600">
              {filteredTeams.length} of {teams.length} teams
            </span>
            {currentUser && !canManageAllTeams && managedTeams > 0 && (
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                Managing {managedTeams} team{managedTeams !== 1 ? 's' : ''}
              </span>
            )}
            {currentUser?.role && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {currentUser.role.replace('_', ' ').toUpperCase()}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {canCreateTeam && (
            <button
              onClick={onCreateTeam}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Team
            </button>
          )}
        </div>
      </div>

      {/* Admin Controls and Filters */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search teams by name or coach..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* View Mode (for team managers) */}
          {currentUser && !canManageAllTeams && managedTeams > 0 && (
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Teams</option>
              <option value="managed">My Teams ({managedTeams})</option>
            </select>
          )}

          {/* League Filter */}
          {leagues.length > 0 && (
            <select
              value={selectedLeague}
              onChange={(e) => setSelectedLeague(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Leagues</option>
              {leagues.map(league => (
                <option key={league._id} value={league._id}>
                  {league.name}
                </option>
              ))}
            </select>
          )}

          {/* Sort Options */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="name">Sort by Name</option>
            <option value="points">Sort by Points</option>
            <option value="players">Sort by Players</option>
            <option value="recent">Recently Updated</option>
          </select>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{teams.length}</div>
            <div className="text-sm text-gray-600">Total Teams</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {teams.reduce((sum, team) => sum + (team.players?.length || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Total Players</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {teams.filter(team => (team.statistics?.matchesPlayed || 0) > 0).length}
            </div>
            <div className="text-sm text-gray-600">Active Teams</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {teams.filter(team => (team.players?.length || 0) === 0).length}
            </div>
            <div className="text-sm text-gray-600">Need Players</div>
          </div>
        </div>
      </div>

      {/* Warning for teams without players */}
      {currentUser && teams.some(team => (team.players?.length || 0) === 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-amber-600 mr-2" />
            <span className="text-amber-800 text-sm">
              {teams.filter(team => (team.players?.length || 0) === 0).length} team(s) have no players assigned. 
              Click on a team to manage its squad.
            </span>
          </div>
        </div>
      )}

      {/* Teams Grid */}
      {filteredTeams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map(team => (
            <TeamCard
              key={team._id}
              team={team}
              onClick={onTeamClick}
              onEdit={onEditTeam}
              onDelete={onDeleteTeam}
              currentUser={currentUser}
              showActions={true}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <div className="text-gray-400 text-lg mb-2">No teams found</div>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedLeague
              ? 'Try adjusting your search criteria'
              : 'Get started by creating your first team'
            }
          </p>
          {canCreateTeam && !searchTerm && !selectedLeague && (
            <button
              onClick={onCreateTeam}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create First Team
            </button>
          )}
        </div>
      )}

      {/* Role-based help text */}
      {currentUser && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">
            <Shield className="w-4 h-4 inline mr-1" />
            <strong>Your permissions:</strong> 
            {canManageAllTeams ? (
              <span className="text-green-600 ml-1">Full team management access</span>
            ) : currentUser.permissions?.canManageTeams ? (
              <span className="text-blue-600 ml-1">Can manage assigned teams</span>
            ) : (
              <span className="text-gray-600 ml-1">View-only access</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamList;