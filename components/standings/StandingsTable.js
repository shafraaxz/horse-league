// components/standings/StandingsTable.js
import React from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StandingsTable = ({ standings, teams }) => {
  // Sort standings by points, then goal difference, then goals for
  const sortedStandings = [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  const getFormIcon = (result) => {
    switch (result) {
      case 'W': return <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">W</span>;
      case 'D': return <span className="w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center text-xs font-bold">D</span>;
      case 'L': return <span className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">L</span>;
      default: return null;
    }
  };

  const getPositionIcon = (position) => {
    if (position === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (position <= 3) return <Trophy className="h-4 w-4 text-gray-400" />;
    return null;
  };

  if (sortedStandings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">No Standings Available</h3>
        <p className="text-gray-500">Play some matches to see the standings</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Team
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                P
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                W
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                D
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                L
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                GF
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                GA
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                GD
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pts
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Form
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedStandings.map((standing, index) => {
              const position = index + 1;
              const team = teams.find(t => t._id === standing.team);
              
              return (
                <tr key={standing._id} className={`hover:bg-gray-50 ${position <= 3 ? 'bg-green-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">{position}</span>
                      {getPositionIcon(position)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {team?.logo ? (
                        <img src={team.logo} alt={team.name} className="h-8 w-8 rounded-full mr-3" />
                      ) : (
                        <div className="h-8 w-8 bg-gray-200 rounded-full mr-3 flex items-center justify-center text-xs font-bold">
                          {team?.shortName || team?.name?.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-900">{team?.name || 'Unknown Team'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                    {standing.played}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                    {standing.won}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                    {standing.drawn}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                    {standing.lost}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                    {standing.goalsFor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                    {standing.goalsAgainst}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <span className={standing.goalDifference > 0 ? 'text-green-600' : standing.goalDifference < 0 ? 'text-red-600' : 'text-gray-900'}>
                      {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-lg font-bold text-gray-900">
                    {standing.points}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center space-x-1">
                      {standing.form?.slice(-5).map((result, idx) => (
                        <span key={idx}>{getFormIcon(result)}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-6 py-3 bg-gray-50 border-t">
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
          <span><strong>P:</strong> Played</span>
          <span><strong>W:</strong> Won</span>
          <span><strong>D:</strong> Drawn</span>
          <span><strong>L:</strong> Lost</span>
          <span><strong>GF:</strong> Goals For</span>
          <span><strong>GA:</strong> Goals Against</span>
          <span><strong>GD:</strong> Goal Difference</span>
          <span><strong>Pts:</strong> Points</span>
        </div>
      </div>
    </div>
  );
};

export default StandingsTable;
