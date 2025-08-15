// components/LiveMatchManager.js - Live Match Updates with Player Statistics
import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, StopCircle, Plus, Minus, Clock, Users, Target, 
  AlertTriangle, X, Save, RotateCcw, Timer, Award, 
  User, Goal, AlertCircle, BookOpen, Send
} from 'lucide-react';

const LiveMatchManager = ({ 
  match, 
  isOpen, 
  onClose, 
  onUpdate,
  players = [],
  teams = []
}) => {
  const [matchData, setMatchData] = useState({
    score: { home: 0, away: 0 },
    liveData: { currentMinute: 0, period: 'first_half', isLive: false },
    status: 'scheduled',
    events: []
  });
  
  const [newEvent, setNewEvent] = useState({
    type: 'goal',
    minute: 0,
    playerId: '',
    teamId: '',
    description: ''
  });
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);

  // Initialize match data
  useEffect(() => {
    if (match) {
      setMatchData({
        score: match.score || { home: 0, away: 0 },
        liveData: match.liveData || { currentMinute: 0, period: 'first_half', isLive: false },
        status: match.status || 'scheduled',
        events: match.events || []
      });
      setNewEvent(prev => ({ ...prev, minute: match.liveData?.currentMinute || 0 }));
    }
  }, [match]);

  // Filter players by teams
  const homeTeamPlayers = players.filter(p => p.team?._id === match?.homeTeam?._id);
  const awayTeamPlayers = players.filter(p => p.team?._id === match?.awayTeam?._id);
  const allMatchPlayers = [...homeTeamPlayers, ...awayTeamPlayers];

  // Event types
  const eventTypes = [
    { value: 'goal', label: 'Goal ⚽', color: 'text-green-400' },
    { value: 'yellow_card', label: 'Yellow Card 🟨', color: 'text-yellow-400' },
    { value: 'red_card', label: 'Red Card 🟥', color: 'text-red-400' },
    { value: 'substitution', label: 'Substitution 🔄', color: 'text-blue-400' },
    { value: 'injury', label: 'Injury 🏥', color: 'text-orange-400' },
    { value: 'other', label: 'Other Event 📝', color: 'text-gray-400' }
  ];

  // Update score
  const updateScore = (team, increment) => {
    setMatchData(prev => ({
      ...prev,
      score: {
        ...prev.score,
        [team]: Math.max(0, prev.score[team] + increment)
      }
    }));
  };

  // Update time
  const updateTime = (increment) => {
    setMatchData(prev => ({
      ...prev,
      liveData: {
        ...prev.liveData,
        currentMinute: Math.max(0, Math.min(120, prev.liveData.currentMinute + increment))
      }
    }));
  };

  // Start match
  const startMatch = () => {
    setMatchData(prev => ({
      ...prev,
      status: 'live',
      liveData: { ...prev.liveData, isLive: true }
    }));
  };

  // Pause/Resume match
  const togglePause = () => {
    setMatchData(prev => ({
      ...prev,
      liveData: { ...prev.liveData, isLive: !prev.liveData.isLive }
    }));
  };

  // Half time
  const setHalfTime = () => {
    setMatchData(prev => ({
      ...prev,
      status: 'halftime',
      liveData: { 
        ...prev.liveData, 
        period: 'halftime',
        currentMinute: 45,
        isLive: false 
      }
    }));
  };

  // Second half
  const startSecondHalf = () => {
    setMatchData(prev => ({
      ...prev,
      status: 'live',
      liveData: { 
        ...prev.liveData, 
        period: 'second_half',
        currentMinute: 45,
        isLive: true 
      }
    }));
  };

  // End match
  const endMatch = () => {
    setMatchData(prev => ({
      ...prev,
      status: 'finished',
      liveData: { ...prev.liveData, isLive: false }
    }));
  };

  // Add event
  const addEvent = () => {
    if (!newEvent.playerId || !newEvent.teamId) {
      alert('Please select a player and team');
      return;
    }

    const player = allMatchPlayers.find(p => p._id === newEvent.playerId);
    const team = teams.find(t => t._id === newEvent.teamId);

    const event = {
      id: Date.now(),
      type: newEvent.type,
      minute: newEvent.minute,
      player: {
        _id: player?._id,
        name: player?.name,
        number: player?.number
      },
      team: {
        _id: team?._id,
        name: team?.name
      },
      description: newEvent.description || `${newEvent.type} - ${player?.name}`,
      timestamp: new Date()
    };

    setMatchData(prev => ({
      ...prev,
      events: [...prev.events, event]
    }));

    // Auto-update score for goals
    if (newEvent.type === 'goal') {
      const isHomeTeam = newEvent.teamId === match.homeTeam?._id;
      updateScore(isHomeTeam ? 'home' : 'away', 1);
    }

    // Reset form
    setNewEvent({
      type: 'goal',
      minute: matchData.liveData.currentMinute,
      playerId: '',
      teamId: '',
      description: ''
    });
    setShowEventForm(false);
  };

  // Remove event
  const removeEvent = (eventId) => {
    setMatchData(prev => ({
      ...prev,
      events: prev.events.filter(e => e.id !== eventId)
    }));
  };

  // Save changes
  const saveChanges = async () => {
    setIsUpdating(true);
    try {
      await onUpdate(match._id, {
        score: matchData.score,
        liveData: matchData.liveData,
        status: matchData.status,
        events: matchData.events
      });
      onClose();
    } catch (error) {
      console.error('Failed to update match:', error);
      alert('Failed to update match');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen || !match) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Play className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-white">Live Match Manager</h3>
                <p className="text-slate-400 text-sm">
                  {match.homeTeam?.name} vs {match.awayTeam?.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                matchData.status === 'live' ? 'bg-red-500 text-white' :
                matchData.status === 'halftime' ? 'bg-orange-500 text-white' :
                matchData.status === 'finished' ? 'bg-green-500 text-white' :
                'bg-blue-500 text-white'
              }`}>
                {matchData.status.toUpperCase()}
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Score Board */}
          <div className="bg-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="text-center flex-1">
                <div className="text-white font-bold text-xl mb-2">{match.homeTeam?.name}</div>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => updateScore('home', -1)}
                    className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="text-4xl font-bold text-white min-w-[60px]">
                    {matchData.score.home}
                  </div>
                  <button
                    onClick={() => updateScore('home', 1)}
                    className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-center px-6">
                <div className="text-2xl font-bold text-slate-400">-</div>
                <div className="text-sm text-slate-400 mt-2">VS</div>
              </div>

              <div className="text-center flex-1">
                <div className="text-white font-bold text-xl mb-2">{match.awayTeam?.name}</div>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => updateScore('away', -1)}
                    className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="text-4xl font-bold text-white min-w-[60px]">
                    {matchData.score.away}
                  </div>
                  <button
                    onClick={() => updateScore('away', 1)}
                    className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Time Controls */}
            <div className="flex items-center justify-center gap-4 pt-6 border-t border-slate-600">
              <button
                onClick={() => updateTime(-1)}
                className="p-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg"
              >
                <Minus className="w-4 h-4" />
              </button>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{matchData.liveData.currentMinute}'</div>
                <div className="text-sm text-slate-400">{matchData.liveData.period.replace('_', ' ')}</div>
              </div>
              
              <button
                onClick={() => updateTime(1)}
                className="p-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Match Controls */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <button
              onClick={startMatch}
              disabled={matchData.status === 'live'}
              className="flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              Start
            </button>
            
            <button
              onClick={togglePause}
              disabled={matchData.status !== 'live'}
              className="flex items-center gap-2 px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {matchData.liveData.isLive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {matchData.liveData.isLive ? 'Pause' : 'Resume'}
            </button>
            
            <button
              onClick={setHalfTime}
              disabled={matchData.status === 'halftime'}
              className="flex items-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Timer className="w-4 h-4" />
              Half Time
            </button>
            
            <button
              onClick={startSecondHalf}
              disabled={matchData.status !== 'halftime'}
              className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              2nd Half
            </button>
            
            <button
              onClick={endMatch}
              className="flex items-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <StopCircle className="w-4 h-4" />
              End Match
            </button>
          </div>

          {/* Events Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-white">Match Events</h4>
              <button
                onClick={() => setShowEventForm(!showEventForm)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Event
              </button>
            </div>

            {/* Event Form */}
            {showEventForm && (
              <div className="bg-slate-700/50 rounded-xl p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Event Type</label>
                    <select
                      value={newEvent.type}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    >
                      {eventTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Minute</label>
                    <input
                      type="number"
                      value={newEvent.minute}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, minute: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                      min="0"
                      max="120"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Team</label>
                    <select
                      value={newEvent.teamId}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, teamId: e.target.value, playerId: '' }))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    >
                      <option value="">Select Team</option>
                      <option value={match.homeTeam?._id}>{match.homeTeam?.name}</option>
                      <option value={match.awayTeam?._id}>{match.awayTeam?.name}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Player</label>
                    <select
                      value={newEvent.playerId}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, playerId: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                      disabled={!newEvent.teamId}
                    >
                      <option value="">Select Player</option>
                      {(newEvent.teamId === match.homeTeam?._id ? homeTeamPlayers : awayTeamPlayers).map(player => (
                        <option key={player._id} value={player._id}>
                          #{player.number} {player.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Description (Optional)</label>
                  <input
                    type="text"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    placeholder="Additional details..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={addEvent}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Add Event
                  </button>
                  <button
                    onClick={() => setShowEventForm(false)}
                    className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Events List - FIXED: Added unique key props */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {matchData.events.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No events recorded yet</p>
                </div>
              ) : (
                matchData.events
                  .sort((a, b) => b.minute - a.minute)
                  .map(event => {
                    const eventType = eventTypes.find(t => t.value === event.type);
                    return (
                      <div key={event.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="text-white font-bold">{event.minute}'</div>
                          <div className={`font-medium ${eventType?.color || 'text-white'}`}>
                            {eventType?.label || event.type}
                          </div>
                          <div className="text-slate-300">
                            #{event.player?.number} {event.player?.name} ({event.team?.name})
                          </div>
                          {event.description && (
                            <div className="text-slate-400 text-sm">- {event.description}</div>
                          )}
                        </div>
                        <button
                          onClick={() => removeEvent(event.id)}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-slate-700">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveChanges}
              disabled={isUpdating}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
            >
              {isUpdating ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Updating...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Save className="w-5 h-5" />
                  Save Changes
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMatchManager;