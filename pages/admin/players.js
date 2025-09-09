// ===========================================
// FILE: pages/admin/players.js (UPDATED WITH MANDATORY ID CARD)
// ===========================================
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Plus, Edit, Trash2, User, CreditCard, AlertTriangle, FileText, Users as UsersIcon } from 'lucide-react';
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
  const [contractFilter, setContractFilter] = useState(''); // NEW: Contract filter
  const [searchQuery, setSearchQuery] = useState(''); // NEW: Search
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false); // NEW: Contract management
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [contractingPlayer, setContractingPlayer] = useState(null); // NEW: Contract management

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
  }, [selectedSeason, selectedTeam, contractFilter, searchQuery]);

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
      if (contractFilter) url += `&contractStatus=${contractFilter}`; // NEW: Contract filter
      if (searchQuery.trim()) url += `&search=${encodeURIComponent(searchQuery.trim())}`; // NEW: Search
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
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

  // NEW: Handle contract management
  const handleManageContract = (player) => {
    setContractingPlayer(player);
    setShowContractModal(true);
  };

  const handleDeletePlayer = async (playerId) => {
    if (!confirm('Are you sure you want to delete this player? This action cannot be undone.')) return;

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

  // NEW: Contract status helpers
  const getContractStatusBadge = (contractStatus) => {
    switch (contractStatus) {
      case 'normal':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            Normal Contract
          </span>
        );
      case 'seasonal':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
            Seasonal Contract
          </span>
        );
      case 'free_agent':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            Free Agent
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
            Unknown
          </span>
        );
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Manage Players</h1>
        <button onClick={handleAddPlayer} className="btn btn-primary flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Add Player
        </button>
      </div>

      {/* Enhanced Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search Input */}
          <div className="lg:col-span-2">
            <label className="form-label text-sm">Search Players</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, ID card, or email..."
              className="form-input"
            />
          </div>

          {/* Season Filter */}
          <div>
            <label className="form-label text-sm">Season</label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="form-input w-full"
            >
              {Array.isArray(seasons) && seasons.map(season => (
                <option key={season._id} value={season._id}>
                  {season.name} {season.isActive && '(Active)'}
                </option>
              ))}
            </select>
          </div>

          {/* Team Filter */}
          <div>
            <label className="form-label text-sm">Team</label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="form-input w-full"
            >
              <option value="">All Teams</option>
              <option value="free-agents">Free Agents</option>
              {Array.isArray(teams) && teams.map(team => (
                <option key={team._id} value={team._id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* NEW: Contract Status Filter */}
          <div>
            <label className="form-label text-sm">Contract Status</label>
            <select
              value={contractFilter}
              onChange={(e) => setContractFilter(e.target.value)}
              className="form-input w-full"
            >
              <option value="">All Contract Types</option>
              <option value="free_agent">Free Agents</option>
              <option value="normal">Normal Contracts</option>
              <option value="seasonal">Seasonal Contracts</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedTeam('');
                setContractFilter('');
                setSearchQuery('');
              }}
              className="btn-secondary w-full text-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Players Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Photo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Player Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Card</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jersey #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contract Status</th>
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
                    {player.email && (
                      <div className="text-xs text-gray-400">{player.email}</div>
                    )}
                  </td>
                  {/* NEW: ID Card Column */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {player.idCardNumber ? (
                      <div className="flex items-center space-x-1">
                        <CreditCard className="w-3 h-3 text-green-600" />
                        <span className="text-xs font-mono text-gray-700">{player.idCardNumber}</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3 text-red-500" />
                        <span className="text-xs text-red-600">Missing</span>
                      </div>
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
                  {/* NEW: Contract Status Column */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getContractStatusBadge(player.contractStatus || 'free_agent')}
                    {player.currentContract?.contractValue > 0 && (
                      <div className="text-xs text-green-600 mt-1">
                        MVR {player.currentContract.contractValue.toLocaleString()}
                      </div>
                    )}
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
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditPlayer(player)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Player"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleManageContract(player)}
                        className="text-purple-600 hover:text-purple-900"
                        title="Manage Contract"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePlayer(player._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Player"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(!Array.isArray(players) || players.length === 0) && (
          <div className="text-center py-12">
            <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No players found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? `No players match "${searchQuery}" with the selected filters.` : 'Get started by registering your first player.'}
            </p>
            {(searchQuery || selectedTeam || contractFilter) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTeam('');
                  setContractFilter('');
                }}
                className="btn-secondary"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Statistics Summary */}
      {Array.isArray(players) && players.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card text-center">
            <div className="text-2xl font-bold text-blue-600">{players.length}</div>
            <div className="text-gray-600 text-sm">Total Players</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-green-600">
              {players.filter(p => p.idCardNumber).length}
            </div>
            <div className="text-gray-600 text-sm">With ID Cards</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-purple-600">
              {players.filter(p => (p.contractStatus || 'free_agent') === 'free_agent').length}
            </div>
            <div className="text-gray-600 text-sm">Free Agents</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {players.reduce((sum, p) => sum + (p.careerStats?.goals || 0), 0)}
            </div>
            <div className="text-gray-600 text-sm">Total Goals</div>
          </div>
        </div>
      )}

      {/* Player Registration Modal */}
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

      {/* NEW: Contract Management Modal */}
      <Modal
        isOpen={showContractModal}
        onClose={() => setShowContractModal(false)}
        title={`Manage Contract - ${contractingPlayer?.name}`}
        size="lg"
      >
        {contractingPlayer && (
          <ContractForm
            player={contractingPlayer}
            teams={teams}
            seasons={seasons}
            onClose={() => setShowContractModal(false)}
            onSuccess={() => {
              setShowContractModal(false);
              fetchPlayers();
            }}
          />
        )}
      </Modal>
    </div>
  );
}

// UPDATED Player Form Component with MANDATORY ID Card
function PlayerForm({ player, teams, seasons, selectedSeason, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: player?.name || '',
    idCardNumber: player?.idCardNumber || '', // NOW REQUIRED
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
  const [idCardError, setIdCardError] = useState('');

  // NEW: Validate ID card number
  const validateIdCard = (value) => {
    if (!value || value.trim() === '') {
      return 'ID card number is required';
    }

    const cleaned = value.trim().replace(/\s+/g, '');
    
    if (cleaned.length < 5) {
      return 'ID card number must be at least 5 characters long';
    }

    if (cleaned.length > 20) {
      return 'ID card number cannot exceed 20 characters';
    }

    if (!/^[A-Za-z0-9\-\/]+$/.test(cleaned)) {
      return 'ID card number can only contain letters, numbers, hyphens, and slashes';
    }

    return '';
  };

  const handleIdCardChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, idCardNumber: value });
    
    const error = validateIdCard(value);
    setIdCardError(error);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // MANDATORY validations
    if (!formData.name.trim()) {
      toast.error('Player name is required');
      return;
    }

    if (!formData.idCardNumber.trim()) {
      toast.error('ID card number is required');
      return;
    }

    const idError = validateIdCard(formData.idCardNumber);
    if (idError) {
      toast.error(idError);
      return;
    }
    
    setIsSubmitting(true);

    try {
      let photoData = player?.photo;

      if (photoFile) {
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
          photoData = uploadResult.url;
          toast.success('Photo uploaded successfully');
        } else {
          const uploadError = await uploadResponse.json();
          toast.error(uploadError.message || 'Photo upload failed');
          setIsSubmitting(false);
          setUploadingPhoto(false);
          return;
        }
        
        setUploadingPhoto(false);
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
        toast.success(player ? 'Player updated successfully' : 'Player registered successfully');
        onSuccess();
      } else {
        const data = await response.json();
        if (data.message && data.message.includes('ID card number')) {
          toast.error(data.message);
          setIdCardError(data.message);
        } else {
          toast.error(data.message || 'Failed to save player');
        }
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
      {/* MANDATORY Information Section */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          Required Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label text-red-700">Full Name *</label>
            <input
              type="text"
              className="form-input border-red-300 focus:border-red-500"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Enter player's full name"
            />
          </div>

          <div className="form-group">
            <label className="form-label text-red-700">ID Card Number *</label>
            <input
              type="text"
              className={`form-input ${idCardError ? 'border-red-500' : 'border-red-300'} focus:border-red-500`}
              value={formData.idCardNumber}
              onChange={handleIdCardChange}
              required
              placeholder="National ID, Passport, or Document Number"
              maxLength="20"
            />
            {idCardError && (
              <p className="text-red-600 text-sm mt-1">{idCardError}</p>
            )}
            <p className="text-xs text-red-600 mt-1">
              Must be unique. Used to prevent duplicate registrations.
            </p>
          </div>
        </div>
      </div>

      {/* Basic Information */}
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
        </div>

        <div className="form-group">
          <label className="form-label">Position (Optional)</label>
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
          disabled={isSubmitting || uploadingPhoto || !!idCardError || !formData.name.trim() || !formData.idCardNumber.trim()}
          className="btn btn-primary"
        >
          {uploadingPhoto ? 'Uploading...' : isSubmitting ? 'Saving...' : player ? 'Update Player' : 'Register Player'}
        </button>
      </div>
    </form>
  );
}

// NEW: Contract Management Form
function ContractForm({ player, teams, seasons, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    playerId: player._id,
    team: player.currentContract?.team?._id || '',
    season: seasons.find(s => s.isActive)?._id || '',
    contractType: player.contractStatus === 'free_agent' ? 'normal' : player.contractStatus,
    contractValue: player.currentContract?.contractValue || 0,
    startDate: player.currentContract?.startDate ? new Date(player.currentContract.startDate).toISOString().split('T')[0] : '',
    endDate: player.currentContract?.endDate ? new Date(player.currentContract.endDate).toISOString().split('T')[0] : '',
    notes: player.currentContract?.notes || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Contract updated successfully');
        onSuccess();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to update contract');
      }
    } catch (error) {
      console.error('Contract form error:', error);
      toast.error('Failed to update contract');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRelease = async () => {
    if (!confirm('Are you sure you want to release this player to free agency?')) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: player._id, team: null }),
      });

      if (response.ok) {
        toast.success('Player released to free agency');
        onSuccess();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to release player');
      }
    } catch (error) {
      console.error('Release error:', error);
      toast.error('Failed to release player');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Current Status</h4>
        <div className="text-sm text-blue-800">
          <p><strong>Contract Status:</strong> {player.contractStatus?.replace('_', ' ') || 'Free Agent'}</p>
          <p><strong>Current Team:</strong> {player.currentTeam?.name || 'None'}</p>
          {player.currentContract?.contractValue > 0 && (
            <p><strong>Contract Value:</strong> MVR {player.currentContract.contractValue.toLocaleString()}</p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Team *</label>
            <select
              className="form-input"
              value={formData.team}
              onChange={(e) => setFormData({ ...formData, team: e.target.value })}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Contract Type *</label>
            <select
              className="form-input"
              value={formData.contractType}
              onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
              required
            >
              <option value="normal">Normal Contract</option>
              <option value="seasonal">Seasonal Contract</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Contract Value (MVR)</label>
            <input
              type="number"
              min="0"
              className="form-input"
              value={formData.contractValue}
              onChange={(e) => setFormData({ ...formData, contractValue: e.target.value })}
              placeholder="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-input"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">End Date (Optional)</label>
            <input
              type="date"
              className="form-input"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea
            className="form-input"
            rows="3"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Contract notes..."
          />
        </div>

        <div className="flex justify-between pt-4 border-t">
          <button 
            type="button" 
            onClick={handleRelease}
            disabled={isSubmitting}
            className="btn bg-red-600 text-white hover:bg-red-700"
          >
            Release to Free Agency
          </button>
          
          <div className="space-x-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              {isSubmitting ? 'Updating...' : 'Update Contract'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
