import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Users, Calendar, Trophy, TrendingUp, Plus, FileDown, Upload } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'admin') {
      router.push('/');
      return;
    }
    fetchAdminData();
  }, [session, status, router]);

  const fetchAdminData = async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/recent-activity')
      ]);

      const statsData = await statsRes.json();
      const activityData = await activityRes.json();

      setStats(statsData);
      setRecentActivity(activityData);
    } catch (error) {
      toast.error('Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadSchedulePDF = async () => {
    try {
      const response = await fetch('/api/schedule-pdf');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'match-schedule.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Schedule PDF downloaded');
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  const downloadCSVTemplate = () => {
    const link = document.createElement('a');
    link.href = '/templates/match-schedule-template.csv';
    link.download = 'match-schedule-template.csv';
    link.click();
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowUserModal(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="btn btn-secondary flex items-center"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import Matches
          </button>
          <button
            onClick={downloadSchedulePDF}
            className="btn btn-secondary flex items-center"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Download Schedule
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card text-center">
          <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900">{stats.totalTeams || 0}</h3>
          <p className="text-gray-600">Total Teams</p>
        </div>
        <div className="card text-center">
          <Users className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900">{stats.totalPlayers || 0}</h3>
          <p className="text-gray-600">Total Players</p>
        </div>
        <div className="card text-center">
          <Calendar className="w-12 h-12 text-purple-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900">{stats.totalMatches || 0}</h3>
          <p className="text-gray-600">Total Matches</p>
        </div>
        <div className="card text-center">
          <TrendingUp className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900">{stats.totalTransfers || 0}</h3>
          <p className="text-gray-600">Total Transfers</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Team Management</h3>
          <div className="space-y-2">
            <button
              onClick={() => router.push('/admin/teams')}
              className="w-full btn btn-primary"
            >
              Manage Teams
            </button>
            <button
              onClick={() => router.push('/admin/players')}
              className="w-full btn btn-secondary"
            >
              Manage Players
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Match Management</h3>
          <div className="space-y-2">
            <button
              onClick={() => router.push('/admin/matches')}
              className="w-full btn btn-primary"
            >
              Manage Matches
            </button>
            <button
              onClick={() => router.push('/matches/live')}
              className="w-full btn btn-secondary"
            >
              Live Match Manager
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Season Management</h3>
          <div className="space-y-2">
            <button
              onClick={() => router.push('/admin/seasons')}
              className="w-full btn btn-primary"
            >
              Manage Seasons
            </button>
            <button
              onClick={() => router.push('/standings')}
              className="w-full btn btn-secondary"
            >
              View Standings
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{activity.description}</p>
                  <p className="text-sm text-gray-600">{activity.timestamp}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  activity.type === 'team' ? 'bg-blue-100 text-blue-800' :
                  activity.type === 'player' ? 'bg-green-100 text-green-800' :
                  activity.type === 'match' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {activity.type}
                </span>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No recent activity</p>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title="Add New User"
        size="md"
      >
        <AddUserForm onClose={() => setShowUserModal(false)} />
      </Modal>

      {/* Import Matches Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Match Schedule"
        size="md"
      >
        <ImportMatchesForm onClose={() => setShowImportModal(false)} />
      </Modal>
    </div>
  );
}

// Add User Form Component
function AddUserForm({ onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('User created successfully');
        onClose();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to create user');
      }
    } catch (error) {
      toast.error('Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-group">
        <label className="form-label">Name</label>
        <input
          type="text"
          className="form-input"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Email</label>
        <input
          type="email"
          className="form-input"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Password</label>
        <input
          type="password"
          className="form-input"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          minLength="6"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Role</label>
        <select
          className="form-input"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onClose}
          className="btn btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary"
        >
          {isSubmitting ? 'Creating...' : 'Create User'}
        </button>
      </div>
    </form>
  );
}

// Import Matches Form Component
function ImportMatchesForm({ onClose }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a CSV file');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('csvFile', file);

      const response = await fetch('/api/csv-import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        if (data.errors && data.errors.length > 0) {
          console.warn('Import errors:', data.errors);
          toast.error(`${data.errors.length} rows had errors`);
        }
        onClose();
      } else {
        toast.error(data.message || 'Import failed');
      }
    } catch (error) {
      toast.error('Import failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">CSV Format Requirements</h4>
        <p className="text-blue-700 text-sm mb-2">
          Your CSV file should have the following columns:
        </p>
        <ul className="list-disc list-inside text-blue-700 text-sm space-y-1">
          <li>homeTeam - Exact team name as registered</li>
          <li>awayTeam - Exact team name as registered</li>
          <li>matchDate - Format: YYYY-MM-DD HH:MM</li>
          <li>venue (optional)</li>
          <li>round (optional)</li>
          <li>referee (optional)</li>
        </ul>
        <button
          type="button"
          onClick={() => {
            const link = document.createElement('a');
            link.href = '/templates/match-schedule-template.csv';
            link.download = 'match-schedule-template.csv';
            link.click();
          }}
          className="mt-2 text-blue-600 hover:text-blue-800 underline text-sm"
        >
          Download Template CSV
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-group">
          <label className="form-label">Select CSV File</label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files[0])}
            className="form-input"
            required
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isUploading}
            className="btn btn-primary"
          >
            {isUploading ? 'Importing...' : 'Import Matches'}
          </button>
        </div>
      </form>
    </div>
  );
}