// ===========================================
// FILE: pages/admin/fairplay.js (NEW - Fair Play Management Page)
// ===========================================
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Plus, Edit, Trash2, Award, AlertTriangle, Users, User, Calendar, Filter } from 'lucide-react';
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
  }, [selectedSeason, selectedTeam, statusFilter]);

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
      
      if (selectedSeason) params.append('seasonId', selectedSeason);
      if (selectedTeam) params.append('teamId', selectedTeam);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setFairPlayRecords(Array.isArray(data) ? data : []);
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

      {/* Filters */}
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
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
          <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900">
            {fairPlayRecords.filter(r => !r.player).length}
          </h3>
          <p className="text-gray-600">Team Penalties</p>
        </div>
        
        <div className="card text-center">
          <User className="w-12 h-12 text-purple-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900">
            {fairPlayRecords.filter(r => r.player).length}
          </h3>
          <p className="text-gray-600">Player Penalties</p>
        </div>
      </div>

      {/* Records Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team/Player</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Points</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {fairPlayRecords.map((record) => (
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
                        {record.player ? (
                          <div className="text-sm text-blue-600">
                            👤 {record.player.name}
                          </div>
                        ) : (
                          <div className="text-sm text-purple-600">
                            👥 Team Penalty
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {getActionTypeDisplay(record.actionType)}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
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
              ))}
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
        <FairPlayForm
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

// Fair Play Form Component
function FairPlayForm({ record, teams, seasons, selectedSeason, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    team: record?.team?._id || '',
    player: record?.player?._id || '',
    season: record?.season?._id || selectedSeason,
    actionType: record?.actionType || 'other',
    points: record?.points || 5,
    description: record?.description || '',
    actionDate: record?.actionDate ? format(new Date(record.actionDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    reference: record?.reference || '',
    status: record?.status || 'active'
  });
  
  const [players, setPlayers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch players when team changes
  useEffect(() => {
    if (formData.team) {
      fetchTeamPlayers(formData.team);
    } else {
      setPlayers([]);
    }
  }, [formData.team]);

  const fetchTeamPlayers = async (teamId) => {
    try {
      const response = await fetch(`/api/admin/players?teamId=${teamId}`);
      if (response.ok) {
        const data = await response.json();
        setPlayers(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const method = record ? 'PUT' : 'POST';
      const body = record 
        ? { ...formData, id: record._id, player: formData.player || null }
        : { ...formData, player: formData.player || null };

      const response = await fetch('/api/admin/fairplay', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(record ? 'Record updated successfully' : 'Record created successfully');
        onSuccess();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const actionTypes = [
    { value: 'violent_conduct', label: 'Violent Conduct' },
    { value: 'serious_foul_play', label: 'Serious Foul Play' },
    { value: 'offensive_language', label: 'Offensive Language' },
    { value: 'dissent_by_word_action', label: 'Dissent by Word/Action' },
    { value: 'unsporting_behavior', label: 'Unsporting Behavior' },
    { value: 'referee_abuse', label: 'Referee Abuse' },
    { value: 'crowd_trouble', label: 'Crowd Trouble' },
    { value: 'administrative_breach', label: 'Administrative Breach' },
    { value: 'misconduct_off_field', label: 'Misconduct Off-Field' },
    { value: 'suspended_player_participated', label: 'Suspended Player Participated' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Team and Season */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">Team *</label>
          <select
            className="form-input"
            value={formData.team}
            onChange={(e) => setFormData({ ...formData, team: e.target.value, player: '' })}
            required
          >
            <option value="">Select Team</option>
            {teams.map(team => (
              <option key={team._id} value={team._id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Season *</label>
          <select
            className="form-input"
            value={formData.season}
            onChange={(e) => setFormData({ ...formData, season: e.target.value })}
            required
          >
            {seasons.map(season => (
              <option key={season._id} value={season._id}>
                {season.name} {season.isActive && '(Active)'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Player (Optional) */}
      <div className="form-group">
        <label className="form-label">Player (Optional - leave blank for team penalty)</label>
        <select
          className="form-input"
          value={formData.player}
          onChange={(e) => setFormData({ ...formData, player: e.target.value })}
        >
          <option value="">Team Penalty (No specific player)</option>
          {players.map(player => (
            <option key={player._id} value={player._id}>
              {player.name} #{player.jerseyNumber || 'N/A'}
            </option>
          ))}
        </select>
      </div>

      {/* Action Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">Action Type *</label>
          <select
            className="form-input"
            value={formData.actionType}
            onChange={(e) => setFormData({ ...formData, actionType: e.target.value })}
            required
          >
            {actionTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Fair Play Points *</label>
          <input
            type="number"
            min="1"
            max="100"
            className="form-input"
            value={formData.points}
            onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 1 })}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Higher points = worse disciplinary record
          </p>
        </div>
      </div>

      {/* Date and Reference */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">Action Date *</label>
          <input
            type="date"
            className="form-input"
            value={formData.actionDate}
            onChange={(e) => setFormData({ ...formData, actionDate: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Reference Number</label>
          <input
            type="text"
            className="form-input"
            value={formData.reference}
            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
            placeholder="Case/incident reference"
          />
        </div>
      </div>

      {/* Description */}
      <div className="form-group">
        <label className="form-label">Description *</label>
        <textarea
          className="form-input"
          rows="3"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          placeholder="Detailed description of the disciplinary action..."
          maxLength={500}
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.description.length}/500 characters
        </p>
      </div>

      {/* Status (if editing) */}
      {record && (
        <div className="form-group">
          <label className="form-label">Status</label>
          <select
            className="form-input"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="active">Active</option>
            <option value="appealed">Appealed</option>
            <option value="overturned">Overturned</option>
            <option value="reduced">Reduced</option>
          </select>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-4 pt-4 border-t">
        <button type="button" onClick={onClose} className="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className="btn btn-primary">
          {isSubmitting ? 'Saving...' : record ? 'Update Record' : 'Create Record'}
        </button>
      </div>
    </form>
  );
}
