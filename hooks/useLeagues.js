// hooks/useLeagues.js
import { useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export const useLeagues = () => {
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLeagues = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await axios.get(`/api/leagues${params ? `?${params}` : ''}`);
      setLeagues(response.data.data);
      return response.data.data;
    } catch (err) {
      setError(err.message);
      toast.error('Failed to fetch leagues');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getLeague = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/leagues/${id}`);
      return response.data.data;
    } catch (err) {
      toast.error('Failed to fetch league');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createLeague = useCallback(async (data) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/leagues', data);
      toast.success('League created successfully');
      await fetchLeagues();
      return response.data.data;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create league');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchLeagues]);

  const updateLeague = useCallback(async (id, data) => {
    setLoading(true);
    try {
      const response = await axios.put(`/api/leagues/${id}`, data);
      toast.success('League updated successfully');
      await fetchLeagues();
      return response.data.data;
    } catch (err) {
      toast.error('Failed to update league');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchLeagues]);

  const deleteLeague = useCallback(async (id) => {
    if (!confirm('Are you sure you want to delete this league?')) return;
    
    setLoading(true);
    try {
      await axios.delete(`/api/leagues/${id}`);
      toast.success('League deleted successfully');
      await fetchLeagues();
    } catch (err) {
      toast.error('Failed to delete league');
    } finally {
      setLoading(false);
    }
  }, [fetchLeagues]);

  return {
    leagues,
    loading,
    error,
    fetchLeagues,
    getLeague,
    createLeague,
    updateLeague,
    deleteLeague
  };
};
