import React, { useState } from 'react';
import { Edit, Trash2, Eye, EyeOff, UserCheck, UserX, Shield, Key, Clock, Mail, Phone, Calendar, Activity } from 'lucide-react';

const AdminCard = ({ admin, onEdit, onToggleStatus, onDelete }) => {
  const [showDetails, setShowDetails] = useState(false);

  const roleConfig = {
    'super-admin': {
      label: 'Super Administrator',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: Shield,
      description: 'Full system access with all permissions'
    },
    'admin': {
      label: 'Administrator',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: Key,
      description: 'Manage most system features and operations'
    },
    'moderator': {
      label: 'Moderator',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: Eye,
      description: 'Limited access for content moderation'
    }
  };

  const statusConfig = {
    'active': {
      label: 'Active',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: UserCheck
    },
    'inactive': {
      label: 'Inactive',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: UserX
    }
  };

  const roleInfo = roleConfig[admin.role] || roleConfig['admin'];
  const statusInfo = statusConfig[admin.status] || statusConfig['active'];
  const RoleIcon = roleInfo.icon;
  const StatusIcon = statusInfo.icon;

  const formatLastLogin = (lastLogin) => {
    if (!lastLogin) return 'Never';
    
    const date = new Date(lastLogin);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return 'Less than 1 hour ago';
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  const getPermissionLabel = (permission) => {
    const labels = {
      'manage_players': 'Players',
      'manage_teams': 'Teams',
      'manage_schedules': 'Schedules',
      'manage_admins': 'Admins',
      'view_statistics': 'Statistics',
      'export_data': 'Export',
      'manage_gallery': 'Gallery',
      'live_matches': 'Live Matches'
    };
    return labels[permission] || permission;
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className={`border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 ${
      admin.status === 'active' ? 'border-gray-200 bg-white' : 'border-gray-300 bg-gray-50'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b ${
        admin.role === 'super-admin' ? 'bg-gradient-to-r from-purple-50 to-blue-50' :
        admin.role === 'admin' ? 'bg-blue-50' : 'bg-yellow-50'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {/* Avatar */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
              admin.role === 'super-admin' ? 'bg-gradient-to-r from-purple-500 to-blue-500' :
              admin.role === 'admin' ? 'bg-blue-500' : 'bg-yellow-500'
            }`}>
              {admin.avatar ? (
                <img src={admin.avatar} alt={admin.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                getInitials(admin.name)
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-lg truncate">{admin.name}</h3>
              <p className="text-sm text-gray-600 truncate">{admin.email}</p>
              
              {/* Role and Status Badges */}
              <div className="flex items-center space-x-2 mt-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${roleInfo.color}`}>
                  <RoleIcon size={12} className="mr-1" />
                  {roleInfo.label}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                  <StatusIcon size={12} className="mr-1" />
                  {statusInfo.label}
                </span>
              </div>
            </div>
          </div>

          {/* Status Indicator */}
          <div className={`w-3 h-3 rounded-full ${
            admin.status === 'active' ? 'bg-green-400' : 'bg-gray-400'
          } ${admin.status === 'active' ? 'animate-pulse' : ''}`}></div>
        </div>
      </div>

      {/* Quick Info */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2 text-gray-600">
            <Activity size={14} />
            <span>{admin.loginCount || 0} logins</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Clock size={14} />
            <span>{formatLastLogin(admin.lastLogin)}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Key size={14} />
            <span>{admin.permissions.length} permissions</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Calendar size={14} />
            <span>{new Date(admin.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {admin.department && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              <strong>Department:</strong> {admin.department}
            </p>
          </div>
        )}

        {/* Expanded Details */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
            {/* Contact Information */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Mail size={14} />
                  <span>{admin.email}</span>
                </div>
                {admin.phone && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone size={14} />
                    <span>{admin.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Permissions */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Permissions</h4>
              <div className="flex flex-wrap gap-2">
                {admin.permissions.map(permission => (
                  <span
                    key={permission}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium"
                  >
                    {getPermissionLabel(permission)}
                  </span>
                ))}
              </div>
            </div>

            {/* Role Description */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-1">{roleInfo.label}</h4>
              <p className="text-sm text-gray-600">{roleInfo.description}</p>
            </div>

            {/* Notes */}
            {admin.notes && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  {admin.notes}
                </p>
              </div>
            )}

            {/* Account Details */}
            <div className="text-xs text-gray-500 space-y-1">
              <p><strong>Account Created:</strong> {new Date(admin.createdAt).toLocaleString()}</p>
              {admin.lastLogin && (
                <p><strong>Last Login:</strong> {new Date(admin.lastLogin).toLocaleString()}</p>
              )}
              {admin.updatedAt && (
                <p><strong>Last Updated:</strong> {new Date(admin.updatedAt).toLocaleString()}</p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-1"
          >
            {showDetails ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{showDetails ? 'Hide' : 'Details'}</span>
          </button>
          
          <button
            onClick={() => onEdit(admin)}
            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
          >
            <Edit size={14} />
            <span>Edit</span>
          </button>
        </div>

        <div className="flex space-x-2 mt-2">
          <button
            onClick={onToggleStatus}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1 ${
              admin.status === 'active'
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {admin.status === 'active' ? (
              <>
                <UserX size={14} />
                <span>Deactivate</span>
              </>
            ) : (
              <>
                <UserCheck size={14} />
                <span>Activate</span>
              </>
            )}
          </button>
          
          {admin.role !== 'super-admin' && (
            <button
              onClick={() => onDelete(admin)}
              className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center space-x-1"
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          )}
        </div>

        {/* Warning for Super Admin */}
        {admin.role === 'super-admin' && (
          <div className="mt-3 p-2 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-purple-800 text-xs">
              <Shield size={12} className="inline mr-1" />
              Super Administrator - Protected account with full system access
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCard;