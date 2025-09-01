// ===========================================
// FILE: pages/admin/players.js (COMPLETE WITH FORM)
// ===========================================
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Plus, Edit, Trash2, User } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
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

export default function AdminPlayers() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [players, setPlayers] = useState([]);
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
      
      if (Array.isArray(data)) {
        setPlayers(data);
        
        // Debug player photo data
        console.log('Admin players photo debug:', data.slice(0, 3).map(p => ({
          name: p.name,
          photo: p.photo,
          photoType: typeof p.photo,
          extractedUrl: getImageUrl(p.photo)
        })));
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
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="form-input w-48"
          >
            <option value="">All Teams</option>
            {Array.isArray(teams) && teams.map(team => (
              <option key={team._id} value={team._id}>
                {team.name}
              </option>
            ))}
          </select>
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="form-input w-48"
          >
            {Array.isArray(seasons) && seasons.map(season => (
              <option key={season._id} value={season._id}>
                {season.name} {season.isActive && '(Active)'}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jersey #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Goals</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Array.isArray(players) && players.map((player) => (
                <tr key={player._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getImageUrl(player.photo) ? (
                      <img
                        src={getImageUrl(player.photo)}
                        alt={player.name}
                        className="h-10 w-10 rounded-full object-cover"
                        onError={(e) => {
                          console.error('Admin player photo failed:', player.name, player.photo);
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div className={`h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center ${
                      getImageUrl(player.photo) ? 'hidden' : 'flex'
                    }`}>
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{player.name}</div>
                    {player.nationality && (
                      <div className="text-sm text-gray-500">{player.nationality}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {player.jerseyNumber ? `#${player.jerseyNumber}` : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {player.currentTeam?.name || 'Free Agent'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {player.dateOfBirth ? calculateAge(player.dateOfBirth) : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      player.status === 'active' ? 'bg-green-100 text-green-800' :
                      player.status === 'injured' ? 'bg-red-100 text-red-800' :
                      player.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {player.status?.charAt(0).toUpperCase() + player.status?.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-green-600">
                      {player.careerStats?.goals || 0}
                    </div>
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

        {(!Array.isArray(players) || players.length === 0) && (
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
        title={editingPlayer ? 'Edit Player' : 'Register New Player'}
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

// Player Form Component - Futsal Optimized
// Player Form Component - Updated with ID Card Number
function PlayerForm({ player, teams, seasons, selectedSeason, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: player?.name || '',
    idCardNumber: player?.idCardNumber || '', // Added ID card field
    email: player?.email || '',
    phone: player?.phone || '',
    dateOfBirth: player?.dateOfBirth ? player.dateOfBirth.split('T')[0] : '',
    nationality: player?.nationality || '',
    position: player?.position || '',
    jerseyNumber: player?.jerseyNumber || '',
    height: player?.height || '',
    weight: player?.weight || '',
    currentTeam: player?.currentTeam?._id || '',
    status: player?.status || 'active',
    notes: player?.notes || '',
    
    // Emergency contact
    emergencyContact: {
      name: player?.emergencyContact?.name || '',
      phone: player?.emergencyContact?.phone || '',
      relationship: player?.emergencyContact?.relationship || ''
    }
  });
  
  const [photoFile, setPhotoFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation - only require name
    if (!formData.name.trim()) {
      toast.error('Player name is required');
      return;
    }
    
    setIsSubmitting(true);

    try {
      let photoData = player?.photo; // Keep existing photo if no new file

      // Upload photo if new file selected
      if (photoFile) {
        console.log('Uploading player photo...');
        setUploadingPhoto(true);
        
        const uploadFormData = new FormData();
        uploadFormData.append('file', photoFile);
        uploadFormData.append('type', 'player');

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          console.log('Photo upload successful:', uploadResult);
          
          // Save just the URL
          photoData = uploadResult.url;
          
          toast.success('Photo uploaded successfully');
        } else {
          const uploadError = await uploadResponse.json();
          console.error('Photo upload failed:', uploadError);
          toast.error(uploadError.message || 'Photo upload failed');
          setIsSubmitting(false);
          setUploadingPhoto(false);
          return;
        }
        
        setUploadingPhoto(false);
      }

      console.log('Saving player with photo data:', photoData);

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
        const result = await response.json();
        console.log('Player save result:', result);
        toast.success(player ? 'Player updated successfully' : 'Player registered successfully');
        onSuccess();
      } else {
        const data = await response.json();
        console.error('Player save failed:', data);
        toast.error(data.message || 'Failed to save player');
      }
    } catch (error) {
      console.error('Player form error:', error);
      toast.error('Failed to save player');
    } finally {
      setIsSubmitting(false);
      setUploadingPhoto(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <input
            type="text"
            className="form-input"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Enter player's full name"
          />
        </div>

        <div className="form-group">
          <label className="form-label">ID Card Number</label>
          <input
            type="text"
            className="form-input"
            value={formData.idCardNumber}
            onChange={(e) => setFormData({ ...formData, idCardNumber: e.target.value })}
            placeholder="National ID or passport number"
          />
          <p className="text-xs text-gray-500 mt-1">
            Private identifier - not shown to public
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">Jersey Number</label>
          <input
            type="number"
            min="1"
            max="99"
            className="form-input"
            value={formData.jerseyNumber}
            onChange={(e) => setFormData({ ...formData, jerseyNumber: e.target.value })}
            placeholder="1-99 (optional)"
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave blank if no jersey assigned yet
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Role (Optional)</label>
          <select
            className="form-input"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
          >
            <option value="">No specific role</option>
            <option value="Goalkeeper">Goalkeeper</option>
            <option value="Outfield Player">Outfield Player</option>
          </select>
        </div>
      </div>

      {/* Photo Upload */}
      <div className="form-group">
        <label className="form-label">Player Photo</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPhotoFile(e.target.files[0])}
          className="form-input"
        />
        {uploadingPhoto && (
          <p className="text-blue-600 text-sm mt-1">Uploading photo...</p>
        )}
        {player?.photo && (
          <div className="mt-2">
            <p className="text-sm text-gray-600">Current photo:</p>
            <img 
              src={getImageUrl(player.photo)} 
              alt="Current photo" 
              className="h-16 w-16 rounded-full object-cover mt-1"
              onError={(e) => e.target.style.display = 'none'}
            />
          </div>
        )}
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-input"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="player@email.com"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Phone</label>
          <input
            type="tel"
            className="form-input"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Phone number"
          />
        </div>
      </div>

      {/* Personal Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="form-group">
          <label className="form-label">Date of Birth</label>
          <input
            type="date"
            className="form-input"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Nationality</label>
          <input
            type="text"
            className="form-input"
            value={formData.nationality}
            onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
            placeholder="e.g., Maldivian"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Status</label>
          <select
            className="form-input"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="active">Active</option>
            <option value="injured">Injured</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Physical Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">Height (cm)</label>
          <input
            type="number"
            className="form-input"
            value={formData.height}
            onChange={(e) => setFormData({ ...formData, height: e.target.value })}
            placeholder="170"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Weight (kg)</label>
          <input
            type="number"
            className="form-input"
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            placeholder="70"
          />
        </div>
      </div>

      {/* Team Assignment */}
      <div className="form-group">
        <label className="form-label">Team Assignment</label>
        <select
          className="form-input"
          value={formData.currentTeam}
          onChange={(e) => setFormData({ ...formData, currentTeam: e.target.value })}
        >
          <option value="">Free Agent (No team assigned)</option>
          {Array.isArray(teams) && teams.map(team => (
            <option key={team._id} value={team._id}>
              {team.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Players can be registered without a team assignment
        </p>
      </div>

      {/* Emergency Contact */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Emergency Contact</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="form-group">
            <label className="form-label">Contact Name</label>
            <input
              type="text"
              className="form-input"
              value={formData.emergencyContact.name}
              onChange={(e) => setFormData({
                ...formData,
                emergencyContact: { ...formData.emergencyContact, name: e.target.value }
              })}
              placeholder="Full name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contact Phone</label>
            <input
              type="tel"
              className="form-input"
              value={formData.emergencyContact.phone}
              onChange={(e) => setFormData({
                ...formData,
                emergencyContact: { ...formData.emergencyContact, phone: e.target.value }
              })}
              placeholder="Emergency contact number"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Relationship</label>
            <select
              className="form-input"
              value={formData.emergencyContact.relationship}
              onChange={(e) => setFormData({
                ...formData,
                emergencyContact: { ...formData.emergencyContact, relationship: e.target.value }
              })}
            >
              <option value="">Select relationship</option>
              <option value="parent">Parent</option>
              <option value="spouse">Spouse</option>
              <option value="sibling">Sibling</option>
              <option value="friend">Friend</option>
              <option value="guardian">Guardian</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="form-group">
        <label className="form-label">Additional Notes</label>
        <textarea
          className="form-input"
          rows="3"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Any additional information about the player..."
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-4 border-t">
        <button type="button" onClick={onClose} className="btn btn-secondary">
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting || uploadingPhoto} 
          className="btn btn-primary"
        >
          {isSubmitting ? 'Saving...' : uploadingPhoto ? 'Uploading...' : player ? 'Update Player' : 'Register Player'}
        </button>
      </div>
    </form>
  );
}
