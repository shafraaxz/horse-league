// ===========================================
// FILE: pages/players/[id].js (ENHANCED PLAYER PROFILE)
// ===========================================
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { 
  User, Trophy, Target, Calendar, MapPin, Mail, Phone, Users,
  TrendingUp, Award, Activity, Clock, Heart, Shield, ChevronRight,
  FileText, AlertCircle, ArrowLeft, Share2, Star, BarChart3,
  Zap, Crown, CheckCircle, XCircle, Eye, Download
} from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { format, isToday, isTomorrow, isYesterday } from 'date-fns';
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
  const [teamPlayers, setTeamPlayers] = useState([]); // For team comparison

  useEffect(() => {
    if (id) {
      fetchPlayerData();
    }
  }, [id]);

  const fetchPlayerData = async () => {
    try {
      setIsLoading(true);
      
      // Use Promise.all for parallel requests
      const requests = [
        // Try individual player API first
        fetch(`/api/players/${id}`).catch(() => null),
        // Fallback to search in public players
        fetch(`/api/public/players?search=${id}`).catch(() => null),
        // Get player matches
        fetch(`/api/public/matches?playerId=${id}&limit=20`).catch(() => null),
        // Get player transfers
        fetch(`/api/public/transfers?playerId=${id}&limit=10`).catch(() => null)
      ];

      const [individualResponse, searchResponse, matchesResponse, transfersResponse] = await Promise.all(requests);

      // Process player data
      let foundPlayer = null;
      
      if (individualResponse && individualResponse.ok) {
        foundPlayer = await individualResponse.json();
      } else if (searchResponse && searchResponse.ok) {
        const playersData = await searchResponse.json();
        foundPlayer = Array.isArray(playersData) ? 
          playersData.find(p => p._id === id) : null;
      }

      if (foundPlayer) {
        setPlayer(foundPlayer);
        
        // Fetch team players for comparison if player has a team
        if (foundPlayer.currentTeam?._id) {
          try {
            const teamPlayersResponse = await fetch(`/api/public/players?teamId=${foundPlayer.currentTeam._id}`);
            if (teamPlayersResponse.ok) {
              const teamPlayersData = await teamPlayersResponse.json();
              setTeamPlayers(Array.isArray(teamPlayersData) ? teamPlayersData : []);
            }
          } catch (error) {
            console.log('Team players not available');
          }
        }
      }

      // Process matches data
      if (matchesResponse && matchesResponse.ok) {
        const matchesData = await matchesResponse.json();
        setPlayerMatches(Array.isArray(matchesData) ? matchesData : []);
      }

      // Process transfers data
      if (transfersResponse && transfersResponse.ok) {
        const transfersData = await transfersResponse.json();
        setPlayerTransfers(Array.isArray(transfersData) ? transfersData : []);
      }

    } catch (error) {
      console.error('Error fetching player data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced helper functions
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

  const getContractStatusColor = (contractStatus) => {
    switch (contractStatus) {
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'seasonal': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'free_agent': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const getPerformanceRating = () => {
    if (!player?.careerStats) return { rating: 'No Data', color: 'text-gray-500', icon: AlertCircle };
    
    const goals = player.careerStats.goals || 0;
    const assists = player.careerStats.assists || 0;
    const matches = player.careerStats.appearances || 1;
    
    const goalsPerMatch = goals / matches;
    const assistsPerMatch = assists / matches;
    const contribution = goalsPerMatch + assistsPerMatch;
    
    if (contribution >= 1.0) return { rating: 'World Class', color: 'text-purple-600', icon: Crown };
    if (contribution >= 0.7) return { rating: 'Excellent', color: 'text-green-600', icon: Star };
    if (contribution >= 0.4) return { rating: 'Good', color: 'text-blue-600', icon: TrendingUp };
    if (contribution >= 0.2) return { rating: 'Average', color: 'text-yellow-600', icon: Activity };
    return { rating: 'Developing', color: 'text-gray-600', icon: Zap };
  };

  const getTeamRanking = () => {
    if (!teamPlayers.length || !player) return null;
    
    const sortedByGoals = [...teamPlayers].sort((a, b) => 
      (b.careerStats?.goals || 0) - (a.careerStats?.goals || 0)
    );
    
    const goalsRank = sortedByGoals.findIndex(p => p._id === player._id) + 1;
    
    const sortedByAssists = [...teamPlayers].sort((a, b) => 
      (b.careerStats?.assists || 0) - (a.careerStats?.assists || 0)
    );
    
    const assistsRank = sortedByAssists.findIndex(p => p._id === player._id) + 1;
    
    return { goalsRank, assistsRank, totalPlayers: teamPlayers.length };
  };

  const formatMatchDate = (dateString) => {
    const date = new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM dd');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 mt-4 text-lg">Loading player profile...</p>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="text-center py-16">
        <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Player Not Found</h2>
        <p className="text-gray-600 mb-6">The player you're looking for doesn't exist.</p>
        <Link href="/players" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
          Back to Players
        </Link>
      </div>
    );
  }

  const performanceRating = getPerformanceRating();
  const teamRanking = getTeamRanking();

  return (
    <div className="space-y-8">
      {/* Enhanced Header with Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            href="/players" 
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Players
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900 font-medium">{player.name}</span>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </button>
          <button className="flex items-center bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Enhanced Player Header */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
          <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-8">
            <div className="flex items-center space-x-6">
              <div className="relative">
                {getImageUrl(player.photo) ? (
                  <Image
                    src={getImageUrl(player.photo)}
                    alt={player.name}
                    width={140}
                    height={140}
                    className="rounded-full object-cover border-4 border-white/20"
                  />
                ) : (
                  <div className="w-35 h-35 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/20">
                    <User className="w-20 h-20 text-white/70" />
                  </div>
                )}
                
                {/* Jersey Number Badge */}
                {player.jerseyNumber && (
                  <div className="absolute -bottom-2 -right-2 bg-white text-blue-600 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                    #{player.jerseyNumber}
                  </div>
                )}
                
                {/* Performance Rating Badge */}
                <div className={`absolute -top-2 -left-2 px-3 py-1 rounded-full bg-white text-xs font-bold ${performanceRating.color}`}>
                  <performanceRating.icon className="w-3 h-3 inline mr-1" />
                  {performanceRating.rating}
                </div>
              </div>

              <div>
                <h1 className="text-4xl font-bold mb-2">{player.name}</h1>
                <div className="flex items-center space-x-4 text-white/80 mb-3">
                  {player.position && (
                    <div className="flex items-center space-x-2">
                      {getPositionIcon(player.position)}
                      <span>{player.position}</span>
                    </div>
                  )}
                  
                  {player.dateOfBirth && (
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Age {calculateAge(player.dateOfBirth)}</span>
                    </span>
                  )}
                  
                  {player.nationality && (
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{player.nationality}</span>
                    </span>
                  )}
                </div>

                {/* Contract Status */}
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    getContractStatusColor(player.contractStatus)
                  }`}>
                    {getContractStatusIcon(player.contractStatus)}
                    <span className="ml-1">
                      {player.contractStatus === 'free_agent' ? 'Free Agent' :
                       player.contractStatus === 'normal' ? 'Normal Contract' :
                       player.contractStatus === 'seasonal' ? 'Seasonal Contract' : 
                       'Unknown Status'}
                    </span>
                  </span>
                  
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(player.status)}`}>
                    {player.status?.charAt(0).toUpperCase() + player.status?.slice(1) || 'Active'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{player.careerStats?.goals || 0}</div>
                <div className="text-white/70 text-sm">Goals</div>
                {teamRanking && (
                  <div className="text-xs text-white/60">#{teamRanking.goalsRank} in team</div>
                )}
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{player.careerStats?.assists || 0}</div>
                <div className="text-white/70 text-sm">Assists</div>
                {teamRanking && (
                  <div className="text-xs text-white/60">#{teamRanking.assistsRank} in team</div>
                )}
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{player.careerStats?.appearances || 0}</div>
                <div className="text-white/70 text-sm">Matches</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {((player.careerStats?.goals || 0) + (player.careerStats?.assists || 0))}
                </div>
                <div className="text-white/70 text-sm">Contributions</div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Team Section */}
        {player.currentTeam && (
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold mb-3">Current Team</h3>
            <Link href={`/teams/${player.currentTeam._id}`}>
              <div className="flex items-center space-x-4 p-4 bg-white rounded-lg hover:shadow-md transition-all cursor-pointer group">
                {getImageUrl(player.currentTeam.logo) && (
                  <Image
                    src={getImageUrl(player.currentTeam.logo)}
                    alt={player.currentTeam.name}
                    width={60}
                    height={60}
                    className="rounded-full object-cover"
                  />
                )}
                <div className="flex-1">
                  <div className="font-bold text-xl text-gray-900 group-hover:text-blue-600 transition-colors">
                    {player.currentTeam.name}
                  </div>
                  <div className="text-gray-600">
                    {player.jerseyNumber && `Jersey #${player.jerseyNumber} • `}
                    {player.currentTeam.season?.name || 'Current Season'}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* Enhanced Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <nav className="flex space-x-0">
          {[
            { id: 'overview', name: 'Overview', icon: User },
            { id: 'contract', name: 'Contract', icon: FileText },
            { id: 'stats', name: 'Statistics', icon: BarChart3 },
            { id: 'matches', name: `Matches (${playerMatches.length})`, icon: Calendar },
            { id: 'transfers', name: `Transfers (${playerTransfers.length})`, icon: Activity },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center py-4 px-6 font-medium text-sm transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Enhanced Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Player Information */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  Player Information
                </h3>
                <div className="space-y-4">
                  {player.dateOfBirth && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Date of Birth</span>
                      <div className="text-right">
                        <div className="font-medium">
                          {format(new Date(player.dateOfBirth), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {calculateAge(player.dateOfBirth)} years old
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {player.nationality && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Nationality</span>
                      <span className="font-medium">{player.nationality}</span>
                    </div>
                  )}
                  
                  {player.height && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Height</span>
                      <span className="font-medium">{player.height} cm</span>
                    </div>
                  )}
                  
                  {player.weight && (
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Weight</span>
                      <span className="font-medium">{player.weight} kg</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Status</span>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(player.status)}`}>
                      {player.status?.charAt(0).toUpperCase() + player.status?.slice(1) || 'Active'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Performance</span>
                    <div className="flex items-center space-x-2">
                      <performanceRating.icon className={`w-4 h-4 ${performanceRating.color}`} />
                      <span className={`font-medium ${performanceRating.color}`}>
                        {performanceRating.rating}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Comparison */}
              {teamRanking && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
                    Team Rankings
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <span className="text-gray-700">Goals Ranking</span>
                      <span className="font-bold text-yellow-600">
                        #{teamRanking.goalsRank} of {teamRanking.totalPlayers}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-gray-700">Assists Ranking</span>
                      <span className="font-bold text-blue-600">
                        #{teamRanking.assistsRank} of {teamRanking.totalPlayers}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Performance Metrics */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Attacking Stats */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-green-600" />
                    Attacking Stats
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-gray-700">Goals</span>
                      <span className="font-bold text-green-600 text-xl">{player.careerStats?.goals || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-gray-700">Assists</span>
                      <span className="font-bold text-blue-600 text-xl">{player.careerStats?.assists || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="text-gray-700">Contributions</span>
                      <span className="font-bold text-purple-600 text-xl">
                        {(player.careerStats?.goals || 0) + (player.careerStats?.assists || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Discipline & Performance */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center">
                    <Award className="w-5 h-5 mr-2 text-yellow-600" />
                    Discipline
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <span className="text-gray-700">Yellow Cards</span>
                      <span className="font-bold text-yellow-600 text-xl">{player.careerStats?.yellowCards || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="text-gray-700">Red Cards</span>
                      <span className="font-bold text-red-600 text-xl">{player.careerStats?.redCards || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Fair Play Score</span>
                      <span className="font-bold text-gray-600">
                        {((player.careerStats?.appearances || 1) - (player.careerStats?.yellowCards || 0) - ((player.careerStats?.redCards || 0) * 2)).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Metrics */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
                  Performance Metrics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{player.careerStats?.appearances || 0}</div>
                    <div className="text-sm text-blue-700">Total Matches</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {player.careerStats?.appearances > 0 ? 
                        ((player.careerStats?.goals || 0) / player.careerStats.appearances).toFixed(2) : 
                        '0.00'
                      }
                    </div>
                    <div className="text-sm text-green-700">Goals/Match</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {player.careerStats?.minutesPlayed || 0}
                    </div>
                    <div className="text-sm text-purple-700">Minutes</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {player.careerStats?.appearances > 0 ? 
                        Math.round((player.careerStats?.minutesPlayed || 0) / player.careerStats.appearances) : 
                        0
                      }
                    </div>
                    <div className="text-sm text-yellow-700">Avg Minutes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Contract Tab */}
        {activeTab === 'contract' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contract Status */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Contract Information
              </h3>
              
              {player.contractStatus === 'free_agent' ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-10 h-10 text-green-600" />
                  </div>
                  <h4 className="text-2xl font-bold text-green-800 mb-2">Free Agent</h4>
                  <p className="text-green-600 mb-4">
                    This player is currently available for signing by any team.
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-800">Available for Transfer</span>
                    </div>
                  </div>
                </div>
              ) : player.currentContract ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-blue-900">Contract Type</span>
                      <div className="flex items-center space-x-2">
                        {getContractStatusIcon(player.currentContract.contractType)}
                        <span className="font-bold text-blue-800 capitalize">
                          {player.currentContract.contractType}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {player.currentContract.team && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">Team</span>
                        <span className="font-bold text-gray-900">{player.currentContract.team.name}</span>
                      </div>
                    </div>
                  )}
                  
                  {player.currentContract.season && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">Season</span>
                        <div className="text-right">
                          <div className="font-bold text-gray-900">{player.currentContract.season.name}</div>
                          {player.currentContract.season.isActive && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {player.currentContract.startDate && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">Contract Start</span>
                        <span className="font-bold text-gray-900">
                          {format(new Date(player.currentContract.startDate), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {player.currentContract.endDate ? (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">Contract End</span>
                        <span className="font-bold text-gray-900">
                          {format(new Date(player.currentContract.endDate), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-blue-700">Contract Duration</span>
                        <span className="font-bold text-blue-600">Open-ended</span>
                      </div>
                    </div>
                  )}
                  
                  {player.currentContract.contractValue > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-green-700">Contract Value</span>
                        <span className="font-bold text-green-600 text-xl">
                          MVR {player.currentContract.contractValue.toLocaleString()}
                        </span>
                      </div>
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
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-purple-600" />
                Transfer Status
              </h3>
              
              <div className="space-y-6">
                {player.contractStatus === 'free_agent' ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="text-center">
                      <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                      <h4 className="font-bold text-green-800 text-lg mb-2">Transfer Available</h4>
                      <p className="text-green-700 text-sm">
                        Player can join any team at any time during transfer windows.
                      </p>
                    </div>
                  </div>
                ) : player.contractStatus === 'normal' ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="text-center">
                      <FileText className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                      <h4 className="font-bold text-blue-800 text-lg mb-2">Mid-Season Transfer Allowed</h4>
                      <p className="text-blue-700 text-sm">
                        Normal contract allows transfers during the season with team agreement.
                      </p>
                    </div>
                  </div>
                ) : player.contractStatus === 'seasonal' ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <div className="text-center">
                      <Clock className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
                      <h4 className="font-bold text-yellow-800 text-lg mb-2">Season-End Transfer Only</h4>
                      <p className="text-yellow-700 text-sm mb-3">
                        Seasonal contract restricts transfers until the current season ends.
                      </p>
                      {player.currentContract?.season?.isActive ? (
                        <div className="bg-red-100 text-red-800 px-3 py-2 rounded-lg text-xs">
                          Current season active - transfers blocked
                        </div>
                      ) : (
                        <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-xs">
                          Season ended - transfers allowed
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <div className="text-center">
                      <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <h4 className="font-bold text-gray-800 text-lg mb-2">Status Unknown</h4>
                      <p className="text-gray-700 text-sm">
                        Transfer eligibility information is not available.
                      </p>
                    </div>
                  </div>
                )}

                {/* Contract Rules Guide */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-bold text-blue-900 mb-3">Contract Types Guide</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start space-x-2">
                      <FileText className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                      <div className="text-blue-800">
                        <strong>Normal Contract:</strong> Allows mid-season transfers with mutual agreement
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Clock className="w-4 h-4 mt-0.5 text-purple-600 flex-shrink-0" />
                      <div className="text-blue-800">
                        <strong>Seasonal Contract:</strong> Player committed until season ends
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <User className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                      <div className="text-blue-800">
                        <strong>Free Agent:</strong> Available for signing by any team
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Statistics Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-8">
            {/* Career Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <Target className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-green-600 mb-1">{player.careerStats?.goals || 0}</div>
                <div className="text-gray-600">Career Goals</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <Award className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-blue-600 mb-1">{player.careerStats?.assists || 0}</div>
                <div className="text-gray-600">Career Assists</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <Activity className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-purple-600 mb-1">{player.careerStats?.appearances || 0}</div>
                <div className="text-gray-600">Appearances</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-yellow-600 mb-1">{player.careerStats?.minutesPlayed || 0}</div>
                <div className="text-gray-600">Minutes Played</div>
              </div>
            </div>

            {/* Detailed Statistics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-6">Career Statistics</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Total Matches', value: player.careerStats?.appearances || 0, color: 'text-blue-600' },
                    { label: 'Total Goals', value: player.careerStats?.goals || 0, color: 'text-green-600' },
                    { label: 'Total Assists', value: player.careerStats?.assists || 0, color: 'text-blue-600' },
                    { label: 'Minutes Played', value: player.careerStats?.minutesPlayed || 0, color: 'text-purple-600' },
                    { label: 'Yellow Cards', value: player.careerStats?.yellowCards || 0, color: 'text-yellow-600' },
                    { label: 'Red Cards', value: player.careerStats?.redCards || 0, color: 'text-red-600' }
                  ].map((stat, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700">{stat.label}</span>
                      <span className={`font-bold text-xl ${stat.color}`}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-6">Performance Averages</h3>
                <div className="space-y-4">
                  {[
                    {
                      label: 'Goals per Match',
                      value: player.careerStats?.appearances > 0 ? 
                        ((player.careerStats?.goals || 0) / player.careerStats.appearances).toFixed(2) : 
                        '0.00',
                      color: 'text-green-600'
                    },
                    {
                      label: 'Assists per Match',
                      value: player.careerStats?.appearances > 0 ? 
                        ((player.careerStats?.assists || 0) / player.careerStats.appearances).toFixed(2) : 
                        '0.00',
                      color: 'text-blue-600'
                    },
                    {
                      label: 'Minutes per Match',
                      value: player.careerStats?.appearances > 0 ? 
                        Math.round((player.careerStats?.minutesPlayed || 0) / player.careerStats.appearances) : 
                        0,
                      color: 'text-purple-600'
                    },
                    {
                      label: 'Goal Contributions',
                      value: player.careerStats?.appearances > 0 ? 
                        (((player.careerStats?.goals || 0) + (player.careerStats?.assists || 0)) / player.careerStats.appearances).toFixed(2) : 
                        '0.00',
                      color: 'text-indigo-600'
                    }
                  ].map((stat, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700">{stat.label}</span>
                      <span className={`font-bold text-xl ${stat.color}`}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Matches Tab */}
        {activeTab === 'matches' && (
          <div className="space-y-6">
            {/* Match History Options */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Match History</h3>
                <div className="text-sm text-gray-600">
                  {playerMatches.length} matches found
                </div>
              </div>

              {/* Info Banner */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Match History Display</h4>
                    <p className="text-blue-800 text-sm mb-2">
                      Currently showing matches from <strong>{player.currentTeam?.name || "the player's team"}</strong> during their active period.
                    </p>
                    <div className="text-xs text-blue-700">
                      <strong>Note:</strong> Individual player participation tracking (substitutions, minutes played, specific match events) 
                      is not yet implemented in the current system. This shows team matches during the player's contract period.
                    </div>
                  </div>
                </div>
              </div>
              
              {playerMatches.length > 0 ? (
                <div className="space-y-4">
                  {playerMatches.map((match, index) => {
                    // Determine if this was a match where the player's team participated
                    const playerTeams = [
                      player.currentTeam?._id,
                      // Add historical teams if available in player data
                      ...(player.contractHistory?.map(contract => contract.team?._id) || [])
                    ].filter(Boolean);

                    const isPlayerTeamHome = playerTeams.includes(match.homeTeam?._id);
                    const isPlayerTeamAway = playerTeams.includes(match.awayTeam?._id);
                    const isPlayerInvolved = isPlayerTeamHome || isPlayerTeamAway;

                    // If player not involved in this match, skip or mark as unclear
                    if (!isPlayerInvolved) {
                      return (
                        <div key={match._id || index} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="text-sm text-yellow-700 w-16">
                                {formatMatchDate(match.matchDate)}
                              </div>
                              <div className="font-medium text-yellow-800">
                                {match.homeTeam?.name} vs {match.awayTeam?.name}
                              </div>
                              <div className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">
                                Team Unknown
                              </div>
                            </div>
                            <div className="text-yellow-600 text-sm">
                              Player team unclear
                            </div>
                          </div>
                        </div>
                      );
                    }

                    const teamScore = isPlayerTeamHome ? match.homeScore : match.awayScore;
                    const opponentScore = isPlayerTeamHome ? match.awayScore : match.homeScore;
                    const opponent = isPlayerTeamHome ? match.awayTeam : match.homeTeam;
                    const playerTeam = isPlayerTeamHome ? match.homeTeam : match.awayTeam;
                    
                    let result = '';
                    let resultColor = '';
                    if (match.status === 'completed') {
                      if (teamScore > opponentScore) {
                        result = 'W';
                        resultColor = 'bg-green-500 text-white';
                      } else if (teamScore < opponentScore) {
                        result = 'L';
                        resultColor = 'bg-red-500 text-white';
                      } else {
                        result = 'D';
                        resultColor = 'bg-yellow-500 text-white';
                      }
                    }
                    
                    return (
                      <div key={match._id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="text-sm text-gray-600 w-16">
                              {formatMatchDate(match.matchDate)}
                            </div>
                            <div className="flex flex-col">
                              <div className="font-medium">
                                <span className="text-blue-600">{playerTeam?.name}</span>
                                <span className="mx-2 text-gray-400">{isPlayerTeamHome ? 'vs' : '@'}</span>
                                <span>{opponent?.name}</span>
                              </div>
                              {match.venue && (
                                <div className="text-xs text-gray-500">
                                  at {match.venue}
                                </div>
                              )}
                            </div>
                            
                            {/* Player Participation Status */}
                            <div className="hidden md:flex items-center space-x-2">
                              {/* This would be where actual participation data goes */}
                              <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                Team Match
                              </div>
                              {/* Future: Add participation indicators like:
                                  - Started / Substitute / Bench
                                  - Minutes played
                                  - Goals/assists in this match
                              */}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            {match.status === 'completed' && (
                              <>
                                <div className="font-bold text-lg">
                                  {teamScore} - {opponentScore}
                                </div>
                                {result && (
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${resultColor}`}>
                                    {result}
                                  </div>
                                )}
                              </>
                            )}
                            {match.status === 'scheduled' && (
                              <div className="text-blue-600 text-sm">
                                {format(new Date(match.matchDate), 'HH:mm')}
                              </div>
                            )}
                            {match.status === 'live' && (
                              <div className="text-red-600 text-sm font-medium animate-pulse">
                                LIVE
                              </div>
                            )}
                            <Link href={`/matches/${match._id}`} className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">No Match History</h4>
                  <p className="text-gray-500 mb-4">No match history available for this player's current team</p>
                  {player.currentTeam && (
                    <Link 
                      href={`/teams/${player.currentTeam._id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View {player.currentTeam.name} matches →
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Future Enhancement Placeholder */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-gray-600" />
                Future Enhancement: Individual Match Tracking
              </h4>
              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  <strong>Coming Soon:</strong> Detailed player participation tracking including:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Starting lineup vs. substitute appearances</li>
                  <li>Minutes played per match</li>
                  <li>Goals, assists, and cards in specific matches</li>
                  <li>Player performance ratings per match</li>
                  <li>Substitution timing and reasons</li>
                </ul>
                <p className="mt-3 text-xs text-gray-500">
                  This requires implementing player participation tracking in the match management system.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Transfers Tab */}
        {activeTab === 'transfers' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Transfer History</h3>
              <div className="text-sm text-gray-600">
                {playerTransfers.length} transfers found
              </div>
            </div>
            
            {playerTransfers.length > 0 ? (
              <div className="space-y-4">
                {playerTransfers.map((transfer, index) => (
                  <div key={transfer._id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-600 w-24">
                          {format(new Date(transfer.transferDate), 'MMM dd, yyyy')}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {transfer.fromTeam ? transfer.fromTeam.name : 'New Registration'}
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-blue-600">
                            {transfer.toTeam?.name || 'Free Agent'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {transfer.transferFee > 0 && (
                          <span className="text-green-600 font-medium">
                            MVR {transfer.transferFee.toLocaleString()}
                          </span>
                        )}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          transfer.transferType === 'registration' ? 'bg-green-100 text-green-800' :
                          transfer.transferType === 'transfer' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {transfer.transferType?.toUpperCase() || 'TRANSFER'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-700 mb-2">No Transfer History</h4>
                <p className="text-gray-500">No transfer history available for this player</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Back to Players */}
      <div className="flex justify-center">
        <Link href="/players" className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to All Players
        </Link>
      </div>
    </div>
  );
}
