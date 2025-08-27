// scripts/seed-admin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// MongoDB URI from environment
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/football-league';

// Admin Schema (simplified for seeding)
const AdminSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: String,
  permissions: Object,
  isActive: Boolean,
  createdAt: Date
});

const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

async function createDemoAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if demo admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@demo.com' });
    if (existingAdmin) {
      console.log('Demo admin already exists!');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('demo123', 10);

    // Create demo admin
    const demoAdmin = await Admin.create({
      name: 'Demo Admin',
      email: 'admin@demo.com',
      password: hashedPassword,
      role: 'super_admin',
      isActive: true,
      permissions: {
        canCreateLeague: true,
        canEditLeague: true,
        canDeleteLeague: true,
        canManageTeams: true,
        canManageMatches: true,
        canManagePlayers: true,
        canViewReports: true
      },
      createdAt: new Date()
    });

    console.log('✅ Demo admin created successfully!');
    console.log('📧 Email: admin@demo.com');
    console.log('🔑 Password: demo123');
    console.log('👤 Role: super_admin');
    
  } catch (error) {
    console.error('Error creating demo admin:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

createDemoAdmin();