// FILE: pages/index.js (SIMPLIFIED HERO & NO AUTO-REFRESH)
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

  // FIXED: Removed auto-refresh interval
  useEffect(() => {
    fetchHomeData();
    // Removed auto-refresh to prevent constant reloading
  }, []);

  // Add debug logging
  useEffect(() => {
    console.log('Current stats state:', stats);
  }, [stats]);

  // Homepage data fetching
  const fetchHomeData = async () => {
    try {
      console.log('Fetching home page data...');
      setIsLoading(true);
      
      // Use basic stats
      await fetchBasicStats();

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

      // Fetch top players
      try {
        const playersResponse = await fetch('/api/public/players');
        if (playersResponse.ok) {
          const playersData = await playersResponse.json();
          if (Array.isArray(playersData)) {
            console.log('Players data received:', playersData.length);
            
            const scorers = playersData
              .filter(p => {
                const goals = p.careerStats?.goals || 0;
                return goals > 0;
              })
              .sort((a, b) => {
                const aGoals = a.careerStats?.goals || 0;
                const bGoals = b.careerStats?.goals || 0;
                return bGoals - aGoals;
              })
              .slice(0, 5)
              .map(player => ({
                ...player,
                normalizedGoals: player.careerStats?.goals || 0
              }));
            
            setTopScorers(scorers);
            console.log('Top scorers processed:', scorers.map(p => `${p.name}: ${p.normalizedGoals} goals`));
            
            const assisters = playersData
              .filter(p => {
                const assists = p.careerStats?.assists || 0;
                return assists > 0;
              })
              .sort((a, b) => {
                const aAssists = a.careerStats?.assists || 0;
                const bAssists = b.careerStats?.assists || 0;
                return bAssists - aAssists;
              })
              .slice(0, 5)
              .map(player => ({
                ...player,
                normalizedAssists: player.careerStats?.assists || 0
              }));
            
            setTopAssists(assisters);
            console.log('Top assisters processed:', assisters.map(p => `${p.name}: ${p.normalizedAssists} assists`));
          }
        }
      } catch (error) {
        console.error('Error fetching top players:', error);
      }

      console.log('Home data fetch completed');
    } catch (error) {
      console.error('Error in fetchHomeData:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBasicStats = async () => {
    try {
      console.log('Fetching basic stats...');
      
      const fetchWithFallback = async (url, defaultValue = []) => {
        try {
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            return Array.isArray(data) ? data : defaultValue;
          }
          return defaultValue;
        } catch (error) {
          console.error(`Error fetching ${url}:`, error);
          return defaultValue;
        }
      };

      const [teams, players, matches, transfers] = await Promise.all([
        fetchWithFallback('/api/public/teams'),
        fetchWithFallback('/api/public/players'),
        fetchWithFallback('/api/public/matches'),
        fetchWithFallback('/api/public/transfers')
      ]);
      
      const totalTeams = teams.length;
      const totalPlayers = players.length;
      const totalMatches = matches.length;
      
      const totalGoals = players.reduce((sum, p) => {
        const playerGoals = p.careerStats?.goals || 0;
        return sum + playerGoals;
      }, 0);
      
      const completedMatches = matches.filter(m => m.status === 'completed').length;
      const liveMatches = matches.filter(m => m.status === 'live').length;
      const scheduledMatches = matches.filter(m => m.status === 'scheduled').length;
      const totalTransfers = transfers.length;
      
      const avgGoalsPerMatch = completedMatches > 0 ? 
        Math.round((totalGoals / completedMatches) * 10) / 10 : 0;
      const matchCompletionRate = totalMatches > 0 ? 
        Math.round((completedMatches / totalMatches) * 100) : 0;
      
      const statsData = {
        totalTeams,
        totalPlayers,
        totalMatches,
        totalGoals,
        completedMatches,
        liveMatches,
        scheduledMatches,
        totalTransfers,
        avgGoalsPerMatch,
        matchCompletionRate
      };
      
      console.log('Basic stats calculated:', statsData);
      setStats(statsData);
      
    } catch (error) {
      console.error('Error fetching basic stats:', error);
      setStats({
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
    <div className="space-y-8">
      {/* SIMPLIFIED Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 rounded-2xl">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        
        <div className="relative px-6 py-12 sm:py-16">
          <div className="text-center max-w-4xl mx-auto">
            {/* Smaller Tournament Logo */}
            <div className="mb-8">
              <NextImage
                src="https://res.cloudinary.com/dq8lszs2o/image/upload/v1756292892/horse-futsal-league/banners/league-banner-1756292892007.png"
                alt="Horse Futsal Tournament"
                width={500}
                height={180}
                className="mx-auto max-w-full h-auto object-contain drop-shadow-xl"
                priority
              />
            </div>
            
            {/* Simplified Tagline */}
            <div className="mb-8">
              <h2 className="text-xl md:text-2xl text-white/90 mb-3 font-light">
                The Premier Futsal League Experience
              </h2>
              <p className="text-base md:text-lg text-blue-200 max-w-xl mx-auto">
                Fast-paced futsal action with real-time updates and comprehensive statistics.
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              {liveMatch && (
                <Link
                  href="/matches/live"
                  className="inline-flex items-center bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                >
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></div>
                  <Play className="w-4 h-4 mr-2" />
                  Watch Live
                </Link>
              )}
              
              <Link
                href="/standings"
                className="inline-flex items-center bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-semibold transition-colors border border-white/20"
              >
                <Trophy className="w-4 h-4 mr-2" />
                League Table
              </Link>
            </div>

            {/* Compact Stats */}
            <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.totalTeams}</div>
                <div className="text-blue-200 text-xs uppercase">Teams</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.totalPlayers}</div>
                <div className="text-blue-200 text-xs uppercase">Players</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.totalMatches}</div>
                <div className="text-blue-200 text-xs uppercase">Matches</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{stats.totalGoals}</div>
                <div className="text-blue-200 text-xs uppercase">Goals</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Match Alert */}
      {liveMatch && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="relative">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-ping absolute"></div>
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                </div>
                <span className="text-red-700 font-bold ml-2">LIVE</span>
              </div>
              <div className="font-bold text-gray-800">
                {liveMatch.homeTeam?.name || 'Team A'} 
                <span className="mx-3 text-xl text-red-600">
                  {liveMatch.homeScore || 0} - {liveMatch.awayScore || 0}
                </span>
                {liveMatch.awayTeam?.name || 'Team B'}
              </div>
            </div>
            <Link
              href={`/matches/${liveMatch._id}`}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>Watch</span>
            </Link>
          </div>
        </div>
      )}

      {/* Statistics Grid */}
      <div>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tournament Statistics</h2>
          <p className="text-gray-600">Live data from the current season</p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <Users className="w-6 h-6 text-blue-600" />
              <span className="text-xs font-medium text-blue-600 bg-blue-200 px-2 py-1 rounded-full">TEAMS</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalTeams}</div>
            <p className="text-sm text-gray-600">Registered</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <Users className="w-6 h-6 text-green-600" />
              <span className="text-xs font-medium text-green-600 bg-green-200 px-2 py-1 rounded-full">PLAYERS</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalPlayers}</div>
            <p className="text-sm text-gray-600">Active</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <Calendar className="w-6 h-6 text-purple-600" />
              <span className="text-xs font-medium text-purple-600 bg-purple-200 px-2 py-1 rounded-full">MATCHES</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalMatches}</div>
            <p className="text-sm text-gray-600">Total</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <Target className="w-6 h-6 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-600 bg-yellow-200 px-2 py-1 rounded-full">GOALS</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalGoals}</div>
            <p className="text-sm text-gray-600">Scored</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <Activity className="w-6 h-6 text-indigo-600" />
              <span className="text-xs font-medium text-indigo-600 bg-indigo-200 px-2 py-1 rounded-full">AVG</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.avgGoalsPerMatch}</div>
            <p className="text-sm text-gray-600">Per Match</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <BarChart3 className="w-6 h-6 text-red-600" />
              <span className="text-xs font-medium text-red-600 bg-red-200 px-2 py-1 rounded-full">RATE</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.matchCompletionRate}%</div>
            <p className="text-sm text-gray-600">Complete</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid - 4 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* League Standings */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                League Table
              </h3>
              <Link href="/standings" className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            <div className="space-y-2">
              {standings.slice(0, 6).map((team, index) => (
                <div key={team._id} className="flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
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
                        {team.enhancedStats?.wins || team.stats?.wins || 0}W {team.enhancedStats?.draws || team.stats?.draws || 0}D {team.enhancedStats?.losses || team.stats?.losses || 0}L
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{team.enhancedStats?.points || team.stats?.points || 0}</p>
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

        {/* Top Scorers */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <Target className="w-5 h-5 mr-2 text-red-500" />
                Top Scorers
              </h3>
              <Link href="/players" className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            <div className="space-y-2">
              {topScorers.slice(0, 5).map((player, index) => (
                <div key={player._id} className="flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
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
                    <p className="font-bold text-red-600">
                      {player.normalizedGoals}
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
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-500" />
                Upcoming
              </h3>
              <Link href="/matches" className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            <div className="space-y-3">
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
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                Transfers
              </h3>
              <Link href="/transfers" className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            <div className="space-y-3">
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
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Shield className="w-5 h-5 mr-3 text-green-600" />
            Recent Results
          </h2>
          <Link href="/matches" className="text-blue-600 hover:text-blue-800 flex items-center font-medium">
            View All Matches
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentMatches.slice(0, 6).map((match) => (
            <div key={match._id} className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  FINAL
                </span>
                <span className="text-xs text-gray-500">
                  {formatMatchDate(match.matchDate)}
                </span>
              </div>
              
              <div className="text-center mb-3">
                <div className="flex justify-center items-center space-x-4">
                  <div className="text-right flex-1">
                    <p className="font-semibold text-gray-900 text-sm truncate">{match.homeTeam?.name}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-bold text-gray-900">{match.homeScore || 0}</span>
                    <span className="text-gray-400">-</span>
                    <span className="text-xl font-bold text-gray-900">{match.awayScore || 0}</span>
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-gray-900 text-sm truncate">{match.awayTeam?.name}</p>
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
