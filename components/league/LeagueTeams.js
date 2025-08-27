// 4. LeagueTeams.js - Mobile Optimized
import React from 'react';
import { 
  Shield, 
  Plus, 
  Target, 
  Calendar, 
  Users, 
  Crown, 
  Medal, 
  Edit, 
  MapPin, 
  Eye 
} from 'lucide-react';

const LeagueTeams = ({ teams, matches, onTeamClick, onNavigate, isAdmin, stats, onEditTeam }) => {
  
  // ... existing calculation logic (unchanged)
  const getTeamStats = (teamId) => {
    const teamMatches = matches.filter(m => 
      (m.homeTeam?._id === teamId || m.awayTeam?._id === teamId) && 
      m.status === 'completed'
    );
    
    let wins = 0, draws = 0, losses = 0;
    let goalsFor = 0, goalsAgainst = 0;
    
    teamMatches.forEach(m => {
      const isHome = m.homeTeam?._id === teamId;
      const teamScore = isHome ? (m.homeScore || 0) : (m.awayScore || 0);
      const opponentScore = isHome ? (m.awayScore || 0) : (m.homeScore || 0);
      
      goalsFor += teamScore;
      goalsAgainst += opponentScore;
      
      if (teamScore > opponentScore) {
        wins++;
      } else if (teamScore === opponentScore) {
        draws++;
      } else {
        losses++;
      }
    });

    const points = wins * 3 + draws;
    const played = teamMatches.length;

    return {
      played,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst,
      points,
      winPercentage: played > 0 ? Math.round((wins / played) * 100) : 0
    };
  };

  // Sort teams by points (league table order)
  const sortedTeams = [...teams].map(team => ({
    ...team,
    stats: getTeamStats(team._id)
  })).sort((a, b) => {
    if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
    if (b.stats.goalDifference !== a.stats.goalDifference) return b.stats.goalDifference - a.stats.goalDifference;
    return b.stats.goalsFor - a.stats.goalsFor;
  });

  // Calculate average goals per match
  const completedMatches = matches.filter(m => m.status === 'completed');
  const totalGoals = completedMatches.reduce((sum, m) => sum + (m.homeScore || 0) + (m.awayScore || 0), 0);
  const avgGoals = completedMatches.length > 0 ? (totalGoals / completedMatches.length).toFixed(1) : '0.0';

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Shield className="h-5 w-5 sm:h-7 sm:w-7 text-blue-500" />
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">League Teams ({teams.length})</h3>
            <p className="text-gray-600 text-sm sm:text-base">Complete team profiles and statistics</p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => onNavigate('team-create', {})}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg sm:rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl text-sm sm:text-base"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Add Team</span>
          </button>
        )}
      </div>

      {/* Team Statistics Overview - Mobile Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <MobileStatCard
          title="Total Teams"
          value={teams.length}
          subtitle="In competition"
          icon={Shield}
          color="blue"
        />
        <MobileStatCard
          title="Avg Goals"
          value={avgGoals}
          subtitle="Per match"
          icon={Target}
          color="green"
        />
        <MobileStatCard
          title="Matches"
          value={completedMatches.length}
          subtitle="Completed"
          icon={Calendar}
          color="purple"
        />
        <MobileStatCard
          title="Players"
          value={stats.assignedPlayers || 0}
          subtitle="In teams"
          icon={Users}
          color="orange"
        />
      </div>

      {teams.length > 0 ? (
        <div className="space-y-4 sm:space-y-6">
          {/* Top Teams Highlight - Mobile Optimized */}
          {sortedTeams.length > 0 && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg sm:rounded-2xl p-4 sm:p-6 border border-yellow-100">
              <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 mr-2" />
                Current Leaders
              </h4>
              <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-4">
                {sortedTeams.slice(0, 3).map((team, index) => (
                  <MobileTopTeamCard
                    key={team._id}
                    team={team}
                    rank={index + 1}
                    onClick={() => onTeamClick(team)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Teams Grid - Mobile Responsive */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {sortedTeams.map((team, index) => (
              <MobileTeamCard
                key={team._id}
                team={team}
                rank={index + 1}
                isAdmin={isAdmin}
                onClick={() => onTeamClick(team)}
                onEdit={() => onEditTeam(team)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 sm:py-16">
          <Shield className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4 sm:mb-6" />
          <h4 className="text-lg sm:text-xl font-medium text-gray-900 mb-2 sm:mb-3">No Teams Registered</h4>
          <p className="text-gray-500 mb-4 sm:mb-6 text-sm sm:text-base">This league doesn't have any teams yet.</p>
          {isAdmin && (
            <button
              onClick={() => onNavigate('team-create', {})}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              Add First Team
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Mobile Team Card Component
const MobileTeamCard = ({ team, rank, isAdmin, onClick, onEdit }) => {
  const getRankColor = (position) => {
    if (position === 1) return 'bg-yellow-500 text-white';
    if (position === 2) return 'bg-gray-400 text-white';
    if (position === 3) return 'bg-orange-400 text-white';
    return 'bg-gray-200 text-gray-600';
  };

  const getRankIcon = (position) => {
    if (position === 1) return <Crown className="h-3 w-3 sm:h-4 sm:w-4" />;
    if (position === 2) return <Medal className="h-3 w-3 sm:h-4 sm:w-4" />;
    if (position === 3) return <Medal className="h-3 w-3 sm:h-4 sm:w-4" />;
    return null;
  };

  return (
    <div className="bg-white rounded-lg sm:rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all duration-200 overflow-hidden group relative">
      {/* Admin Edit Button */}
      {isAdmin && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(team);
          }}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 sm:p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg z-10"
          title="Edit Team"
        >
          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
        </button>
      )}

      <div className="cursor-pointer" onClick={() => onClick(team)}>
        {/* Team Header - Mobile Optimized */}
        <div 
          className="h-16 sm:h-24 relative flex items-center justify-center"
          style={{ 
            background: `linear-gradient(135deg, ${team.primaryColor || '#3b82f6'}, ${team.secondaryColor || '#1e40af'})` 
          }}
        >
          {/* Rank Badge */}
          <div className={`absolute top-2 left-2 sm:top-3 sm:left-3 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${getRankColor(rank)}`}>
            {getRankIcon(rank) || rank}
          </div>

          {/* Team Logo */}
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-white border-2 sm:border-4 border-white shadow-lg">
            {team.logo ? (
              <img 
                src={team.logo} 
                alt={`${team.name} logo`} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center text-white text-sm sm:text-lg font-bold"
                style={{ backgroundColor: team.primaryColor || '#3b82f6' }}
              >
                {team.shortName || team.name.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Team Info - Mobile Optimized */}
        <div className="p-4 sm:p-6">
          <div className="text-center mb-3 sm:mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
              {team.name}
            </h3>
            {team.homeVenue && (
              <div className="flex items-center justify-center mt-1 text-xs sm:text-sm text-gray-600">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="truncate">{team.homeVenue}</span>
              </div>
            )}
            {(team.city || team.country) && (
              <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">
                {[team.city, team.country].filter(Boolean).join(', ')}
              </p>
            )}
          </div>

          {/* Team Statistics - Mobile Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{team.stats.points}</div>
              <div className="text-xs text-gray-500">Points</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{team.stats.played}</div>
              <div className="text-xs text-gray-500">Played</div>
            </div>
          </div>

          {/* Match Record - Mobile Grid */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs sm:text-sm mb-3 sm:mb-4">
            <div className="bg-green-50 rounded-lg p-2">
              <div className="font-bold text-green-700">{team.stats.wins}</div>
              <div className="text-green-600 text-xs">Wins</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="font-bold text-gray-700">{team.stats.draws}</div>
              <div className="text-gray-600 text-xs">Draws</div>
            </div>
            <div className="bg-red-50 rounded-lg p-2">
              <div className="font-bold text-red-700">{team.stats.losses}</div>
              <div className="text-red-600 text-xs">Losses</div>
            </div>
          </div>

          {/* Goals - Mobile Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 text-center text-xs sm:text-sm">
            <div>
              <div className="text-base sm:text-lg font-bold text-gray-900">{team.stats.goalsFor}</div>
              <div className="text-xs text-gray-500">Goals For</div>
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-gray-900">{team.stats.goalsAgainst}</div>
              <div className="text-xs text-gray-500">Goals Against</div>
            </div>
          </div>

          {/* Goal Difference */}
          <div className="mt-3 sm:mt-4 text-center">
            <div className={`text-base sm:text-lg font-bold ${team.stats.goalDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {team.stats.goalDifference >= 0 ? '+' : ''}{team.stats.goalDifference}
            </div>
            <div className="text-xs text-gray-500">Goal Difference</div>
          </div>

          {/* Action Indicator */}
          <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-100 text-center">
            <span className="text-xs text-gray-400 group-hover:text-blue-600 transition-colors flex items-center justify-center">
              <Eye className="w-3 h-3 mr-1" />
              View team details
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mobile Top Team Card for Leaders Section
const MobileTopTeamCard = ({ team, rank, onClick }) => {
  const getRankColor = (position) => {
    if (position === 1) return 'bg-yellow-500 text-white';
    if (position === 2) return 'bg-gray-400 text-white';
    if (position === 3) return 'bg-orange-400 text-white';
    return 'bg-gray-200 text-gray-600';
  };

  return (
    <div 
      className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 border-yellow-200 hover:border-yellow-300 cursor-pointer transition-all duration-200 hover:shadow-md"
      onClick={() => onClick(team)}
    >
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Rank */}
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${getRankColor(rank)}`}>
          {rank === 1 && <Crown className="h-4 w-4 sm:h-5 sm:w-5" />}
          {rank === 2 && <Medal className="h-4 w-4 sm:h-5 sm:w-5" />}
          {rank === 3 && <Medal className="h-4 w-4 sm:h-5 sm:w-5" />}
        </div>

        {/* Team Logo */}
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-gray-200">
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

        {/* Team Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-gray-900 hover:text-yellow-600 transition-colors text-sm sm:text-base truncate">
            {team.name}
          </h4>
          <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-gray-600">
            <span className="font-medium text-yellow-600">{team.stats.points} pts</span>
            <span className="hidden sm:inline">{team.stats.wins}W-{team.stats.draws}D-{team.stats.losses}L</span>
            <span className={team.stats.goalDifference >= 0 ? 'text-green-600' : 'text-red-600'}>
              {team.stats.goalDifference >= 0 ? '+' : ''}{team.stats.goalDifference}
            </span>
          </div>
        </div>

        {/* Win Percentage */}
        <div className="text-right">
          <div className="text-lg sm:text-2xl font-bold text-gray-900">{team.stats.winPercentage}%</div>
          <div className="text-xs text-gray-500">Win Rate</div>
        </div>
      </div>
    </div>
  );
};

// Mobile Stat Card Component
const MobileStatCard = ({ title, value, subtitle, icon: Icon, color }) => (
  <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-3 sm:p-6 hover:shadow-md transition-all">
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
      <div className={`p-2 sm:p-3 bg-${color}-50 rounded-lg sm:rounded-xl`}>
        <Icon className={`h-4 w-4 sm:h-6 sm:w-6 text-${color}-600`} />
      </div>
    </div>
  </div>
);

export default LeagueTeams;