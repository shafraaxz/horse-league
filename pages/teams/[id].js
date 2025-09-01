// ===========================================
// FILE: pages/teams/[id].js
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
  TrendingDown
} from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { format } from 'date-fns';
import { calculateAge } from '../../lib/utils';

export default function TeamProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

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
      const teamData = await teamResponse.json();
      setTeam(teamData);

      // Fetch team players
      const playersResponse = await fetch(`/api/public/players?teamId=${id}`);
      const playersData = await playersResponse.json();
      setPlayers(playersData);

      // Fetch team matches
      const matchesResponse = await fetch(`/api/public/matches?teamId=${id}&limit=10`);
      const matchesData = await matchesResponse.json();
      setMatches(matchesData);

      // Fetch recent transfers
      const transfersResponse = await fetch(`/api/public/transfers?teamId=${id}&limit=5`);
      const transfersData = await transfersResponse.json();
      setTransfers(transfersData);

    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setIsLoading(false);
    }
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

  return (
    <div className="space-y-8">
      {/* Team Header */}
      <div className="card">
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-8">
          <div className="flex items-center space-x-6">
            {team.logo?.url ? (
              <Image
                src={team.logo.url}
                alt={team.name}
                width={100}
                height={100}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                <Users className="w-12 h-12 text-gray-400" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
              <p className="text-gray-600">{team.season?.name}</p>
              {team.foundedYear && (
                <p className="text-sm text-gray-500">Founded {team.foundedYear}</p>
              )}
            </div>
          </div>

          <div className="flex-1">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{players.length}</div>
                <div className="text-gray-600 text-sm">Players</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{team.stats?.wins || 0}</div>
                <div className="text-gray-600 text-sm">Wins</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{team.stats?.draws || 0}</div>
                <div className="text-gray-600 text-sm">Draws</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{team.stats?.points || 0}</div>
                <div className="text-gray-600 text-sm">Points</div>
              </div>
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

                  <div className="flex items-center">
                    <div className="w-4 h-4 mr-3" style={{ backgroundColor: team.homeColor }}></div>
                    <span className="text-sm">
                      <strong>Home Kit:</strong> {team.homeColor}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <div className="w-4 h-4 mr-3" style={{ backgroundColor: team.awayColor }}></div>
                    <span className="text-sm">
                      <strong>Away Kit:</strong> {team.awayColor}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Match Statistics */}
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">Match Statistics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Matches Played</span>
                      <span className="font-semibold">{team.stats?.matchesPlayed || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Wins</span>
                      <span className="font-semibold text-green-600">{team.stats?.wins || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Draws</span>
                      <span className="font-semibold text-yellow-600">{team.stats?.draws || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Losses</span>
                      <span className="font-semibold text-red-600">{team.stats?.losses || 0}</span>
                    </div>
                    <div className="flex justify-between border-t pt-3">
                      <span className="text-gray-600">Points</span>
                      <span className="font-bold text-blue-600">{team.stats?.points || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Goal Statistics */}
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">Goal Statistics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Goals For</span>
                      <span className="font-semibold text-green-600">{team.stats?.goalsFor || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Goals Against</span>
                      <span className="font-semibold text-red-600">{team.stats?.goalsAgainst || 0}</span>
                    </div>
                    <div className="flex justify-between border-t pt-3">
                      <span className="text-gray-600">Goal Difference</span>
                      <span className={`font-bold ${
                        (team.stats?.goalsFor || 0) - (team.stats?.goalsAgainst || 0) >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {((team.stats?.goalsFor || 0) - (team.stats?.goalsAgainst || 0)) >= 0 ? '+' : ''}
                        {(team.stats?.goalsFor || 0) - (team.stats?.goalsAgainst || 0)}
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
                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center space-x-3">
                      {player.photo?.url ? (
                        <Image
                          src={player.photo.url}
                          alt={`${player.firstName} ${player.lastName}`}
                          width={48}
                          height={48}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-medium">
                          {player.firstName} {player.lastName}
                        </div>
                        <div className="text-sm text-gray-600">{player.position}</div>
                        <div className="text-sm text-gray-500">
                          {player.jerseyNumber && `#${player.jerseyNumber} • `}
                          Age {calculateAge(player.dateOfBirth)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-600">
                          {player.stats?.goals || 0} goals
                        </div>
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
            <h3 className="text-lg font-semibold mb-6">Recent Matches</h3>
            <div className="space-y-4">
              {matches.map((match) => {
                const isHome = match.homeTeam._id === team._id;
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
                          {isHome ? 'vs' : '@'} {opponent.name}
                        </div>
                        {match.venue && (
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="w-3 h-3 mr-1" />
                            {match.venue}
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
                        {transfer.player.firstName} {transfer.player.lastName}
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
                            <span>{transfer.toTeam.name}</span>
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
                          ${transfer.transferFee.toLocaleString()}
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