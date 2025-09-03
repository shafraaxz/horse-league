// ===========================================
// FILE: pages/standings.js (ENHANCED WITH TIE-BREAKING DISPLAY)
// ===========================================
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Trophy, TrendingUp, TrendingDown, Minus, Info, Award, Target, Shield } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function StandingsPage() {
  const [standings, setStandings] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showTieBreakingInfo, setShowTieBreakingInfo] = useState(false);

  useEffect(() => {
    fetchSeasons();
  }, []);

  useEffect(() => {
    if (selectedSeason) {
      fetchStandings();
    }
  }, [selectedSeason]);

  const fetchSeasons = async () => {
    try {
      const response = await fetch('/api/public/seasons');
      const data = await response.json();
      setSeasons(data);
      
      const activeSeason = data.find(s => s.isActive);
      if (activeSeason) {
        setSelectedSeason(activeSeason._id);
      } else if (data.length > 0) {
        setSelectedSeason(data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching seasons:', error);
    }
  };

  const fetchStandings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/public/standings?seasonId=${selectedSeason}`);
      const data = await response.json();
      setStandings(Array.isArray(data) ? data : []);
      console.log('Standings loaded:', data.length, 'teams');
    } catch (error) {
      console.error('Error fetching standings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPositionIcon = (position, previousPosition) => {
    if (!previousPosition || previousPosition === position) {
      return <Minus className="w-4 h-4 text-gray-400" />;
    } else if (previousPosition > position) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
  };

  const getPositionColor = (position) => {
    if (position <= 3) return 'text-yellow-600 font-bold';
    if (position <= 6) return 'text-green-600 font-semibold';
    if (position <= 10) return 'text-blue-600';
    return 'text-gray-600';
  };

  const getPositionBackground = (position) => {
    if (position === 1) return 'bg-yellow-50 border-l-4 border-yellow-400';
    if (position <= 3) return 'bg-green-50 border-l-4 border-green-400';
    if (position > standings.length - 3) return 'bg-red-50 border-l-4 border-red-400';
    return '';
  };

  // Function to detect teams that are tied and how they're separated
  const getTieBreakingInfo = (team, index) => {
    if (index === 0) return null;
    
    const prevTeam = standings[index - 1];
    const currentStats = team.enhancedStats || team.stats;
    const prevStats = prevTeam.enhancedStats || prevTeam.stats;
    
    if (!currentStats || !prevStats) return null;
    
    // If they have the same points, show what separated them
    if (currentStats.points === prevStats.points) {
      if (currentStats.goalDifference !== prevStats.goalDifference) {
        return { criteria: 'Goal Difference', icon: Target };
      }
      if (currentStats.goalsFor !== prevStats.goalsFor) {
        return { criteria: 'Goals For', icon: Trophy };
      }
      if (currentStats.goalsAgainst !== prevStats.goalsAgainst) {
        return { criteria: 'Goals Against', icon: Shield };
      }
      if (currentStats.fairPlayPoints !== prevStats.fairPlayPoints) {
        return { criteria: 'Fair Play', icon: Award };
      }
    }
    
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">League Standings</h1>
          <p className="text-gray-600 mt-1">Teams ranked by points, then tie-breaking criteria</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowTieBreakingInfo(!showTieBreakingInfo)}
            className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
          >
            <Info className="w-4 h-4 mr-1" />
            Tie-Breaking Rules
          </button>
          
          {seasons.length > 0 && (
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="form-input w-48"
            >
              {seasons.map(season => (
                <option key={season._id} value={season._id}>
                  {season.name} {season.isActive && '(Active)'}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Tie-Breaking Rules Info */}
      {showTieBreakingInfo && (
        <div className="card bg-blue-50 border border-blue-200">
          <div className="flex items-start space-x-3">
            <Info className="w-6 h-6 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Tie-Breaking Criteria</h3>
              <p className="text-blue-800 text-sm mb-3">
                When teams are level on points, they are separated by the following criteria in order:
              </p>
              <ol className="text-blue-800 text-sm space-y-1 list-decimal list-inside">
                <li><strong>Goal Difference</strong> - Goals scored minus goals conceded</li>
                <li><strong>Goals For</strong> - Total goals scored (higher is better)</li>
                <li><strong>Goals Against</strong> - Total goals conceded (lower is better)</li>
                <li><strong>Head-to-Head</strong> - Direct results between tied teams</li>
                <li><strong>Fair Play</strong> - Disciplinary record (fewer cards is better)</li>
                <li><strong>Alphabetical</strong> - Team name as final tie-breaker</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
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
                  MP
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
                  FP
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pts
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {standings.map((team, index) => {
                const position = index + 1;
                const stats = team.enhancedStats || team.stats;
                const goalDifference = stats.goalsFor - stats.goalsAgainst;
                const tieBreakInfo = getTieBreakingInfo(team, index);
                
                return (
                  <tr 
                    key={team._id}
                    className={`hover:bg-gray-50 transition-colors ${getPositionBackground(position)}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`text-lg ${getPositionColor(position)}`}>
                          {position}
                        </span>
                        {position === 1 && <Trophy className="w-4 h-4 text-yellow-500" />}
                        {getPositionIcon(position, team.previousPosition)}
                        {/* Tie-breaking indicator */}
                        {tieBreakInfo && (
                          <div className="group relative">
                            <tieBreakInfo.icon className="w-3 h-3 text-blue-500" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              Separated by {tieBreakInfo.criteria}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        {team.logo?.url && (
                          <Image
                            src={team.logo.url}
                            alt={team.name}
                            width={32}
                            height={32}
                            className="rounded-full object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{team.name}</p>
                          {team.playerCount > 0 && (
                            <p className="text-xs text-gray-500">{team.playerCount} players</p>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {stats.matchesPlayed || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-green-600 font-medium">
                      {stats.wins || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-yellow-600 font-medium">
                      {stats.draws || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-red-600 font-medium">
                      {stats.losses || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 font-medium">
                      {stats.goalsFor || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 font-medium">
                      {stats.goalsAgainst || 0}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-center text-sm font-bold ${
                      goalDifference > 0 ? 'text-green-600' :
                      goalDifference < 0 ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {goalDifference > 0 ? '+' : ''}{goalDifference}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <div className="flex items-center justify-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          (stats.fairPlayPoints || 0) === 0 ? 'bg-green-100 text-green-800' :
                          (stats.fairPlayPoints || 0) <= 3 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {stats.fairPlayPoints || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-lg font-bold text-blue-600">
                      {stats.points || 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {standings.length === 0 && (
        <div className="card text-center py-12">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-4">No Standings Available</h2>
          <p className="text-gray-500">
            No teams have been registered for this season yet.
          </p>
        </div>
      )}

      {/* Enhanced Legend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Position Legend */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Position Guide</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-yellow-200 rounded border-l-4 border-yellow-400"></div>
              <span className="text-sm">Champion Position</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-green-200 rounded border-l-4 border-green-400"></div>
              <span className="text-sm">Top 3 Positions</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-red-200 rounded border-l-4 border-red-400"></div>
              <span className="text-sm">Bottom 3 Positions</span>
            </div>
          </div>
        </div>

        {/* Statistics Legend */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Statistics Guide</h3>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <div><strong>MP:</strong> Matches Played</div>
            <div><strong>W:</strong> Wins</div>
            <div><strong>D:</strong> Draws</div>
            <div><strong>L:</strong> Losses</div>
            <div><strong>GF:</strong> Goals For</div>
            <div><strong>GA:</strong> Goals Against</div>
            <div><strong>GD:</strong> Goal Difference</div>
            <div><strong>FP:</strong> Fair Play Points</div>
          </div>
          <div className="mt-3 text-xs text-gray-600">
            <strong>Fair Play:</strong> Yellow cards = 1 point, Red cards = 3 points (lower is better)
          </div>
        </div>
      </div>
    </div>
  );
}
