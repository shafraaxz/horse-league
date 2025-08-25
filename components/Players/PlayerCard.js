import React, { useState } from 'react';
import { 
  User, 
  Edit, 
  Eye, 
  ArrowRightLeft, 
  Trophy, 
  Target, 
  Clock,
  MoreVertical,
  Users,
  Calendar,
  Phone,
  Mail,
  Award,
  TrendingUp,
  MapPin,
  AlertCircle
} from 'lucide-react';

const PlayerCard = ({ 
  player, 
  onEdit, 
  onViewDetails, 
  onTransfer,
  onRelease,
  currentSeason,
  showActions = true,
  compact = false 
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  // Player status configuration
  const statusConfig = {
    available: {
      color: 'bg-green-100 text-green-800 border-green-200',
      label: 'Available',
      description: 'Ready for transfer'
    },
    transferred: {
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      label: 'Transferred',
      description: 'Currently with a team'
    },
    contracted: {
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      label: 'Contracted',
      description: 'Under contract'
    },
    inactive: {
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      label: 'Inactive',
      description: 'Not currently playing'
    },
    injured: {
      color: 'bg-red-100 text-red-800 border-red-200',
      label: 'Injured',
      description: 'Currently injured'
    }
  };

  // Position configuration
  const positionConfig = {
    'Goalkeeper': { color: 'text-yellow-600 bg-yellow-100', icon: '🥅' },
    'Defender': { color: 'text-blue-600 bg-blue-100', icon: '🛡️' },
    'Midfielder': { color: 'text-green-600 bg-green-100', icon: '⚽' },
    'Forward': { color: 'text-red-600 bg-red-100', icon: '🎯' },
    'Winger': { color: 'text-purple-600 bg-purple-100', icon: '🏃' }
  };

  const currentStatus = statusConfig[player.status] || statusConfig.available;
  const positionInfo = positionConfig[player.position] || positionConfig.Midfielder;

  // Calculate player rating based on stats and experience
  const calculateRating = () => {
    const stats = player.stats || {};
    const experience = player.experience || 0;
    const age = player.age || 20;
    
    // Simple rating algorithm
    let rating = 50; // Base rating
    rating += Math.min(experience * 2, 20); // Experience bonus (max 20)
    rating += Math.min((stats.goals || 0) * 0.5, 15); // Goals bonus (max 15)
    rating += Math.min((stats.assists || 0) * 0.3, 10); // Assists bonus (max 10)
    rating += Math.min((stats.matches || 0) * 0.1, 5); // Matches bonus (max 5)
    
    // Age factor
    if (age >= 18 && age <= 28) rating += 5; // Prime age
    else if (age > 35) rating -= 5; // Veteran penalty
    
    return Math.min(Math.max(Math.round(rating), 1), 100);
  };

  const playerRating = calculateRating();

  // Rating color based on value
  const getRatingColor = (rating) => {
    if (rating >= 80) return 'text-green-600 bg-green-100';
    if (rating >= 60) return 'text-blue-600 bg-blue-100';
    if (rating >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const handleAction = (action) => {
    setShowDropdown(false);
    
    switch (action) {
      case 'edit':
        onEdit && onEdit(player);
        break;
      case 'view-details':
        onViewDetails && onViewDetails(player);
        break;
      case 'transfer':
        onTransfer && onTransfer(player);
        break;
      case 'release':
        if (window.confirm(`Are you sure you want to release ${player.name}?`)) {
          onRelease && onRelease(player.id);
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
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <User size={20} className="text-gray-600" />
            </div>
            
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 truncate">{player.name}</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className={`px-2 py-0.5 rounded-full text-xs ${positionInfo.color}`}>
                  {player.position}
                </span>
                <span>Age {player.age}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${currentStatus.color}`}>
              {currentStatus.label}
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

        {/* Dropdown for compact version */}
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
              Edit Player
            </button>
            
            {player.status === 'available' && (
              <button
                onClick={() => handleAction('transfer')}
                className="w-full text-left px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 flex items-center"
              >
                <ArrowRightLeft size={14} className="mr-2" />
                Transfer
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full version
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all relative">
      {/* Header with player info and rating */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          {/* Player Avatar */}
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
            {player.avatar ? (
              <img 
                src={player.avatar} 
                alt={player.name} 
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <User size={24} className="text-blue-600" />
            )}
          </div>

          {/* Player Details */}
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">{player.name}</h3>
            
            <div className="flex items-center space-x-3 mb-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${positionInfo.color}`}>
                {positionInfo.icon} {player.position}
              </span>
              
              <span className="text-sm text-gray-600 flex items-center">
                <Calendar size={14} className="mr-1" />
                Age {player.age}
              </span>
              
              <span className="text-sm text-gray-600 flex items-center">
                <Clock size={14} className="mr-1" />
                {player.experience}y exp
              </span>
            </div>

            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${currentStatus.color}`}>
              {currentStatus.label}
            </span>
          </div>
        </div>

        {/* Player Rating and Actions */}
        <div className="flex items-center space-x-3">
          <div className={`px-3 py-2 rounded-lg text-center ${getRatingColor(playerRating)}`}>
            <div className="text-xl font-bold">{playerRating}</div>
            <div className="text-xs">RATING</div>
          </div>

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
                    View Profile
                  </button>
                  
                  <button
                    onClick={() => handleAction('edit')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <Edit size={14} className="mr-3" />
                    Edit Player
                  </button>
                  
                  {player.status === 'available' && (
                    <button
                      onClick={() => handleAction('transfer')}
                      className="w-full text-left px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 flex items-center"
                    >
                      <ArrowRightLeft size={14} className="mr-3" />
                      Transfer Player
                    </button>
                  )}
                  
                  {player.status === 'transferred' && (
                    <button
                      onClick={() => handleAction('release')}
                      className="w-full text-left px-4 py-2 text-sm text-orange-700 hover:bg-orange-50 flex items-center"
                    >
                      <ArrowRightLeft size={14} className="mr-3" />
                      Release Player
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Current Team Information */}
      {player.currentTeam && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users size={16} className="text-blue-600" />
              <span className="font-medium text-blue-900">Current Team</span>
            </div>
            <span className="text-blue-700 font-semibold">{player.currentTeam}</span>
          </div>
        </div>
      )}

      {/* Player Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-center mb-1">
            <Trophy size={16} className="text-green-600 mr-1" />
          </div>
          <div className="text-lg font-bold text-gray-900">{player.stats?.goals || 0}</div>
          <div className="text-xs text-gray-600">Goals</div>
        </div>

        <div className="text-center bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-center mb-1">
            <Target size={16} className="text-blue-600 mr-1" />
          </div>
          <div className="text-lg font-bold text-gray-900">{player.stats?.assists || 0}</div>
          <div className="text-xs text-gray-600">Assists</div>
        </div>

        <div className="text-center bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-center mb-1">
            <Award size={16} className="text-purple-600 mr-1" />
          </div>
          <div className="text-lg font-bold text-gray-900">{player.stats?.matches || 0}</div>
          <div className="text-xs text-gray-600">Matches</div>
        </div>
      </div>

      {/* Contact Information */}
      {(player.phone || player.email) && (
        <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded-lg">
          <h5 className="font-medium text-gray-900 text-sm">Contact Info</h5>
          
          {player.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <Phone size={14} className="mr-2 text-gray-400" />
              {player.phone}
            </div>
          )}
          
          {player.email && (
            <div className="flex items-center text-sm text-gray-600">
              <Mail size={14} className="mr-2 text-gray-400" />
              {player.email}
            </div>
          )}
        </div>
      )}

      {/* Registration Date */}
      <div className="text-xs text-gray-500 mb-4">
        Registered: {new Date(player.registrationDate || Date.now()).toLocaleDateString()}
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="flex space-x-3">
          <button
            onClick={() => handleAction('view-details')}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <Eye size={16} className="mr-2" />
            View Profile
          </button>
          
          {player.status === 'available' && (
            <button
              onClick={() => handleAction('transfer')}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
            >
              <ArrowRightLeft size={16} className="mr-2" />
              Transfer
            </button>
          )}
          
          {player.status === 'transferred' && (
            <button
              onClick={() => handleAction('release')}
              className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors flex items-center justify-center"
            >
              <ArrowRightLeft size={16} className="mr-2" />
              Release
            </button>
          )}
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
    </div>
  );
};

export default PlayerCard;