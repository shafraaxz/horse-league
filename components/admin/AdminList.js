// components/admin/AdminList.js
import React, { useState } from 'react';
import { Search, Plus, Filter, Users } from 'lucide-react';
import AdminCard from './AdminCard';

const AdminList = ({ 
  admins = [], 
  onEditAdmin, 
  onDeleteAdmin, 
  onCreateAdmin,
  onToggleAdminStatus,
  currentUser,
  loading = false 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const roles = [
    { value: '', label: 'All Roles' },
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'league_admin', label: 'League Admin' },
    { value: 'team_manager', label: 'Team Manager' },
    { value: 'viewer', label: 'Viewer' }
  ];

  const filteredAdmins = admins
    .filter(admin => {
      const matchesSearch = admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           admin.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = !selectedRole || admin.role === selectedRole;
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && admin.isActive) ||
                           (statusFilter === 'inactive' && !admin.isActive);
      return matchesSearch && matchesRole && matchesStatus;
    })
    .sort((a, b) => {
      // Sort by role hierarchy, then by name
      const roleOrder = { super_admin: 0, league_admin: 1, team_manager: 2, viewer: 3 };
      const roleComparison = (roleOrder[a.role] || 4) - (roleOrder[b.role] || 4);
      if (roleComparison !== 0) return roleComparison;
      return a.name.localeCompare(b.name);
    });

  const canCreateAdmin = currentUser?.role === 'super_admin' || 
                        currentUser?.role === 'league_admin';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Users className="w-6 h-6 mr-2" />
            Admin Management
          </h2>
          <p className="text-gray-600 mt-1">
            Manage user accounts and permissions
          </p>
        </div>
        {canCreateAdmin && onCreateAdmin && (
          <button
            onClick={onCreateAdmin}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Admin
          </button>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-gray-900">
            {admins.length}
          </div>
          <div className="text-sm text-gray-600">Total Admins</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-green-600">
            {admins.filter(a => a.isActive).length}
          </div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-purple-600">
            {admins.filter(a => a.role === 'super_admin').length}
          </div>
          <div className="text-sm text-gray-600">Super Admins</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-blue-600">
            {admins.filter(a => a.role === 'league_admin').length}
          </div>
          <div className="text-sm text-gray-600">League Admins</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {roles.map(role => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Admins Grid */}
      {filteredAdmins.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAdmins.map(admin => (
            <AdminCard
              key={admin._id}
              admin={admin}
              onEdit={onEditAdmin}
              onDelete={onDeleteAdmin}
              onToggleStatus={onToggleAdminStatus}
              currentUser={currentUser}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-400 text-lg mb-2">No admins found</div>
          <p className="text-gray-600">
            {searchTerm || selectedRole || statusFilter !== 'all'
              ? 'Try adjusting your search criteria'
              : 'Get started by creating your first admin'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminList;