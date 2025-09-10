// ===========================================
// FILE: pages/admin/fairplay.js (UPDATED WITH OFFICIAL SUPPORT)
// ===========================================
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Plus, Edit, Trash2, Award, AlertTriangle, Users, User, Calendar, Filter, Shield } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function AdminFairPlay() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State management
  const [fairPlayRecords, setFairPlayRecords] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  
  // Filters
  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all'); // NEW: Filter by subject type

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'admin') {
      router.push('/');
      return;
    }
    
    fetchInitialData();
  }, [session, status, router]);

  useEffect(() => {
    if (selectedSeason) {
      fetchFairPlayRecords();
    }
  }, [selectedSeason, selectedTeam, statusFilter, subjectFilter]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all required data
      const [seasonsRes, teamsRes] = await Promise.all([
        fetch('/api/admin/seasons'),
        fetch('/api/admin/teams')
      ]);

      if (seasonsRes.ok) {
        const seasonsData = await seasonsRes.json();
        setSeasons(Array.isArray(seasonsData) ? seasonsData : []);
        
        // Set active season as default
        const activeSeason = seasonsData.find(s => s.isActive);
        if (activeSeason) {
          setSelectedSeason(activeSeason._id);
        }
      }

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(Array.isArray(teamsData) ? teamsData : []);
      }

    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load initial data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFairPlayRecords = async () => {
    try {
      setIsLoading(true);
      
      let url = '/api/admin/fairplay';
      const params = new URLSearchParams();
      
      if (selectedSeason) params.append('season', selectedSeason);
      if (selectedTeam) params.append('team', selectedTeam);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (subjectFilter !== 'all') params.append('subjectType', subjectFilter);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        // Handle both array and object responses
        const records = data.records || (Array.isArray(data) ? data : []);
        setFairPlayRecords(records);
      } else {
        console.error('Failed to fetch fair play records');
        setFairPlayRecords([]);
      }
      
    } catch (error) {
      console.error('Error fetching fair play records:', error);
      setFairPlayRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRecord = () => {
    setEditingRecord(null);
    setShowModal(true);
  };

  const handleEditRecord = (record) => {
    setEditingRecord(record);
    setShowModal(true);
  };

  const handleDeleteRecord = async (recordId) => {
    if (!confirm('Are you sure you want to delete this fair play record? This will affect team standings.')) return;

    try {
      const response = await fetch(`/api/admin/fairplay?id=${recordId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Fair play record deleted successfully');
        fetchFairPlayRecords();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to delete record');
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Failed to delete record');
    }
  };

  const getActionTypeDisplay = (actionType) => {
    const types = {
      violent_conduct: 'Violent Conduct',
      serious_foul_play: 'Serious Foul Play',
      offensive_language: 'Offensive Language',
      dissent_by_word_action: 'Dissent by Word/Action',
      unsporting_behavior: 'Unsporting Behavior',
      referee_abuse: 'Referee Abuse',
      crowd_trouble: 'Crowd Trouble',
      administrative_breach: 'Administrative Breach',
      misconduct_off_field: 'Misconduct Off-Field',
      suspended_player_participated: 'Suspended Player Participated',
      other: 'Other'
    };
    return types[actionType] || actionType;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800';
      case 'appealed': return 'bg-yellow-100 text-yellow-800';
      case 'overturned': return 'bg-green-100 text-green-800';
      case 'reduced': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // ENHANCED: Get subject display with official support
  const getSubjectDisplay = (record) => {
    if (record.isOfficial && record.customName) {
      return {
        name: record.customName,
        type: 'Official',
        icon: '🏛️',
        color: 'text-purple-600'
      };
    }
    if (record.player) {
      return {
        name: record.player.name,
        type: 'Player',
        icon: '👤',
        color: 'text-blue-600'
      };
    }
    return {
      name: 'Team Penalty',
      type: 'Team',
      icon: '👥',
      color: 'text-gray-600'
    };
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!session || session.user.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fair Play Management</h1>
          <p className="text-gray-600 mt-1">Manage disciplinary actions and fair play points</p>
        </div>
        <button
          onClick={handleAddRecord}
          className="btn btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Disciplinary Action
        </button>
      </div>

      {/* Enhanced Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
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
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-input w-40"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="appealed">Appealed</option>
            <option value="overturned">Overturned</option>
            <option value="reduced">Reduced</option>
          </select>

          {/* NEW: Subject filter */}
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="form-input w-40"
          >
            <option value="all">All Subjects</option>
            <option value="player">Players</option>
            <option value="official">Officials</option>
            <option value="team">Team</option>
          </select>
        </div>
      </div>

      {/* Enhanced Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="card text-center">
          <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900">
            {fairPlayRecords.filter(r => r.status === 'active').length}
          </h3>
          <p className="text-gray-600">Active Records</p>
        </div>
        
        <div className="card text-center">
          <Award className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900">
            {fairPlayRecords.filter(r => r.status === 'active').reduce((sum, r) => sum + r.points, 0)}
          </h3>
          <p className="text-gray-600">Total Active Points</p>
        </div>
        
        <div className="card text-center">
          <User className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900">
            {fairPlayRecords.filter(r => r.player && !r.isOfficial).length}
          </h3>
          <p className="text-gray-600">Player Penalties</p>
        </div>

        {/* NEW: Official penalties */}
        <div className="card text-center">
          <Shield className="w-12 h-12 text-purple-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900">
            {fairPlayRecords.filter(r => r.isOfficial).length}
          </h3>
          <p className="text-gray-600">Official Penalties</p>
        </div>
        
        <div className="card text-center">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900">
            {fairPlayRecords.filter(r => !r.player && !r.isOfficial).length}
          </h3>
          <p className="text-gray-600">Team Penalties</p>
        </div>
      </div>

      {/* Enhanced Records Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team/Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Points</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {fairPlayRecords.map((record) => {
                const subject = getSubjectDisplay(record);
                return (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(record.actionDate), 'MMM dd, yyyy')}
                      </div>
                      {record.reference && (
                        <div className="text-xs text-gray-500">Ref: {record.reference}</div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div>
                          <div className="font-medium text-gray-900">
                            {record.team?.name}
                          </div>
                          <div className={`text-sm ${subject.color} flex items-center`}>
                            <span className="mr-1">{subject.icon}</span>
                            {subject.name}
                            <span className="ml-1 text-xs text-gray-500">({subject.type})</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getActionTypeDisplay(record.actionType)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={record.description}>
                        {record.description}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-800">
                        +{record.points}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditRecord(record)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Record"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRecord(record._id)}
                        className="text-red-600 hover:text-red-900 ml-2"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {fairPlayRecords.length === 0 && (
          <div className="text-center py-12">
            <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Fair Play Records</h3>
            <p className="text-gray-500">No disciplinary actions have been recorded yet.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingRecord ? 'Edit Disciplinary Action' : 'Add Disciplinary Action'}
        size="lg"
      >
        <EnhancedFairPlayForm
          record={editingRecord}
          teams={teams}
          seasons={seasons}
          selectedSeason={selectedSeason}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchFairPlayRecords();
          }}
        />
      </Modal>
    </div>
  );
}

// ENHANCED Fair Play Form Component with Official Support
function EnhancedFairPlayForm({ record, teams, seasons, selectedSeason, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    team: record?.team?._id || '',
    player: record?.player?._id || '',
    customName: record?.customName || '',
    isOfficial: record?.isOfficial || false,
    season: record?.season?._id || selectedSeason,
    actionType: record?.actionType || 'other',
    points: record?.points || 5,
    description: record?.description || '',
    actionDate: record?.actionDate ? 
      format(new Date(record.actionDate), 'yyyy-MM-dd') : 
      format(new Date(), 'yyyy-MM-dd'),
    reference: record?.reference || '',
    status: record?.status || 'active'
  });
  
  const [teamPlayers, setTeamPlayers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Fetch team players when team changes
  useEffect(() => {
    if (formData.team && !formData.isOfficial) {
      fetchTeamPlayers();
    }
  }, [formData.team, formData.isOfficial]);

  const fetchTeamPlayers = async () => {
    try {
      const response = await fetch(`/api/admin/players?teamId=${formData.team}&status=active`);
      if (response.ok) {
        const players = await response.json();
        setTeamPlayers(Array.isArray(players) ? players : []);
      }
    } catch (error) {
      console.error('Error fetching team players:', error);
      setTeamPlayers([]);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    // Special handling for official toggle
    if (field === 'isOfficial') {
      setFormData(prev => ({
        ...prev,
        player: '', // Clear player selection
        customName: value ? prev.customName : '' // Clear custom name if not official
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.team) {
      errors.team = 'Team is required';
    }

    if (!formData.isOfficial && !formData.player) {
      errors.player = 'Player is required when not an official';
    }

    if (formData.isOfficial && !formData.customName.trim()) {
      errors.customName = 'Official name is required';
    }

    if (!formData.season) {
      errors.season = 'Season is required';
    }

    if (!formData.actionType) {
      errors.actionType = 'Action type is required';
    }

    if (!formData.points || formData.points < 1) {
      errors.points = 'Points must be at least 1';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    if (!formData.actionDate) {
      errors.actionDate = 'Action date is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        ...formData,
        // Only include player if not official
        player: formData.isOfficial ? null : formData.player,
        // Only include customName if official
        customName: formData.isOfficial ? formData.customName.trim() : null
      };

      const url = record 
        ? `/api/admin/fairplay?id=${record._id}`
        : '/api/admin/fairplay';
      
      const method = record ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(record ? 'Fair play record updated successfully' : 'Fair play record created successfully');
        onSuccess();
      } else {
        toast.error(data.message || 'Failed to save fair play record');
      }
    } catch (error) {
      console.error('Error saving fair play record:', error);
      toast.error('Failed to save fair play record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const actionTypes = {
    violent_conduct: 'Violent Conduct',
    serious_foul_play: 'Serious Foul Play',
    offensive_language: 'Offensive Language',
    dissent_by_word_action: 'Dissent by Word/Action',
    unsporting_behavior: 'Unsporting Behavior',
    referee_abuse: 'Referee Abuse',
    crowd_trouble: 'Crowd Trouble',
    administrative_breach: 'Administrative Breach',
    misconduct_off_field: 'Misconduct Off-Field',
    suspended_player_participated: 'Suspended Player Participated',
    other: 'Other'
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Target Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Team *
          </label>
          <select
            value={formData.team}
            onChange={(e) => handleInputChange('team', e.target.value)}
            className={`form-input w-full ${validationErrors.team ? 'border-red-500' : ''}`}
            required
          >
            <option value="">Select Team</option>
            {teams.map(team => (
              <option key={team._id} value={team._id}>
                {team.name}
              </option>
            ))}
          </select>
          {validationErrors.team && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.team}</p>
          )}
        </div>

        {/* Season Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Season *
          </label>
          <select
            value={formData.season}
            onChange={(e) => handleInputChange('season', e.target.value)}
            className={`form-input w-full ${validationErrors.season ? 'border-red-500' : ''}`}
            required
          >
            <option value="">Select Season</option>
            {seasons.map(season => (
              <option key={season._id} value={season._id}>
                {season.name} {season.isActive && '(Active)'}
              </option>
            ))}
          </select>
          {validationErrors.season && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.season}</p>
          )}
        </div>
      </div>

      {/* Subject Type Toggle */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Subject of Disciplinary Action *
        </label>
        
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => handleInputChange('isOfficial', false)}
            className={`flex items-center px-4 py-2 rounded-lg border ${
              !formData.isOfficial 
                ? 'bg-blue-50 border-blue-500 text-blue-700' 
                : 'bg-gray-50 border-gray-300 text-gray-700'
            }`}
          >
            <User className="w-4 h-4 mr-2" />
            Player
          </button>
          
          <button
            type="button"
            onClick={() => handleInputChange('isOfficial', true)}
            className={`flex items-center px-4 py-2 rounded-lg border ${
              formData.isOfficial 
                ? 'bg-purple-50 border-purple-500 text-purple-700' 
                : 'bg-gray-50 border-gray-300 text-gray-700'
            }`}
          >
            <Shield className="w-4 h-4 mr-2" />
            Official/Other
          </button>
        </div>
      </div>

      {/* Player/Official Selection */}
      {!formData.isOfficial ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Player *
          </label>
          {!formData.team ? (
            <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
              Please select a team first to view players
            </div>
          ) : teamPlayers.length === 0 ? (
            <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
              No active players found for this team
            </div>
          ) : (
            <select
              value={formData.player}
              onChange={(e) => handleInputChange('player', e.target.value)}
              className={`form-input w-full ${validationErrors.player ? 'border-red-500' : ''}`}
              required
            >
              <option value="">Select Player</option>
              {teamPlayers.map(player => (
                <option key={player._id} value={player._id}>
                  {player.name} (#{player.jerseyNumber}) - {player.position}
                </option>
              ))}
            </select>
          )}
          {validationErrors.player && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.player}</p>
          )}
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Official/Other Name *
          </label>
          <input
            type="text"
            value={formData.customName}
            onChange={(e) => handleInputChange('customName', e.target.value)}
            placeholder="Enter official name (e.g., Referee John Doe, Coach Smith, etc.)"
            className={`form-input w-full ${validationErrors.customName ? 'border-red-500' : ''}`}
            required
          />
          {validationErrors.customName && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.customName}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Use this for match officials, coaches, or other non-player personnel
          </p>
        </div>
      )}

      {/* Action Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Action Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Action Type *
          </label>
          <select
            value={formData.actionType}
            onChange={(e) => handleInputChange('actionType', e.target.value)}
            className={`form-input w-full ${validationErrors.actionType ? 'border-red-500' : ''}`}
            required
          >
            <option value="">Select Action Type</option>
            {Object.entries(actionTypes).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          {validationErrors.actionType && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.actionType}</p>
          )}
        </div>

        {/* Points */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fair Play Points *
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={formData.points}
            onChange={(e) => handleInputChange('points', parseInt(e.target.value) || '')}
            className={`form-input w-full ${validationErrors.points ? 'border-red-500' : ''}`}
            required
          />
          {validationErrors.points && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.points}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Higher points = worse penalty (e.g., Yellow = 1, Red = 3, Violent Conduct = 5+)
          </p>
        </div>
      </div>

      {/* Date and Reference */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Action Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Action Date *
          </label>
          <input
            type="date"
            value={formData.actionDate}
            onChange={(e) => handleInputChange('actionDate', e.target.value)}
            className={`form-input w-full ${validationErrors.actionDate ? 'border-red-500' : ''}`}
            required
          />
          {validationErrors.actionDate && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.actionDate}</p>
          )}
        </div>

        {/* Reference */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reference Number
          </label>
          <input
            type="text"
            value={formData.reference}
            onChange={(e) => handleInputChange('reference', e.target.value)}
            placeholder="Case/incident reference (optional)"
            className="form-input w-full"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Detailed description of the incident and disciplinary action taken..."
          rows={4}
          maxLength={500}
          className={`form-input w-full ${validationErrors.description ? 'border-red-500' : ''}`}
          required
        />
        {validationErrors.description && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          {formData.description.length}/500 characters
        </p>
      </div>

      {/* Status (if editing) */}
      {record && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
            className="form-input w-full"
          >
            <option value="active">Active</option>
            <option value="appealed">Appealed</option>
            <option value="overturned">Overturned</option>
            <option value="reduced">Reduced</option>
          </select>
        </div>
      )}

      {/* Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Important Notice</p>
            <p>
              This disciplinary action will affect team standings and fair play rankings. 
              {formData.isOfficial && ' Official misconduct reflects on the team\'s fair play record.'}
              {!formData.isOfficial && ' Player cards and misconduct contribute to team fair play points.'}
            </p>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <button
          type="button"
          onClick={onClose}
          className="btn btn-secondary"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              {record ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            record ? 'Update Record' : 'Create Record'
          )}
        </button>
      </div>
    </form>
  );
}
