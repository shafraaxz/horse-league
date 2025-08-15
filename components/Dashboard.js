// components/Dashboard.js - Enhanced with Next Match functionality
import React from 'react';
import { 
  Calendar, Users, Trophy, Clock, 
  Target, TrendingUp, BarChart3, 
  Play, ArrowRight, MapPin, Zap 
} from 'lucide-react';

const Dashboard = ({ leagueData, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!leagueData) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏆</div>
        <h3 className="text-xl font-semibold text-white mb-2">Welcome to Futsal Manager</h3>
        <p className="text-slate-400">Select a league to view the dashboard</p>
      </div>
    );
  }

  // ✅ CALCULATE NEXT MATCH
  const getNextMatch = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
    
    // Get all scheduled matches
    const scheduledMatches = (leagueData.matches || [])
      .filter(match => match.status === 'scheduled')
      .sort((a, b) => {
        // Sort by date first, then by time
        if (a.date !== b.date) {
          return new Date(a.date) - new Date(b.date);
        }
        return (a.time || '00:00').localeCompare(b.time || '00:00');
      });

    // Find next match (today or in the future)
    const nextMatch = scheduledMatches.find(match => {
      if (match.date > today) return true; // Future date
      if (match.date === today && (match.time || '00:00') > currentTime) return true; // Today but later time
      return false;
    });

    return nextMatch || null;
  };

  // ✅ CALCULATE RECENT RESULTS
  const getRecentResults = () => {
    const finishedMatches = (leagueData.matches || [])
      .filter(match => match.status === 'finished')
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);

    return finishedMatches;
  };

  // ✅ GET LIVE MATCHES
  const getLiveMatches = () => {
    return (leagueData.matches || [])
      .filter(match => match.status === 'live' || match.status === 'halftime');
  };

  const nextMatch = getNextMatch();
  const recentResults = getRecentResults();
  const liveMatches = getLiveMatches();

  // Calculate days until next match
  const getDaysUntilMatch = (matchDate) => {
    const today = new Date();
    const match = new Date(matchDate);
    const diffTime = match - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Format match time display
  const formatMatchTime = (date, time) => {
    const matchDate = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    if (date === today.toISOString().split('T')[0]) {
      return `Today at ${time || 'TBD'}`;
    } else if (date === tomorrow.toISOString().split('T')[0]) {
      return `Tomorrow at ${time || 'TBD'}`;
    } else {
      const dayName = matchDate.toLocaleDateString('en-US', { weekday: 'long' });
      return `${dayName} at ${time || 'TBD'}`;
    }
  };

  const stats = leagueData.statistics || {};

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Overview of {leagueData.league?.name || 'Your League'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-orange-400">
            {stats.totalTeams || 0} Teams
          </div>
          <div className="text-sm text-slate-400">
            {stats.totalMatches || 0} Matches Total
          </div>
        </div>
      </div>

      {/* Live Matches Alert */}
      {liveMatches.length > 0 && (
        <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border-2 border-red-500/40 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <h3 className="text-xl font-semibold text-white">🔴 LIVE NOW</h3>
            <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
              {liveMatches.length} MATCH{liveMatches.length > 1 ? 'ES' : ''}
            </span>
          </div>
          <div className="space-y-3">
            {liveMatches.map(match => (
              <div key={match._id} className="bg-slate-800/50 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="font-semibold text-white">{match.homeTeam?.name}</div>
                    <div className="text-2xl font-bold text-blue-400">{match.score?.home || 0}</div>
                  </div>
                  <div className="text-slate-400">-</div>
                  <div className="text-center">
                    <div className="font-semibold text-white">{match.awayTeam?.name}</div>
                    <div className="text-2xl font-bold text-red-400">{match.score?.away || 0}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-400">
                    {match.liveData?.currentMinute || 0}'
                  </div>
                  <div className="text-xs text-slate-400">
                    {match.status === 'halftime' ? 'HALF TIME' : 'LIVE'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Match Card */}
      {nextMatch && (
        <div className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 border-2 border-orange-500/40 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-6 h-6 text-orange-400" />
            <h3 className="text-xl font-semibold text-white">Next Match</h3>
            {getDaysUntilMatch(nextMatch.date) <= 1 && (
              <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                UPCOMING
              </span>
            )}
          </div>
          
          <div className="bg-slate-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-center flex-1">
                <div className="text-xl font-bold text-white mb-1">
                  {nextMatch.homeTeam?.name || 'TBD'}
                </div>
                <div className="text-sm text-slate-400">HOME</div>
              </div>
              
              <div className="px-6">
                <div className="text-3xl font-bold text-orange-400">VS</div>
              </div>
              
              <div className="text-center flex-1">
                <div className="text-xl font-bold text-white mb-1">
                  {nextMatch.awayTeam?.name || 'TBD'}
                </div>
                <div className="text-sm text-slate-400">AWAY</div>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-6 pt-4 border-t border-slate-700">
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-4 h-4" />
                <span>{formatMatchTime(nextMatch.date, nextMatch.time)}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-4 h-4" />
                <span>{nextMatch.venue || 'Manadhoo Futsal Ground'}</span>
              </div>
              {getDaysUntilMatch(nextMatch.date) >= 0 && (
                <div className="flex items-center gap-2 text-orange-400">
                  <Calendar className="w-4 h-4" />
                  <span className="font-semibold">
                    {getDaysUntilMatch(nextMatch.date) === 0 ? 'Today' : 
                     getDaysUntilMatch(nextMatch.date) === 1 ? 'Tomorrow' : 
                     `In ${getDaysUntilMatch(nextMatch.date)} days`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 text-blue-400" />
            <span className="text-xs text-blue-300 bg-blue-500/20 px-2 py-1 rounded-full">TEAMS</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats.totalTeams || 0}</div>
          <div className="text-blue-300 text-sm">Active Teams</div>
        </div>

        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <Trophy className="w-8 h-8 text-green-400" />
            <span className="text-xs text-green-300 bg-green-500/20 px-2 py-1 rounded-full">TOTAL</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats.totalMatches || 0}</div>
          <div className="text-green-300 text-sm">Total Matches</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <Play className="w-8 h-8 text-purple-400" />
            <span className="text-xs text-purple-300 bg-purple-500/20 px-2 py-1 rounded-full">FINISHED</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats.finishedMatches || 0}</div>
          <div className="text-purple-300 text-sm">Completed</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-orange-400" />
            <span className="text-xs text-orange-300 bg-orange-500/20 px-2 py-1 rounded-full">PENDING</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats.scheduledMatches || 0}</div>
          <div className="text-orange-300 text-sm">Scheduled</div>
        </div>
      </div>

      {/* Recent Results & Top Scorers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Results */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Recent Results
          </h3>
          
          {recentResults.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No completed matches yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentResults.map(match => (
                <div key={match._id} className="bg-slate-700/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="text-sm font-medium text-white">
                          {match.homeTeam?.name}
                        </div>
                        <div className="text-lg font-bold text-blue-400">
                          {match.score?.home || 0}
                        </div>
                      </div>
                      <div className="text-slate-400">-</div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-white">
                          {match.awayTeam?.name}
                        </div>
                        <div className="text-lg font-bold text-red-400">
                          {match.score?.away || 0}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">
                        {new Date(match.date).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-green-400 font-medium">
                        FINISHED
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Scorers */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-400" />
            Top Scorers
          </h3>
          
          {!stats.topScorers || stats.topScorers.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No goals scored yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.topScorers.map((player, index) => (
                <div key={player._id} className="flex items-center gap-4 p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-gray-400 text-black' :
                      index === 2 ? 'bg-orange-600 text-white' :
                      'bg-slate-600 text-white'
                    }`}>
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white">{player.name}</div>
                    <div className="text-sm text-slate-400">{player.team?.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-orange-400">
                      {player.stats?.goals || 0}
                    </div>
                    <div className="text-xs text-slate-400">goals</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {(!nextMatch && stats.scheduledMatches === 0) && (
        <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-600 rounded-xl p-6">
          <div className="text-center">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Matches Scheduled</h3>
            <p className="text-slate-400 mb-4">
              {stats.totalTeams >= 2 ? 
                'Generate a tournament schedule to get started with matches.' :
                'Add more teams first, then generate a tournament schedule.'
              }
            </p>
            {stats.totalTeams >= 2 && (
              <div className="flex justify-center">
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                  Generate Schedule
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;