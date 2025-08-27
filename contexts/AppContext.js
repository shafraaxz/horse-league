// contexts/AppContext.js - Updated with createLeague and updateLeague
import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    // Return empty object instead of throwing error
    console.warn('useApp called outside AppProvider, returning empty object');
    return {
      currentUser: null,
      currentLeague: null,
      loading: false,
      leagues: [],
      teams: [],
      players: [],
      matches: [],
      standings: [],
      admins: [],
      login: () => {},
      logout: () => {},
      fetchLeagues: () => Promise.resolve([]),
      createLeague: () => Promise.resolve(null),
      updateLeague: () => Promise.resolve(null),
      selectLeague: () => Promise.resolve(false),
      clearLeagueData: () => {},
      refreshCurrentLeagueData: () => Promise.resolve(),
      fetchTeamsByLeague: () => Promise.resolve([]),
      fetchAllTeams: () => Promise.resolve([]),
      createTeam: () => Promise.resolve(null),
      updateTeam: () => Promise.resolve(null),
      deleteTeam: () => Promise.resolve(false),
      fetchPlayersByTeam: () => Promise.resolve([]),
      createPlayer: () => Promise.resolve(null),
      updatePlayer: () => Promise.resolve(null),
      deletePlayer: () => Promise.resolve(false),
      fetchMatchesByLeague: () => Promise.resolve([]),
      fetchStandingsByLeague: () => Promise.resolve([]),
      fetchAdmins: () => Promise.resolve([]),
      apiCall: () => Promise.resolve({})
    };
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentLeague, setCurrentLeague] = useState(null);
  const [loading, setLoading] = useState(false);
  const [leagues, setLeagues] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [standings, setStandings] = useState([]);
  const [admins, setAdmins] = useState([]);

  // Generic API call function
  const apiCall = async (endpoint, options = {}) => {
    try {
      setLoading(true);
      const response = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Create new league with logo handling
  const createLeague = async (leagueData) => {
    try {
      setLoading(true);
      
      // Prepare league data, ensuring logo field is included
      const leaguePayload = {
        name: leagueData.name,
        description: leagueData.description || '',
        startDate: leagueData.startDate,
        endDate: leagueData.endDate,
        logo: leagueData.logo || null, // Handle logo field explicitly
        status: leagueData.status || 'active',
        maxTeams: leagueData.maxTeams || null,
        format: leagueData.format || 'round-robin',
        ...leagueData // Include any additional fields
      };

      const response = await apiCall('/api/leagues', {
        method: 'POST',
        body: JSON.stringify(leaguePayload),
      });

      if (response.success) {
        // Add the new league to the leagues array
        setLeagues(prev => [...prev, response.data]);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create league');
      }
    } catch (error) {
      console.error('Create league error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update existing league with logo handling
  const updateLeague = async (leagueId, leagueData) => {
    try {
      setLoading(true);
      
      // Prepare update payload, ensuring logo field is handled
      const updatePayload = {
        name: leagueData.name,
        description: leagueData.description,
        startDate: leagueData.startDate,
        endDate: leagueData.endDate,
        logo: leagueData.logo, // Include logo field in update
        status: leagueData.status,
        maxTeams: leagueData.maxTeams,
        format: leagueData.format,
        ...leagueData // Include any additional fields
      };

      const response = await apiCall(`/api/leagues/${leagueId}`, {
        method: 'PUT',
        body: JSON.stringify(updatePayload),
      });

      if (response.success) {
        // Update the league in the leagues array
        setLeagues(prev => 
          prev.map(league => 
            league.id === leagueId ? response.data : league
          )
        );

        // Update currentLeague if it's the one being updated
        if (currentLeague && currentLeague.id === leagueId) {
          setCurrentLeague(response.data);
        }

        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update league');
      }
    } catch (error) {
      console.error('Update league error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Other existing functions
  const login = async (credentials) => {
    try {
      const response = await apiCall('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      
      if (response.success) {
        setCurrentUser(response.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentLeague(null);
    clearLeagueData();
  };

  const fetchLeagues = async () => {
    try {
      const response = await apiCall('/api/leagues');
      if (response.success) {
        setLeagues(response.data);
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Fetch leagues error:', error);
      return [];
    }
  };

  const selectLeague = async (leagueId) => {
    try {
      const league = leagues.find(l => l.id === leagueId);
      if (league) {
        setCurrentLeague(league);
        await refreshCurrentLeagueData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Select league error:', error);
      return false;
    }
  };

  const clearLeagueData = () => {
    setTeams([]);
    setPlayers([]);
    setMatches([]);
    setStandings([]);
  };

  const refreshCurrentLeagueData = async () => {
    if (!currentLeague) return;
    
    try {
      await Promise.all([
        fetchTeamsByLeague(currentLeague.id),
        fetchMatchesByLeague(currentLeague.id),
        fetchStandingsByLeague(currentLeague.id),
      ]);
    } catch (error) {
      console.error('Refresh league data error:', error);
    }
  };

  // Team functions
  const fetchTeamsByLeague = async (leagueId) => {
    try {
      const response = await apiCall(`/api/leagues/${leagueId}/teams`);
      if (response.success) {
        setTeams(response.data);
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Fetch teams error:', error);
      return [];
    }
  };

  const fetchAllTeams = async () => {
    try {
      const response = await apiCall('/api/teams');
      if (response.success) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Fetch all teams error:', error);
      return [];
    }
  };

  const createTeam = async (teamData) => {
    try {
      const response = await apiCall('/api/teams', {
        method: 'POST',
        body: JSON.stringify(teamData),
      });
      
      if (response.success) {
        setTeams(prev => [...prev, response.data]);
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Create team error:', error);
      return null;
    }
  };

  const updateTeam = async (teamId, teamData) => {
    try {
      const response = await apiCall(`/api/teams/${teamId}`, {
        method: 'PUT',
        body: JSON.stringify(teamData),
      });
      
      if (response.success) {
        setTeams(prev => 
          prev.map(team => team.id === teamId ? response.data : team)
        );
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Update team error:', error);
      return null;
    }
  };

  const deleteTeam = async (teamId) => {
    try {
      const response = await apiCall(`/api/teams/${teamId}`, {
        method: 'DELETE',
      });
      
      if (response.success) {
        setTeams(prev => prev.filter(team => team.id !== teamId));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Delete team error:', error);
      return false;
    }
  };

  // Player functions
  const fetchPlayersByTeam = async (teamId) => {
    try {
      const response = await apiCall(`/api/teams/${teamId}/players`);
      if (response.success) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Fetch players error:', error);
      return [];
    }
  };

  const createPlayer = async (playerData) => {
    try {
      const response = await apiCall('/api/players', {
        method: 'POST',
        body: JSON.stringify(playerData),
      });
      
      if (response.success) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Create player error:', error);
      return null;
    }
  };

  const updatePlayer = async (playerId, playerData) => {
    try {
      const response = await apiCall(`/api/players/${playerId}`, {
        method: 'PUT',
        body: JSON.stringify(playerData),
      });
      
      if (response.success) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Update player error:', error);
      return null;
    }
  };

  const deletePlayer = async (playerId) => {
    try {
      const response = await apiCall(`/api/players/${playerId}`, {
        method: 'DELETE',
      });
      
      return response.success;
    } catch (error) {
      console.error('Delete player error:', error);
      return false;
    }
  };

  // Match and standings functions
  const fetchMatchesByLeague = async (leagueId) => {
    try {
      const response = await apiCall(`/api/leagues/${leagueId}/matches`);
      if (response.success) {
        setMatches(response.data);
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Fetch matches error:', error);
      return [];
    }
  };

  const fetchStandingsByLeague = async (leagueId) => {
    try {
      const response = await apiCall(`/api/leagues/${leagueId}/standings`);
      if (response.success) {
        setStandings(response.data);
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Fetch standings error:', error);
      return [];
    }
  };

  const fetchAdmins = async () => {
    try {
      const response = await apiCall('/api/admins');
      if (response.success) {
        setAdmins(response.data);
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Fetch admins error:', error);
      return [];
    }
  };

  const value = {
    // State
    currentUser,
    currentLeague,
    loading,
    leagues,
    teams,
    players,
    matches,
    standings,
    admins,
    
    // Auth functions
    login,
    logout,
    
    // League functions
    fetchLeagues,
    createLeague,
    updateLeague,
    selectLeague,
    clearLeagueData,
    refreshCurrentLeagueData,
    
    // Team functions
    fetchTeamsByLeague,
    fetchAllTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    
    // Player functions
    fetchPlayersByTeam,
    createPlayer,
    updatePlayer,
    deletePlayer,
    
    // Match and standings functions
    fetchMatchesByLeague,
    fetchStandingsByLeague,
    
    // Admin functions
    fetchAdmins,
    
    // Utility functions
    apiCall
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;