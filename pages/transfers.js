// ===========================================
// FILE: pages/transfers.js (REDESIGNED - TRANSFER NEWS STYLE)
// ===========================================
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  ArrowRight, 
  Calendar, 
  User, 
  AlertCircle, 
  UserPlus, 
  UserMinus, 
  FileText, 
  Clock, 
  TrendingUp,
  Filter,
  Search,
  Zap
} from 'lucide-react';
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
  const [filter, setFilter] = useState('all');
  const [contractFilter, setContractFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
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
          let filteredData = filter === 'all' 
            ? data 
            : data.filter(t => t.transferType === filter);
            
          if (contractFilter) {
            filteredData = filteredData.filter(t => {
              if (!t.player) return false;
              return t.player.contractStatus === contractFilter;
            });
          }
            
          setTransfers(filteredData);
        } else {
          setTransfers([]);
        }
      } else {
        setError(`Server error: ${response.status}`);
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

  // Filter transfers by search term
  const filteredTransfers = transfers.filter(transfer => {
    if (!searchTerm) return true;
    const playerName = transfer.player?.name?.toLowerCase() || '';
    const fromTeam = transfer.fromTeam?.name?.toLowerCase() || '';
    const toTeam = transfer.toTeam?.name?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    
    return playerName.includes(search) || 
           fromTeam.includes(search) || 
           toTeam.includes(search);
  });

  const getTransferNewsTitle = (transfer) => {
    const playerName = transfer.player?.name || 'Unknown Player';
    
    switch (transfer.transferType) {
      case 'registration':
        return `${playerName} registers as free agent`;
      case 'transfer':
        if (transfer.fromTeam && transfer.toTeam) {
          return `${playerName} moves from ${transfer.fromTeam.name} to ${transfer.toTeam.name}`;
        }
        return `${playerName} completes transfer`;
      case 'loan':
        return `${playerName} joins ${transfer.toTeam?.name || 'new club'} on loan`;
      case 'release':
        return `${transfer.fromTeam?.name || 'Club'} releases ${playerName}`;
      default:
        return `${playerName} - Transfer Update`;
    }
  };

  const getTransferNewsSubtitle = (transfer) => {
    const timePassed = formatDistanceToNow(new Date(transfer.transferDate), { addSuffix: true });
    const fee = transfer.transferFee > 0 ? ` • MVR ${transfer.transferFee.toLocaleString()}` : '';
    const contractType = transfer.player?.contractStatus 
      ? ` • ${transfer.player.contractStatus.replace('_', ' ').toUpperCase()}`
      : '';
    
    return `${timePassed}${fee}${contractType}`;
  };

  const getTransferTypeColor = (type) => {
    switch (type) {
      case 'registration': return 'text-emerald-600 bg-emerald-50';
      case 'transfer': return 'text-blue-600 bg-blue-50';
      case 'loan': return 'text-amber-600 bg-amber-50';
      case 'release': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTransferTypeIcon = (type) => {
    switch (type) {
      case 'registration': return <UserPlus className="w-4 h-4" />;
      case 'transfer': return <ArrowRight className="w-4 h-4" />;
      case 'loan': return <Clock className="w-4 h-4" />;
      case 'release': return <UserMinus className="w-4 h-4" />;
      default: return <ArrowRight className="w-4 h-4" />;
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
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              Transfer News
            </h1>
            <p className="text-gray-600 mt-1">Latest player movements and market activity</p>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-lg transition-colors ${showFilters ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search players, teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="form-input"
              >
                <option value="all">All Types</option>
                <option value="registration">New Registrations</option>
                <option value="transfer">Transfers</option>
                <option value="loan">Loans</option>
                <option value="release">Releases</option>
              </select>
              
              <select
                value={contractFilter}
                onChange={(e) => setContractFilter(e.target.value)}
                className="form-input"
              >
                <option value="">All Contracts</option>
                <option value="free_agent">Free Agents</option>
                <option value="normal">Normal</option>
                <option value="seasonal">Seasonal</option>
              </select>
              
              {seasons.length > 0 && (
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className="form-input"
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
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-800">Failed to Load Transfer News</h3>
              <p className="text-red-700">{error}</p>
              <button 
                onClick={fetchTransfers}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer News Feed */}
      <div className="space-y-4">
        {filteredTransfers.length > 0 ? (
          filteredTransfers.map((transfer, index) => {
            const isRecent = new Date() - new Date(transfer.transferDate) < 24 * 60 * 60 * 1000; // 24 hours
            
            return (
              <div key={transfer._id} className={`bg-white border rounded-lg hover:shadow-md transition-shadow ${
                isRecent ? 'ring-2 ring-blue-100' : 'border-gray-200'
              }`}>
                {isRecent && (
                  <div className="bg-blue-50 px-4 py-2 border-b border-blue-100 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Breaking News</span>
                  </div>
                )}
                
                <div className="p-4 space-y-4">
                  {/* News Header */}
                  <div className="flex items-start gap-4">
                    {/* Transfer Type Badge */}
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${getTransferTypeColor(transfer.transferType)}`}>
                      {getTransferTypeIcon(transfer.transferType)}
                      {transfer.transferType?.toUpperCase()}
                    </div>
                    
                    {transfer.transferFee > 0 && (
                      <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-full text-sm font-medium">
                        💰 MVR {transfer.transferFee.toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Main News Content */}
                  <div className="space-y-3">
                    <h2 className="text-lg md:text-xl font-bold text-gray-900 leading-snug">
                      {getTransferNewsTitle(transfer)}
                    </h2>
                    
                    <p className="text-sm text-gray-600">
                      {getTransferNewsSubtitle(transfer)}
                    </p>

                    {/* Player and Team Visual */}
                    <div className="flex items-center gap-4">
                      {/* Player Info */}
                      <div className="flex items-center gap-3">
                        {transfer.player && getImageUrl(transfer.player.photo) ? (
                          <Image
                            src={getImageUrl(transfer.player.photo)}
                            alt={transfer.player.name}
                            width={48}
                            height={48}
                            className="rounded-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        
                        <div className={`w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center ${
                          transfer.player && getImageUrl(transfer.player.photo) ? 'hidden' : 'flex'
                        }`}>
                          <User className="w-6 h-6 text-gray-400" />
                        </div>
                        
                        <div>
                          <p className="font-semibold text-gray-900">
                            {transfer.player?.name || 'Unknown Player'}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>{transfer.player?.position || 'Player'}</span>
                            {transfer.player?.contractStatus && (
                              <>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                  {transfer.player.contractStatus === 'free_agent' ? (
                                    <User className="w-3 h-3" />
                                  ) : transfer.player.contractStatus === 'seasonal' ? (
                                    <Clock className="w-3 h-3" />
                                  ) : (
                                    <FileText className="w-3 h-3" />
                                  )}
                                  <span className="capitalize">
                                    {transfer.player.contractStatus.replace('_', ' ')}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Team Flow (if applicable) */}
                    {(transfer.fromTeam || transfer.toTeam) && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          {/* From Team */}
                          <div className="flex-1 text-center">
                            {transfer.fromTeam ? (
                              <div className="space-y-2">
                                {getImageUrl(transfer.fromTeam.logo) ? (
                                  <Image
                                    src={getImageUrl(transfer.fromTeam.logo)}
                                    alt={transfer.fromTeam.name}
                                    width={40}
                                    height={40}
                                    className="rounded-full mx-auto"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-gray-200 rounded-full mx-auto flex items-center justify-center">
                                    <User className="w-5 h-5 text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-gray-900 text-sm">{transfer.fromTeam.name}</p>
                                  <p className="text-xs text-gray-500">From</p>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="w-10 h-10 bg-blue-100 rounded-full mx-auto flex items-center justify-center">
                                  <UserPlus className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-blue-900 text-sm">Free Agency</p>
                                  <p className="text-xs text-blue-600">From</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Arrow */}
                          <div className="px-4">
                            <ArrowRight className="w-6 h-6 text-gray-400" />
                          </div>

                          {/* To Team */}
                          <div className="flex-1 text-center">
                            {transfer.toTeam ? (
                              <div className="space-y-2">
                                {getImageUrl(transfer.toTeam.logo) ? (
                                  <Image
                                    src={getImageUrl(transfer.toTeam.logo)}
                                    alt={transfer.toTeam.name}
                                    width={40}
                                    height={40}
                                    className="rounded-full mx-auto"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-gray-200 rounded-full mx-auto flex items-center justify-center">
                                    <User className="w-5 h-5 text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-gray-900 text-sm">{transfer.toTeam.name}</p>
                                  <p className="text-xs text-gray-500">To</p>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="w-10 h-10 bg-red-100 rounded-full mx-auto flex items-center justify-center">
                                  <UserMinus className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-red-900 text-sm">Released</p>
                                  <p className="text-xs text-red-600">To</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Transfer Notes */}
                    {transfer.notes && (
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-3">
                        <p className="text-sm text-blue-800">
                          <strong>Details:</strong> {transfer.notes}
                        </p>
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(transfer.transferDate), 'MMM dd, yyyy • h:mm a')}
                      </div>
                      {!transfer.player && (
                        <span className="text-amber-600 text-xs">⚠️ Player data missing</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📰</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Transfer News</h2>
            <p className="text-gray-500 mb-6">
              {searchTerm ? 'No transfers match your search criteria' : 'No transfer activity found for the selected filters'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quick Info Footer */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="text-blue-600 text-2xl">💡</div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Transfer Market Guide</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <p className="font-medium mb-1">Contract Types:</p>
                <p>• <strong>Free Agent:</strong> Available for immediate signing</p>
                <p>• <strong>Normal:</strong> Can transfer mid-season</p>
                <p>• <strong>Seasonal:</strong> Only transfers at season end</p>
              </div>
              <div>
                <p className="font-medium mb-1">Transfer Types:</p>
                <p>• <strong>Registration:</strong> New player joins league</p>
                <p>• <strong>Transfer:</strong> Player moves between teams</p>
                <p>• <strong>Loan:</strong> Temporary team change</p>
                <p>• <strong>Release:</strong> Player becomes free agent</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
