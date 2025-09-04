import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, MapPin, Calendar, FileText, Clock, Shield, Users } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { calculateAge } from '../../lib/utils';

// Helper function to extract image URL from various formats
const getImageUrl = (imageData) => {
  if (!imageData) return null;
  
  // If it's already a string URL
  if (typeof imageData === 'string' && imageData.startsWith('http')) {
    return imageData;
  }
  
  // If it's an object with url property
  if (imageData && typeof imageData === 'object') {
    return imageData.url || imageData.secure_url || null;
  }
  
  return null;
};

export default function PlayersPage() {
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [selectedContract, setSelectedContract] = useState(''); // NEW: Contract filter
  const [teams, setTeams] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState('');

  useEffect(() => {
    fetchTeamsAndSeasons();
  }, []);

  useEffect(() => {
    fetchPlayers();
  }, [selectedTeam, selectedPosition, selectedSeason, selectedContract]);

  const fetchTeamsAndSeasons = async () => {
    try {
      const [teamsRes, seasonsRes] = await Promise.all([
        fetch('/api/public/teams'),
        fetch('/api/public/seasons')
      ]);

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(Array.isArray(teamsData) ? teamsData : []);
      } else {
        console.error('Failed to fetch teams');
        setTeams([]);
      }

      if (seasonsRes.ok) {
        const seasonsData = await seasonsRes.json();
        setSeasons(Array.isArray(seasonsData) ? seasonsData : []);

        // Set active season as default
        const activeSeason = seasonsData.find(s => s.isActive);
        if (activeSeason) {
          setSelectedSeason(activeSeason._id);
        }
      } else {
        console.error('Failed to fetch seasons');
        setSeasons([]);
      }
    } catch (error) {
      console.error('Error fetching teams and seasons:', error);
      setTeams([]);
      setSeasons([]);
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
      
      if (response.ok) {
        const data = await response.json();
        
        console.log('Public players fetch result:', {
          dataType: typeof data,
          isArray: Array.isArray(data),
          length: data?.length,
          firstPlayer: data?.[0]
        });
        
        if (Array.isArray(data)) {
          let filteredData = data;
          
          // Filter by position if selected
          if (selectedPosition) {
            filteredData = filteredData.filter(player => player.position === selectedPosition);
          }
          
          // NEW: Filter by contract status if selected
          if (selectedContract) {
            filteredData = filteredData.filter(player => {
              const contractStatus = player.contractStatus || 'free_agent';
              return contractStatus === selectedContract;
            });
          }
            
          setPlayers(filteredData);
        } else {
          console.error('Players data is not an array:', data);
          setPlayers([]);
        }
      } else {
        console.error('Failed to fetch players:', response.status);
        setPlayers([]);
      }
    } catch (error) {
      console.error('Error fetching players:', error);
      setPlayers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Updated positions to match your Futsal model
  const positions = ['Goalkeeper', 'Outfield Player'];

  // NEW: Contract status helpers
  const getContractStatusColor = (contractStatus) => {
    switch (contractStatus) {
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'seasonal': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'free_agent': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getContractStatusIcon = (contractStatus) => {
    switch (contractStatus) {
      case 'normal': return <FileText className="w-3 h-3" />;
      case 'seasonal': return <Clock className="w-3 h-3" />;
      case 'free_agent': return <User className="w-3 h-3" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };

  const getContractStatusLabel = (contractStatus) => {
    switch (contractStatus) {
      case 'normal': return 'Normal Contract';
      case 'seasonal': return 'Seasonal Contract';
      case 'free_agent': return 'Free Agent';
      default: return 'Unknown Status';
    }
  };

  const getTransferEligibilityBadge = (player) => {
    const contractStatus = player.contractStatus || 'free_agent';
    
    if (contractStatus === 'free_agent') {
      return (
        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
          Available
        </div>
      );
    } else if (contractStatus === 'normal') {
      return (
        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
          Transferable
        </div>
      );
    } else if (contractStatus === 'seasonal') {
      // Check if season is active
      const isSeasonActive = player.currentContract?.season?.isActive;
      if (isSeasonActive) {
        return (
          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
            Locked
          </div>
        );
      } else {
        return (
          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
            Season End
          </div>
        );
      }
    }
    
    return null;
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
        <h1 className="text-3xl font-bold text-gray-900">Players</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full md:w-auto">
          {/* Season Filter */}
          {seasons.length > 0 && (
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="form-input w-full"
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
            className="form-input w-full"
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
            className="form-input w-full"
          >
            <option value="">All Positions</option>
            {positions.map(position => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>
          
          {/* NEW: Contract Status Filter */}
          <select
            value={selectedContract}
            onChange={(e) => setSelectedContract(e.target.value)}
            className="form-input w-full"
          >
            <option value="">All Contract Types</option>
            <option value="free_agent">Free Agents</option>
            <option value="normal">Normal Contracts</option>
            <option value="seasonal">Seasonal Contracts</option>
          </select>
        </div>
      </div>

      {/* Contract Status Legend */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-sm font-semibold text-blue-900 mb-3">Contract Status Guide</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-green-800 font-medium">Available:</span>
            <span className="text-green-700">Free agents ready to sign</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-blue-800 font-medium">Transferable:</span>
            <span className="text-blue-700">Can move mid-season</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-red-800 font-medium">Locked:</span>
            <span className="text-red-700">Seasonal contract active</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-yellow-800 font-medium">Season End:</span>
            <span className="text-yellow-700">Available when season ends</span>
          </div>
        </div>
      </div>

      {/* Players Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {players.map((player) => (
          <Link key={player._id} href={`/players/${player._id}`}>
            <div className="card hover:shadow-lg transition-all duration-200 cursor-pointer relative overflow-hidden">
              {/* NEW: Contract Status Header */}
              <div className={`absolute top-0 left-0 right-0 px-4 py-2 border-b ${
                getContractStatusColor(player.contractStatus || 'free_agent')
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getContractStatusIcon(player.contractStatus || 'free_agent')}
                    <span className="text-xs font-medium">
                      {getContractStatusLabel(player.contractStatus || 'free_agent')}
                    </span>
                  </div>
                  {/* NEW: Transfer Eligibility Badge */}
                  {getTransferEligibilityBadge(player)}
                </div>
              </div>
              
              {/* Player Content - with top padding for header */}
              <div className="pt-12">
                <div className="text-center mb-4">
                  {getImageUrl(player.photo) ? (
                    <Image
                      src={getImageUrl(player.photo)}
                      alt={player.name}
                      width={80}
                      height={80}
                      className="rounded-full object-cover mx-auto mb-3"
                      onError={(e) => {
                        console.error('Public player photo failed:', player.name, player.photo);
                        // Hide failed image and show fallback
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) {
                          e.target.nextSibling.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  
                  {/* Fallback avatar */}
                  <div 
                    className={`w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 ${
                      getImageUrl(player.photo) ? 'hidden' : 'flex'
                    }`}
                  >
                    <User className="w-10 h-10 text-gray-400" />
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900">
                    {player.name}
                  </h3>
                  
                  {player.jerseyNumber && (
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      #{player.jerseyNumber}
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  {player.position && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Position:</span>
                      <div className="flex items-center space-x-1">
                        {player.position === 'Goalkeeper' ? (
                          <Shield className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Users className="w-4 h-4 text-green-600" />
                        )}
                        <span className="font-medium">{player.position}</span>
                      </div>
                    </div>
                  )}
                  
                  {player.dateOfBirth && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Age:</span>
                      <span className="font-medium">
                        {calculateAge(player.dateOfBirth)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Team:</span>
                    <span className={`font-medium ${
                      player.currentTeam ? 'text-blue-600' : 'text-green-600'
                    }`}>
                      {player.currentTeam?.name || 'Free Agent'}
                    </span>
                  </div>

                  {player.nationality && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Nationality:</span>
                      <span className="font-medium">{player.nationality}</span>
                    </div>
                  )}
                  
                  {/* NEW: Contract Value Display */}
                  {player.currentContract?.contractValue > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Value:</span>
                      <span className="font-bold text-green-600">
                        MVR {player.currentContract.contractValue.toLocaleString()}
                      </span>
                    </div>
                  )}
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
            </div>
          </Link>
        ))}
      </div>

      {players.length === 0 && !isLoading && (
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* General Stats */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Player Statistics</h3>
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
                  {players.length > 0 && players.filter(p => p.dateOfBirth).length > 0 
                    ? Math.round(players
                        .filter(p => p.dateOfBirth)
                        .reduce((sum, p) => sum + calculateAge(p.dateOfBirth), 0) / players.filter(p => p.dateOfBirth).length)
                    : 0
                  }
                </div>
                <div className="text-gray-600">Avg Age</div>
              </div>
            </div>
          </div>
          
          {/* NEW: Contract Distribution */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Contract Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {players.filter(p => (p.contractStatus || 'free_agent') === 'free_agent').length}
                </div>
                <div className="text-gray-600">Free Agents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {players.filter(p => p.contractStatus === 'normal').length}
                </div>
                <div className="text-gray-600">Normal Contracts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {players.filter(p => p.contractStatus === 'seasonal').length}
                </div>
                <div className="text-gray-600">Seasonal Contracts</div>
              </div>
            </div>
            
            {/* Contract Value Summary */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">
                  MVR {players
                    .reduce((sum, p) => sum + (p.currentContract?.contractValue || 0), 0)
                    .toLocaleString()}
                </div>
                <div className="text-gray-600">Total Contract Value</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
