// ===========================================
// FILE: pages/admin/players.js (ERROR HANDLING FIX)
// ===========================================
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Plus, Edit, Trash2, User } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { calculateAge } from '../../lib/utils';

export default function AdminPlayers() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [players, setPlayers] = useState([]); // Initialize as empty array
  const [teams, setTeams] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }
    
    if (session.user.role !== 'admin') {
      router.push('/');
      return;
    }
    
    fetchSeasons();
  }, [session, status, router]);

  useEffect(() => {
    if (selectedSeason) {
      fetchTeams();
      fetchPlayers();
    }
  }, [selectedSeason, selectedTeam]);

  const fetchSeasons = async () => {
    try {
      const response = await fetch('/api/admin/seasons');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setSeasons(data);
        
        const activeSeason = data.find(s => s.isActive);
        if (activeSeason) {
          setSelectedSeason(activeSeason._id);
        } else if (data.length > 0) {
          setSelectedSeason(data[0]._id);
        }
      } else {
        console.error('Seasons data is not an array:', data);
        setSeasons([]);
        toast.error(data.message || 'Failed to fetch seasons');
      }
    } catch (error) {
      console.error('Error fetching seasons:', error);
      setSeasons([]);
      toast.error('Failed to fetch seasons');
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch(`/api/admin/teams?seasonId=${selectedSeason}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setTeams(data);
      } else {
        console.error('Teams data is not an array:', data);
        setTeams([]);
        toast.error(data.message || 'Failed to fetch teams');
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      setTeams([]);
      toast.error('Failed to fetch teams');
    }
  };

  const fetchPlayers = async () => {
    try {
      setIsLoading(true);
      let url = `/api/admin/players?seasonId=${selectedSeason}`;
      if (selectedTeam) url += `&teamId=${selectedTeam}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setPlayers(data);
      } else {
        console.error('Players data is not an array:', data);
        setPlayers([]);
        toast.error(data.message || 'Failed to fetch players');
      }
    } catch (error) {
      console.error('Error fetching players:', error);
      setPlayers([]);
      toast.error('Failed to fetch players');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPlayer = () => {
    setEditingPlayer(null);
    setShowModal(true);
  };

  const handleEditPlayer = (player) => {
    setEditingPlayer(player);
    setShowModal(true);
  };

  const handleDeletePlayer = async (playerId) => {
    if (!confirm('Are you sure you want to delete this player?')) return;

    try {
      const response = await fetch(`/api/admin/players?id=${playerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Player deleted successfully');
        fetchPlayers();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to delete player');
      }
    } catch (error) {
      console.error('Error deleting player:', error);
      toast.error('Failed to delete player');
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
        <h1 className="text-3xl font-bold text-gray-900">Manage Players</h1>
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
          <button onClick={handleAddPlayer} className="btn btn-primary flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Add Player
          </button>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Photo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jersey #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Goals</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {players.map((player) => (
                <tr key={player._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {player.photo?.url ? (
                      <img
                        src={player.photo.url}
                        alt={`${player.firstName} ${player.lastName}`}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {player.firstName} {player.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{player.nationality}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{player.position}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {player.currentTeam?.name || 'Free Agent'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-blue-600">
                      {player.jerseyNumber ? `#${player.jerseyNumber}` : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {calculateAge(player.dateOfBirth)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-green-600">
                      {player.stats?.goals || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditPlayer(player)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePlayer(player._id)}
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

        {players.length === 0 && (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No players found</h3>
            <p className="text-gray-500">Get started by registering your first player.</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingPlayer ? 'Edit Player' : 'Add New Player'}
        size="lg"
      >
        <PlayerForm
          player={editingPlayer}
          teams={teams}
          seasons={seasons}
          selectedSeason={selectedSeason}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchPlayers();
          }}
        />
      </Modal>
    </div>
  );
}

// Player Form Component (same as before but with better error handling)
function PlayerForm({ player, teams, seasons, selectedSeason, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    firstName: player?.firstName || '',
    lastName: player?.lastName || '',
    dateOfBirth: player?.dateOfBirth ? player.dateOfBirth.split('T')[0] : '',
    nationality: player?.nationality || '',
    position: player?.position || 'Forward',
    jerseyNumber: player?.jerseyNumber || '',
    currentTeam: player?.currentTeam?._id || '',
    season: player?.season?._id || selectedSeason,
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const positions = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let photoData = player?.photo;

      // Upload photo if new file selected
      if (photoFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', photoFile);
        uploadFormData.append('folder', 'players');

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          photoData = uploadData.data;
        }
      }

      const method = player ? 'PUT' : 'POST';
      const body = player 
        ? { ...formData, id: player._id, photo: photoData }
        : { ...formData, photo: photoData };

      const response = await fetch('/api/admin/players', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(player ? 'Player updated successfully' : 'Player created successfully');
        onSuccess();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Form submit error:', error);
      toast.error('Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">First Name *</label>
          <input
            type="text"
            className="form-input"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Last Name *</label>
          <input
            type="text"
            className="form-input"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Photo</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPhotoFile(e.target.files[0])}
          className="form-input"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">Date of Birth *</label>
          <input
            type="date"
            className="form-input"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Nationality *</label>
          <input
            type="text"
            className="form-input"
            value={formData.nationality}
            onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="form-group">
          <label className="form-label">Position *</label>
          <select
            className="form-input"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            required
          >
            {positions.map(position => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Jersey Number</label>
          <input
            type="number"
            min="1"
            max="99"
            className="form-input"
            value={formData.jerseyNumber}
            onChange={(e) => setFormData({ ...formData, jerseyNumber: e.target.value })}
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

      <div className="form-group">
        <label className="form-label">Current Team</label>
        <select
          className="form-input"
          value={formData.currentTeam}
          onChange={(e) => setFormData({ ...formData, currentTeam: e.target.value })}
        >
          <option value="">Free Agent</option>
          {teams.map(team => (
            <option key={team._id} value={team._id}>
              {team.name}
            </option>
          ))}
        </select>
        <p className="text-sm text-gray-600 mt-1">
          Players can be registered without a team and assigned later.
        </p>
      </div>

      <div className="flex justify-end space-x-4">
        <button type="button" onClick={onClose} className="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className="btn btn-primary">
          {isSubmitting ? 'Saving...' : player ? 'Update Player' : 'Register Player'}
        </button>
      </div>
    </form>
  );
}
