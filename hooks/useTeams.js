// hooks/useTeams.js
import { useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export const useTeams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTeams = useCallback(async (leagueId = null) => {
    setLoading(true);
    setError(null);
    try {
      const url = leagueId ? `/api/teams?leagueId=${leagueId}` : '/api/teams'; // supports league or leagueId
      const response = await axios.get(url);
      setTeams(response.data.data);
      return response.data.data;
    } catch (err) {
      setError(err.message);
      toast.error('Failed to fetch teams');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getTeam = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/teams/${id}`);
      return response.data.data;
    } catch (err) {
      toast.error('Failed to fetch team');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createTeam = useCallback(async (data) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/teams', data);
      toast.success('Team created successfully');
      await fetchTeams(data.league);
      return response.data.data;
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to create team');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchTeams]);

  const updateTeam = useCallback(async (id, data) => {
    setLoading(true);
    try {
      const response = await axios.put(`/api/teams/${id}`, data);
      toast.success('Team updated successfully');
      await fetchTeams();
      return response.data.data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update team');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchTeams]);

  const deleteTeam = useCallback(async (id) => {
    if (!confirm('Are you sure you want to delete this team?')) return;
    
    setLoading(true);
    try {
      await axios.delete(`/api/teams/${id}`);
      toast.success('Team deleted successfully');
      await fetchTeams();
    } catch (err) {
      toast.error('Failed to delete team');
    } finally {
      setLoading(false);
    }
  }, [fetchTeams]);

  const addPlayer = useCallback(async (teamId, playerData) => {
    try {
      const response = await axios.post('/api/players', {
        ...playerData,
        team: teamId
      });
      toast.success('Player added to team');
      return response.data.data;
    } catch (err) {
      toast.error('Failed to add player');
      throw err;
    }
  }, []);

  return {
    teams,
    loading,
    error,
    fetchTeams,
    getTeam,
    createTeam,
    updateTeam,
    deleteTeam,
    addPlayer
  };
};
