// components/matches/MatchList.js - Updated to pass user prop
import React, { useState } from 'react';
import MatchCard from './MatchCard';
import { Calendar, Filter } from 'lucide-react';

const MatchList = ({ matches, onSelectMatch, onEdit, onDelete, onStartLive, loading, user }) => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOrder, setSortOrder] = useState('date-desc');

  const statuses = ['all', 'scheduled', 'live', 'completed', 'postponed'];

  const filteredMatches = matches.filter(match => 
    filterStatus === 'all' || match.status === filterStatus
  );

  const sortedMatches = [...filteredMatches].sort((a, b) => {
    const dateA = new Date(a.matchDate);
    const dateB = new Date(b.matchDate);
    return sortOrder === 'date-desc' ? dateB - dateA : dateA - dateB;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters - Responsive */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All Matches' : status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Matches - Responsive Grid */}
      {sortedMatches.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No Matches Found</h3>
          <p className="text-gray-500">
            {filterStatus !== 'all' 
              ? `No ${filterStatus} matches` 
              : 'Schedule matches to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedMatches.map(match => (
            <MatchCard
              key={match._id}
              match={match}
              onClick={(match) => {
                console.log('🏷️ MatchList passing onClick to MatchCard:', match._id);
                onSelectMatch && onSelectMatch(match);
              }}
              onEdit={(match) => {
                console.log('🏷️ MatchList passing onEdit to MatchCard:', match._id);
                onEdit && onEdit(match);
              }}
              onDelete={(matchId) => {
                console.log('🏷️ MatchList passing onDelete to MatchCard:', matchId);
                onDelete && onDelete(matchId);
              }}
              onStartLive={(match) => {
                console.log('🏷️ MatchList passing onStartLive to MatchCard:', match._id);
                onStartLive && onStartLive(match);
              }}
              user={user} // Pass the user prop so MatchCard can check permissions
              isAdmin={!!user} // Quick admin check
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MatchList;