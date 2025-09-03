// FILE: pages/index.js (Fixed with better statistics calculation)
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      console.log('Fetching home page data...');
      setIsLoading(true);
      
      // Fetch live match
      try {
        const liveResponse = await fetch('/api/public/matches?status=live');
        if (liveResponse.ok) {
          const liveData = await liveResponse.json();
          if (Array.isArray(liveData) && liveData.length > 0) {
            setLiveMatch(liveData[0]);
            console.log('Live match found:', liveData[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching live matches:', error);
      }

      // Fetch recent transfers
      try {
        const transfersResponse = await fetch('/api/public/transfers?limit=5');
        if (transfersResponse.ok) {
          const transfersData = await transfersResponse.json();
          setRecentTransfers(Array.isArray(transfersData) ? transfersData : []);
          console.log('Recent transfers:', transfersData?.length || 0);
        }
      } catch (error) {
        console.error('Error fetching transfers:', error);
      }

      // Fetch standings - using teams API as fallback
      try {
        const standingsResponse = await fetch('/api/public/standings?limit=5');
        if (standingsResponse.ok) {
          const standingsData = await standingsResponse.json();
          setStandings(Array.isArray(standingsData) ? standingsData : []);
          console.log('Standings:', standingsData?.length || 0);
        } else {
          // Fallback to teams data
          const teamsResponse = await fetch('/api/public/teams?limit=5');
          if (teamsResponse.ok) {
            const teamsData = await teamsResponse.json();
            setStandings(Array.isArray(teamsData) ? teamsData : []);
            console.log('Teams fallback:', teamsData?.length || 0);
          }
        }
      } catch (error) {
        console.error('Error fetching standings:', error);
      }

      // Fetch upcoming matches
      try {
        const matchesResponse = await fetch('/api/public/matches?status=scheduled&limit=3');
        if (matchesResponse.ok) {
          const matchesData = await matchesResponse.json();
          setUpcomingMatches(Array.isArray(matchesData) ? matchesData : []);
          console.log('Upcoming matches:', matchesData?.length || 0);
        }
      } catch (error) {
        console.error('Error fetching upcoming matches:', error);
      }

      // FIXED: Better statistics calculation - always get fresh data
      try {
        console.log('Fetching statistics...');
        
        // Get fresh data from all APIs
        const [teamsRes, playersRes, matchesRes] = await Promise.all([
          fetch('/api/public/teams'),
          fetch('/api/public/players'),
          fetch('/api/public/matches')
        ]);
        
        let totalTeams = 0;
        let totalPlayers = 0;
        let totalMatches = 0;
        let totalGoals = 0;
        
        // Count teams
        if (teamsRes.ok) {
          const teams = await teamsRes.json();
          totalTeams = Array.isArray(teams) ? teams.length : 0;
          console.log('Total teams:', totalTeams);
        }
        
        // Count players and calculate goals
        if (playersRes.ok) {
          const players = await playersRes.json();
          if (Array.isArray(players)) {
            totalPlayers = players.length;
            totalGoals = players.reduce((sum, p) => {
              const goals = p.stats?.goals || p.careerStats?.goals || 0;
              return sum + goals;
            }, 0);
            console.log('Total players:', totalPlayers);
            console.log('Total goals:', totalGoals);
          }
        }
        
        // Count matches
        if (matchesRes.ok) {
          const matches = await matchesRes.json();
          totalMatches = Array.isArray(matches) ? matches.length : 0;
          console.log('Total matches:', totalMatches);
        }
        
        // Set the calculated stats
        setStats({
          totalTeams,
          totalPlayers,
          totalMatches,
          totalGoals,
        });
        
        console.log('Final stats:', {
          totalTeams,
          totalPlayers,
          totalMatches,
          totalGoals,
        });
        
      } catch (error) {
        console.error('Error calculating statistics:', error);
        // Set zeros if everything fails
        setStats({
          totalTeams: 0,
          totalPlayers: 0,
          totalMatches: 0,
          totalGoals: 0,
        });
      }

      console.log('Home data fetch completed');
    } catch (error) {
      console.error('Error in fetchHomeData:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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
                {liveMatch.homeTeam?.name || 'Team A'} {liveMatch.homeScore || 0} - {liveMatch.awayScore || 0} {liveMatch.awayTeam?.name || 'Team B'}
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

      {/* Statistics Cards - UPDATED WITH REFRESH BUTTON */}
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
          {/* Debug info - remove after testing */}
          <p className="text-xs text-gray-400 mt-1">Last updated: {new Date().toLocaleTimeString()}</p>
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

      {/* Debug Section - Remove after testing */}
      <div className="card bg-gray-50 p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">Debug Info</h3>
          <button 
            onClick={fetchHomeData}
            className="btn btn-sm btn-secondary"
          >
            Refresh Stats
          </button>
        </div>
        <div className="text-sm text-gray-600">
          <p>Teams: {stats.totalTeams} | Players: {stats.totalPlayers} | Matches: {stats.totalMatches} | Goals: {stats.totalGoals}</p>
          <p>Recent Transfers: {recentTransfers.length} | Standings: {standings.length} | Upcoming: {upcomingMatches.length}</p>
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
            {standings.slice(0, 5).map((team, index) => (
              <div key={team._id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  <span className="font-semibold text-gray-600 w-6">{index + 1}</span>
                  <div>
                    <p className="font-medium">{team.name}</p>
                    <p className="text-sm text-gray-600">
                      {team.stats?.wins || 0}W {team.stats?.draws || 0}D {team.stats?.losses || 0}L
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{team.stats?.points || 0}</p>
                  <p className="text-sm text-gray-600">pts</p>
                </div>
              </div>
            ))}
            {standings.length === 0 && (
              <p className="text-gray-500 text-center py-4">No standings data available</p>
            )}
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
                  <span className="font-medium">{match.homeTeam?.name || 'TBD'}</span>
                  <span className="text-gray-600">vs</span>
                  <span className="font-medium">{match.awayTeam?.name || 'TBD'}</span>
                </div>
              </div>
            ))}
            {upcomingMatches.length === 0 && (
              <p className="text-gray-500 text-center py-4">No upcoming matches</p>
            )}
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
                  {transfer.player?.name || 'Unknown Player'}
                </p>
                <p className="text-sm text-gray-600">
                  {transfer.fromTeam ? `${transfer.fromTeam.name} → ` : 'New signing → '}
                  {transfer.toTeam?.name || 'Free Agent'}
                </p>
                <p className="text-xs text-gray-500">
                  {format(new Date(transfer.transferDate), 'MMM dd, yyyy')}
                </p>
              </div>
            ))}
            {recentTransfers.length === 0 && (
              <p className="text-gray-500 text-center py-4">No recent transfers</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
