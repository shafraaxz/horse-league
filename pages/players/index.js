import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  User, MapPin, Calendar, FileText, Clock, Shield, Users, Search,
  Filter, SortAsc, SortDesc, BarChart3, TrendingUp, Award, Star,
  ChevronDown, Eye, ArrowRight, Zap, Crown, Target
} from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { calculateAge } from '../../lib/utils';

// Helper function to extract image URL from various formats
const getImageUrl = (imageData) => {
  if (!imageData) return null;
  
  if (typeof imageData === 'string' && imageData.startsWith('http')) {
    return imageData;
  }
  
  if (imageData && typeof imageData === 'object') {
    return imageData.url || imageData.secure_url || null;
  }
  
  return null;
};

// FIXED: Helper function to get normalized stats - USE ONLY careerStats
const getNormalizedStats = (player) => {
  return {
    goals: player.careerStats?.goals || 0,
    assists: player.careerStats?.assists || 0,
    appearances: player.careerStats?.appearances || 0,
    yellowCards: player.careerStats?.yellowCards || 0,
    redCards: player.careerStats?.redCards || 0,
    minutesPlayed: player.careerStats?.minutesPlayed || 0
  };
};

export default function PlayersPage() {
  const [players, setPlayers] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]); // Store all for client-side operations
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [selectedContract, setSelectedContract] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [teams, setTeams] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'goals', 'assists', 'age', 'team'
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list'
  const [showFilters, setShowFilters] = useState(false);
  const [playerStats, setPlayerStats] = useState({
    totalPlayers: 0,
    totalGoals: 0,
    totalAssists: 0,
    avgAge: 0,
    activeContracts: 0,
    freeAgents: 0
  });

  useEffect(() => {
    fetchTeamsAndSeasons();
  }, []);

  useEffect(() => {
    fetchPlayers();
  }, [selectedTeam, selectedSeason]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [allPlayers, selectedPosition, selectedContract, searchQuery, sortBy, sortOrder]);

  const fetchTeamsAndSeasons = async () => {
    try {
      const [teamsRes, seasonsRes] = await Promise.all([
        fetch('/api/public/teams'),
        fetch('/api/public/seasons')
      ]);

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(Array.isArray(teamsData) ? teamsData : []);
      }

      if (seasonsRes.ok) {
        const seasonsData = await seasonsRes.json();
        setSeasons(Array.isArray(seasonsData) ? seasonsData : []);

        const activeSeason = seasonsData.find(s => s.isActive);
        if (activeSeason) {
          setSelectedSeason(activeSeason._id);
        }
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
        
        if (Array.isArray(data)) {
          console.log('Raw players data sample:', data.slice(0, 3).map(p => ({
            name: p.name,
            careerGoals: p.careerStats?.goals,
            careerAssists: p.careerStats?.assists
          })));
          
          setAllPlayers(data);
          calculatePlayerStats(data);
        } else {
          setAllPlayers([]);
        }
      } else {
        setAllPlayers([]);
      }
    } catch (error) {
      console.error('Error fetching players:', error);
      setAllPlayers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // FIXED: Calculate player stats using consistent normalization
  const calculatePlayerStats = (playersData) => {
    const totalPlayers = playersData.length;
    
    // FIXED: Use consistent normalization - only careerStats
    const totalGoals = playersData.reduce((sum, p) => {
      return sum + (p.careerStats?.goals || 0);
    }, 0);
    
    const totalAssists = playersData.reduce((sum, p) => {
      return sum + (p.careerStats?.assists || 0);
    }, 0);
    
    const playersWithAge = playersData.filter(p => p.dateOfBirth);
    const avgAge = playersWithAge.length > 0 
      ? Math.round(playersWithAge.reduce((sum, p) => sum + calculateAge(p.dateOfBirth), 0) / playersWithAge.length)
      : 0;

    const activeContracts = playersData.filter(p => 
      p.contractStatus === 'active' || p.currentTeam
    ).length;

    console.log('Player stats calculation (FIXED):', {
      totalPlayers,
      totalGoals,
      totalAssists,
      avgAge,
      activeContracts
    });

    setPlayerStats({
      totalPlayers,
      totalGoals,
      totalAssists,
      avgAge,
      activeContracts,
      freeAgents: totalPlayers - activeContracts
    });
  };

  const applyFiltersAndSort = () => {
    let filtered = [...allPlayers];
    
    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(player => 
        player.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by position
    if (selectedPosition) {
      filtered = filtered.filter(player => player.position === selectedPosition);
    }
    
    // Filter by contract status
    if (selectedContract) {
      filtered = filtered.filter(player => {
        const contractStatus = player.contractStatus || 'free_agent';
        return contractStatus === selectedContract;
      });
    }
    
    // Sort players
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'goals':
          aValue = getNormalizedStats(a).goals;
          bValue = getNormalizedStats(b).goals;
          break;
        case 'assists':
          aValue = getNormalizedStats(a).assists;
          bValue = getNormalizedStats(b).assists;
          break;
        case 'age':
          aValue = a.dateOfBirth ? calculateAge(a.dateOfBirth) : 0;
          bValue = b.dateOfBirth ? calculateAge(b.dateOfBirth) : 0;
          break;
        case 'team':
          aValue = a.currentTeam?.name || 'ZZZ Free Agent';
          bValue = b.currentTeam?.name || 'ZZZ Free Agent';
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }
      
      if (typeof aValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortOrder === 'asc' ? comparison : -comparison;
      } else {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });
    
    setPlayers(filtered);
  };

  // FIXED: Get top performers using consistent normalization
  const getTopPerformers = () => {
    const topScorers = [...allPlayers]
      .filter(p => (p.careerStats?.goals || 0) > 0)
      .sort((a, b) => (b.careerStats?.goals || 0) - (a.careerStats?.goals || 0))
      .slice(0, 3)
      .map(player => ({
        ...player,
        normalizedStats: getNormalizedStats(player)
      }));
      
    const topAssisters = [...allPlayers]
      .filter(p => (p.careerStats?.assists || 0) > 0)
      .sort((a, b) => (b.careerStats?.assists || 0) - (a.careerStats?.assists || 0))
      .slice(0, 3)
      .map(player => ({
        ...player,
        normalizedStats: getNormalizedStats(player)
      }));
      
    console.log('Top scorers (players page - FIXED):', topScorers.map(p => `${p.name}: ${p.normalizedStats.goals} goals`));
    console.log('Top assisters (players page - FIXED):', topAssisters.map(p => `${p.name}: ${p.normalizedStats.assists} assists`));
      
    return { topScorers, topAssisters };
  };

  const positions = ['Goalkeeper', 'Outfield Player'];

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

  const clearAllFilters = () => {
    setSelectedTeam('');
    setSelectedPosition('');
    setSelectedContract('');
    setSearchQuery('');
    setSortBy('name');
    setSortOrder('asc');
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'name' || field === 'team' ? 'asc' : 'desc');
    }
  };

  const { topScorers, topAssisters } = getTopPerformers();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-6 lg:space-y-0">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Players</h1>
          <p className="text-gray-600">
            {selectedSeason ? `Showing players from ${seasons.find(s => s._id === selectedSeason)?.name || 'selected season'}` : 'All registered players'}
            {players.length !== allPlayers.length && ` (${players.length} of ${allPlayers.length} shown)`}
          </p>
        </div>
        
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{playerStats.totalPlayers}</div>
            <div className="text-xs text-blue-700">Total Players</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{playerStats.totalGoals}</div>
            <div className="text-xs text-green-700">Total Goals</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">{playerStats.totalAssists}</div>
            <div className="text-xs text-purple-700">Total Assists</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-600">{playerStats.avgAge}</div>
            <div className="text-xs text-yellow-700">Avg Age</div>
          </div>
        </div>
      </div>

      {/* Enhanced Controls */}
      <div className="bg-white rounded-xl shadow-lg p-6 border">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0 mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            
            {(selectedTeam || selectedPosition || selectedContract || searchQuery) && (
              <button
                onClick={clearAllFilters}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Clear All Filters
              </button>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users className="w-4 h-4 mr-2" />
                List
              </button>
            </div>

            {/* Sort Controls */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => handleSort(e.target.value)}
                className="form-input py-1 text-sm"
              >
                <option value="name">Name</option>
                <option value="goals">Goals</option>
                <option value="assists">Assists</option>
                <option value="age">Age</option>
                <option value="team">Team</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 pt-6 border-t border-gray-200">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <label className="form-label text-sm">Search Players</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by player name..."
                  className="form-input pl-10"
                />
              </div>
            </div>

            {/* Season Filter */}
            {seasons.length > 0 && (
              <div>
                <label className="form-label text-sm">Season</label>
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
              </div>
            )}
            
            {/* Team Filter */}
            <div>
              <label className="form-label text-sm">Team</label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="form-input w-full"
              >
                <option value="">All Teams</option>
                <option value="free-agents">Free Agents</option>
                {teams.map(team => (
                  <option key={team._id} value={team._id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Position Filter */}
            <div>
              <label className="form-label text-sm">Position</label>
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
            </div>
            
            {/* Contract Status Filter */}
            <div>
              <label className="form-label text-sm">Contract Status</label>
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
        )}
      </div>

      {/* Top Performers Section - FIXED */}
      {(topScorers.length > 0 || topAssisters.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Scorers */}
          {topScorers.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-red-600" />
                Top Scorers
              </h3>
              <div className="space-y-3">
                {topScorers.map((player, index) => (
                  <Link key={player._id} href={`/players/${player._id}`}>
                    <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        'bg-yellow-600 text-white'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{player.name}</div>
                        <div className="text-sm text-gray-600">{player.currentTeam?.name || 'Free Agent'}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-600">{player.normalizedStats.goals}</div>
                        <div className="text-xs text-gray-500">goals</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Top Assisters */}
          {topAssisters.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2 text-blue-600" />
                Top Assisters
              </h3>
              <div className="space-y-3">
                {topAssisters.map((player, index) => (
                  <Link key={player._id} href={`/players/${player._id}`}>
                    <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-blue-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        'bg-blue-600 text-white'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{player.name}</div>
                        <div className="text-sm text-gray-600">{player.currentTeam?.name || 'Free Agent'}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-600">{player.normalizedStats.assists}</div>
                        <div className="text-xs text-gray-500">assists</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Players Display - UPDATED with FIXED stats */}
      {viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {players.map((player) => {
            const stats = getNormalizedStats(player);
            return (
              <Link key={player._id} href={`/players/${player._id}`}>
                <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group transform hover:-translate-y-1 border border-gray-200 hover:border-blue-200">
                  {/* Contract Status Header */}
                  <div className={`px-4 py-2 border-b ${
                    getContractStatusColor(player.contractStatus || 'free_agent')
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getContractStatusIcon(player.contractStatus || 'free_agent')}
                        <span className="text-xs font-medium">
                          {player.contractStatus === 'free_agent' ? 'Free Agent' :
                           player.contractStatus === 'normal' ? 'Normal' :
                           player.contractStatus === 'seasonal' ? 'Seasonal' : 
                           'Unknown'}
                        </span>
                      </div>
                      {getTransferEligibilityBadge(player)}
                    </div>
                  </div>
                  
                  {/* Player Content */}
                  <div className="p-6">
                    <div className="text-center mb-4">
                      {/* Player Photo */}
                      <div className="relative mb-3">
                        {getImageUrl(player.photo) ? (
                          <Image
                            src={getImageUrl(player.photo)}
                            alt={player.name}
                            width={80}
                            height={80}
                            className="rounded-full object-cover mx-auto border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto border-2 border-gray-200">
                            <User className="w-10 h-10 text-gray-400" />
                          </div>
                        )}
                        
                        {/* Jersey Number Badge */}
                        {player.jerseyNumber && (
                          <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                            {player.jerseyNumber}
                          </div>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {player.name}
                      </h3>
                    </div>

                    {/* Player Details */}
                    <div className="space-y-2 text-sm mb-4">
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
                    </div>

                    {/* Player Stats - FIXED */}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-lg font-bold text-green-600">
                            {stats.goals}
                          </div>
                          <div className="text-xs text-gray-600">Goals</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-blue-600">
                            {stats.assists}
                          </div>
                          <div className="text-xs text-gray-600">Assists</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-purple-600">
                            {stats.appearances}
                          </div>
                          <div className="text-xs text-gray-600">Matches</div>
                        </div>
                      </div>
                    </div>

                    {/* View Details Button */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-center w-full bg-gray-50 group-hover:bg-blue-50 text-gray-700 group-hover:text-blue-700 py-2 rounded-lg text-sm font-medium transition-colors">
                        <Eye className="w-4 h-4 mr-2" />
                        View Profile
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* List View - FIXED stats */
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="divide-y divide-gray-200">
            {players.map((player) => {
              const stats = getNormalizedStats(player);
              return (
                <Link key={player._id} href={`/players/${player._id}`}>
                  <div className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors cursor-pointer group">
                    <div className="flex items-center space-x-6">
                      {/* Player Photo */}
                      <div className="relative">
                        {getImageUrl(player.photo) ? (
                          <Image
                            src={getImageUrl(player.photo)}
                            alt={player.name}
                            width={60}
                            height={60}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-15 h-15 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        
                        {player.jerseyNumber && (
                          <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">
                            {player.jerseyNumber}
                          </div>
                        )}
                      </div>

                      {/* Player Info */}
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {player.name}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          {player.position && (
                            <span className="flex items-center">
                              {player.position === 'Goalkeeper' ? (
                                <Shield className="w-3 h-3 mr-1 text-blue-600" />
                              ) : (
                                <Users className="w-3 h-3 mr-1 text-green-600" />
                              )}
                              {player.position}
                            </span>
                          )}
                          
                          {player.dateOfBirth && (
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              Age {calculateAge(player.dateOfBirth)}
                            </span>
                          )}
                          
                          <span className={`flex items-center font-medium ${
                            player.currentTeam ? 'text-blue-600' : 'text-green-600'
                          }`}>
                            <MapPin className="w-3 h-3 mr-1" />
                            {player.currentTeam?.name || 'Free Agent'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stats and Status - FIXED */}
                    <div className="flex items-center space-x-8">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{stats.goals}</div>
                        <div className="text-xs text-gray-600">Goals</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{stats.assists}</div>
                        <div className="text-xs text-gray-600">Assists</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">{stats.appearances}</div>
                        <div className="text-xs text-gray-600">Matches</div>
                      </div>
                      
                      {getTransferEligibilityBadge(player)}
                      
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* No Results */}
      {players.length === 0 && !isLoading && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">No Players Found</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            {searchQuery ? `No players match "${searchQuery}" with the selected filters.` : 'No players match the selected filters.'}
          </p>
          {(selectedTeam || selectedPosition || selectedContract || searchQuery) && (
            <button
              onClick={clearAllFilters}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* Contract Status Legend */}
      {players.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Contract Status Guide
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
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
      )}

      {/* Enhanced Statistics Summary - FIXED */}
      {players.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contract Distribution */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Contract Distribution</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Free Agents</span>
                <span className="font-bold text-green-600">{playerStats.freeAgents}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Contracts</span>
                <span className="font-bold text-blue-600">{playerStats.activeContracts}</span>
              </div>
            </div>
          </div>

          {/* Position Distribution */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Position Distribution</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-blue-600" />
                  Goalkeepers
                </span>
                <span className="font-bold text-blue-600">
                  {allPlayers.filter(p => p.position === 'Goalkeeper').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center">
                  <Users className="w-4 h-4 mr-2 text-green-600" />
                  Outfield Players
                </span>
                <span className="font-bold text-green-600">
                  {allPlayers.filter(p => p.position === 'Outfield Player').length}
                </span>
              </div>
            </div>
          </div>

          {/* Market Value - FIXED */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Market Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Market Value</span>
                <span className="font-bold text-green-600">
                  MVR {allPlayers
                    .reduce((sum, p) => sum + (p.currentContract?.contractValue || 0), 0)
                    .toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Contracted Players</span>
                <span className="font-bold text-blue-600">
                  {allPlayers.filter(p => p.currentContract?.contractValue > 0).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
