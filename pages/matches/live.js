// ===========================================
// FILE: pages/matches/live.js
// ===========================================
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Play, Pause, RotateCcw, Plus, Users, Target, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LiveMatch() {
  const { data: session } = useSession();
  const router = useRouter();
  const { matchId } = router.query;

  const [match, setMatch] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [currentMinute, setCurrentMinute] = useState(0);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Fetch match data
  useEffect(() => {
    if (matchId) {
      fetchMatch();
    }
  }, [matchId]);

  const fetchMatch = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/matches/${matchId}`);
      
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
      router.push('/admin/matches');
    } finally {
      setIsLoading(false);
    }
  };

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
        await updateMatchStatus('live');
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to start match');
      }
    } catch (error) {
      console.error('Error starting match:', error);
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
        await updateMatchStatus('completed');
        router.push('/admin/matches');
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to end match');
      }
    } catch (error) {
      console.error('Error ending match:', error);
      toast.error('Failed to end match');
    }
  };

  const updateMatchStatus = async (status) => {
    try {
      await fetch('/api/matches/live/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match._id,
          status,
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
      console.error('Error updating match status:', error);
    }
  };

  const addGoal = (team) => {
    const newEvent = {
      id: Date.now(),
      type: 'goal',
      team: team,
      minute: currentMinute,
      description: `Goal scored by ${team === 'home' ? match.homeTeam.name : match.awayTeam.name}`
    };

    setEvents(prev => [...prev, newEvent]);

    if (team === 'home') {
      setHomeScore(prev => prev + 1);
    } else {
      setAwayScore(prev => prev + 1);
    }

    toast.success(`Goal! ${team === 'home' ? match.homeTeam.name : match.awayTeam.name}`);
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

  const addEvent = (type, team, description) => {
    const newEvent = {
      id: Date.now(),
      type,
      team,
      minute: currentMinute,
      description
    };

    setEvents(prev => [...prev, newEvent]);
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} added`);
  };

  // Auto-save match data periodically
  useEffect(() => {
    if (match && isLive) {
      const interval = setInterval(() => {
        updateMatchStatus('live');
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
          <p className="text-gray-600">Please select a match to manage.</p>
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
            {/* Home Team */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900">{match.homeTeam.name}</h3>
              <div className="text-4xl font-bold text-blue-600 mt-2">{homeScore}</div>
            </div>

            {/* Timer */}
            <div className="text-center">
              <div className="text-2xl font-mono font-bold text-gray-900">
                {currentMinute}'
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {new Date(match.matchDate).toLocaleDateString()}
              </div>
            </div>

            {/* Away Team */}
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
              Score Control
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">{match.homeTeam.name}</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => addGoal('home')}
                    className="btn btn-sm btn-primary"
                  >
                    + Goal
                  </button>
                  <span className="font-bold text-lg w-8 text-center">{homeScore}</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="font-medium">{match.awayTeam.name}</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => addGoal('away')}
                    className="btn btn-sm btn-primary"
                  >
                    + Goal
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
              Add Event
            </h3>
            
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => addEvent('yellow_card', 'home', `Yellow card - ${match.homeTeam.name}`)}
                  className="btn btn-sm btn-warning"
                >
                  Yellow Card (Home)
                </button>
                <button
                  onClick={() => addEvent('yellow_card', 'away', `Yellow card - ${match.awayTeam.name}`)}
                  className="btn btn-sm btn-warning"
                >
                  Yellow Card (Away)
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => addEvent('red_card', 'home', `Red card - ${match.homeTeam.name}`)}
                  className="btn btn-sm btn-danger"
                >
                  Red Card (Home)
                </button>
                <button
                  onClick={() => addEvent('red_card', 'away', `Red card - ${match.awayTeam.name}`)}
                  className="btn btn-sm btn-danger"
                >
                  Red Card (Away)
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
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {event.type.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-sm">{event.description}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}