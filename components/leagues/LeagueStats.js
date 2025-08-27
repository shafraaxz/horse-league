// components/leagues/LeagueStats.js
import React from 'react';
import { Trophy, Target, TrendingUp, Award } from 'lucide-react';

const LeagueStats = ({ league = {}, matches = [], teams = [] }) => {
  // Ensure arrays are valid
  const matchesList = Array.isArray(matches) ? matches : [];
  const teamsList = Array.isArray(teams) ? teams : [];
  
  // Calculate stats with safe defaults
  const completedMatches = matchesList.filter(m => m && m.status === 'completed');
  const totalGoals = completedMatches.reduce((sum, m) => {
    const homeScore = m.homeScore || 0;
    const awayScore = m.awayScore || 0;
    return sum + homeScore + awayScore;
  }, 0);
  
  const avgGoalsPerMatch = completedMatches.length > 0 
    ? (totalGoals / completedMatches.length).toFixed(2) 
    : '0.00';

  // Calculate top scorer (optional - only if we have match events)
  const playerGoals = {};
  completedMatches.forEach(match => {
    if (match.events && Array.isArray(match.events)) {
      match.events.forEach(event => {
        if (event && event.type === 'goal' && event.player) {
          playerGoals[event.player] = (playerGoals[event.player] || 0) + 1;
        }
      });
    }
  });

  const stats = [
    {
      icon: Trophy,
      label: 'Total Teams',
      value: teamsList.length,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      icon: Target,
      label: 'Total Goals',
      value: totalGoals,
      color: 'text-green-600 bg-green-100'
    },
    {
      icon: TrendingUp,
      label: 'Avg Goals/Match',
      value: avgGoalsPerMatch,
      color: 'text-purple-600 bg-purple-100'
    },
    {
      icon: Award,
      label: 'Matches Played',
      value: completedMatches.length,
      color: 'text-orange-600 bg-orange-100'
    }
  ];

  // Calculate progress percentage safely
  const totalMatches = matchesList.length || 1; // Avoid division by zero
  const progressPercentage = Math.round((completedMatches.length / totalMatches) * 100);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">League Statistics</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <div className={`inline-flex p-3 rounded-full ${stat.color} mb-2`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
            <div className="text-sm text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Season Progress</span>
          <span>{progressPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Top Scorers Section (optional) */}
      {Object.keys(playerGoals).length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Top Scorers</h4>
          <div className="space-y-2">
            {Object.entries(playerGoals)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 3)
              .map(([playerId, goals], index) => (
                <div key={playerId} className="flex justify-between text-sm">
                  <span className="text-gray-600">Player {index + 1}</span>
                  <span className="font-semibold">{goals} goals</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeagueStats;