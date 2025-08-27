// components/leagues/LeagueCard.js - Enhanced with new fields and better UI
import React from 'react';
import { 
  Trophy, 
  Users, 
  Calendar, 
  ChevronRight, 
  MapPin, 
  Clock,
  Target,
  Zap,
  Award,
  Eye,
  Star
} from 'lucide-react';
import { format, isAfter, isBefore, differenceInDays } from 'date-fns';

const LeagueCard = ({ league, onClick, onEdit, onDelete, showActions = true }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'upcoming': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type, sport) => {
    const icons = {
      cup: '🏆',
      tournament: '🏅',
      league: getSportIcon(sport),
      friendly: '🤝'
    };
    return icons[type] || getSportIcon(sport);
  };

  const getSportIcon = (sport) => {
    const sportIcons = {
      football: '⚽',
      basketball: '🏀',
      tennis: '🎾',
      volleyball: '🏐',
      cricket: '🏏',
      rugby: '🏉',
      hockey: '🏒',
      baseball: '⚾',
      futsal: '⚽'
    };
    return sportIcons[sport] || '⚽';
  };

  const calculateProgress = () => {
    if (!league.startDate || !league.endDate) return 0;
    
    const now = new Date();
    const start = new Date(league.startDate);
    const end = new Date(league.endDate);
    
    if (isBefore(now, start)) return 0;
    if (isAfter(now, end)) return 100;
    
    const total = differenceInDays(end, start);
    const elapsed = differenceInDays(now, start);
    
    return Math.round((elapsed / total) * 100);
  };

  const getDaysRemaining = () => {
    if (!league.endDate || league.status === 'completed') return null;
    
    const now = new Date();
    const end = new Date(league.endDate);
    
    if (isBefore(end, now)) return 0;
    
    return differenceInDays(end, now);
  };

  const getStatusBadge = () => {
    const daysRemaining = getDaysRemaining();
    const progress = calculateProgress();
    
    if (league.status === 'upcoming') {
      return (
        <div className="flex items-center space-x-1">
          <Clock className="h-3 w-3" />
          <span>Starting {format(new Date(league.startDate), 'MMM dd')}</span>
        </div>
      );
    } else if (league.status === 'active' && daysRemaining !== null) {
      return (
        <div className="flex items-center space-x-1">
          <Zap className="h-3 w-3" />
          <span>{daysRemaining} days left</span>
        </div>
      );
    } else if (league.status === 'completed') {
      return (
        <div className="flex items-center space-x-1">
          <Award className="h-3 w-3" />
          <span>Completed</span>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden">
      <div onClick={onClick} className="h-full flex flex-col">
        {/* Header with Logo and Status */}
        <div className="p-6 pb-4">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-4">
              {/* Enhanced Logo Display */}
              <div className="flex-shrink-0">
                {league.logo ? (
                  <img
                    src={league.logo}
                    alt={`${league.name} logo`}
                    className="w-14 h-14 rounded-xl object-cover border-2 border-gray-100 group-hover:border-blue-200 group-hover:scale-105 transition-all duration-200 shadow-sm"
                  />
                ) : (
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center group-hover:from-blue-200 group-hover:to-purple-200 transition-all duration-200 shadow-sm">
                    <span className="text-2xl">{getTypeIcon(league.type, league.sport)}</span>
                  </div>
                )}
              </div>
              
              {/* League Title and Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate mb-1">
                  {league.name}
                </h3>
                
                {/* Season and Short Name */}
                <div className="flex items-center space-x-2 mb-2">
                  {league.shortName && (
                    <span className="px-2 py-1 text-xs font-bold bg-gray-100 text-gray-700 rounded-full">
                      {league.shortName}
                    </span>
                  )}
                  {league.season && (
                    <span className="text-sm text-gray-600 font-medium">
                      {league.season}
                    </span>
                  )}
                </div>

                {/* Status and Type */}
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(league.status)}`}>
                    {league.status.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500 capitalize font-medium">
                    {league.type} • {league.sport}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          {league.location && (
            <div className="flex items-center space-x-1 text-sm text-gray-600 mb-3">
              <MapPin className="h-4 w-4" />
              <span>{league.location}</span>
            </div>
          )}

          {/* Progress Bar (for active leagues) */}
          {league.status === 'active' && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                <span>Season Progress</span>
                <span>{calculateProgress()}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${calculateProgress()}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Stats Grid */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-3 gap-3">
            {/* Teams */}
            <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl group-hover:from-blue-100 group-hover:to-blue-200 transition-colors">
              <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <div className="text-lg font-bold text-blue-800">
                {league.teams?.length || 0}
              </div>
              <div className="text-xs text-blue-700">
                Teams
                {league.maxTeams && (
                  <span className="text-blue-600">/{league.maxTeams}</span>
                )}
              </div>
            </div>

            {/* Start Date or Duration */}
            <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-xl group-hover:from-green-100 group-hover:to-green-200 transition-colors">
              <Calendar className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <div className="text-lg font-bold text-green-800">
                {league.startDate ? format(new Date(league.startDate), 'MMM') : 'TBD'}
              </div>
              <div className="text-xs text-green-700">
                {league.startDate ? format(new Date(league.startDate), 'dd') : 'Start'}
              </div>
            </div>

            {/* Prize or Status Info */}
            <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl group-hover:from-purple-100 group-hover:to-purple-200 transition-colors">
              {league.prizeMoney > 0 ? (
                <>
                  <Target className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-purple-800">
                    ${league.prizeMoney >= 1000 ? `${(league.prizeMoney / 1000).toFixed(0)}K` : league.prizeMoney}
                  </div>
                  <div className="text-xs text-purple-700">Prize</div>
                </>
              ) : (
                <>
                  <Trophy className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-purple-800">
                    {league.pointsForWin || 3}
                  </div>
                  <div className="text-xs text-purple-700">Pts/Win</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {league.description && (
          <div className="px-6 pb-4">
            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
              {league.description}
            </p>
          </div>
        )}

        {/* Status Info */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-gray-500">
              {getStatusBadge()}
            </div>
            
            {/* Privacy Badge */}
            {league.isPublic === false && (
              <div className="flex items-center space-x-1 text-gray-500">
                <Eye className="h-3 w-3" />
                <span className="text-xs">Private</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 pt-4 border-t border-gray-100 group-hover:border-blue-100 transition-colors mt-auto">
          <div className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center group-hover:text-blue-700 transition-colors">
            View League
            <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
          
          {/* Action Buttons */}
          {showActions && (onEdit || onDelete) && (
            <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
              {onEdit && (
                <button
                  onClick={() => onEdit(league)}
                  className="text-gray-600 hover:text-blue-600 text-sm font-medium transition-colors px-2 py-1 rounded hover:bg-blue-50"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(league._id)}
                  className="text-gray-600 hover:text-red-600 text-sm font-medium transition-colors px-2 py-1 rounded hover:bg-red-50"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sponsor Badge */}
        {league.sponsor && (
          <div className="absolute top-4 right-4">
            <div className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full border border-yellow-200">
              Sponsored by {league.sponsor}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeagueCard;