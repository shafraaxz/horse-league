import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Plus, Minus } from 'lucide-react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

export default function LiveMatchManager({ match, onUpdate }) {
  const { data: session } = useSession();
  const [isLive, setIsLive] = useState(match?.liveData?.isLive || false);
  const [currentMinute, setCurrentMinute] = useState(match?.liveData?.currentMinute || 0);
  const [homeScore, setHomeScore] = useState(match?.homeScore || 0);
  const [awayScore, setAwayScore] = useState(match?.awayScore || 0);
  const [events, setEvents] = useState(match?.events || []);

  useEffect(() => {
    let interval;
    if (isLive) {
      interval = setInterval(() => {
        setCurrentMinute(prev => prev + 1);
      }, 60000); // Update every minute
    }
    return () => clearInterval(interval);
  }, [isLive]);

  const toggleMatch = async () => {
    if (session?.user?.role !== 'admin') {
      toast.error('Admin access required');
      return;
    }

    try {
      const response = await fetch('/api/admin/matches/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match._id,
          action: isLive ? 'pause' : 'start',
          currentMinute,
        }),
      });

      if (response.ok) {
        setIsLive(!isLive);
        toast.success(isLive ? 'Match paused' : 'Match started');
      }
    } catch (error) {
      toast.error('Failed to update match status');
    }
  };

  const updateScore = async (team, increment) => {
    if (session?.user?.role !== 'admin') {
      toast.error('Admin access required');
      return;
    }

    const newHomeScore = team === 'home' ? homeScore + increment : homeScore;
    const newAwayScore = team === 'away' ? awayScore + increment : awayScore;

    if (newHomeScore < 0 || newAwayScore < 0) return;

    try {
      const response = await fetch('/api/admin/matches/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match._id,
          homeScore: newHomeScore,
          awayScore: newAwayScore,
          currentMinute,
        }),
      });

      if (response.ok) {
        setHomeScore(newHomeScore);
        setAwayScore(newAwayScore);
        
        // Add goal event if score increased
        if (increment > 0) {
          const newEvent = {
            type: 'goal',
            team: team === 'home' ? match.homeTeam._id : match.awayTeam._id,
            minute: currentMinute,
            description: `Goal scored by ${team === 'home' ? match.homeTeam.name : match.awayTeam.name}`,
          };
          setEvents(prev => [...prev, newEvent]);
        }
        
        onUpdate && onUpdate({
          ...match,
          homeScore: newHomeScore,
          awayScore: newAwayScore,
          events: events,
        });
        
        toast.success('Score updated');
      }
    } catch (error) {
      toast.error('Failed to update score');
    }
  };

  const resetMatch = async () => {
    if (session?.user?.role !== 'admin') {
      toast.error('Admin access required');
      return;
    }

    if (confirm('Are you sure you want to reset this match?')) {
      try {
        const response = await fetch('/api/admin/matches/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ matchId: match._id }),
        });

        if (response.ok) {
          setIsLive(false);
          setCurrentMinute(0);
          setHomeScore(0);
          setAwayScore(0);
          setEvents([]);
          toast.success('Match reset');
        }
      } catch (error) {
        toast.error('Failed to reset match');
      }
    }
  };

  if (!match) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500 text-lg">No match selected for live management</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Live Match Manager</h2>
        <div className="flex space-x-2">
          {session?.user?.role === 'admin' && (
            <>
              <button
                onClick={toggleMatch}
                className={`btn ${isLive ? 'btn-danger' : 'btn-primary'} flex items-center`}
              >
                {isLive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isLive ? 'Pause' : 'Start'}
              </button>
              <button
                onClick={resetMatch}
                className="btn btn-secondary flex items-center"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </button>
            </>
          )}
        </div>
      </div>

      {/* Match Status */}
      <div className="bg-green-100 rounded-lg p-6 mb-6">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            {isLive && <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>}
            <span className={`text-lg font-semibold ${isLive ? 'text-red-600' : 'text-gray-600'}`}>
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

      {/* Match Events */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Match Events</h3>
        <div className="max-h-64 overflow-y-auto">
          {events.length > 0 ? (
            <div className="space-y-2">
              {events.map((event, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-600">{event.minute}'</span>
                    <span className="text-sm">{event.description}</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    event.type === 'goal' ? 'bg-green-100 text-green-800' :
                    event.type === 'yellow_card' ? 'bg-yellow-100 text-yellow-800' :
                    event.type === 'red_card' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {event.type.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No events recorded yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
