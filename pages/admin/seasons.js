import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Plus, Edit, Trash2, Calendar } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function AdminSeasons() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [seasons, setSeasons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSeason, setEditingSeason] = useState(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'admin') {
      router.push('/');
      return;
    }
    fetchSeasons();
  }, [session, status, router]);

  const fetchSeasons = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/seasons');
      const data = await response.json();
      setSeasons(data);
    } catch (error) {
      toast.error('Failed to fetch seasons');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSeason = () => {
    setEditingSeason(null);
    setShowModal(true);
  };

  const handleEditSeason = (season) => {
    setEditingSeason(season);
    setShowModal(true);
  };

  const handleDeleteSeason = async (seasonId) => {
    if (!confirm('Are you sure you want to delete this season?')) return;

    try {
      const response = await fetch(`/api/admin/seasons?id=${seasonId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Season deleted successfully');
        fetchSeasons();
      } else {
        toast.error('Failed to delete season');
      }
    } catch (error) {
      toast.error('Failed to delete season');
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
        <h1 className="text-3xl font-bold text-gray-900">Manage Seasons</h1>
        <button onClick={handleAddSeason} className="btn btn-primary flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Add Season
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {seasons.map((season) => (
          <div key={season._id} className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{season.name}</h3>
              {season.isActive && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                  Active
                </span>
              )}
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {format(new Date(season.startDate), 'MMM dd, yyyy')} - 
                {format(new Date(season.endDate), 'MMM dd, yyyy')}
              </div>
              <div>Max Teams: {season.maxTeams}</div>
              <div>Registration Deadline: {format(new Date(season.registrationDeadline), 'MMM dd, yyyy')}</div>
            </div>

            {season.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {season.description}
              </p>
            )}

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => handleEditSeason(season)}
                className="btn btn-secondary flex items-center"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </button>
              <button
                onClick={() => handleDeleteSeason(season._id)}
                className="btn btn-danger flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {seasons.length === 0 && (
        <div className="card text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No seasons found</h3>
          <p className="text-gray-500">Get started by creating your first season.</p>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingSeason ? 'Edit Season' : 'Add New Season'}
        size="md"
      >
        <SeasonForm
          season={editingSeason}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchSeasons();
          }}
        />
      </Modal>
    </div>
  );
}

// Season Form Component
function SeasonForm({ season, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: season?.name || '',
    startDate: season?.startDate ? format(new Date(season.startDate), 'yyyy-MM-dd') : '',
    endDate: season?.endDate ? format(new Date(season.endDate), 'yyyy-MM-dd') : '',
    registrationDeadline: season?.registrationDeadline ? format(new Date(season.registrationDeadline), 'yyyy-MM-dd') : '',
    maxTeams: season?.maxTeams || 16,
    description: season?.description || '',
    isActive: season?.isActive || false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const method = season ? 'PUT' : 'POST';
      const body = season 
        ? { ...formData, id: season._id }
        : formData;

      const response = await fetch('/api/admin/seasons', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(season ? 'Season updated successfully' : 'Season created successfully');
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
        <label className="form-label">Season Name *</label>
        <input
          type="text"
          className="form-input"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">Start Date *</label>
          <input
            type="date"
            className="form-input"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">End Date *</label>
          <input
            type="date"
            className="form-input"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">Registration Deadline *</label>
          <input
            type="date"
            className="form-input"
            value={formData.registrationDeadline}
            onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Max Teams</label>
          <input
            type="number"
            min="2"
            max="32"
            className="form-input"
            value={formData.maxTeams}
            onChange={(e) => setFormData({ ...formData, maxTeams: parseInt(e.target.value) })}
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

      <div className="form-group">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="mr-2"
          />
          Set as Active Season
        </label>
        <p className="text-sm text-gray-600 mt-1">
          Only one season can be active at a time. Setting this as active will deactivate other seasons.
        </p>
      </div>

      <div className="flex justify-end space-x-4">
        <button type="button" onClick={onClose} className="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className="btn btn-primary">
          {isSubmitting ? 'Saving...' : season ? 'Update Season' : 'Create Season'}
        </button>
      </div>
    </form>
  );
}