import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, UserPlus, Trophy, ArrowRight, CheckCircle, X, Edit, Trash2, Eye } from 'lucide-react';
import { useAPI } from '../../hooks/useAPI';

const PlayersTransferMarket = ({ showNotification, currentSeason, setCurrentView, onPlayerEdit, onPlayerDelete, onPlayerAdd }) => {
  const [activeTab, setActiveTab] = useState('players');
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPosition, setFilterPosition] = useState('all');
  
  const { get, post, put, loading, error } = useAPI();

  useEffect(() => {
    loadData();
  }, [currentSeason]);

  // Listen for data refresh events from parent
  useEffect(() => {
    const handleDataRefresh = (event) => {
      if (event.detail.type === 'players' || event.detail.type === 'teams') {
        loadData();
      }
    };

    window.addEventListener('dataRefresh', handleDataRefresh);
    return () => window.removeEventListener('dataRefresh', handleDataRefresh);
  }, []);

  const loadData = async () => {
    try {
      console.log('🔄 Loading data for season:', currentSeason?.id);
      
      // REAL DATABASE CALLS - NO MORE localStorage
      const [playersResponse, teamsResponse, transfersResponse] = await Promise.all([
        get('players', { season: currentSeason?.id }),
        get('teams', { season: currentSeason?.id }),
        get('transfers', { season: currentSeason?.id })
      ]);
      
      console.log('✅ Data loaded:', { 
        players: playersResponse?.length, 
        teams: teamsResponse?.length,
        transfers: transfersResponse?.length 
      });
      
      setPlayers(playersResponse || []);
      setTeams(teamsResponse || []);
      setTransfers(transfersResponse || []);
      
    } catch (error) {
      console.error('❌ Failed to load data:', error);
      showNotification?.('error', 'Failed to load data from database');
    }
  };

  const addPlayer = async (playerData) => {
    try {
      console.log('➕ Adding player:', playerData);
      
      // SAVE TO DATABASE - NOT localStorage
      const newPlayer = await post('players', {
        ...playerData,
        season: currentSeason?.id,
        status: 'available',
        currentTeam: null,
        stats: { goals: 0, assists: 0, matches: 0 }
      });

      setPlayers(prev => [newPlayer, ...prev]);
      showNotification?.('success', `Player ${playerData.name} registered successfully`);
      setShowAddPlayer(false);
      
    } catch (error) {
      console.error('❌ Error adding player:', error);
      showNotification?.('error', 'Failed to register player in database');
    }
  };

  const transferPlayer = async (transferData) => {
    try {
      console.log('🔄 Processing transfer:', transferData);
      
      const selectedTeam = teams.find(t => t._id === transferData.teamId || t.id === transferData.teamId);
      if (!selectedTeam) {
        showNotification?.('error', 'Selected team not found');
        return;
      }

      // SAVE TRANSFER TO DATABASE
      const transfer = await post('transfers', {
        player: selectedPlayer._id || selectedPlayer.id,
        fromTeam: selectedPlayer.currentTeam || null,
        toTeam: selectedTeam._id || selectedTeam.id,
        transferFee: transferData.fee || 0,
        season: currentSeason?.id
      });

      // UPDATE PLAYER IN DATABASE
      const updatedPlayer = await put(`players/${selectedPlayer._id || selectedPlayer.id}`, {
        currentTeam: selectedTeam._id || selectedTeam.id,
        status: 'transferred'
      });

      // Update local state
      setPlayers(prev => prev.map(p => 
        (p._id === selectedPlayer._id || p.id === selectedPlayer.id) ? updatedPlayer : p
      ));
      setTransfers(prev => [transfer, ...prev]);
      
      showNotification?.('success', `${selectedPlayer.name} transferred to ${selectedTeam.name} successfully`);
      setShowTransferModal(false);
      setSelectedPlayer(null);
      
    } catch (error) {
      console.error('❌ Transfer failed:', error);
      showNotification?.('error', 'Failed to process transfer');
    }
  };

  const releasePlayer = async (playerId) => {
    try {
      console.log('🔄 Releasing player:', playerId);
      
      // UPDATE PLAYER IN DATABASE TO AVAILABLE
      const updatedPlayer = await put(`players/${playerId}`, {
        currentTeam: null,
        status: 'available'
      });

      // Update local state
      setPlayers(prev => prev.map(p => 
        (p._id === playerId || p.id === playerId) ? updatedPlayer : p
      ));
      
      showNotification?.('success', 'Player released successfully');
      
    } catch (error) {
      console.error('❌ Release failed:', error);
      showNotification?.('error', 'Failed to release player');
    }
  };

  // Filter players based on search and position
  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = filterPosition === 'all' || player.position === filterPosition;
    return matchesSearch && matchesPosition;
  });

  // Categorize players
  const availablePlayers = filteredPlayers.filter(p => p.status === 'available');
  const transferredPlayers = filteredPlayers.filter(p => p.status === 'transferred');
  
  const positions = ['all', 'goalkeeper', 'defender', 'midfielder', 'forward'];

  const tabs = [
    { id: 'players', label: 'All Players', count: filteredPlayers.length },
    { id: 'available', label: 'Available', count: availablePlayers.length },
    { id: 'transferred', label: 'Transferred', count: transferredPlayers.length },
    { id: 'transfers', label: 'Transfer History', count: transfers.length }
  ];

  const getCurrentPlayers = () => {
    switch(activeTab) {
      case 'available':
        return availablePlayers;
      case 'transferred':
        return transferredPlayers;
      case 'players':
      default:
        return filteredPlayers;
    }
  };

  const currentPlayers = getCurrentPlayers();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Players & Transfer Market</h2>
              <p className="text-gray-600 mt-2">Season: {currentSeason?.name}</p>
            </div>
            <button
              onClick={onPlayerAdd || (() => setShowAddPlayer(true))}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              <span>Add Player</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4">
          <div className="flex space-x-1 mb-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Search and Filters */}
          {activeTab !== 'transfers' && (
            <div className="flex items-center space-x-4 pb-4">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search players..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter size={16} className="text-gray-400" />
                <select
                  value={filterPosition}
                  onChange={(e) => setFilterPosition(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {positions.map(pos => (
                    <option key={pos} value={pos}>
                      {pos === 'all' ? 'All Positions' : pos.charAt(0).toUpperCase() + pos.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">Loading from database...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">❌ Connection Error</div>
            <p className="text-gray-600">Make sure your Express server is running on port 3001</p>
            <button 
              onClick={loadData}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : activeTab === 'transfers' ? (
          <TransferHistory transfers={transfers} />
        ) : (
          <div>
            {currentPlayers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentPlayers.map(player => (
                  <PlayerCard
                    key={player._id || player.id}
                    player={player}
                    onTransfer={() => {
                      setSelectedPlayer(player);
                      setShowTransferModal(true);
                    }}
                    onRelease={releasePlayer}
                    onEdit={onPlayerEdit}
                    onDelete={onPlayerDelete}
                    teams={teams}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <UserPlus className="mx-auto mb-4 text-gray-400" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || filterPosition !== 'all' 
                    ? 'No players match your filters'
                    : 'No players registered yet'
                  }
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || filterPosition !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Start by registering your first player for this season'
                  }
                </p>
                {(!searchTerm && filterPosition === 'all') && (
                  <button
                    onClick={onPlayerAdd || (() => setShowAddPlayer(true))}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add First Player
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transfer Modal */}
      {showTransferModal && selectedPlayer && (
        <TransferModal
          player={selectedPlayer}
          teams={teams}
          onTransfer={transferPlayer}
          onClose={() => {
            setShowTransferModal(false);
            setSelectedPlayer(null);
          }}
        />
      )}
    </div>
  );
};

// Player Card Component
const PlayerCard = ({ player, onTransfer, onRelease, onEdit, onDelete, teams }) => {
  const playerTeam = teams.find(t => (t._id === player.currentTeam || t.id === player.currentTeam));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{player.name}</h3>
          <p className="text-sm text-gray-600">{player.position}</p>
          {player.jerseyNumber && (
            <p className="text-sm text-gray-500">#{player.jerseyNumber}</p>
          )}
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          player.status === 'available' 
            ? 'bg-green-100 text-green-800'
            : 'bg-blue-100 text-blue-800'
        }`}>
          {player.status}
        </span>
      </div>

      {playerTeam && (
        <div className="mb-3">
          <p className="text-sm text-gray-600">
            <strong>Team:</strong> {playerTeam.name}
          </p>
        </div>
      )}

      <div className="mb-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Goals: {player.stats?.goals || 0}</span>
          <span>Assists: {player.stats?.assists || 0}</span>
          <span>Matches: {player.stats?.matches || 0}</span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {player.status === 'available' && (
          <button
            onClick={() => onTransfer?.(player)}
            className="flex-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            Transfer
          </button>
        )}
        {player.status === 'transferred' && (
          <button
            onClick={() => onRelease?.(player._id || player.id)}
            className="flex-1 px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
          >
            Release
          </button>
        )}
        <button
          onClick={() => onEdit?.(player)}
          className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
        >
          <Edit size={14} />
        </button>
        <button
          onClick={() => onDelete?.(player._id || player.id)}
          className="px-3 py-1 bg-red-200 text-red-700 text-sm rounded hover:bg-red-300 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

// Transfer History Component
const TransferHistory = ({ transfers }) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Transfer History</h3>
      {transfers.length > 0 ? (
        <div className="space-y-3">
          {transfers.map(transfer => (
            <div key={transfer._id || transfer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium">{transfer.player?.name || 'Unknown Player'}</p>
                <p className="text-sm text-gray-600">
                  {transfer.fromTeam?.name || 'Free Agent'} → {transfer.toTeam?.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">${transfer.transferFee || 0}</p>
                <p className="text-xs text-gray-500">
                  {new Date(transfer.transferDate || transfer.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">No transfers yet this season</p>
      )}
    </div>
  );
};

// Transfer Modal Component
const TransferModal = ({ player, teams, onTransfer, onClose }) => {
  const [selectedTeam, setSelectedTeam] = useState('');
  const [transferFee, setTransferFee] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedTeam) return;
    
    onTransfer({
      teamId: selectedTeam,
      fee: transferFee
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Transfer {player.name}</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Team
            </label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Choose a team...</option>
              {teams.map(team => (
                <option key={team._id || team.id} value={team._id || team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transfer Fee ($)
            </label>
            <input
              type="number"
              value={transferFee}
              onChange={(e) => setTransferFee(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="0"
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Complete Transfer
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlayersTransferMarket;