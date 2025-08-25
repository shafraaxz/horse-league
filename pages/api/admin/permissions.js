// api/admins/permissions.js - Available Permissions
export default withDatabase(
  compose(
    cors,
    rateLimit(),
    authenticate,
    requirePermission('manage_admins'),
    async (req, res) => {
      if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json(formatError('Method not allowed'));
      }

      const permissions = [
        { 
          key: 'manage_players',
          name: 'Player Management',
          description: 'Create, edit, and delete players'
        },
        { 
          key: 'manage_teams',
          name: 'Team Management',
          description: 'Create, edit, and delete teams'
        },
        { 
          key: 'manage_schedules',
          name: 'Schedule Management',
          description: 'Create and manage match schedules'
        },
        { 
          key: 'manage_admins',
          name: 'Admin Management',
          description: 'Create, edit, and delete administrators'
        },
        { 
          key: 'view_statistics',
          name: 'View Statistics',
          description: 'Access league statistics and reports'
        },
        { 
          key: 'export_data',
          name: 'Export Data',
          description: 'Export league data to various formats'
        },
        { 
          key: 'manage_gallery',
          name: 'Gallery Management',
          description: 'Upload and manage league photos'
        },
        { 
          key: 'manage_seasons',
          name: 'Season Management',
          description: 'Create and manage league seasons'
        },
        { 
          key: 'system_settings',
          name: 'System Settings',
          description: 'Modify system-wide settings'
        },
        { 
          key: 'view_logs',
          name: 'View Activity Logs',
          description: 'View system activity and audit logs'
        }
      ];

      res.status(200).json(formatResponse(permissions, 'Permissions retrieved successfully'));
    }
  )
);