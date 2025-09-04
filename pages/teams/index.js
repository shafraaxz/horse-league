import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Users, Trophy, Target, Calendar, LayoutGrid, List } from 'lucide-react';
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
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [seasons, setSeasons] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'list' or 'grid'

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
        // Fetch ONLY completed matches to calculate real stats
        selectedSeason ? 
          fetch(`/api/public/matches?seasonId=${selectedSeason}&status=completed&limit=1000`) : 
          Promise.resolve({ ok: false })
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
        const validMatches = Array.isArray(matchesData) ? matchesData.filter(match => {
          // Use same validation logic as team profile
          return (
            match.status === 'completed' && 
            match.homeScore !== null && 
            match.homeScore !== undefined &&
            match.awayScore !== null && 
            match.awayScore !== undefined &&
            match.homeTeam && 
            match.awayTeam &&
            match.season
          );
        }) : [];
        
        setMatches(validMatches);
        console.log(`Teams index: Found ${matchesData.length} matches, ${validMatches.length} valid completed matches`);
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

  // Calculate team statistics with same logic as team profile
  const calculateTeamStats = (teamId) => {
    const teamMatches = matches.filter(match => 
      (match.homeTeam?._id === teamId || match.awayTeam?._id === teamId)
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

  // Calculate stats for all teams and sort by points (for consistent ordering)
  const teamsWithStats = teams.map(team => ({
    ...team,
    calculatedStats: calculateTeamStats(team._id)
  })).sort((a, b) => b.calculatedStats.points - a.calculatedStats.points);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
        
        <div className="flex items-center space-x-4">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4 mr-2" />
              List
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Grid
            </button>
          </div>

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

      {/* List View */}
      {viewMode === 'list' && (
        <div className="card">
          <div className="divide-y divide-gray-200">
            {teamsWithStats.map((team, index) => {
              const stats = team.calculatedStats;
              
              return (
                <Link key={team._id} href={`/teams/${team._id}`}>
                  <div className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-center space-x-4">
                      {/* Team Logo */}
                      {getImageUrl(team.logo) ? (
                        <Image
                          src={getImageUrl(team.logo)}
                          alt={team.name}
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
                          getImageUrl(team.logo) ? 'hidden' : 'flex'
                        }`}
                      >
                        <Users className="w-6 h-6 text-gray-400" />
                      </div>

                      {/* Team Info */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{team.season?.name}</span>
                          <span>•</span>
                          <span>{team.playerCount || 0} players</span>
                          {stats.matchesPlayed > 0 && (
                            <>
                              <span>•</span>
                              <span>{stats.matchesPlayed} matches played</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Team Stats */}
                    <div className="flex items-center space-x-8">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{stats.wins}</div>
                        <div className="text-xs text-gray-600">Wins</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-yellow-600">{stats.draws}</div>
                        <div className="text-xs text-gray-600">Draws</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">{stats.losses}</div>
                        <div className="text-xs text-gray-600">Losses</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{stats.points}</div>
                        <div className="text-xs text-gray-600">Points</div>
                      </div>
                      {stats.matchesPlayed > 0 && (
                        <div className="text-center">
                          <div className={`text-lg font-bold ${
                            stats.goalDifference >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {stats.goalDifference >= 0 ? '+' : ''}{stats.goalDifference}
                          </div>
                          <div className="text-xs text-gray-600">GD</div>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
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
                    </div>
                  </div>

                  {/* Stats Grid */}
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
      )}

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
