import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Edit, 
  Play, 
  Eye, 
  Trophy, 
  Users, 
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
  Target
} from 'lucide-react';

const MatchCard = ({ 
  match, 
  onEdit, 
  onStartLive, 
  onViewDetails, 
  currentSeason,
  showActions = true,
  compact = false 
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  
  const matchDate = new Date(match.date);
  const isUpcoming = matchDate >= new Date();
  const isPast = matchDate < new Date();
  const isToday = matchDate.toDateString() === new Date().toDateString();

  // Status configuration
  const statusConfig = {
    scheduled: {
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: Calendar,
      label: 'Scheduled'
    },
    live: {
      color: 'bg-red-100 text-red-800 border-red-200 animate-pulse',
      icon: Play,
      label: 'LIVE'
    },
    completed: {
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: CheckCircle,
      label: 'Completed'
    },
    cancelled: {
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: XCircle,
      label: 'Cancelled'
    },
    postponed: {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: AlertCircle,
      label: 'Postponed'
    }
  };

  const currentStatus = statusConfig[match.status] || statusConfig.scheduled;
  const StatusIcon = currentStatus.icon;

  // Score display logic
  const hasScore = match.homeScore !== null && match.awayScore !== null;
  const homeScore = match.homeScore || 0;
  const awayScore = match.awayScore || 0;

  // Date and time formatting
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date, time) => {
    if (time) {
      return time;
    }
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAction = (action) => {
    setShowDropdown(false);
    
    switch (action) {
      case 'edit':
        onEdit && onEdit(match);
        break;
      case 'start-live':
        onStartLive && onStartLive(match);
        break;
      case 'view-details':
        onViewDetails && onViewDetails(match);
        break;
      default:
        break;
    }
  };

  // Compact version for small displays
  if (compact) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${currentStatus.color}`}>
              {match.status === 'live' ? 'LIVE' : currentStatus.label}
            </span>
            {match.round && (
              <span className="text-xs text-gray-500">R{match.round}</span>
            )}
          </div>
          {isToday && (
            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
              Today
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <div className="font-medium">{match.homeTeam}</div>
            <div className="font-medium">{match.awayTeam}</div>
          </div>
          
          {hasScore && match.status === 'completed' ? (
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">{homeScore}</div>
              <div className="text-lg font-bold text-gray-900">{awayScore}</div>
            </div>
          ) : (
            <div className="text-xs text-gray-600 text-right">
              <div>{formatDate(matchDate)}</div>
              <div>{formatTime(matchDate, match.time)}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full version
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all relative">
      {/* Header with status and actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${currentStatus.color} flex items-center`}>
            <StatusIcon size={14} className="mr-1" />
            {match.status === 'live' ? 'LIVE' : currentStatus.label}
          </span>
          
          {match.round && (
            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-lg text-sm">
              {match.roundName || `Round ${match.round}`}
            </span>
          )}
          
          {isToday && match.status !== 'completed' && (
            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-lg text-sm font-medium animate-pulse">
              Today
            </span>
          )}
        </div>

        {showActions && (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <MoreVertical size={16} />
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[150px]">
                <button
                  onClick={() => handleAction('view-details')}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <Eye size={14} className="mr-2" />
                  View Details
                </button>
                
                {isUpcoming && match.status !== 'cancelled' && (
                  <>
                    <button
                      onClick={() => handleAction('edit')}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <Edit size={14} className="mr-2" />
                      Edit Match
                    </button>
                    
                    <button
                      onClick={() => handleAction('start-live')}
                      className="w-full text-left px-3 py-2 text-sm text-green-700 hover:bg-green-50 flex items-center"
                    >
                      <Play size={14} className="mr-2" />
                      Start Live
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main match content */}
      <div className="flex items-center justify-between">
        {/* Team information */}
        <div className="flex-1">
          <div className="space-y-3">
            {/* Home team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users size={16} className="text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{match.homeTeam}</div>
                  <div className="text-sm text-gray-500">Home</div>
                </div>
              </div>
              
              {hasScore && match.status === 'completed' && (
                <div className="text-2xl font-bold text-gray-900">{homeScore}</div>
              )}
            </div>

            {/* VS separator */}
            <div className="flex items-center justify-center">
              <span className="text-gray-400 font-medium">VS</span>
            </div>

            {/* Away team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <Users size={16} className="text-red-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{match.awayTeam}</div>
                  <div className="text-sm text-gray-500">Away</div>
                </div>
              </div>
              
              {hasScore && match.status === 'completed' && (
                <div className="text-2xl font-bold text-gray-900">{awayScore}</div>
              )}
            </div>
          </div>
        </div>

        {/* Match details sidebar */}
        <div className="ml-8 text-right space-y-2 min-w-[160px]">
          <div className="flex items-center justify-end text-sm text-gray-600">
            <Calendar size={14} className="mr-2" />
            {formatDate(matchDate)}
          </div>
          
          <div className="flex items-center justify-end text-sm text-gray-600">
            <Clock size={14} className="mr-2" />
            {formatTime(matchDate, match.time)}
          </div>
          
          {match.venue && (
            <div className="flex items-center justify-end text-sm text-gray-600">
              <MapPin size={14} className="mr-2" />
              <span className="truncate">{match.venue}</span>
            </div>
          )}

          {match.duration && (
            <div className="flex items-center justify-end text-sm text-gray-600">
              <Target size={14} className="mr-2" />
              {match.duration} min
            </div>
          )}
        </div>
      </div>

      {/* Additional match information */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4 text-gray-500">
            {match.season && (
              <span>Season: {match.season}</span>
            )}
            
            {match.matchday && (
              <span>Matchday {match.matchday}</span>
            )}
          </div>

          {/* Quick action buttons */}
          {showActions && (
            <div className="flex items-center space-x-2">
              {match.status === 'live' && (
                <button
                  onClick={() => handleAction('view-details')}
                  className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors animate-pulse"
                >
                  Watch Live
                </button>
              )}
              
              {isUpcoming && match.status === 'scheduled' && (
                <button
                  onClick={() => handleAction('start-live')}
                  className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors"
                >
                  Start Live
                </button>
              )}

              {match.status === 'completed' && (
                <button
                  onClick={() => handleAction('view-details')}
                  className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors"
                >
                  View Report
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Live match indicator */}
      {match.status === 'live' && (
        <div className="absolute top-2 right-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        </div>
      )}
    </div>
  );
};

export default MatchCard;