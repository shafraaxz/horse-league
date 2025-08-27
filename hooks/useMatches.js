/ hooks/useMatches.js
import { useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export const useMatches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMatches = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await axios.get(`/api/matches${params ? `?${params}` : ''}`);
      setMatches(response.data.data);
      return response.data.data;
    } catch (err) {
      setError(err.message);
      toast.error('Failed to fetch matches');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getMatch = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/matches/${id}`);
      return response.data.data;
    } catch (err) {
      toast.error('Failed to fetch match');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const scheduleMatch = useCallback(async (data) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/matches', data);
      toast.success('Match scheduled successfully');
      await fetchMatches({ leagueId: data.league });
      return response.data.data;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to schedule match');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchMatches]);

  const updateMatch = useCallback(async (id, data) => {
    setLoading(true);
    try {
      const response = await axios.put(`/api/matches/${id}`, data);
      toast.success('Match updated successfully');
      await fetchMatches();
      return response.data.data;
    } catch (err) {
      toast.error('Failed to update match');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchMatches]);

  const deleteMatch = useCallback(async (id) => {
    if (!confirm('Are you sure you want to delete this match?')) return;
    
    setLoading(true);
    try {
      await axios.delete(`/api/matches/${id}`);
      toast.success('Match deleted successfully');
      await fetchMatches();
    } catch (err) {
      toast.error('Failed to delete match');
    } finally {
      setLoading(false);
    }
  }, [fetchMatches]);

  const startLiveMatch = useCallback(async (matchId) => {
    try {
      const response = await axios.post(`/api/matches/${matchId}/live`, {
        action: 'start'
      });
      toast.success('Match started!');
      return response.data.data;
    } catch (err) {
      toast.error('Failed to start match');
      throw err;
    }
  }, []);

  const updateLiveMatch = useCallback(async (matchId, action, data) => {
    try {
      const response = await axios.post(`/api/matches/${matchId}/live`, {
        action,
        data
      });
      return response.data.data;
    } catch (err) {
      toast.error('Failed to update live match');
      throw err;
    }
  }, []);

  const generateSchedule = useCallback(async (leagueId, options) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/schedule/generate', {
        leagueId,
        ...options
      });
      toast.success(`Generated ${response.data.data.length} matches successfully`);
      await fetchMatches({ leagueId });
      return response.data.data;
    } catch (err) {
      toast.error('Failed to generate schedule');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchMatches]);

  return {
    matches,
    loading,
    error,
    fetchMatches,
    getMatch,
    scheduleMatch,
    updateMatch,
    deleteMatch,
    startLiveMatch,
    updateLiveMatch,
    generateSchedule
  };
};
