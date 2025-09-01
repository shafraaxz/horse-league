import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Clock, Users } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { format } from 'date-fns';

export default function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSeasons();
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [selectedSeason, statusFilter]);

  const fetchSeasons = async () => {
    try {
      const response = await fetch('/api/public/seasons');
      const data = await response.json();
      setSeasons(data);
      
      const activeSeason = data.find(s => s.isActive);
      if (activeSeason) {
        setSelectedSeason(activeSeason._id);
      }
    } catch (error) {
      console.error('Error fetching seasons:', error);
    }
  };

  const fetchMatches = async () => {
    try {
      setIsLoading(true);
      let url = '/api/public/matches';
      const params = new URLSearchParams();
      
      if (selectedSeason) params.append('seasonId', selectedSeason);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setMatches(data);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'postponed': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <h1 className="text-3xl font-bold text-gray-900">Matches</h1>
        
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-input w-48"
          >
            <option value="all">All Matches</option>
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
            <option value="postponed">Postponed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          {/* Season Filter */}
          {seasons.length > 0 && (
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="form-input w-48"
            >
              <option value="">All Seasons</option>
              {seasons.map(season => (
                <option key={season._id} value={season._id}>
                  {season.name} {season.isActive && '(Active)'}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Matches List */}
      <div className="space-y-4">
        {matches.map((match) => (
          <div key={match._id} className="card hover:shadow-lg transition-shadow">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {format(new Date(match.matchDate), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {format(new Date(match.matchDate), 'HH:mm')}
                      </span>
                    </div>
                    {match.venue && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{match.venue}</span>
                      </div>
                    )}
                  </div>
                  
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(match.status)}`}>
                    {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                    {match.status === 'live' && match.liveData?.currentMinute && (
                      <span className="ml-1">{match.liveData.currentMinute}'</span>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-8">
                    {/* Home Team */}
                    <div className="flex items-center space-x-3">
                      {match.homeTeam.logo?.url && (
                        <img
                          src={match.homeTeam.logo.url}
                          alt={match.homeTeam.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      <span className="font-medium text-gray-900">{match.homeTeam.name}</span>
                    </div>

                    {/* Score or VS */}
                    <div className="text-center">
                      {match.status === 'completed' || match.status === 'live' ? (
                        <div className="text-2xl font-bold text-gray-900">
                          {match.homeScore} - {match.awayScore}
                        </div>
                      ) : (
                        <div className="text-gray-500 font-medium">VS</div>
                      )}
                    </div>

                    {/* Away Team */}
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-gray-900">{match.awayTeam.name}</span>
                      {match.awayTeam.logo?.url && (
                        <img
                          src={match.awayTeam.logo.url}
                          alt={match.awayTeam.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                    </div>
                  </div>

                  {/* Round/Competition Info */}
                  <div className="text-right">
                    <div className="text-sm text-gray-600">{match.round}</div>
                    {match.referee && (
                      <div className="text-xs text-gray-500">Ref: {match.referee}</div>
                    )}
                  </div>
                </div>

                {/* Match Details Link */}
                <div className="mt-4 flex justify-between items-center">
                  <Link
                    href={`/matches/${match._id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Details →
                  </Link>
                  
                  {match.status === 'live' && (
                    <Link
                      href="/matches/live"
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-red-700 flex items-center"
                    >
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></div>
                      Watch Live
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {matches.length === 0 && (
        <div className="card text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-4">No Matches Found</h2>
          <p className="text-gray-500">
            No matches match the selected filters.
          </p>
        </div>
      )}

      {/* Match Statistics */}
      {matches.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Match Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{matches.length}</div>
              <div className="text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {matches.filter(m => m.status === 'completed').length}
              </div>
              <div className="text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {matches.filter(m => m.status === 'live').length}
              </div>
              <div className="text-gray-600">Live</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {matches.filter(m => m.status === 'scheduled').length}
              </div>
              <div className="text-gray-600">Scheduled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {matches
                  .filter(m => m.status === 'completed')
                  .reduce((sum, m) => sum + m.homeScore + m.awayScore, 0)}
              </div>
              <div className="text-gray-600">Goals</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
