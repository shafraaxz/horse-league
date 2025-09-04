import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Users, Trophy, Target, Calendar } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

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

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]); // NEW: Store matches for calculations
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [seasons, setSeasons] = useState([]);

  useEffect(() => {
    fetchSeasons();
  }, []);

  useEffect(() => {
    fetchTeamsAndMatches();
  }, [selectedSeason]);

  const fetchSeasons = async () => {
    try {
      const response = await fetch('/api/public/seasons');
      if (response.ok) {
        const data = await response.json();
        setSeasons(Array.isArray(data) ? data : []);
        
        // Set active season as default
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

  const fetchTeamsAndMatches = async () => {
    try {
      setIsLoading(true);
      
      // Fetch teams
      const teamsUrl = selectedSeason 
        ? `/api/public/teams?seasonId=${selectedSeason}` 
        : '/api/public/teams';
      
      const [teamsResponse, matchesResponse] = await Promise.all([
        fetch(teamsUrl),
        // Fetch matches to calculate real stats
        selectedSeason ? fetch(`/api/public/matches?seasonId=${selectedSeason}&status=completed`) : Promise.resolve({ ok: false })
      ]);
      
      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json();
        setTeams(Array.isArray(teamsData) ? teamsData : []);
      } else {
        console.error('Failed to fetch teams:', teamsResponse.statusText);
        setTeams([]);
      }

      // Fetch completed matches for stats calculation
      if (matchesResponse.ok) {
        const matchesData = await matchesResponse.json();
        setMatches(Array.isArray(matchesData) ? matchesData : []);
      } else {
        setMatches([]);
      }
      
    } catch (error) {
      console.error('Error fetching teams and matches:', error);
      setTeams([]);
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  // NEW: Calculate real-time team statistics
  const calculateTeamStats = (teamId) => {
    const teamMatches = matches.filter(match => 
      (match.homeTeam?._id === teamId || match.awayTeam?._id === teamId) &&
      match.status === 'completed'
    );

    let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;

    teamMatches.forEach(match => {
      const isHome = match.homeTeam?._id === teamId;
      const teamScore = isHome ? (match.homeScore || 0) : (match.awayScore || 0);
      const opponentScore = isHome ? (match.awayScore || 0) : (match.homeScore || 0);

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
    const matchesPlayed = teamMatches.length;

    return {
      matchesPlayed,
      wins,
      draws,
      losses,
      points,
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst
    };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Calculate stats for all teams and sort by points
  const teamsWithStats = teams.map(team => ({
    ...team,
    calculatedStats: calculateTeamStats(team._id)
  })).sort((a, b) => b.calculatedStats.points - a.calculatedStats.points);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
        
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

      {/* NEW: League Table View (when season is selected) */}
      {selectedSeason && teamsWithStats.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">League Table</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">MP</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">W</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">D</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">L</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">GF</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">GA</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">GD</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pts</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teamsWithStats.map((team, index) => {
                  const stats = team.calculatedStats;
                  return (
                    <tr key={team._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/teams/${team._id}`}>
                          <div className="flex items-center cursor-pointer hover:text-blue-600">
                            {getImageUrl(team.logo) ? (
                              <Image
                                src={getImageUrl(team.logo)}
                                alt={team.name}
                                width={24}
                                height={24}
                                className="rounded-full object-cover mr-3"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  if (e.target.nextSibling) {
                                    e.target.nextSibling.style.display = 'flex';
                                  }
                                }}
                              />
                            ) : null}
                            <div 
                              className={`w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center mr-3 ${
                                getImageUrl(team.logo) ? 'hidden' : 'flex'
                              }`}
                            >
                              <Users className="w-3 h-3 text-gray-400" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{team.name}</span>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{stats.matchesPlayed}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-center font-medium">{stats.wins}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 text-center font-medium">{stats.draws}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-center font-medium">{stats.losses}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{stats.goalsFor}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{stats.goalsAgainst}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-center font-medium ${
                        stats.goalDifference >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stats.goalDifference >= 0 ? '+' : ''}{stats.goalDifference}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 text-center font-bold">{stats.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamsWithStats.map((team) => {
          const stats = team.calculatedStats;
          
          return (
            <Link key={team._id} href={`/teams/${team._id}`}>
              <div className="card hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center space-x-4 mb-4">
                  {getImageUrl(team.logo) ? (
                    <Image
                      src={getImageUrl(team.logo)}
                      alt={team.name}
                      width={60}
                      height={60}
                      className="rounded-full object-cover"
                      onError={(e) => {
                        console.error('Team logo failed to load:', team.logo);
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) {
                          e.target.nextSibling.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  
                  <div 
                    className={`w-15 h-15 bg-gray-200 rounded-full flex items-center justify-center ${
                      getImageUrl(team.logo) ? 'hidden' : 'flex'
                    }`}
                  >
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{team.name}</h3>
                    <p className="text-gray-600">{team.season?.name}</p>
                    {/* Show league position if season selected */}
                    {selectedSeason && (
                      <p className="text-sm text-blue-600 font-medium">
                        #{teamsWithStats.findIndex(t => t._id === team._id) + 1} in league
                      </p>
                    )}
                  </div>
                </div>

                {/* Updated Stats Grid */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="flex flex-col items-center">
                    <Users className="w-8 h-8 text-blue-600 mb-2" />
                    <span className="text-2xl font-bold text-gray-900">
                      {team.playerCount || 0}
                    </span>
                    <span className="text-sm text-gray-600">Players</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <Trophy className="w-8 h-8 text-yellow-600 mb-2" />
                    <span className="text-2xl font-bold text-gray-900">
                      {stats.wins}
                    </span>
                    <span className="text-sm text-gray-600">Wins</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <Target className="w-8 h-8 text-green-600 mb-2" />
                    <span className="text-2xl font-bold text-gray-900">
                      {stats.points}
                    </span>
                    <span className="text-sm text-gray-600">Points</span>
                  </div>
                </div>

                {/* Additional match info */}
                {stats.matchesPlayed > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{stats.matchesPlayed}</span> matches played •{' '}
                      <span className="font-medium">{stats.goalsFor}</span> goals for •{' '}
                      <span className={`font-medium ${stats.goalDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stats.goalDifference >= 0 ? '+' : ''}{stats.goalDifference} GD
                      </span>
                    </div>
                  </div>
                )}

                {team.description && (
                  <p className="mt-4 text-gray-600 text-sm line-clamp-2">
                    {team.description}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {teams.length === 0 && (
        <div className="card text-center py-12">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">No Teams Found</h2>
          <p className="text-gray-500">
            No teams are registered for the selected season.
          </p>
        </div>
      )}

      {/* Season Summary Stats */}
      {selectedSeason && matches.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Season Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{teams.length}</div>
              <div className="text-gray-600">Teams</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{matches.length}</div>
              <div className="text-gray-600">Matches Played</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {matches.reduce((sum, match) => sum + (match.homeScore || 0) + (match.awayScore || 0), 0)}
              </div>
              <div className="text-gray-600">Total Goals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {matches.length > 0 ? 
                  (matches.reduce((sum, match) => sum + (match.homeScore || 0) + (match.awayScore || 0), 0) / matches.length).toFixed(1) : 
                  '0.0'
                }
              </div>
              <div className="text-gray-600">Goals per Match</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
