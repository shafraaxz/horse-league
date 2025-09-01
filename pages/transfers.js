import { useState, useEffect } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { ArrowRight, Calendar, DollarSign, User } from 'lucide-react';
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
  const [filter, setFilter] = useState('all'); // all, registration, transfer, loan

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
      let url = '/api/public/transfers?limit=50';
      if (selectedSeason) url += `&seasonId=${selectedSeason}`;
      
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
        } else {
          console.error('Transfers data is not an array:', data);
          setTransfers([]);
        }
      } else {
        console.error('Failed to fetch transfers:', response.status);
        setTransfers([]);
      }
    } catch (error) {
      console.error('Error fetching transfers:', error);
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
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransferTypeIcon = (type) => {
    switch (type) {
      case 'registration': return '🆕';
      case 'transfer': return '🔄';
      case 'loan': return '📋';
      default: return '➡️';
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
            <option value="transfer">Transfers</option>
            <option value="loan">Loans</option>
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

      {/* Transfer Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card text-center">
          <div className="text-2xl mb-2">🆕</div>
          <h3 className="text-2xl font-bold text-green-600">
            {transfers.filter(t => t.transferType === 'registration').length}
          </h3>
          <p className="text-gray-600">New Registrations</p>
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
          <DollarSign className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <h3 className="text-2xl font-bold text-purple-600">
            ${transfers.reduce((sum, t) => sum + (t.transferFee || 0), 0).toLocaleString()}
          </h3>
          <p className="text-gray-600">Total Value</p>
        </div>
      </div>

      {/* Transfers List */}
      <div className="card">
        <div className="space-y-4">
          {transfers.map((transfer) => (
            <div key={transfer._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  {getImageUrl(transfer.player?.photo) ? (
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
                      getImageUrl(transfer.player?.photo) ? 'hidden' : 'flex'
                    }`}
                  >
                    <User className="w-6 h-6 text-gray-400" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {transfer.player?.name || 'Unknown Player'}
                    </h3>
                    <p className="text-gray-600">{transfer.player?.position || 'Player'}</p>
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
                        <DollarSign className="w-4 h-4 mr-1" />
                        {transfer.transferFee.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-6">
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
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-xl">🆕</span>
                    </div>
                    <p className="font-medium text-gray-900">New Player</p>
                    <p className="text-sm text-gray-600">Registration</p>
                  </div>
                )}

                <ArrowRight className="w-6 h-6 text-gray-400" />

                <div className="flex items-center space-x-3">
                  {getImageUrl(transfer.toTeam?.logo) ? (
                    <Image
                      src={getImageUrl(transfer.toTeam.logo)}
                      alt={transfer.toTeam?.name || 'Team'}
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
                    <p className="font-medium text-gray-900">{transfer.toTeam?.name || 'Unknown Team'}</p>
                    <p className="text-sm text-gray-600">To</p>
                  </div>
                </div>
              </div>

              {transfer.notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Notes:</strong> {transfer.notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {transfers.length === 0 && (
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
