// FILE: pages/index.js (Updated with fixed Image import)
// ===========================================
import { useState, useEffect } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
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
      {/* Hero Section with Tournament Logo */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 rounded-2xl">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>
        
        <div className="relative px-6 py-16 sm:py-24 lg:py-32">
          <div className="text-center">
            {/* Main Tournament Logo */}
            <div className="mb-8">
              <NextImage
                src="https://res.cloudinary.com/dq8lszs2o/image/upload/v1756292892/horse-futsal-league/banners/league-banner-1756292892007.png"
                alt="Horse Futsal Tournament"
                width={600}
                height={200}
                className="mx-auto max-w-full h-auto object-contain drop-shadow-2xl"
                priority
              />
            </div>
            
            {/* Tagline */}
            <p className="text-xl md:text-2xl text-blue-100 mb-8 font-light">
              The Premier Futsal League Experience
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {liveMatch && (
                <Link
                  href="/matches/live"
                  className="inline-flex items-center bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-xl"
                >
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse mr-3"></div>
                  Watch Live Match
                </Link>
              )}
              
              <Link
                href="/standings"
                className="inline-flex items-center bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 border border-white/20 hover:border-white/40"
              >
                View League Table
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-4 left-4 w-20 h-20 border-2 border-white/20 rounded-full"></div>
        <div className="absolute bottom-4 right-4 w-16 h-16 border-2 border-white/20 rounded-full"></div>
        <div className="absolute top-1/2 left-8 w-2 h-2 bg-white/30 rounded-full"></div>
        <div className="absolute top-1/4 right-12 w-3 h-3 bg-white/20 rounded-full"></div>
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