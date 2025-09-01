// ===========================================
// FILE: pages/matches/live.js (ENHANCED WITH PLAYER STATS)
// ===========================================
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Play, Pause, RotateCcw, Plus, Users, Target, Clock, User } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

export default function LiveMatch() {
  const { data: session } = useSession();
  const router = useRouter();
  const { matchId } = router.query;

  const [match, setMatch] = useState(null);
  const [homePlayers, setHomePlayers] = useState([]);
  const [awayPlayers, setAwayPlayers] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const [currentMinute, setCurrentMinute] = useState(0);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventType, setEventType] = useState('');
  const [eventTeam, setEventTeam] = useState('');

  // Auto-increment timer when live
  useEffect(() => {
    let interval;
    if (isLive) {
      interval = setInterval(() => {
        setCurrentMinute(prev => prev + 1);
      }, 60000); // 1 minute intervals
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLive]);

  // Fetch match data and players
  useEffect(() => {
    if (matchId) {
      fetchMatch();
      fetchPlayers();
    }
  }, [matchId]);

  const fetchMatch = async () => {
    try {
      setIsLoading(true);
      
      let response;
      try {
        response = await fetch(`/api/matches/${matchId}`);
      } catch (error) {
        response = await fetch(`/api/get-match?id=${matchId}`);
      }
      
      if (!response.ok) {
        throw new Error('Match not found');
      }
      
      const matchData = await response.json();
      setMatch(matchData);
      setIsLive(matchData.status === 'live');
      setHomeScore(matchData.homeScore || 0);
      setAwayScore(matchData.awayScore || 0);
      setCurrentMinute(matchData.liveData?.currentMinute || 0);
      setEvents(matchData.liveData?.events || []);
      
    } catch (error) {
      console.error('Error fetching match:', error);
      toast.error('Failed to load match');
      setTimeout(() => router.push('/admin/matches'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlayers = async () => {
    if (!match) return;
    
    try {
      // Fetch home team players
      const homeResponse = await fetch(`/api/admin/players?teamId=${match.homeTeam._id}&status=active`);
      if (homeResponse.ok) {
        const homeData = await homeResponse.json();
        setHomePlayers(Array.isArray(homeData) ? homeData : []);
      }

      // Fetch away team players
      const awayResponse = await fetch(`/api/admin/players?teamId=${match.awayTeam._id}&status=active`);
      if (awayResponse.ok) {
        const awayData = await awayResponse.json();
        setAwayPlayers(Array.isArray(awayData) ? awayData : []);
      }
    } catch (error) {
      console.error('Error fetching players:', error);
      toast.error('Failed to load team players');
    }
  };

  // Re-fetch players when match is loaded
  useEffect(() => {
    if (match) {
      fetchPlayers();
    }
  }, [match]);

  const startMatch = async () => {
    try {
      const response = await fetch('/api/matches/live/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: match._id }),
      });

      if (response.ok) {
        setIsLive(true);
        setCurrentMinute(0);
        toast.success('Match started!');
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to start match');
      }
    } catch (error) {
      toast.error('Failed to start match');
    }
  };

  const pauseMatch = async () => {
    try {
      const response = await fetch('/api/matches/live/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: match._id }),
      });

      if (response.ok) {
        setIsLive(false);
        toast.success('Match paused');
      }
    } catch (error) {
      toast.error('Failed to pause match');
    }
  };

  const endMatch = async () => {
    if (!confirm('Are you sure you want to end this match?')) return;

    try {
      const response = await fetch('/api/matches/live/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          matchId: match._id,
          homeScore,
          awayScore,
          events
        }),
      });

      if (response.ok) {
        setIsLive(false);
        toast.success('Match ended!');
        
        // Update player statistics
        await updatePlayerStats();
        
        router.push('/admin/matches');
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to end match');
      }
    } catch (error) {
      toast.error('Failed to end match');
    }
  };

  const updatePlayerStats = async () => {
    try {
      await fetch('/api/matches/live/update-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match._id,
          events,
          homeScore,
          awayScore
        }),
      });
    } catch (error) {
      console.error('Error updating player stats:', error);
    }
  };

  const openEventModal = (type, team) => {
    setEventType(type);
    setEventTeam(team);
    setShowEventModal(true);
  };

  const addEventWithPlayer = (playerId, playerName) => {
    const newEvent = {
      id: Date.now(),
      type: eventType,
      team: eventTeam,
      minute: currentMinute,
      player: playerId,
      playerName: playerName,
      description: `${eventType.replace('_', ' ').toUpperCase()} - ${playerName}`
    };

    setEvents(prev => [...prev, newEvent]);

    if (eventType === 'goal') {
      if (eventTeam === 'home') {
        setHomeScore(prev => prev + 1);
      } else {
        setAwayScore(prev => prev + 1);
      }
    }

    toast.success(`${eventType.replace('_', ' ').toUpperCase()} added for ${playerName}`);
    setShowEventModal(false);
  };

  const removeLastEvent = () => {
    if (events.length === 0) return;

    const lastEvent = events[events.length - 1];
    
    if (lastEvent.type === 'goal') {
      if (lastEvent.team === 'home') {
        setHomeScore(prev => Math.max(0, prev - 1));
      } else {
        setAwayScore(prev => Math.max(0, prev - 1));
      }
    }

    setEvents(prev => prev.slice(0, -1));
    toast.success('Last event removed');
  };

  // Auto-save match data
  useEffect(() => {
    if (match && isLive) {
      const interval = setInterval(async () => {
        try {
          await fetch('/api/matches/live/update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              matchId: match._id,
              status: 'live',
              homeScore,
              awayScore,
              liveData: {
                currentMinute,
                events,
                isLive
              }
            }),
          });
        } catch (error) {
          console.error('Auto-save error:', error);
        }
      }, 30000); // Save every 30 seconds

      return () => clearInterval(interval);
    }
  }, [match, isLive, currentMinute, homeScore, awayScore, events]);

  if (!session || session.user.role !== 'admin') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only administrators can manage live matches.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading match...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Match Selected</h2>
          <button
            onClick={() => router.push('/admin/matches')}
            className="btn btn-primary mt-4"
          >
            Back to Matches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Live Match Manager</h1>
        <button
          onClick={() => router.push('/admin/matches')}
          className="btn btn-secondary"
        >
          Back to Matches
        </button>
      </div>

      {/* Match Info */}
      <div className="card">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            {isLive && <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>}
            <span className={`text-lg font-semibold ${isLive ? 'text-red-600' : 'text-gray-600'}`}>
              {isLive ? 'LIVE' : match.status.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-3 items-center gap-8 mb-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900">{match.homeTeam.name}</h3>
              <div className="text-4xl font-bold text-blue-600 mt-2">{homeScore}</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-mono font-bold text-gray-900">{currentMinute}'</div>
              <div className="text-sm text-gray-500 mt-1">
                {new Date(match.matchDate).toLocaleDateString()}
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900">{match.awayTeam.name}</h3>
              <div className="text-4xl font-bold text-red-600 mt-2">{awayScore}</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center space-x-4">
            {!isLive && match.status === 'scheduled' && (
              <button onClick={startMatch} className="btn btn-primary flex items-center">
                <Play className="w-5 h-5 mr-2" />
                Start Match
              </button>
            )}
            
            {isLive && (
              <>
                <button onClick={pauseMatch} className="btn btn-secondary flex items-center">
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </button>
                <button onClick={endMatch} className="btn btn-danger flex items-center">
                  <RotateCcw className="w-5 h-5 mr-2" />
                  End Match
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Live Controls */}
      {isLive && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Score Controls */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Score Events
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">{match.homeTeam.name}</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEventModal('goal', 'home')}
                    className="btn btn-sm btn-primary flex items-center"
                  >
                    <User className="w-4 h-4 mr-1" />
                    Goal
                  </button>
                  <span className="font-bold text-lg w-8 text-center">{homeScore}</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="font-medium">{match.awayTeam.name}</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEventModal('goal', 'away')}
                    className="btn btn-sm btn-primary flex items-center"
                  >
                    <User className="w-4 h-4 mr-1" />
                    Goal
                  </button>
                  <span className="font-bold text-lg w-8 text-center">{awayScore}</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <button
                  onClick={removeLastEvent}
                  className="btn btn-sm btn-secondary w-full"
                  disabled={events.length === 0}
                >
                  Undo Last Event
                </button>
              </div>
            </div>
          </div>

          {/* Other Events */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Player Events
            </h3>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => openEventModal('yellow_card', 'home')}
                  className="btn btn-sm btn-warning flex items-center justify-center"
                >
                  <User className="w-4 h-4 mr-1" />
                  Yellow (Home)
                </button>
                <button
                  onClick={() => openEventModal('yellow_card', 'away')}
                  className="btn btn-sm btn-warning flex items-center justify-center"
                >
                  <User className="w-4 h-4 mr-1" />
                  Yellow (Away)
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => openEventModal('red_card', 'home')}
                  className="btn btn-sm btn-danger flex items-center justify-center"
                >
                  <User className="w-4 h-4 mr-1" />
                  Red (Home)
                </button>
                <button
                  onClick={() => openEventModal('red_card', 'away')}
                  className="btn btn-sm btn-danger flex items-center justify-center"
                >
                  <User className="w-4 h-4 mr-1" />
                  Red (Away)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => openEventModal('substitution', 'home')}
                  className="btn btn-sm btn-secondary flex items-center justify-center"
                >
                  <Users className="w-4 h-4 mr-1" />
                  Sub (Home)
                </button>
                <button
                  onClick={() => openEventModal('substitution', 'away')}
                  className="btn btn-sm btn-secondary flex items-center justify-center"
                >
                  <Users className="w-4 h-4 mr-1" />
                  Sub (Away)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Match Events */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Match Events
        </h3>
        
        {events.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No events yet</p>
        ) : (
          <div className="space-y-2">
            {events.slice().reverse().map((event, index) => (
              <div key={event.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-sm font-medium">{event.minute}'</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    event.type === 'goal' ? 'bg-green-100 text-green-800' :
                    event.type === 'yellow_card' ? 'bg-yellow-100 text-yellow-800' :
                    event.type === 'red_card' ? 'bg-red-100 text-red-800' :
                    event.type === 'substitution' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {event.type.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-sm font-medium">{event.playerName || 'Unknown Player'}</span>
                  <span className="text-sm text-gray-600">
                    ({eventTeam === 'home' ? match.homeTeam.name : match.awayTeam.name})
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Player Selection Modal */}
      <Modal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        title={`Select Player - ${eventType.replace('_', ' ').toUpperCase()}`}
        size="md"
      >
        <PlayerSelectionModal
          players={eventTeam === 'home' ? homePlayers : awayPlayers}
          teamName={eventTeam === 'home' ? match.homeTeam.name : match.awayTeam.name}
          onSelectPlayer={addEventWithPlayer}
          onClose={() => setShowEventModal(false)}
          eventType={eventType}
        />
      </Modal>
    </div>
  );
}

// Player Selection Modal Component
function PlayerSelectionModal({ players, teamName, onSelectPlayer, onClose, eventType }) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {teamName} - {eventType.replace('_', ' ').toUpperCase()}
        </h3>
        <p className="text-sm text-gray-600">Select the player involved in this event</p>
      </div>

      {players.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No players found for this team</p>
          <button onClick={onClose} className="btn btn-secondary mt-4">
            Cancel
          </button>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          <div className="grid gap-2">
            {players.map((player) => (
              <button
                key={player._id}
                onClick={() => onSelectPlayer(player._id, player.name)}
                className="flex items-center p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors text-left"
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{player.name}</div>
                    <div className="text-sm text-gray-600">
                      #{player.jerseyNumber || 'N/A'} • {player.position}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-4 pt-4 border-t">
        <button onClick={onClose} className="btn btn-secondary">
          Cancel
        </button>
      </div>
    </div>
  );
}