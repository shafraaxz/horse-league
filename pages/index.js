// pages/index.js - Complete Fixed Version with All Handlers
import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import Dashboard from '../components/Dashboard';
import Schedule from '../components/Schedule';
import LeagueTable from '../components/LeagueTable';
import Teams from '../components/Teams';
import Statistics from '../components/Statistics';

// Import admin components
import AdminLogin from '../components/AdminLogin';
import LeagueModal from '../components/admin/LeagueModal';
import TeamModal from '../components/admin/TeamModal';
import PlayerModal from '../components/admin/PlayerModal';
import MatchModal from '../components/admin/MatchModal';

import { X, Key, Shield, UserPlus, Settings, Save, Eye, EyeOff, AlertCircle, CheckCircle, Edit, Trash2, Plus, Calendar, MapPin } from 'lucide-react';

const API_BASE = '/api';

// Toast Component
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    success: { icon: '✅', bg: 'bg-green-500', border: 'border-green-400' },
    error: { icon: '❌', bg: 'bg-red-500', border: 'border-red-400' },
    warning: { icon: '⚠️', bg: 'bg-yellow-500', border: 'border-yellow-400' },
    info: { icon: 'ℹ️', bg: 'bg-blue-500', border: 'border-blue-400' }
  };

  const { icon, bg, border } = config[type];

  return (
    <div className={`fixed top-4 right-4 ${bg} text-white px-6 py-4 rounded-xl shadow-2xl z-50 transition-all duration-500 transform hover:scale-105 border ${border} max-w-sm`}>
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0">{icon}</span>
        <div className="flex-1">
          <p className="font-medium">{message}</p>
        </div>
        <button 
          onClick={onClose} 
          className="text-white hover:text-gray-200 transition-colors flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// Enhanced Schedule Generator Component
const EnhancedScheduleGenerator = ({ isOpen, onClose, teams, selectedLeague, onScheduleGenerated, currentMatches }) => {
  const [config, setConfig] = useState({
    format: 'double-round-robin',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    weekdays: ['tuesday', 'thursday', 'saturday'],
    timePeriods: ['18:00', '19:30'],
    stadiums: ['Manadhoo Futsal Ground', 'Central Arena', 'Sports Complex A', 'Community Ground'],
    stadiumDistribution: 'rotate',
    primaryStadium: 'Manadhoo Futsal Ground',
    matchesPerRound: 6,
    deleteExisting: true,
    balanceVenues: true
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState(null);

  const weekdayOptions = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ];

  const generatePreview = () => {
    if (teams.length < 2) return;
    
    const totalMatches = config.format === 'double-round-robin' 
      ? teams.length * (teams.length - 1) 
      : Math.floor(teams.length * (teams.length - 1) / 2);
    
    const matchesPerRoundDay = config.timePeriods.length * config.stadiums.length;
    const roundsNeeded = Math.ceil(totalMatches / config.matchesPerRound);
    const weeksNeeded = Math.ceil(roundsNeeded / config.weekdays.length);
    
    setPreview({
      totalMatches,
      roundsNeeded,
      weeksNeeded,
      matchesPerRound: Math.min(config.matchesPerRound, matchesPerRoundDay),
      estimatedEndDate: new Date(
        new Date(config.startDate).getTime() + 
        (weeksNeeded * 7 * 24 * 60 * 60 * 1000)
      ).toISOString().split('T')[0]
    });
  };

  useEffect(() => {
    generatePreview();
  }, [config, teams]);

  const handleConfigChange = (key, value) => {
    setConfig(prev => {
      const updated = { ...prev, [key]: value };
      
      if (key === 'timePeriods' || key === 'stadiums') {
        const maxSlots = updated.timePeriods.length * updated.stadiums.length;
        if (updated.matchesPerRound > maxSlots) {
          updated.matchesPerRound = maxSlots;
        }
      }
      
      return updated;
    });
  };

  const handleWeekdayToggle = (weekday) => {
    setConfig(prev => ({
      ...prev,
      weekdays: prev.weekdays.includes(weekday)
        ? prev.weekdays.filter(w => w !== weekday)
        : [...prev.weekdays, weekday].sort((a, b) => {
            const order = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            return order.indexOf(a) - order.indexOf(b);
          })
    }));
  };

  const addTimeSlot = () => {
    setConfig(prev => ({
      ...prev,
      timePeriods: [...prev.timePeriods, '20:00']
    }));
  };

  const removeTimeSlot = (index) => {
    setConfig(prev => ({
      ...prev,
      timePeriods: prev.timePeriods.filter((_, i) => i !== index)
    }));
  };

  const updateTimeSlot = (index, value) => {
    setConfig(prev => ({
      ...prev,
      timePeriods: prev.timePeriods.map((time, i) => i === index ? value : time)
    }));
  };

  const addStadium = () => {
    setConfig(prev => ({
      ...prev,
      stadiums: [...prev.stadiums, 'New Stadium']
    }));
  };

  const removeStadium = (index) => {
    setConfig(prev => ({
      ...prev,
      stadiums: prev.stadiums.filter((_, i) => i !== index)
    }));
  };

  const updateStadium = (index, value) => {
    setConfig(prev => ({
      ...prev,
      stadiums: prev.stadiums.map((stadium, i) => i === index ? value : stadium)
    }));
  };

  const handleGenerate = async () => {
    if (config.weekdays.length === 0) {
      alert('Please select at least one weekday');
      return;
    }
    
    if (config.timePeriods.length === 0) {
      alert('Please add at least one time slot');
      return;
    }

    if (config.stadiums.length === 0) {
      alert('Please add at least one stadium');
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/matches/generate-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          leagueId: selectedLeague,
          ...config
        })
      });

      if (response.ok) {
        const result = await response.json();
        onScheduleGenerated(result);
        onClose();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Schedule generation failed');
      }
    } catch (error) {
      alert('Failed to generate schedule: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearSchedule = async () => {
    if (!confirm('Are you sure you want to clear all existing matches?')) return;
    
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/matches/clear-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          leagueId: selectedLeague
        })
      });

      if (response.ok) {
        const result = await response.json();
        onScheduleGenerated({ success: true, cleared: true, ...result });
        onClose();
      } else {
        throw new Error('Failed to clear schedule');
      }
    } catch (error) {
      alert('Failed to clear schedule: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-white">🎯 Enhanced Schedule Generator</h3>
                <p className="text-slate-400 text-sm">Create optimized tournament schedule with advanced options</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Tournament Format */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Tournament Format</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Format</label>
                <select
                  value={config.format}
                  onChange={(e) => handleConfigChange('format', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="single-round-robin">Single Round Robin</option>
                  <option value="double-round-robin">Double Round Robin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Start Date</label>
                <input
                  type="date"
                  value={config.startDate}
                  onChange={(e) => handleConfigChange('startDate', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Matches Per Round (Max {config.timePeriods.length * config.stadiums.length})</label>
              <input
                type="number"
                min="1"
                max={config.timePeriods.length * config.stadiums.length}
                value={config.matchesPerRound}
                onChange={(e) => handleConfigChange('matchesPerRound', parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Weekdays Selection */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Match Days</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {weekdayOptions.map(day => (
                <label key={day.value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.weekdays.includes(day.value)}
                    onChange={() => handleWeekdayToggle(day.value)}
                    className="w-5 h-5 text-orange-500 bg-slate-700 border-slate-600 rounded focus:ring-orange-500 focus:ring-2"
                  />
                  <span className="text-slate-300">{day.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Time Slots */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-white">Time Slots</h4>
              <button
                onClick={addTimeSlot}
                className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Time
              </button>
            </div>
            <div className="space-y-3">
              {config.timePeriods.map((time, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => updateTimeSlot(index, e.target.value)}
                    className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  {config.timePeriods.length > 1 && (
                    <button
                      onClick={() => removeTimeSlot(index)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Stadiums */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-white">Stadiums</h4>
              <button
                onClick={addStadium}
                className="flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Stadium
              </button>
            </div>
            <div className="space-y-3">
              {config.stadiums.map((stadium, index) => (
                <div key={index} className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={stadium}
                    onChange={(e) => updateStadium(index, e.target.value)}
                    className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Stadium name"
                  />
                  {config.stadiums.length > 1 && (
                    <button
                      onClick={() => removeStadium(index)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Stadium Distribution</label>
                <select
                  value={config.stadiumDistribution}
                  onChange={(e) => handleConfigChange('stadiumDistribution', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="rotate">Rotate Evenly</option>
                  <option value="primary">Prefer Primary Stadium</option>
                  <option value="random">Random Distribution</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Primary Stadium</label>
                <select
                  value={config.primaryStadium}
                  onChange={(e) => handleConfigChange('primaryStadium', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {config.stadiums.map(stadium => (
                    <option key={stadium} value={stadium}>{stadium}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Options</h4>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.deleteExisting}
                  onChange={(e) => handleConfigChange('deleteExisting', e.target.checked)}
                  className="w-5 h-5 text-orange-500 bg-slate-700 border-slate-600 rounded focus:ring-orange-500 focus:ring-2"
                />
                <span className="text-slate-300">Delete existing matches before generating</span>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.balanceVenues}
                  onChange={(e) => handleConfigChange('balanceVenues', e.target.checked)}
                  className="w-5 h-5 text-orange-500 bg-slate-700 border-slate-600 rounded focus:ring-orange-500 focus:ring-2"
                />
                <span className="text-slate-300">Balance home/away venues for teams</span>
              </label>
            </div>
          </div>

          {/* Preview */}
          {preview && (
            <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-white mb-4">📊 Schedule Preview</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-400">{teams.length}</div>
                  <div className="text-slate-400 text-sm">Teams</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-400">{preview.totalMatches}</div>
                  <div className="text-slate-400 text-sm">Total Matches</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-400">{preview.roundsNeeded}</div>
                  <div className="text-slate-400 text-sm">Rounds</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-400">{preview.weeksNeeded}</div>
                  <div className="text-slate-400 text-sm">Weeks Duration</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-slate-300 text-sm">
                  <strong>Estimated completion:</strong> {new Date(preview.estimatedEndDate).toLocaleDateString()}
                </p>
                <p className="text-slate-300 text-sm">
                  <strong>Match days:</strong> {config.weekdays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}
                </p>
                <p className="text-slate-300 text-sm">
                  <strong>Available slots per round:</strong> {config.timePeriods.length} times × {config.stadiums.length} stadiums = {config.timePeriods.length * config.stadiums.length} matches
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-slate-700">
            {currentMatches && currentMatches.length > 0 && (
              <button
                onClick={handleClearSchedule}
                disabled={isGenerating}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                🗑️ Clear Existing ({currentMatches.length})
              </button>
            )}
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || teams.length < 2 || config.weekdays.length === 0}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
            >
              {isGenerating ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Generating {preview?.totalMatches || 0} Matches...
                </div>
              ) : (
                `🚀 Generate ${preview?.totalMatches || 0} Matches`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  // Application State
  const [activeSection, setActiveSection] = useState('dashboard');
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [leagues, setLeagues] = useState([]);
  const [leagueData, setLeagueData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // Modal State
  const [modals, setModals] = useState({
    league: { open: false, data: null },
    team: { open: false, data: null },
    player: { open: false, data: null },
    match: { open: false, data: null },
    schedule: { open: false, data: null },
    admin: { open: false, data: null },
    passwordChange: { open: false, data: null }
  });

  // Navigation items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠', alwaysShow: true },
    { id: 'schedule', label: 'Schedule', icon: '📅', requiresLeague: true },
    { id: 'table', label: 'League Table', icon: '📊', requiresLeague: true },
    { id: 'teams', label: 'Teams', icon: '👥', requiresLeague: true },
    { id: 'statistics', label: 'Statistics', icon: '📈', requiresLeague: true },
    { id: 'live', label: 'Live', icon: '🔴', requiresLeague: true, requiresLive: true },
    { id: 'admin', label: 'Admin Users', icon: '🛡️', requiresAuth: true }
  ];

  // Show toast function
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  // Make showToast globally available
  useEffect(() => {
    window.showToast = showToast;
    return () => {
      delete window.showToast;
    };
  }, [showToast]);

  // API Functions
  const apiCall = useCallback(async (endpoint, options = {}) => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      
      const token = localStorage.getItem('adminToken');
      if (token && (options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE')) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers,
        ...options
      });

      if (response.status === 401) {
        handleLogout();
        return null;
      }
      
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return null;
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      return null;
    }
  }, []);

  // Admin Login Function
  const handleLogin = async (credentials) => {
    setIsLoginLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      if (response.ok) {
        const result = await response.json();
        setIsLoggedIn(true);
        setCurrentUser(result.user);
        localStorage.setItem('adminToken', result.token);
        localStorage.setItem('adminUser', JSON.stringify(result.user));
        setShowAdminLogin(false);
        await loadAdmins();
        showToast('Welcome back! Admin privileges enabled 🛡️', 'success');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    showToast('Logged out successfully', 'info');
  };

  // Modal Functions
  const openModal = (type, data = null) => {
    setModals(prev => ({
      ...prev,
      [type]: { open: true, data }
    }));
  };

  const closeModal = (type) => {
    setModals(prev => ({
      ...prev,
      [type]: { open: false, data: null }
    }));
  };

  // Load league data
  const loadLeagueData = useCallback(async (leagueId, silent = false) => {
    if (!leagueId) {
      setLeagueData(null);
      return;
    }

    setIsLoading(true);
    
    try {
      console.log(`📄 Loading league data for: ${leagueId}`);
      
      const [summary, matches, teams, players] = await Promise.all([
        apiCall(`/leagues/${leagueId}/summary`),
        apiCall(`/matches?league=${leagueId}`),
        apiCall(`/teams?leagueId=${leagueId}`),
        apiCall(`/players?leagueId=${leagueId}`)
      ]);

      if (summary) {
        const leagueDataObj = {
          league: summary.league,
          teams: teams || summary.teams || [],
          players: players || [],
          matches: matches || [],
          liveMatches: summary.liveMatches || [],
          admins: [],
          statistics: {
            totalTeams: teams?.length || 0,
            totalMatches: matches?.length || 0,
            liveCount: summary.liveMatches?.length || 0,
            finishedMatches: matches?.filter(m => m.status === 'finished').length || 0,
            scheduledMatches: matches?.filter(m => m.status === 'scheduled').length || 0,
            topScorers: players?.sort((a, b) => (b.stats?.goals || 0) - (a.stats?.goals || 0)).slice(0, 5) || []
          }
        };

        setLeagueData(leagueDataObj);
        console.log(`✅ League data loaded: ${matches?.length || 0} matches, ${teams?.length || 0} teams, ${players?.length || 0} players`);
      }
    } catch (error) {
      console.error('Failed to load league data:', error);
      showToast('Failed to load league data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [apiCall, showToast]);

  // Load leagues
  const loadLeagues = useCallback(async () => {
    try {
      const result = await apiCall('/leagues');
      if (result && result.length > 0) {
        setLeagues(result);
        return result;
      }
      return [];
    } catch (error) {
      console.error('Failed to load leagues:', error);
      return [];
    }
  }, [apiCall]);

  // Admin management functions
  const loadAdmins = async () => {
    try {
      const admins = await apiCall('/admin');
      setLeagueData(prev => ({ ...prev, admins: admins || [] }));
    } catch (error) {
      console.error('Failed to load admins:', error);
      showToast('Failed to load admin users: ' + error.message, 'error');
    }
  };

  const handleSaveAdmin = async (formData) => {
    try {
      setIsLoading(true);
      console.log('💾 Saving admin:', formData);
      
      const method = formData._id ? 'PUT' : 'POST';
      
      const result = await apiCall('/admin', {
        method,
        body: JSON.stringify(formData)
      });

      console.log('✅ Admin save result:', result);
      
      await loadAdmins();
      closeModal('admin');
      showToast(formData._id ? 'Admin updated successfully!' : 'Admin created successfully!');
      
    } catch (error) {
      console.error('Save admin error:', error);
      showToast('Failed to save admin: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (passwordData) => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(passwordData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Password change failed');
      }

      const result = await response.json();
      console.log('✅ Password changed successfully:', result);
      
      showToast('Password changed successfully!');
      
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Team Management Handlers
  const handleCreateTeam = () => {
    if (!isLoggedIn) {
      showToast('Please login to create teams', 'warning');
      return;
    }
    console.log('✅ Create team called');
    openModal('team', null);
  };

  const handleEditTeam = (team) => {
    if (!isLoggedIn) {
      showToast('Please login to edit teams', 'warning');
      return;
    }
    console.log('✅ Edit team called:', team);
    openModal('team', team);
  };

  const handleDeleteTeam = async (teamId) => {
    if (!isLoggedIn) {
      showToast('Please login to delete teams', 'warning');
      return;
    }

    if (!confirm('Are you sure you want to delete this team?')) return;

    try {
      await apiCall(`/teams?id=${teamId}`, { method: 'DELETE' });
      await loadLeagueData(selectedLeague);
      showToast('Team deleted successfully');
    } catch (error) {
      showToast('Failed to delete team: ' + error.message, 'error');
    }
  };

  // Player Management Handlers
  const handleCreatePlayer = async (playerData) => {
    if (!isLoggedIn) {
      showToast('Please login to create players', 'warning');
      return;
    }

    try {
      console.log('✅ Creating player:', playerData);
      
      const payload = {
        name: playerData.name,
        number: playerData.number,
        position: playerData.position,
        photo: playerData.photo,
        teamId: playerData.teamId,
        leagueId: selectedLeague,
        stats: playerData.stats || {
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          appearances: 0,
          minutesPlayed: 0
        }
      };

      await apiCall('/players', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      await loadLeagueData(selectedLeague);
      showToast('Player created successfully');
    } catch (error) {
      console.error('Failed to create player:', error);
      showToast('Failed to create player: ' + error.message, 'error');
      throw error;
    }
  };

  const handleEditPlayer = (player) => {
    if (!isLoggedIn) {
      showToast('Please login to edit players', 'warning');
      return;
    }
    console.log('✅ Edit player called:', player);
    openModal('player', player);
  };

  const handleDeletePlayer = async (playerId) => {
    if (!isLoggedIn) {
      showToast('Please login to delete players', 'warning');
      return;
    }

    if (!confirm('Are you sure you want to delete this player?')) return;

    try {
      await apiCall(`/players?id=${playerId}`, { method: 'DELETE' });
      await loadLeagueData(selectedLeague);
      showToast('Player deleted successfully');
    } catch (error) {
      showToast('Failed to delete player: ' + error.message, 'error');
    }
  };

  // Admin Functions
  const handleSaveLeague = async (formData) => {
    try {
      const method = formData._id ? 'PUT' : 'POST';
      await apiCall('/leagues', {
        method,
        body: JSON.stringify(formData)
      });

      await loadLeagues();
      closeModal('league');
      showToast(formData._id ? 'League updated!' : 'League created!');
    } catch (error) {
      showToast('Failed to save league', 'error');
    }
  };

  const handleSaveTeam = async (formData) => {
    try {
      const method = formData._id ? 'PUT' : 'POST';
      const payload = formData._id ? 
        { id: formData._id, ...formData } : 
        { ...formData, leagueId: selectedLeague };
      
      await apiCall('/teams', {
        method,
        body: JSON.stringify(payload)
      });

      await loadLeagueData(selectedLeague);
      closeModal('team');
      showToast(formData._id ? 'Team updated!' : 'Team created!');
    } catch (error) {
      showToast('Failed to save team', 'error');
    }
  };

  const handleSavePlayer = async (formData) => {
    try {
      const method = formData._id ? 'PUT' : 'POST';
      const payload = formData._id ? 
        { id: formData._id, ...formData } : 
        { ...formData, leagueId: selectedLeague };
      
      await apiCall('/players', {
        method,
        body: JSON.stringify(payload)
      });

      await loadLeagueData(selectedLeague);
      closeModal('player');
      showToast(formData._id ? 'Player updated!' : 'Player created!');
    } catch (error) {
      showToast('Failed to save player', 'error');
    }
  };

  const handleSaveMatch = async (formData) => {
    try {
      const method = formData._id ? 'PUT' : 'POST';
      const payload = formData._id ? 
        { id: formData._id, ...formData } : 
        { ...formData, leagueId: selectedLeague };
      
      await apiCall('/matches', {
        method,
        body: JSON.stringify(payload)
      });

      await loadLeagueData(selectedLeague);
      closeModal('match');
      showToast(formData._id ? 'Match updated!' : 'Match created!');
    } catch (error) {
      showToast('Failed to save match', 'error');
    }
  };

  // Schedule generation handler
  const handleScheduleGenerated = async (result) => {
    try {
      if (result.success) {
        await loadLeagueData(selectedLeague);
        closeModal('schedule');
        
        if (result.cleared) {
          showToast(`🗑️ Cleared ${result.matchesDeleted || 0} matches!`, 'success');
        } else {
          const matchCount = result.matchesCreated || 0;
          showToast(`✅ Generated ${matchCount} matches successfully!`, 'success');
        }
      } else {
        showToast('Failed to generate schedule', 'error');
      }
    } catch (error) {
      showToast('Failed to process schedule generation', 'error');
    }
  };

  // Admin actions for matches
  const handleEditMatch = (match) => {
    if (!isLoggedIn) {
      showToast('Please login to edit matches', 'warning');
      return;
    }
    openModal('match', match);
  };

  const handleDeleteMatch = async (matchId) => {
    if (!isLoggedIn) {
      showToast('Please login to delete matches', 'warning');
      return;
    }

    try {
      await apiCall(`/matches?id=${matchId}`, { method: 'DELETE' });
      await loadLeagueData(selectedLeague);
      showToast('Match deleted successfully');
    } catch (error) {
      showToast('Failed to delete match', 'error');
    }
  };

  const handleStartLiveMatch = async (matchId) => {
    if (!isLoggedIn) {
      showToast('Please login to start live matches', 'warning');
      return;
    }

    try {
      await apiCall('/matches/live', {
        method: 'POST',
        body: JSON.stringify({
          action: 'start_match',
          matchId: matchId
        })
      });

      await loadLeagueData(selectedLeague);
      showToast('Match is now live! 🔴', 'success');
    } catch (error) {
      showToast('Failed to start live match', 'error');
    }
  };

  const handleDeleteItem = async (type, id) => {
    if (!isLoggedIn) {
      showToast('Please login to delete items', 'warning');
      return;
    }

    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      if (type === 'admin') {
        await apiCall(`/admin?username=${id}`, { method: 'DELETE' });
        await loadAdmins();
      } else {
        await apiCall(`/${type}s?id=${id}`, { method: 'DELETE' });
        
        if (type === 'league') {
          await loadLeagues();
          if (selectedLeague === id) {
            setSelectedLeague('');
            setLeagueData(null);
          }
        } else {
          await loadLeagueData(selectedLeague);
        }
      }
      
      showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted!`);
    } catch (error) {
      showToast(`Failed to delete ${type}`, 'error');
    }
  };

  // Navigation
  const handleSectionChange = (section) => {
    setActiveSection(section);
    
    if (selectedLeague) {
      setTimeout(() => {
        loadLeagueData(selectedLeague);
      }, 100);
    }
  };

  const handleLeagueChange = (leagueId) => {
    setSelectedLeague(leagueId);
    if (leagueId) {
      loadLeagueData(leagueId);
    } else {
      setLeagueData(null);
    }
  };

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      
      const token = localStorage.getItem('adminToken');
      const user = localStorage.getItem('adminUser');
      
      if (token && user) {
        try {
          setIsLoggedIn(true);
          setCurrentUser(JSON.parse(user));
          await loadAdmins();
        } catch (error) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
        }
      }
      
      const loadedLeagues = await loadLeagues();
      
      if (loadedLeagues.length > 0 && !selectedLeague) {
        const firstLeague = loadedLeagues[0];
        setSelectedLeague(firstLeague._id);
        await loadLeagueData(firstLeague._id);
      }
      
      setIsLoading(false);
    };

    initializeApp();
  }, []);

  // Auto-refresh live matches
  useEffect(() => {
    if (leagueData?.liveMatches?.length > 0 || activeSection === 'live') {
      const interval = setInterval(() => {
        if (selectedLeague) {
          apiCall(`/leagues/${selectedLeague}/summary`).then(summary => {
            if (summary?.liveMatches) {
              setLeagueData(prev => ({
                ...prev,
                liveMatches: summary.liveMatches
              }));
            }
          });
        }
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [leagueData?.liveMatches, activeSection, selectedLeague, apiCall]);

  // Render sections with ALL required props
  const renderCurrentSection = () => {
    const commonProps = {
      teams: leagueData?.teams || [],
      players: leagueData?.players || [],
      matches: leagueData?.matches || [],
      liveMatches: leagueData?.liveMatches || [],
      selectedLeague,
      onRefresh: () => loadLeagueData(selectedLeague),
      isLoggedIn,
      onEditMatch: handleEditMatch,
      onDeleteMatch: handleDeleteMatch,
      onStartLiveMatch: handleStartLiveMatch
    };

    switch (activeSection) {
      case 'dashboard':
        return <Dashboard leagueData={leagueData} isLoading={isLoading} />;
      case 'schedule':
        return <Schedule {...commonProps} />;
      case 'table':
        return <LeagueTable {...commonProps} />;
      case 'teams':
        return (
          <Teams 
            {...commonProps}
            onCreateTeam={handleCreateTeam}
            onEditTeam={handleEditTeam}
            onDeleteTeam={handleDeleteTeam}
            onCreatePlayer={handleCreatePlayer}
            onEditPlayer={handleEditPlayer}
            onDeletePlayer={handleDeletePlayer}
          />
        );
      case 'statistics':
        return <Statistics {...commonProps} />;
      case 'live':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/30 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                Live Matches ({commonProps.liveMatches.length})
              </h2>
              {commonProps.liveMatches.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">⚽</div>
                  <h3 className="text-xl font-semibold text-white mb-2">No Live Matches</h3>
                  <p className="text-slate-400">
                    {isLoggedIn ? 'Start a match from the schedule to see live updates here' : 'Live matches will appear here when available'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {commonProps.liveMatches.map(match => (
                    <div key={match._id} className="bg-slate-800/50 rounded-xl p-6 border border-red-500/20">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-lg font-bold text-white">{match.homeTeam?.name || 'TBD'}</div>
                            <div className="text-3xl font-bold text-blue-400">{match.score?.home || 0}</div>
                          </div>
                          <div className="text-center px-4">
                            <div className="text-sm text-slate-400">VS</div>
                            <div className="text-lg font-bold text-white">-</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-white">{match.awayTeam?.name || 'TBD'}</div>
                            <div className="text-3xl font-bold text-red-400">{match.score?.away || 0}</div>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400">{match.liveData?.currentMinute || 0}'</div>
                          <div className="text-sm text-slate-400">{match.status === 'halftime' ? 'HALF TIME' : 'LIVE'}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case 'admin':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-white">Admin Management</h2>
                <p className="text-slate-400 mt-1">Manage admin users and permissions</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openModal('passwordChange')}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                >
                  <Key className="w-4 h-4" />
                  <span>Change Password</span>
                </button>
                <button
                  onClick={() => openModal('admin')}
                  className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Admin</span>
                </button>
              </div>
            </div>

            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-orange-400" />
                <h3 className="text-orange-400 font-bold text-lg">Security Notice</h3>
              </div>
              <p className="text-slate-300">
                Admin management allows you to control who has access to the administrative functions of the futsal league system. 
                Only grant admin access to trusted individuals.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                    Current User
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{currentUser?.username || 'admin'}</h3>
                <div className="space-y-1 text-sm text-slate-400 mb-4">
                  <p>Role: {currentUser?.role || 'Administrator'}</p>
                  <p>Status: Active</p>
                  {currentUser?.email && <p>Email: {currentUser.email}</p>}
                </div>
                <button
                  onClick={() => openModal('passwordChange')}
                  className="w-full flex items-center justify-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-lg transition-colors"
                >
                  <Key className="w-4 h-4" />
                  <span>Change Password</span>
                </button>
              </div>

              {leagueData?.admins && leagueData.admins.length > 0 && leagueData.admins
                .filter(admin => admin.username !== currentUser?.username)
                .map(admin => (
                <div key={admin._id} className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                      <UserPlus className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openModal('admin', admin)}
                        className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
                        title="Edit Admin"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem('admin', admin.username)}
                        className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
                        title="Delete Admin"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{admin.username}</h3>
                  <div className="space-y-1 text-sm text-slate-400">
                    <p>Role: {admin.role || 'Admin'}</p>
                    <p>Status: {admin.isActive ? 'Active' : 'Inactive'}</p>
                    {admin.email && <p>Email: {admin.email}</p>}
                    <p>Created: {new Date(admin.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}

              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 border-dashed hover:border-orange-500/50 transition-all duration-200">
                <button
                  onClick={() => openModal('admin')}
                  className="w-full h-full flex flex-col items-center justify-center text-center py-8"
                >
                  <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4">
                    <UserPlus className="w-6 h-6 text-orange-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Add New Admin</h3>
                  <p className="text-slate-400 text-sm">Create a new admin account with specific permissions</p>
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return <Dashboard leagueData={leagueData} isLoading={isLoading} />;
    }
  };

  return (
    <>
      <Layout
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        leagues={leagues}
        selectedLeague={selectedLeague}
        onLeagueChange={handleLeagueChange}
        liveMatchCount={leagueData?.liveMatches?.length || 0}
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        onLogout={handleLogout}
        onShowLogin={() => setShowAdminLogin(true)}
        navItems={navItems}
        onCreateLeague={() => openModal('league')}
        onCreateTeam={() => openModal('team')}
        onCreatePlayer={() => openModal('player')}
        onGenerateSchedule={() => openModal('schedule')}
      >
        {renderCurrentSection()}
      </Layout>

      <AdminLogin
        isOpen={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
        onLogin={handleLogin}
        isLoading={isLoginLoading}
      />

      <LeagueModal
        isOpen={modals.league.open}
        onClose={() => closeModal('league')}
        data={modals.league.data}
        onSave={handleSaveLeague}
      />

      <TeamModal
        isOpen={modals.team.open}
        onClose={() => closeModal('team')}
        data={modals.team.data}
        selectedLeague={selectedLeague}
        onSave={handleSaveTeam}
      />

      <PlayerModal
        isOpen={modals.player.open}
        onClose={() => closeModal('player')}
        data={modals.player.data}
        teams={leagueData?.teams || []}
        selectedLeague={selectedLeague}
        onSave={handleSavePlayer}
      />

      <MatchModal
        isOpen={modals.match.open}
        onClose={() => closeModal('match')}
        data={modals.match.data}
        teams={leagueData?.teams || []}
        selectedLeague={selectedLeague}
        onSave={handleSaveMatch}
      />

      <EnhancedScheduleGenerator
        isOpen={modals.schedule.open}
        onClose={() => closeModal('schedule')}
        teams={leagueData?.teams || []}
        selectedLeague={selectedLeague}
        onScheduleGenerated={handleScheduleGenerated}
        currentMatches={leagueData?.matches || []}
      />

      {/* Simple Admin Modal */}
      {modals.admin.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl max-w-2xl w-full border border-slate-700">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <Shield className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-white">Admin Management</h3>
                    <p className="text-slate-400 text-sm">Create or edit admin accounts</p>
                  </div>
                </div>
                <button onClick={() => closeModal('admin')} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-slate-300">Admin management functionality will be available here.</p>
              <div className="flex gap-3 pt-6 border-t border-slate-700 mt-6">
                <button
                  onClick={() => closeModal('admin')}
                  className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simple Password Change Modal */}
      {modals.passwordChange.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl max-w-md w-full border border-slate-700">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Key className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Change Password</h3>
                    <p className="text-slate-400 text-sm">Update your account password</p>
                  </div>
                </div>
                <button onClick={() => closeModal('passwordChange')} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-slate-300">Password change functionality will be available here.</p>
              <div className="flex gap-3 pt-6 border-t border-slate-700 mt-6">
                <button
                  onClick={() => closeModal('passwordChange')}
                  className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </>
  );
}