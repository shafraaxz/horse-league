// 2. LeagueOverview.js - Mobile Optimized
import React from 'react';
import { 
  Trophy, 
  Building, 
  Users, 
  Calendar, 
  Target, 
  Play, 
  ArrowRightLeft, 
  DollarSign, 
  UserCheck, 
  Clock, 
  BarChart3, 
  ChevronRight, 
  ExternalLink, 
  Crown, 
  Medal 
} from 'lucide-react';

const LeagueOverview = ({ 
  league, teams, matches, players, transfers, 
  onNavigate, setActiveTab, isAdmin, handleManageMatches 
}) => {
  // Calculate league statistics
  const stats = {
    totalTeams: teams?.length || 0,
    totalPlayers: players?.length || 0,
    totalMatches: matches?.length || 0,
    completedMatches: matches?.filter(match => match.status === 'completed').length || 0,
    upcomingMatches: matches?.filter(match => match.status === 'scheduled').length || 0,
    liveMatches: matches?.filter(match => match.status === 'live').length || 0,
    totalGoals: matches?.reduce((total, match) => {
      if (match.status === 'completed' && match.homeScore !== undefined && match.awayScore !== undefined) {
        return total + match.homeScore + match.awayScore;
      }
      return total;
    }, 0) || 0,
    avgGoalsPerMatch: 0,
    freeAgents: players?.filter(player => !player.team).length || 0,
    assignedPlayers: players?.filter(player => player.team).length || 0,
    recentTransfers: transfers?.filter(transfer => {
      const transferDate = new Date(transfer.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return transferDate >= weekAgo;
    }).length || 0,
    matchesThisWeek: matches?.filter(match => {
      const matchDate = new Date(match.date);
      const now = new Date();
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return matchDate >= weekStart && matchDate <= weekEnd;
    }).length || 0,
    seasonProgress: 0
  };

  // Calculate average goals per match
  if (stats.completedMatches > 0) {
    stats.avgGoalsPerMatch = (stats.totalGoals / stats.completedMatches).toFixed(1);
  }

  // Calculate season progress (assuming a full season has each team playing each other twice)
  if (stats.totalTeams > 1) {
    const totalExpectedMatches = stats.totalTeams * (stats.totalTeams - 1);
    stats.seasonProgress = Math.round((stats.completedMatches / totalExpectedMatches) * 100);
  }

  // Calculate transfer market data
  const transferMarket = {
    totalValue: transfers?.reduce((sum, transfer) => sum + (transfer.fee || 0), 0) || 0,
    paidTransfers: transfers?.filter(transfer => transfer.fee > 0).length || 0
  };

  // Calculate league standings
  const standings = teams?.map(team => {
    const teamMatches = matches?.filter(match => 
      (match.homeTeam._id === team._id || match.awayTeam._id === team._id) && 
      match.status === 'completed'
    ) || [];

    let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;
    const form = [];

    teamMatches.forEach(match => {
      const isHome = match.homeTeam._id === team._id;
      const teamScore = isHome ? match.homeScore : match.awayScore;
      const opponentScore = isHome ? match.awayScore : match.homeScore;

      goalsFor += teamScore || 0;
      goalsAgainst += opponentScore || 0;

      if (teamScore > opponentScore) {
        wins++;
        form.push('W');
      } else if (teamScore === opponentScore) {
        draws++;
        form.push('D');
      } else {
        losses++;
        form.push('L');
      }
    });

    return {
      ...team,
      played: teamMatches.length,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst,
      points: wins * 3 + draws,
      form: form.slice(-5) // Last 5 matches
    };
  }).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  }) || [];

  // Calculate top performers
  const performers = {
    topScorers: players?.filter(player => player.statistics?.goals > 0)
      .sort((a, b) => (b.statistics?.goals || 0) - (a.statistics?.goals || 0)) || []
  };
  
  return (
    <div className="space-y-4 sm:space-y-8">
      {/* Enhanced Hero Section - Mobile Optimized */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg sm:rounded-2xl p-4 sm:p-8 border border-blue-100">
        <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-8">
          <div className="sm:col-span-2">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
              <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
              <h2 className="text-xl sm:text-3xl font-bold text-gray-900">League Statistics</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.totalTeams}</div>
                <div className="text-xs sm:text-sm text-gray-600">Teams</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600">{stats.totalPlayers}</div>
                <div className="text-xs sm:text-sm text-gray-600">Players</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600">{stats.completedMatches}</div>
                <div className="text-xs sm:text-sm text-gray-600">Matches</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-red-600">{stats.totalGoals}</div>
                <div className="text-xs sm:text-sm text-gray-600">Goals</div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl sm:text-6xl font-bold text-gray-900 mb-1 sm:mb-2">{stats.seasonProgress}%</div>
              <div className="text-sm sm:text-lg text-gray-600 font-medium">Season Complete</div>
              <div className="w-24 sm:w-32 h-2 bg-gray-200 rounded-full mx-auto mt-2 sm:mt-3">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                  style={{ width: `${stats.seasonProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Primary Statistics Grid - Mobile Responsive */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatCard
          title="Active Teams"
          value={stats.totalTeams}
          subtitle="Competing"
          icon={Building}
          color="blue"
          isClickable={true}
          onClick={() => setActiveTab('teams')}
        />
        <StatCard
          title="Players"
          value={stats.totalPlayers}
          subtitle={`${stats.freeAgents} free`}
          icon={Users}
          color="green"
          isClickable={true}
          onClick={() => setActiveTab('players')}
        />
        <StatCard
          title="Matches"
          value={stats.totalMatches}
          subtitle={`${stats.upcomingMatches} upcoming`}
          icon={Calendar}
          color="purple"
          isClickable={true}
          onClick={() => setActiveTab('matches')}
        />
        <StatCard
          title="Goals"
          value={stats.totalGoals}
          subtitle={`${stats.avgGoalsPerMatch} avg`}
          icon={Target}
          color="red"
        />
      </div>

      {/* Secondary Performance Metrics - Mobile Scrollable */}
      <div className="overflow-x-auto pb-2">
        <div className="flex space-x-3 sm:space-x-4 min-w-max sm:grid sm:grid-cols-6 sm:gap-4 sm:min-w-0">
          <StatCard 
            title="Live Now" 
            value={stats.liveMatches} 
            icon={Play} 
            color="red" 
            subtitle="Active"
          />
          <StatCard 
            title="This Week" 
            value={stats.recentTransfers} 
            subtitle="Transfers" 
            icon={ArrowRightLeft} 
            color="orange"
            isClickable={true}
            onClick={() => setActiveTab('transfers')}
          />
          <StatCard 
            title="Market Value" 
            value={`$${(transferMarket.totalValue || 0).toLocaleString()}`} 
            icon={DollarSign} 
            color="green" 
            subtitle={`${transferMarket.paidTransfers} deals`}
            isClickable={true}
            onClick={() => setActiveTab('transfers')}
          />
          <StatCard 
            title="Squad Players" 
            value={stats.assignedPlayers} 
            icon={UserCheck} 
            color="blue" 
            subtitle="In teams"
          />
          <StatCard 
            title="Weekly Activity" 
            value={stats.matchesThisWeek} 
            subtitle="Matches" 
            icon={Clock} 
            color="purple" 
          />
          <StatCard 
            title="Competition" 
            value={`${stats.avgGoalsPerMatch}`} 
            subtitle="Goals/match" 
            icon={BarChart3} 
            color="yellow" 
          />
        </div>
      </div>

      {/* Main Content Grid - Mobile Stack */}
      <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-8">
        
        {/* League Table - Mobile Optimized */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-lg sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 sm:p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Trophy className="h-5 w-5 sm:h-7 sm:w-7 text-yellow-600" />
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">League Standings</h3>
                    <p className="text-xs sm:text-sm text-gray-600">Current season table</p>
                  </div>
                </div>
                <button 
                  className="flex items-center space-x-1 sm:space-x-2 text-blue-600 hover:text-blue-700 font-medium transition-colors text-sm"
                  onClick={() => setActiveTab('standings')}
                >
                  <span className="hidden sm:inline">View Full Table</span>
                  <span className="sm:hidden">Full Table</span>
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>
            
            <div className="p-3 sm:p-6">
              <div className="space-y-2 sm:space-y-3">
                {standings.slice(0, 8).map((team, index) => (
                  <MobileTeamCard
                    key={team._id}
                    team={team}
                    rank={index + 1}
                    onClick={() => onNavigate('team-profile', { teamId: team._id, leagueId: league._id })}
                  />
                ))}
              </div>
              
              {standings.length > 8 && (
                <div className="mt-4 sm:mt-6 text-center">
                  <button 
                    onClick={() => setActiveTab('standings')}
                    className="px-4 sm:px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    View All {standings.length} Teams
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Performers Sidebar - Mobile Optimized */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-6">
          
          {/* Top Scorers */}
          <div className="bg-white rounded-lg sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">Top Scorers</h3>
              </div>
              <button 
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-700"
                onClick={() => setActiveTab('players')}
              >
                View All
              </button>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {performers.topScorers.slice(0, 5).map((player, index) => (
                <MobilePlayerCard
                  key={player._id}
                  player={player}
                  rank={index + 1}
                  statType="Goals"
                  statValue={player.statistics?.goals || 0}
                  onClick={(p) => onNavigate('player-profile', { playerId: p._id, leagueId: league._id })}
                />
              ))}
              {performers.topScorers.length === 0 && (
                <p className="text-center text-gray-500 py-6 text-sm">No goal scorers yet</p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Enhanced Quick Actions - Mobile Grid */}
      <div className="bg-white rounded-lg sm:rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 sm:mb-6">⚡ Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {isAdmin && (
            <QuickActionButton
              icon={Calendar}
              title="Schedule"
              subtitle="New match"
              onClick={handleManageMatches}
              color="blue"
            />
          )}
          
          <QuickActionButton
            icon={ArrowRightLeft}
            title="Transfers"
            subtitle="Manage players"
            onClick={() => onNavigate('league-players', { leagueId: league._id })}
            color="green"
          />
          
          <QuickActionButton
            icon={Trophy}
            title="Standings"
            subtitle="Full table"
            onClick={() => setActiveTab('standings')}
            color="purple"
          />

          <QuickActionButton
            icon={BarChart3}
            title="Stats"
            subtitle="Player data"
            onClick={() => setActiveTab('players')}
            color="yellow"
          />
        </div>
      </div>
    </div>
  );
};

// Mobile-Optimized Helper Components

// Mobile Stat Card
const StatCard = ({ title, value, subtitle, icon: Icon, color, onClick, isClickable = false }) => (
  <div 
    className={`bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-3 sm:p-6 transition-all duration-200 ${
      isClickable ? 'hover:shadow-lg hover:border-blue-200 cursor-pointer' : 'hover:shadow-md'
    } min-w-[140px] sm:min-w-0`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 text-${color}-600 flex-shrink-0`} />
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</p>
        </div>
        <p className="text-xl sm:text-3xl font-bold text-gray-900">{value}</p>
        {subtitle && (
          <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">{subtitle}</p>
        )}
      </div>
      {isClickable && (
        <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0 ml-2" />
      )}
    </div>
  </div>
);

// Mobile Team Card
const MobileTeamCard = ({ team, rank, onClick }) => (
  <div 
    className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all duration-200 cursor-pointer"
    onClick={() => onClick && onClick(team)}
  >
    <div className="flex items-center space-x-2 sm:space-x-3">
      <span className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm ${
        rank === 1 ? 'bg-yellow-500 text-white' : 
        rank === 2 ? 'bg-gray-400 text-white' : 
        rank === 3 ? 'bg-orange-400 text-white' : 'bg-gray-200 text-gray-600'
      }`}>
        {rank}
      </span>
      {rank === 1 && <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />}
    </div>
    
    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gray-100 border border-white shadow-sm flex-shrink-0">
      {team.logo ? (
        <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
      ) : (
        <div 
          className="w-full h-full flex items-center justify-center text-white text-xs sm:text-sm font-bold"
          style={{ backgroundColor: team.primaryColor || '#3b82f6' }}
        >
          {team.shortName || team.name.substring(0, 2).toUpperCase()}
        </div>
      )}
    </div>
    
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-gray-900 truncate text-sm sm:text-base">{team.name}</p>
      <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm">
        <span className="text-gray-600">{team.played}P</span>
        <span className="text-green-600 font-medium">{team.wins}W</span>
        <span className="text-gray-600">{team.draws}D</span>
        <span className="text-red-600">{team.losses}L</span>
      </div>
    </div>
    
    <div className="text-right">
      <p className="text-lg sm:text-2xl font-bold text-gray-900">{team.points}</p>
      <p className="text-xs text-gray-500">Points</p>
    </div>
    
    <div className="hidden sm:flex items-center space-x-1">
      {team.form.slice(-3).map((result, idx) => (
        <span
          key={idx}
          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
            result === 'W' ? 'bg-green-500' :
            result === 'D' ? 'bg-gray-400' : 'bg-red-500'
          }`}
        >
          {result}
        </span>
      ))}
    </div>
    
    <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
  </div>
);

// Mobile Player Card
const MobilePlayerCard = ({ player, rank, statType, statValue, onClick, showTeam = true }) => (
  <div 
    className={`flex items-center space-x-3 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl hover:bg-gray-100 transition-all duration-200 ${
      onClick ? 'cursor-pointer hover:shadow-sm' : ''
    }`}
    onClick={() => onClick && onClick(player)}
  >
    <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shadow-sm ${
      rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white' : 
      rank === 2 ? 'bg-gradient-to-r from-gray-400 to-gray-600 text-white' : 
      rank === 3 ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white' : 'bg-gray-200 text-gray-600'
    }`}>
      {rank}
    </div>
    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gray-200 border border-white shadow-sm flex-shrink-0">
      {player.photo ? (
        <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Users className="h-4 w-4 sm:h-6 sm:w-6 text-gray-400" />
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center space-x-1 sm:space-x-2">
        <p className="font-semibold text-gray-900 truncate text-sm sm:text-base">{player.name}</p>
        {rank <= 3 && (
          <div className="flex">
            {rank === 1 && <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />}
            {rank === 2 && <Medal className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />}
            {rank === 3 && <Medal className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />}
          </div>
        )}
      </div>
      <div className="flex items-center space-x-1 sm:space-x-2 text-xs">
        <p className="text-gray-600">{player.position}</p>
        {showTeam && player.team && (
          <>
            <span className="text-gray-400">•</span>
            <p className="text-blue-600 font-medium truncate">{player.team.name}</p>
          </>
        )}
      </div>
    </div>
    <div className="text-right">
      <p className="text-lg sm:text-xl font-bold text-gray-900">{statValue}</p>
      <p className="text-xs text-gray-500">{statType}</p>
    </div>
    {onClick && (
      <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
    )}
  </div>
);

// Mobile Quick Action Button
const QuickActionButton = ({ icon: Icon, title, subtitle, onClick, color }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center space-y-2 sm:space-y-3 p-3 sm:p-4 bg-gradient-to-r from-${color}-50 to-${color}-100 hover:from-${color}-100 hover:to-${color}-200 rounded-lg sm:rounded-xl transition-all duration-200 group min-h-[80px] sm:min-h-[100px]`}
  >
    <Icon className={`h-5 w-5 sm:h-6 sm:w-6 text-${color}-600 group-hover:scale-110 transition-transform`} />
    <div className="text-center">
      <div className={`font-medium text-${color}-900 text-xs sm:text-sm`}>{title}</div>
      <div className={`text-${color}-700 text-xs`}>{subtitle}</div>
    </div>
  </button>
);

export default LeagueOverview;