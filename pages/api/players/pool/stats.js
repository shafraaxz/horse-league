// pages/api/players/pool/stats.js - Pool Statistics Endpoint
import dbConnect from '../../../../lib/mongodb';
import Player from '../../../../models/Player';
import Team from '../../../../models/Team';
import League from '../../../../models/League';
import { verifyToken } from '../../../../lib/auth';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Verify authentication
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token.' });
  }

  try {
    const { timeframe = '30', position, league } = req.query;
    const daysAgo = parseInt(timeframe);
    const fromDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    // Overall pool statistics
    const overallStats = await Player.aggregate([
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
          },
          ineligible: {
            $sum: { $cond: [{ $eq: ['$eligibility.isEligible', false] }, 1, 0] }
          }
        }
      }
    ]);

    // Position breakdown
    const positionStats = await Player.aggregate([
      {
        $match: { 
          isActive: true,
          registrationStatus: 'approved'
        }
      },
      {
        $group: {
          _id: '$position',
          total: { $sum: 1 },
          available: {
            $sum: { 
              $cond: [
                {
                  $and: [
                    { $eq: ['$currentTeam', null] },
                    { $eq: ['$eligibility.isEligible', true] }
                  ]
                }, 
                1, 
                0
              ]
            }
          },
          assigned: {
            $sum: { $cond: [{ $ne: ['$currentTeam', null] }, 1, 0] }
          },
          avgAge: {
            $avg: {
              $divide: [
                { $subtract: [new Date(), '$dateOfBirth'] },
                365.25 * 24 * 60 * 60 * 1000
              ]
            }
          }
        }
      },
      {
        $project: {
          position: '$_id',
          total: 1,
          available: 1,
          assigned: 1,
          avgAge: { $round: ['$avgAge', 1] }
        }
      },
      {
        $sort: { position: 1 }
      }
    ]);

    // Registration trends
    const registrationTrends = await Player.aggregate([
      {
        $match: {
          isActive: true,
          'poolEntry.registrationDate': { $gte: fromDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$poolEntry.registrationDate'
            }
          },
          count: { $sum: 1 },
          approved: {
            $sum: { $cond: [{ $eq: ['$registrationStatus', 'approved'] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$registrationStatus', 'pending'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Nationality breakdown
    const nationalityStats = await Player.aggregate([
      {
        $match: { 
          isActive: true,
          registrationStatus: 'approved'
        }
      },
      {
        $group: {
          _id: '$nationality',
          count: { $sum: 1 },
          available: {
            $sum: { 
              $cond: [
                {
                  $and: [
                    { $eq: ['$currentTeam', null] },
                    { $eq: ['$eligibility.isEligible', true] }
                  ]
                }, 
                1, 
                0
              ]
            }
          }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Age distribution
    const ageStats = await Player.aggregate([
      {
        $match: { 
          isActive: true,
          registrationStatus: 'approved'
        }
      },
      {
        $addFields: {
          age: {
            $floor: {
              $divide: [
                { $subtract: [new Date(), '$dateOfBirth'] },
                365.25 * 24 * 60 * 60 * 1000
              ]
            }
          }
        }
      },
      {
        $bucket: {
          groupBy: '$age',
          boundaries: [16, 18, 21, 25, 30, 35, 50],
          default: 'other',
          output: {
            count: { $sum: 1 },
            available: {
              $sum: { 
                $cond: [
                  {
                    $and: [
                      { $eq: ['$currentTeam', null] },
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
      }
    ]);

    // Team assignment statistics
    const teamStats = await Team.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $lookup: {
          from: 'players',
          localField: '_id',
          foreignField: 'currentTeam',
          as: 'players'
        }
      },
      {
        $project: {
          name: 1,
          shortName: 1,
          playerCount: { $size: '$players' },
          maxPlayers: '$squadConfig.maxPlayers',
          utilization: {
            $multiply: [
              { $divide: [{ $size: '$players' }, '$squadConfig.maxPlayers'] },
              100
            ]
          }
        }
      },
      {
        $sort: { playerCount: -1 }
      }
    ]);

    // Recent activities
    const recentActivities = await Player.aggregate([
      {
        $match: {
          isActive: true,
          $or: [
            { 'poolEntry.registrationDate': { $gte: fromDate } },
            { 'poolEntry.approvalDate': { $gte: fromDate } },
            { 'teamAssignments.assignedDate': { $gte: fromDate } }
          ]
        }
      },
      {
        $lookup: {
          from: 'teams',
          localField: 'currentTeam',
          foreignField: '_id',
          as: 'team'
        }
      },
      {
        $lookup: {
          from: 'admins',
          localField: 'poolEntry.registeredBy',
          foreignField: '_id',
          as: 'registeredBy'
        }
      },
      {
        $project: {
          name: 1,
          position: 1,
          registrationStatus: 1,
          'poolEntry.registrationDate': 1,
          'poolEntry.approvalDate': 1,
          'teamAssignments.assignedDate': 1,
          teamName: { $arrayElemAt: ['$team.name', 0] },
          registeredByName: { $arrayElemAt: ['$registeredBy.name', 0] }
        }
      },
      {
        $sort: { 'poolEntry.registrationDate': -1 }
      },
      {
        $limit: 20
      }
    ]);

    // Transfer activities
    const transferStats = await Player.aggregate([
      {
        $match: {
          isActive: true,
          'teamAssignments.transferDate': { $gte: fromDate }
        }
      },
      {
        $unwind: '$teamAssignments'
      },
      {
        $match: {
          'teamAssignments.transferDate': { $gte: fromDate },
          'teamAssignments.status': 'transferred'
        }
      },
      {
        $lookup: {
          from: 'teams',
          localField: 'teamAssignments.team',
          foreignField: '_id',
          as: 'team'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$teamAssignments.transferDate'
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Performance metrics
    const performanceMetrics = {
      approvalRate: overallStats[0] ? 
        Math.round((overallStats[0].approved / (overallStats[0].approved + overallStats[0].rejected)) * 100) || 0 : 0,
      assignmentRate: overallStats[0] ? 
        Math.round((overallStats[0].assigned / overallStats[0].approved) * 100) || 0 : 0,
      avgProcessingTime: await getAverageProcessingTime(),
      documentsCompletionRate: await getDocumentsCompletionRate()
    };

    res.status(200).json({
      success: true,
      data: {
        overview: overallStats[0] || {
          total: 0, pending: 0, approved: 0, rejected: 0,
          suspended: 0, assigned: 0, available: 0, ineligible: 0
        },
        positions: positionStats,
        registrationTrends,
        nationalities: nationalityStats,
        ageDistribution: ageStats,
        teams: teamStats,
        recentActivities,
        transfers: transferStats,
        performance: performanceMetrics,
        timeframe: daysAgo
      }
    });
  } catch (error) {
    console.error('Error fetching pool statistics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching pool statistics', 
      error: error.message 
    });
  }
}

// Helper function to calculate average processing time
async function getAverageProcessingTime() {
  try {
    const result = await Player.aggregate([
      {
        $match: {
          isActive: true,
          registrationStatus: 'approved',
          'poolEntry.approvalDate': { $exists: true }
        }
      },
      {
        $project: {
          processingTime: {
            $divide: [
              { $subtract: ['$poolEntry.approvalDate', '$poolEntry.registrationDate'] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgProcessingTime: { $avg: '$processingTime' }
        }
      }
    ]);

    return result[0] ? Math.round(result[0].avgProcessingTime * 10) / 10 : 0;
  } catch (error) {
    console.error('Error calculating processing time:', error);
    return 0;
  }
}

// Helper function to calculate documents completion rate
async function getDocumentsCompletionRate() {
  try {
    const result = await Player.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $project: {
          requiredDocsCount: {
            $add: [
              { $cond: ['$documents.identityProof.uploaded', 1, 0] },
              { $cond: ['$documents.photo.uploaded', 1, 0] }
            ]
          },
          hasAllRequired: {
            $and: [
              '$documents.identityProof.uploaded',
              '$documents.photo.uploaded'
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalPlayers: { $sum: 1 },
          playersWithAllDocs: { $sum: { $cond: ['$hasAllRequired', 1, 0] } }
        }
      }
    ]);

    return result[0] ? 
      Math.round((result[0].playersWithAllDocs / result[0].totalPlayers) * 100) : 0;
  } catch (error) {
    console.error('Error calculating completion rate:', error);
    return 0;
  }
}

// pages/api/players/pool/dashboard.js - Dashboard Data Endpoint
export async function dashboardHandler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Quick stats for dashboard cards
    const quickStats = await Player.aggregate([
      {
        $facet: {
          overview: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                available: {
                  $sum: { 
                    $cond: [
                      { 
                        $and: [
                          { $eq: ['$currentTeam', null] },
                          { $eq: ['$registrationStatus', 'approved'] },
                          { $eq: ['$eligibility.isEligible', true] },
                          { $eq: ['$isActive', true] }
                        ]
                      }, 
                      1, 
                      0
                    ]
                  }
                },
                pending: {
                  $sum: { 
                    $cond: [
                      { 
                        $and: [
                          { $eq: ['$registrationStatus', 'pending'] },
                          { $eq: ['$isActive', true] }
                        ]
                      }, 
                      1, 
                      0
                    ]
                  }
                },
                assigned: {
                  $sum: { 
                    $cond: [
                      { 
                        $and: [
                          { $ne: ['$currentTeam', null] },
                          { $eq: ['$isActive', true] }
                        ]
                      }, 
                      1, 
                      0
                    ]
                  }
                }
              }
            }
          ],
          recentRegistrations: [
            {
              $match: {
                isActive: true,
                'poolEntry.registrationDate': {
                  $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
              }
            },
            {
              $count: 'count'
            }
          ],
          pendingApprovals: [
            {
              $match: {
                isActive: true,
                registrationStatus: 'pending'
              }
            },
            {
              $lookup: {
                from: 'admins',
                localField: 'poolEntry.registeredBy',
                foreignField: '_id',
                as: 'registeredBy'
              }
            },
            {
              $sort: { 'poolEntry.registrationDate': 1 }
            },
            {
              $limit: 5
            },
            {
              $project: {
                name: 1,
                position: 1,
                'poolEntry.registrationDate': 1,
                registeredByName: { $arrayElemAt: ['$registeredBy.name', 0] }
              }
            }
          ]
        }
      }
    ]);

    const result = quickStats[0];
    
    res.status(200).json({
      success: true,
      data: {
        overview: result.overview[0] || { total: 0, available: 0, pending: 0, assigned: 0 },
        recentRegistrations: result.recentRegistrations[0]?.count || 0,
        pendingApprovals: result.pendingApprovals
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching dashboard data', 
      error: error.message 
    });
  }
}