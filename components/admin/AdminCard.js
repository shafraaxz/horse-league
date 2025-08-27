// components/admin/AdminCard.js
import React from 'react';
import { User, Shield, Clock, CheckCircle, XCircle, Settings } from 'lucide-react';

const AdminCard = ({ admin, onEdit, onDelete, onToggleStatus, currentUser }) => {
  const getRoleColor = (role) => {
    const colors = {
      super_admin: 'bg-purple-100 text-purple-800',
      league_admin: 'bg-blue-100 text-blue-800',
      team_manager: 'bg-green-100 text-green-800',
      viewer: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role) => {
    const labels = {
      super_admin: 'Super Admin',
      league_admin: 'League Admin',
      team_manager: 'Team Manager',
      viewer: 'Viewer'
    };
    return labels[role] || role;
  };

  const canEdit = currentUser?.role === 'super_admin' || 
                  (currentUser?.role === 'league_admin' && admin.role !== 'super_admin');

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{admin.name}</h3>
            <p className="text-sm text-gray-600">{admin.email}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(admin.role)}`}>
            {getRoleLabel(admin.role)}
          </span>
          {admin.isActive ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500" />
          )}
        </div>
      </div>

      {/* Permissions Overview */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
          <Shield className="w-4 h-4 mr-1" />
          Permissions
        </h4>
        <div className="grid grid-cols-2 gap-1 text-xs">
          {admin.permissions && Object.entries(admin.permissions)
            .filter(([key, value]) => value)
            .map(([key, value]) => (
              <div key={key} className="flex items-center text-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                <span className="capitalize">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Assigned Leagues */}
      {admin.assignedLeagues && admin.assignedLeagues.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Assigned Leagues</h4>
          <div className="flex flex-wrap gap-1">
            {admin.assignedLeagues.map(league => (
              <span 
                key={league._id || league}
                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
              >
                {league.name || league}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Last Login */}
      {admin.lastLogin && (
        <div className="mb-4 flex items-center text-sm text-gray-600">
          <Clock className="w-4 h-4 mr-1" />
          Last login: {new Date(admin.lastLogin).toLocaleDateString()}
        </div>
      )}

      {/* Actions */}
      {canEdit && (
        <div className="flex space-x-2 pt-4 border-t">
          {onEdit && (
            <button
              onClick={() => onEdit(admin)}
              className="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center"
            >
              <Settings className="w-4 h-4 mr-1" />
              Edit
            </button>
          )}
          {onToggleStatus && (
            <button
              onClick={() => onToggleStatus(admin)}
              className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                admin.isActive
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {admin.isActive ? 'Deactivate' : 'Activate'}
            </button>
          )}
          {onDelete && admin._id !== currentUser?._id && (
            <button
              onClick={() => onDelete(admin)}
              className="px-3 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminCard;