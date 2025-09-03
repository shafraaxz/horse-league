// ===========================================
// FILE: pages/matches/[id].js (COMPLETE MATCH DETAILS PAGE)
// ===========================================
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  User, 
  Target, 
  Award, 
  Users,
  AlertCircle,
  Play,
  Trophy,
  Flag
} from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { format } from 'date-fns';

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

export default function MatchDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [match, setMatch] = useState(null);
  const [homeTeamPlayers, setHomeTeamPlayers] = useState([]);
  const [awayTeamPlayers, setAwayTeamPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      fetchMatchData();
    }
  }, [id]);

  const fetchMatchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Try multiple endpoints to fetch match data
      let matchData = null;
      
      try {
        console.log('Fetching match with ID:', id);
        const response = await fetch(`/api/matches/${id}`);
        if (response.ok) {
          matchData = await response.json();
        } else {
          console.log('Primary API failed, trying alternative...');
          // Try alternative endpoint
          const altResponse = await fetch(`/api/get-match?id=${id}`);
          if (altResponse.ok) {
            matchData = await altResponse.json();
          } else {
            throw new Error(`Match not found (${response.status})`);
          }
        }
      } catch (fetchError) {
        console.error('Error fetching match:', fetchError);
        throw new Error('Failed to load match details');
      }
      
      if (!matchData) {
        throw new Error('Match not found');
      }
      
      setMatch(matchData);
      console.log('Match loaded:', matchData);
      
      // Fetch team players if match has teams
      if (matchData.homeTeam?._id && matchData.awayTeam?._id) {
        try {
          const [homeResponse, awayResponse] = await Promise.all([
            fetch(`/api/public/players?teamId=${matchData.homeTeam._id}&limit=25`),
            fetch(`/api/public/players?teamId=${matchData.awayTeam._id}&limit=25`)
          ]);
          
          if (homeResponse.ok) {
            const homeData = await homeResponse.json();
            setHomeTeamPlayers(Array.isArray(homeData) ? homeData : []);
          }
          
          if (awayResponse.ok) {
            const awayData = await awayResponse.json();
            setAwayTeamPlayers(Array.isArray(awayData) ? awayData : []);
          }
        } catch (playersError) {
          console.warn('Could not load team players:', playersError);
        }
      }
      
    } catch (error) {
      console.error('Error in fetchMatchData:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'postponed': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'goal': return <Target className="w-4 h-4 text-green-600" />;
      case 'yellow_card': return <Award className="w-4 h-4 text-yellow-600" />;
      case 'red_card': return <Award className="w-4 h-4 text-red-600" />;
      case 'substitution': return <Users className="w-4 h-4 text-blue-600" />;
      default: return <Flag className="w-4 h-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Match Not Found</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <div className="space-x-4">
          <button
            onClick={fetchMatchData}
            className="btn btn-primary"
          >
            Try Again
          </button>
          <Link href="/matches" className="btn btn-secondary">
            Back to Matches
          </Link>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Match Not Found</h2>
        <p className="text-gray-600 mb-4">The match you're looking for doesn't exist.</p>
        <Link href="/matches" className="btn btn-primary">
          Back to Matches
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Match Header */}
      <div className="card">
        <div className="text-center">
          {/* Live Badge */}
          {match.status === 'live' && (
            <div className="mb-4">
              <div className="inline-flex items-center bg-red-100 text-red-800 px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                <span className="font-semibold">LIVE MATCH</span>
                {match.liveData?.currentMinute && (
                  <span className="ml-2">{match.liveData.currentMinute}'</span>
                )}
              </div>
            </div>
          )}

          {/* Teams and Score */}
          <div className="grid grid-cols-3 items-center gap-8 mb-6">
            {/* Home Team */}
            <div className="text-center">
              {getImageUrl(match.homeTeam?.logo) && (
                <Image
                  src={getImageUrl(match.homeTeam.logo)}
                  alt={match.homeTeam?.name}
                  width={80}
                  height={80}
                  className="rounded-full object-cover mx-auto mb-3"
                  onError={(e) => e.target.style.display = 'none'}
                />
              )}
              <h2 className="text-2xl font-bold text-gray-900">
                {match.homeTeam?.name || 'Home Team'}
              </h2>
              <p className="text-gray-600">Home</p>
            </div>

            {/* Score */}
            <div className="text-center">
              {match.status === 'completed' || match.status === 'live' ? (
                <div className="text-5xl font-bold text-gray-900 mb-2">
                  <span className="text-blue-600">{match.homeScore || 0}</span>
                  <span className="text-gray-400 mx-4">-</span>
                  <span className="text-red-600">{match.awayScore || 0}</span>
                </div>
              ) : (
                <div className="text-3xl font-bold text-gray-500 mb-2">VS</div>
              )}
              
              <div className="text-lg text-gray-600">
                {format(new Date(match.matchDate), 'MMM dd, yyyy')}
              </div>
              <div className="text-sm text-gray-500">
                {format(new Date(match.matchDate), 'HH:mm')}
              </div>
            </div>

            {/* Away Team */}
            <div className="text-center">
              {getImageUrl(match.awayTeam?.logo) && (
                <Image
                  src={getImageUrl(match.awayTeam.logo)}
                  alt={match.awayTeam?.name}
                  width={80}
                  height={80}
                  className="rounded-full object-cover mx-auto mb-3"
                  onError={(e) => e.target.style.display = 'none'}
                />
              )}
              <h2 className="text-2xl font-bold text-gray-900">
                {match.awayTeam?.name || 'Away Team'}
              </h2>
              <p className="text-gray-600">Away</p>
            </div>
          </div>

          {/* Match Status */}
          <div className="flex justify-center items-center space-x-6">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(match.status)}`}>
              {match.status?.charAt(0).toUpperCase() + match.status?.slice(1)}
            </span>
            
            {match.venue && (
              <div className="flex items-center text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                <span>{match.venue}</span>
              </div>
            )}
            
            {match.referee && (
              <div className="flex items-center text-gray-600">
                <User className="w-4 h-4 mr-2" />
                <span>Ref: {match.referee}</span>
              </div>
            )}
          </div>

          {/* Live Match Link */}
          {match.status === 'live' && (
            <div className="mt-6">
              <Link
                href="/matches/live"
                className="inline-flex items-center bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
              >
                <Play className="w-5 h-5 mr-2" />
                Watch Live
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Match Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Match Information */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            Match Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium">
                {format(new Date(match.matchDate), 'EEEE, MMM dd, yyyy')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Time:</span>
              <span className="font-medium">
                {format(new Date(match.matchDate), 'HH:mm')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Round:</span>
              <span className="font-medium">{match.round || 'Regular Season'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Season:</span>
              <span className="font-medium">{match.season?.name || 'Unknown'}</span>
            </div>
            {match.venue && (
              <div className="flex justify-between">
                <span className="text-gray-600">Venue:</span>
                <span className="font-medium">{match.venue}</span>
              </div>
            )}
            {match.referee && (
              <div className="flex justify-between">
                <span className="text-gray-600">Referee:</span>
                <span className="font-medium">{match.referee}</span>
              </div>
            )}
          </div>
        </div>

        {/* Match Statistics */}
        {(match.status === 'completed' || match.status === 'live') && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
              Match Statistics
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Goals</span>
                <div className="flex items-center space-x-4">
                  <span className="font-bold text-blue-600">{match.homeScore || 0}</span>
                  <span className="text-gray-400">-</span>
                  <span className="font-bold text-red-600">{match.awayScore || 0}</span>
                </div>
              </div>
              
              {match.events && match.events.length > 0 && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Events</span>
                    <span className="font-bold">{match.events.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Goals</span>
                    <span className="font-bold text-green-600">
                      {match.events.filter(e => e.type === 'goal').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Cards</span>
                    <span className="font-bold text-yellow-600">
                      {match.events.filter(e => e.type === 'yellow_card' || e.type === 'red_card').length}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              href={`/teams/${match.homeTeam?._id}`}
              className="block w-full btn btn-secondary text-left"
            >
              View {match.homeTeam?.name}
            </Link>
            <Link
              href={`/teams/${match.awayTeam?._id}`}
              className="block w-full btn btn-secondary text-left"
            >
              View {match.awayTeam?.name}
            </Link>
            <Link
              href="/matches"
              className="block w-full btn btn-primary text-left"
            >
              All Matches
            </Link>
            <Link
              href="/standings"
              className="block w-full btn btn-secondary text-left"
            >
              League Standings
            </Link>
          </div>
        </div>
      </div>

      {/* Match Events */}
      {match.events && match.events.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-6 flex items-center">
            <Flag className="w-5 h-5 mr-2 text-green-600" />
            Match Events
          </h3>
          <div className="space-y-3">
            {match.events
              .sort((a, b) => (b.minute || 0) - (a.minute || 0))
              .map((event, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full border">
                      {getEventIcon(event.type)}
                    </div>
                    <div>
                      <div className="font-medium">
                        {event.playerName || event.description || `${event.type.replace('_', ' ').toUpperCase()}`}
                      </div>
                      <div className="text-sm text-gray-600">
                        {event.team === 'home' ? match.homeTeam?.name : match.awayTeam?.name}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-600">{event.minute || 0}'</div>
                    <div className="text-xs text-gray-500 capitalize">
                      {event.type?.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Team Squads */}
      {(homeTeamPlayers.length > 0 || awayTeamPlayers.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Home Team Squad */}
          {homeTeamPlayers.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                {match.homeTeam?.name} Squad
              </h3>
              <div className="space-y-2">
                {homeTeamPlayers.map((player) => (
                  <Link key={player._id} href={`/players/${player._id}`}>
                    <div className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 transition-colors">
                      {getImageUrl(player.photo) ? (
                        <Image
                          src={getImageUrl(player.photo)}
                          alt={player.name}
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
                      <div className="flex-1">
                        <div className="font-medium text-sm">{player.name}</div>
                        <div className="text-xs text-gray-600">
                          {player.jerseyNumber && `#${player.jerseyNumber} • `}
                          {player.position}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {player.stats?.goals || 0} goals
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Away Team Squad */}
          {awayTeamPlayers.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-red-600" />
                {match.awayTeam?.name} Squad
              </h3>
              <div className="space-y-2">
                {awayTeamPlayers.map((player) => (
                  <Link key={player._id} href={`/players/${player._id}`}>
                    <div className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 transition-colors">
                      {getImageUrl(player.photo) ? (
                        <Image
                          src={getImageUrl(player.photo)}
                          alt={player.name}
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
                      <div className="flex-1">
                        <div className="font-medium text-sm">{player.name}</div>
                        <div className="text-xs text-gray-600">
                          {player.jerseyNumber && `#${player.jerseyNumber} • `}
                          {player.position}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {player.stats?.goals || 0} goals
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Additional Match Notes */}
      {match.notes && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Match Notes</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700">{match.notes}</p>
          </div>
        </div>
      )}

      {/* Back Navigation */}
      <div className="flex justify-center">
        <Link href="/matches" className="btn btn-secondary">
          ← Back to All Matches
        </Link>
      </div>
    </div>
  );
}
