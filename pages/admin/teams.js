import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Plus, Edit, Trash2, Upload } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

// Helper function to extract image URL from various formats
const getImageUrl = (imageData) => {
  if (!imageData) return null;
  
  // If it's already a string URL
  if (typeof imageData === 'string' && imageData.startsWith('http')) {
    return imageData;
  }
  
  // If it's an object with url property
  if (imageData && typeof imageData === 'object') {
    return imageData.url || imageData.secure_url || null;
  }
  
  return null;
};

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
    }
  }, [selectedSeason]);

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
      setIsLoading(true);
      const response = await fetch(`/api/admin/teams?seasonId=${selectedSeason}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setTeams(data);
        
        // Debug team logo data
        console.log('Admin teams logo debug:', data.map(team => ({
          name: team.name,
          logo: team.logo,
          logoType: typeof team.logo,
          extractedUrl: getImageUrl(team.logo)
        })));
      } else {
        console.error('Teams data is not an array:', data);
        setTeams([]);
        toast.error(data.message || 'Failed to fetch teams');
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      setTeams([]);
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
        const data = await response.json();
        toast.error(data.message || 'Failed to delete team');
      }
    } catch (error) {
      console.error('Error deleting team:', error);
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
            {Array.isArray(seasons) && seasons.map(season => (
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
              {Array.isArray(teams) && teams.map((team) => (
                <tr key={team._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getImageUrl(team.logo) ? (
                      <img
                        src={getImageUrl(team.logo)}
                        alt={team.name}
                        className="h-10 w-10 rounded-full object-cover"
                        onError={(e) => {
                          console.error('Admin team logo failed:', team.name, team.logo);
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div className={`h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center ${
                      getImageUrl(team.logo) ? 'hidden' : 'flex'
                    }`}>
                      <span className="text-xs font-medium text-gray-600">
                        {team.name?.charAt(0) || 'T'}
                      </span>
                    </div>
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

        {(!Array.isArray(teams) || teams.length === 0) && (
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

// Team Form Component (FIXED LOGO UPLOAD)
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
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let logoData = team?.logo; // Keep existing logo if no new file

      // Upload logo if new file selected
      if (logoFile) {
        console.log('Uploading team logo...');
        setUploadingLogo(true);
        
        const uploadFormData = new FormData();
        uploadFormData.append('file', logoFile);
        uploadFormData.append('type', 'team'); // This helps organize uploads in Cloudinary

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          console.log('Logo upload successful:', uploadResult);
          
          // FIXED: Save just the URL, not the entire response object
          logoData = uploadResult.url; // This is the key fix!
          
          toast.success('Logo uploaded successfully');
        } else {
          const uploadError = await uploadResponse.json();
          console.error('Logo upload failed:', uploadError);
          toast.error(uploadError.message || 'Logo upload failed');
          setIsSubmitting(false);
          setUploadingLogo(false);
          return;
        }
        
        setUploadingLogo(false);
      }

      console.log('Saving team with logo data:', logoData);

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
        const result = await response.json();
        console.log('Team save result:', result);
        toast.success(team ? 'Team updated successfully' : 'Team created successfully');
        onSuccess();
      } else {
        const data = await response.json();
        console.error('Team save failed:', data);
        toast.error(data.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Team form error:', error);
      toast.error('Operation failed');
    } finally {
      setIsSubmitting(false);
      setUploadingLogo(false);
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
        <label className="form-label">Team Logo</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setLogoFile(e.target.files[0])}
          className="form-input"
        />
        {uploadingLogo && (
          <p className="text-blue-600 text-sm mt-1">Uploading logo...</p>
        )}
        {team?.logo && (
          <div className="mt-2">
            <p className="text-sm text-gray-600">Current logo:</p>
            {getImageUrl(team.logo) && (
              <img 
                src={getImageUrl(team.logo)} 
                alt="Current logo" 
                className="h-16 w-16 rounded-full object-cover mt-1"
              />
            )}
          </div>
        )}
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
            {Array.isArray(seasons) && seasons.map(season => (
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
          placeholder="Brief description of the team"
        />
      </div>

      <div className="flex justify-end space-x-4">
        <button type="button" onClick={onClose} className="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting || uploadingLogo} className="btn btn-primary">
          {isSubmitting ? 'Saving...' : uploadingLogo ? 'Uploading...' : team ? 'Update Team' : 'Create Team'}
        </button>
      </div>
    </form>
  );
}
