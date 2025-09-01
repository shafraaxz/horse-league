import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Users, Trophy, Target } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [seasons, setSeasons] = useState([]);

  useEffect(() => {
    fetchSeasons();
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [selectedSeason]);

  const fetchSeasons = async () => {
    try {
      const response = await fetch('/api/public/seasons');
      const data = await response.json();
      setSeasons(data);
      
      // Set active season as default
      const activeSeason = data.find(s => s.isActive);
      if (activeSeason) {
        setSelectedSeason(activeSeason._id);
      }
    } catch (error) {
      console.error('Error fetching seasons:', error);
    }
  };

  const fetchTeams = async () => {
    try {
      setIsLoading(true);
      const url = selectedSeason 
        ? `/api/public/teams?seasonId=${selectedSeason}` 
        : '/api/public/teams';
      
      const response = await fetch(url);
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setIsLoading(false);
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
        
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <Link key={team._id} href={`/teams/${team._id}`}>
            <div className="card hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center space-x-4 mb-4">
                {team.logo?.url && (
                  <Image
                    src={team.logo.url}
                    alt={team.name}
                    width={60}
                    height={60}
                    className="rounded-full object-cover"
                  />
                )}
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{team.name}</h3>
                  <p className="text-gray-600">{team.season?.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center">
                  <Users className="w-8 h-8 text-blue-600 mb-2" />
                  <span className="text-2xl font-bold text-gray-900">
                    {team.playerCount || 0}
                  </span>
                  <span className="text-sm text-gray-600">Players</span>
                </div>
                
                <div className="flex flex-col items-center">
                  <Trophy className="w-8 h-8 text-yellow-600 mb-2" />
                  <span className="text-2xl font-bold text-gray-900">
                    {team.stats?.wins || 0}
                  </span>
                  <span className="text-sm text-gray-600">Wins</span>
                </div>
                
                <div className="flex flex-col items-center">
                  <Target className="w-8 h-8 text-green-600 mb-2" />
                  <span className="text-2xl font-bold text-gray-900">
                    {team.stats?.points || 0}
                  </span>
                  <span className="text-sm text-gray-600">Points</span>
                </div>
              </div>

              {team.description && (
                <p className="mt-4 text-gray-600 text-sm line-clamp-2">
                  {team.description}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {teams.length === 0 && (
        <div className="card text-center py-12">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">No Teams Found</h2>
          <p className="text-gray-500">
            No teams are registered for the selected season.
          </p>
        </div>
      )}
    </div>
  );
}
