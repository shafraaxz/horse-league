// ===========================================
// FILE: pages/transfers.js (UPDATED WITH CONTRACT STATUS DISPLAY)
// ===========================================
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { ArrowRight, Calendar, User, AlertCircle, UserPlus, UserMinus, FileText, Clock } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Helper function to extract image URL from various formats
const getImageUrl = (imageData) => {
  if (!imageData) return null;
  
  if (typeof imageData === 'string' && imageData.startsWith('http')) {
    return imageData;
  }
  
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
  const [contractFilter, setContractFilter] = useState(''); // NEW: Contract type filter
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSeasons();
  }, []);

  useEffect(() => {
    fetchTransfers();
  }, [selectedSeason, filter, contractFilter]);

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
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        
        if (Array.isArray(data)) {
          // Filter by transfer type if needed
          let filteredData = filter === 'all' 
            ? data 
            : data.filter(t => t.transferType === filter);
            
          // NEW: Filter by contract type if selected
          if (contractFilter) {
            filteredData = filteredData.filter(t => {
              if (!t.player) return false;
              return t.player.contractStatus === contractFilter;
            });
          }
            
          setTransfers(filteredData);
          console.log(`Loaded ${filteredData.length} transfers`);
        } else {
          console.error('Transfers data is not an array:', data);
          setTransfers([]);
        }
      } else {
        console.error('Failed to fetch transfers:', response.status, response.statusText);
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

  // NEW: Contract status helpers
  const getContractStatusColor = (contractStatus) => {
    switch (contractStatus) {
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'seasonal': return 'bg-purple-100 text-purple-800';
      case 'free_agent': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getContractStatusIcon = (contractStatus) => {
    switch (contractStatus) {
      case 'normal': return <FileText className="w-3 h-3" />;
      case 'seasonal': return <Clock className="w-3 h-3" />;
      case 'free_agent': return <User className="w-3 h-3" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };

  // Helper function to determine transfer direction and create description
  const getTransferInfo = (transfer) => {
    const playerName = transfer.player?.name || 'Unknown Player';
    
    if (!transfer.fromTeam && transfer.toTeam) {
      return {
        description: `${playerName} joined ${transfer.toTeam.name}`,
        direction: 'incoming',
        type: 'joining'
      };
    } else if (transfer.fromTeam && !transfer.toTeam) {
      return {
        description: `${playerName} released from ${transfer.fromTeam.name}`,
        direction: 'outgoing', 
        type: 'release'
      };
    } else if (transfer.fromTeam && transfer.toTeam) {
      return {
        description: `${playerName} transferred from ${transfer.fromTeam.name} to ${transfer.toTeam.name}`,
        direction: 'transfer',
        type: 'transfer'
      };
    } else {
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
      <div className="flex flex-col space-y-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Transfer Market</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Transfer Type Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="form-input"
          >
            <option value="all">All Transfer Types</option>
            <option value="registration">New Registrations</option>
            <option value="transfer">Team Transfers</option>
            <option value="loan">Loans</option>
            <option value="release">Releases</option>
          </select>
          
          {/* NEW: Contract Status Filter */}
          <select
            value={contractFilter}
            onChange={(e) => setContractFilter(e.target.value)}
            className="form-input"
          >
            <option value="">All Contract Types</option>
            <option value="free_agent">Free Agents</option>
            <option value="normal">Normal Contracts</option>
            <option value="seasonal">Seasonal Contracts</option>
          </select>
          
          {/* Season Filter */}
          {seasons.length > 0 && (
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="form-input sm:col-span-2"
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="card text-center p-3">
            <div className="text-xl mb-1">🆕</div>
            <h3 className="text-lg sm:text-xl font-bold text-green-600">
              {transfers.filter(t => t.transferType === 'registration').length}
            </h3>
            <p className="text-gray-600 text-xs sm:text-sm">Registrations</p>
          </div>
          
          <div className="card text-center p-3">
            <div className="text-xl mb-1">🔄</div>
            <h3 className="text-lg sm:text-xl font-bold text-blue-600">
              {transfers.filter(t => t.transferType === 'transfer').length}
            </h3>
            <p className="text-gray-600 text-xs sm:text-sm">Transfers</p>
          </div>
          
          <div className="card text-center p-3">
            <div className="text-xl mb-1">📋</div>
            <h3 className="text-lg sm:text-xl font-bold text-yellow-600">
              {transfers.filter(t => t.transferType === 'loan').length}
            </h3>
            <p className="text-gray-600 text-xs sm:text-sm">Loans</p>
          </div>
          
          <div className="card text-center p-3">
            <div className="text-xl mb-1">🔓</div>
            <h3 className="text-lg sm:text-xl font-bold text-red-600">
              {transfers.filter(t => t.transferType === 'release').length}
            </h3>
            <p className="text-gray-600 text-xs sm:text-sm">Releases</p>
          </div>
          
          {/* NEW: Contract Status Stats */}
          <div className="card text-center p-3">
            <div className="text-xl mb-1">📝</div>
            <h3 className="text-lg sm:text-xl font-bold text-blue-600">
              {transfers.filter(t => t.player?.contractStatus === 'normal').length}
            </h3>
            <p className="text-gray-600 text-xs sm:text-sm">Normal</p>
          </div>
          
          <div className="card text-center p-3">
            <div className="text-xl mb-1">⏰</div>
            <h3 className="text-lg sm:text-xl font-bold text-purple-600">
              {transfers.filter(t => t.player?.contractStatus === 'seasonal').length}
            </h3>
            <p className="text-gray-600 text-xs sm:text-sm">Seasonal</p>
          </div>
        </div>
      )}

      {/* Transfers List */}
      <div className="card">
        <div className="space-y-4">
          {transfers.map((transfer) => {
            const transferInfo = getTransferInfo(transfer);
            
            return (
              <div key={transfer._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col space-y-4">
                  {/* Mobile: Top section with player info and transfer type */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      {/* Player Photo */}
                      {transfer.player && getImageUrl(transfer.player.photo) ? (
                        <Image
                          src={getImageUrl(transfer.player.photo)}
                          alt={transfer.player?.name || 'Player'}
                          width={40}
                          height={40}
                          className="rounded-full object-cover flex-shrink-0"
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
                        className={`w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 ${
                          transfer.player && getImageUrl(transfer.player.photo) ? 'hidden' : 'flex'
                        }`}
                      >
                        <User className="w-5 h-5 text-gray-400" />
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                            {transfer.player?.name || 'Unknown Player (Deleted)'}
                          </h3>
                          
                          {/* NEW: Contract Status Badge */}
                          {transfer.player?.contractStatus && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              getContractStatusColor(transfer.player.contractStatus)
                            }`}>
                              {getContractStatusIcon(transfer.player.contractStatus)}
                              <span className="ml-1">
                                {transfer.player.contractStatus === 'free_agent' ? 'FA' :
                                 transfer.player.contractStatus === 'normal' ? 'N' :
                                 transfer.player.contractStatus === 'seasonal' ? 'S' : 
                                 '?'}
                              </span>
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-600 text-xs sm:text-sm">{transfer.player?.position || 'Player'}</p>
                        <p className="text-gray-500 text-xs hidden sm:block">{transferInfo.description}</p>
                        {!transfer.player && (
                          <p className="text-red-500 text-xs">⚠️ Player data unavailable</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getTransferTypeColor(transfer.transferType)}`}>
                        {getTransferTypeIcon(transfer.transferType)} {transfer.transferType?.toUpperCase() || 'TRANSFER'}
                      </span>
                      <div className="text-right">
                        <div className="flex items-center text-gray-600 text-xs">
                          <Calendar className="w-3 h-3 mr-1" />
                          {format(new Date(transfer.transferDate), 'MMM dd')}
                        </div>
                        {transfer.transferFee > 0 && (
                          <div className="flex items-center text-green-600 font-medium text-xs">
                            <span className="text-sm mr-1">💰</span>
                            MVR {transfer.transferFee.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mobile description on small screens */}
                  <div className="sm:hidden">
                    <p className="text-gray-500 text-xs">{transferInfo.description}</p>
                  </div>

                  {/* Transfer flow visualization */}
                  <div className="flex items-center justify-center space-x-3 sm:space-x-6">
                    {/* From Side */}
                    {transfer.fromTeam ? (
                      <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 flex-1">
                        {getImageUrl(transfer.fromTeam.logo) ? (
                          <Image
                            src={getImageUrl(transfer.fromTeam.logo)}
                            alt={transfer.fromTeam.name}
                            width={32}
                            height={32}
                            className="rounded-full object-cover"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <div className="text-center sm:text-left">
                          <p className="font-medium text-gray-900 text-xs truncate max-w-20 sm:max-w-none">{transfer.fromTeam.name}</p>
                          <p className="text-gray-600 text-xs">From</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center flex-1">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1">
                          <UserPlus className="w-4 h-4 text-blue-600" />
                        </div>
                        <p className="font-medium text-blue-900 text-xs">Free Agency</p>
                        <p className="text-blue-600 text-xs">From</p>
                      </div>
                    )}

                    <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />

                    {/* To Side */}
                    {transfer.toTeam ? (
                      <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 flex-1">
                        {getImageUrl(transfer.toTeam.logo) ? (
                          <Image
                            src={getImageUrl(transfer.toTeam.logo)}
                            alt={transfer.toTeam.name}
                            width={32}
                            height={32}
                            className="rounded-full object-cover"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <div className="text-center sm:text-left">
                          <p className="font-medium text-gray-900 text-xs truncate max-w-20 sm:max-w-none">{transfer.toTeam.name}</p>
                          <p className="text-gray-600 text-xs">To</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center flex-1">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-1">
                          <UserMinus className="w-4 h-4 text-red-600" />
                        </div>
                        <p className="font-medium text-red-900 text-xs">Free Agency</p>
                        <p className="text-red-600 text-xs">To</p>
                      </div>
                    )}
                  </div>

                  {transfer.notes && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs sm:text-sm text-gray-700">
                        <strong>Notes:</strong> {transfer.notes}
                      </p>
                    </div>
                  )}
                </div>
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

      {/* Transfer Market Info - UPDATED with Contract Information */}
      <div className="card bg-blue-50 border border-blue-200">
        <div className="flex items-start space-x-4">
          <div className="text-blue-600 text-2xl">ℹ️</div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Transfer Market & Contract Rules</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-blue-800 mb-2">Transfer Rules</h4>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• All players must be registered before joining a team</li>
                  <li>• Players can be released to free agency at any time</li>
                  <li>• Free agents can join any team during transfer windows</li>
                  <li>• Transfer windows are managed by season administrators</li>
                  <li>• Transfer fees are optional but tracked for records</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-blue-800 mb-2">Contract Types</h4>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span><strong>Normal:</strong> Mid-season transfers allowed</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span><strong>Seasonal:</strong> Transfers only at season end</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span><strong>Free Agent:</strong> Available for immediate signing</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
