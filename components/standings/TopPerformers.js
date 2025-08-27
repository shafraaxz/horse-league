// components/standings/TopPerformers.js
import React from 'react';
import { Trophy, Target, Users, Shield } from 'lucide-react';

const TopPerformers = ({ players, teams }) => {
  // Calculate top scorers
  const topScorers = [...players]
    .sort((a, b) => (b.statistics?.goals || 0) - (a.statistics?.goals || 0))
    .slice(0, 5);

  // Calculate top assists
  const topAssists = [...players]
    .sort((a, b) => (b.statistics?.assists || 0) - (a.statistics?.assists || 0))
    .slice(0, 5);

  // Calculate clean sheets (goalkeepers)
  const goalkeepers = players.filter(p => p.position === 'Goalkeeper');
  const topCleanSheets = [...goalkeepers]
    .sort((a, b) => (b.statistics?.cleanSheets || 0) - (a.statistics?.cleanSheets || 0))
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Top Scorers */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <Target className="h-6 w-6 text-green-500 mr-2" />
          <h3 className="text-lg font-semibold">Top Scorers</h3>
        </div>
        <div className="space-y-3">
          {topScorers.map((player, index) => (
            <div key={player._id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className={`font-bold ${index === 0 ? 'text-yellow-500' : 'text-gray-500'}`}>
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-sm">{player.name}</p>
                  <p className="text-xs text-gray-500">{player.team?.name}</p>
                </div>
              </div>
              <span className="font-bold text-lg">{player.statistics?.goals || 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Assists */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <Users className="h-6 w-6 text-blue-500 mr-2" />
          <h3 className="text-lg font-semibold">Top Assists</h3>
        </div>
        <div className="space-y-3">
          {topAssists.map((player, index) => (
            <div key={player._id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className={`font-bold ${index === 0 ? 'text-yellow-500' : 'text-gray-500'}`}>
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-sm">{player.name}</p>
                  <p className="text-xs text-gray-500">{player.team?.name}</p>
                </div>
              </div>
              <span className="font-bold text-lg">{player.statistics?.assists || 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Clean Sheets */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <Shield className="h-6 w-6 text-purple-500 mr-2" />
          <h3 className="text-lg font-semibold">Clean Sheets</h3>
        </div>
        <div className="space-y-3">
          {topCleanSheets.map((player, index) => (
            <div key={player._id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className={`font-bold ${index === 0 ? 'text-yellow-500' : 'text-gray-500'}`}>
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-sm">{player.name}</p>
                  <p className="text-xs text-gray-500">{player.team?.name}</p>
                </div>
              </div>
              <span className="font-bold text-lg">{player.statistics?.cleanSheets || 0}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopPerformers;
