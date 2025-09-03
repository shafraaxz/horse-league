// ===========================================
// FILE: pages/players/[id].js (UPDATED WITH CONTRACT INFORMATION)
// ===========================================
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { 
  User, 
  Trophy, 
  Target, 
  Calendar, 
  MapPin, 
  Mail, 
  Phone, 
  Users,
  TrendingUp,
  Award,
  Activity,
  Clock,
  Heart,
  Shield,
  ChevronRight,
  FileText,
  AlertCircle
} from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { format } from 'date-fns';
import { calculateAge } from '../../lib/utils';

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

export default function PlayerProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [player, setPlayer] = useState(null);
  const [playerMatches, setPlayerMatches] = useState([]);
  const [playerTransfers, setPlayerTransfers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      fetchPlayerData();
    }
  }, [id]);

  const fetchPlayerData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch player details from public API (no private data)
      const playerResponse = await fetch(`/api/public/players?search=${id}`);
      if (playerResponse.ok) {
        const playersData = await playerResponse.json();
        const foundPlayer = Array.isArray(playersData) ? 
          playersData.find(p => p._id === id) : null;
        
        if (foundPlayer) {
          setPlayer(foundPlayer);
          console.log('Player profile data:', foundPlayer);
        } else {
          // Try alternative API endpoint
          const altResponse = await fetch(`/api/players/${id}`);
          if (altResponse.ok) {
            const playerData = await altResponse.json();
            setPlayer(playerData);
          }
        }
      }

      // Fetch player's matches (if available)
      try {
        const matchesResponse = await fetch(`/api/public/matches?playerId=${id}&limit=10`);
        if (matchesResponse.ok) {
          const matchesData = await matchesResponse.json();
          setPlayerMatches(Array.isArray(matchesData) ? matchesData : []);
        }
      } catch (matchError) {
        console.log('Matches not available for player');
        setPlayerMatches([]);
      }

      // Fetch player's transfer history
      try {
        const transfersResponse = await fetch(`/api/public/transfers?playerId=${id}&limit=10`);
        if (transfersResponse.ok) {
          const transfersData = await transfersResponse.json();
          setPlayerTransfers(Array.isArray(transfersData) ? transfersData : []);
        }
      } catch (transferError) {
        console.log('Transfer history not available');
        setPlayerTransfers([]);
      }

    } catch (error) {
      console.error('Error fetching player data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPositionIcon = (position) => {
    if (position === 'Goalkeeper') return <Shield className="w-5 h-5 text-blue-600" />;
    return <Users className="w-5 h-5 text-green-600" />;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'injured': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
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
      case 'normal': return <FileText className="w-4 h-4" />;
      case 'seasonal': return <Clock className="w-4 h-4" />;
      case 'free_agent': return <User className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Player Not Found</h2>
        <p className="text-gray-600 mb-4">The player you're looking for doesn't exist.</p>
        <Link href="/players" className="btn btn-primary">
          Back to Players
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Player Header */}
      <div className="card">
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
          <div className="flex items-center space-x-6">
            {getImageUrl(player.photo) ? (
              <Image
                src={getImageUrl(player.photo)}
                alt={player.name}
                width={120}
                height={120}
                className="rounded-full object-cover border-4 border-gray-200"
                onError={(e) => {
                  console.error('Player profile photo failed:', player.photo);
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) {
                    e.target.nextSibling.style.display = 'flex';
                  }
                }}
              />
            ) : null}
            
            <div 
              className={`w-30 h-30 bg-gray-200 rounded-full flex items-center justify-center border-4 border-gray-200 ${
                getImageUrl(player.photo) ? 'hidden' : 'flex'
              }`}
            >
              <User className="w-16 h-16 text-gray-400" />
            </div>

            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{player.name}</h1>
                {player.jerseyNumber && (
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold text-lg">
                    #{player.jerseyNumber}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-4 mb-3">
                {player.position && (
                  <div className="flex items-center space-x-2">
                    {getPositionIcon(player.position)}
                    <span className="font-medium">{player.position}</span>
                  </div>
                )}
                
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(player.status)}`}>
                  {player.status?.charAt(0).toUpperCase() + player.status?.slice(1)}
                </span>

                {/* NEW: Contract Status Display */}
                {player.contractStatus && (
                  <div className="flex items-center space-x-1">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${
                      getContractStatusColor(player.contractStatus)
                    }`}>
                      {getContractStatusIcon(player.contractStatus)}
                      <span>
                        {player.contractStatus === 'free_agent' ? 'Free Agent' :
                         player.contractStatus === 'normal' ? 'Normal Contract' :
                         player.contractStatus === 'seasonal' ? 'Seasonal Contract' : 
                         'Unknown'}
                      </span>
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-6 text-gray-600">
                {player.dateOfBirth && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Age {calculateAge(player.dateOfBirth)}</span>
                  </div>
                )}
                
                {player.nationality && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{player.nationality}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{player.currentTeam?.name || 'Free Agent'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex-1">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{player.stats?.goals || 0}</div>
                <div className="text-gray-600 text-sm">Goals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{player.stats?.assists || 0}</div>
                <div className="text-gray-600 text-sm">Assists</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{player.stats?.matchesPlayed || 0}</div>
                <div className="text-gray-600 text-sm">Matches</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{(player.stats?.yellowCards || 0) + (player.stats?.redCards || 0)}</div>
                <div className="text-gray-600 text-sm">Cards</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: User },
            { id: 'contract', name: 'Contract', icon: FileText }, // NEW: Contract tab
            { id: 'stats', name: 'Statistics', icon: TrendingUp },
            { id: 'matches', name: 'Match History', icon: Calendar },
            { id: 'transfers', name: 'Transfer History', icon: Activity },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Player Information */}
            <div className="lg:col-span-1">
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Player Information</h3>
                <div className="space-y-4">
                  {player.dateOfBirth && (
                    <div>
                      <div className="text-sm text-gray-600">Date of Birth</div>
                      <div className="font-medium">
                        {format(new Date(player.dateOfBirth), 'MMM dd, yyyy')} 
                        <span className="text-gray-500 ml-2">({calculateAge(player.dateOfBirth)} years)</span>
                      </div>
                    </div>
                  )}
                  
                  {player.nationality && (
                    <div>
                      <div className="text-sm text-gray-600">Nationality</div>
                      <div className="font-medium">{player.nationality}</div>
                    </div>
                  )}
                  
                  {player.height && (
                    <div>
                      <div className="text-sm text-gray-600">Height</div>
                      <div className="font-medium">{player.height} cm</div>
                    </div>
                  )}
                  
                  {player.weight && (
                    <div>
                      <div className="text-sm text-gray-600">Weight</div>
                      <div className="font-medium">{player.weight} kg</div>
                    </div>
                  )}
                  
                  <div>
                    <div className="text-sm text-gray-600">Status</div>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(player.status)}`}>
                      {player.status?.charAt(0).toUpperCase() + player.status?.slice(1)}
                    </span>
                  </div>

                  {/* NEW: Contract Status Overview */}
                  <div>
                    <div className="text-sm text-gray-600">Contract Status</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        getContractStatusColor(player.contractStatus)
                      }`}>
                        {getContractStatusIcon(player.contractStatus)}
                        <span className="ml-1">
                          {player.contractStatus === 'free_agent' ? 'Free Agent' :
                           player.contractStatus === 'normal' ? 'Normal' :
                           player.contractStatus === 'seasonal' ? 'Seasonal' : 
                           'Unknown'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Team */}
              {player.currentTeam && (
                <div className="card mt-6">
                  <h3 className="text-lg font-semibold mb-4">Current Team</h3>
                  <Link href={`/teams/${player.currentTeam._id}`}>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                      {getImageUrl(player.currentTeam.logo) && (
                        <Image
                          src={getImageUrl(player.currentTeam.logo)}
                          alt={player.currentTeam.name}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{player.currentTeam.name}</div>
                        {player.jerseyNumber && (
                          <div className="text-sm text-gray-600">Jersey #{player.jerseyNumber}</div>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Career Highlights */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Goals & Assists */}
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-green-600" />
                    Attacking Stats
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Goals</span>
                      <span className="font-bold text-green-600 text-lg">{player.stats?.goals || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Assists</span>
                      <span className="font-bold text-blue-600 text-lg">{player.stats?.assists || 0}</span>
                    </div>
                    <div className="flex justify-between items-center border-t pt-3">
                      <span className="text-gray-600">Goal Contributions</span>
                      <span className="font-bold text-purple-600 text-lg">
                        {(player.stats?.goals || 0) + (player.stats?.assists || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Discipline */}
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Award className="w-5 h-5 mr-2 text-yellow-600" />
                    Discipline
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Yellow Cards</span>
                      <span className="font-bold text-yellow-600 text-lg">{player.stats?.yellowCards || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Red Cards</span>
                      <span className="font-bold text-red-600 text-lg">{player.stats?.redCards || 0}</span>
                    </div>
                    <div className="flex justify-between items-center border-t pt-3">
                      <span className="text-gray-600">Total Cards</span>
                      <span className="font-bold text-gray-900 text-lg">
                        {(player.stats?.yellowCards || 0) + (player.stats?.redCards || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="card mt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-purple-600" />
                  Performance Metrics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">{player.stats?.matchesPlayed || 0}</div>
                    <div className="text-sm text-gray-600">Matches</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                      {player.stats?.matchesPlayed > 0 ? 
                        ((player.stats?.goals || 0) / player.stats.matchesPlayed).toFixed(2) : 
                        '0.00'
                      }
                    </div>
                    <div className="text-sm text-gray-600">Goals/Match</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">
                      {player.stats?.minutesPlayed || 0}
                    </div>
                    <div className="text-sm text-gray-600">Minutes</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-yellow-600">
                      {player.stats?.matchesPlayed > 0 ? 
                        Math.round((player.stats?.minutesPlayed || 0) / player.stats.matchesPlayed) : 
                        0
                      }
                    </div>
                    <div className="text-sm text-gray-600">Avg Min/Match</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NEW: Contract Tab */}
        {activeTab === 'contract' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Current Contract */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Current Contract Status
              </h3>
              
              {player.contractStatus === 'free_agent' ? (
                <div className="text-center py-8">
                  <User className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-green-800 mb-2">Free Agent</h4>
                  <p className="text-green-600">
                    This player is currently available for signing by any team.
                  </p>
                </div>
              ) : player.currentContract ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium text-blue-900">Contract Type:</span>
                    <div className="flex items-center space-x-2">
                      {getContractStatusIcon(player.currentContract.contractType)}
                      <span className="font-semibold capitalize">
                        {player.currentContract.contractType}
                      </span>
                    </div>
                  </div>
                  
                  {player.currentContract.team && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Team:</span>
                      <span className="font-semibold">{player.currentContract.team.name}</span>
                    </div>
                  )}
                  
                  {player.currentContract.season && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Season:</span>
                      <span className="font-semibold">
                        {player.currentContract.season.name}
                        {player.currentContract.season.isActive && (
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Active
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  
                  {player.currentContract.startDate && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Start Date:</span>
                      <span className="font-semibold">
                        {format(new Date(player.currentContract.startDate), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  )}
                  
                  {player.currentContract.endDate ? (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">End Date:</span>
                      <span className="font-semibold">
                        {format(new Date(player.currentContract.endDate), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">Contract Duration:</span>
                      <span className="font-semibold text-blue-600">Open-ended</span>
                    </div>
                  )}
                  
                  {player.currentContract.contractValue > 0 && (
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="font-medium text-green-800">Contract Value:</span>
                      <span className="font-bold text-green-600">
                        MVR {player.currentContract.contractValue.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No contract information available</p>
                </div>
              )}
            </div>

            {/* Transfer Eligibility */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-purple-600" />
                Transfer Eligibility
              </h3>
              
              <div className="space-y-4">
                {player.contractStatus === 'free_agent' ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-semibold text-green-800">Transfer Available</span>
                    </div>
                    <p className="text-green-700 text-sm">
                      Player can join any team at any time during transfer windows.
                    </p>
                  </div>
                ) : player.contractStatus === 'normal' ? (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="font-semibold text-blue-800">Mid-Season Transfer Allowed</span>
                    </div>
                    <p className="text-blue-700 text-sm">
                      Normal contract allows transfers during the season with team agreement.
                    </p>
                  </div>
                ) : player.contractStatus === 'seasonal' ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="font-semibold text-yellow-800">Season-End Transfer Only</span>
                    </div>
                    <p className="text-yellow-700 text-sm">
                      Seasonal contract restricts transfers until the current season ends.
                    </p>
                    {player.currentContract?.season?.isActive && (
                      <p className="text-yellow-600 text-xs mt-2">
                        Current season is still active - transfers blocked.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                      <span className="font-semibold text-gray-800">Status Unknown</span>
                    </div>
                    <p className="text-gray-700 text-sm">
                      Transfer eligibility information is not available.
                    </p>
                  </div>
                )}

                {/* Contract Rules Explanation */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Contract Types Explained</h4>
                  <div className="space-y-2 text-sm text-blue-800">
                    <div className="flex items-start space-x-2">
                      <FileText className="w-4 h-4 mt-0.5 text-blue-600" />
                      <div>
                        <strong>Normal Contract:</strong> Allows mid-season transfers with mutual agreement
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Clock className="w-4 h-4 mt-0.5 text-purple-600" />
                      <div>
                        <strong>Seasonal Contract:</strong> Player committed until season ends
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <User className="w-4 h-4 mt-0.5 text-green-600" />
                      <div>
                        <strong>Free Agent:</strong> Available for signing by any team
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Career Stats */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Career Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Total Matches</span>
                  <span className="font-bold text-blue-600">{player.stats?.matchesPlayed || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Total Goals</span>
                  <span className="font-bold text-green-600">{player.stats?.goals || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Total Assists</span>
                  <span className="font-bold text-blue-600">{player.stats?.assists || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Minutes Played</span>
                  <span className="font-bold text-purple-600">{player.stats?.minutesPlayed || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Yellow Cards</span>
                  <span className="font-bold text-yellow-600">{player.stats?.yellowCards || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Red Cards</span>
                  <span className="font-bold text-red-600">{player.stats?.redCards || 0}</span>
                </div>
              </div>
            </div>

            {/* Averages */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Per Match Averages</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Goals per Match</span>
                  <span className="font-bold text-green-600">
                    {player.stats?.matchesPlayed > 0 ? 
                      ((player.stats?.goals || 0) / player.stats.matchesPlayed).toFixed(2) : 
                      '0.00'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Assists per Match</span>
                  <span className="font-bold text-blue-600">
                    {player.stats?.matchesPlayed > 0 ? 
                      ((player.stats?.assists || 0) / player.stats.matchesPlayed).toFixed(2) : 
                      '0.00'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Minutes per Match</span>
                  <span className="font-bold text-purple-600">
                    {player.stats?.matchesPlayed > 0 ? 
                      Math.round((player.stats?.minutesPlayed || 0) / player.stats.matchesPlayed) : 
                      0
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Goal Contributions</span>
                  <span className="font-bold text-indigo-600">
                    {player.stats?.matchesPlayed > 0 ? 
                      (((player.stats?.goals || 0) + (player.stats?.assists || 0)) / player.stats.matchesPlayed).toFixed(2) : 
                      '0.00'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-6">Team Match History</h3>
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> Currently showing matches from {player.currentTeam?.name || "the player's team"}. 
                Individual player participation tracking is not yet implemented.
              </p>
            </div>
            {playerMatches.length > 0 ? (
              <div className="space-y-4">
                {playerMatches.map((match, index) => {
                  const isPlayerTeamHome = match.homeTeam?._id === player.currentTeam?._id;
                  const teamScore = isPlayerTeamHome ? match.homeScore : match.awayScore;
                  const opponentScore = isPlayerTeamHome ? match.awayScore : match.homeScore;
                  const opponent = isPlayerTeamHome ? match.awayTeam : match.homeTeam;
                  
                  let result = '';
                  let resultColor = '';
                  if (match.status ===
