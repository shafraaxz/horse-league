// pages/api/players/pool.js - Player Pool Specific Operations
export async function poolHandler(req, res) {
  await dbConnect();
  
  const { method } = req;
  
  switch (method) {
    case 'GET':
      return handleGetPoolStats(req, res);
    default:
      res.setHeader('Allow', ['GET']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}

async function handleGetPoolStats(req, res) {
  try {
    // Get overall pool statistics
    const stats = await Player.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$registrationStatus', 'pending'] }, 1, 0] }
          },
          approved: {
            $sum: { $cond: [{ $eq: ['$registrationStatus', 'approved'] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$registrationStatus', 'rejected'] }, 1, 0] }
          },
          suspended: {
            $sum: { $cond: [{ $eq: ['$registrationStatus', 'suspended'] }, 1, 0] }
          },
          assigned: {
            $sum: { $cond: [{ $ne: ['$currentTeam', null] }, 1, 0] }
          },
          available: {
            $sum: { 
              $cond: [
                { 
                  $and: [
                    { $eq: ['$currentTeam', null] },
                    { $eq: ['$registrationStatus', 'approved'] },
                    { $eq: ['$eligibility.isEligible', true] }
                  ]
                }, 
                1, 
                0
              ]
            }
          }
        }
      }
    ]);

    // Get position-wise breakdown
    const positionStats = await Player.aggregate([
      {
        $match: { 
          isActive: true,
          registrationStatus: 'approved',
          'eligibility.isEligible': true
        }
      },
      {
        $group: {
          _id: '$position',
          total: { $sum: 1 },
          available: {
            $sum: { $cond: [{ $eq: ['$currentTeam', null] }, 1, 0] }
          },
          assigned: {
            $sum: { $cond: [{ $ne: ['$currentTeam', null] }, 1, 0] }
          }
        }
      }
    ]);

    // Get recent registrations
    const recentRegistrations = await Player.find({
      isActive: true,
      'poolEntry.registrationDate': {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      }
    })
    .populate('poolEntry.registeredBy', 'name')
    .sort({ 'poolEntry.registrationDate': -1 })
    .limit(10);

    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || {
          total: 0, pending: 0, approved: 0, rejected: 0, 
          suspended: 0, assigned: 0, available: 0
        },
        positions: positionStats,
        recentRegistrations
      }
    });
  } catch (error) {
    console.error('Error fetching pool stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching pool statistics', 
      error: error.message 
    });
  }
}