// ===========================================
// FILE: pages/teams/[id].js (ENHANCED WITH BETTER UX AND PERFORMANCE)
// ===========================================
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Users, Trophy, Target, Calendar, MapPin, Mail, Phone, User,
  TrendingUp, TrendingDown, FileText, Clock, AlertCircle, 
  Activity, BarChart3, Star, Crown, Award, Shield, Eye,
  ArrowLeft, Share2, Download, Filter, Search, ChevronRight,
  Zap, CheckCircle, XCircle, Minus
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

export default function TeamProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [playerFilter, setPlayerFilter] = useState('all'); // 'all', 'starters', 'substitutes'
  const [matchFilter, setMatchFilter] = useState('all'); // 'all', 'completed', 'scheduled'
  const [playerSearch, setPlayerSearch] = useState('');
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTeamData();
    }
  }, [id]);

  const fetchTeamData = async () => {
    try {
      setIsLoading(true);
      
      // Use Promise.all for parallel requests
      const requests = [
        fetch(`/api/public/teams/${id}`),
        fetch(`/api/public/players?teamId=${id}&limit=50`),
        fetch(`/api/public/matches?teamId=${id}&limit=100`),
        fetch(`/api/public/transfers?teamId=${id}&limit=10`)
      ];

      const [teamResponse, playersResponse, matchesResponse, transfersResponse] = 
        await Promise.all(requests);

      // Process team data
      if (teamResponse.ok) {
        const teamData = await teamResponse.json();
        setTeam(teamData);
      } else {
        console.error('Failed to fetch team:', teamResponse.statusText);
      }

      // Process players data
      if (playersResponse.ok) {
        const playersData = await playersResponse.json();
        setPlayers(Array.isArray(playersData) ? playersData : []);
      }

      // Process matches data
      if (matchesResponse.ok) {
        const matchesData = await matchesResponse.json();
        const validMatches = Array.isArray(matchesData) ? matchesData : [];
        setMatches(validMatches);
      }

      // Process transfers data
      if (transfersResponse.ok) {
        const transfersData = await transfersResponse.json();
        setTransfers(Array.isArray(transfersData) ? transfersData : []);
      }

    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced team statistics calculation
  const calculateTeamStats = () => {
    if (!team || !matches || matches.length === 0) {
      return {
        matchesPlayed: 0, wins: 0, draws: 0, losses: 0, points: 0,
        goalsFor: 0, goalsAgainst: 0, goalDifference: 0,
        winPercentage: 0, cleanSheets: 0, avgGoalsPerMatch: 0,
        form: [], homeRecord: {}, awayRecord: {}
      };
    }

    const validMatches = matches.filter(match => 
      match.status === 'completed' && 
      (match.homeTeam?._id === team._id || match.awayTeam?._id === team._id) &&
      match.homeScore !== null && match.homeScore !== undefined &&
      match.awayScore !== null && match.awayScore !== undefined &&
      match.homeTeam && match.awayTeam && match.season
    );

    let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;
    let cleanSheets = 0;
    let homeWins = 0, homeDraws = 0, homeLosses = 0, homeGoalsFor = 0, homeGoalsAgainst = 0;
    let awayWins = 0, awayDraws = 0, awayLosses = 0, awayGoalsFor = 0, awayGoalsAgainst = 0;
    const form = [];

    validMatches
      .sort((a, b) => new Date(a.matchDate) - new Date(b.matchDate))
      .forEach(match => {
        const isHome = match.homeTeam._id === team._id;
        const teamScore = isHome ? match.homeScore : match.awayScore;
        const opponentScore = isHome ? match.awayScore : match.homeScore;

        goalsFor += teamScore;
        goalsAgainst += opponentScore;

        if (opponentScore === 0) cleanSheets++;

        let result;
        if (teamScore > opponentScore) {
          wins++;
          result = 'W';
          if (isHome) homeWins++;
          else awayWins++;
        } else if (teamScore < opponentScore) {
          losses++;
          result = 'L';
          if (isHome) homeLosses++;
          else awayLosses++;
        } else {
          draws++;
          result = 'D';
          if (isHome) homeDraws++;
          else awayDraws++;
        }

        if (isHome) {
          homeGoalsFor += teamScore;
          homeGoalsAgainst += opponentScore;
        } else {
          awayGoalsFor += teamScore;
          awayGoalsAgainst += opponentScore;
        }

        form.push({ result, match });
      });

    const points = (wins * 3) + (draws * 1);
    const matchesPlayed = validMatches.length;
    const winPercentage = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0;
    const avgGoalsPerMatch = matchesPlayed > 0 ? Math.round((goalsFor / matchesPlayed) * 10) / 10 : 0;

    return {
      matchesPlayed, wins, draws, losses, points, goalsFor, goalsAgainst,
      goalDifference: goalsFor - goalsAgainst, winPercentage, cleanSheets,
      avgGoalsPerMatch, form: form.slice(-5), // Last 5 matches
      homeRecord: {
        played: homeWins + homeDraws + homeLosses,
        wins: homeWins, draws: homeDraws, losses: homeLosses,
        goalsFor: homeGoalsFor, goalsAgainst: homeGoalsAgainst
      },
      awayRecord: {
        played: awayWins + awayDraws + awayLosses,
        wins: awayWins, draws: awayDraws, losses: awayLosses,
        goalsFor: awayGoalsFor, goalsAgainst: awayGoalsAgainst
      }
    };
  };

  // Enhanced player filtering
  const getFilteredPlayers = () => {
    let filtered = players;
    
    // Filter by search
    if (playerSearch) {
      filtered = filtered.filter(player => 
        player.name.toLowerCase().includes(playerSearch.toLowerCase()) ||
        (player.position && player.position.toLowerCase().includes(playerSearch.toLowerCase()))
      );
    }

    // Sort players by position and jersey number
    return filtered.sort((a, b) => {
      // Sort by position first, then by jersey number
      const positionOrder = { 'Goalkeeper': 0, 'Defender': 1, 'Midfielder': 2, 'Forward': 3 };
      const aPos = positionOrder[a.position] || 99;
      const bPos = positionOrder[b.position] || 99;
      
      if (aPos !== bPos) return aPos - bPos;
      return (a.jerseyNumber || 999) - (b.jerseyNumber || 999);
    });
  };

  // Enhanced match filtering
  const getFilteredMatches = () => {
    let filtered = matches;
    
    if (matchFilter !== 'all') {
      filtered = filtered.filter(match => match.status === matchFilter);
    }

    return filtered.sort((a, b) => new Date(b.matchDate) - new Date(a.matchDate));
  };

  // Get top performers
  const getTopPerformers = () => {
    return players
      .filter(p => (p.careerStats?.goals || 0) > 0)
      .sort((a, b) => (b.careerStats?.goals || 0) - (a.careerStats?.goals || 0))
      .slice(0, 3);
  };

  // Format date for matches
  const formatMatchDate = (dateString) => {
    const date = new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM dd');
  };

  // Match result helpers
  const getMatchResult = (match) => {
    if (match.status !== 'completed') return null;
    
    const isHome = match.homeTeam._id === team._id;
    const teamScore = isHome ? match.homeScore : match.awayScore;
    const opponentScore = isHome ? match.awayScore : match.homeScore;
    
    if (teamScore > opponentScore) return 'W';
    if (teamScore < opponentScore) return 'L';
    return 'D';
  };

  const getResultColor = (result) => {
    switch (result) {
      case 'W': return 'bg-green-500 text-white';
      case 'L': return 'bg-red-500 text-white';
      case 'D': return 'bg-yellow-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  // Performance rating
  const getPerformanceRating = (stats) => {
    if (stats.matchesPlayed < 3) return { rating: 'New', color: 'text-blue-600', icon: Star };
    
    const winRate = stats.winPercentage;
    if (winRate >= 75) return { rating: 'Excellent', color: 'text-green-600', icon: Crown };
    if (winRate >= 50) return { rating: 'Good', color: 'text-blue-600', icon: TrendingUp };
    if (winRate >= 25) return { rating: 'Average', color: 'text-yellow-600', icon: Activity };
    return { rating: 'Poor', color: 'text-red-600', icon: TrendingDown };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 mt-4">Loading team profile...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-16">
        <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Team Not Found</h2>
        <p className="text-gray-600 mb-6">The team you're looking for doesn't exist.</p>
        <Link href="/teams" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
          Back to Teams
        </Link>
      </div>
    );
  }

  const stats = calculateTeamStats();
  const performance = getPerformanceRating(stats);
  const topPerformers = getTopPerformers();

  return (
    <div className="space-y-8">
      {/* Enhanced Header with Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            href="/teams" 
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Teams
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900 font-medium">{team.name}</span>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Toggle debug info"
          >
            <Activity className="w-4 h-4" />
          </button>
          <button className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </button>
        </div>
      </div>

      {/* Debug Info Panel */}
      {showDebugInfo && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Debug Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-yellow-700">
            <div>
              <div className="font-medium">Total Matches</div>
              <div>{matches.length}</div>
            </div>
            <div>
              <div className="font-medium">Valid Matches</div>
              <div>{stats.matchesPlayed}</div>
            </div>
            <div>
              <div className="font-medium">Players</div>
              <div>{players.length}</div>
            </div>
            <div>
              <div className="font-medium">Transfers</div>
              <div>{transfers.length}</div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Team Header */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
          <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-8">
            <div className="flex items-center space-x-6">
              <div className="relative">
                {getImageUrl(team.logo) ? (
                  <Image
                    src={getImageUrl(team.logo)}
                    alt={team.name}
                    width={120}
                    height={120}
                    className="rounded-full object-cover border-4 border-white/20"
                  />
                ) : (
                  <div className="w-30 h-30 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/20">
                    <Users className="w-16 h-16 text-white/70" />
                  </div>
                )}
                
                {/* Performance Badge */}
                <div className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full bg-white text-xs font-bold ${performance.color}`}>
                  <performance.icon className="w-3 h-3 inline mr-1" />
                  {performance.rating}
                </div>
              </div>

              <div>
                <h1 className="text-4xl font-bold mb-2">{team.name}</h1>
                <div className="flex items-center space-x-4 text-white/80">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {team.season?.name}
                  </span>
                  {team.foundedYear && (
                    <span>Founded {team.foundedYear}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{players.length}</div>
                <div className="text-white/70 text-sm">Players</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{stats.points}</div>
                <div className="text-white/70 text-sm">Points</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{stats.wins}</div>
                <div className="text-white/70 text-sm">Wins</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{stats.winPercentage}%</div>
                <div className="text-white/70 text-sm">Win Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Description */}
        {team.description && (
          <div className="p-6 border-b border-gray-200">
            <p className="text-gray-700 text-lg leading-relaxed">{team.description}</p>
          </div>
        )}

        {/* Key Metrics Bar */}
        <div className="p-6 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.matchesPlayed}</div>
              <div className="text-gray-600 text-sm">Matches Played</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${stats.goalDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.goalDifference >= 0 ? '+' : ''}{stats.goalDifference}
              </div>
              <div className="text-gray-600 text-sm">Goal Difference</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.cleanSheets}</div>
              <div className="text-gray-600 text-sm">Clean Sheets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.avgGoalsPerMatch}</div>
              <div className="text-gray-600 text-sm">Goals/Match</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.homeRecord.wins}</div>
              <div className="text-gray-600 text-sm">Home Wins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.awayRecord.wins}</div>
              <div className="text-gray-600 text-sm">Away Wins</div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <nav className="flex space-x-0">
          {[
            { id: 'overview', name: 'Overview', icon: BarChart3 },
            { id: 'players', name: `Players (${players.length})`, icon: Users },
            { id: 'matches', name: `Matches (${matches.length})`, icon: Calendar },
            { id: 'transfers', name: `Transfers (${transfers.length})`, icon: TrendingUp },
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
            {/* Team Information */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-blue-600" />
                  Team Information
                </h3>
                <div className="space-y-4">
                  {team.manager && (
                    <div className="flex items-start space-x-3">
                      <User className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">Manager</div>
                        <div className="text-gray-600">{team.manager}</div>
                      </div>
                    </div>
                  )}
                  
                  {team.contact?.email && (
                    <div className="flex items-start space-x-3">
                      <Mail className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">Email</div>
                        <div className="text-gray-600">{team.contact.email}</div>
                      </div>
                    </div>
                  )}
                  
                  {team.contact?.phone && (
                    <div className="flex items-start space-x-3">
                      <Phone className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">Phone</div>
                        <div className="text-gray-600">{team.contact.phone}</div>
                      </div>
                    </div>
                  )}

                  {(team.homeColor || team.awayColor) && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="text-sm font-medium text-gray-900 mb-2">Kit Colors</div>
                      <div className="flex space-x-4">
                        {team.homeColor && (
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded border border-gray-300" style={{ backgroundColor: team.homeColor }}></div>
                            <span className="text-sm text-gray-600">Home</span>
                          </div>
                        )}
                        {team.awayColor && (
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded border border-gray-300" style={{ backgroundColor: team.awayColor }}></div>
                            <span className="text-sm text-gray-600">Away</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Form */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-green-600" />
                  Recent Form
                </h3>
                <div className="flex space-x-2 mb-4">
                  {stats.form.map((formItem, index) => (
                    <div
                      key={index}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${getResultColor(formItem.result)}`}
                      title={`vs ${formItem.match.homeTeam._id === team._id ? formItem.match.awayTeam.name : formItem.match.homeTeam.name}`}
                    >
                      {formItem.result}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-gray-600">
                  Last {stats.form.length} matches
                </div>
              </div>

              {/* Top Performers */}
              {topPerformers.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center">
                    <Star className="w-5 h-5 mr-2 text-yellow-600" />
                    Top Scorers
                  </h3>
                  <div className="space-y-3">
                    {topPerformers.map((player, index) => (
                      <Link key={player._id} href={`/players/${player._id}`}>
                        <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            'bg-yellow-600 text-white'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{player.name}</div>
                            <div className="text-sm text-gray-600">{player.position}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600">{player.careerStats?.goals || 0}</div>
                            <div className="text-xs text-gray-500">goals</div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Statistics */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Match Statistics */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
                    Match Statistics
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Matches Played</span>
                      <span className="font-bold text-gray-900">{stats.matchesPlayed}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Wins</span>
                      <span className="font-bold text-green-600">{stats.wins}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Draws</span>
                      <span className="font-bold text-yellow-600">{stats.draws}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Losses</span>
                      <span className="font-bold text-red-600">{stats.losses}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t">
                      <span className="text-gray-600">Win Percentage</span>
                      <span className="font-bold text-blue-600">{stats.winPercentage}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Points</span>
                      <span className="font-bold text-purple-600">{stats.points}</span>
                    </div>
                  </div>
                </div>

                {/* Goal Statistics */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-green-600" />
                    Goal Statistics
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Goals For</span>
                      <span className="font-bold text-green-600">{stats.goalsFor}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Goals Against</span>
                      <span className="font-bold text-red-600">{stats.goalsAgainst}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Clean Sheets</span>
                      <span className="font-bold text-blue-600">{stats.cleanSheets}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Avg Goals/Match</span>
                      <span className="font-bold text-purple-600">{stats.avgGoalsPerMatch}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t">
                      <span className="text-gray-600">Goal Difference</span>
                      <span className={`font-bold ${stats.goalDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stats.goalDifference >= 0 ? '+' : ''}{stats.goalDifference}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Home vs Away Performance */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4">Home vs Away Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-blue-600 mb-3">Home Record</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Played</span>
                        <span className="font-medium">{stats.homeRecord.played}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">W-D-L</span>
                        <span className="font-medium">{stats.homeRecord.wins}-{stats.homeRecord.draws}-{stats.homeRecord.losses}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Goals</span>
                        <span className="font-medium">{stats.homeRecord.goalsFor}-{stats.homeRecord.goalsAgainst}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-600 mb-3">Away Record</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Played</span>
                        <span className="font-medium">{stats.awayRecord.played}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">W-D-L</span>
                        <span className="font-medium">{stats.awayRecord.wins}-{stats.awayRecord.draws}-{stats.awayRecord.losses}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Goals</span>
                        <span className="font-medium">{stats.awayRecord.goalsFor}-{stats.awayRecord.goalsAgainst}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Players Tab */}
        {activeTab === 'players' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 mb-6">
              <h3 className="text-xl font-bold">Squad ({getFilteredPlayers().length} players)</h3>
              
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search players..."
                    value={playerSearch}
                    onChange={(e) => setPlayerSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getFilteredPlayers().map((player) => (
                <Link key={player._id} href={`/players/${player._id}`}>
                  <div className="border rounded-xl p-4 hover:shadow-md transition-all duration-200 cursor-pointer group hover:border-blue-200">
                    <div className="flex items-center space-x-4">
                      {/* Player Photo */}
                      <div className="relative">
                        {getImageUrl(player.photo) ? (
                          <Image
                            src={getImageUrl(player.photo)}
                            alt={player.name}
                            width={60}
                            height={60}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-15 h-15 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        
                        {/* Jersey Number Badge */}
                        {player.jerseyNumber && (
                          <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                            {player.jerseyNumber}
                          </div>
                        )}
                      </div>
                      
                      {/* Player Info */}
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {player.name}
                        </div>
                        <div className="text-sm text-gray-600">{player.position || 'Player'}</div>
                        {player.dateOfBirth && (
                          <div className="text-xs text-gray-500">Age {calculateAge(player.dateOfBirth)}</div>
                        )}
                      </div>
                      
                      {/* Player Stats */}
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {player.careerStats?.goals || 0}
                        </div>
                        <div className="text-xs text-gray-500">goals</div>
                        {(player.careerStats?.assists || 0) > 0 && (
                          <div className="text-xs text-blue-600">
                            {player.careerStats.assists} assists
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {getFilteredPlayers().length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {playerSearch ? 'No Players Found' : 'No Players Registered'}
                </h3>
                <p className="text-gray-600">
                  {playerSearch 
                    ? `No players match "${playerSearch}"`
                    : 'No players are registered for this team yet.'
                  }
                </p>
                {playerSearch && (
                  <button
                    onClick={() => setPlayerSearch('')}
                    className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Enhanced Matches Tab */}
        {activeTab === 'matches' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 mb-6">
              <h3 className="text-xl font-bold">Matches ({getFilteredMatches().length} total)</h3>
              
              <select
                value={matchFilter}
                onChange={(e) => setMatchFilter(e.target.value)}
                className="form-input w-48"
              >
                <option value="all">All Matches</option>
                <option value="completed">Completed</option>
                <option value="scheduled">Scheduled</option>
                <option value="live">Live</option>
              </select>
            </div>

            <div className="space-y-4">
              {getFilteredMatches().map((match) => {
                const isHome = match.homeTeam?._id === team._id;
                const opponent = isHome ? match.awayTeam : match.homeTeam;
                const result = getMatchResult(match);
                const teamScore = isHome ? match.homeScore : match.awayScore;
                const opponentScore = isHome ? match.awayScore : match.homeScore;

                return (
                  <div key={match._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Match Date */}
                        <div className="text-sm text-gray-600 w-20">
                          {formatMatchDate(match.matchDate)}
                        </div>
                        
                        {/* Opponent */}
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <span className="text-gray-500 text-sm">{isHome ? 'vs' : '@'}</span>
                          <span className="font-medium truncate">{opponent?.name}</span>
                        </div>
                        
                        {/* Venue */}
                        {match.venue && (
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{match.venue}</span>
                          </div>
                        )}
                        
                        {/* Season */}
                        {match.season && (
                          <div className="text-xs text-gray-400 hidden md:block">
                            {match.season.name}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        {match.status === 'completed' && (
                          <>
                            <div className="font-bold text-xl">
                              {teamScore} - {opponentScore}
                            </div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getResultColor(result)}`}>
                              {result}
                            </div>
                          </>
                        )}
                        
                        {match.status === 'live' && (
                          <div className="flex items-center space-x-2">
                            <div className="font-bold text-xl">
                              {teamScore || 0} - {opponentScore || 0}
                            </div>
                            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                              LIVE
                            </span>
                          </div>
                        )}
                        
                        {match.status === 'scheduled' && (
                          <div className="text-right">
                            <div className="font-medium text-blue-600">
                              {format(new Date(match.matchDate), 'HH:mm')}
                            </div>
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                              Scheduled
                            </span>
                          </div>
                        )}
                        
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {getFilteredMatches().length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Matches Found</h3>
                <p className="text-gray-600">
                  {matchFilter === 'all' 
                    ? 'No matches are scheduled for this team yet.'
                    : `No ${matchFilter} matches found.`
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {/* Enhanced Transfers Tab */}
        {activeTab === 'transfers' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-6">Transfer Activity</h3>
            
            <div className="space-y-4">
              {transfers.map((transfer) => (
                <div key={transfer._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="font-medium text-lg">
                        {transfer.player?.name || 'Unknown Player'}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {transfer.transferType === 'registration' ? (
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                            New Signing
                          </span>
                        ) : (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span className="bg-gray-100 px-2 py-1 rounded">
                              {transfer.fromTeam?.name || 'Free Agent'}
                            </span>
                            <span>→</span>
                            <span className="bg-blue-100 px-2 py-1 rounded">
                              {transfer.toTeam?.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        {format(new Date(transfer.transferDate), 'MMM dd, yyyy')}
                      </div>
                      {transfer.transferFee > 0 && (
                        <div className="text-sm font-medium text-green-600">
                          MVR {transfer.transferFee.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {transfers.length === 0 && (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transfer Activity</h3>
                <p className="text-gray-600">No recent transfer activity for this team.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
