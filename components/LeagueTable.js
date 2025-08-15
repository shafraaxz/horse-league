// components/LeagueTable.js
import { useState, useMemo } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, ArrowUpDown, Medal, Crown } from 'lucide-react';

const LeagueTable = ({ teams = [], matches = [] }) => {
  const [sortBy, setSortBy] = useState('position');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('full'); // 'full' or 'compact'

  // Calculate standings
  const standings = useMemo(() => {
    const teamStats = {};
    
    // Initialize team stats
    teams.forEach(team => {
      teamStats[team._id] = {
        team: team,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        form: [], // Last 5 matches
        streak: { type: null, count: 0 } // Current streak
      };
    });

    // Process finished matches
    const finishedMatches = matches.filter(m => m.status === 'finished');
    
    finishedMatches.forEach(match => {
      const homeStats = teamStats[match.homeTeam._id];
      const awayStats = teamStats[match.awayTeam._id];

      if (homeStats && awayStats) {
        const homeScore = match.score?.home || 0;
        const awayScore = match.score?.away || 0;

        // Update basic stats
        homeStats.played++;
        awayStats.played++;
        homeStats.goalsFor += homeScore;
        homeStats.goalsAgainst += awayScore;
        awayStats.goalsFor += awayScore;
        awayStats.goalsAgainst += homeScore;

        // Determine result
        let homeResult, awayResult;
        if (homeScore > awayScore) {
          homeStats.won++;
          homeStats.points += 3;
          awayStats.lost++;
          homeResult = 'W';
          awayResult = 'L';
        } else if (homeScore < awayScore) {
          awayStats.won++;
          awayStats.points += 3;
          homeStats.lost++;
          homeResult = 'L';
          awayResult = 'W';
        } else {
          homeStats.drawn++;
          awayStats.drawn++;
          homeStats.points++;
          awayStats.points++;
          homeResult = 'D';
          awayResult = 'D';
        }

        // Update form (last 5 matches)
        homeStats.form.push({ result: homeResult, opponent: awayStats.team.name });
        awayStats.form.push({ result: awayResult, opponent: homeStats.team.name });
        if (homeStats.form.length > 5) homeStats.form.shift();
        if (awayStats.form.length > 5) awayStats.form.shift();
      }
    });

    // Calculate goal difference and current streak
    Object.values(teamStats).forEach(stats => {
      stats.goalDifference = stats.goalsFor - stats.goalsAgainst;
      
      // Calculate current streak
      if (stats.form.length > 0) {
        const lastResult = stats.form[stats.form.length - 1]?.result;
        let count = 0;
        for (let i = stats.form.length - 1; i >= 0; i--) {
          if (stats.form[i].result === lastResult) {
            count++;
          } else {
            break;
          }
        }
        stats.streak = { type: lastResult, count };
      }
    });

    // Sort teams by position
    const sortedStats = Object.values(teamStats).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.team.name.localeCompare(b.team.name);
    });

    return sortedStats;
  }, [teams, matches]);

  // Sort function for custom sorting
  const sortedStandings = useMemo(() => {
    if (sortBy === 'position') return standings;
    
    const sorted = [...standings].sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'team':
          aVal = a.team.name;
          bVal = b.team.name;
          break;
        case 'points':
          aVal = a.points;
          bVal = b.points;
          break;
        case 'goalDifference':
          aVal = a.goalDifference;
          bVal = b.goalDifference;
          break;
        case 'goalsFor':
          aVal = a.goalsFor;
          bVal = b.goalsFor;
          break;
        case 'goalsAgainst':
          aVal = a.goalsAgainst;
          bVal = b.goalsAgainst;
          break;
        default:
          return 0;
      }
      
      if (typeof aVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
    
    return sorted;
  }, [standings, sortBy, sortOrder]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder(column === 'team' ? 'asc' : 'desc');
    }
  };

  if (teams.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <Trophy className="w-24 h-24 mx-auto mb-6 text-slate-600" />
            <h2 className="text-2xl font-bold text-white mb-4">No Teams Available</h2>
            <p className="text-slate-300 max-w-md mx-auto">
              The league table will appear here once teams are added to this league.
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">League Table</h1>
              <p className="text-slate-300">
                {teams.length} teams • {matches.filter(m => m.status === 'finished').length} matches played
              </p>
            </div>
            
            {/* View Toggle */}
            <div className="flex bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('full')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'full' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Full Table
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'compact' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Mobile View
              </button>
            </div>
          </div>
        </div>

        {/* League Table */}
        <div className="bg-slate-800 rounded-xl shadow-lg overflow-hidden">
          
          {viewMode === 'full' ? (
            // Desktop/Full Table View
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-white font-semibold">Pos</th>
                    <SortableHeader
                      label="Team"
                      sortKey="team"
                      currentSort={sortBy}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="P"
                      sortKey="played"
                      currentSort={sortBy}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                      tooltip="Played"
                    />
                    <th className="px-4 py-3 text-center text-white font-semibold">W</th>
                    <th className="px-4 py-3 text-center text-white font-semibold">D</th>
                    <th className="px-4 py-3 text-center text-white font-semibold">L</th>
                    <SortableHeader
                      label="GF"
                      sortKey="goalsFor"
                      currentSort={sortBy}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                      tooltip="Goals For"
                    />
                    <SortableHeader
                      label="GA"
                      sortKey="goalsAgainst"
                      currentSort={sortBy}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                      tooltip="Goals Against"
                    />
                    <SortableHeader
                      label="GD"
                      sortKey="goalDifference"
                      currentSort={sortBy}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                      tooltip="Goal Difference"
                    />
                    <SortableHeader
                      label="Pts"
                      sortKey="points"
                      currentSort={sortBy}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                      tooltip="Points"
                    />
                    <th className="px-4 py-3 text-center text-white font-semibold">Form</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStandings.map((team, index) => {
                    const originalPosition = standings.indexOf(team) + 1;
                    return (
                      <tr key={team.team._id} className="border-b border-slate-700 hover:bg-slate-700 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold">
                              {sortBy === 'position' ? index + 1 : originalPosition}
                            </span>
                            {index === 0 && sortBy === 'position' && (
                              <Crown className="w-4 h-4 text-yellow-500" />
                            )}
                            {index < 3 && sortBy === 'position' && index !== 0 && (
                              <Medal className={`w-4 h-4 ${index === 1 ? 'text-gray-400' : 'text-amber-600'}`} />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-600 rounded-lg p-1 flex items-center justify-center">
                              {team.team.logo ? (
                                <img 
                                  src={team.team.logo} 
                                  alt={team.team.name}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <span className="text-white font-bold text-xs">
                                  {team.team.name.slice(0, 2)}
                                </span>
                              )}
                            </div>
                            <span className="text-white font-medium">{team.team.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center text-white">{team.played}</td>
                        <td className="px-4 py-4 text-center text-green-400">{team.won}</td>
                        <td className="px-4 py-4 text-center text-yellow-400">{team.drawn}</td>
                        <td className="px-4 py-4 text-center text-red-400">{team.lost}</td>
                        <td className="px-4 py-4 text-center text-white">{team.goalsFor}</td>
                        <td className="px-4 py-4 text-center text-white">{team.goalsAgainst}</td>
                        <td className={`px-4 py-4 text-center font-medium ${
                          team.goalDifference > 0 ? 'text-green-400' : 
                          team.goalDifference < 0 ? 'text-red-400' : 'text-white'
                        }`}>
                          {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                        </td>
                        <td className="px-4 py-4 text-center text-white font-bold text-lg">
                          {team.points}
                        </td>
                        <td className="px-4 py-4">
                          <FormDisplay form={team.form} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            // Mobile/Compact View
            <div className="p-4 space-y-4">
              {sortedStandings.map((team, index) => {
                const originalPosition = standings.indexOf(team) + 1;
                return (
                  <div key={team.team._id} className="bg-slate-700 rounded-lg p-4">
                    
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-white">
                            {sortBy === 'position' ? index + 1 : originalPosition}
                          </span>
                          {index === 0 && sortBy === 'position' && (
                            <Crown className="w-5 h-5 text-yellow-500" />
                          )}
                        </div>
                        
                        <div className="w-10 h-10 bg-slate-600 rounded-lg p-1 flex items-center justify-center">
                          {team.team.logo ? (
                            <img 
                              src={team.team.logo} 
                              alt={team.team.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <span className="text-white font-bold text-sm">
                              {team.team.name.slice(0, 2)}
                            </span>
                          )}
                        </div>
                        
                        <div>
                          <div className="text-white font-bold">{team.team.name}</div>
                          <div className="text-slate-400 text-sm">{team.played} matches</div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xl font-bold text-white">{team.points}</div>
                        <div className="text-slate-400 text-sm">pts</div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="text-center">
                        <div className="text-green-400 font-bold">{team.won}</div>
                        <div className="text-slate-400 text-xs">Won</div>
                      </div>
                      <div className="text-center">
                        <div className="text-yellow-400 font-bold">{team.drawn}</div>
                        <div className="text-slate-400 text-xs">Drawn</div>
                      </div>
                      <div className="text-center">
                        <div className="text-red-400 font-bold">{team.lost}</div>
                        <div className="text-slate-400 text-xs">Lost</div>
                      </div>
                    </div>

                    {/* Goals and Form */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-slate-300">
                          {team.goalsFor}:{team.goalsAgainst}
                        </span>
                        <span className={`font-medium ${
                          team.goalDifference > 0 ? 'text-green-400' : 
                          team.goalDifference < 0 ? 'text-red-400' : 'text-white'
                        }`}>
                          {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                        </span>
                      </div>
                      <FormDisplay form={team.form} />
                    </div>

                    {/* Current Streak */}
                    {team.streak.count > 1 && (
                      <div className="mt-2 text-center">
                        <StreakDisplay streak={team.streak} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-white font-bold mb-4">Table Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-500" />
              <span className="text-slate-300">Champion</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-slate-300">Win</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-slate-300">Draw</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-slate-300">Loss</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sortable Header Component
const SortableHeader = ({ label, sortKey, currentSort, sortOrder, onSort, tooltip }) => {
  const isActive = currentSort === sortKey;
  
  return (
    <th 
      className="px-4 py-3 text-center text-white font-semibold cursor-pointer hover:bg-slate-600 transition-colors"
      onClick={() => onSort(sortKey)}
      title={tooltip}
    >
      <div className="flex items-center justify-center gap-1">
        <span>{label}</span>
        <ArrowUpDown className={`w-3 h-3 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
        {isActive && (
          <span className="text-blue-400 text-xs">
            {sortOrder === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );
};

// Form Display Component
const FormDisplay = ({ form }) => {
  if (!form || form.length === 0) return null;
  
  return (
    <div className="flex gap-1">
      {form.slice(-5).map((match, index) => (
        <div
          key={index}
          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${
            match.result === 'W' ? 'bg-green-500' : 
            match.result === 'D' ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          title={`${match.result} vs ${match.opponent}`}
        >
          {match.result}
        </div>
      ))}
    </div>
  );
};

// Streak Display Component
const StreakDisplay = ({ streak }) => {
  const getStreakColor = (type) => {
    switch (type) {
      case 'W': return 'text-green-400';
      case 'D': return 'text-yellow-400';
      case 'L': return 'text-red-400';
      default: return 'text-white';
    }
  };

  const getStreakText = (type) => {
    switch (type) {
      case 'W': return 'winning streak';
      case 'D': return 'drawing streak';
      case 'L': return 'losing streak';
      default: return 'streak';
    }
  };

  return (
    <div className={`text-xs ${getStreakColor(streak.type)}`}>
      {streak.count} match {getStreakText(streak.type)}
    </div>
  );
};

export default LeagueTable;