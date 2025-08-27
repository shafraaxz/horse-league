// LeagueStandings.js - Fixed with proper icon imports
import React from 'react';
import { 
  Award, 
  Trophy, 
  Users, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Crown, 
  ChevronRight,
  ExternalLink,
  Medal,
  Shield
} from 'lucide-react';

const LeagueStandings = ({ 
  league, 
  teams, 
  matches, 
  players, 
  onNavigate, 
  setActiveTab, 
  isAdmin 
}) => {
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

  // Calculate statistics
  const stats = {
    totalTeams: teams?.length || 0,
    completedMatches: matches?.filter(match => match.status === 'completed').length || 0,
    totalGoals: matches?.reduce((total, match) => {
      if (match.status === 'completed' && match.homeScore !== undefined && match.awayScore !== undefined) {
        return total + match.homeScore + match.awayScore;
      }
      return total;
    }, 0) || 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-100">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Award className="h-5 w-5 sm:h-7 sm:w-7 text-yellow-500" />
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">League Standings</h3>
              <p className="text-gray-600 text-sm sm:text-base">Complete season table with form and statistics</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <Trophy className="h-4 w-4 text-blue-500" />
              <span className="text-gray-600">{stats.totalTeams} Teams</span>
            </div>
            <div className="flex items-center space-x-1">
              <Target className="h-4 w-4 text-green-500" />
              <span className="text-gray-600">{stats.totalGoals} Goals</span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Position</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Team</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">P</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">W</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">D</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">L</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">GF</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">GA</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">GD</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Pts</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Form</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {standings.map((team, index) => {
                const position = index + 1;
                const isChampion = position === 1;
                const isEurope = position <= 4;
                const isRelegation = position > standings.length - 3;

                return (
                  <tr 
                    key={team._id}
                    className={`hover:bg-gray-50 transition-colors ${
                      isChampion ? 'bg-yellow-50' : 
                      isEurope ? 'bg-blue-50' : 
                      isRelegation ? 'bg-red-50' : 'bg-white'
                    }`}
                  >
                    {/* Position */}
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          isChampion ? 'bg-yellow-500 text-white' :
                          isEurope ? 'bg-blue-500 text-white' :
                          isRelegation ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {position}
                        </span>
                        {isChampion && <Crown className="h-5 w-5 text-yellow-500" />}
                      </div>
                    </td>

                    {/* Team */}
                    <td className="px-4 py-4">
                      <div 
                        className="flex items-center space-x-3 cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => onNavigate && onNavigate('team-profile', { teamId: team._id, leagueId: league?._id })}
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                          {team.logo ? (
                            <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
                          ) : (
                            <div 
                              className="w-full h-full flex items-center justify-center text-white text-sm font-bold"
                              style={{ backgroundColor: team.primaryColor || '#3b82f6' }}
                            >
                              {team.shortName || team.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{team.name}</p>
                          <p className="text-xs text-gray-500">{team.shortName}</p>
                        </div>
                      </div>
                    </td>

                    {/* Stats */}
                    <td className="px-4 py-4 text-center text-sm text-gray-900">{team.played}</td>
                    <td className="px-4 py-4 text-center text-sm text-green-600 font-medium">{team.wins}</td>
                    <td className="px-4 py-4 text-center text-sm text-gray-600">{team.draws}</td>
                    <td className="px-4 py-4 text-center text-sm text-red-600">{team.losses}</td>
                    <td className="px-4 py-4 text-center text-sm text-gray-900">{team.goalsFor}</td>
                    <td className="px-4 py-4 text-center text-sm text-gray-900">{team.goalsAgainst}</td>
                    <td className={`px-4 py-4 text-center text-sm font-medium ${
                      team.goalDifference > 0 ? 'text-green-600' :
                      team.goalDifference < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                    </td>
                    <td className="px-4 py-4 text-center text-lg font-bold text-gray-900">{team.points}</td>

                    {/* Form */}
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center space-x-1">
                        {team.form.slice(-5).map((result, idx) => (
                          <span
                            key={idx}
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                              result === 'W' ? 'bg-green-500' :
                              result === 'D' ? 'bg-gray-400' : 'bg-red-500'
                            }`}
                          >
                            {result}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => onNavigate('team-profile', { teamId: team._id, leagueId: league?._id })}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {standings.map((team, index) => {
          const position = index + 1;
          const isChampion = position === 1;
          const isEurope = position <= 4;
          const isRelegation = position > standings.length - 3;

          return (
            <div 
              key={team._id}
              className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-sm ${
                isChampion ? 'bg-yellow-50 border-yellow-200' : 
                isEurope ? 'bg-blue-50 border-blue-200' : 
                isRelegation ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'
              }`}
              onClick={() => onNavigate('team-profile', { teamId: team._id, leagueId: league?._id })}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      isChampion ? 'bg-yellow-500 text-white' :
                      isEurope ? 'bg-blue-500 text-white' :
                      isRelegation ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {position}
                    </span>
                    {isChampion && <Crown className="h-4 w-4 text-yellow-500" />}
                  </div>

                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                    {team.logo ? (
                      <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: team.primaryColor || '#3b82f6' }}
                      >
                        {team.shortName || team.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900">{team.name}</p>
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <span>{team.played}P</span>
                      <span className="text-green-600">{team.wins}W</span>
                      <span>{team.draws}D</span>
                      <span className="text-red-600">{team.losses}L</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{team.points}</div>
                  <div className="text-xs text-gray-500">Points</div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center space-x-4 text-xs">
                  <span className="text-gray-600">GF: {team.goalsFor}</span>
                  <span className="text-gray-600">GA: {team.goalsAgainst}</span>
                  <span className={`font-medium ${
                    team.goalDifference > 0 ? 'text-green-600' :
                    team.goalDifference < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    GD: {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                  </span>
                </div>

                <div className="flex items-center space-x-1">
                  {team.form.slice(-3).map((result, idx) => (
                    <span
                      key={idx}
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        result === 'W' ? 'bg-green-500' :
                        result === 'D' ? 'bg-gray-400' : 'bg-red-500'
                      }`}
                    >
                      {result}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4">Table Legend</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-yellow-500"></div>
            <span className="text-sm text-gray-600">Champion</span>
          </div>
          
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h5 className="text-sm font-semibold text-gray-700 mb-2">Form Guide:</h5>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="text-xs text-gray-600">Win</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 rounded-full bg-gray-400"></div>
              <span className="text-xs text-gray-600">Draw</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="text-xs text-gray-600">Loss</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeagueStandings;