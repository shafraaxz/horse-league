// components/pages/LeagueSelection.js - Choose League Page
import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Trophy, Calendar, Users, Plus, Search, Filter } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const LeagueSelection = ({ onSelectLeague, onNavigate }) => {
  const { leagues, loading, fetchLeagues, currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterSport, setFilterSport] = useState('');

  useEffect(() => {
    fetchLeagues();
  }, []);

  const filteredLeagues = leagues.filter(league => {
    const matchesSearch = league.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || league.status === filterStatus;
    const matchesType = !filterType || league.type === filterType;
    const matchesSport = !filterSport || league.sport === filterSport;
    
    return matchesSearch && matchesStatus && matchesType && matchesSport;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'upcoming': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type) => {
    return type === 'cup' ? '🏆' : '⚽';
  };

  if (loading && leagues.length === 0) {
    return <LoadingSpinner message="Loading leagues..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <Trophy className="h-10 w-10 text-white" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Football League Manager
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Professional league management system for organizing tournaments, teams, and matches with comprehensive administration tools.
        </p>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Choose a league to view teams, schedules, standings, and manage matches.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Trophy className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Leagues</p>
              <p className="text-2xl font-bold text-gray-900">{leagues.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-50 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {leagues.filter(l => l.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Upcoming</p>
              <p className="text-2xl font-bold text-gray-900">
                {leagues.filter(l => l.status === 'upcoming').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Trophy className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {leagues.filter(l => l.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search leagues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="league">League</option>
              <option value="cup">Cup</option>
            </select>

            <select
              value={filterSport}
              onChange={(e) => setFilterSport(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Sports</option>
              <option value="football">Football</option>
              <option value="futsal">Futsal</option>
            </select>
          </div>

          {/* Create League Button */}
          {currentUser && (
            <button
              onClick={() => onNavigate('admin-panel')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create League</span>
            </button>
          )}
        </div>
      </div>

      {/* Leagues Grid */}
      {filteredLeagues.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeagues.map(league => (
            <div
              key={league._id}
              onClick={() => onSelectLeague(league)}
              className="bg-white rounded-lg shadow-sm border hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-xl">
                      {getTypeIcon(league.type)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                        {league.name}
                      </h3>
                      <p className="text-sm text-gray-600 capitalize">
                        {league.type} • {league.sport}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(league.status)}`}>
                    {league.status}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">
                      {league.teams?.length || league.teamsCount || 0}
                    </div>
                    <div className="text-xs text-gray-600">Teams</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">
                      {league.matches?.length || league.matchesCount || 0}
                    </div>
                    <div className="text-xs text-gray-600">Matches</div>
                  </div>
                </div>

                {/* Dates */}
                {(league.startDate || league.endDate) && (
                  <div className="text-xs text-gray-500 space-y-1">
                    {league.startDate && (
                      <div>Start: {new Date(league.startDate).toLocaleDateString()}</div>
                    )}
                    {league.endDate && (
                      <div>End: {new Date(league.endDate).toLocaleDateString()}</div>
                    )}
                  </div>
                )}

                {/* Current Round */}
                {league.currentRound && (
                  <div className="mt-3 flex items-center justify-center text-xs text-blue-600 bg-blue-50 rounded-lg py-2">
                    <Calendar className="h-3 w-3 mr-1" />
                    Round {league.currentRound}
                  </div>
                )}
              </div>

              {/* Action Footer */}
              <div className="bg-gray-50 px-6 py-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Click to enter league
                  </span>
                  <div className="text-blue-600">
                    →
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filterStatus || filterType || filterSport 
              ? 'No leagues found' 
              : 'No leagues available'
            }
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filterStatus || filterType || filterSport
              ? 'Try adjusting your search criteria'
              : 'Get started by creating your first league'
            }
          </p>
          {currentUser && (
            <button
              onClick={() => onNavigate('admin-panel')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First League
            </button>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && leagues.length > 0 && (
        <div className="text-center py-4">
          <div className="inline-flex items-center text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Updating leagues...
          </div>
        </div>
      )}
    </div>
  );
};

export default LeagueSelection;