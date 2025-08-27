// pages/api/init.js - Database Initialization
import dbConnect from '../../lib/mongodb';
import User from '../../models/User';
import League from '../../models/League';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  const { method } = req;

  console.log(`Database Init API: ${method} /api/init`);

  if (method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: `Method ${method} not allowed`
    });
  }

  try {
    await dbConnect();
    console.log('Database connected successfully');

    // Check if admin user exists
    let adminUser = await User.findOne({ username: 'admin' });

    if (!adminUser) {
      console.log('Creating default admin user...');
      
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      adminUser = new User({
        name: 'Administrator',
        username: 'admin',
        email: 'admin@horsefutsal.com',
        password: hashedPassword,
        role: 'super_admin',
        isActive: true,
        emailVerified: true
      });

      await adminUser.save();
      console.log('Default admin user created');
    } else {
      console.log('Admin user already exists');
    }

    // Check if main league exists
    let mainLeague = await League.findOne({ 
      $or: [
        { slug: 'the-horse-futsal-league' },
        { isDefault: true }
      ]
    });

    if (!mainLeague) {
      console.log('Creating The Horse Futsal League...');
      
      mainLeague = new League({
        name: 'The Horse Futsal League',
        shortName: 'HFL',
        slug: 'the-horse-futsal-league',
        sport: 'futsal',
        description: 'The premier futsal competition featuring the best teams and players',
        currentSeason: '2025/26',
        status: 'active',
        isDefault: true,
        isActive: true,
        maxTeams: 16,
        maxPlayersPerTeam: 20,
        minPlayersPerTeam: 11,
        pointsForWin: 3,
        pointsForDraw: 1,
        pointsForLoss: 0,
        rules: {
          matchDuration: 40,
          halfTimeDuration: 10,
          substitutionsAllowed: 5,
          playersOnField: 5
        },
        settings: {
          allowPlayerTransfers: true,
          requirePlayerPhotos: true,
          requireMedicalCertificates: false,
          autoGenerateSchedule: true,
          publicRegistration: false,
          enableLiveScoring: true,
          enableStatistics: true
        },
        createdBy: adminUser._id
      });

      await mainLeague.save();
      console.log('The Horse Futsal League created');
    } else {
      console.log('Main league already exists');
    }

    return res.status(200).json({
      success: true,
      message: 'Database initialized successfully',
      data: {
        adminCreated: !adminUser.lastLogin,
        leagueCreated: !mainLeague.updatedAt,
        adminCredentials: {
          username: 'admin',
          password: 'admin123'
        }
      }
    });

  } catch (error) {
    console.error('Database initialization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Database initialization failed',
      error: error.message
    });
  }
}