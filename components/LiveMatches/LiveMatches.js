import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Plus, Minus, Clock, Users, Target, Save, Edit, Trash2, Calendar } from 'lucide-react';

const LiveMatches = ({ showNotification, currentSeason, setCurrentView }) => {
  const [matches, setMatches] = useState([]);
  const [liveMatches, setLiveMatches] = useState(new Map());
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showScoreModal, setShowScoreModal] = useState(false);

  useEffect(() => {
    loadMatches();
  }, [currentSeason]);

  const loadMatches = () => {
    try {
      const schedules = JSON.parse(localStorage.getItem(`schedules_${currentSeason.id}`) || '[]');
      const today = new Date();
      const todayMatches = schedules.filter(match => {
        const matchDate = new Date(match.date);
        return matchDate.toDateString() === today.toDateString();
      });
      setMatches(todayMatches);
    } catch (error) {
      console.error('Error loading matches:', error);
      showNotification?.('error', 'Failed to load matches');
    }
  };

  const startLiveMatch = (match) => {
    const liveMatch = {
      id: match.id,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeScore: 0,
      awayScore: 0,
      timeElapsed: 0,
      isRunning: false,
      events: [],
      period: 1 // 1st half, 2nd half
    };
    
    const newLiveMatches = new Map(liveMatches);
    newLiveMatches.set(match.id, liveMatch);
    setLiveMatches(newLiveMatches);
    
    // Update match status
    updateMatchStatus(match.id, 'live');
    showNotification?.('success', `Started live tracking for ${match.homeTeam} vs ${match.awayTeam}`);
  };

  const stopLiveMatch = (matchId) => {
    const newLiveMatches = new Map(liveMatches);
    newLiveMatches.delete(matchId);
    setLiveMatches(newLiveMatches);
    
    updateMatchStatus(matchId, 'completed');
    showNotification?.('success', 'Match completed successfully');
  };

  const updateMatchStatus = (matchId, status) => {
    const schedules = JSON.parse(localStorage.getItem(`schedules_${currentSeason.id}`) || '[]');
    const updatedSchedules = schedules.map(match => 
      match.id === matchId ? { ...match, status } : match
    );
    localStorage.setItem(`schedules_${currentSeason.id}`, JSON.stringify(updatedSchedules));
    loadMatches();
  };

  const updateScore = (matchId, team, action) => {
    const newLiveMatches = new Map(liveMatches);
    const match = newLiveMatches.get(matchId);
    
    if (match) {
      if (team === 'home') {
        match.homeScore = Math.max(0, match.homeScore + action);
      } else {
        match.awayScore = Math.max(0, match.awayScore + action);
      }
      
      // Add event
      if (action > 0) {
        match.events.push({
          type: 'goal',
          team,
          time: match.timeElapsed,
          timestamp: new Date().toISOString()
        });
      }
      
      newLiveMatches.set(matchId, match);
      setLiveMatches(newLiveMatches);
    }
  };

  const toggleTimer = (matchId) => {
    const newLiveMatches = new Map(liveMatches);
    const match = newLiveMatches.get(matchId);
    
    if (match) {
      match.isRunning = !match.isRunning;
      newLiveMatches.set(matchId, match);
      setLiveMatches(newLiveMatches);
    }
  };

  const saveMatchResult = (matchId) => {
    const liveMatch = liveMatches.get(matchId);
    if (!liveMatch) return;

    // Save final score to schedules
    const schedules = JSON.parse(localStorage.getItem(`schedules_${currentSeason.id}`) || '[]');
    const updatedSchedules = schedules.map(match => 
      match.id === matchId 
        ? { 
            ...match, 
            homeScore: liveMatch.homeScore,
            awayScore: liveMatch.awayScore,
            status: 'completed',
            events: liveMatch.events
          }
        : match
    );
    localStorage.setItem(`schedules_${currentSeason.id}`, JSON.stringify(updatedSchedules));

    // Update team stats
    updateTeamStats(liveMatch);
    
    stopLiveMatch(matchId);
    showNotification?.('success', 'Match result saved successfully');
  };

  const updateTeamStats = (liveMatch) => {
    try {
      const teams = JSON.parse(localStorage.getItem(`teams_${currentSeason.id}`) || '[]');
      const homeTeam = teams.find(t => t.name === liveMatch.homeTeam);
      const awayTeam = teams.find(t => t.name === liveMatch.awayTeam);

      if (homeTeam && awayTeam) {
        // Determine winner
        if (liveMatch.homeScore > liveMatch.awayScore) {
          homeTeam.wins = (homeTeam.wins || 0) + 1;
          homeTeam.points = (homeTeam.points || 0) + 3;
          awayTeam.losses = (awayTeam.losses || 0) + 1;
        } else if (liveMatch.awayScore > liveMatch.homeScore) {
          awayTeam.wins = (awayTeam.wins || 0) + 1;
          awayTeam.points = (awayTeam.points || 0) + 3;
          homeTeam.losses = (homeTeam.losses || 0) + 1;
        } else {
          homeTeam.draws = (homeTeam.draws || 0) + 1;
          homeTeam.points = (homeTeam.points || 0) + 1;
          awayTeam.draws = (awayTeam.draws || 0) + 1;
          awayTeam.points = (awayTeam.points || 0) + 1;
        }

        const updatedTeams = teams.map(t => {
          if (t.name === homeTeam.name) return homeTeam;
          if (t.name === awayTeam.name) return awayTeam;
          return t;
        });

        localStorage.setItem(`teams_${currentSeason.id}`, JSON.stringify(updatedTeams));
      }
    } catch (error) {
      console.error('Error updating team stats:', error);
    }
  };

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      const newLiveMatches = new Map(liveMatches);
      let updated = false;
      
      for (const [matchId, match] of newLiveMatches.entries()) {
        if (match.isRunning) {
          match.timeElapsed += 1;
          updated = true;
        }
      }
      
      if (updated) {
        setLiveMatches(newLiveMatches);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [liveMatches]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Live Matches</h2>
            <p className="text-gray-600">Season {currentSeason.name} - Today's Matches</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentView('schedules')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              View All Matches
            </button>
          </div>
        </div>
      </div>

      {/* Live Matches Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {matches.length > 0 ? (
          matches.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              liveMatch={liveMatches.get(match.id)}
              onStartLive={() => startLiveMatch(match)}
              onStopLive={() => stopLiveMatch(match.id)}
              onUpdateScore={updateScore}
              onToggleTimer={toggleTimer}
              onSaveResult={() => saveMatchResult(match.id)}
              formatTime={formatTime}
            />
          ))
        ) : (
          <div className="col-span-2 bg-white rounded-xl shadow-sm p-12 text-center">
            <Calendar className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No matches today</h3>
            <p className="text-gray-600 mb-4">There are no scheduled matches for today.</p>
            <button
              onClick={() => setCurrentView('schedules')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Schedule
            </button>
          </div>
        )}
      </div>

      {/* Active Live Matches Summary */}
      {liveMatches.size > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-4">
            Active Live Matches ({liveMatches.size})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from(liveMatches.values()).map(match => (
              <div key={match.id} className="bg-white p-4 rounded-lg border border-green-200">
                <div className="text-center">
                  <p className="font-medium text-gray-900">
                    {match.homeTeam} vs {match.awayTeam}
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {match.homeScore} - {match.awayScore}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatTime(match.timeElapsed)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MatchCard = ({
  match,
  liveMatch,
  onStartLive,
  onStopLive,
  onUpdateScore,
  onToggleTimer,
  onSaveResult,
  formatTime
}) => {
  const isLive = !!liveMatch;
  const matchDate = new Date(match.date);

  return (
    <div className={`bg-white rounded-xl shadow-sm border-2 transition-all ${
      isLive ? 'border-green-500 shadow-lg' : 'border-gray-200'
    }`}>
      {/* Match Header */}
      <div className={`p-4 border-b ${isLive ? 'bg-green-50' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isLive && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">LIVE</span>
              </div>
            )}
            <span className="text-sm text-gray-600">
              {matchDate.toLocaleTimeString()} • {match.venue}
            </span>
          </div>
          <div className="flex space-x-2">
            {!isLive ? (
              <button
                onClick={onStartLive}
                className="flex items-center space-x-1 bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700 transition-colors"
              >
                <Play size={14} />
                <span>Start Live</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={() => onToggleTimer(match.id)}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                    liveMatch?.isRunning
                      ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {liveMatch?.isRunning ? <Pause size={14} /> : <Play size={14} />}
                  <span>{liveMatch?.isRunning ? 'Pause' : 'Start'}</span>
                </button>
                <button
                  onClick={onSaveResult}
                  className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  <Save size={14} />
                  <span>Save</span>
                </button>
                <button
                  onClick={onStopLive}
                  className="flex items-center space-x-1 bg-red-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700 transition-colors"
                >
                  <Square size={14} />
                  <span>End</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Match Content */}
      <div className="p-6">
        {!isLive ? (
          // Scheduled Match View
          <div className="text-center">
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                    <Users size={24} className="text-gray-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{match.homeTeam}</h3>
                  <p className="text-sm text-gray-600">Home</p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-400">VS</div>
                  <p className="text-sm text-gray-600 mt-1">
                    {matchDate.toLocaleDateString()}
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                    <Users size={24} className="text-gray-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{match.awayTeam}</h3>
                  <p className="text-sm text-gray-600">Away</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Live Match View
          <div className="space-y-6">
            {/* Timer */}
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-lg">
                <Clock size={16} className="text-gray-600" />
                <span className="font-mono text-lg font-bold">
                  {formatTime(liveMatch.timeElapsed)}
                </span>
              </div>
            </div>

            {/* Score */}
            <div className="flex items-center justify-center space-x-8">
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-2">{match.homeTeam}</h3>
                <div className="text-4xl font-bold text-blue-600 mb-3">
                  {liveMatch.homeScore}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onUpdateScore(match.id, 'home', 1)}
                    className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    onClick={() => onUpdateScore(match.id, 'home', -1)}
                    className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-gray-400">-</div>
              </div>

              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-2">{match.awayTeam}</h3>
                <div className="text-4xl font-bold text-blue-600 mb-3">
                  {liveMatch.awayScore}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onUpdateScore(match.id, 'away', 1)}
                    className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    onClick={() => onUpdateScore(match.id, 'away', -1)}
                    className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Match Events */}
            {liveMatch.events.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Match Events</h4>
                <div className="space-y-2 max-h-24 overflow-y-auto">
                  {liveMatch.events.slice(-3).reverse().map((event, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <Target size={14} className="text-green-600" />
                      <span className="font-mono text-gray-600">
                        {formatTime(event.time)}
                      </span>
                      <span className="text-gray-900">
                        Goal - {event.team === 'home' ? match.homeTeam : match.awayTeam}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveMatches;