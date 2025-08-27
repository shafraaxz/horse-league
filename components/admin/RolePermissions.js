// components/admin/RolePermissions.js
import React from 'react';
import { Check, X } from 'lucide-react';

const RolePermissions = () => {
  const roles = [
    { id: 'super_admin', label: 'Super Admin' },
    { id: 'league_admin', label: 'League Admin' },
    { id: 'team_manager', label: 'Team Manager' },
    { id: 'viewer', label: 'Viewer' }
  ];

  const permissions = [
    { id: 'canCreateLeague', label: 'Create Leagues' },
    { id: 'canEditLeague', label: 'Edit Leagues' },
    { id: 'canDeleteLeague', label: 'Delete Leagues' },
    { id: 'canManageTeams', label: 'Manage Teams' },
    { id: 'canManageMatches', label: 'Manage Matches' },
    { id: 'canManagePlayers', label: 'Manage Players' },
    { id: 'canViewReports', label: 'View Reports' }
  ];

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

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Role Permissions Matrix</h2>
        <p className="text-gray-600 mb-6">
          Overview of permissions assigned to each role in the system
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Permission
              </th>
              {roles.map(role => (
                <th key={role.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {role.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {permissions.map((permission, index) => (
              <tr key={permission.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {permission.label}
                </td>
                {roles.map(role => (
                  <td key={role.id} className="px-6 py-4 whitespace-nowrap text-center">
                    {rolePermissions[role.id][permission.id] ? (
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-red-500 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-6 bg-gray-50">
        <h3 className="font-semibold text-gray-800 mb-3">Role Descriptions</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p><strong>Super Admin:</strong> Full system access with all permissions</p>
          <p><strong>League Admin:</strong> Manage assigned leagues, teams, and matches</p>
          <p><strong>Team Manager:</strong> Manage teams and players within assigned leagues</p>
          <p><strong>Viewer:</strong> View-only access to reports and statistics</p>
        </div>
      </div>
    </div>
  );
};

export default RolePermissions;