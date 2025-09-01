import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Plus, Edit, Trash2, Upload } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function AdminTeams() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [teams, setTeams] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'admin') {
      router.push('/');
      return;
    }
    fetchSeasons();
  }, [session, status, router]);

  useEffect(() => {
    if (selectedSeason) {
      fetchTeams();
    }
  }, [selectedSeason]);

  const fetchSeasons = async () => {
    try {
      const response = await fetch('/api/admin/seasons');
      const data = await response.json();
      setSeasons(data);
      
      const activeSeason = data.find(s => s.isActive);
      if (activeSeason) {
        setSelectedSeason(activeSeason._id);
      } else if (data.length > 0) {
        setSelectedSeason(data[0]._id);
      }
    } catch (error) {
      toast.error('Failed to fetch seasons');
    }
  };

  const fetchTeams = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/teams?seasonId=${selectedSeason}`);
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      toast.error('Failed to fetch teams');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTeam = () => {
    setEditingTeam(null);
    setShowModal(true);
  };

  const handleEditTeam = (team) => {
    setEditingTeam(team);
    setShowModal(true);
  };

  const handleDeleteTeam = async (teamId) => {
    if (!confirm('Are you sure you want to delete this team?')) return;

    try {
      const response = await fetch(`/api/admin/teams?id=${teamId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Team deleted successfully');
        fetchTeams();
      } else {
        toast.error('Failed to delete team');
      }
    } catch (error) {
      toast.error('Failed to delete team');
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Manage Teams</h1>
        <div className="flex space-x-4">
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="form-input w-48"
          >
            {seasons.map(season => (
              <option key={season._id} value={season._id}>
                {season.name} {season.isActive && '(Active)'}
              </option>
            ))}
          </select>
          <button onClick={handleAddTeam} className="btn btn-primary flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Add Team
          </button>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Logo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manager</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Players</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {teams.map((team) => (
                <tr key={team._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {team.logo?.url ? (
                      <img
                        src={team.logo.url}
                        alt={team.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">
                          {team.name?.charAt(0) || 'T'}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{team.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{team.manager || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{team.playerCount || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{team.stats?.points || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditTeam(team)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTeam(team._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {teams.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No teams found</h3>
            <p className="text-gray-500">Get started by creating your first team.</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingTeam ? 'Edit Team' : 'Add New Team'}
        size="md"
      >
        <TeamForm
          team={editingTeam}
          seasons={seasons}
          selectedSeason={selectedSeason}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchTeams();
          }}
        />
      </Modal>
    </div>
  );
}

// Team Form Component
function TeamForm({ team, seasons, selectedSeason, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: team?.name || '',
    manager: team?.manager || '',
    description: team?.description || '',
    homeColor: team?.homeColor || '#ffffff',
    awayColor: team?.awayColor || '#000000',
    contact: {
      email: team?.contact?.email || '',
      phone: team?.contact?.phone || '',
    },
    season: team?.season?._id || selectedSeason,
  });
  const [logoFile, setLogoFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let logoData = team?.logo;

      // Upload logo if new file selected
      if (logoFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', logoFile);
        uploadFormData.append('folder', 'teams');

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          logoData = uploadData.data;
        }
      }

      const method = team ? 'PUT' : 'POST';
      const body = team 
        ? { ...formData, id: team._id, logo: logoData }
        : { ...formData, logo: logoData };

      const response = await fetch('/api/admin/teams', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(team ? 'Team updated successfully' : 'Team created successfully');
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-group">
        <label className="form-label">Team Name *</label>
        <input
          type="text"
          className="form-input"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Logo</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setLogoFile(e.target.files[0])}
          className="form-input"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">Manager</label>
          <input
            type="text"
            className="form-input"
            value={formData.manager}
            onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
          />
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">Home Kit Color</label>
          <input
            type="color"
            className="form-input"
            value={formData.homeColor}
            onChange={(e) => setFormData({ ...formData, homeColor: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Away Kit Color</label>
          <input
            type="color"
            className="form-input"
            value={formData.awayColor}
            onChange={(e) => setFormData({ ...formData, awayColor: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">Contact Email</label>
          <input
            type="email"
            className="form-input"
            value={formData.contact.email}
            onChange={(e) => setFormData({
              ...formData,
              contact: { ...formData.contact, email: e.target.value }
            })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Contact Phone</label>
          <input
            type="tel"
            className="form-input"
            value={formData.contact.phone}
            onChange={(e) => setFormData({
              ...formData,
              contact: { ...formData.contact, phone: e.target.value }
            })}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea
          className="form-input"
          rows="3"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="flex justify-end space-x-4">
        <button type="button" onClick={onClose} className="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className="btn btn-primary">
          {isSubmitting ? 'Saving...' : team ? 'Update Team' : 'Create Team'}
        </button>
      </div>
    </form>
  );
}
