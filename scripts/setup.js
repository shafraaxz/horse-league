const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

async function createAdminUser() {
  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    console.error('Please set MONGODB_URI in your .env.local file');
    process.exit(1);
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    const users = db.collection('users');
    
    // Check if admin already exists
    const existingAdmin = await users.findOne({ email: 'admin@horsefutsal.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      await client.close();
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const adminUser = {
      name: 'Admin User',
      email: 'admin@horsefutsal.com',
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await users.insertOne(adminUser);
    
    // Create initial season
    const seasons = db.collection('seasons');
    const existingSeason = await seasons.findOne({ isActive: true });
    
    if (!existingSeason) {
      const currentYear = new Date().getFullYear();
      const season = {
        name: `${currentYear} Season`,
        startDate: new Date(`${currentYear}-01-01`),
        endDate: new Date(`${currentYear}-12-31`),
        isActive: true,
        maxTeams: 16,
        registrationDeadline: new Date(`${currentYear}-03-31`),
        description: 'Inaugural Horse Futsal Tournament Season',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await seasons.insertOne(season);
      console.log('Created initial season');
    }

    console.log('Setup completed successfully!');
    console.log('Admin credentials:');
    console.log('Email: admin@horsefutsal.com');
    console.log('Password: admin123');
    console.log('');
    console.log('Please change the admin password after first login!');
    
    await client.close();
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  createAdminUser();
}

module.exports = { createAdminUser };
