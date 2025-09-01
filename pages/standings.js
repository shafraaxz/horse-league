import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function StandingsPage() {
  const [standings, setStandings] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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
      setStandings(data);
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
        <h1 className="text-3xl font-bold text-gray-900">League Standings</h1>
        
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

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
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
                  Pts
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {standings.map((team, index) => {
                const position = index + 1;
                const goalDifference = team.stats.goalsFor - team.stats.goalsAgainst;
                
                return (
                  <tr 
                    key={team._id}
                    className={`hover:bg-gray-50 ${
                      position === 1 ? 'bg-yellow-50' :
                      position <= 3 ? 'bg-green-50' :
                      position > standings.length - 3 ? 'bg-red-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`text-lg ${getPositionColor(position)}`}>
                          {position}
                        </span>
                        {position === 1 && <Trophy className="w-4 h-4 text-yellow-500" />}
                        {getPositionIcon(position, team.previousPosition)}
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
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {team.stats.matchesPlayed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-green-600 font-medium">
                      {team.stats.wins}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-yellow-600 font-medium">
                      {team.stats.draws}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-red-600 font-medium">
                      {team.stats.losses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {team.stats.goalsFor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {team.stats.goalsAgainst}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-center text-sm font-medium ${
                      goalDifference > 0 ? 'text-green-600' :
                      goalDifference < 0 ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {goalDifference > 0 ? '+' : ''}{goalDifference}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-lg font-bold text-blue-600">
                      {team.stats.points}
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

      {/* Legend */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-200 rounded"></div>
            <span>Champion</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-200 rounded"></div>
            <span>Top 3</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-200 rounded"></div>
            <span>Bottom 3</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs">MP: Matches Played, W: Wins, D: Draws, L: Losses</span>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-600">
          <span>GF: Goals For, GA: Goals Against, GD: Goal Difference, Pts: Points</span>
        </div>
      </div>
    </div>
  );
}
