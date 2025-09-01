import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, MapPin, Calendar } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { calculateAge } from '../../lib/utils';

export default function PlayersPage() {
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [teams, setTeams] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState('');

  useEffect(() => {
    fetchTeamsAndSeasons();
  }, []);

  useEffect(() => {
    fetchPlayers();
  }, [selectedTeam, selectedPosition, selectedSeason]);

  const fetchTeamsAndSeasons = async () => {
    try {
      const [teamsRes, seasonsRes] = await Promise.all([
        fetch('/api/public/teams'),
        fetch('/api/public/seasons')
      ]);

      const teamsData = await teamsRes.json();
      const seasonsData = await seasonsRes.json();

      setTeams(teamsData);
      setSeasons(seasonsData);

      // Set active season as default
      const activeSeason = seasonsData.find(s => s.isActive);
      if (activeSeason) {
        setSelectedSeason(activeSeason._id);
      }
    } catch (error) {
      console.error('Error fetching teams and seasons:', error);
    }
  };

  const fetchPlayers = async () => {
    try {
      setIsLoading(true);
      let url = '/api/public/players?';
      
      const params = new URLSearchParams();
      if (selectedTeam) params.append('teamId', selectedTeam);
      if (selectedSeason) params.append('seasonId', selectedSeason);
      
      const response = await fetch(`${url}${params.toString()}`);
      const data = await response.json();
      
      // Filter by position if selected
      const filteredData = selectedPosition 
        ? data.filter(player => player.position === selectedPosition)
        : data;
        
      setPlayers(filteredData);
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const positions = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];

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
        <h1 className="text-3xl font-bold text-gray-900">Players</h1>
        
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
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
          
          {/* Team Filter */}
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="form-input w-48"
          >
            <option value="">All Teams</option>
            {teams.map(team => (
              <option key={team._id} value={team._id}>
                {team.name}
              </option>
            ))}
          </select>

          {/* Position Filter */}
          <select
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
            className="form-input w-48"
          >
            <option value="">All Positions</option>
            {positions.map(position => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Players Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {players.map((player) => (
          <Link key={player._id} href={`/players/${player._id}`}>
            <div className="card hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-center mb-4">
                {player.photo?.url ? (
                  <Image
                    src={player.photo.url}
                    alt={`${player.firstName} ${player.lastName}`}
                    width={80}
                    height={80}
                    className="rounded-full object-cover mx-auto mb-3"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <User className="w-10 h-10 text-gray-400" />
                  </div>
                )}
                
                <h3 className="text-lg font-bold text-gray-900">
                  {player.firstName} {player.lastName}
                </h3>
                
                {player.jerseyNumber && (
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    #{player.jerseyNumber}
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Position:</span>
                  <span className="font-medium">{player.position}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Age:</span>
                  <span className="font-medium">
                    {calculateAge(player.dateOfBirth)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Team:</span>
                  <span className="font-medium text-blue-600">
                    {player.currentTeam?.name || 'Free Agent'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Nationality:</span>
                  <span className="font-medium">{player.nationality}</span>
                </div>
              </div>

              {/* Player Stats */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-lg font-bold text-green-600">
                      {player.stats?.goals || 0}
                    </div>
                    <div className="text-xs text-gray-600">Goals</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">
                      {player.stats?.assists || 0}
                    </div>
                    <div className="text-xs text-gray-600">Assists</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-600">
                      {player.stats?.matchesPlayed || 0}
                    </div>
                    <div className="text-xs text-gray-600">Matches</div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {players.length === 0 && (
        <div className="card text-center py-12">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-4">No Players Found</h2>
          <p className="text-gray-500">
            No players match the selected filters.
          </p>
        </div>
      )}

      {/* Player Statistics Summary */}
      {players.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Statistics Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{players.length}</div>
              <div className="text-gray-600">Total Players</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {players.reduce((sum, p) => sum + (p.stats?.goals || 0), 0)}
              </div>
              <div className="text-gray-600">Total Goals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {players.reduce((sum, p) => sum + (p.stats?.assists || 0), 0)}
              </div>
              <div className="text-gray-600">Total Assists</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {Math.round(players.reduce((sum, p) => sum + calculateAge(p.dateOfBirth), 0) / players.length)}
              </div>
              <div className="text-gray-600">Avg Age</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
