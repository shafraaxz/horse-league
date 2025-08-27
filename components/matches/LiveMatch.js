// components/matches/LiveMatch.js - Connected to real database data
import React, { useState, useEffect } from 'react';
import { Play, Pause, StopCircle, Target, AlertCircle, Users, RefreshCw, Clock, Calendar, ArrowLeft, User, BarChart3 } from 'lucide-react';

const LiveMatch = ({ match, onUpdate, onEnd, onBack }) => {
  const [liveData, setLiveData] = useState({
    currentMinute: match.currentMinute || 0,
    homeScore: match.homeScore || 0,
    awayScore: match.awayScore || 0,
    isLive: match.isLive || false,
    events: match.events || [],
    status: match.status
  });

  const [isRunning, setIsRunning] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Team players state
  const [teamPlayers, setTeamPlayers] = useState({
    home: [],
    away: []
  });
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [playersError, setPlayersError] = useState('');
  
  const [eventForm, setEventForm] = useState({
    type: 'goal',
    minute: liveData.currentMinute,
    team: '',
    player: '',
    playerId: '',
    assistPlayer: '',
    assistPlayerId: '',
    description: ''
  });

  // Match statistics state
  const [matchStats, setMatchStats] = useState({
    homeTeam: {
      possession: 50,
      shots: 0,
      shotsOnTarget: 0,
      corners: 0,
      fouls: 0,
      yellowCards: 0,
      redCards: 0,
      playerStats: {}
    },
    awayTeam: {
      possession: 50,
      shots: 0,
      shotsOnTarget: 0,
      corners: 0,
      fouls: 0,
      yellowCards: 0,
      redCards: 0,
      playerStats: {}
    }
  });

  // Load team players on component mount
  useEffect(() => {
    if (match?.homeTeam?._id && match?.awayTeam?._id) {
      loadTeamPlayers();
    }
  }, [match]);

  // Update local state when match prop changes
  useEffect(() => {
    setLiveData({
      currentMinute: match.currentMinute || 0,
      homeScore: match.homeScore || 0,
      awayScore: match.awayScore || 0,
      isLive: match.isLive || false,
      events: match.events || [],
      status: match.status
    });
  }, [match]);

  // Auto-start timer if match is already live
  useEffect(() => {
    if (liveData.isLive && liveData.status === 'live') {
      setIsRunning(true);
    }
  }, [liveData.isLive, liveData.status]);

  // Timer effect for live match progression
  useEffect(() => {
    let interval;
    if (isRunning && liveData.currentMinute < 90 && liveData.isLive) {
      interval = setInterval(() => {
        setLiveData(prev => {
          const newMinute = Math.min(prev.currentMinute + 1, 90);
          updateMatchMinute(newMinute);
          return {
            ...prev,
            currentMinute: newMinute
          };
        });
      }, 60000); // 60 seconds = 1 match minute (real-time)
    }
    return () => clearInterval(interval);
  }, [isRunning, liveData.currentMinute, liveData.isLive]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  const showSuccess = (message) => {
    console.log('✅ Success:', message);
  };

  // Load players for both teams from database
  const loadTeamPlayers = async () => {
    setLoadingPlayers(true);
    setPlayersError('');
    
    try {
      console.log('👥 Loading team players from database...');
      console.log('🏠 Home team ID:', match.homeTeam._id);
      console.log('🏃 Away team ID:', match.awayTeam._id);
      
      // Try multiple API endpoint patterns to find players
      const apiEndpoints = [
        // Most common patterns for team players API
        `/api/teams/${match.homeTeam._id}/players`,
        `/api/players?team=${match.homeTeam._id}`,
        `/api/teams/${match.homeTeam._id}/squad`,
        `/api/leagues/${match.league}/teams/${match.homeTeam._id}/players`
      ];

      let homePlayers = [];
      let awayPlayers = [];
      let homeEndpointUsed = '';
      let awayEndpointUsed = '';

      // Load home team players
      for (const endpoint of apiEndpoints) {
        try {
          console.log(`🔄 Trying endpoint: ${endpoint}`);
          const response = await fetch(endpoint, { 
            headers: getAuthHeaders(),
            method: 'GET'
          });
          
          console.log(`📡 Response status: ${response.status}`);
          
          if (response.ok) {
            const data = await response.json();
            console.log('📦 Response data structure:', Object.keys(data));
            
            // Handle different response structures
            if (data.success && data.data) {
              homePlayers = Array.isArray(data.data) ? data.data : [];
            } else if (data.players) {
              homePlayers = Array.isArray(data.players) ? data.players : [];
            } else if (Array.isArray(data)) {
              homePlayers = data;
            } else if (data.data && data.data.players) {
              homePlayers = Array.isArray(data.data.players) ? data.data.players : [];
            }
            
            if (homePlayers.length > 0) {
              console.log(`✅ Home team players loaded: ${homePlayers.length} from ${endpoint}`);
              homeEndpointUsed = endpoint;
              break;
            }
          }
        } catch (error) {
          console.log(`❌ Failed endpoint ${endpoint}:`, error.message);
        }
      }

      // Load away team players using the same successful pattern
      if (homeEndpointUsed) {
        const awayEndpoint = homeEndpointUsed.replace(match.homeTeam._id, match.awayTeam._id);
        try {
          console.log(`🔄 Loading away team from: ${awayEndpoint}`);
          const response = await fetch(awayEndpoint, { 
            headers: getAuthHeaders(),
            method: 'GET'
          });
          
          if (response.ok) {
            const data = await response.json();
            
            // Handle different response structures
            if (data.success && data.data) {
              awayPlayers = Array.isArray(data.data) ? data.data : [];
            } else if (data.players) {
              awayPlayers = Array.isArray(data.players) ? data.players : [];
            } else if (Array.isArray(data)) {
              awayPlayers = data;
            } else if (data.data && data.data.players) {
              awayPlayers = Array.isArray(data.data.players) ? data.data.players : [];
            }
            
            if (awayPlayers.length > 0) {
              console.log(`✅ Away team players loaded: ${awayPlayers.length} from ${awayEndpoint}`);
              awayEndpointUsed = awayEndpoint;
            }
          }
        } catch (error) {
          console.log(`❌ Failed to load away team players:`, error.message);
        }
      } else {
        // Try away team with all endpoints if home team failed
        for (const endpoint of apiEndpoints) {
          const awayEndpoint = endpoint.replace(match.homeTeam._id, match.awayTeam._id);
          try {
            console.log(`🔄 Trying away team endpoint: ${awayEndpoint}`);
            const response = await fetch(awayEndpoint, { 
              headers: getAuthHeaders(),
              method: 'GET'
            });
            
            if (response.ok) {
              const data = await response.json();
              
              if (data.success && data.data) {
                awayPlayers = Array.isArray(data.data) ? data.data : [];
              } else if (data.players) {
                awayPlayers = Array.isArray(data.players) ? data.players : [];
              } else if (Array.isArray(data)) {
                awayPlayers = data;
              }
              
              if (awayPlayers.length > 0) {
                console.log(`✅ Away team players loaded: ${awayPlayers.length} from ${awayEndpoint}`);
                awayEndpointUsed = awayEndpoint;
                break;
              }
            }
          } catch (error) {
            console.log(`❌ Failed away team endpoint ${awayEndpoint}:`, error.message);
          }
        }
      }

      // Validate player data structure
      const validatePlayer = (player) => {
        return player && 
               typeof player === 'object' && 
               player._id && 
               player.name && 
               typeof player.name === 'string';
      };

      // Filter and validate players
      homePlayers = homePlayers.filter(validatePlayer);
      awayPlayers = awayPlayers.filter(validatePlayer);

      console.log('🏠 Final home players:', homePlayers.length);
      console.log('🏃 Final away players:', awayPlayers.length);

      if (homePlayers.length === 0 && awayPlayers.length === 0) {
        setPlayersError('No players found for either team. Please ensure teams have registered players.');
        showError('No players found. Please check team rosters.');
      } else if (homePlayers.length === 0) {
        setPlayersError(`No players found for ${match.homeTeam.name}. Please check the team roster.`);
        showError(`No players found for ${match.homeTeam.name}`);
      } else if (awayPlayers.length === 0) {
        setPlayersError(`No players found for ${match.awayTeam.name}. Please check the team roster.`);
        showError(`No players found for ${match.awayTeam.name}`);
      }

      setTeamPlayers({
        home: homePlayers,
        away: awayPlayers
      });

      // Initialize player stats for existing players
      if (homePlayers.length > 0 || awayPlayers.length > 0) {
        const newStats = { ...matchStats };
        
        homePlayers.forEach(player => {
          newStats.homeTeam.playerStats[player._id] = {
            goals: 0,
            assists: 0,
            yellowCards: 0,
            redCards: 0,
            shots: 0,
            shotsOnTarget: 0,
            minutesPlayed: liveData.isLive ? liveData.currentMinute : 0
          };
        });

        awayPlayers.forEach(player => {
          newStats.awayTeam.playerStats[player._id] = {
            goals: 0,
            assists: 0,
            yellowCards: 0,
            redCards: 0,
            shots: 0,
            shotsOnTarget: 0,
            minutesPlayed: liveData.isLive ? liveData.currentMinute : 0
          };
        });

        setMatchStats(newStats);
        showSuccess(`Players loaded: ${homePlayers.length + awayPlayers.length} total`);
      }

    } catch (error) {
      console.error('💥 Error loading team players:', error);
      const errorMessage = 'Failed to load team players. Check console for details.';
      setPlayersError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoadingPlayers(false);
    }
  };

  const updateMatchMinute = async (minute) => {
    try {
      const response = await fetch(`/api/matches/${match._id}/live`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          action: 'updateMinute',
          data: { minute }
        })
      });

      if (!response.ok) {
        console.error('Failed to update match minute');
      }
    } catch (error) {
      console.error('Error updating match minute:', error);
    }
  };

  const updatePlayerStats = (playerId, statType, isHomeTeam = true) => {
    setMatchStats(prev => {
      const teamKey = isHomeTeam ? 'homeTeam' : 'awayTeam';
      const newStats = { ...prev };
      
      if (!newStats[teamKey].playerStats[playerId]) {
        newStats[teamKey].playerStats[playerId] = {
          goals: 0, assists: 0, yellowCards: 0, redCards: 0, shots: 0, shotsOnTarget: 0, minutesPlayed: 0
        };
      }
      
      newStats[teamKey].playerStats[playerId][statType]++;
      
      // Update team stats
      if (['yellowCards', 'redCards', 'shots', 'shotsOnTarget'].includes(statType)) {
        newStats[teamKey][statType]++;
      }
      
      return newStats;
    });
  };

  const handleStartMatch = async () => {
    if (!match._id) {
      showError('Invalid match ID');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/matches/${match._id}/live`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          action: 'start'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setLiveData(prev => ({ 
          ...prev, 
          status: 'live', 
          isLive: true,
          currentMinute: 0
        }));
        setIsRunning(true);
        showSuccess('Match started successfully!');
        if (onUpdate) onUpdate(data.data);
      } else {
        showError(data.message || 'Failed to start match');
      }
    } catch (error) {
      console.error('Error starting match:', error);
      showError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handlePauseResume = () => {
    setIsRunning(!isRunning);
    showSuccess(isRunning ? 'Match paused' : 'Match resumed');
  };

  const handleEndMatch = async () => {
    if (!confirm('Are you sure you want to end this match? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/matches/${match._id}/live`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          action: 'end',
          data: {
            statistics: matchStats // Send final match statistics
          }
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setLiveData(prev => ({ 
          ...prev, 
          status: 'completed', 
          isLive: false 
        }));
        setIsRunning(false);
        showSuccess('Match ended successfully!');
        if (onEnd) onEnd(data.data);
      } else {
        showError(data.message || 'Failed to end match');
      }
    } catch (error) {
      console.error('Error ending match:', error);
      showError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    
    if (!eventForm.team || !eventForm.minute || !eventForm.playerId) {
      showError('Please select team, player, and enter minute');
      return;
    }

    console.log('🎯 Adding event:', {
      matchId: match._id,
      eventData: {
        ...eventForm,
        minute: parseInt(eventForm.minute)
      }
    });

    setLoading(true);
    try {
      const action = eventForm.type === 'goal' || eventForm.type === 'penalty' ? 'goal' : 'event';
      
      const response = await fetch(`/api/matches/${match._id}/live`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          action: action,
          data: {
            type: eventForm.type,
            minute: parseInt(eventForm.minute),
            team: eventForm.team,
            playerId: eventForm.playerId,
            player: eventForm.player,
            assistPlayerId: eventForm.assistPlayerId || null,
            assistPlayer: eventForm.assistPlayer || null,
            description: eventForm.description || ''
          }
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const newEvent = {
          type: eventForm.type,
          minute: parseInt(eventForm.minute),
          team: eventForm.team,
          playerId: eventForm.playerId,
          player: eventForm.player,
          assistPlayerId: eventForm.assistPlayerId,
          assistPlayer: eventForm.assistPlayer,
          description: eventForm.description || '',
          id: Date.now(),
          timestamp: new Date().toISOString()
        };
        
        setLiveData(prev => {
          const updated = { ...prev, events: [...prev.events, newEvent] };
          
          // Update score if it's a goal
          if (eventForm.type === 'goal' || eventForm.type === 'penalty') {
            if (eventForm.team === match.homeTeam._id) {
              updated.homeScore = prev.homeScore + 1;
            } else if (eventForm.team === match.awayTeam._id) {
              updated.awayScore = prev.awayScore + 1;
            }
          }
          
          return updated;
        });

        // Update player statistics
        const isHomeTeam = eventForm.team === match.homeTeam._id;
        
        if (eventForm.type === 'goal' || eventForm.type === 'penalty') {
          updatePlayerStats(eventForm.playerId, 'goals', isHomeTeam);
          if (eventForm.assistPlayerId) {
            updatePlayerStats(eventForm.assistPlayerId, 'assists', isHomeTeam);
          }
        } else if (eventForm.type === 'yellow_card') {
          updatePlayerStats(eventForm.playerId, 'yellowCards', isHomeTeam);
        } else if (eventForm.type === 'red_card') {
          updatePlayerStats(eventForm.playerId, 'redCards', isHomeTeam);
        }
        
        // Reset form
        setEventForm({ 
          type: 'goal', 
          minute: liveData.currentMinute, 
          team: '', 
          player: '',
          playerId: '',
          assistPlayer: '',
          assistPlayerId: '',
          description: '' 
        });
        setShowEventForm(false);
        showSuccess('Event added successfully!');
        
        if (onUpdate) onUpdate(data.data);
      } else {
        console.error('❌ Event API error:', data);
        showError(data.message || 'Failed to add event');
      }
    } catch (error) {
      console.error('💥 Event API network error:', error);
      showError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const getPlayersForTeam = (teamId) => {
    if (teamId === match.homeTeam._id) {
      return teamPlayers.home;
    } else if (teamId === match.awayTeam._id) {
      return teamPlayers.away;
    }
    return [];
  };

  const getPlayerName = (playerId, teamId) => {
    const players = getPlayersForTeam(teamId);
    const player = players.find(p => p._id === playerId);
    if (player) {
      const jerseyNumber = player.jerseyNumber || player.number || 'N/A';
      return `${player.name} (#${jerseyNumber})`;
    }
    return 'Unknown Player';
  };

  const getEventIcon = (type) => {
    const icons = {
      'goal': '⚽',
      'yellow_card': '🟨',
      'red_card': '🟥',
      'substitution': '🔄',
      'penalty': '🎯',
      'own_goal': '⚽',
      'corner': '📐',
      'offside': '🚩'
    };
    return icons[type] || '📝';
  };

  const getEventTypeLabel = (type) => {
    const labels = {
      'goal': 'Goal',
      'yellow_card': 'Yellow Card',
      'red_card': 'Red Card',
      'substitution': 'Substitution',
      'penalty': 'Penalty',
      'own_goal': 'Own Goal',
      'corner': 'Corner',
      'offside': 'Offside'
    };
    return labels[type] || type.replace('_', ' ');
  };

  const getTeamName = (teamId) => {
    if (teamId === match.homeTeam._id || teamId === match.homeTeam) {
      return match.homeTeam.name || 'Home Team';
    }
    if (teamId === match.awayTeam._id || teamId === match.awayTeam) {
      return match.awayTeam.name || 'Away Team';
    }
    return 'Unknown Team';
  };

  if (!match || !match._id) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-700">Invalid match data. Please check the match details.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700 text-sm sm:text-base">{error}</span>
          </div>
        </div>
      )}

      {/* Players Loading Error */}
      {playersError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-yellow-500" />
              <span className="text-yellow-700 text-sm">{playersError}</span>
            </div>
            <button
              onClick={loadTeamPlayers}
              disabled={loadingPlayers}
              className="flex items-center space-x-1 px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${loadingPlayers ? 'animate-spin' : ''}`} />
              <span>Retry</span>
            </button>
          </div>
        </div>
      )}

      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Matches</span>
            </button>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {loadingPlayers && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>Loading players...</span>
            </div>
          )}
          
          <button
            onClick={() => setShowStatsPanel(!showStatsPanel)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Statistics</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Match Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Match Header */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
              <h2 className="text-xl sm:text-2xl font-bold">Live Match Manager</h2>
              <div className="flex items-center space-x-2">
                {liveData.isLive && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-xs sm:text-sm text-red-500 font-medium">LIVE</span>
                  </div>
                )}
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                <span className="text-xl sm:text-2xl font-bold text-gray-900">
                  {liveData.currentMinute}'
                </span>
              </div>
            </div>

            {/* Score Display */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
              <div className="text-center">
                <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2 truncate">
                  {match.homeTeam?.name || 'Home Team'}
                </h3>
                <div className="text-2xl sm:text-4xl font-bold text-blue-600">{liveData.homeScore}</div>
                <div className="text-xs text-gray-500">{teamPlayers.home.length} players</div>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-xl sm:text-2xl text-gray-400">-</span>
              </div>
              <div className="text-center">
                <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2 truncate">
                  {match.awayTeam?.name || 'Away Team'}
                </h3>
                <div className="text-2xl sm:text-4xl font-bold text-red-600">{liveData.awayScore}</div>
                <div className="text-xs text-gray-500">{teamPlayers.away.length} players</div>
              </div>
            </div>

            {/* Match Info */}
            <div className="text-center text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 space-y-1">
              <div>Status: <span className="font-medium capitalize">{liveData.status}</span></div>
              {match.venue && <div>Venue: {match.venue}</div>}
              {match.referee && <div>Referee: {match.referee}</div>}
            </div>

            {/* Control Buttons */}
            <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
              {liveData.status !== 'live' ? (
                <button
                  onClick={handleStartMatch}
                  disabled={loading}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  <Play className="h-4 w-4" />
                  <span>{loading ? 'Starting...' : 'Start Match'}</span>
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={handlePauseResume}
                    className="px-3 sm:px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center justify-center space-x-2 text-sm sm:text-base"
                  >
                    {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    <span>{isRunning ? 'Pause' : 'Resume'}</span>
                  </button>
                  <button
                    onClick={() => setShowEventForm(true)}
                    disabled={teamPlayers.home.length === 0 && teamPlayers.away.length === 0}
                    className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base"
                  >
                    <Target className="h-4 w-4" />
                    <span>Add Event</span>
                  </button>
                  <button
                    onClick={handleEndMatch}
                    disabled={loading}
                    className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center space-x-2 text-sm sm:text-base"
                  >
                    <StopCircle className="h-4 w-4" />
                    <span>{loading ? 'Ending...' : 'End Match'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Events Timeline */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-4">Match Events</h3>
            {liveData.events.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {liveData.events
                  .sort((a, b) => b.minute - a.minute)
                  .map((event, index) => (
                    <div key={event.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                        <span className="text-lg sm:text-2xl flex-shrink-0">{getEventIcon(event.type)}</span>
                        <div className="min-w-0 flex-1">
                          <span className="font-medium text-sm sm:text-base">
                            {getEventTypeLabel(event.type)}
                          </span>
                          <div className="text-xs sm:text-sm text-gray-600">
                            <span className="font-medium">{getTeamName(event.team)}</span>
                            {event.playerId && <span> - {getPlayerName(event.playerId, event.team)}</span>}
                            {event.assistPlayerId && <span> (Assist: {getPlayerName(event.assistPlayerId, event.team)})</span>}
                            {event.description && <div className="text-xs truncate">{event.description}</div>}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs sm:text-sm font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded flex-shrink-0">
                        {event.minute}'
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-8 sm:h-12 w-8 sm:w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm sm:text-base">No events recorded yet</p>
                {liveData.isLive && (
                  <p className="text-xs sm:text-sm text-gray-400">Events will appear here as the match progresses</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Statistics Panel */}
        {showStatsPanel && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4 sm:p-6 sticky top-4">
              <h3 className="text-lg font-semibold mb-4">Live Statistics</h3>
              
              {/* Team Stats */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{matchStats.homeTeam.shots}</div>
                    <div className="text-xs text-gray-600">Shots</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{matchStats.awayTeam.shots}</div>
                    <div className="text-xs text-gray-600">Shots</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{matchStats.homeTeam.corners}</div>
                    <div className="text-xs text-gray-600">Corners</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{matchStats.awayTeam.corners}</div>
                    <div className="text-xs text-gray-600">Corners</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{matchStats.homeTeam.yellowCards}/{matchStats.homeTeam.redCards}</div>
                    <div className="text-xs text-gray-600">Cards</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{matchStats.awayTeam.yellowCards}/{matchStats.awayTeam.redCards}</div>
                    <div className="text-xs text-gray-600">Cards</div>
                  </div>
                </div>
              </div>

              {/* Top Scorers */}
              <div className="mt-6">
                <h4 className="font-medium mb-2">Top Scorers</h4>
                <div className="space-y-2 text-sm">
                  {Object.entries(matchStats.homeTeam.playerStats)
                    .filter(([_, stats]) => stats.goals > 0)
                    .sort(([_, a], [__, b]) => b.goals - a.goals)
                    .slice(0, 3)
                    .map(([playerId, stats]) => (
                      <div key={playerId} className="flex justify-between">
                        <span>{getPlayerName(playerId, match.homeTeam._id)}</span>
                        <span>{stats.goals}⚽</span>
                      </div>
                    ))}
                  {Object.entries(matchStats.awayTeam.playerStats)
                    .filter(([_, stats]) => stats.goals > 0)
                    .sort(([_, a], [__, b]) => b.goals - a.goals)
                    .slice(0, 3)
                    .map(([playerId, stats]) => (
                      <div key={playerId} className="flex justify-between">
                        <span>{getPlayerName(playerId, match.awayTeam._id)}</span>
                        <span>{stats.goals}⚽</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Player Count Info */}
              <div className="mt-6 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  <div>Players Available:</div>
                  <div className="mt-1">
                    <span className="text-blue-600 font-medium">{match.homeTeam.name}: {teamPlayers.home.length}</span>
                  </div>
                  <div>
                    <span className="text-red-600 font-medium">{match.awayTeam.name}: {teamPlayers.away.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      {showEventForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add Match Event</h3>
            {(teamPlayers.home.length === 0 && teamPlayers.away.length === 0) ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No players available. Please ensure both teams have registered players.</p>
                <button
                  onClick={() => setShowEventForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Type *
                  </label>
                  <select
                    value={eventForm.type}
                    onChange={(e) => setEventForm(prev => ({ ...prev, type: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="goal">Goal</option>
                    <option value="yellow_card">Yellow Card</option>
                    <option value="red_card">Red Card</option>
                    <option value="substitution">Substitution</option>
                    <option value="penalty">Penalty</option>
                    <option value="own_goal">Own Goal</option>
                    <option value="corner">Corner</option>
                    <option value="offside">Offside</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team *
                  </label>
                  <select
                    value={eventForm.team}
                    onChange={(e) => {
                      setEventForm(prev => ({ 
                        ...prev, 
                        team: e.target.value,
                        playerId: '',
                        player: '',
                        assistPlayerId: '',
                        assistPlayer: ''
                      }));
                    }}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Team</option>
                    {teamPlayers.home.length > 0 && (
                      <option value={match.homeTeam._id}>{match.homeTeam.name} ({teamPlayers.home.length} players)</option>
                    )}
                    {teamPlayers.away.length > 0 && (
                      <option value={match.awayTeam._id}>{match.awayTeam.name} ({teamPlayers.away.length} players)</option>
                    )}
                  </select>
                </div>

                {eventForm.team && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Player *
                    </label>
                    <select
                      value={eventForm.playerId}
                      onChange={(e) => {
                        const selectedPlayer = getPlayersForTeam(eventForm.team).find(p => p._id === e.target.value);
                        setEventForm(prev => ({ 
                          ...prev, 
                          playerId: e.target.value,
                          player: selectedPlayer ? selectedPlayer.name : ''
                        }));
                      }}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Player</option>
                      {getPlayersForTeam(eventForm.team).map(player => {
                        const jerseyNumber = player.jerseyNumber || player.number || 'N/A';
                        const position = player.position || '';
                        return (
                          <option key={player._id} value={player._id}>
                            {player.name} (#{jerseyNumber}) {position && `- ${position}`}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {(eventForm.type === 'goal' || eventForm.type === 'penalty') && eventForm.team && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assist (Optional)
                    </label>
                    <select
                      value={eventForm.assistPlayerId}
                      onChange={(e) => {
                        const selectedPlayer = getPlayersForTeam(eventForm.team).find(p => p._id === e.target.value);
                        setEventForm(prev => ({ 
                          ...prev, 
                          assistPlayerId: e.target.value,
                          assistPlayer: selectedPlayer ? selectedPlayer.name : ''
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No Assist</option>
                      {getPlayersForTeam(eventForm.team)
                        .filter(player => player._id !== eventForm.playerId)
                        .map(player => {
                          const jerseyNumber = player.jerseyNumber || player.number || 'N/A';
                          return (
                            <option key={player._id} value={player._id}>
                              {player.name} (#{jerseyNumber})
                            </option>
                          );
                        })}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minute *
                  </label>
                  <input
                    type="number"
                    value={eventForm.minute}
                    onChange={(e) => setEventForm(prev => ({ ...prev, minute: e.target.value }))}
                    min="0"
                    max="120"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Additional details..."
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEventForm(false)}
                    className="w-full sm:w-auto px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={loading || loadingPlayers}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add Event'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveMatch;