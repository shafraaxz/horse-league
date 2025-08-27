// components/pages/HomePage.js - Fixed Version
import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Users, 
  Calendar, 
  Target, 
  Clock, 
  ArrowRight,
  Play,
  Pause,
  BarChart3,
  TrendingUp,
  Activity,
  RefreshCw
} from 'lucide-react';

const HomePage = ({ onNavigate, user }) => {
  const [leagues, setLeagues] = useState([]);
  const [liveMatches, setLiveMatches] = useState([]);
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchLiveUpdates, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      };

      console.log('Fetching leagues...'); // Debug log

      // Fetch leagues with their statistics
      try {
        const leaguesRes = await fetch('/api/leagues', { headers });
        console.log('Leagues response status:', leaguesRes.status); // Debug log
        
        if (leaguesRes.ok) {
          const leaguesData = await leaguesRes.json();
          console.log('Leagues data received:', leaguesData); // Debug log
          
          // Handle different response formats
          let leaguesList = [];
          if (Array.isArray(leaguesData)) {
            leaguesList = leaguesData;
          } else if (leaguesData.data && Array.isArray(leaguesData.data)) {
            leaguesList = leaguesData.data;
          } else if (leaguesData.leagues && Array.isArray(leaguesData.leagues)) {
            leaguesList = leaguesData.leagues;
          }
          
          setLeagues(leaguesList);
          console.log('Leagues set:', leaguesList); // Debug log
        } else {
          const errorText = await leaguesRes.text();
          console.error('Failed to fetch leagues:', leaguesRes.status, errorText);
          setError(`Failed to fetch leagues: ${leaguesRes.status}`);
        }
      } catch (leagueError) {
        console.error('Error fetching leagues:', leagueError);
        setError('Error fetching leagues');
      }

      // Fetch live matches
      await fetchLiveUpdates();

      // Fetch recent activity/updates
      try {
        const updatesRes = await fetch('/api/activity/recent', { headers });
        if (updatesRes.ok) {
          const updatesData = await updatesRes.json();
          const updatesList = Array.isArray(updatesData) ? updatesData : 
                            (updatesData.data && Array.isArray(updatesData.data)) ? updatesData.data : [];
          setRecentUpdates(updatesList);
        }
      } catch (updatesError) {
        console.error('Error fetching updates:', updatesError);
        // Don't set error for updates, it's not critical
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveUpdates = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      };

      const matchesRes = await fetch('/api/matches?status=live', { headers });
      if (matchesRes.ok) {
        const matchesData = await matchesRes.json();
        const matchesList = Array.isArray(matchesData) ? matchesData :
                          (matchesData.data && Array.isArray(matchesData.data)) ? matchesData.data : [];
        setLiveMatches(matchesList);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching live updates:', error);
      // Don't throw error for live updates, they're not critical
    }
  };

  const getLeagueStats = (league) => {
    if (!league) return { teams: 0, matches: 0, players: 0, liveMatches: 0 };
    
    return {
      teams: league.teamsCount || league.teams?.length || league.teamCount || 0,
      matches: league.matchesCount || league.matches?.length || league.matchCount || 0,
      players: league.playersCount || league.players?.length || league.playerCount || 0,
      liveMatches: liveMatches.filter(m => 
        m.league?._id === league._id || 
        m.leagueId === league._id ||
        m.league === league._id
      ).length
    };
  };

  const getUpdateIcon = (type) => {
    switch (type) {
      case 'goal': return <Target className="h-4 w-4 text-green-600" />;
      case 'match_start': return <Play className="h-4 w-4 text-blue-600" />;
      case 'match_end': return <Pause className="h-4 w-4 text-gray-600" />;
      case 'result': return <BarChart3 className="h-4 w-4 text-purple-600" />;
      case 'transfer': return <Users className="h-4 w-4 text-orange-600" />;
      case 'registration': return <Users className="h-4 w-4 text-blue-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      return date.toLocaleDateString();
    } catch (error) {
      return 'Unknown time';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">League Dashboard</h1>
            <p className="text-gray-600">Live updates and league statistics</p>
            {error && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
                <button 
                  onClick={fetchDashboardData}
                  className="mt-2 text-red-600 text-sm hover:text-red-800 underline"
                >
                  Try again
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            <button
              onClick={fetchLiveUpdates}
              className="p-1 hover:bg-gray-200 rounded"
              title="Refresh live data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Leagues */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Trophy className="h-6 w-6 mr-2 text-blue-600" />
                  Active Leagues ({leagues.length})
                </h2>
              </div>

              <div className="divide-y divide-gray-200">
                {leagues.length > 0 ? leagues.map((league) => {
                  if (!league || !league._id) return null; // Skip invalid leagues
                  
                  const stats = getLeagueStats(league);
                  return (
                    <div
                      key={league._id}
                      onClick={() => onNavigate && onNavigate('league-details', league._id)}
                      className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                              {league.name || 'Unnamed League'}
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              league.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : league.status === 'upcoming'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {league.status || 'unknown'}
                            </span>
                            {stats.liveMatches > 0 && (
                              <span className="inline-flex items-center px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                                <div className="w-2 h-2 bg-red-600 rounded-full mr-1 animate-pulse"></div>
                                {stats.liveMatches} Live
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center text-gray-600">
                              <Users className="h-4 w-4 mr-1" />
                              <span>{stats.teams} Teams</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>{stats.matches} Matches</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <Target className="h-4 w-4 mr-1" />
                              <span>{stats.players} Players</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <TrendingUp className="h-4 w-4 mr-1" />
                              <span className="capitalize">{league.type || 'League'}</span>
                            </div>
                          </div>
                        </div>
                        
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  );
                }).filter(Boolean) : ( // Filter out null values
                  <div className="p-12 text-center">
                    <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Leagues Available</h3>
                    <p className="text-gray-600">No leagues have been created yet.</p>
                    {error && (
                      <button 
                        onClick={fetchDashboardData}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Retry Loading
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Live Updates */}
          <div className="space-y-6">
            {/* Live Matches */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <div className="w-2 h-2 bg-red-600 rounded-full mr-2 animate-pulse"></div>
                  Live Matches ({liveMatches.length})
                </h3>
              </div>
              
              <div className="p-4">
                {liveMatches.length > 0 ? (
                  <div className="space-y-3">
                    {liveMatches.slice(0, 5).map((match) => (
                      <div 
                        key={match._id} 
                        className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => onNavigate && onNavigate('match-details', match._id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {match.homeTeam?.name || 'Team A'} vs {match.awayTeam?.name || 'Team B'}
                          </span>
                          <span className="text-xs text-red-600 font-medium">
                            {match.minute || match.currentMinute || 0}'
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-gray-900">
                            {match.homeScore || 0} - {match.awayScore || 0}
                          </span>
                          <span className="text-xs text-gray-500">
                            {match.league?.name || match.leagueName}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Pause className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No live matches</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Updates */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-blue-600" />
                  Recent Activity
                </h3>
              </div>
              
              <div className="p-4">
                {recentUpdates.length > 0 ? (
                  <div className="space-y-3">
                    {recentUpdates.slice(0, 10).map((update, index) => (
                      <div key={update._id || update.id || index} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getUpdateIcon(update.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">{update.message || update.description}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <p className="text-xs text-gray-500">
                              {formatTime(update.createdAt || update.timestamp)}
                            </p>
                            {update.league && (
                              <>
                                <span className="text-xs text-gray-400">•</span>
                                <p className="text-xs text-blue-600">
                                  {typeof update.league === 'string' ? update.league : update.league.name}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Activity className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No recent activity</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                  System Stats
                </h3>
              </div>
              
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Leagues</span>
                  <span className="text-lg font-semibold text-gray-900">{leagues.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Live Matches</span>
                  <span className="text-lg font-semibold text-gray-900">{liveMatches.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Teams</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {leagues.reduce((sum, league) => sum + (league.teamsCount || league.teams?.length || 0), 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Players</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {leagues.reduce((sum, league) => sum + (league.playersCount || league.players?.length || 0), 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;