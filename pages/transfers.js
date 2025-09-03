import { useState, useEffect } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { ArrowRight, Calendar, DollarSign, User, AlertCircle, UserPlus, UserMinus } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Helper function to extract image URL from various formats
const getImageUrl = (imageData) => {
  if (!imageData) return null;
  
  // If it's already a string URL
  if (typeof imageData === 'string' && imageData.startsWith('http')) {
    return imageData;
  }
  
  // If it's an object with url property
  if (imageData && typeof imageData === 'object') {
    return imageData.url || imageData.secure_url || null;
  }
  
  return null;
};

export default function TransfersPage() {
  const [transfers, setTransfers] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, registration, transfer, loan, release
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSeasons();
  }, []);

  useEffect(() => {
    fetchTransfers();
  }, [selectedSeason, filter]);

  const fetchSeasons = async () => {
    try {
      const response = await fetch('/api/public/seasons');
      if (response.ok) {
        const data = await response.json();
        setSeasons(Array.isArray(data) ? data : []);
        
        const activeSeason = data.find(s => s.isActive);
        if (activeSeason) {
          setSelectedSeason(activeSeason._id);
        }
      }
    } catch (error) {
      console.error('Error fetching seasons:', error);
      setSeasons([]);
    }
  };

  const fetchTransfers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let url = '/api/public/transfers?limit=50';
      if (selectedSeason) url += `&seasonId=${selectedSeason}`;
      
      console.log('Fetching transfers from:', url);
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        
        console.log('Transfers fetch result:', data);
        
        if (Array.isArray(data)) {
          // Filter by transfer type if needed
          const filteredData = filter === 'all' 
            ? data 
            : data.filter(t => t.transferType === filter);
            
          setTransfers(filteredData);
          console.log(`Loaded ${filteredData.length} transfers`);
        } else {
          console.error('Transfers data is not an array:', data);
          setTransfers([]);
        }
      } else {
        console.error('Failed to fetch transfers:', response.status, response.statusText);
        
        // Try to get error details
        try {
          const errorData = await response.text();
          console.error('Error response:', errorData);
          setError(`Server error: ${response.status}`);
        } catch (e) {
          console.error('Could not parse error response');
          setError('Failed to load transfers');
        }
        
        setTransfers([]);
      }
    } catch (error) {
      console.error('Error fetching transfers:', error);
      setError('Network error: Could not connect to server');
      setTransfers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getTransferTypeColor = (type) => {
    switch (type) {
      case 'registration': return 'bg-green-100 text-green-800';
      case 'transfer': return 'bg-blue-100 text-blue-800';
      case 'loan': return 'bg-yellow-100 text-yellow-800';
      case 'release': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransferTypeIcon = (type) => {
    switch (type) {
      case 'registration': return '🆕';
      case 'transfer': return '🔄';
      case 'loan': return '📋';
      case 'release': return '🔓';
      default: return '➡️';
    }
  };

  // Helper function to determine transfer direction and create description
  const getTransferInfo = (transfer) => {
    const playerName = transfer.player?.name || 'Unknown Player';
    
    if (!transfer.fromTeam && transfer.toTeam) {
      // Joining from free agency
      return {
        description: `${playerName} joined ${transfer.toTeam.name}`,
        direction: 'incoming',
        type: 'joining'
      };
    } else if (transfer.fromTeam && !transfer.toTeam) {
      // Released to free agency
      return {
        description: `${playerName} released from ${transfer.fromTeam.name}`,
        direction: 'outgoing', 
        type: 'release'
      };
    } else if (transfer.fromTeam && transfer.toTeam) {
      // Team to team transfer
      return {
        description: `${playerName} transferred from ${transfer.fromTeam.name} to ${transfer.toTeam.name}`,
        direction: 'transfer',
        type: 'transfer'
      };
    } else {
      // Initial registration as free agent
      return {
        description: `${playerName} registered as free agent`,
        direction: 'registration',
        type: 'registration'
      };
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <h1 className="text-3xl font-bold text-gray-900">Transfer Market</h1>
        
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          {/* Transfer Type Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="form-input w-48"
          >
            <option value="all">All Transfers</option>
            <option value="registration">New Registrations</option>
            <option value="transfer">Team Transfers</option>
            <option value="loan">Loans</option>
            <option value="release">Releases</option>
          </select>
          
          {/* Season Filter */}
          {seasons.length > 0 && (
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="form-input w-48"
            >
              <option value="">All Seasons</option>
              {seasons.map(season => (
                <option key={season._id} value={season._id}>
                  {season.name} {season.isActive && '(Active)'}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="card bg-red-50 border border-red-200">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-800">Failed to Load Transfers</h3>
              <p className="text-red-700">{error}</p>
              <button 
                onClick={fetchTransfers}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Statistics */}
      {transfers.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card text-center">
            <div className="text-2xl mb-2">🆕</div>
            <h3 className="text-2xl font-bold text-green-600">
              {transfers.filter(t => t.transferType === 'registration').length}
            </h3>
            <p className="text-gray-600">Registrations</p>
          </div>
          
          <div className="card text-center">
            <div className="text-2xl mb-2">🔄</div>
            <h3 className="text-2xl font-bold text-blue-600">
              {transfers.filter(t => t.transferType === 'transfer').length}
            </h3>
            <p className="text-gray-600">Transfers</p>
          </div>
          
          <div className="card text-center">
            <div className="text-2xl mb-2">📋</div>
            <h3 className="text-2xl font-bold text-yellow-600">
              {transfers.filter(t => t.transferType === 'loan').length}
            </h3>
            <p className="text-gray-600">Loans</p>
          </div>
          
          <div className="card text-center">
            <div className="text-2xl mb-2">🔓</div>
            <h3 className="text-2xl font-bold text-red-600">
              {transfers.filter(t => t.transferType === 'release').length}
            </h3>
            <p className="text-gray-600">Releases</p>
          </div>
          
          <div className="card text-center">
            <DollarSign className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-purple-600">
              MVR {transfers.reduce((sum, t) => sum + (t.transferFee || 0), 0).toLocaleString()}
            </h3>
            <p className="text-gray-600">Total Value</p>
          </div>
        </div>
      )}

      {/* Transfers List */}
      <div className="card">
        <div className="space-y-4">
          {transfers.map((transfer) => {
            const transferInfo = getTransferInfo(transfer);
            
            return (
              <div key={transfer._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    {/* Player Photo */}
                    {transfer.player && getImageUrl(transfer.player.photo) ? (
                      <Image
                        src={getImageUrl(transfer.player.photo)}
                        alt={transfer.player?.name || 'Player'}
                        width={50}
                        height={50}
                        className="rounded-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    
                    {/* Fallback avatar */}
                    <div 
                      className={`w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center ${
                        transfer.player && getImageUrl(transfer.player.photo) ? 'hidden' : 'flex'
                      }`}
                    >
                      <User className="w-6 h-6 text-gray-400" />
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {transfer.player?.name || 'Unknown Player (Deleted)'}
                      </h3>
                      <p className="text-gray-600">{transfer.player?.position || 'Player'}</p>
                      <p className="text-sm text-gray-500">{transferInfo.description}</p>
                      {!transfer.player && (
                        <p className="text-red-500 text-sm">⚠️ Player data unavailable</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTransferTypeColor(transfer.transferType)}`}>
                      {getTransferTypeIcon(transfer.transferType)} {transfer.transferType?.toUpperCase() || 'TRANSFER'}
                    </span>
                    <div className="text-right">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-1" />
                        {format(new Date(transfer.transferDate), 'MMM dd, yyyy')}
                      </div>
                      {transfer.transferFee > 0 && (
                        <div className="flex items-center text-green-600 font-medium">
                          <span className="text-lg mr-1">💰</span>
                          MVR {transfer.transferFee.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-6">
                  {/* From Side */}
                  {transfer.fromTeam ? (
                    <div className="flex items-center space-x-3">
                      {getImageUrl(transfer.fromTeam.logo) ? (
                        <Image
                          src={getImageUrl(transfer.fromTeam.logo)}
                          alt={transfer.fromTeam.name}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div className="text-center">
                        <p className="font-medium text-gray-900">{transfer.fromTeam.name}</p>
                        <p className="text-sm text-gray-600">From</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <UserPlus className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="font-medium text-blue-900">Free Agency</p>
                      <p className="text-sm text-blue-600">From</p>
                    </div>
                  )}

                  <ArrowRight className="w-6 h-6 text-gray-400" />

                  {/* To Side */}
                  {transfer.toTeam ? (
                    <div className="flex items-center space-x-3">
                      {getImageUrl(transfer.toTeam.logo) ? (
                        <Image
                          src={getImageUrl(transfer.toTeam.logo)}
                          alt={transfer.toTeam.name}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div className="text-center">
                        <p className="font-medium text-gray-900">{transfer.toTeam.name}</p>
                        <p className="text-sm text-gray-600">To</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <UserMinus className="w-5 h-5 text-red-600" />
                      </div>
                      <p className="font-medium text-red-900">Free Agency</p>
                      <p className="text-sm text-red-600">To</p>
                    </div>
                  )}
                </div>

                {transfer.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Notes:</strong> {transfer.notes}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {transfers.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">No Transfers Found</h2>
            <p className="text-gray-500">
              No transfer activity for the selected filters.
            </p>
          </div>
        )}
      </div>

      {/* Transfer Market Info */}
      <div className="card bg-blue-50 border border-blue-200">
        <div className="flex items-start space-x-4">
          <div className="text-blue-600 text-2xl">ℹ️</div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Transfer Market Rules</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• All players must be registered before joining a team</li>
              <li>• Players can be released to free agency at any time</li>
              <li>• Free agents can join any team during transfer windows</li>
              <li>• Transfer windows are managed by season administrators</li>
              <li>• Loan transfers are temporary and players return after the season</li>
              <li>• Transfer fees are optional but tracked for records</li>
              <li>• All transfers maintain complete history for transparency</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
