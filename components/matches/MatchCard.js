// components/matches/MatchCard.js - With admin edit controls
import React from 'react';
import { Calendar, MapPin, Clock, AlertCircle, Play, Edit, Trash2, Eye } from 'lucide-react';

const MatchCard = ({ match, onClick, onEdit, onDelete, onStartLive, isAdmin, user }) => {
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return 'bg-red-500 text-white animate-pulse';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'postponed': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'TBD';
    try {
      // Handle various time formats
      if (timeString.includes(':')) {
        return timeString;
      }
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (error) {
      return timeString;
    }
  };

  // Check if user has edit permissions
  const canEdit = () => {
    if (!user) return false;
    return user.role === 'super_admin' || user.role === 'league_admin';
  };

  const canDelete = () => {
    if (!user) return false;
    return user.role === 'super_admin' && match.status === 'scheduled';
  };

  const canStartLive = () => {
    if (!user) return false;
    return canEdit() && match.status === 'scheduled';
  };

  // Prevent card click when clicking buttons
  const handleCardClick = (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
      return;
    }
    console.log('👁️ MatchCard clicked for viewing:', match._id);
    if (onClick) {
      onClick(match);
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('✏️ Edit button clicked:', match._id);
    
    if (!canEdit()) {
      alert('You do not have permission to edit matches.');
      return;
    }
    
    if (onEdit) {
      onEdit(match);
    } else {
      console.warn('onEdit function not provided');
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('🗑️ Delete button clicked:', match._id);
    
    if (!canDelete()) {
      alert('This match cannot be deleted or you do not have permission.');
      return;
    }
    
    if (confirm('Are you sure you want to delete this match? This action cannot be undone.')) {
      if (onDelete) {
        onDelete(match._id);
      } else {
        console.warn('onDelete function not provided');
      }
    }
  };

  const handleStartLive = (e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('🔴 Start Live button clicked:', match._id);
    
    if (!canStartLive()) {
      alert('This match cannot be started live or you do not have permission.');
      return;
    }
    
    if (!match.homeTeam || !match.awayTeam) {
      alert('Both teams must be assigned before starting the match.');
      return;
    }
    
    if (onStartLive) {
      onStartLive(match);
    } else {
      console.warn('onStartLive function not provided');
    }
  };

  const homeTeamName = match.homeTeam?.name || 'Home Team';
  const awayTeamName = match.awayTeam?.name || 'Away Team';

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
      {/* Main card content */}
      <div 
        className="p-4 sm:p-6 cursor-pointer" 
        onClick={handleCardClick}
      >
        {/* Match Status and Round */}
        <div className="flex justify-between items-start mb-3 sm:mb-4">
          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(match.status)}`}>
            {match.status === 'live' ? 
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                LIVE
              </span> : 
              match.status.toUpperCase()
            }
          </span>
          {match.round && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              Round {match.round}
            </span>
          )}
        </div>

        {/* Teams */}
        <div className="mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 text-center">
            {homeTeamName}
            <span className="mx-2 text-gray-400">vs</span>
            {awayTeamName}
          </h3>
        </div>

        {/* Score (if available) */}
        {(match.status === 'live' || match.status === 'completed') && (
          <div className="text-center mb-3">
            <div className="text-2xl font-bold text-gray-800">
              {match.homeScore || 0} - {match.awayScore || 0}
            </div>
          </div>
        )}

        {/* Match Details */}
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(match.matchDate)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{formatTime(match.kickoffTime)}</span>
            </div>
          </div>
          
          {match.venue && (
            <div className="flex items-center justify-center gap-1">
              <MapPin className="h-4 w-4" />
              <span className="text-center">{match.venue}</span>
            </div>
          )}
        </div>
      </div>

      {/* Admin Action Buttons */}
      {canEdit() && (
        <div className="border-t bg-gray-50 px-4 py-3">
          <div className="flex gap-2 justify-center flex-wrap">
            {/* View Details Button */}
            <button
              onClick={handleCardClick}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              title="View Details"
            >
              <Eye className="h-3 w-3" />
              View
            </button>

            {/* Edit Button */}
            <button
              onClick={handleEdit}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              title="Edit Match"
            >
              <Edit className="h-3 w-3" />
              Edit
            </button>

            {/* Start Live Button */}
            {canStartLive() && (
              <button
                onClick={handleStartLive}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                title="Start Live Match"
              >
                <Play className="h-3 w-3" />
                Go Live
              </button>
            )}

            {/* Delete Button */}
            {canDelete() && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                title="Delete Match"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchCard;