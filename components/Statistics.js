// components/Statistics.js
import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Target, Award, AlertTriangle, TrendingUp, Users, Trophy, Clock, Calendar } from 'lucide-react';

const Statistics = ({ players = [], teams = [], matches = [] }) => {
  const [activeTab, setActiveTab] = useState('scorers');
  const [chartType, setChartType] = useState('bar'); // 'bar' or 'pie'

  // Calculate statistics
  const stats = useMemo(() => {
    // Top Scorers
    const topScorers = players
      .filter(p => (p.stats?.goals || 0) > 0)
      .sort((a, b) => (b.stats?.goals || 0) - (a.stats?.goals || 0))
      .slice(0, 10)
      .map(p => ({
        name: p.name,
        team: p.team?.name || 'Unknown',
        goals: p.stats?.goals || 0,
        appearances: p.stats?.appearances || 0,
        ratio: p.stats?.appearances > 0 ? (p.stats?.goals / p.stats?.appearances).toFixed(2) : 0
      }));

    // Most Cards
    const mostCards = players
      .filter(p => ((p.stats?.yellowCards || 0) + (p.stats?.redCards || 0)) > 0)
      .sort((a, b) => {
        const aTotal = (a.stats?.yellowCards || 0) + (a.stats?.redCards || 0) * 2;
        const bTotal = (b.stats?.yellowCards || 0) + (b.stats?.redCards || 0) * 2;
        return bTotal - aTotal;
      })
      .slice(0, 10)
      .map(p => ({
        name: p.name,
        team: p.team?.name || 'Unknown',
        yellowCards: p.stats?.yellowCards || 0,
        redCards: p.stats?.redCards || 0,
        total: (p.stats?.yellowCards || 0) + (p.stats?.redCards || 0) * 2
      }));

    // Most Assists
    const mostAssists = players
      .filter(p => (p.stats?.assists || 0) > 0)
      .sort((a, b) => (b.stats?.assists || 0) - (a.stats?.assists || 0))
      .slice(0, 10)
      .map(p => ({
        name: p.name,
        team: p.team?.name || 'Unknown',
        assists: p.stats?.assists || 0,
        appearances: p.stats?.appearances || 0
      }));

    // Most Appearances
    const mostAppearances = players
      .filter(p => (p.stats?.appearances || 0) > 0)
      .sort((a, b) => (b.stats?.appearances || 0) - (a.stats?.appearances || 0))
      .slice(0, 10)
      .map(p => ({
        name: p.name,
        team: p.team?.name || 'Unknown',
        appearances: p.stats?.appearances || 0,
        minutesPlayed: p.stats?.minutesPlayed || 0
      }));

    // Goals by Team
    const goalsByTeam = teams.map(team => {
      const teamPlayers = players.filter(p => p.team._id === team._id || p.team === team._id);
      const totalGoals = teamPlayers.reduce((sum, p) => sum + (p.stats?.goals || 0), 0);
      return {
        name: team.name,
        goals: totalGoals,
        players: teamPlayers.length
      };
    }).sort((a, b) => b.goals - a.goals);

    // Position Distribution
    const positionCounts = players.reduce((acc, p) => {
      const pos = p.position || 'Unknown';
      acc[pos] = (acc[pos] || 0) + 1;
      return acc;
    }, {});

    const positionData = Object.entries(positionCounts).map(([position, count]) => ({
      position,
      count,
      percentage: ((count / players.length) * 100).toFixed(1)
    }));

    // Match Statistics Over Time
    const finishedMatches = matches
      .filter(m => m.status === 'finished')
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const matchTrends = finishedMatches.reduce((acc, match, index) => {
      const totalGoals = (match.score?.home || 0) + (match.score?.away || 0);
      const cumulativeGoals = (acc[acc.length - 1]?.cumulativeGoals || 0) + totalGoals;
      
      acc.push({
        match: index + 1,
        goals: totalGoals,
        cumulativeGoals,
        averageGoals: (cumulativeGoals / (index + 1)).toFixed(1),
        date: match.date
      });
      
      return acc;
    }, []);

    // Overall league statistics
    const totalGoals = players.reduce((sum, p) => sum + (p.stats?.goals || 0), 0);
    const totalCards = players.reduce((sum, p) => sum + (p.stats?.yellowCards || 0) + (p.stats?.redCards || 0), 0);
    const finishedMatchesCount = matches.filter(m => m.status === 'finished').length;
    const averageGoalsPerMatch = finishedMatchesCount > 0 ? (totalGoals / finishedMatchesCount).toFixed(1) : 0;

    return {
      topScorers,
      mostCards,
      mostAssists,
      mostAppearances,
      goalsByTeam,
      positionData,
      matchTrends,
      overview: {
        totalGoals,
        totalCards,
        finishedMatches: finishedMatchesCount,
        averageGoalsPerMatch,
        totalPlayers: players.length,
        totalTeams: teams.length
      }
    };
  }, [players, teams, matches]);

  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

  if (players.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <TrendingUp className="w-24 h-24 mx-auto mb-6 text-slate-600" />
            <h2 className="text-2xl font-bold text-white mb-4">No Statistics Available</h2>
            <p className="text-slate-300 max-w-md mx-auto">
              Statistics will appear here once players are added and matches are played.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">League Statistics</h1>
          
          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <OverviewCard
              icon={<Target className="w-5 h-5" />}
              value={stats.overview.totalGoals}
              label="Total Goals"
              color="text-green-400"
            />
            <OverviewCard
              icon={<AlertTriangle className="w-5 h-5" />}
              value={stats.overview.totalCards}
              label="Total Cards"
              color="text-yellow-400"
            />
            <OverviewCard
              icon={<Calendar className="w-5 h-5" />}
              value={stats.overview.finishedMatches}
              label="Matches Played"
              color="text-blue-400"
            />
            <OverviewCard
              icon={<TrendingUp className="w-5 h-5" />}
              value={stats.overview.averageGoalsPerMatch}
              label="Goals/Match"
              color="text-purple-400"
            />
            <OverviewCard
              icon={<Users className="w-5 h-5" />}
              value={stats.overview.totalPlayers}
              label="Players"
              color="text-indigo-400"
            />
            <OverviewCard
              icon={<Trophy className="w-5 h-5" />}
              value={stats.overview.totalTeams}
              label="Teams"
              color="text-orange-400"
            />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { id: 'scorers', label: 'Top Scorers', icon: <Target className="w-4 h-4" /> },
              { id: 'assists', label: 'Most Assists', icon: <Award className="w-4 h-4" /> },
              { id: 'cards', label: 'Most Cards', icon: <AlertTriangle className="w-4 h-4" /> },
              { id: 'appearances', label: 'Most Apps', icon: <Clock className="w-4 h-4" /> },
              { id: 'teams', label: 'Team Stats', icon: <Users className="w-4 h-4" /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Chart Type Toggle for certain tabs */}
          {(activeTab === 'scorers' || activeTab === 'teams') && (
            <div className="flex bg-slate-700 rounded-lg p-1 w-fit">
              <button
                onClick={() => setChartType('bar')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  chartType === 'bar'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Bar Chart
              </button>
              <button
                onClick={() => setChartType('pie')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  chartType === 'pie'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Pie Chart
              </button>
            </div>
          )}
        </div>

        {/* Content Based on Active Tab */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Chart Section */}
          <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-white mb-6">
              {getTabTitle(activeTab)} Chart
            </h3>
            
            <div className="h-80">
              {renderChart(activeTab, chartType, stats, COLORS)}
            </div>
          </div>

          {/* List Section */}
          <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-white mb-6">
              {getTabTitle(activeTab)} Leaderboard
            </h3>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {renderLeaderboard(activeTab, stats)}
            </div>
          </div>
        </div>

        {/* Additional Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Position Distribution */}
          <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-white mb-6">Player Positions</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.positionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="count"
                    label={({ position, percentage }) => `${position}: ${percentage}%`}
                  >
                    {stats.positionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Match Trends */}
          <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-white mb-6">Goals Trend</h3>
            <div className="h-64">
              {stats.matchTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.matchTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="match" 
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF' }}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#374151', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: '#ffffff'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="averageGoals" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                      name="Avg Goals/Match"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <div className="text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No match data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Functions
const getTabTitle = (tab) => {
  switch (tab) {
    case 'scorers': return 'Top Scorers';
    case 'assists': return 'Most Assists';
    case 'cards': return 'Most Cards';
    case 'appearances': return 'Most Appearances';
    case 'teams': return 'Team Goals';
    default: return 'Statistics';
  }
};

const renderChart = (activeTab, chartType, stats, COLORS) => {
  const data = getChartData(activeTab, stats);
  
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <div className="text-center">
          <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No data available</p>
        </div>
      </div>
    );
  }

  if (chartType === 'pie' && (activeTab === 'scorers' || activeTab === 'teams')) {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data.slice(0, 6)} // Limit for better visibility
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={120}
            dataKey={getDataKey(activeTab)}
            label={({ name, value }) => `${name}: ${value}`}
          >
            {data.slice(0, 6).map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data.slice(0, 8)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="name" 
          stroke="#9CA3AF"
          tick={{ fill: '#9CA3AF', fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis 
          stroke="#9CA3AF"
          tick={{ fill: '#9CA3AF' }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#374151', 
            border: 'none', 
            borderRadius: '8px',
            color: '#ffffff'
          }}
        />
        <Bar 
          dataKey={getDataKey(activeTab)} 
          fill="#3B82F6"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

const getChartData = (activeTab, stats) => {
  switch (activeTab) {
    case 'scorers': return stats.topScorers;
    case 'assists': return stats.mostAssists;
    case 'cards': return stats.mostCards;
    case 'appearances': return stats.mostAppearances;
    case 'teams': return stats.goalsByTeam;
    default: return [];
  }
};

const getDataKey = (activeTab) => {
  switch (activeTab) {
    case 'scorers': return 'goals';
    case 'assists': return 'assists';
    case 'cards': return 'total';
    case 'appearances': return 'appearances';
    case 'teams': return 'goals';
    default: return 'value';
  }
};

const renderLeaderboard = (activeTab, stats) => {
  const data = getChartData(activeTab, stats);
  
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No data available</p>
      </div>
    );
  }

  return data.map((item, index) => (
    <LeaderboardItem
      key={index}
      position={index + 1}
      item={item}
      activeTab={activeTab}
    />
  ));
};

// Components
const OverviewCard = ({ icon, value, label, color }) => (
  <div className="bg-slate-700 rounded-lg p-4">
    <div className="flex items-center gap-3 mb-2">
      <div className={color}>{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
    <div className="text-slate-400 text-sm">{label}</div>
  </div>
);

const LeaderboardItem = ({ position, item, activeTab }) => {
  const getPositionColor = (pos) => {
    if (pos === 1) return 'bg-yellow-500';
    if (pos === 2) return 'bg-gray-400';
    if (pos === 3) return 'bg-amber-600';
    return 'bg-slate-600';
  };

  const renderValue = () => {
    switch (activeTab) {
      case 'scorers':
        return `${item.goals} goals`;
      case 'assists':
        return `${item.assists} assists`;
      case 'cards':
        return (
          <div className="flex items-center gap-1">
            {item.yellowCards > 0 && (
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>
                {item.yellowCards}
              </span>
            )}
            {item.redCards > 0 && (
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                {item.redCards}
              </span>
            )}
          </div>
        );
      case 'appearances':
        return `${item.appearances} apps`;
      case 'teams':
        return `${item.goals} goals`;
      default:
        return '';
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 ${getPositionColor(position)} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
          {position}
        </div>
        <div>
          <div className="text-white font-medium">{item.name}</div>
          <div className="text-slate-400 text-sm">{item.team}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-white font-bold">{renderValue()}</div>
        {activeTab === 'scorers' && item.appearances > 0 && (
          <div className="text-slate-400 text-sm">{item.ratio} goals/game</div>
        )}
        {activeTab === 'appearances' && item.minutesPlayed > 0 && (
          <div className="text-slate-400 text-sm">{item.minutesPlayed} min</div>
        )}
        {activeTab === 'teams' && (
          <div className="text-slate-400 text-sm">{item.players} players</div>
        )}
      </div>
    </div>
  );
};

export default Statistics;