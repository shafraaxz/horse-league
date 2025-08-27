// components/pages/PlayerProfile.js - Complete player profile with stats
import React, { useState } from 'react';
import { 
  ArrowLeft, 
  User, 
  Target, 
  Trophy, 
  Calendar, 
  MapPin, 
  Users, 
  Activity,
  Star,
  Award,
  Clock,
  Shield,
  TrendingUp,
  BarChart3,
  Camera
} from 'lucide-react';

const PlayerProfile = ({ 
  player, 
  team, 
  league, 
  matches, 
  onBack, 
  isAdmin = false // Default to false, making it optional
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!player) {
    return (
      <div className="text-center py-16">
        <User className="h-16 w-16 text-gray-300 mx-auto mb-6" />
        <h4 className="text-xl font-medium text-gray-900 mb-3">Player Not Found</h4>
        <p className="text-gray-500 mb-6">The requested player could not be found.</p>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Calculate player statistics
  const stats = player.statistics || {};
  const playerMatches = matches?.filter(match => 
    match.status === 'completed' && (
      match.homeTeam?.players?.some(p => p._id === player._id) ||
      match.awayTeam?.players?.some(p => p._id === player._id)
    )
  ) || [];

  const goalsPerMatch = stats.matchesPlayed > 0 ? (stats.goals / stats.matchesPlayed).toFixed(2) : 0;
  const minutesPerGoal = stats.goals > 0 ? Math.round(stats.minutesPlayed / stats.goals) : 0;
  const assistsPerMatch = stats.matchesPlayed > 0 ? (stats.assists / stats.matchesPlayed).toFixed(2) : 0;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'stats', label: 'Statistics', icon: BarChart3 },
    { id: 'matches', label: 'Match History', icon: Calendar },
    { id: 'awards', label: 'Achievements', icon: Trophy }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Player Profile</h1>
          <p className="text-gray-600">Detailed player information and statistics</p>
        </div>
      </div>

      {/* Player Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl overflow-hidden">
        <div className="px-8 py-12 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-8">
            {/* Player Photo */}
            <div className="relative mb-6 md:mb-0">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-white/20 border-4 border-white/30 shadow-2xl">
                {player.photo ? (
                  <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="h-16 w-16 text-white/60" />
                  </div>
                )}
              </div>
              {/* Only show edit photo button for admins */}
              {isAdmin && (
                <button className="absolute bottom-0 right-0 p-2 bg-blue-500 rounded-full text-white hover:bg-blue-600 transition-colors">
                  <Camera className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Player Info */}
            <div className="flex-1">
              <h2 className="text-4xl font-bold mb-2">{player.name}</h2>
              <div className="flex flex-wrap items-center space-x-4 text-white/90 text-lg mb-4">
                <span className="font-semibold">{player.position}</span>
                <span>•</span>
                <span>#{player.jerseyNumber || 'N/A'}</span>
                {team && (
                  <>
                    <span>•</span>
                    <span>{team.name}</span>
                  </>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.goals || 0}</div>
                  <div className="text-white/70 text-sm">Goals</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.assists || 0}</div>
                  <div className="text-white/70 text-sm">Assists</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.matchesPlayed || 0}</div>
                  <div className="text-white/70 text-sm">Matches</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.minutesPlayed || 0}</div>
                  <div className="text-white/70 text-sm">Minutes</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100">
          <div className="flex space-x-1 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Player Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Full Name</span>
                      <span className="font-medium text-gray-900">{player.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Position</span>
                      <span className="font-medium text-gray-900">{player.position}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jersey Number</span>
                      <span className="font-medium text-gray-900">#{player.jerseyNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Age</span>
                      <span className="font-medium text-gray-900">{player.age || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nationality</span>
                      <span className="font-medium text-gray-900">{player.nationality || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Information</h3>
                  <div className="space-y-3">
                    {team ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Current Team</span>
                          <span className="font-medium text-gray-900">{team.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">League</span>
                          <span className="font-medium text-gray-900">{league?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Joined</span>
                          <span className="font-medium text-gray-900">{player.joinedDate || 'N/A'}</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <Users className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">Free Agent</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{stats.goals || 0}</div>
                  <div className="text-sm text-gray-600">Total Goals</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{stats.assists || 0}</div>
                  <div className="text-sm text-gray-600">Total Assists</div>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <Activity className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{stats.matchesPlayed || 0}</div>
                  <div className="text-sm text-gray-600">Matches Played</div>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 text-center">
                  <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{stats.minutesPlayed || 0}</div>
                  <div className="text-sm text-gray-600">Minutes Played</div>
                </div>
              </div>
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Offensive Stats */}
                <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Target className="h-5 w-5 text-green-600 mr-2" />
                    Offensive Statistics
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Goals</span>
                      <span className="text-2xl font-bold text-gray-900">{stats.goals || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Assists</span>
                      <span className="text-2xl font-bold text-gray-900">{stats.assists || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Goals per Match</span>
                      <span className="text-2xl font-bold text-gray-900">{goalsPerMatch}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Assists per Match</span>
                      <span className="text-2xl font-bold text-gray-900">{assistsPerMatch}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Minutes per Goal</span>
                      <span className="text-2xl font-bold text-gray-900">{minutesPerGoal || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Discipline Stats */}
                <div className="bg-gradient-to-br from-yellow-50 to-red-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Shield className="h-5 w-5 text-red-600 mr-2" />
                    Discipline Record
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Yellow Cards</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-6 bg-yellow-400 rounded"></div>
                        <span className="text-2xl font-bold text-gray-900">{stats.yellowCards || 0}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Red Cards</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-6 bg-red-500 rounded"></div>
                        <span className="text-2xl font-bold text-gray-900">{stats.redCards || 0}</span>
                      </div>
                    </div>
                    {player.position === 'Goalkeeper' && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Clean Sheets</span>
                        <span className="text-2xl font-bold text-gray-900">{stats.cleanSheets || 0}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Performance Chart Placeholder */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Over Time</h3>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Performance chart would be displayed here</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Match History Tab */}
          {activeTab === 'matches' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Matches</h3>
              {playerMatches.length > 0 ? (
                <div className="space-y-3">
                  {playerMatches.slice(0, 10).map((match, index) => {
                    const isHome = match.homeTeam?._id === team?._id;
                    const opponent = isHome ? match.awayTeam : match.homeTeam;
                    const teamScore = isHome ? match.homeScore : match.awayScore;
                    const opponentScore = isHome ? match.awayScore : match.homeScore;
                    const result = teamScore > opponentScore ? 'W' : teamScore === opponentScore ? 'D' : 'L';
                    
                    return (
                      <div key={match._id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                            result === 'W' ? 'bg-green-500' : 
                            result === 'D' ? 'bg-gray-400' : 'bg-red-500'
                          }`}>
                            {result}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {isHome ? 'vs' : '@'} {opponent?.name || 'Unknown Team'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(match.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            {teamScore} - {opponentScore}
                          </p>
                          <p className="text-sm text-gray-500">{match.competition || league?.name}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No match history available</p>
                </div>
              )}
            </div>
          )}

          {/* Awards Tab */}
          {activeTab === 'awards' && (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-6" />
              <h4 className="text-xl font-medium text-gray-900 mb-3">Awards & Achievements</h4>
              <p className="text-gray-500">Player awards and achievements will be displayed here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerProfile;