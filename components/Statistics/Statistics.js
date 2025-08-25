import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Users, 
  Target, 
  Award, 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Activity,
  CheckCircle,
  RefreshCw,
  Calendar,
  Shield,
  Play
} from 'lucide-react';

// API Configuration
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3001/api'
  : '/api';

const Statistics = ({ showNotification, currentSeason, setCurrentView, isAdmin = false }) => {
  const [stats, setStats] = useState({
    leagueTable: [],
    topScorers: [],
    topAssists: [],
    matchStats: {
      totalMatches: 0,
      completed: 0,
      upcoming: 0,
      live: 0
    },
    teamStats: {
      totalTeams: 0,
      activeTeams: 0,
      averagePlayersPerTeam: 0
    },
    playerStats: {
      totalPlayers: 0,
      availablePlayers: 0,
      transferredPlayers: 0
    },
    goalStats: {
      totalGoals: 0,
      averageGoalsPerMatch: 0,
      highestScoringMatch: null,
      cleanSheets: 0
    }
  });

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (currentSeason?.id) {
      loadStatistics();
    }
  }, [currentSeason]);

  const apiCall = async (endpoint, params = {}) => {
    const url = new URL(`${API_BASE_URL}/${endpoint}`, window.location.origin);
    
    // Add season parameter and other params
    Object.entries({ ...params, season: currentSeason.id }).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, value);
      }
    });

    const token = localStorage.getItem('adminToken');
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
    };

    const response = await fetch(url.toString(), config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Handle MongoDB response format
    if (result.success !== undefined && result.data !== undefined) {
      return result.data;
    }
    
    return result;
  };

  const loadStatistics = async () => {
    try {
      setLoading(true);
      
      // Parallel API calls for better performance
      const [
        leagueTableData,
        topScorersData,
        topAssistsData,
        matchesData,
        teamsData,
        playersData,
        overviewData
      ] = await Promise.allSettled([
        apiCall('statistics/league-table'),
        apiCall('statistics/top-scorers', { limit: 15 }),
        apiCall('statistics/top-assists', { limit: 10 }),
        apiCall('matches', { limit: 100 }),
        apiCall('teams'),
        apiCall('players'),
        apiCall('statistics/overview')
      ]);

      // Process league table
      const leagueTable = leagueTableData.status === 'fulfilled' ? leagueTableData.value || [] : [];
      
      // Process top scorers
      const topScorers = topScorersData.status === 'fulfilled' ? topScorersData.value || [] : [];
      
      // Process top assists
      const topAssists = topAssistsData.status === 'fulfilled' ? topAssistsData.value || [] : [];
      
      // Process matches data
      const matches = matchesData.status === 'fulfilled' ? matchesData.value || [] : [];
      const completedMatches = matches.filter(m => m.status === 'completed');
      const upcomingMatches = matches.filter(m => m.status === 'scheduled' && new Date(m.date) >= new Date());
      const liveMatches = matches.filter(m => m.status === 'live');
      
      // Process teams data
      const teams = teamsData.status === 'fulfilled' ? teamsData.value || [] : [];
      const activeTeams = teams.filter(t => (t.playerCount || 0) > 0);
      const averagePlayersPerTeam = teams.length > 0 
        ? (teams.reduce((sum, team) => sum + (team.playerCount || 0), 0) / teams.length).toFixed(1)
        : 0;
      
      // Process players data
      const players = playersData.status === 'fulfilled' ? playersData.value || [] : [];
      const availablePlayers = players.filter(p => p.status === 'available');
      const transferredPlayers = players.filter(p => p.status === 'transferred');
      
      // Process overview data or calculate from other sources
      let overviewStats = {
        totalGoals: 0,
        averageGoalsPerMatch: 0,
        highestScoringMatch: null,
        cleanSheets: 0
      };
      
      if (overviewData.status === 'fulfilled' && overviewData.value) {
        overviewStats = overviewData.value;
      } else {
        // Calculate from matches data
        const totalGoals = completedMatches.reduce((sum, match) => 
          sum + (match.homeScore || 0) + (match.awayScore || 0), 0
        );

        const averageGoalsPerMatch = completedMatches.length > 0 
          ? (totalGoals / completedMatches.length).toFixed(2) 
          : 0;

        const highestScoringMatch = completedMatches.reduce((highest, match) => {
          const matchGoals = (match.homeScore || 0) + (match.awayScore || 0);
          return matchGoals > (highest?.totalGoals || 0) 
            ? { ...match, totalGoals: matchGoals } 
            : highest;
        }, null);

        const cleanSheets = completedMatches.filter(match => 
          match.homeScore === 0 || match.awayScore === 0
        ).length;

        overviewStats = {
          totalGoals,
          averageGoalsPerMatch,
          highestScoringMatch,
          cleanSheets
        };
      }

      setStats({
        leagueTable,
        topScorers,
        topAssists,
        matchStats: {
          totalMatches: matches.length,
          completed: completedMatches.length,
          upcoming: upcomingMatches.length,
          live: liveMatches.length
        },
        teamStats: {
          totalTeams: teams.length,
          activeTeams: activeTeams.length,
          averagePlayersPerTeam
        },
        playerStats: {
          totalPlayers: players.length,
          availablePlayers: availablePlayers.length,
          transferredPlayers: transferredPlayers.length
        },
        goalStats: overviewStats
      });

      setLastUpdated(new Date());
      
      // Check for errors and show warnings
      const errors = [
        leagueTableData,
        topScorersData,
        topAssistsData,
        matchesData,
        teamsData,
        playersData,
        overviewData
      ].filter(result => result.status === 'rejected');
      
      if (errors.length > 0) {
        console.warn('Some statistics failed to load:', errors);
        showNotification?.('warning', 'Some statistics data could not be loaded');
      }

    } catch (error) {
      console.error('Error loading statistics:', error);
      showNotification?.('error', 'Failed to load statistics: ' + error.message);
      
      // Fallback to empty stats
      setStats({
        leagueTable: [],
        topScorers: [],
        topAssists: [],
        matchStats: { totalMatches: 0, completed: 0, upcoming: 0, live: 0 },
        teamStats: { totalTeams: 0, activeTeams: 0, averagePlayersPerTeam: 0 },
        playerStats: { totalPlayers: 0, availablePlayers: 0, transferredPlayers: 0 },
        goalStats: { totalGoals: 0, averageGoalsPerMatch: 0, highestScoringMatch: null, cleanSheets: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshStatistics = () => {
    loadStatistics();
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'league', label: 'League Table', icon: Trophy },
    { key: 'players', label: 'Player Stats', icon: Users },
    { key: 'matches', label: 'Match Stats', icon: Activity }
  ];

  if (loading && !lastUpdated) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Statistics</h3>
          <p className="text-gray-600">Fetching latest league data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">League Statistics</h2>
            <p className="text-gray-600">
              Season {currentSeason?.name || 'Unknown'} • Comprehensive Analytics
              {lastUpdated && (
                <span className="text-sm text-gray-500 ml-2">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={refreshStatistics}
              disabled={loading}
              className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            
            {stats.matchStats.live > 0 && (
              <button
                onClick={() => setCurrentView('live')}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <Play size={16} />
                <span>Live Matches ({stats.matchStats.live})</span>
              </button>
            )}
            
            <button
              onClick={() => setCurrentView('schedules')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Calendar size={16} />
              <span>Fixtures</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 border-b border-gray-200">
          {tabs.map(tab => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 font-medium transition-colors flex items-center space-x-2 border-b-2 ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <IconComponent size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'overview' && <OverviewTab stats={stats} currentSeason={currentSeason} />}
      {activeTab === 'league' && <LeagueTableTab stats={stats} />}
      {activeTab === 'players' && <PlayersStatsTab stats={stats} />}
      {activeTab === 'matches' && <MatchStatsTab stats={stats} />}
    </div>
  );
};

const OverviewTab = ({ stats, currentSeason }) => {
  const overviewStats = [
    { label: 'Total Matches', value: stats.matchStats.totalMatches, icon: Activity, color: 'blue' },
    { label: 'Completed', value: stats.matchStats.completed, icon: CheckCircle, color: 'green' },
    { label: 'Active Teams', value: stats.teamStats.activeTeams, icon: Shield, color: 'yellow' },
    { label: 'Total Players', value: stats.playerStats.totalPlayers, icon: Users, color: 'purple' },
    { label: 'Total Goals', value: stats.goalStats.totalGoals, icon: Target, color: 'red' },
    { label: 'Avg Goals/Match', value: stats.goalStats.averageGoalsPerMatch, icon: BarChart3, color: 'orange' }
  ];

  return (
    <div className="space-y-6">
      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {overviewStats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Season Progress */}
      {stats.matchStats.totalMatches > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Season Progress</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Matches Completed</span>
              <span className="font-medium">
                {stats.matchStats.completed} of {stats.matchStats.totalMatches}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${stats.matchStats.totalMatches > 0 
                    ? (stats.matchStats.completed / stats.matchStats.totalMatches) * 100 
                    : 0}%`
                }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Season Start</span>
              <span>
                {Math.round((stats.matchStats.completed / stats.matchStats.totalMatches) * 100)}% Complete
              </span>
              <span>Season End</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Teams */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Teams</h3>
          {stats.leagueTable.length > 0 ? (
            <div className="space-y-3">
              {stats.leagueTable.slice(0, 5).map((team, index) => (
                <div key={team.id || team._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-600' : 'bg-blue-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex items-center space-x-2">
                      {team.logo && (
                        <img src={team.logo} alt={team.name} className="w-6 h-6 rounded-full" />
                      )}
                      <span className="font-medium">{team.name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-600">{team.points || 0}</div>
                    <div className="text-xs text-gray-500">pts</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Trophy size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">No league data available</p>
            </div>
          )}
        </div>

        {/* Top Scorers */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Scorers</h3>
          {stats.topScorers.length > 0 ? (
            <div className="space-y-3">
              {stats.topScorers.slice(0, 5).map((player, index) => (
                <div key={player.id || player._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex items-center space-x-2">
                      {player.avatar && (
                        <img src={player.avatar} alt={player.name} className="w-6 h-6 rounded-full" />
                      )}
                      <div>
                        <span className="font-medium block">{player.name}</span>
                        <span className="text-xs text-gray-500">{player.currentTeam || 'Free Agent'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">{player.goals || player.stats?.goals || 0}</div>
                    <div className="text-xs text-gray-500">goals</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">No scoring data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Season Highlights */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Season Highlights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-4 rounded-lg text-white">
            <div className="flex items-center justify-between mb-2">
              <Trophy size={24} />
              <span className="text-sm font-medium">League Leader</span>
            </div>
            <div className="font-bold text-lg">
              {stats.leagueTable[0]?.name || 'TBD'}
            </div>
            <div className="text-sm opacity-90">
              {stats.leagueTable[0]?.points || 0} points
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-400 to-green-500 p-4 rounded-lg text-white">
            <div className="flex items-center justify-between mb-2">
              <Target size={24} />
              <span className="text-sm font-medium">Top Scorer</span>
            </div>
            <div className="font-bold text-lg">
              {stats.topScorers[0]?.name || 'TBD'}
            </div>
            <div className="text-sm opacity-90">
              {stats.topScorers[0]?.goals || stats.topScorers[0]?.stats?.goals || 0} goals
            </div>
          </div>

          {stats.goalStats.highestScoringMatch && (
            <div className="bg-gradient-to-r from-red-400 to-red-500 p-4 rounded-lg text-white">
              <div className="flex items-center justify-between mb-2">
                <Activity size={24} />
                <span className="text-sm font-medium">Highest Scoring</span>
              </div>
              <div className="font-bold text-sm">
                {stats.goalStats.highestScoringMatch.homeTeam?.name || stats.goalStats.highestScoringMatch.homeTeam} vs{' '}
                {stats.goalStats.highestScoringMatch.awayTeam?.name || stats.goalStats.highestScoringMatch.awayTeam}
              </div>
              <div className="text-sm opacity-90">
                {stats.goalStats.highestScoringMatch.totalGoals} goals
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LeagueTableTab = ({ stats }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">League Table</h3>
        {stats.leagueTable.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Pos</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Team</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-700">P</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-700">W</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-700">D</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-700">L</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-700">GF</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-700">GA</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-700">GD</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-700">Pts</th>
                </tr>
              </thead>
              <tbody>
                {stats.leagueTable.map((team, index) => (
                  <tr key={team.id || team._id} className={`border-b border-gray-100 hover:bg-gray-50 ${
                    index === 0 ? 'bg-yellow-50' : 
                    index < 3 ? 'bg-green-50' : 
                    index >= stats.leagueTable.length - 2 ? 'bg-red-50' : ''
                  }`}>
                    <td className="py-3 px-4 font-bold text-gray-900">{index + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        {team.logo ? (
                          <img src={team.logo} alt={team.name} className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <Trophy size={16} className="text-gray-400" />
                          </div>
                        )}
                        <span className="font-medium">{team.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">{team.matchesPlayed || 0}</td>
                    <td className="py-3 px-2 text-center text-green-600 font-medium">{team.wins || 0}</td>
                    <td className="py-3 px-2 text-center text-yellow-600 font-medium">{team.draws || 0}</td>
                    <td className="py-3 px-2 text-center text-red-600 font-medium">{team.losses || 0}</td>
                    <td className="py-3 px-2 text-center">{team.goalsFor || 0}</td>
                    <td className="py-3 px-2 text-center">{team.goalsAgainst || 0}</td>
                    <td className={`py-3 px-2 text-center font-medium ${
                      (team.goalDifference || 0) > 0 ? 'text-green-600' :
                      (team.goalDifference || 0) < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {(team.goalDifference || 0) > 0 ? '+' : ''}{team.goalDifference || 0}
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-blue-600">{team.points || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No league table data available</p>
            <p className="text-sm text-gray-500 mt-2">League standings will appear after matches are played</p>
          </div>
        )}
      </div>
    </div>
  );
};

const PlayersStatsTab = ({ stats }) => {
  const [activePlayerTab, setActivePlayerTab] = useState('scorers');

  return (
    <div className="space-y-6">
      {/* Player Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <Users className="mx-auto mb-2 text-blue-600" size={32} />
          <div className="text-2xl font-bold text-gray-900">{stats.playerStats.totalPlayers}</div>
          <div className="text-sm text-gray-600">Total Players</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <Activity className="mx-auto mb-2 text-green-600" size={32} />
          <div className="text-2xl font-bold text-gray-900">{stats.playerStats.transferredPlayers}</div>
          <div className="text-sm text-gray-600">Active Players</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <TrendingUp className="mx-auto mb-2 text-orange-600" size={32} />
          <div className="text-2xl font-bold text-gray-900">{stats.playerStats.availablePlayers}</div>
          <div className="text-sm text-gray-600">Available Players</div>
        </div>
      </div>

      {/* Player Stats Tables */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex space-x-1">
            <button
              onClick={() => setActivePlayerTab('scorers')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activePlayerTab === 'scorers'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Top Scorers
            </button>
            <button
              onClick={() => setActivePlayerTab('assists')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activePlayerTab === 'assists'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Top Assists
            </button>
          </div>
        </div>

        <div className="p-6">
          {activePlayerTab === 'scorers' ? (
            <PlayerTable players={stats.topScorers} statKey="goals" statLabel="Goals" />
          ) : (
            <PlayerTable players={stats.topAssists} statKey="assists" statLabel="Assists" />
          )}
        </div>
      </div>
    </div>
  );
};

const MatchStatsTab = ({ stats }) => {
  return (
    <div className="space-y-6">
      {/* Match Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <Activity className="mx-auto mb-2 text-blue-600" size={32} />
          <div className="text-2xl font-bold text-gray-900">{stats.matchStats.totalMatches}</div>
          <div className="text-sm text-gray-600">Total Matches</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <CheckCircle className="mx-auto mb-2 text-green-600" size={32} />
          <div className="text-2xl font-bold text-gray-900">{stats.matchStats.completed}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <div className="w-8 h-8 bg-red-500 rounded-full mx-auto mb-2 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.matchStats.live}</div>
          <div className="text-sm text-gray-600">Live Now</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <PieChart className="mx-auto mb-2 text-purple-600" size={32} />
          <div className="text-2xl font-bold text-gray-900">{stats.matchStats.upcoming}</div>
          <div className="text-sm text-gray-600">Upcoming</div>
        </div>
      </div>

      {/* Goal Statistics */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Goal Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{stats.goalStats.totalGoals}</div>
            <div className="text-sm text-gray-600">Total Goals</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{stats.goalStats.averageGoalsPerMatch}</div>
            <div className="text-sm text-gray-600">Avg per Match</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.goalStats.cleanSheets}</div>
            <div className="text-sm text-gray-600">Clean Sheets</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {stats.goalStats.highestScoringMatch?.totalGoals || 0}
            </div>
            <div className="text-sm text-gray-600">Highest Scoring</div>
          </div>
        </div>

        {stats.goalStats.highestScoringMatch && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Highest Scoring Match</h4>
            <p className="text-green-700">
              {stats.goalStats.highestScoringMatch.homeTeam?.name || stats.goalStats.highestScoringMatch.homeTeam}{' '}
              {stats.goalStats.highestScoringMatch.homeScore || 0} -{' '}
              {stats.goalStats.highestScoringMatch.awayScore || 0}{' '}
              {stats.goalStats.highestScoringMatch.awayTeam?.name || stats.goalStats.highestScoringMatch.awayTeam}
            </p>
            <p className="text-sm text-green-600 mt-1">
              {stats.goalStats.highestScoringMatch.date ? 
                new Date(stats.goalStats.highestScoringMatch.date).toLocaleDateString() : 
                'Date not available'
              }
            </p>
          </div>
        )}
      </div>

      {/* Match Completion Progress */}
      {stats.matchStats.totalMatches > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Season Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Matches Played</span>
                <span className="font-medium">
                  {stats.matchStats.completed} / {stats.matchStats.totalMatches}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${(stats.matchStats.completed / stats.matchStats.totalMatches) * 100}%`
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round((stats.matchStats.completed / stats.matchStats.totalMatches) * 100)}% completed
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completed</span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                  {stats.matchStats.completed}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Live</span>
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                  {stats.matchStats.live}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Upcoming</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                  {stats.matchStats.upcoming}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 text-center border">
      <div className={`inline-flex p-2 rounded-full mb-2 ${colorClasses[color]}`}>
        <Icon size={20} />
      </div>
      <div className="text-2xl font-bold text-gray-900">{value || 0}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
};

const PlayerTable = ({ players, statKey, statLabel }) => {
  if (!players || players.length === 0) {
    return (
      <div className="text-center py-8">
        <Users size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600">No player data available</p>
        <p className="text-sm text-gray-500 mt-1">
          Player statistics will appear after matches are played
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left py-3 px-4 font-medium text-gray-700">Rank</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Player</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Team</th>
            <th className="text-center py-3 px-4 font-medium text-gray-700">{statLabel}</th>
            <th className="text-center py-3 px-4 font-medium text-gray-700">Matches</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, index) => {
            const statValue = player[statKey] || player.stats?.[statKey] || 0;
            const matches = player.matches || player.stats?.matches || 0;
            
            return (
              <tr key={player.id || player._id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-orange-600' : 'bg-blue-600'
                  }`}>
                    {index + 1}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-3">
                    {player.avatar && (
                      <img 
                        src={player.avatar} 
                        alt={player.name} 
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{player.name}</div>
                      <div className="text-sm text-gray-500 capitalize">{player.position}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="text-blue-600 font-medium">
                    {player.currentTeam || 'Free Agent'}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="text-lg font-bold text-green-600">{statValue}</span>
                </td>
                <td className="py-3 px-4 text-center text-gray-600">{matches}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Statistics;