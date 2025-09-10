// ===========================================
// FILE: pages/matches/live.js (ENHANCED WITH OFFICIAL CARDS & OWN GOALS)
// ===========================================
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { 
  Play, 
  Pause, 
  Clock, 
  Users, 
  User, 
  Shield,
  Target,
  AlertTriangle,
  Plus,
  Minus 
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function LiveMatchManager() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { matchId } = router.query;

  const [match, setMatch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [currentMinute, setCurrentMinute] = useState(0);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [events, setEvents] = useState([]);
  const [homePlayers, setHomePlayers] = useState([]);
  const [awayPlayers, setAwayPlayers] = useState([]);
  
  // Enhanced modal states
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventType, setEventType] = useState('');
  const [eventTeam, setEventTeam] = useState('');
  const [showOfficialModal, setShowOfficialModal] = useState(false);

  useEffect(() => {
    if (matchId) {
      fetchMatchData();
    }
  }, [matchId]);

  const fetchMatchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/matches/${matchId}`);
      if (response.ok) {
        const matchData = await response.json();
        setMatch(matchData);
        setCurrentMinute(matchData.liveData?.currentMinute || 0);
        setIsLive(matchData.liveData?.isLive || false);
        
        // Enhanced score handling
        if (matchData.stats) {
          setHomeScore(matchData.stats.homeGoals?.total || matchData.homeScore || 0);
          setAwayScore(matchData.stats.awayGoals?.total || matchData.awayScore || 0);
        } else {
          setHomeScore(matchData.homeScore || 0);
          setAwayScore(matchData.awayScore || 0);
        }
        
        setEvents(matchData.events || []);
        await fetchTeamPlayers(matchData);
      }
    } catch (error) {
      console.error('Error fetching match data:', error);
      toast.error('Failed to load match data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeamPlayers = async (matchData) => {
    try {
      const [homeResponse, awayResponse] = await Promise.all([
        fetch(`/api/admin/players?teamId=${matchData.homeTeam._id}&status=active`),
        fetch(`/api/admin/players?teamId=${matchData.awayTeam._id}&status=active`)
      ]);

      if (homeResponse.ok && awayResponse.ok) {
        const [homePlayers, awayPlayers] = await Promise.all([
          homeResponse.json(),
          awayResponse.json()
        ]);
        setHomePlayers(Array.isArray(homePlayers) ? homePlayers : []);
        setAwayPlayers(Array.isArray(awayPlayers) ? awayPlayers : []);
      }
    } catch (error) {
      console.error('Error fetching team players:', error);
    }
  };

  const openEventModal = (type, team) => {
    setEventType(type);
    setEventTeam(team);
    
    // For cards, check if we need official modal
    if ((type === 'yellow_card' || type === 'red_card')) {
      setShowEventModal(true);
    } else {
      setShowEventModal(true);
    }
  };

  const openOfficialModal = (type, team) => {
    setEventType(type);
    setEventTeam(team);
    setShowOfficialModal(true);
  };

  const addEventWithPlayer = async (playerId, playerName = null) => {
    try {
      const newEvent = {
        id: events.length + 1,
        type: eventType,
        team: eventTeam,
        minute: currentMinute,
        player: playerId,
        playerName: playerName,
        isOfficial: !playerId, // True if no player ID (official)
        description: generateEventDescription(playerId, playerName),
        timestamp: new Date(),
        // Enhanced fields for specific event types
        ...(eventType === 'own_goal' && {
          isOwnGoal: true,
          beneficiaryTeam: eventTeam === 'home' ? 'away' : 'home'
        })
      };

      const updatedEvents = [...events, newEvent];
      setEvents(updatedEvents);

      // Update score for goals
      if (eventType === 'goal') {
        if (eventTeam === 'home') {
          setHomeScore(prev => prev + 1);
        } else {
          setAwayScore(prev => prev + 1);
        }
      } else if (eventType === 'own_goal') {
        // Own goal benefits the opposing team
        if (eventTeam === 'home') {
          setAwayScore(prev => prev + 1);
        } else {
          setHomeScore(prev => prev + 1);
        }
      }

      // Send to server
      await updateMatchScore(updatedEvents);
      setShowEventModal(false);
      setShowOfficialModal(false);
      
      toast.success(`${eventType.replace('_', ' ').toUpperCase()} recorded successfully`);
    } catch (error) {
      console.error('Error adding event:', error);
      toast.error('Failed to add event');
    }
  };

  const generateEventDescription = (playerId, playerName) => {
    const name = playerName || getPlayerName(playerId) || 'Official';
    
    switch (eventType) {
      case 'goal':
        return `Goal by ${name}`;
      case 'own_goal':
        return `Own goal by ${name}`;
      case 'assist':
        return `Assist by ${name}`;
      case 'yellow_card':
        return `Yellow card - ${name}`;
      case 'red_card':
        return `Red card - ${name}`;
      case 'substitution':
        return `Substitution - ${name}`;
      default:
        return `${eventType.replace('_', ' ')} - ${name}`;
    }
  };

  const getPlayerName = (playerId) => {
    const allPlayers = [...homePlayers, ...awayPlayers];
    const player = allPlayers.find(p => p._id === playerId);
    return player ? `${player.name} (#${player.jerseyNumber})` : 'Unknown Player';
  };

  const updateMatchScore = async (updatedEvents = events) => {
    try {
      const response = await fetch('/api/matches/live/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matchId,
          homeScore,
          awayScore,
          currentMinute,
          events: updatedEvents
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update score');
      }
    } catch (error) {
      console.error('Error updating score:', error);
      throw error;
    }
  };

  const toggleMatchState = async () => {
    try {
      const response = await fetch('/api/matches/live/control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matchId,
          action: isLive ? 'pause' : 'start',
          currentMinute
        }),
      });

      if (response.ok) {
        setIsLive(!isLive);
        toast.success(`Match ${isLive ? 'paused' : 'started'}`);
      }
    } catch (error) {
      console.error('Error toggling match state:', error);
      toast.error('Failed to update match state');
    }
  };

  const updateScore = (team, delta) => {
    if (team === 'home') {
      setHomeScore(prev => Math.max(0, prev + delta));
    } else {
      setAwayScore(prev => Math.max(0, prev + delta));
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!session || !match) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>You need to be logged in to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Match Header */}
      <div className="card">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold mb-2">Live Match Manager</h1>
          <div className="flex justify-center items-center space-x-2 mb-4">
            <Clock className="w-5 h-5" />
            <span className={`font-bold ${isLive ? 'text-red-600' : 'text-gray-600'}`}>
              {isLive ? 'LIVE' : 'PAUSED'} - {currentMinute}'
            </span>
          </div>
          
          <div className="grid grid-cols-3 items-center gap-4">
            {/* Home Team */}
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">{match.homeTeam.name}</h3>
              {session?.user?.role === 'admin' && (
                <div className="flex justify-center space-x-2 mb-2">
                  <button
                    onClick={() => updateScore('home', -1)}
                    className="btn btn-danger px-2 py-1"
                    disabled={homeScore === 0}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => updateScore('home', 1)}
                    className="btn btn-primary px-2 py-1"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="text-4xl font-bold text-blue-600">{homeScore}</div>
            </div>

            {/* VS */}
            <div className="text-center">
              <span className="text-2xl font-bold text-gray-400">VS</span>
            </div>

            {/* Away Team */}
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">{match.awayTeam.name}</h3>
              {session?.user?.role === 'admin' && (
                <div className="flex justify-center space-x-2 mb-2">
                  <button
                    onClick={() => updateScore('away', -1)}
                    className="btn btn-danger px-2 py-1"
                    disabled={awayScore === 0}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => updateScore('away', 1)}
                    className="btn btn-primary px-2 py-1"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="text-4xl font-bold text-red-600">{awayScore}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Control Panel */}
      {session?.user?.role === 'admin' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Match Controls</h3>
          
          {/* Match State Controls */}
          <div className="flex justify-center space-x-4 mb-6">
            <button
              onClick={toggleMatchState}
              className={`btn ${isLive ? 'btn-danger' : 'btn-success'} flex items-center`}
            >
              {isLive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isLive ? 'Pause Match' : 'Start Match'}
            </button>
            
            <div className="flex items-center space-x-2">
              <label htmlFor="minute" className="text-sm font-medium">Minute:</label>
              <input
                id="minute"
                type="number"
                min="0"
                max="120"
                value={currentMinute}
                onChange={(e) => setCurrentMinute(parseInt(e.target.value) || 0)}
                className="form-input w-20"
              />
            </div>
          </div>

          {/* Enhanced Event Buttons */}
          <div className="space-y-4">
            {/* Goals */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => openEventModal('goal', 'home')}
                className="btn btn-success flex items-center justify-center"
              >
                <Target className="w-4 h-4 mr-1" />
                Goal (Home)
              </button>
              <button
                onClick={() => openEventModal('goal', 'away')}
                className="btn btn-success flex items-center justify-center"
              >
                <Target className="w-4 h-4 mr-1" />
                Goal (Away)
              </button>
            </div>

            {/* Own Goals */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => openEventModal('own_goal', 'home')}
                className="btn btn-warning flex items-center justify-center"
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                Own Goal (Home)
              </button>
              <button
                onClick={() => openEventModal('own_goal', 'away')}
                className="btn btn-warning flex items-center justify-center"
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                Own Goal (Away)
              </button>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => openEventModal('yellow_card', 'home')}
                className="btn btn-warning flex items-center justify-center"
              >
                <User className="w-4 h-4 mr-1" />
                Yellow (Home)
              </button>
              <button
                onClick={() => openEventModal('yellow_card', 'away')}
                className="btn btn-warning flex items-center justify-center"
              >
                <User className="w-4 h-4 mr-1" />
                Yellow (Away)
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => openEventModal('red_card', 'home')}
                className="btn btn-danger flex items-center justify-center"
              >
                <User className="w-4 h-4 mr-1" />
                Red (Home)
              </button>
              <button
                onClick={() => openEventModal('red_card', 'away')}
                className="btn btn-danger flex items-center justify-center"
              >
                <User className="w-4 h-4 mr-1" />
                Red (Away)
              </button>
            </div>

            {/* Substitutions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => openEventModal('substitution', 'home')}
                className="btn btn-secondary flex items-center justify-center"
              >
                <Users className="w-4 h-4 mr-1" />
                Sub (Home)
              </button>
              <button
                onClick={() => openEventModal('substitution', 'away')}
                className="btn btn-secondary flex items-center justify-center"
              >
                <Users className="w-4 h-4 mr-1" />
                Sub (Away)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Match Events Display */}
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
              <div key={event.id} className={`flex justify-between items-center p-3 rounded-lg ${
                event.type === 'own_goal' ? 'bg-orange-50 border-l-4 border-orange-500' :
                event.type === 'goal' ? 'bg-green-50 border-l-4 border-green-500' :
                event.type === 'yellow_card' ? 'bg-yellow-50 border-l-4 border-yellow-500' :
                event.type === 'red_card' ? 'bg-red-50 border-l-4 border-red-500' :
                'bg-gray-50'
              }`}>
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-sm font-medium">{event.minute}'</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    event.type === 'goal' ? 'bg-green-100 text-green-800' :
                    event.type === 'own_goal' ? 'bg-orange-100 text-orange-800' :
                    event.type === 'yellow_card' ? 'bg-yellow-100 text-yellow-800' :
                    event.type === 'red_card' ? 'bg-red-100 text-red-800' :
                    event.type === 'substitution' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {event.type.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-sm font-medium">
                    {event.playerName || getPlayerName(event.player) || 'Unknown Player'}
                    {event.isOfficial && <span className="ml-1 text-purple-600">(Official)</span>}
                  </span>
                  <span className="text-sm text-gray-600">
                    ({eventTeam === 'home' ? match.homeTeam.name : match.awayTeam.name})
                  </span>
                  {event.type === 'own_goal' && (
                    <span className="text-xs text-orange-600 font-medium">
                      (Benefits {event.beneficiaryTeam === 'home' ? match.homeTeam.name : match.awayTeam.name})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Player Selection Modal */}
      <Modal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        title={`Select Player/Official - ${eventType.replace('_', ' ').toUpperCase()}`}
        size="md"
      >
        <EnhancedPlayerSelectionModal
          players={eventTeam === 'home' ? homePlayers : awayPlayers}
          teamName={eventTeam === 'home' ? match.homeTeam.name : match.awayTeam.name}
          onSelectPlayer={addEventWithPlayer}
          onClose={() => setShowEventModal(false)}
          eventType={eventType}
          allowOfficialEntry={eventType === 'yellow_card' || eventType === 'red_card'}
        />
      </Modal>
    </div>
  );
}

// Enhanced Player Selection Modal Component
function EnhancedPlayerSelectionModal({ 
  players, 
  teamName, 
  onSelectPlayer, 
  onClose, 
  eventType,
  allowOfficialEntry = false 
}) {
  const [customName, setCustomName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleCustomSubmit = () => {
    if (customName.trim()) {
      onSelectPlayer(null, customName.trim());
      setCustomName('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {teamName} - {eventType.replace('_', ' ').toUpperCase()}
        </h3>
        <p className="text-sm text-gray-600">Select the player involved in this event</p>
      </div>

      {/* Player List */}
      {players.length === 0 ? (
        <div className="text-center py-8">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No players available for this team</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {players.map(player => (
            <button
              key={player._id}
              onClick={() => onSelectPlayer(player._id)}
              className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{player.name}</span>
                  <span className="text-sm text-gray-500 ml-2">#{player.jerseyNumber}</span>
                </div>
                <span className="text-sm text-gray-400">{player.position}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Official/Custom Entry */}
      {allowOfficialEntry && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Official or Other</span>
            <button
              onClick={() => setShowCustomInput(!showCustomInput)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showCustomInput ? 'Cancel' : 'Add Custom'}
            </button>
          </div>
          
          {showCustomInput && (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Enter official or custom name..."
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="form-input w-full"
                onKeyPress={(e) => e.key === 'Enter' && handleCustomSubmit()}
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleCustomSubmit}
                  className="btn btn-primary btn-sm"
                  disabled={!customName.trim()}
                >
                  Add Event
                </button>
                <button
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomName('');
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="btn btn-secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
