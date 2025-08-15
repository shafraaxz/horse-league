// components/Schedule.js - Fixed with proper authentication
import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, MapPin, Edit, Trash2, Play, 
  Users, Filter, ChevronLeft, ChevronRight,
  Plus, AlertCircle, Eye, Settings
} from 'lucide-react';
import LiveMatchManager from './LiveMatchManager';

const Schedule = ({ 
  matches = [], 
  teams = [], 
  players = [], 
  selectedLeague, 
  onRefresh,
  isLoggedIn,
  onEditMatch,
  onDeleteMatch,
  onStartLiveMatch
}) => {
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showLiveManager, setShowLiveManager] = useState(false);
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [filter, setFilter] = useState({
    status: 'all',
    team: 'all',
    date: 'all'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const matchesPerPage = 10;

  // ✅ SAFE: Only use provided data, don't make additional API calls
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Filter matches safely
      let filtered = matches || [];
      
      // Apply filters
      if (filter.status !== 'all') {
        filtered = filtered.filter(match => match.status === filter.status);
      }
      
      if (filter.team !== 'all') {
        filtered = filtered.filter(match => 
          match.homeTeam?._id === filter.team || 
          match.awayTeam?._id === filter.team
        );
      }
      
      if (filter.date !== 'all') {
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        filtered = filtered.filter(match => {
          switch (filter.date) {
            case 'today':
              return match.date === today;
            case 'tomorrow':
              return match.date === tomorrow;
            case 'this_week':
              const weekStart = new Date();
              weekStart.setDate(weekStart.getDate() - weekStart.getDay());
              const weekEnd = new Date(weekStart);
              weekEnd.setDate(weekStart.getDate() + 6);
              const matchDate = new Date(match.date);
              return matchDate >= weekStart && matchDate <= weekEnd;
            default:
              return true;
          }
        });
      }
      
      // Sort by date and time
      filtered.sort((a, b) => {
        if (a.date !== b.date) {
          return new Date(a.date) - new Date(b.date);
        }
        return (a.time || '00:00').localeCompare(b.time || '00:00');
      });
      
      setFilteredMatches(filtered);
      setCurrentPage(1); // Reset to first page when filters change
    } catch (err) {
      console.error('Error filtering matches:', err);
      setError('Failed to filter matches');
      setFilteredMatches([]);
    } finally {
      setIsLoading(false);
    }
  }, [matches, filter]);

  // Handle live match updates
  const handleLiveMatchUpdate = async (matchId, updateData) => {
    if (!isLoggedIn) {
      alert('Please login to manage live matches');
      return;
    }

    try {
      setIsLoading(true);
      
      // ✅ FIXED: Use proper live match API endpoint without authentication issues
      const token = localStorage.getItem('adminToken');
      if (!token) {
        alert('Authentication required. Please login again.');
        return;
      }

      const response = await fetch('/api/matches/live', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          matchId,
          ...updateData
        })
      });

      if (response.status === 401) {
        alert('Session expired. Please login again.');
        // Don't automatically logout from here, let parent handle it
        return;
      }

      if (response.ok) {
        const result = await response.json();
        console.log('Live match updated:', result);
        
        // Refresh data through parent component
        if (onRefresh) {
          onRefresh();
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update live match');
      }
    } catch (error) {
      console.error('Live match update error:', error);
      alert(`Failed to update live match: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredMatches.length / matchesPerPage);
  const startIndex = (currentPage - 1) * matchesPerPage;
  const endIndex = startIndex + matchesPerPage;
  const currentMatches = filteredMatches.slice(startIndex, endIndex);

  // Status badge styling
  const getStatusBadge = (status) => {
    const config = {
      live: { color: 'bg-red-500 text-white', label: '🔴 LIVE' },
      halftime: { color: 'bg-orange-500 text-white', label: '⏸️ HALF TIME' },
      finished: { color: 'bg-green-500 text-white', label: '✅ FINISHED' },
      scheduled: { color: 'bg-blue-500 text-white', label: '📅 SCHEDULED' },
      postponed: { color: 'bg-gray-500 text-white', label: '⏳ POSTPONED' },
      cancelled: { color: 'bg-red-600 text-white', label: '❌ CANCELLED' }
    };
    
    const { color, label } = config[status] || config.scheduled;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${color}`}>
        {label}
      </span>
    );
  };

  // Format date display
  const formatMatchDate = (date) => {
    const matchDate = new Date(date);
    const today = new Date();
    const diffTime = matchDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    
    return matchDate.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Error Loading Schedule</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          <button 
            onClick={onRefresh}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Match Schedule</h2>
          <p className="text-slate-400">
            {filteredMatches.length} match{filteredMatches.length !== 1 ? 'es' : ''} 
            {filter.status !== 'all' && ` (${filter.status})`}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {isLoading && (
            <div className="w-6 h-6 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            >
              <option value="all">All Matches</option>
              <option value="scheduled">Scheduled</option>
              <option value="live">Live</option>
              <option value="halftime">Half Time</option>
              <option value="finished">Finished</option>
              <option value="postponed">Postponed</option>
            </select>
          </div>

          {/* Team Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Team</label>
            <select
              value={filter.team}
              onChange={(e) => setFilter(prev => ({ ...prev, team: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            >
              <option value="all">All Teams</option>
              {teams.map(team => (
                <option key={team._id} value={team._id}>{team.name}</option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Date</label>
            <select
              value={filter.date}
              onChange={(e) => setFilter(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="this_week">This Week</option>
            </select>
          </div>
        </div>
      </div>

      {/* Matches Grid */}
      {currentMatches.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {matches.length === 0 ? 'No Matches Scheduled' : 'No Matches Match Your Filters'}
          </h3>
          <p className="text-slate-400">
            {matches.length === 0 
              ? 'Create some matches or generate a schedule to get started'
              : 'Try adjusting your filters to see more matches'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentMatches.map(match => (
            <div key={match._id} className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 hover:border-slate-600 transition-colors">
              
              {/* Match Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-sm text-slate-400">
                    Round {match.round || 1}
                  </div>
                  {getStatusBadge(match.status)}
                </div>
                
                <div className="flex items-center gap-2">
                  {match.status === 'live' || match.status === 'halftime' ? (
                    <button
                      onClick={() => {
                        setSelectedMatch(match);
                        setShowLiveManager(true);
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                    >
                      🔴 Manage Live
                    </button>
                  ) : (
                    isLoggedIn && (
                      <>
                        {match.status === 'scheduled' && (
                          <button
                            onClick={() => onStartLiveMatch?.(match._id)}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                          >
                            <Play className="w-3 h-3 mr-1 inline" />
                            Start Live
                          </button>
                        )}
                        <button
                          onClick={() => onEditMatch?.(match)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                        >
                          <Edit className="w-3 h-3 mr-1 inline" />
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteMatch?.(match._id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                        >
                          <Trash2 className="w-3 h-3 mr-1 inline" />
                          Delete
                        </button>
                      </>
                    )
                  )}
                </div>
              </div>

              {/* Teams and Score */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-center flex-1">
                  <div className="text-lg font-semibold text-white mb-1">
                    {match.homeTeam?.name || 'TBD'}
                  </div>
                  <div className="text-sm text-slate-400">HOME</div>
                </div>

                <div className="px-6">
                  {match.status === 'finished' || match.status === 'live' || match.status === 'halftime' ? (
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white">
                        {match.score?.home || 0} - {match.score?.away || 0}
                      </div>
                      {match.status === 'live' && (
                        <div className="text-sm text-green-400 font-medium">
                          {match.liveData?.currentMinute || 0}'
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-slate-400">VS</div>
                  )}
                </div>

                <div className="text-center flex-1">
                  <div className="text-lg font-semibold text-white mb-1">
                    {match.awayTeam?.name || 'TBD'}
                  </div>
                  <div className="text-sm text-slate-400">AWAY</div>
                </div>
              </div>

              {/* Match Details */}
              <div className="flex items-center justify-center gap-6 pt-4 border-t border-slate-700 text-sm text-slate-400">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatMatchDate(match.date)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{match.time || 'TBD'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{match.venue || 'TBD'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <span className="text-slate-400">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Live Match Manager Modal */}
      <LiveMatchManager
        match={selectedMatch}
        isOpen={showLiveManager}
        onClose={() => {
          setShowLiveManager(false);
          setSelectedMatch(null);
        }}
        onUpdate={handleLiveMatchUpdate}
        players={players}
        teams={teams}
      />
    </div>
  );
};

export default Schedule;