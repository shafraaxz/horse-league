import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Edit, 
  Eye, 
  Users, 
  Trophy, 
  Target, 
  Calendar,
  MoreVertical,
  Camera,
  Shield,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  Trash2
} from 'lucide-react';

const TeamCard = ({ 
  team, 
  onEdit, 
  onViewDetails, 
  onLogoUpload,
  onDelete,
  showActions = true,
  currentSeason,
  compact = false 
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef();

  // Calculate team statistics
  const totalMatches = (team.wins || 0) + (team.losses || 0) + (team.draws || 0);
  const winPercentage = totalMatches > 0 ? Math.round(((team.wins || 0) / totalMatches) * 100) : 0;
  const points = (team.wins || 0) * 3 + (team.draws || 0) * 1;

  // Team status based on performance
  const getTeamStatus = () => {
    if (winPercentage >= 70) return { label: 'Excellent', color: 'text-green-600 bg-green-100' };
    if (winPercentage >= 50) return { label: 'Good', color: 'text-blue-600 bg-blue-100' };
    if (winPercentage >= 30) return { label: 'Average', color: 'text-yellow-600 bg-yellow-100' };
    if (totalMatches > 0) return { label: 'Needs Improvement', color: 'text-red-600 bg-red-100' };
    return { label: 'New Team', color: 'text-gray-600 bg-gray-100' };
  };

  const teamStatus = getTeamStatus();

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      onLogoUpload && onLogoUpload(file);
    }
  };

  const handleAction = (action) => {
    setShowDropdown(false);
    
    switch (action) {
      case 'edit':
        onEdit && onEdit(team);
        break;
      case 'view-details':
        onViewDetails && onViewDetails(team);
        break;
      case 'delete':
        if (window.confirm(`Are you sure you want to delete ${team.name}?`)) {
          onDelete && onDelete(team.id);
        }
        break;
      default:
        break;
    }
  };

  // Compact version for mobile/small displays
  if (compact) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors overflow-hidden"
              onClick={handleLogoClick}
            >
              {team.logo && !imageError ? (
                <img 
                  src={team.logo} 
                  alt={team.name} 
                  className="w-full h-full object-cover rounded-full"
                  onError={() => setImageError(true)}
                />
              ) : (
                <Upload size={16} className="text-gray-400" />
              )}
            </div>
            
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 truncate">{team.name}</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>{team.playerCount || 0} players</span>
                <span>•</span>
                <span>{points} pts</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${teamStatus.color}`}>
              {teamStatus.label}
            </span>
            
            {showActions && (
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <MoreVertical size={16} />
              </button>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Dropdown menu for compact version */}
        {showDropdown && (
          <div className="absolute right-2 top-16 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[150px]">
            <button
              onClick={() => handleAction('view-details')}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <Eye size={14} className="mr-2" />
              View Details
            </button>
            
            <button
              onClick={() => handleAction('edit')}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <Edit size={14} className="mr-2" />
              Edit Team
            </button>
          </div>
        )}
      </div>
    );
  }

  // Full version
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all relative">
      {/* Header with logo and actions */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          {/* Team Logo */}
          <div className="relative">
            <div
              className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors overflow-hidden group"
              onClick={handleLogoClick}
            >
              {team.logo && !imageError ? (
                <img 
                  src={team.logo} 
                  alt={team.name} 
                  className="w-full h-full object-cover rounded-xl"
                  onError={() => setImageError(true)}
                />
              ) : (
                <Upload size={20} className="text-gray-400 group-hover:text-gray-600" />
              )}
              
              {/* Upload overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                <Camera size={16} className="text-white" />
              </div>
            </div>
            
            {/* Performance indicator */}
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${teamStatus.color}`}>
              {winPercentage}%
            </div>
          </div>

          {/* Team Info */}
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">{team.name}</h3>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
              {team.coach && (
                <div className="flex items-center">
                  <Shield size={14} className="mr-1" />
                  Coach: {team.coach}
                </div>
              )}
              
              {team.founded && (
                <div className="flex items-center">
                  <Calendar size={14} className="mr-1" />
                  Est. {team.founded}
                </div>
              )}
            </div>

            <span className={`px-3 py-1 rounded-full text-sm font-medium ${teamStatus.color}`}>
              {teamStatus.label}
            </span>
          </div>
        </div>

        {/* Actions Menu */}
        {showActions && (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <MoreVertical size={18} />
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[160px]">
                <button
                  onClick={() => handleAction('view-details')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <Eye size={14} className="mr-3" />
                  View Details
                </button>
                
                <button
                  onClick={() => handleAction('edit')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <Edit size={14} className="mr-3" />
                  Edit Team
                </button>
                
                <hr className="my-1" />
                
                <button
                  onClick={() => handleAction('delete')}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                >
                  <Trash2 size={14} className="mr-3" />
                  Delete Team
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Team Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="text-center bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-center mb-1">
            <Users size={16} className="text-blue-600 mr-1" />
          </div>
          <div className="text-xl font-bold text-gray-900">{team.playerCount || 0}</div>
          <div className="text-xs text-gray-600">Players</div>
        </div>

        <div className="text-center bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-center mb-1">
            <Trophy size={16} className="text-green-600 mr-1" />
          </div>
          <div className="text-xl font-bold text-green-600">{team.wins || 0}</div>
          <div className="text-xs text-gray-600">Wins</div>
        </div>

        <div className="text-center bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-center mb-1">
            <Target size={16} className="text-red-600 mr-1" />
          </div>
          <div className="text-xl font-bold text-red-600">{team.losses || 0}</div>
          <div className="text-xs text-gray-600">Losses</div>
        </div>

        <div className="text-center bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-center mb-1">
            <TrendingUp size={16} className="text-purple-600 mr-1" />
          </div>
          <div className="text-xl font-bold text-purple-600">{points}</div>
          <div className="text-xs text-gray-600">Points</div>
        </div>
      </div>

      {/* Additional Information */}
      {(team.description || team.venue || team.contactEmail || team.contactPhone) && (
        <div className="space-y-3 mb-4 p-4 bg-gray-50 rounded-lg">
          {team.description && (
            <p className="text-sm text-gray-700">{team.description}</p>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {team.venue && (
              <div className="flex items-center text-gray-600">
                <MapPin size={14} className="mr-2 text-gray-400" />
                Home: {team.venue}
              </div>
            )}
            
            {team.contactPhone && (
              <div className="flex items-center text-gray-600">
                <Phone size={14} className="mr-2 text-gray-400" />
                {team.contactPhone}
              </div>
            )}
            
            {team.contactEmail && (
              <div className="flex items-center text-gray-600 md:col-span-2">
                <Mail size={14} className="mr-2 text-gray-400" />
                {team.contactEmail}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Performance Bar */}
      {totalMatches > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Season Performance</span>
            <span>{winPercentage}% win rate</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${winPercentage}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{team.wins || 0}W</span>
            <span>{team.draws || 0}D</span>
            <span>{team.losses || 0}L</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {showActions && (
        <div className="flex space-x-3">
          <button
            onClick={() => handleAction('view-details')}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <Eye size={16} className="mr-2" />
            View Details
          </button>
          
          <button
            onClick={() => handleAction('edit')}
            className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
          >
            <Edit size={16} className="mr-2" />
            Edit Team
          </button>
        </div>
      )}

      {/* Season indicator */}
      {currentSeason && (
        <div className="absolute top-4 right-4">
          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
            {currentSeason.name}
          </span>
        </div>
      )}

      {/* File input for logo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default TeamCard;