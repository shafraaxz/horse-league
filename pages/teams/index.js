import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Users, Trophy, Target, Calendar, LayoutGrid, List, Search,
  TrendingUp, TrendingDown, Award, Shield, Activity, Filter,
  ChevronRight, Eye, Zap, BarChart3, Star, Crown
} from 'lucide-react';
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
  const [standings, setStandings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [seasons, setSeasons] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'list' or 'grid'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('points'); // 'points', 'name', 'goals', 'wins'
  const [showFilters, setShowFilters] = useState(false);
  const [seasonStats, setSeasonStats] = useState({
    totalTeams: 0,
    totalMatches: 0,
    totalGoals: 0,
    avgGoalsPerMatch: 0
  });

  useEffect(() => {
    fetchSeasons();
  }, []);

  useEffect(() => {
    fetchTeamsAndStandings();
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

  const fetchTeamsAndStandings = async () => {
    try {
      setIsLoading(true);
      
      // Use Promise.all for parallel requests for better performance
      const requests = [
        // Fetch teams with season filter
        selectedSeason 
          ? fetch(`/api/public/teams?seasonId=${selectedSeason}`)
          : fetch('/api/public/teams'),
        // Fetch standings for better stats
        selectedSeason 
          ? fetch(`/api/public/standings?seasonId=${selectedSeason}`)
          : fetch('/api/public/standings'),
        // Fetch comprehensive season stats
        selectedSeason 
          ? fetch(`/api/public/stats?seasonId=${selectedSeason}`)
          : fetch('/api/public/stats')
      ];

      const [teamsResponse, standingsResponse, statsResponse] = await Promise.all(requests);
      
      // Process teams data
      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json();
        setTeams(Array.isArray(teamsData) ? teamsData : []);
        console.log('Teams loaded:', teamsData.length);
      } else {
        console.error('Failed to fetch teams:', teamsResponse.statusText);
        setTeams([]);
      }

      // Process standings data (contains calculated stats)
      if (standingsResponse.ok) {
        const standingsData = await standingsResponse.json();
        setStandings(Array.isArray(standingsData) ? standingsData : []);
        console.log('Standings loaded:', standingsData.length);
      } else {
        console.error('Failed to fetch standings:', standingsResponse.statusText);
        setStandings([]);
      }

      // Process season stats
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setSeasonStats({
          totalTeams: statsData.totalTeams || 0,
          totalMatches: statsData.totalMatches || 0,
          totalGoals: statsData.totalGoals || 0,
          avgGoalsPerMatch: statsData.avgGoalsPerMatch || 0
        });
        console.log('Season stats loaded:', statsData);
      }
      
    } catch (error) {
      console.error('Error fetching teams data:', error);
      setTeams([]);
      setStandings([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Merge teams with standings data for enhanced stats
  const getEnhancedTeamData = () => {
    return teams.map(team => {
      // Find corresponding standings data
      const standingData = standings.find(s => s._id === team._id);
      
      return {
        ...team,
        stats: standingData?.stats || {
          matchesPlayed: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          points: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0
        },
        position: standingData ? standings.indexOf(standingData) + 1 : null
      };
    });
  };

  // Filter and sort teams
  const getFilteredAndSortedTeams = () => {
    const enhancedTeams = getEnhancedTeamData();
    
    // Filter by search query
    const filteredTeams = searchQuery 
      ? enhancedTeams.filter(team => 
          team.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : enhancedTeams;

    // Sort teams
    const sortedTeams = [...filteredTeams].sort((a, b) => {
      switch (sortBy) {
        case 'points':
          return (b.stats.points || 0) - (a.stats.points || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'goals':
          return (b.stats.goalsFor || 0) - (a.stats.goalsFor || 0);
        case 'wins':
          return (b.stats.wins || 0) - (a.stats.wins || 0);
        case 'goalDifference':
          return (b.stats.goalDifference || 0) - (a.stats.goalDifference || 0);
        default:
          return 0;
      }
    });

    return sortedTeams;
  };

  // Get performance indicators for teams
  const getPerformanceIndicator = (team) => {
    const stats = team.stats;
    if (stats.matchesPlayed < 3) return null;
    
    const winRate = (stats.wins / stats.matchesPlayed) * 100;
    if (winRate >= 70) return { icon: Crown, color: 'text-yellow-500', label: 'Excellent' };
    if (winRate >= 50) return { icon: TrendingUp, color: 'text-green-500', label: 'Good' };
    if (winRate >= 30) return { icon: Activity, color: 'text-blue-500', label: 'Average' };
    return { icon: TrendingDown, color: 'text-red-500', label: 'Poor' };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const filteredSortedTeams = getFilteredAndSortedTeams();

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-6 lg:space-y-0">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Teams</h1>
          <p className="text-gray-600">
            {selectedSeason ? `Showing teams from ${seasons.find(s => s._id === selectedSeason)?.name || 'selected season'}` : 'All registered teams'}
          </p>
        </div>
        
        {/* Season Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{seasonStats.totalTeams}</div>
            <div className="text-xs text-blue-700">Teams</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{seasonStats.totalMatches}</div>
            <div className="text-xs text-green-700">Matches</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-600">{seasonStats.totalGoals}</div>
            <div className="text-xs text-yellow-700">Goals</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">{seasonStats.avgGoalsPerMatch}</div>
            <div className="text-xs text-purple-700">Avg/Match</div>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 bg-white p-6 rounded-xl shadow-sm border">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
            />
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="form-input w-48"
          >
            <option value="points">Sort by Points</option>
            <option value="name">Sort by Name</option>
            <option value="wins">Sort by Wins</option>
            <option value="goals">Sort by Goals</option>
            <option value="goalDifference">Sort by Goal Difference</option>
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

        {/* View Toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
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
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'grid' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            Grid
          </button>
        </div>
      </div>

      {/* Results Summary */}
      {searchQuery && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            Found {filteredSortedTeams.length} team{filteredSortedTeams.length !== 1 ? 's' : ''} 
            matching "{searchQuery}"
          </p>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredSortedTeams.map((team, index) => {
              const stats = team.stats;
              const performance = getPerformanceIndicator(team);
              
              return (
                <Link key={team._id} href={`/teams/${team._id}`}>
                  <div className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors cursor-pointer group">
                    <div className="flex items-center space-x-6">
                      {/* Position Badge */}
                      {team.position && (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          team.position === 1 ? 'bg-yellow-500 text-white' :
                          team.position === 2 ? 'bg-gray-400 text-white' :
                          team.position === 3 ? 'bg-yellow-600 text-white' :
                          'bg-gray-200 text-gray-600'
                        }`}>
                          {team.position}
                        </div>
                      )}

                      {/* Team Logo */}
                      <div className="relative">
                        {getImageUrl(team.logo) ? (
                          <Image
                            src={getImageUrl(team.logo)}
                            alt={team.name}
                            width={56}
                            height={56}
                            className="rounded-full object-cover border-2 border-gray-200"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        
                        <div 
                          className={`w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center border-2 border-gray-200 ${
                            getImageUrl(team.logo) ? 'hidden' : 'flex'
                          }`}
                        >
                          <Users className="w-7 h-7 text-gray-400" />
                        </div>

                        {/* Performance Indicator */}
                        {performance && (
                          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center ${performance.color}`}>
                            <performance.icon className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      {/* Team Info */}
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {team.name}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {team.season?.name}
                          </span>
                          <span className="flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            {team.playerCount || 0} players
                          </span>
                          {stats.matchesPlayed > 0 && (
                            <span className="flex items-center">
                              <Activity className="w-3 h-3 mr-1" />
                              {stats.matchesPlayed} matches
                            </span>
                          )}
                          {performance && (
                            <span className={`flex items-center font-medium ${performance.color}`}>
                              <Star className="w-3 h-3 mr-1" />
                              {performance.label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Team Stats */}
                    <div className="flex items-center space-x-8">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{stats.points}</div>
                        <div className="text-xs text-gray-600 uppercase tracking-wide">Points</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-green-600">{stats.wins}</div>
                        <div className="text-xs text-gray-600 uppercase tracking-wide">Wins</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-yellow-600">{stats.draws}</div>
                        <div className="text-xs text-gray-600 uppercase tracking-wide">Draws</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-red-600">{stats.losses}</div>
                        <div className="text-xs text-gray-600 uppercase tracking-wide">Losses</div>
                      </div>
                      {stats.matchesPlayed > 0 && (
                        <>
                          <div className="text-center">
                            <div className="text-lg font-bold text-purple-600">
                              {stats.goalsFor}:{stats.goalsAgainst}
                            </div>
                            <div className="text-xs text-gray-600 uppercase tracking-wide">Goals</div>
                          </div>
                          <div className="text-center">
                            <div className={`text-lg font-bold ${
                              stats.goalDifference >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {stats.goalDifference >= 0 ? '+' : ''}{stats.goalDifference}
                            </div>
                            <div className="text-xs text-gray-600 uppercase tracking-wide">GD</div>
                          </div>
                        </>
                      )}
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Enhanced Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSortedTeams.map((team) => {
            const stats = team.stats;
            const performance = getPerformanceIndicator(team);
            
            return (
              <Link key={team._id} href={`/teams/${team._id}`}>
                <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group transform hover:-translate-y-1 border border-gray-200 hover:border-blue-200">
                  {/* Team Header */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      {/* Position Badge */}
                      {team.position && (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          team.position === 1 ? 'bg-yellow-500 text-white' :
                          team.position === 2 ? 'bg-gray-400 text-white' :
                          team.position === 3 ? 'bg-yellow-600 text-white' :
                          'bg-gray-200 text-gray-600'
                        }`}>
                          {team.position}
                        </div>
                      )}

                      {/* Performance Indicator */}
                      {performance && (
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full bg-gray-100 ${performance.color}`}>
                          <performance.icon className="w-3 h-3" />
                          <span className="text-xs font-medium">{performance.label}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* Team Logo */}
                      <div className="relative">
                        {getImageUrl(team.logo) ? (
                          <Image
                            src={getImageUrl(team.logo)}
                            alt={team.name}
                            width={64}
                            height={64}
                            className="rounded-full object-cover border-2 border-gray-200"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        
                        <div 
                          className={`w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center border-2 border-gray-200 ${
                            getImageUrl(team.logo) ? 'hidden' : 'flex'
                          }`}
                        >
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                      </div>

                      {/* Team Name and Season */}
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                          {team.name}
                        </h3>
                        <p className="text-sm text-gray-600">{team.season?.name}</p>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="p-6">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="flex flex-col items-center">
                          <Users className="w-6 h-6 text-blue-600 mb-1" />
                          <span className="text-xl font-bold text-gray-900">
                            {team.playerCount || 0}
                          </span>
                          <span className="text-xs text-gray-600 uppercase tracking-wide">Players</span>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex flex-col items-center">
                          <Trophy className="w-6 h-6 text-yellow-600 mb-1" />
                          <span className="text-xl font-bold text-gray-900">
                            {stats.wins}
                          </span>
                          <span className="text-xs text-gray-600 uppercase tracking-wide">Wins</span>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex flex-col items-center">
                          <Target className="w-6 h-6 text-green-600 mb-1" />
                          <span className="text-xl font-bold text-gray-900">
                            {stats.points}
                          </span>
                          <span className="text-xs text-gray-600 uppercase tracking-wide">Points</span>
                        </div>
                      </div>
                    </div>

                    {/* Additional Match Info */}
                    {stats.matchesPlayed > 0 && (
                      <div className="pt-4 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <div className="text-sm text-gray-600">
                              <span className="font-medium text-gray-900">{stats.matchesPlayed}</span> played
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">
                              <span className={`font-medium ${stats.goalDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {stats.goalDifference >= 0 ? '+' : ''}{stats.goalDifference}
                              </span> GD
                            </div>
                          </div>
                        </div>
                        <div className="text-center mt-2">
                          <div className="text-sm text-gray-600">
                            <span className="font-medium text-gray-900">{stats.goalsFor}</span> goals for • {' '}
                            <span className="font-medium text-gray-900">{stats.goalsAgainst}</span> against
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Team Description */}
                    {team.description && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {team.description}
                        </p>
                      </div>
                    )}

                    {/* View Details Button */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-center w-full bg-gray-50 group-hover:bg-blue-50 text-gray-700 group-hover:text-blue-700 py-2 rounded-lg text-sm font-medium transition-colors">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                        <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* No Results */}
      {filteredSortedTeams.length === 0 && !isLoading && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            {searchQuery ? 'No Teams Found' : 'No Teams Available'}
          </h2>
          <p className="text-gray-500 max-w-md mx-auto">
            {searchQuery 
              ? `No teams match your search for "${searchQuery}". Try adjusting your search terms.`
              : 'No teams are registered for the selected season. Teams will appear here once they are added to the tournament.'
            }
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Clear Search
            </button>
          )}
        </div>
      )}

      {/* Quick Actions */}
      {filteredSortedTeams.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-blue-600" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/standings"
              className="flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-700 py-3 px-4 rounded-lg font-medium transition-colors"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              View Full Standings
            </Link>
            <Link
              href="/matches"
              className="flex items-center justify-center bg-green-50 hover:bg-green-100 text-green-700 py-3 px-4 rounded-lg font-medium transition-colors"
            >
              <Calendar className="w-4 h-4 mr-2" />
              View Match Schedule
            </Link>
            <Link
              href="/players"
              className="flex items-center justify-center bg-purple-50 hover:bg-purple-100 text-purple-700 py-3 px-4 rounded-lg font-medium transition-colors"
            >
              <Users className="w-4 h-4 mr-2" />
              Browse Players
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
