// ===========================================
// FILE: pages/teams/[id].js (UPDATED WITH DEBUGGING AND BETTER FILTERING)
// ===========================================
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Users, 
  Trophy, 
  Target, 
  Calendar, 
  MapPin, 
  Mail, 
  Phone, 
  User,
  TrendingUp,
  TrendingDown,
  FileText,
  Clock,
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

export default function TeamProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [debugInfo, setDebugInfo] = useState(null); // NEW: Debug information

  useEffect(() => {
    if (id) {
      fetchTeamData();
    }
  }, [id]);

  const fetchTeamData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch team details
      const teamResponse = await fetch(`/api/public/teams/${id}`);
      if (teamResponse.ok) {
        const teamData = await teamResponse.json();
        setTeam(teamData);
      }

      // Fetch team players
      const playersResponse = await fetch(`/api/public/players?teamId=${id}`);
      if (playersResponse.ok) {
        const playersData = await playersResponse.json();
        setPlayers(Array.isArray(playersData) ? playersData : []);
      }

      // Fetch ALL matches for this team (for debugging)
      const matchesResponse = await fetch(`/api/public/matches?teamId=${id}&limit=100`);
      if (matchesResponse.ok) {
        const matchesData = await matchesResponse.json();
        const validMatches = Array.isArray(matchesData) ? matchesData : [];
        setMatches(validMatches);
        
        // NEW: Create debug information
        const debugData = {
          totalMatches: validMatches.length,
          matchesByStatus: {
            completed: validMatches.filter(m => m.status === 'completed').length,
            scheduled: validMatches.filter(m => m.status === 'scheduled').length,
            live: validMatches.filter(m => m.status === 'live').length,
            other: validMatches.filter(m => !['completed', 'scheduled', 'live'].includes(m.status)).length
          },
          matchDetails: validMatches.map(match => ({
            id: match._id,
            status: match.status,
            date: match.matchDate,
            homeTeam: match.homeTeam?.name,
            awayTeam: match.awayTeam?.name,
            homeScore: match.homeScore,
            awayScore: match.awayScore,
            season: match.season?.name
          }))
        };
        setDebugInfo(debugData);
        
        console.log('🔍 TEAM MATCHES DEBUG:', debugData);
      }

      // Fetch recent transfers
      const transfersResponse = await fetch(`/api/public/transfers?teamId=${id}&limit=5`);
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

  // UPDATED: More strict filtering for team statistics
  const calculateTeamStats = () => {
    if (!team || !matches || matches.length === 0) {
      return {
        matchesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        points: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0
      };
    }

    // STRICT FILTERING: Only count completed matches with valid scores
    const validMatches = matches.filter(match => {
      const isValidMatch = (
        match.status === 'completed' && 
        (match.homeTeam?._id === team._id || match.awayTeam?._id === team._id) &&
        match.homeScore !== null && 
        match.homeScore !== undefined &&
        match.awayScore !== null && 
        match.awayScore !== undefined &&
        match.homeTeam && 
        match.awayTeam &&
        match.season // Must have a season
      );
      
      if (!isValidMatch && (match.homeTeam?._id === team._id || match.awayTeam?._id === team._id)) {
        console.warn('🚫 Excluding invalid match:', {
          id: match._id,
          status: match.status,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          homeTeam: match.homeTeam?.name,
          awayTeam: match.awayTeam?.name,
          reason: 'Invalid match data'
        });
      }
      
      return isValidMatch;
    });

    console.log('✅ Valid matches for stats calculation:', validMatches.length, 'out of', matches.length);

    let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;

    validMatches.forEach(match => {
      const isHome = match.homeTeam._id === team._id;
      const teamScore = isHome ? match.homeScore : match.awayScore;
      const opponentScore = isHome ? match.awayScore : match.homeScore;

      goalsFor += teamScore;
      goalsAgainst += opponentScore;

      if (teamScore > opponentScore) {
        wins++;
      } else if (teamScore < opponentScore) {
        losses++;
      } else {
        draws++;
      }
    });

    const points = (wins * 3) + (draws * 1);
    const matchesPlayed = validMatches.length;

    const stats = {
      matchesPlayed,
      wins,
      draws,
      losses,
      points,
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst
    };

    console.log('📊 Calculated team stats:', stats);
    return stats;
  };

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
      case 'W': return 'bg-green-100 text-green-800';
      case 'L': return 'bg-red-100 text-red-800';
      case 'D': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Contract status helpers
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
      case 'normal': return <FileText className="w-3 h-3" />;
      case 'seasonal': return <Clock className="w-3 h-3" />;
      case 'free_agent': return <User className="w-3 h-3" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Team Not Found</h2>
        <p className="text-gray-600 mb-4">The team you're looking for doesn't exist.</p>
        <Link href="/teams" className="btn btn-primary">
          Back to Teams
        </Link>
      </div>
    );
  }

  // Use calculated stats instead of stored stats
  const stats = calculateTeamStats();

  return (
    <div className="space-y-8">
      {/* NEW: Debug Panel (only show if there's a mismatch) */}
      {debugInfo && debugInfo.totalMatches !== stats.matchesPlayed && (
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800">Match Data Debug Information</h3>
              <p className="text-yellow-700 text-sm mb-2">
                Found {debugInfo.totalMatches} total matches, but only {stats.matchesPlayed} valid completed matches.
              </p>
              <div className="text-xs text-yellow-600 space-y-1">
                <p><strong>Completed:</strong> {debugInfo.matchesByStatus.completed}</p>
                <p><strong>Scheduled:</strong> {debugInfo.matchesByStatus.scheduled}</p>
                <p><strong>Live:</strong> {debugInfo.matchesByStatus.live}</p>
                <p><strong>Other/Invalid:</strong> {debugInfo.matchesByStatus.other}</p>
              </div>
              <details className="mt-2">
                <summary className="text-xs text-yellow-600 cursor-pointer">Show all matches</summary>
                <div className="mt-2 text-xs text-yellow-600 max-h-32 overflow-y-auto">
                  {debugInfo.matchDetails.map((match, idx) => (
                    <div key={idx} className="border-b border-yellow-200 py-1">
                      {match.homeTeam} vs {match.awayTeam} | Status: {match.status} | 
                      Score: {match.homeScore}-{match.awayScore} | Season: {match.season || 'None'}
                    </div>
                  ))}
                </div>
              </details>
            </div>
          </div>
        </div>
      )}

      {/* Team Header */}
      <div className="card">
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-8">
          <div className="flex items-center space-x-6">
            {getImageUrl(team.logo) ? (
              <Image
                src={getImageUrl(team.logo)}
                alt={team.name}
                width={100}
                height={100}
                className="rounded-full object-cover"
                onError={(e) => {
                  console.error('Team profile logo failed:', team.logo);
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) {
                    e.target.nextSibling.style.display = 'flex';
                  }
                }}
              />
            ) : null}
            
            <div 
              className={`w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center ${
                getImageUrl(team.logo) ? 'hidden' : 'flex'
              }`}
            >
              <Users className="w-12 h-12 text-gray-400" />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
              <p className="text-gray-600">{team.season?.name}</p>
              {team.foundedYear && (
                <p className="text-sm text-gray-500">Founded {team.foundedYear}</p>
              )}
            </div>
          </div>

          {/* Updated Stats Display */}
          <div className="flex-1">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{players.length}</div>
                <div className="text-gray-600 text-sm">Players</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.wins}</div>
                <div className="text-gray-600 text-sm">Wins</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.draws}</div>
                <div className="text-gray-600 text-sm">Draws</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.points}</div>
                <div className="text-gray-600 text-sm">Points</div>
              </div>
            </div>
            {/* Show matches played count */}
            <div className="text-center mt-2">
              <span className="text-sm text-gray-500">
                {stats.matchesPlayed} matches played
              </span>
            </div>
          </div>
        </div>

        {team.description && (
          <div className="mt-6 pt-6 border-t">
            <p className="text-gray-700">{team.description}</p>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview' },
            { id: 'players', name: 'Players' },
            { id: 'matches', name: 'Matches' },
            { id: 'transfers', name: 'Transfers' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Team Information */}
            <div className="lg:col-span-1">
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Team Information</h3>
                <div className="space-y-3">
                  {team.manager && (
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-3" />
                      <span className="text-sm">
                        <strong>Manager:</strong> {team.manager}
                      </span>
                    </div>
                  )}
                  
                  {team.contact?.email && (
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 text-gray-400 mr-3" />
                      <span className="text-sm">
                        <strong>Email:</strong> {team.contact.email}
                      </span>
                    </div>
                  )}
                  
                  {team.contact?.phone && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-gray-400 mr-3" />
                      <span className="text-sm">
                        <strong>Phone:</strong> {team.contact.phone}
                      </span>
                    </div>
                  )}

                  {team.homeColor && (
                    <div className="flex items-center">
                      <div className="w-4 h-4 mr-3 rounded border" style={{ backgroundColor: team.homeColor }}></div>
                      <span className="text-sm">
                        <strong>Home Kit:</strong> {team.homeColor}
                      </span>
                    </div>
                  )}

                  {team.awayColor && (
                    <div className="flex items-center">
                      <div className="w-4 h-4 mr-3 rounded border" style={{ backgroundColor: team.awayColor }}></div>
                      <span className="text-sm">
                        <strong>Away Kit:</strong> {team.awayColor}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Statistics - Using Calculated Stats */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Match Statistics */}
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">Match Statistics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Matches Played</span>
                      <span className="font-semibold">{stats.matchesPlayed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Wins</span>
                      <span className="font-semibold text-green-600">{stats.wins}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Draws</span>
                      <span className="font-semibold text-yellow-600">{stats.draws}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Losses</span>
                      <span className="font-semibold text-red-600">{stats.losses}</span>
                    </div>
                    <div className="flex justify-between border-t pt-3">
                      <span className="text-gray-600">Points</span>
                      <span className="font-bold text-blue-600">{stats.points}</span>
                    </div>
                  </div>
                </div>

                {/* Goal Statistics */}
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">Goal Statistics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Goals For</span>
                      <span className="font-semibold text-green-600">{stats.goalsFor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Goals Against</span>
                      <span className="font-semibold text-red-600">{stats.goalsAgainst}</span>
                    </div>
                    <div className="flex justify-between border-t pt-3">
                      <span className="text-gray-600">Goal Difference</span>
                      <span className={`font-bold ${
                        stats.goalDifference >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stats.goalDifference >= 0 ? '+' : ''}{stats.goalDifference}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Form */}
              <div className="card mt-6">
                <h3 className="text-lg font-semibold mb-4">Recent Form</h3>
                <div className="flex space-x-2">
                  {matches
                    .filter(match => match.status === 'completed')
                    .slice(0, 5)
                    .reverse()
                    .map((match, index) => {
                      const result = getMatchResult(match);
                      return (
                        <span
                          key={index}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getResultColor(result)}`}
                        >
                          {result}
                        </span>
                      );
                    })}
                </div>
                {matches.filter(match => match.status === 'completed').length === 0 && (
                  <p className="text-gray-500 text-sm">No completed matches yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'players' && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-6">Squad</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {players.map((player) => (
                <Link key={player._id} href={`/players/${player._id}`}>
                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer relative">
                    {/* Contract Status Badge */}
                    <div className="absolute top-2 right-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        getContractStatusColor(player.contractStatus || 'free_agent')
                      }`}>
                        {getContractStatusIcon(player.contractStatus || 'free_agent')}
                        <span className="ml-1">
                          {player.contractStatus === 'free_agent' ? 'FA' :
                           player.contractStatus === 'normal' ? 'N' :
                           player.contractStatus === 'seasonal' ? 'S' : 
                           '?'}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center space-x-3">
                      {getImageUrl(player.photo) ? (
                        <Image
                          src={getImageUrl(player.photo)}
                          alt={player.name}
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
                      
                      <div 
                        className={`w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center ${
                          getImageUrl(player.photo) ? 'hidden' : 'flex'
                        }`}
                      >
                        <User className="w-6 h-6 text-gray-400" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="font-medium">{player.name}</div>
                        <div className="text-sm text-gray-600">{player.position || 'Player'}</div>
                        <div className="text-sm text-gray-500">
                          {player.jerseyNumber && `#${player.jerseyNumber}`}
                          {player.jerseyNumber && player.dateOfBirth && ' • '}
                          {player.dateOfBirth && `Age ${calculateAge(player.dateOfBirth)}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-600">
                          {player.careerStats?.goals || 0}
                        </div>
                        <div className="text-xs text-gray-500">goals</div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {players.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No players registered for this team yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-6">Matches ({matches.length} total, {matches.filter(m => m.status === 'completed').length} completed)</h3>
            <div className="space-y-4">
              {matches.map((match) => {
                const isHome = match.homeTeam?._id === team._id;
                const opponent = isHome ? match.awayTeam : match.homeTeam;
                const result = getMatchResult(match);

                return (
                  <div key={match._id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-600">
                          {format(new Date(match.matchDate), 'MMM dd, yyyy')}
                        </div>
                        <div className="font-medium">
                          {isHome ? 'vs' : '@'} {opponent?.name}
                        </div>
                        {match.venue && (
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="w-3 h-3 mr-1" />
                            {match.venue}
                          </div>
                        )}
                        {/* NEW: Show season info */}
                        {match.season && (
                          <div className="text-xs text-gray-400">
                            {match.season.name}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {match.status === 'completed' && (
                          <>
                            <div className="font-bold text-lg">
                              {isHome ? match.homeScore : match.awayScore} - {isHome ? match.awayScore : match.homeScore}
                            </div>
                            <span className={`px-2 py-1 rounded text-sm font-bold ${getResultColor(result)}`}>
                              {result}
                            </span>
                          </>
                        )}
                        {match.status === 'live' && (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                            LIVE
                          </span>
                        )}
                        {match.status === 'scheduled' && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                            {format(new Date(match.matchDate), 'HH:mm')}
                          </span>
                        )}
                        {/* NEW: Show status for debugging */}
                        <span className="text-xs text-gray-400">
                          ({match.status})
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {matches.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No matches scheduled for this team yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'transfers' && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-6">Transfer Activity</h3>
            <div className="space-y-4">
              {transfers.map((transfer) => (
                <div key={transfer._id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="font-medium">
                        {transfer.player?.name || 'Unknown Player'}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        {transfer.transferType === 'registration' ? (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                            New Signing
                          </span>
                        ) : (
                          <>
                            <span>{transfer.fromTeam?.name || 'Free Agent'}</span>
                            <span>→</span>
                            <span>{transfer.toTeam?.name}</span>
                          </>
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
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recent transfer activity for this team.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
