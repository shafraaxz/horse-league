// components/teams/TeamStats.js
import React from 'react';
import { Trophy, Target, Shield, Users, TrendingUp } from 'lucide-react';

const TeamStats = ({ team, players = [], matches = [] }) => {
  const stats = team.statistics || {};
  
  // Calculate additional stats
  const goalDifference = (stats.goalsFor || 0) - (stats.goalsAgainst || 0);
  const winPercentage = stats.matchesPlayed > 0 
    ? ((stats.wins || 0) / stats.matchesPlayed * 100).toFixed(1)
    : 0;
  
  const topScorer = players
    .filter(p => p.statistics?.goals > 0)
    .sort((a, b) => (b.statistics?.goals || 0) - (a.statistics?.goals || 0))[0];

  const statCards = [
    {
      title: 'Matches Played',
      value: stats.matchesPlayed || 0,
      icon: Target,
      color: 'bg-blue-500'
    },
    {
      title: 'Points',
      value: stats.points || 0,
      icon: Trophy,
      color: 'bg-yellow-500'
    },
    {
      title: 'Goals For',
      value: stats.goalsFor || 0,
      icon: Target,
      color: 'bg-green-500'
    },
    {
      title: 'Goals Against',
      value: stats.goalsAgainst || 0,
      icon: Shield,
      color: 'bg-red-500'
    },
    {
      title: 'Goal Difference',
      value: goalDifference > 0 ? `+${goalDifference}` : goalDifference,
      icon: TrendingUp,
      color: goalDifference >= 0 ? 'bg-green-500' : 'bg-red-500'
    },
    {
      title: 'Win Percentage',
      value: `${winPercentage}%`,
      icon: Trophy,
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <IconComponent className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">
                {stat.title}
              </div>
            </div>
          );
        })}
      </div>

      {/* Record Breakdown */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Record</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {stats.wins || 0}
            </div>
            <div className="text-sm text-green-700">Wins</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.draws || 0}
            </div>
            <div className="text-sm text-yellow-700">Draws</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {stats.losses || 0}
            </div>
            <div className="text-sm text-red-700">Losses</div>
          </div>
        </div>
      </div>

      {/* Team Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Squad Overview */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Squad Overview
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Players</span>
              <span className="font-medium">{players.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Goalkeepers</span>
              <span className="font-medium">
                {players.filter(p => p.position === 'Goalkeeper').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Defenders</span>
              <span className="font-medium">
                {players.filter(p => p.position === 'Defender').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Midfielders</span>
              <span className="font-medium">
                {players.filter(p => p.position === 'Midfielder').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Forwards</span>
              <span className="font-medium">
                {players.filter(p => p.position === 'Forward').length}
              </span>
            </div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Performers
          </h3>
          <div className="space-y-4">
            {topScorer && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Top Scorer</div>
                  <div className="text-sm text-gray-600">{topScorer.name}</div>
                </div>
                <div className="text-xl font-bold text-yellow-600">
                  {topScorer.statistics?.goals} goals
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Clean Sheets</div>
                <div className="text-sm text-gray-600">Team Defense</div>
              </div>
              <div className="text-xl font-bold text-blue-600">
                {stats.cleanSheets || 0}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamStats;