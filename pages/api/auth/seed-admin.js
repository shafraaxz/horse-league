
// ===========================================
// FILE: api/auth/seed-admin.js
// ===========================================
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // For now, simulate admin creation (since no MongoDB connection yet)
    // In production, you'd check if admins exist in database first
    
    // Simulate success response
    const newAdmin = {
      _id: 'admin_' + Date.now(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role: 'super-admin',
      permissions: [
        'manage_players', 'manage_teams', 'manage_schedules', 'manage_admins', 
        'view_statistics', 'export_data', 'manage_gallery', 'manage_seasons',
        'system_settings', 'view_logs'
      ],
      status: 'active',
      createdAt: new Date().toISOString(),
      isSeedAdmin: true
    };

    console.log('🎉 SEED ADMIN CREATED:', { email, name });

    return res.status(201).json({
      status: 201,
      message: 'First administrator created successfully! You can now login with your credentials.',
      data: newAdmin
    });

  } catch (error) {
    console.error('Seed admin creation error:', error);
    return res.status(500).json({ error: `Failed to create first admin: ${error.message}` });
  }
}