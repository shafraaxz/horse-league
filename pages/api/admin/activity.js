// api/admins/activity.js - Admin Activity Logs
export default withDatabase(
  compose(
    cors,
    rateLimit(),
    authenticate,
    requirePermission('view_logs'),
    async (req, res) => {
      if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json(formatError('Method not allowed'));
      }

      const { 
        page = 1, 
        limit = 50, 
        adminId,
        action,
        dateFrom,
        dateTo 
      } = req.query;

      try {
        const query = {};
        
        if (adminId) query.adminId = new ObjectId(adminId);
        if (action) query.action = action;
        if (dateFrom || dateTo) {
          query.createdAt = {};
          if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
          if (dateTo) query.createdAt.$lte = new Date(dateTo);
        }

        const skip = (page - 1) * limit;
        const [activities, total] = await Promise.all([
          req.db.collection('admin_activity')
            .find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .toArray(),
          req.db.collection('admin_activity').countDocuments(query)
        ]);

        // Get admin details for each activity
        const activitiesWithDetails = await Promise.all(
          activities.map(async (activity) => {
            const admin = await req.db.collection('admins')
              .findOne(
                { _id: activity.adminId },
                { projection: { name: 1, email: 1, role: 1 } }
              );
            
            return {
              ...activity,
              admin: admin || { name: 'Deleted Admin', email: '', role: '' }
            };
          })
        );

        const response = {
          activities: activitiesWithDetails,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        };

        res.status(200).json(formatResponse(response, 'Activity logs retrieved successfully'));
      } catch (error) {
        console.error('Activity Logs Error:', error);
        res.status(500).json(formatError('Failed to retrieve activity logs'));
      }
    }
  )
);
