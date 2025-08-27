// components/teams/TeamCard.js - Fixed with working edit
import React, { useState, useRef, useEffect } from 'react';
import { Shield, Users, Trophy, Target, Edit, Trash2, MoreVertical, Settings } from 'lucide-react';

const TeamCard = ({ team, onClick, onEdit, onDelete, currentUser, showActions = true }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Check if user has permission to edit teams
  const canEdit = currentUser && (
    currentUser.role === 'super_admin' ||
    currentUser.role === 'league_admin' ||
    currentUser.permissions?.canManageTeams ||
    currentUser.assignedTeams?.includes(team._id)
  );

  // Check if user has permission to delete teams
  const canDelete = currentUser && (
    currentUser.role === 'super_admin' ||
    (currentUser.role === 'league_admin' && currentUser.permissions?.canDeleteTeam)
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleEdit = (e) => {
    e.stopPropagation();
    console.log('🔧 Edit team clicked:', team.name, 'Team ID:', team._id);
    setShowDropdown(false);
    
    if (onEdit) {
      onEdit(team);
    } else {
      console.warn('⚠️ onEdit callback not provided to TeamCard');
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setShowDropdown(false);
    
    if (window.confirm(`Are you sure you want to delete ${team.name}? This action cannot be undone.`)) {
      console.log('🗑️ Delete team confirmed:', team.name);
      if (onDelete) {
        onDelete(team);
      } else {
        console.warn('⚠️ onDelete callback not provided to TeamCard');
      }
    }
  };

  const handleManageSquad = (e) => {
    e.stopPropagation();
    console.log('⚽ Manage squad clicked:', team.name);
    setShowDropdown(false);
    
    if (onClick) {
      onClick(team);
    }
  };

  const handleDropdownToggle = (e) => {
    e.stopPropagation();
    console.log('📋 Dropdown toggle:', !showDropdown, 'for team:', team.name);
    setShowDropdown(!showDropdown);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow relative">
      {/* Admin Actions Dropdown */}
      {showActions && (canEdit || canDelete) && (
        <div className="absolute top-4 right-4" ref={dropdownRef}>
          <button
            onClick={handleDropdownToggle}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            title="Team actions"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 top-8 w-48 bg-white rounded-md shadow-lg border z-50">
              <div className="py-1">
                {canEdit && (
                  <>
                    <button
                      onClick={handleEdit}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center transition-colors"
                    >
                      <Edit className="w-4 h-4 mr-3 text-blue-500" />
                      Edit Team
                    </button>
                    
                    <button
                      onClick={handleManageSquad}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center transition-colors"
                    >
                      <Settings className="w-4 h-4 mr-3 text-green-500" />
                      Manage Squad
                    </button>
                  </>
                )}
                
                {canDelete && (
                  <>
                    <hr className="my-1" />
                    <button
                      onClick={handleDelete}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors"
                    >
                      <Trash2 className="w-4 h-4 mr-3 text-red-500" />
                      Delete Team
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Team Content */}
      <div onClick={() => onClick?.(team)} className="cursor-pointer">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {team.logo ? (
              <img 
                src={team.logo} 
                alt={team.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
              />
            ) : (
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-gray-100"
                style={{ backgroundColor: team.primaryColor || '#3b82f6' }}
              >
                {team.shortName || team.name?.charAt(0) || 'T'}
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">{team.name}</h3>
              {team.shortName && (
                <p className="text-sm text-gray-600">{team.shortName}</p>
              )}
            </div>
          </div>
          
          {/* Role indicator for team managers */}
          {currentUser?.assignedTeams?.includes(team._id) && (
            <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              Manager
            </div>
          )}
        </div>

        {/* Coach Info */}
        <div className="mb-4 text-center">
          <div className="text-sm text-gray-600">Coach</div>
          <div className="font-medium">{team.coach || 'TBA'}</div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Users className="w-6 h-6 mx-auto mb-1 text-blue-500" />
            <div className="text-sm text-gray-600">Players</div>
            <div className="font-bold text-lg">{team.players?.length || team.playerCount || 0}</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Trophy className="w-6 h-6 mx-auto mb-1 text-yellow-500" />
            <div className="text-sm text-gray-600">Points</div>
            <div className="font-bold text-lg">{team.statistics?.points || team.leagueStatistics?.points || 0}</div>
          </div>
        </div>

        {/* Match Statistics */}
        {(team.statistics || team.leagueStatistics) && (
          <div className="grid grid-cols-4 gap-2 text-center text-sm">
            <div>
              <div className="text-gray-600">MP</div>
              <div className="font-medium">{team.statistics?.matchesPlayed || team.leagueStatistics?.matchesPlayed || 0}</div>
            </div>
            <div>
              <div className="text-gray-600">W</div>
              <div className="font-medium text-green-600">{team.statistics?.wins || team.leagueStatistics?.wins || 0}</div>
            </div>
            <div>
              <div className="text-gray-600">D</div>
              <div className="font-medium text-yellow-600">{team.statistics?.draws || team.leagueStatistics?.draws || 0}</div>
            </div>
            <div>
              <div className="text-gray-600">L</div>
              <div className="font-medium text-red-600">{team.statistics?.losses || team.leagueStatistics?.losses || 0}</div>
            </div>
          </div>
        )}

        {/* League Badges */}
        {team.leagues && team.leagues.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-xs text-gray-600 mb-2">Leagues:</div>
            <div className="flex flex-wrap gap-1">
              {team.leagues.slice(0, 2).map((league, index) => (
                <span
                  key={index}
                  className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                >
                  {typeof league === 'object' ? league.name : 'League'}
                </span>
              ))}
              {team.leagues.length > 2 && (
                <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                  +{team.leagues.length - 2} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamCard;