import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import LiveMatchManager from '../../components/match/LiveMatchManager';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function LiveMatchPage() {
  const { data: session } = useSession();
  const [liveMatch, setLiveMatch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLiveMatch();
    
    // Set up real-time updates
    const interval = setInterval(fetchLiveMatch, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchLiveMatch = async () => {
    try {
      const response = await fetch('/api/public/matches?status=live&limit=1');
      const data = await response.json();
      
      if (data.length > 0) {
        setLiveMatch(data[0]);
      } else {
        setLiveMatch(null);
      }
    } catch (error) {
      console.error('Error fetching live match:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMatchUpdate = (updatedMatch) => {
    setLiveMatch(updatedMatch);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Live Match</h1>
      
      <LiveMatchManager 
        match={liveMatch}
        onUpdate={handleMatchUpdate}
      />
      
      {!liveMatch && (
        <div className="card text-center py-12 mt-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">No Live Match</h2>
          <p className="text-gray-500">
            There are currently no live matches. Check back later or contact an administrator.
          </p>
        </div>
      )}
    </div>
  );
}
