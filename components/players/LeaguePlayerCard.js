// components/players/LeaguePlayerCard.js - Enhanced player card for league management
import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  ArrowRightLeft, 
  UserX, 
  MapPin, 
  Calendar, 
  Phone, 
  Mail,
  Building,
  Clock,
  MoreVertical,
  Edit,
  Eye,
  FileText,
  X,
  Shield,
  Activity,
  Target,
  Award
} from 'lucide-react';

const LeaguePlayerCard = ({ 
  player, 
  teams = [], 
  onTransfer, 
  onRelease, 
  onEdit,
  canManage = false,
  showStatistics = true,
  compact = false 
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showDetails) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [showDetails]);

  const getPositionColor = (position) => {
    switch (position) {
      case 'Goalkeeper':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Defender':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Midfielder':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Forward':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (player) => {
    if (player.currentTeam || player.team) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  const getStatusText = (player) => {
    const currentTeam = player.currentTeam || player.team;
    if (currentTeam) {
      const teamName = typeof currentTeam === 'string' ? currentTeam : currentTeam.name;
      return `Active - ${teamName}`;
    }
    return 'Free Agent';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    try {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age > 0 ? age : null;
    } catch (error) {
      return null;
    }
  };

  const handleAction = async (action, ...args) => {
    if (loading) return;
    
    setLoading(true);
    setShowDropdown(false);
    
    try {
      await action(...args);
    } catch (error) {
      console.error('Action failed:', error);
      // You could add a toast notification here
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = () => {
    if (onTransfer) {
      handleAction(onTransfer, player);
    }
  };

  const handleRelease = () => {
    if (onRelease) {
      if (confirm(`Are you sure you want to release ${player.name}? This will make them a free agent.`)) {
        handleAction(onRelease, player);
      }
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      handleAction(onEdit, player);
    }
  };

  const age = calculateAge(player.dateOfBirth);
  const currentTeam = player.currentTeam || player.team;
  const hasTeam = !!currentTeam;
  const teamName = currentTeam ? (typeof currentTeam === 'string' ? currentTeam : currentTeam.name) : null;

  // Player statistics
  const stats = player.statistics || {};
  const hasStats = Object.values(stats).some(val => val > 0);

  if (compact) {
    return (
      <div className="bg-white rounded-md border border-gray-200 p-3 hover:shadow-sm transition-shadow">
        <div className="flex items-center space-x-3">
          {player.photo ? (
            <img
              src={player.photo}
              alt={player.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-gray-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{player.name}</p>
            <p className="text-sm text-gray-500">{player.position}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              {teamName || 'Free Agent'}
            </p>
            {age && <p className="text-xs text-gray-500">Age {age}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      {/* Player Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {player.photo ? (
              <img
                src={player.photo}
                alt={player.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{player.name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-block px-2 py-1 text-xs rounded-full border ${getPositionColor(player.position)}`}>
                  {player.position}
                </span>
                {age && (
                  <span className="text-xs text-gray-500">
                    Age {age}
                  </span>
                )}
                {player.jerseyNumber && (
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    #{player.jerseyNumber}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions Dropdown */}
          {canManage && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                disabled={loading}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 disabled:opacity-50"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 top-8 w-48 bg-white rounded-md shadow-lg border z-20">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowDetails(true);
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <Eye className="w-4 h-4 mr-3 text-blue-500" />
                      View Details
                    </button>

                    {onEdit && (
                      <button
                        onClick={handleEdit}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <Edit className="w-4 h-4 mr-3 text-purple-500" />
                        Edit Player
                      </button>
                    )}
                    
                    {!hasTeam && onTransfer && (
                      <button
                        onClick={handleTransfer}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <ArrowRightLeft className="w-4 h-4 mr-3 text-green-500" />
                        Assign to Team
                      </button>
                    )}
                    
                    {hasTeam && onTransfer && (
                      <button
                        onClick={handleTransfer}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <ArrowRightLeft className="w-4 h-4 mr-3 text-blue-500" />
                        Transfer Player
                      </button>
                    )}

                    {hasTeam && onRelease && (
                      <button
                        onClick={handleRelease}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                      >
                        <UserX className="w-4 h-4 mr-3 text-red-500" />
                        Release Player
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Player Status */}
        <div className="mt-3">
          <span className={`inline-block px-2 py-1 text-xs rounded-full border ${getStatusColor(player)}`}>
            {getStatusText(player)}
          </span>
        </div>
      </div>

      {/* Player Info */}
      <div className="p-4 space-y-3">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {player.nationality && (
            <div className="flex items-center text-gray-600">
              <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{player.nationality}</span>
            </div>
          )}
          
          <div className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate">Reg: {formatDate(player.registrationDate || player.createdAt)}</span>
          </div>
        </div>

        {/* Performance Statistics */}
        {showStatistics && hasStats && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <h5 className="text-xs font-medium text-gray-700 mb-2 flex items-center">
              <Activity className="w-3 h-3 mr-1" />
              Season Stats
            </h5>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <div className="text-gray-600">Matches</div>
                <div className="font-medium">{stats.matchesPlayed || 0}</div>
              </div>
              <div>
                <div className="text-gray-600">Goals</div>
                <div className="font-medium text-green-600">{stats.goals || 0}</div>
              </div>
              <div>
                <div className="text-gray-600">Assists</div>
                <div className="font-medium text-blue-600">{stats.assists || 0}</div>
              </div>
            </div>
            
            {/* Goalkeeper specific stats */}
            {player.position === 'Goalkeeper' && (stats.saves > 0 || stats.cleanSheets > 0) && (
              <div className="grid grid-cols-2 gap-2 text-center text-xs mt-2 pt-2 border-t border-gray-200">
                <div>
                  <div className="text-gray-600">Saves</div>
                  <div className="font-medium text-purple-600">{stats.saves || 0}</div>
                </div>
                <div>
                  <div className="text-gray-600">Clean Sheets</div>
                  <div className="font-medium text-green-600">{stats.cleanSheets || 0}</div>
                </div>
              </div>
            )}

            {/* Disciplinary */}
            {(stats.yellowCards > 0 || stats.redCards > 0) && (
              <div className="flex justify-center space-x-4 mt-2 pt-2 border-t border-gray-200">
                {stats.yellowCards > 0 && (
                  <div className="flex items-center text-xs">
                    <div className="w-3 h-4 bg-yellow-400 rounded-sm mr-1"></div>
                    <span>{stats.yellowCards}</span>
                  </div>
                )}
                {stats.redCards > 0 && (
                  <div className="flex items-center text-xs">
                    <div className="w-3 h-4 bg-red-500 rounded-sm mr-1"></div>
                    <span>{stats.redCards}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Physical Stats */}
        {(player.height || player.weight || player.preferredFoot) && (
          <div className="grid grid-cols-3 gap-2 text-center text-xs bg-gray-50 p-2 rounded">
            {player.height && (
              <div>
                <div className="text-gray-600">Height</div>
                <div className="font-medium">{player.height}cm</div>
              </div>
            )}
            {player.weight && (
              <div>
                <div className="text-gray-600">Weight</div>
                <div className="font-medium">{player.weight}kg</div>
              </div>
            )}
            {player.preferredFoot && (
              <div>
                <div className="text-gray-600">Foot</div>
                <div className="font-medium">{player.preferredFoot.charAt(0)}</div>
              </div>
            )}
          </div>
        )}

        {/* Contract Info */}
        {(player.contractType || player.registrationFee) && (
          <div className="pt-2 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-4 text-xs">
              {player.contractType && (
                <div>
                  <span className="text-gray-600">Contract:</span>
                  <span className="ml-1 font-medium capitalize">
                    {player.contractType.replace('_', ' ')}
                  </span>
                </div>
              )}
              {player.registrationFee > 0 && (
                <div>
                  <span className="text-gray-600">Fee:</span>
                  <span className="ml-1 font-medium">
                    ${player.registrationFee}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transfer History Indicator */}
        {player.transferHistory && player.transferHistory.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center text-xs text-gray-600">
              <Clock className="w-3 h-3 mr-1" />
              <span>{player.transferHistory.length} transfer{player.transferHistory.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {canManage && (
        <div className="px-4 pb-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setShowDetails(true)}
              className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center"
            >
              <Eye className="w-4 h-4 mr-1" />
              Details
            </button>
            
            {!hasTeam && onTransfer ? (
              <button
                onClick={handleTransfer}
                disabled={loading}
                className="flex-1 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors flex items-center justify-center disabled:opacity-50"
              >
                <ArrowRightLeft className="w-4 h-4 mr-1" />
                {loading ? 'Loading...' : 'Assign'}
              </button>
            ) : hasTeam && onTransfer ? (
              <button
                onClick={handleTransfer}
                disabled={loading}
                className="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors flex items-center justify-center disabled:opacity-50"
              >
                <ArrowRightLeft className="w-4 h-4 mr-1" />
                {loading ? 'Loading...' : 'Transfer'}
              </button>
            ) : null}
          </div>
        </div>
      )}

      {/* Player Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {player.photo ? (
                    <img
                      src={player.photo}
                      alt={player.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{player.name}</h3>
                    <p className="text-gray-600">{player.position}</p>
                    {teamName && (
                      <p className="text-sm text-blue-600">{teamName}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Personal Information */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Personal Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Full Name:</span>
                    <span className="ml-2 font-medium">{player.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Date of Birth:</span>
                    <span className="ml-2 font-medium">{formatDate(player.dateOfBirth)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Age:</span>
                    <span className="ml-2 font-medium">{age || 'N/A'} years</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Nationality:</span>
                    <span className="ml-2 font-medium">{player.nationality || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Position:</span>
                    <span className="ml-2 font-medium">{player.position}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Jersey Number:</span>
                    <span className="ml-2 font-medium">{player.jerseyNumber || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Physical Information */}
              {(player.height || player.weight || player.preferredFoot) && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Activity className="w-4 h-4 mr-2" />
                    Physical Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {player.height && (
                      <div>
                        <span className="text-gray-600">Height:</span>
                        <span className="ml-2 font-medium">{player.height} cm</span>
                      </div>
                    )}
                    {player.weight && (
                      <div>
                        <span className="text-gray-600">Weight:</span>
                        <span className="ml-2 font-medium">{player.weight} kg</span>
                      </div>
                    )}
                    {player.preferredFoot && (
                      <div>
                        <span className="text-gray-600">Preferred Foot:</span>
                        <span className="ml-2 font-medium">{player.preferredFoot}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Performance Statistics */}
              {showStatistics && hasStats && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Target className="w-4 h-4 mr-2" />
                    Season Statistics
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-gray-900">{stats.matchesPlayed || 0}</div>
                      <div className="text-gray-600">Matches</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.goals || 0}</div>
                      <div className="text-gray-600">Goals</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.assists || 0}</div>
                      <div className="text-gray-600">Assists</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-600">{stats.saves || 0}</div>
                      <div className="text-gray-600">Saves</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Information */}
              {(player.email || player.phone || player.address) && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    {player.email && (
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-gray-500" />
                        <span>{player.email}</span>
                      </div>
                    )}
                    {player.phone && (
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-gray-500" />
                        <span>{player.phone}</span>
                      </div>
                    )}
                    {player.address && (
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                        <span>{player.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Registration Details */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Registration Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Registration Date:</span>
                    <span className="ml-2 font-medium">{formatDate(player.registrationDate || player.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Contract Type:</span>
                    <span className="ml-2 font-medium capitalize">
                      {player.contractType?.replace('_', ' ') || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Registration Fee:</span>
                    <span className="ml-2 font-medium">
                      ${player.registrationFee || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className="ml-2 font-medium">{player.status || 'Active'}</span>
                  </div>
                </div>
              </div>

              {/* Previous Clubs */}
              {player.previousClubs && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Building className="w-4 h-4 mr-2" />
                    Previous Clubs
                  </h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{player.previousClubs}</p>
                </div>
              )}

              {/* Transfer History */}
              {player.transferHistory && player.transferHistory.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Transfer History
                  </h4>
                  <div className="space-y-2">
                    {player.transferHistory.slice(0, 5).map((transfer, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg text-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">
                            {transfer.fromTeam || 'Free Agent'} → {transfer.toTeam || 'Released'}
                          </span>
                          <span className="text-gray-500">
                            {formatDate(transfer.date)}
                          </span>
                        </div>
                        {transfer.fee && (
                          <div className="text-gray-600 mt-1">
                            Transfer Fee: ${transfer.fee}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons in Modal */}
              {canManage && (
                <div className="flex space-x-3 pt-6 border-t border-gray-200">
                  {onEdit && (
                    <button
                      onClick={() => {
                        handleEdit();
                        setShowDetails(false);
                      }}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Player
                    </button>
                  )}
                  
                  {onTransfer && (
                    <button
                      onClick={() => {
                        handleTransfer();
                        setShowDetails(false);
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      <ArrowRightLeft className="w-4 h-4 mr-2" />
                      {hasTeam ? 'Transfer' : 'Assign to Team'}
                    </button>
                  )}

                  {hasTeam && onRelease && (
                    <button
                      onClick={() => {
                        handleRelease();
                        setShowDetails(false);
                      }}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center justify-center"
                    >
                      <UserX className="w-4 h-4 mr-2" />
                      Release
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaguePlayerCard;