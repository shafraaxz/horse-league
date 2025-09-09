// ===========================================
// FILE 2: pages/teams/index.js (FIXED VERSION - Enhanced Stats Fetching)
// ===========================================
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
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('points');
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

  // FIXED: Enhanced data fetching with better stats calculation
  const fetchTeamsAndStandings = async () => {
    try {
      setIsLoading(true);
      
      // FIXED: Use Promise.all for parallel requests and better stats
      const requests = [
        // Fetch teams with season filter
        selectedSeason 
          ? fetch(`/api/public/teams?seasonId=${selectedSeason}`)
          : fetch('/api/public/teams'),
        // Fetch standings for better stats
        selectedSeason 
          ? fetch(`/api/public/standings?seasonId=${selectedSeason}`)
          : fetch('/api/public/standings'),
        // FIXED: Fetch comprehensive season stats to get accurate totals
        selectedSeason 
          ? fetch(`/api/public/stats?seasonId=${selectedSeason}`)
          : fetch('/api/public/stats')
      ];

      const [teamsResponse, standingsResponse, statsResponse] = await Promise.all(requests);
      
      // Process teams data
      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json();
        setTeams(Array.isArray(teamsData) ? teamsData : []);
        console.log('FIXED: Teams loaded:', teamsData.length);
      } else {
        console.error('Failed to fetch teams:', teamsResponse.statusText);
        setTeams([]);
      }

      // Process standings data (contains calculated stats)
      if (standingsResponse.ok) {
        const standingsData = await standingsResponse.json();
        setStandings(Array.isArray(standingsData) ? standingsData : []);
        console.log('FIXED: Standings loaded:', standingsData.length);
      } else {
        console.error('Failed to fetch standings:', standingsResponse.statusText);
        setStandings([]);
      }

      // FIXED: Process season stats for accurate goal totals
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setSeasonStats({
          totalTeams: statsData.totalTeams || 0,
          totalMatches: statsData.totalMatches || 0,
          totalGoals: statsData.totalGoals || 0, // This should now be accurate
          avgGoalsPerMatch: statsData.avgGoalsPerMatch || 0
        });
        console.log('FIXED: Season stats loaded:', {
          totalGoals: statsData.totalGoals,
          totalMatches: statsData.totalMatches,
          dataSource: 'Comprehensive stats API'
        });
      } else {
        console.warn('Failed to fetch comprehensive stats, using fallback calculation');
        // Fallback calculation if stats API fails
        await calculateFallbackStats();
      }
      
    } catch (error) {
      console.error('Error fetching teams data:', error);
      setTeams([]);
      setStandings([]);
      await calculateFallbackStats();
    } finally {
      setIsLoading(false);
    }
  };

  // FIXED: Fallback stats calculation that fetches ALL players
  const calculateFallbackStats = async () => {
    try {
      console.log('🔄 Calculating fallback stats...');
      
      const playersResponse = await fetch('/api/public/players');
      if (playersResponse.ok) {
        const playersData = await playersResponse.json();
        if (Array.isArray(playersData)) {
          // Calculate total goals from ALL players using careerStats
          const totalGoals = playersData.reduce((sum, p) => {
            return sum + (p.careerStats?.goals || 0);
          }, 0);
          
          console.log('FIXED: Fallback stats calculated:', {
            totalPlayers: playersData.length,
            totalGoals,
            method: 'Direct player summation'
          });
          
          setSeasonStats(prev => ({
            ...prev,
            totalGoals
          }));
        }
      }
    } catch (error) {
      console.error('Error calculating fallback stats:', error);
    }
  };

  // Get enhanced team data with standings
  const getEnhancedTeamData = () => {
    return teams.map(team => {
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
    
    const filteredTeams = searchQuery 
      ? enhancedTeams.filter(team => 
          team.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : enhancedTeams;

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

  // Get performance indicator for teams
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
          {/* ADDED: Debug info for verification */}
          <p className="text-sm text-blue-600">
            Total Goals: {seasonStats.totalGoals} • Matches: {seasonStats.totalMatches} • Avg: {seasonStats.avgGoalsPerMatch}
          </p>
        </div>
        
        {/* Season Statistics Cards - FIXED */}
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
      <div className="bg-white rounded-xl shadow-lg p-6 border">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0 mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
          </div>

          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
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
            </div>

            {/* Sort Controls */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="form-input py-1 text-sm"
              >
                <option value="points">Points</option>
                <option value="name">Name</option>
                <option value="goals">Goals For</option>
                <option value="wins">Wins</option>
                <option value="goalDifference">Goal Difference</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
            {/* Search Input */}
            <div>
              <label className="form-label text-sm">Search Teams</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by team name..."
                  className="form-input pl-10"
                />
              </div>
            </div>

            {/* Season Filter */}
            {seasons.length > 0 && (
              <div>
                <label className="form-label text-sm">Season</label>
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className="form-input w-full"
                >
                  <option value="">All Seasons</option>
                  {seasons.map(season => (
                    <option key={season._id} value={season._id}>
                      {season.name} {season.isActive && '(Active)'}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Teams Display */}
      {viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSortedTeams.map((team) => {
            const performance = getPerformanceIndicator(team);
            return (
              <Link key={team._id} href={`/teams/${team._id}`}>
                <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group transform hover:-translate-y-1 border border-gray-200 hover:border-blue-200">
                  {/* Position Badge */}
                  {team.position && (
                    <div className="absolute top-4 left-4 z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                        team.position <= 3 ? 'bg-yellow-500' : 
                        team.position <= 6 ? 'bg-blue-500' : 'bg-gray-500'
                      }`}>
                        {team.position}
                      </div>
                    </div>
                  )}

                  {/* Team Content */}
                  <div className="p-6">
                    <div className="text-center mb-4">
                      {/* Team Logo */}
                      <div className="relative mb-3">
                        {getImageUrl(team.logo) ? (
                          <Image
                            src={getImageUrl(team.logo)}
                            alt={team.name}
                            width={80}
                            height={80}
                            className="rounded-full object-cover mx-auto border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto border-2 border-gray-200">
                            <Shield className="w-10 h-10 text-gray-400" />
                          </div>
                        )}
                        
                        {/* Performance Indicator */}
                        {performance && (
                          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center bg-white border-2 border-gray-200 ${performance.color}`}>
                            <performance.icon className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {team.name}
                      </h3>
                      <p className="text-sm text-gray-600">{team.playerCount || 0} players</p>
                    </div>

                    {/* Team Stats */}
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Points:</span>
                        <span className="font-bold text-blue-600">{team.stats.points}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Matches:</span>
                        <span className="font-medium">{team.stats.matchesPlayed}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">W/D/L:</span>
                        <span className="font-medium text-green-600">
                          {team.stats.wins}/{team.stats.draws}/{team.stats.losses}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Goals:</span>
                        <span className="font-medium">
                          {team.stats.goalsFor} - {team.stats.goalsAgainst}
                        </span>
                      </div>
                    </div>

                    {/* Performance Badge */}
                    {performance && (
                      <div className={`text-center p-2 rounded-lg bg-gray-50 mb-4`}>
                        <div className={`text-sm font-medium ${performance.color}`}>
                          {performance.label} Form
                        </div>
                      </div>
                    )}

                    {/* View Details Button */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-center w-full bg-gray-50 group-hover:bg-blue-50 text-gray-700 group-hover:text-blue-700 py-2 rounded-lg text-sm font-medium transition-colors">
                        <Eye className="w-4 h-4 mr-2" />
                        View Team
                        <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredSortedTeams.map((team) => {
              const performance = getPerformanceIndicator(team);
              return (
                <Link key={team._id} href={`/teams/${team._id}`}>
                  <div className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors cursor-pointer group">
                    <div className="flex items-center space-x-6">
                      {/* Position */}
                      {team.position && (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                          team.position <= 3 ? 'bg-yellow-500' : 
                          team.position <= 6 ? 'bg-blue-500' : 'bg-gray-500'
                        }`}>
                          {team.position}
                        </div>
                      )}

                      {/* Team Logo and Info */}
                      <div className="flex items-center space-x-4">
                        {getImageUrl(team.logo) ? (
                          <Image
                            src={getImageUrl(team.logo)}
                            alt={team.name}
                            width={60}
                            height={60}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-15 h-15 bg-gray-200 rounded-full flex items-center justify-center">
                            <Shield className="w-8 h-8 text-gray-400" />
                          </div>
                        )}

                        <div>
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {team.name}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span>{team.playerCount || 0} players</span>
                            {performance && (
                              <span className={`flex items-center ${performance.color}`}>
                                <performance.icon className="w-3 h-3 mr-1" />
                                {performance.label}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Team Stats */}
                    <div className="flex items-center space-x-8">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{team.stats.points}</div>
                        <div className="text-xs text-gray-600">Points</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{team.stats.wins}</div>
                        <div className="text-xs text-gray-600">Wins</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">{team.stats.goalsFor}</div>
                        <div className="text-xs text-gray-600">Goals</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-600">{team.stats.goalDifference > 0 ? '+' : ''}{team.stats.goalDifference}</div>
                        <div className="text-xs text-gray-600">Diff</div>
                      </div>
                      
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* No Results */}
      {filteredSortedTeams.length === 0 && !isLoading && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">No Teams Found</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            {searchQuery ? `No teams match "${searchQuery}".` : 'No teams found for the selected criteria.'}
          </p>
        </div>
      )}

      {/* League Information */}
      {filteredSortedTeams.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            <Trophy className="w-5 h-5 mr-2" />
            League Statistics
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{filteredSortedTeams.length}</div>
              <div className="text-blue-700">Total Teams</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredSortedTeams.reduce((sum, team) => sum + (team.stats.matchesPlayed || 0), 0)}
              </div>
              <div className="text-green-700">Total Matches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {filteredSortedTeams.reduce((sum, team) => sum + (team.stats.goalsFor || 0), 0)}
              </div>
              <div className="text-yellow-700">Total Goals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((filteredSortedTeams.reduce((sum, team) => sum + (team.stats.goalsFor || 0), 0) / Math.max(filteredSortedTeams.reduce((sum, team) => sum + (team.stats.matchesPlayed || 0), 0), 1)) * 10) / 10}
              </div>
              <div className="text-purple-700">Avg Goals/Match</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
