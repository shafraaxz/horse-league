// components/admin/AdminForm.js
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, AlertCircle, X } from 'lucide-react';

const AdminForm = ({ admin, onSubmit, onCancel, leagues = [], currentUser }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'viewer',
    assignedLeagues: [],
    isActive: true,
    permissions: {
      canCreateLeague: false,
      canEditLeague: false,
      canDeleteLeague: false,
      canManageTeams: false,
      canManageMatches: false,
      canManagePlayers: false,
      canViewReports: true
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (admin) {
      setFormData({
        name: admin.name || '',
        email: admin.email || '',
        password: '', // Don't prefill password for editing
        role: admin.role || 'viewer',
        assignedLeagues: admin.assignedLeagues?.map(l => l._id || l) || [],
        isActive: admin.isActive !== false,
        permissions: {
          canCreateLeague: false,
          canEditLeague: false,
          canDeleteLeague: false,
          canManageTeams: false,
          canManageMatches: false,
          canManagePlayers: false,
          canViewReports: true,
          ...admin.permissions
        }
      });
    }
  }, [admin]);

  // Clear errors when form data changes
  useEffect(() => {
    if (error) setError('');
    if (success) setSuccess('');
  }, [formData]);

  // Update permissions based on role
  useEffect(() => {
    const rolePermissions = {
      super_admin: {
        canCreateLeague: true,
        canEditLeague: true,
        canDeleteLeague: true,
        canManageTeams: true,
        canManageMatches: true,
        canManagePlayers: true,
        canViewReports: true
      },
      league_admin: {
        canCreateLeague: false,
        canEditLeague: true,
        canDeleteLeague: false,
        canManageTeams: true,
        canManageMatches: true,
        canManagePlayers: true,
        canViewReports: true
      },
      team_manager: {
        canCreateLeague: false,
        canEditLeague: false,
        canDeleteLeague: false,
        canManageTeams: true,
        canManageMatches: false,
        canManagePlayers: true,
        canViewReports: true
      },
      viewer: {
        canCreateLeague: false,
        canEditLeague: false,
        canDeleteLeague: false,
        canManageTeams: false,
        canManageMatches: false,
        canManagePlayers: false,
        canViewReports: true
      }
    };

    setFormData(prev => ({
      ...prev,
      permissions: rolePermissions[prev.role] || rolePermissions.viewer
    }));
  }, [formData.role]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePermissionChange = (permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: !prev.permissions[permission]
      }
    }));
  };

  const handleLeagueChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      assignedLeagues: checked 
        ? [...prev.assignedLeagues, value]
        : prev.assignedLeagues.filter(id => id !== value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await onSubmit(formData);
      setSuccess(admin ? 'Admin updated successfully!' : 'Admin created successfully!');
      
      // Auto-close success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error submitting admin:', error);
      
      // Extract meaningful error message
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error.message) {
        if (error.message.includes('email already exists')) {
          errorMessage = 'An admin with this email address already exists. Please use a different email.';
        } else if (error.message.includes('validation')) {
          errorMessage = 'Please check your input and ensure all required fields are filled correctly.';
        } else if (error.message.includes('unauthorized') || error.message.includes('permission')) {
          errorMessage = 'You do not have permission to perform this action.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const canManageRole = (role) => {
    if (currentUser?.role === 'super_admin') return true;
    if (currentUser?.role === 'league_admin' && role !== 'super_admin') return true;
    return false;
  };

  const dismissError = () => setError('');
  const dismissSuccess = () => setSuccess('');

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button
              type="button"
              onClick={dismissError}
              className="text-red-400 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-start">
            <div className="w-5 h-5 text-green-400 mt-0.5 mr-3">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <p className="text-sm text-green-700 mt-1">{success}</p>
            </div>
            <button
              type="button"
              onClick={dismissSuccess}
              className="text-green-400 hover:text-green-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter full name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter email address"
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password {!admin && '*'}
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required={!admin}
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={admin ? "Leave blank to keep current password" : "Enter password"}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Role and Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {canManageRole('viewer') && <option value="viewer">Viewer</option>}
            {canManageRole('team_manager') && <option value="team_manager">Team Manager</option>}
            {canManageRole('league_admin') && <option value="league_admin">League Admin</option>}
            {canManageRole('super_admin') && <option value="super_admin">Super Admin</option>}
          </select>
        </div>
        <div className="flex items-center">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Active Account</span>
          </label>
        </div>
      </div>

      {/* League Assignment */}
      {(formData.role === 'league_admin' || formData.role === 'team_manager') && leagues.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assigned Leagues
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
            {leagues.map(league => (
              <label key={league._id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  value={league._id}
                  checked={formData.assignedLeagues.includes(league._id)}
                  onChange={handleLeagueChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{league.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Custom Permissions */}
      {(currentUser?.role === 'super_admin' || formData.role === 'team_manager') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Permissions
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {Object.entries(formData.permissions).map(([permission, value]) => (
              <label key={permission} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() => handlePermissionChange(permission)}
                  disabled={formData.role === 'super_admin' || formData.role === 'league_admin'}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                />
                <span className="text-sm text-gray-700 capitalize">
                  {permission.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </span>
              </label>
            ))}
          </div>
          {(formData.role === 'super_admin' || formData.role === 'league_admin') && (
            <p className="text-xs text-gray-500 mt-1">
              Permissions are automatically set based on role
            </p>
          )}
        </div>
      )}

      {/* Form Actions */}
      <div className="flex space-x-4 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !formData.name.trim() || !formData.email.trim() || (!admin && !formData.password.trim())}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Saving...' : admin ? 'Update Admin' : 'Create Admin'}
        </button>
      </div>
    </form>
  );
};

export default AdminForm;