import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Users, Calendar, TrendingUp, Play } from 'lucide-react';
import { format } from 'date-fns';

export default function Home() {
  const [liveMatch, setLiveMatch] = useState(null);
  const [recentTransfers, setRecentTransfers] = useState([]);
  const [standings, setStandings] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalPlayers: 0,
    totalMatches: 0,
    totalGoals: 0,
  });

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      // Fetch live match
      const liveResponse = await fetch('/api/public/matches?status=live');
      const liveData = await liveResponse.json();
      if (liveData.length > 0) {
        setLiveMatch(liveData[0]);
      }

      // Fetch recent transfers
      const transfersResponse = await fetch('/api/public/transfers?limit=5');
      const transfersData = await transfersResponse.json();
      setRecentTransfers(transfersData);

      // Fetch standings
      const standingsResponse = await fetch('/api/public/standings?limit=5');
      const standingsData = await standingsResponse.json();
      setStandings(standingsData);

      // Fetch upcoming matches
      const matchesResponse = await fetch('/api/public/matches?status=scheduled&limit=3');
      const matchesData = await matchesResponse.json();
      setUpcomingMatches(matchesData);

      // Fetch statistics
      const statsResponse = await fetch('/api/public/stats');
      const statsData = await statsResponse.json();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching home data:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-12">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Horse Futsal Tournament
        </h1>
        <p className="text-xl md:text-2xl mb-8">
          The Premier Futsal League Experience
        </p>
        {liveMatch && (
          <Link
            href="/matches/live"
            className="inline-flex items-center bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg text-lg font-semibold transition-colors"
          >
            <Play className="w-5 h-5 mr-2" />
            Watch Live Match
          </Link>
        )}
      </div>

      {/* Live Match Banner */}
      {liveMatch && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-red-600 font-semibold">LIVE</span>
              </div>
              <div className="text-lg font-semibold">
                {liveMatch.homeTeam.name} {liveMatch.homeScore} - {liveMatch.awayScore} {liveMatch.awayTeam.name}
              </div>
            </div>
            <Link
              href={`/matches/${liveMatch._id}`}
              className="btn btn-primary"
            >
              View Details
            </Link>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card text-center">
          <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900">{stats.totalTeams}</h3>
          <p className="text-gray-600">Teams</p>
        </div>
        <div className="card text-center">
          <Users className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900">{stats.totalPlayers}</h3>
          <p className="text-gray-600">Players</p>
        </div>
        <div className="card text-center">
          <Calendar className="w-12 h-12 text-purple-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900">{stats.totalMatches}</h3>
          <p className="text-gray-600">Matches</p>
        </div>
        <div className="card text-center">
          <Trophy className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900">{stats.totalGoals}</h3>
          <p className="text-gray-600">Goals Scored</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* League Standings */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">League Standings</h2>
            <Link href="/standings" className="text-blue-600 hover:text-blue-800">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {standings.map((team, index) => (
              <div key={team._id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  <span className="font-semibold text-gray-600 w-6">{index + 1}</span>
                  <div>
                    <p className="font-medium">{team.name}</p>
                    <p className="text-sm text-gray-600">
                      {team.stats.wins}W {team.stats.draws}D {team.stats.losses}L
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{team.stats.points}</p>
                  <p className="text-sm text-gray-600">pts</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Matches */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Upcoming Matches</h2>
            <Link href="/matches" className="text-blue-600 hover:text-blue-800">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {upcomingMatches.map((match) => (
              <div key={match._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">
                    {format(new Date(match.matchDate), 'MMM dd, yyyy')}
                  </span>
                  <span className="text-sm text-gray-600">
                    {format(new Date(match.matchDate), 'HH:mm')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">{match.homeTeam.name}</span>
                  <span className="text-gray-600">vs</span>
                  <span className="font-medium">{match.awayTeam.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transfers */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Transfers</h2>
            <Link href="/transfers" className="text-blue-600 hover:text-blue-800">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {recentTransfers.map((transfer) => (
              <div key={transfer._id} className="border-l-4 border-blue-500 pl-4">
                <p className="font-medium">
                  {transfer.player.firstName} {transfer.player.lastName}
                </p>
                <p className="text-sm text-gray-600">
                  {transfer.fromTeam ? `${transfer.fromTeam.name} → ` : 'New signing → '}
                  {transfer.toTeam.name}
                </p>
                <p className="text-xs text-gray-500">
                  {format(new Date(transfer.transferDate), 'MMM dd, yyyy')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}