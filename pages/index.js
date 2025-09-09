// FILE: pages/index.js (Enhanced with more statistics and attractive design)
// ===========================================
import { useState, useEffect } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { 
  Trophy, Users, Calendar, TrendingUp, Play, Target, Award, 
  Clock, Activity, Zap, Star, BarChart3, Shield, Timer,
  Flame, Crown, Medal, ChevronRight, Eye, ArrowUp, RefreshCw
} from 'lucide-react';
import { format, isToday, isTomorrow, isYesterday } from 'date-fns';

export default function Home() {
  const [liveMatch, setLiveMatch] = useState(null);
  const [recentTransfers, setRecentTransfers] = useState([]);
  const [standings, setStandings] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [topScorers, setTopScorers] = useState([]);
  const [topAssists, setTopAssists] = useState([]);
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalPlayers: 0,
    totalMatches: 0,
    totalGoals: 0,
    completedMatches: 0,
    liveMatches: 0,
    scheduledMatches: 0,
    totalTransfers: 0,
    avgGoalsPerMatch: 0,
    matchCompletionRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
    // Auto-refresh every 30 seconds for live data
    const interval = setInterval(fetchHomeData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchHomeData = async () => {
    try {
      console.log('Fetching enhanced home page data...');
      setIsLoading(true);
      
      // Fetch comprehensive statistics from the stats API
      try {
        const statsResponse = await fetch('/api/public/stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          const avgGoalsPerMatch = statsData.totalGoals && statsData.completedMatches > 0 
            ? Math.round((statsData.totalGoals / statsData.completedMatches) * 10) / 10 
            : 0;
          
          setStats({
            ...statsData,
            avgGoalsPerMatch
          });
          console.log('Enhanced stats:', statsData);
        }
      } catch (error) {
        console.error('Error fetching comprehensive stats:', error);
        // Fallback to individual API calls
        await fetchBasicStats();
      }

      // Fetch live match
      try {
        const liveResponse = await fetch('/api/public/matches?status=live&limit=1');
        if (liveResponse.ok) {
          const liveData = await liveResponse.json();
          if (Array.isArray(liveData) && liveData.length > 0) {
            setLiveMatch(liveData[0]);
            console.log('Live match found:', liveData[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching live matches:', error);
      }

      // Fetch recent transfers
      try {
        const transfersResponse = await fetch('/api/public/transfers?limit=8');
        if (transfersResponse.ok) {
          const transfersData = await transfersResponse.json();
          setRecentTransfers(Array.isArray(transfersData) ? transfersData : []);
          console.log('Recent transfers:', transfersData?.length || 0);
        }
      } catch (error) {
        console.error('Error fetching transfers:', error);
      }

      // Fetch league standings
      try {
        const standingsResponse = await fetch('/api/public/standings?limit=8');
        if (standingsResponse.ok) {
          const standingsData = await standingsResponse.json();
          setStandings(Array.isArray(standingsData) ? standingsData : []);
          console.log('Standings:', standingsData?.length || 0);
        } else {
          // Fallback to teams data
          const teamsResponse = await fetch('/api/public/teams?limit=8');
          if (teamsResponse.ok) {
            const teamsData = await teamsResponse.json();
            setStandings(Array.isArray(teamsData) ? teamsData : []);
          }
        }
      } catch (error) {
        console.error('Error fetching standings:', error);
      }

      // Fetch upcoming matches
      try {
        const matchesResponse = await fetch('/api/public/matches?status=scheduled&limit=6');
        if (matchesResponse.ok) {
          const matchesData = await matchesResponse.json();
          setUpcomingMatches(Array.isArray(matchesData) ? matchesData : []);
          console.log('Upcoming matches:', matchesData?.length || 0);
        }
      } catch (error) {
        console.error('Error fetching upcoming matches:', error);
      }

      // Fetch recent completed matches
      try {
        const recentResponse = await fetch('/api/public/matches?status=completed&limit=6');
        if (recentResponse.ok) {
          const recentData = await recentResponse.json();
          setRecentMatches(Array.isArray(recentData) ? recentData : []);
          console.log('Recent matches:', recentData?.length || 0);
        }
      } catch (error) {
        console.error('Error fetching recent matches:', error);
      }

      // Fetch top players (goals and assists) - FIXED VERSION
      try {
        const playersResponse = await fetch('/api/public/players');
        if (playersResponse.ok) {
          const playersData = await playersResponse.json();
          if (Array.isArray(playersData)) {
            console.log('Raw players data sample:', playersData.slice(0, 3).map(p => ({
              name: p.name,
              careerGoals: p.careerStats?.goals,
              statsGoals: p.stats?.goals,
              careerAssists: p.careerStats?.assists,
              statsAssists: p.stats?.assists
            })));
            
            // Sort by goals (use careerStats first, fallback to stats, then 0)
            const scorers = playersData
              .map(player => ({
                ...player,
                // Normalize goals field - use careerStats first, then stats, then 0
                normalizedGoals: player.careerStats?.goals || player.stats?.goals || 0,
                normalizedAssists: player.careerStats?.assists || player.stats?.assists || 0
              }))
              .filter(p => p.normalizedGoals > 0)
              .sort((a, b) => b.normalizedGoals - a.normalizedGoals)
              .slice(0, 5);
            
            setTopScorers(scorers);
            console.log('Top scorers after fix:', scorers.map(p => `${p.name}: ${p.normalizedGoals} goals`));
            
            // Sort by assists
            const assisters = playersData
              .map(player => ({
                ...player,
                normalizedAssists: player.careerStats?.assists || player.stats?.assists || 0
              }))
              .filter(p => p.normalizedAssists > 0)
              .sort((a, b) => b.normalizedAssists - a.normalizedAssists)
              .slice(0, 5);
            
            setTopAssists(assisters);
            console.log('Top assisters after fix:', assisters.map(p => `${p.name}: ${p.normalizedAssists} assists`));
          }
        }
      } catch (error) {
        console.error('Error fetching top players:', error);
      }

      console.log('Enhanced home data fetch completed');
    } catch (error) {
      console.error('Error in fetchHomeData:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBasicStats = async () => {
    try {
      const [teamsRes, playersRes, matchesRes] = await Promise.all([
        fetch('/api/public/teams'),
        fetch('/api/public/players'),
        fetch('/api/public/matches')
      ]);
      
      let totalTeams = 0;
      let totalPlayers = 0;
      let totalMatches = 0;
      let totalGoals = 0;
      let completedMatches = 0;
      let liveMatches = 0;
      let scheduledMatches = 0;
      
      if (teamsRes.ok) {
        const teams = await teamsRes.json();
        totalTeams = Array.isArray(teams) ? teams.length : 0;
      }
      
      if (playersRes.ok) {
        const players = await playersRes.json();
        if (Array.isArray(players)) {
          totalPlayers = players.length;
          totalGoals = players.reduce((sum, p) => {
            // Use the same normalization logic for consistency
            const goals = p.careerStats?.goals || p.stats?.goals || 0;
            return sum + goals;
          }, 0);
        }
      }
      
      if (matchesRes.ok) {
        const matches = await matchesRes.json();
        if (Array.isArray(matches)) {
          totalMatches = matches.length;
          completedMatches = matches.filter(m => m.status === 'completed').length;
          liveMatches = matches.filter(m => m.status === 'live').length;
          scheduledMatches = matches.filter(m => m.status === 'scheduled').length;
        }
      }
      
      const avgGoalsPerMatch = completedMatches > 0 ? Math.round((totalGoals / completedMatches) * 10) / 10 : 0;
      const matchCompletionRate = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;
      
      setStats({
        totalTeams,
        totalPlayers,
        totalMatches,
        totalGoals,
        completedMatches,
        liveMatches,
        scheduledMatches,
        totalTransfers: 0,
        avgGoalsPerMatch,
        matchCompletionRate
      });
    } catch (error) {
      console.error('Error fetching basic stats:', error);
    }
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
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading Tournament Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Enhanced Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 rounded-3xl">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/5 rounded-full animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-24 h-24 bg-white/5 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/5 rounded-full animate-pulse delay-500"></div>
          <div className="absolute top-1/4 right-1/4 w-20 h-20 bg-white/5 rounded-full animate-pulse delay-700"></div>
        </div>
        
        <div className="relative px-8 py-20 sm:py-28 lg:py-36">
          <div className="text-center max-w-5xl mx-auto">
            {/* Tournament Logo */}
            <div className="mb-10">
              <NextImage
                src="https://res.cloudinary.com/dq8lszs2o/image/upload/v1756292892/horse-futsal-league/banners/league-banner-1756292892007.png"
                alt="Horse Futsal Tournament"
                width={700}
                height={250}
                className="mx-auto max-w-full h-auto object-contain drop-shadow-2xl"
                priority
              />
            </div>
            
            {/* Tagline with animation */}
            <div className="mb-12">
              <h2 className="text-2xl md:text-4xl text-white/90 mb-4 font-light tracking-wide">
                The Premier Futsal League Experience
              </h2>
              <p className="text-lg md:text-xl text-blue-200 max-w-2xl mx-auto">
                Join the excitement of fast-paced futsal action with real-time updates, 
                comprehensive statistics, and thrilling match experiences.
              </p>
            </div>
            
            {/* Enhanced Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
              {liveMatch && (
                <Link
                  href="/matches/live"
                  className="group inline-flex items-center bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-10 py-5 rounded-2xl text-lg font-bold transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-xl hover:shadow-2xl"
                >
                  <div className="flex items-center mr-4">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse mr-2"></div>
                    <Play className="w-5 h-5 fill-current" />
                  </div>
                  Watch Live Match
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
              
              <Link
                href="/standings"
                className="group inline-flex items-center bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-10 py-5 rounded-2xl text-lg font-semibold transition-all duration-300 border-2 border-white/20 hover:border-white/40 hover:scale-105 hover:-translate-y-1"
              >
                <Trophy className="w-5 h-5 mr-3" />
                League Table
                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Quick Stats in Hero */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white mb-1">{stats.totalTeams}</div>
                <div className="text-blue-200 text-sm uppercase tracking-wider">Teams</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white mb-1">{stats.totalPlayers}</div>
                <div className="text-blue-200 text-sm uppercase tracking-wider">Players</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white mb-1">{stats.totalMatches}</div>
                <div className="text-blue-200 text-sm uppercase tracking-wider">Matches</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white mb-1">{stats.totalGoals}</div>
                <div className="text-blue-200 text-sm uppercase tracking-wider">Goals</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Match Alert */}
      {liveMatch && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <div className="relative">
                  <div className="w-4 h-4 bg-red-500 rounded-full animate-ping absolute"></div>
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                </div>
                <span className="text-red-700 font-bold text-lg ml-3">LIVE NOW</span>
              </div>
              <div className="text-xl font-bold text-gray-800">
                {liveMatch.homeTeam?.name || 'Team A'} 
                <span className="mx-4 text-2xl text-red-600">
                  {liveMatch.homeScore || 0} - {liveMatch.awayScore || 0}
                </span>
                {liveMatch.awayTeam?.name || 'Team B'}
              </div>
            </div>
            <Link
              href={`/matches/${liveMatch._id}`}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>Watch Live</span>
            </Link>
          </div>
        </div>
      )}

      {/* Enhanced Statistics Grid */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Tournament Statistics</h2>
          <p className="text-gray-600">Live data from the current season</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-blue-600" />
              <span className="text-xs font-medium text-blue-600 bg-blue-200 px-2 py-1 rounded-full">TEAMS</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalTeams}</div>
            <p className="text-sm text-gray-600">Registered Teams</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-green-600" />
              <span className="text-xs font-medium text-green-600 bg-green-200 px-2 py-1 rounded-full">PLAYERS</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalPlayers}</div>
            <p className="text-sm text-gray-600">Active Players</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8 text-purple-600" />
              <span className="text-xs font-medium text-purple-600 bg-purple-200 px-2 py-1 rounded-full">MATCHES</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalMatches}</div>
            <p className="text-sm text-gray-600">Total Matches</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <Target className="w-8 h-8 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-600 bg-yellow-200 px-2 py-1 rounded-full">GOALS</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalGoals}</div>
            <p className="text-sm text-gray-600">Goals Scored</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 text-indigo-600" />
              <span className="text-xs font-medium text-indigo-600 bg-indigo-200 px-2 py-1 rounded-full">AVG</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.avgGoalsPerMatch}</div>
            <p className="text-sm text-gray-600">Goals Per Match</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="w-8 h-8 text-red-600" />
              <span className="text-xs font-medium text-red-600 bg-red-200 px-2 py-1 rounded-full">RATE</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.matchCompletionRate}%</div>
            <p className="text-sm text-gray-600">Completion Rate</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid - 4 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-8">
        
        {/* League Standings */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 h-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                League Table
              </h3>
              <Link href="/standings" className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            <div className="space-y-3">
              {standings.slice(0, 6).map((team, index) => (
                <div key={team._id} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-yellow-600 text-white' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{team.name}</p>
                      <p className="text-xs text-gray-500">
                        {team.stats?.wins || 0}W {team.stats?.draws || 0}D {team.stats?.losses || 0}L
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{team.stats?.points || 0}</p>
                    <p className="text-xs text-gray-500">pts</p>
                  </div>
                </div>
              ))}
              {standings.length === 0 && (
                <p className="text-gray-500 text-center py-8">No standings data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Top Scorers - FIXED LINKS */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 h-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <Target className="w-5 h-5 mr-2 text-red-500" />
                Top Scorers
              </h3>
              <Link href="/players" className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            <div className="space-y-3">
              {topScorers.slice(0, 5).map((player, index) => (
                <div key={player._id} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-yellow-600 text-white' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <Link href={`/players/${player._id}`} className="block hover:text-blue-600 transition-colors">
                        <p className="font-medium text-sm">{player.name}</p>
                        <p className="text-xs text-gray-500">{player.currentTeam?.name || 'Free Agent'}</p>
                      </Link>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-red-600">
                      {player.normalizedGoals || player.careerStats?.goals || player.stats?.goals || 0}
                    </p>
                    <p className="text-xs text-gray-500">goals</p>
                  </div>
                </div>
              ))}
              {topScorers.length === 0 && (
                <p className="text-gray-500 text-center py-8">No scoring data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Matches */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 h-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-500" />
                Upcoming
              </h3>
              <Link href="/matches" className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            <div className="space-y-4">
              {upcomingMatches.slice(0, 4).map((match) => (
                <div key={match._id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      {formatMatchDate(match.matchDate)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(match.matchDate), 'HH:mm')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium truncate">{match.homeTeam?.name || 'TBD'}</span>
                    <span className="text-gray-500 mx-2">vs</span>
                    <span className="font-medium truncate">{match.awayTeam?.name || 'TBD'}</span>
                  </div>
                </div>
              ))}
              {upcomingMatches.length === 0 && (
                <p className="text-gray-500 text-center py-8">No upcoming matches</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Transfers */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 h-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                Transfers
              </h3>
              <Link href="/transfers" className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            <div className="space-y-4">
              {recentTransfers.slice(0, 5).map((transfer) => (
                <div key={transfer._id} className="border-l-4 border-green-500 pl-3 py-1">
                  <p className="font-medium text-sm">
                    {transfer.player?.name || 'Unknown Player'}
                  </p>
                  <p className="text-xs text-gray-600">
                    {transfer.fromTeam ? `${transfer.fromTeam.name} → ` : 'New → '}
                    {transfer.toTeam?.name || 'Free Agent'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatMatchDate(transfer.transferDate)}
                  </p>
                </div>
              ))}
              {recentTransfers.length === 0 && (
                <p className="text-gray-500 text-center py-8">No recent transfers</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Results Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Shield className="w-6 h-6 mr-3 text-green-600" />
            Recent Results
          </h2>
          <Link href="/matches" className="text-blue-600 hover:text-blue-800 flex items-center font-medium">
            View All Matches
            <ChevronRight className="w-5 h-5 ml-1" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentMatches.slice(0, 6).map((match) => (
            <div key={match._id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  FINAL
                </span>
                <span className="text-xs text-gray-500">
                  {formatMatchDate(match.matchDate)}
                </span>
              </div>
              
              <div className="text-center mb-4">
                <div className="flex justify-center items-center space-x-4">
                  <div className="text-right flex-1">
                    <p className="font-semibold text-gray-900 truncate">{match.homeTeam?.name}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-gray-900">{match.homeScore || 0}</span>
                    <span className="text-gray-400">-</span>
                    <span className="text-2xl font-bold text-gray-900">{match.awayScore || 0}</span>
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-gray-900 truncate">{match.awayTeam?.name}</p>
                  </div>
                </div>
              </div>
              
              <Link
                href={`/matches/${match._id}`}
                className="block w-full bg-gray-100 hover:bg-gray-200 text-center py-2 rounded-lg text-sm font-medium text-gray-700 transition-colors"
              >
                Match Details
              </Link>
            </div>
          ))}
        </div>
        
        {recentMatches.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No recent matches to display</p>
          </div>
        )}
      </div>
    </div>
  );
}
