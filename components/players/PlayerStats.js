// components/players/PlayerStats.js
import React from 'react';
import { Target, TrendingUp, Activity, Award, Clock, Shield } from 'lucide-react';

const PlayerStats = ({ player, matches }) => {
  const stats = player.statistics || {};
  const goalsPerMatch = stats.matchesPlayed > 0 ? (stats.goals / stats.matchesPlayed).toFixed(2) : 0;
  const minutesPerGoal = stats.goals > 0 ? Math.round(stats.minutesPlayed / stats.goals) : 0;

  const statCards = [
    {
      icon: Target,
      label: 'Goals',
      value: stats.goals || 0,
      subValue: `${goalsPerMatch} per match`,
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: TrendingUp,
      label: 'Assists',
      value: stats.assists || 0,
      subValue: 'Goal contributions',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: Activity,
      label: 'Matches',
      value: stats.matchesPlayed || 0,
      subValue: `${stats.minutesPlayed || 0} minutes`,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      icon: Shield,
      label: player.position === 'Goalkeeper' ? 'Clean Sheets' : 'Cards',
      value: player.position === 'Goalkeeper' 
        ? stats.cleanSheets || 0 
        : `${stats.yellowCards || 0}/${stats.redCards || 0}`,
      subValue: player.position === 'Goalkeeper' ? 'No goals conceded' : 'Yellow/Red',
      color: 'bg-orange-100 text-orange-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Season Statistics</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <div key={index} className="text-center">
              <div className={`inline-flex p-3 rounded-full ${stat.color} mb-2`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.subValue}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Metrics</h3>
        
        <div className="space-y-4">
          {player.position === 'Goalkeeper' ? (
            <>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Saves</span>
                <span className="text-xl font-bold text-gray-800">{stats.saves || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Save Percentage</span>
                <span className="text-xl font-bold text-gray-800">
                  {stats.saves && stats.shotsAgainst 
                    ? `${((stats.saves / stats.shotsAgainst) * 100).toFixed(1)}%`
                    : '0%'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Clean Sheet %</span>
                <span className="text-xl font-bold text-gray-800">
                  {stats.matchesPlayed > 0 
                    ? `${((stats.cleanSheets / stats.matchesPlayed) * 100).toFixed(1)}%`
                    : '0%'}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Goals per Match</span>
                <span className="text-xl font-bold text-gray-800">{goalsPerMatch}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Minutes per Goal</span>
                <span className="text-xl font-bold text-gray-800">
                  {minutesPerGoal || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Goal + Assist Ratio</span>
                <span className="text-xl font-bold text-gray-800">
                  {stats.matchesPlayed > 0 
                    ? ((stats.goals + stats.assists) / stats.matchesPlayed).toFixed(2)
                    : '0'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Discipline */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Discipline Record</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="w-8 h-12 bg-yellow-400 rounded mx-auto mb-2"></div>
            <div className="text-2xl font-bold text-gray-800">{stats.yellowCards || 0}</div>
            <div className="text-sm text-gray-600">Yellow Cards</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="w-8 h-12 bg-red-500 rounded mx-auto mb-2"></div>
            <div className="text-2xl font-bold text-gray-800">{stats.redCards || 0}</div>
            <div className="text-sm text-gray-600">Red Cards</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerStats;