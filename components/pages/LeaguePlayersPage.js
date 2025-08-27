// components/pages/LeaguePlayersPage.js - Enhanced with PlayerProfile Integration
import React, { useState, useEffect } from 'react';
import PlayerProfile from './PlayerProfile'; // Import the PlayerProfile component

// Simple SVG Icons (keeping existing ones)
const IconUsers = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const IconUserPlus = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
);

const IconSearch = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const IconX = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const IconRefresh = ({ spinning = false }) => (
  <svg className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const IconUser = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const IconArrowRightLeft = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

const IconUserCheck = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconBuilding = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const IconClock = () => (
  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Add eye icon for viewing player profiles
const IconEye = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

// Simple Modal Component
const SimpleModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded"
            >
              <IconX />
            </button>
          </div>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

const SimplePlayerRegistrationForm = ({ leagueId, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    position: 'Forward',
    nationality: '',
    dateOfBirth: '',
    height: '',
    weight: '',
    preferredFoot: 'Right'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setErrors({ name: 'Player name is required' });
      return;
    }
    
    setLoading(true);
    
    try {
      const playerData = {
        ...formData,
        league: leagueId,
        status: 'active',
        isAvailableForTransfer: true,
        marketStatus: 'available',
        team: null,
        currentTeam: null,
        jerseyNumber: null
      };
      
      await onSubmit(playerData);
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          <strong>🏪 League Market Registration:</strong> Player will be registered to the league market as a free agent.
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Player Name *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter player's full name"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
          <select
            name="position"
            value={formData.position}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Goalkeeper">Goalkeeper</option>
            <option value="Defender">Defender</option>
            <option value="Midfielder">Midfielder</option>
            <option value="Forward">Forward</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Foot</label>
          <select
            name="preferredFoot"
            value={formData.preferredFoot}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Left">Left</option>
            <option value="Right">Right</option>
            <option value="Both">Both</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nationality (Optional)</label>
          <input
            type="text"
            name="nationality"
            value={formData.nationality}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Brazilian, English"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth (Optional)</label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
          <input
            type="number"
            name="height"
            value={formData.height}
            onChange={handleInputChange}
            min="150"
            max="220"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 180"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
          <input
            type="number"
            name="weight"
            value={formData.weight}
            onChange={handleInputChange}
            min="50"
            max="120"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 75"
          />
        </div>
      </div>

      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm">{errors.submit}</p>
        </div>
      )}

      <div className="flex space-x-4 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Registering...
            </span>
          ) : (
            '🏪 Register to League Market'
          )}
        </button>
      </div>
    </form>
  );
};

const SimplePlayerTransferForm = ({ player, teams, onSubmit, onCancel }) => {
  const [transferData, setTransferData] = useState({
    playerId: player?._id || '',
    toTeam: '',
    transferType: 'permanent',
    transferFee: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTransferData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!transferData.toTeam) {
      setErrors({ toTeam: 'Please select destination team' });
      return;
    }
    
    setLoading(true);
    
    try {
      await onSubmit(transferData);
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <p className="text-sm text-green-800">
          <strong>🔄 Player Transfer:</strong> {player?.name} will be transferred to the selected team.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Destination Team *
        </label>
        <select
          name="toTeam"
          value={transferData.toTeam}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.toTeam ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Select destination team</option>
          {teams.map(team => (
            <option key={team._id} value={team._id}>
              {team.name}
            </option>
          ))}
        </select>
        {errors.toTeam && <p className="text-red-500 text-sm mt-1">{errors.toTeam}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Type</label>
        <select
          name="transferType"
          value={transferData.transferType}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="permanent">Permanent Transfer</option>
          <option value="loan">Loan</option>
          <option value="free_transfer">Free Transfer</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Fee</label>
        <input
          type="number"
          name="transferFee"
          value={transferData.transferFee}
          onChange={handleInputChange}
          min="0"
          step="0.01"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="0.00"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          name="notes"
          value={transferData.notes}
          onChange={handleInputChange}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Additional notes about the transfer..."
        />
      </div>

      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm">{errors.submit}</p>
        </div>
      )}

      <div className="flex space-x-4 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </span>
          ) : (
            'Complete Transfer'
          )}
        </button>
      </div>
    </form>
  );
};

const SimplePlayerCard = ({ player, teams, onTransfer, onRelease, onViewProfile, canManage = false }) => {
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

  const hasTeam = !!(player.currentTeam || player.team);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-4">
      <div className="flex items-center space-x-3 mb-3">
        {player.photo ? (
          <img
            src={player.photo}
            alt={player.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            <IconUser />
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{player.name}</h3>
          <div className="flex items-center space-x-2 mt-1">
            <span className={`inline-block px-2 py-1 text-xs rounded-full border ${getPositionColor(player.position)}`}>
              {player.position}
            </span>
            {player.nationality && (
              <span className="text-xs text-gray-500">{player.nationality}</span>
            )}
          </div>
        </div>
        {player.jerseyNumber && (
          <div className="text-lg font-bold text-gray-700">#{player.jerseyNumber}</div>
        )}
      </div>

      {hasTeam && (
        <div className="mb-3">
          <p className="text-sm text-blue-600">
            Team: {typeof (player.currentTeam || player.team) === 'string' 
              ? (player.currentTeam || player.team)
              : (player.currentTeam || player.team)?.name}
          </p>
        </div>
      )}

      <div className="text-center mb-3">
        <span className={`inline-block px-2 py-1 text-xs rounded-full border ${
          hasTeam ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'
        }`}>
          {hasTeam ? 'Assigned to Team' : 'Available in Market'}
        </span>
      </div>

      {/* Action buttons */}
      <div className="space-y-2">
        {/* View Profile button - always visible */}
        <button
          onClick={() => onViewProfile(player)}
          className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center"
        >
          <IconEye />
          <span className="ml-1">View Profile</span>
        </button>

        {/* Management buttons - only for admins */}
        {canManage && (
          <div className="flex space-x-2">
            {!hasTeam && onTransfer ? (
              <button
                onClick={() => onTransfer(player)}
                className="flex-1 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors flex items-center justify-center"
              >
                <IconArrowRightLeft />
                <span className="ml-1">Assign to Team</span>
              </button>
            ) : hasTeam && onTransfer ? (
              <button
                onClick={() => onTransfer(player)}
                className="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors flex items-center justify-center"
              >
                <IconArrowRightLeft />
                <span className="ml-1">Transfer</span>
              </button>
            ) : null}

            {hasTeam && onRelease && (
              <button
                onClick={() => onRelease(player)}
                className="flex-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors flex items-center justify-center"
              >
                <IconUserCheck />
                <span className="ml-1">Release</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const LeaguePlayersPage = ({ leagueId, onNavigate, user }) => {
  const [currentView, setCurrentView] = useState('list'); // 'list' or 'profile'
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedPlayerTeam, setSelectedPlayerTeam] = useState(null);
  const [activeTab, setActiveTab] = useState('market');
  const [players, setPlayers] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [league, setLeague] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modals
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [transferPlayer, setTransferPlayer] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');

  // Calculate tab counts
  const availablePlayers = players.filter(p => !p.currentTeam && !p.team && !p.currentTeamInfo);
  const assignedPlayers = players.filter(p => p.currentTeam || p.team || p.currentTeamInfo);

  const tabs = [
    { id: 'market', name: 'Player Market', count: availablePlayers.length },
    { id: 'assigned', name: 'Assigned Players', count: assignedPlayers.length },
    { id: 'transfers', name: 'Transfer History', count: transfers.length }
  ];

  // Load data
  useEffect(() => {
    if (leagueId) {
      loadData();
    }
  }, [leagueId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load league details
      try {
        const leagueResponse = await fetch(`/api/leagues/${leagueId}`);
        if (leagueResponse.ok) {
          const leagueResult = await leagueResponse.json();
          setLeague(leagueResult.data || leagueResult);
        }
      } catch (error) {
        console.error('Error loading league:', error);
      }

      // Load teams in this league
      try {
        const teamsResponse = await fetch(`/api/leagues/${leagueId}/teams`);
        if (teamsResponse.ok) {
          const teamsResult = await teamsResponse.json();
          setTeams(teamsResult.data || teamsResult.teams || teamsResult);
        } else {
          // Fallback
          const allTeamsResponse = await fetch('/api/teams');
          if (allTeamsResponse.ok) {
            const allTeamsResult = await allTeamsResponse.json();
            const allTeams = allTeamsResult.data || allTeamsResult.teams || allTeamsResult;
            const filteredTeams = allTeams.filter(team => team.league === leagueId);
            setTeams(filteredTeams);
          }
        }
      } catch (error) {
        console.error('Error loading teams:', error);
      }

      // Load players
      try {
        const playersResponse = await fetch(`/api/players?league=${leagueId}`);
        if (playersResponse.ok) {
          const playersResult = await playersResponse.json();
          const playersData = playersResult.data || playersResult.players || playersResult;
          setPlayers(Array.isArray(playersData) ? playersData : []);
        }
      } catch (error) {
        console.error('Error loading players:', error);
      }

      // Load matches (for player profiles)
      try {
        const matchesResponse = await fetch(`/api/matches?league=${leagueId}`);
        if (matchesResponse.ok) {
          const matchesResult = await matchesResponse.json();
          const matchesData = matchesResult.data || matchesResult.matches || matchesResult;
          setMatches(Array.isArray(matchesData) ? matchesData : []);
        }
      } catch (error) {
        console.error('Error loading matches:', error);
      }

      // Load transfers
      try {
        const transfersResponse = await fetch(`/api/transfers?league=${leagueId}`);
        if (transfersResponse.ok) {
          const transfersResult = await transfersResponse.json();
          const transfersData = transfersResult.data || transfersResult.transfers || transfersResult;
          setTransfers(Array.isArray(transfersData) ? transfersData : []);
        }
      } catch (error) {
        console.error('Error loading transfers:', error);
        setTransfers([]);
      }

    } catch (error) {
      console.error('Error loading league player data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Handle viewing player profile
  const handleViewPlayerProfile = (player) => {
    setSelectedPlayer(player);
    // Find the player's team
    const playerTeam = teams.find(team => {
      const playerTeamId = player.currentTeam?._id || player.team?._id || player.team;
      return team._id === playerTeamId;
    });
    setSelectedPlayerTeam(playerTeam);
    setCurrentView('profile');
  };

  // Handle back from player profile
  const handleBackFromProfile = () => {
    setCurrentView('list');
    setSelectedPlayer(null);
    setSelectedPlayerTeam(null);
  };

  // Handle player registration to market
  const handlePlayerRegistration = async (playerData) => {
    try {
      console.log('🔥 Registering player to market:', playerData);
      
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...playerData,
          league: leagueId,
          status: 'active',
          isAvailableForTransfer: true,
          marketStatus: 'available'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register player');
      }

      const result = await response.json();
      const newPlayer = result.data || result.player || result;
      
      setPlayers(prev => [...prev, newPlayer]);
      setShowRegistrationForm(false);
      
      console.log('✅ Player registered to market successfully');
      await refreshData();
      
    } catch (error) {
      console.error('❌ Error registering player to market:', error);
      throw error;
    }
  };

  // Handle player transfer
  const handlePlayerTransfer = async (transferData) => {
    try {
      console.log('🔄 Processing transfer:', transferData);
      
      const response = await fetch('/api/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...transferData,
          league: leagueId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process transfer');
      }

      const result = await response.json();
      const transferResult = result.data || result;
      
      // Update player's team assignment locally
      setPlayers(prev => prev.map(player => 
        player._id === transferData.playerId 
          ? { 
              ...player, 
              currentTeam: teams.find(t => t._id === transferData.toTeam),
              team: transferData.toTeam,
              status: 'assigned',
              isAvailableForTransfer: false,
              marketStatus: 'assigned',
              jerseyNumber: transferResult.transfer?.jerseyNumber
            }
          : player
      ));
      
      setShowTransferForm(false);
      setTransferPlayer(null);
      
      console.log('✅ Player transfer completed successfully');
      await refreshData();
      
    } catch (error) {
      console.error('❌ Error processing transfer:', error);
      throw error;
    }
  };

  // Handle player release (back to market)
  const handlePlayerRelease = async (player) => {
    try {
      console.log('🔄 Releasing player to market:', player.name);
      
      const response = await fetch(`/api/players/${player._id}/release`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          league: leagueId,
          reason: 'Released to market'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to release player');
      }

      // Update player status locally
      setPlayers(prev => prev.map(p => 
        p._id === player._id 
          ? { 
              ...p, 
              currentTeam: null,
              team: null,
              status: 'active',
              isAvailableForTransfer: true,
              marketStatus: 'available',
              jerseyNumber: null
            }
          : p
      ));
      
      console.log('✅ Player released to market successfully');
      await refreshData();
      
    } catch (error) {
      console.error('❌ Error releasing player:', error);
      throw error;
    }
  };

  // Filter players based on current tab and filters
  const getFilteredPlayers = () => {
    let filteredPlayers = players;

    // Filter by tab
    if (activeTab === 'market') {
      filteredPlayers = filteredPlayers.filter(p => 
        !p.currentTeam && !p.team && !p.currentTeamInfo && 
        (p.marketStatus === 'available' || p.status === 'active' || p.isFreeAgent)
      );
    } else if (activeTab === 'assigned') {
      filteredPlayers = filteredPlayers.filter(p => 
        p.currentTeam || p.team || p.currentTeamInfo ||
        (p.marketStatus === 'assigned' || p.status === 'assigned' || p.isAssigned)
      );
    }

    // Apply search filter
    if (searchTerm) {
      filteredPlayers = filteredPlayers.filter(player =>
        player.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.nationality?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.position?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply other filters
    if (positionFilter) {
      filteredPlayers = filteredPlayers.filter(player => player.position === positionFilter);
    }

    if (teamFilter) {
      filteredPlayers = filteredPlayers.filter(player => {
        const playerTeamId = player.currentTeam?._id || player.team?._id || player.team;
        return playerTeamId === teamFilter;
      });
    }

    return filteredPlayers;
  };

  const filteredPlayers = getFilteredPlayers();

  // Show player profile if selected
  if (currentView === 'profile' && selectedPlayer) {
    return (
      <PlayerProfile
        player={selectedPlayer}
        team={selectedPlayerTeam}
        league={league}
        matches={matches}
        onBack={handleBackFromProfile}
        isAdmin={user?.role === 'admin'}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <IconUsers />
            <span className="ml-2">League Player Market</span>
          </h1>
          <p className="text-gray-600">
            {league?.name || 'League'} • {players.length} total players
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="flex items-center px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <IconRefresh spinning={refreshing} />
            <span className="ml-2">Refresh</span>
          </button>
          
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowRegistrationForm(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <IconUserPlus />
              <span className="ml-2">Register Player</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Players</p>
              <p className="text-2xl font-bold text-gray-900">{players.length}</p>
            </div>
            <IconUsers />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available (Market)</p>
              <p className="text-2xl font-bold text-green-600">{availablePlayers.length}</p>
            </div>
            <div className="w-8 h-8 text-green-500">
              <IconUserCheck />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Assigned to Teams</p>
              <p className="text-2xl font-bold text-blue-600">{assignedPlayers.length}</p>
            </div>
            <IconBuilding />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Transfers</p>
              <p className="text-2xl font-bold text-purple-600">{transfers.length}</p>
            </div>
            <div className="w-8 h-8 text-purple-500">
              <IconArrowRightLeft />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.name}</span>
              <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      {(activeTab === 'market' || activeTab === 'assigned') && (
        <div className="bg-white p-4 rounded-lg border">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <IconSearch />
                </div>
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Positions</option>
              <option value="Goalkeeper">Goalkeeper</option>
              <option value="Defender">Defender</option>
              <option value="Midfielder">Midfielder</option>
              <option value="Forward">Forward</option>
            </select>

            {activeTab === 'assigned' && (
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Teams</option>
                {teams.map(team => (
                  <option key={team._id} value={team._id}>{team.name}</option>
                ))}
              </select>
            )}

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="assigned">Assigned</option>
            </select>
          </div>
        </div>
      )}

      {/* Content */}
      {activeTab === 'market' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Available Players ({filteredPlayers.length})
            </h2>
          </div>

          {filteredPlayers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlayers.map(player => (
                <SimplePlayerCard
                  key={player._id}
                  player={player}
                  teams={teams}
                  onViewProfile={handleViewPlayerProfile}
                  onTransfer={(p) => {
                    setTransferPlayer(p);
                    setShowTransferForm(true);
                  }}
                  canManage={user?.role === 'admin'}
                />
              ))}
            </div>
          ) : availablePlayers.length === 0 ? (
            <div className="text-center py-12">
              <IconUsers />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Players in Market</h3>
              <p className="text-gray-600 mb-4">
                Get started by registering your first player to the league market.
              </p>
              {user?.role === 'admin' && (
                <button
                  onClick={() => setShowRegistrationForm(true)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Register First Player
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <IconSearch />
              <p className="text-gray-600">No players match your search criteria</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'assigned' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Assigned Players ({filteredPlayers.length})
            </h2>
          </div>

          {filteredPlayers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlayers.map(player => (
                <SimplePlayerCard
                  key={player._id}
                  player={player}
                  teams={teams}
                  onViewProfile={handleViewPlayerProfile}
                  onTransfer={(p) => {
                    setTransferPlayer(p);
                    setShowTransferForm(true);
                  }}
                  onRelease={handlePlayerRelease}
                  canManage={user?.role === 'admin'}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <IconBuilding />
              <p className="text-gray-600">No assigned players found</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'transfers' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Transfer History ({transfers.length})
            </h2>
          </div>

          {transfers.length > 0 ? (
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Player
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        From
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        To
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transfers.map((transfer) => (
                      <tr key={transfer._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {transfer.player?.photo ? (
                                <img
                                  className="h-10 w-10 rounded-full"
                                  src={transfer.player.photo}
                                  alt=""
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <IconUser />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {transfer.player?.name || 'Unknown Player'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {transfer.player?.position}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transfer.fromTeam?.name || 'Free Agent'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transfer.toTeam?.name || 'Released'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {transfer.transferType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(transfer.transferDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <IconClock />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Transfer History</h3>
              <p className="text-gray-600">
                Transfer activity will appear here once players start moving between teams.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Registration Modal */}
      <SimpleModal
        isOpen={showRegistrationForm}
        onClose={() => setShowRegistrationForm(false)}
        title="Register Player to League Market"
      >
        <SimplePlayerRegistrationForm
          leagueId={leagueId}
          onSubmit={handlePlayerRegistration}
          onCancel={() => setShowRegistrationForm(false)}
        />
      </SimpleModal>

      {/* Transfer Modal */}
      <SimpleModal
        isOpen={showTransferForm}
        onClose={() => {
          setShowTransferForm(false);
          setTransferPlayer(null);
        }}
        title="Transfer Player"
      >
        <SimplePlayerTransferForm
          player={transferPlayer}
          teams={teams}
          onSubmit={handlePlayerTransfer}
          onCancel={() => {
            setShowTransferForm(false);
            setTransferPlayer(null);
          }}
        />
      </SimpleModal>
    </div>
  );
};

export default LeaguePlayersPage;