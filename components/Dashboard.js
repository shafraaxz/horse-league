// components/Dashboard.js - Enhanced with League Selection
import { useState } from 'react';
import { Trophy, Users, Calendar, BarChart3, Play, Plus, ArrowRight, Clock, Target } from 'lucide-react';

const Dashboard = ({ leagueData, isLoading, leagues, selectedLeague, onLeagueSelect, onCreateLeague, isLoggedIn }) => {
  const [selectedLeagueForView, setSelectedLeagueForView] = useState('');

  // If no league is selected, show league selection screen
  if (!selectedLeague) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
            Welcome to Futsal Manager
          </h1>
          <p className="text-slate-400 text-lg">
            Choose a league to get started or create a new one
          </p>
        </div>

        {/* League Selection */}
        <div className="max-w-4xl mx-auto">
          {leagues.length > 0 ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white text-center">Select a League</h2>
              
              {/* League Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {leagues.map(league => (
                  <div
                    key={league._id}
                    className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 hover:border-blue-500/50 transition-all duration-300 cursor-pointer group hover:transform hover:scale-105"
                    onClick={() => onLeagueSelect(league._id)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {league.logo ? (
                          <img 
                            src={league.logo} 
                            alt={league.name}
                            className="w-12 h-12 rounded-lg object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center ${league.logo ? 'hidden' : 'flex'}`}>
                          <Trophy className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        league.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        league.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400' :
                        league.status === 'completed' ? 'bg-gray-500/20 text-gray-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {league.status || 'Active'}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                      {league.name}
                    </h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Season:</span>
                        <span className="text-white font-medium">{league.season}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Teams:</span>
                        <span className="text-white font-medium">{league.teamsCount || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Matches:</span>
                        <span className="text-white font-medium">{league.matchesCount || 0}</span>
                      </div>
                    </div>

                    {league.description && (
                      <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                        {league.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      {league.startDate && (
                        <div className="text-xs text-slate-400">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {new Date(league.startDate).toLocaleDateString()}
                        </div>
                      )}
                      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Create New League Option */}
              {isLoggedIn && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={onCreateLeague}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 font-medium transform hover:scale-105"
                  >
                    <Plus className="w-5 h-5" />
                    Create New League
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* No Leagues Available */
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-12 h-12 text-slate-600" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No Leagues Found</h3>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                Get started by creating your first futsal league. You can add teams, schedule matches, and track statistics.
              </p>
              {isLoggedIn ? (
                <button
                  onClick={onCreateLeague}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-4 rounded-xl transition-all duration-300 flex items-center gap-3 font-medium mx-auto transform hover:scale-105"
                >
                  <Plus className="w-6 h-6" />
                  Create Your First League
                </button>
              ) : (
                <p className="text-slate-500">Please login to create leagues</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // If loading, show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-slate-700 rounded w-48 animate-pulse mb-2"></div>
            <div className="h-5 bg-slate-700 rounded w-32 animate-pulse"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <div className="h-6 bg-slate-700 rounded animate-pulse mb-4"></div>
              <div className="h-8 bg-slate-700 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Main dashboard content when league is selected
  const stats = leagueData?.statistics || {};
  const league = leagueData?.league || {};
  const liveMatches = leagueData?.liveMatches || [];
  const recentMatches = leagueData?.matches?.filter(m => m.status === 'finished')
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5) || [];
  const upcomingMatches = leagueData?.matches?.filter(m => m.status === 'scheduled')
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            {league.logo && (
              <img 
                src={league.logo} 
                alt={league.name}
                className="w-10 h-10 rounded-lg object-cover"
                onError={(e) => e.target.style.display = 'none'}
              />
            )}
            {league.name || 'League Dashboard'}
          </h1>
          <p className="text-slate-400 mt-1">
            {league.season && `Season ${league.season}`} 
            {league.description && ` • ${league.description}`}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
            league.status === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
            league.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
            league.status === 'completed' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' :
            'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
          }`}>
            {league.status || 'Active'}
          </span>
        </div>
      </div>

      {/* Live Matches Alert */}
      {liveMatches.length > 0 && (
        <div className="bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <h3 className="text-xl font-bold text-white">Live Matches ({liveMatches.length})</h3>
          </div>
          <div className="grid gap-4">
            {liveMatches.map(match => (
              <div key={match._id} className="bg-slate-800/50 rounded-lg p-4 border border-red-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-white font-semibold">{match.homeTeam?.name || 'TBD'}</div>
                      <div className="text-2xl font-bold text-blue-400">{match.score?.home || 0}</div>
                    </div>
                    <div className="text-slate-400">VS</div>
                    <div className="text-center">
                      <div className="text-white font-semibold">{match.awayTeam?.name || 'TBD'}</div>
                      <div className="text-2xl font-bold text-red-400">{match.score?.away || 0}</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-400 font-bold">{match.liveData?.currentMinute || 0}'</div>
                    <div className="text-sm text-slate-400">
                      {match.status === 'halftime' ? 'HALF TIME' : 'LIVE'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 text-sm font-medium">Total Teams</p>
              <p className="text-3xl font-bold text-white">{stats.totalTeams || 0}</p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 text-sm font-medium">Total Matches</p>
              <p className="text-3xl font-bold text-white">{stats.totalMatches || 0}</p>
            </div>
            <Calendar className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-400 text-sm font-medium">Completed</p>
              <p className="text-3xl font-bold text-white">{stats.finishedMatches || 0}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-400 text-sm font-medium">Live Matches</p>
              <p className="text-3xl font-bold text-white">{stats.liveCount || 0}</p>
            </div>
            <Play className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Matches */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-green-400" />
            Recent Results
          </h3>
          {recentMatches.length > 0 ? (
            <div className="space-y-4">
              {recentMatches.map(match => (
                <div key={match._id} className="bg-slate-700/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="text-white font-semibold text-sm">{match.homeTeam?.name || 'TBD'}</div>
                        <div className="text-lg font-bold text-blue-400">{match.homeScore || 0}</div>
                      </div>
                      <div className="text-slate-400 text-sm">VS</div>
                      <div className="text-center">
                        <div className="text-white font-semibold text-sm">{match.awayTeam?.name || 'TBD'}</div>
                        <div className="text-lg font-bold text-red-400">{match.awayScore || 0}</div>
                      </div>
                    </div>
                    <div className="text-slate-400 text-sm">
                      {match.date && new Date(match.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No completed matches yet</p>
            </div>
          )}
        </div>

        {/* Upcoming Matches */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Upcoming Matches
          </h3>
          {upcomingMatches.length > 0 ? (
            <div className="space-y-4">
              {upcomingMatches.map(match => (
                <div key={match._id} className="bg-slate-700/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="text-white font-semibold text-sm">{match.homeTeam?.name || 'TBD'}</div>
                      </div>
                      <div className="text-slate-400 text-sm">VS</div>
                      <div className="text-center">
                        <div className="text-white font-semibold text-sm">{match.awayTeam?.name || 'TBD'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-400 text-sm">
                        {match.date && new Date(match.date).toLocaleDateString()}
                      </div>
                      <div className="text-slate-400 text-xs">
                        {match.time || 'TBD'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No upcoming matches scheduled</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Scorers */}
      {stats.topScorers && stats.topScorers.length > 0 && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Top Scorers
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {stats.topScorers.map((player, index) => (
              <div key={player._id} className="bg-slate-700/30 rounded-lg p-4 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">#{index + 1}</span>
                </div>
                <div className="text-white font-semibold">{player.name}</div>
                <div className="text-slate-400 text-sm">{player.team?.name || 'No Team'}</div>
                <div className="text-yellow-400 font-bold">{player.stats?.goals || 0} goals</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;