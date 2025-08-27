// scripts/seed-database.js
// =====================================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// You'll need to adjust these paths based on your actual model locations
// For ES modules in Next.js, you might need to use dynamic imports

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Since Next.js uses ES modules, we need to handle imports differently
    // Option 1: Convert models to CommonJS for scripts
    // Option 2: Use dynamic imports (shown below)
    
    const { default: Admin } = await import('../models/Admin.js');
    const { default: League } = await import('../models/League.js');
    const { default: Team } = await import('../models/Team.js');
    const { default: Player } = await import('../models/Player.js');

    // Clear existing data (optional - comment out in production)
    console.log('Clearing existing data...');
    await Admin.deleteMany({});
    await League.deleteMany({});
    await Team.deleteMany({});
    await Player.deleteMany({});
    console.log('Cleared existing data');

    // Create Super Admin
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const superAdmin = await Admin.create({
      name: 'Super Admin',
      email: 'admin@footballleague.com',
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
        canViewReports: true,
        canManageAdmins: true
      }
    });
    console.log('✅ Created Super Admin');

    // Create Sample League
    const league = await League.create({
      name: 'Premier League 2024',
      type: 'league',
      sport: 'football',
      status: 'active',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      pointsForWin: 3,
      pointsForDraw: 1,
      pointsForLoss: 0
    });
    console.log('✅ Created League:', league.name);

    // Create Sample Teams
    const teamData = [
      { name: 'Thunder FC', color: '#FF6B6B' },
      { name: 'Lightning United', color: '#4ECDC4' },
      { name: 'Storm City', color: '#45B7D1' },
      { name: 'Hurricane Athletic', color: '#96CEB4' }
    ];
    
    const teams = [];

    for (const data of teamData) {
      const team = await Team.create({
        name: data.name,
        shortName: data.name.substring(0, 3).toUpperCase(),
        primaryColor: data.color,
        secondaryColor: '#FFFFFF',
        homeGround: `${data.name} Stadium`,
        coach: `Coach ${data.name.split(' ')[0]}`,
        leagues: [league._id],
        statistics: {
          matchesPlayed: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          points: 0,
          cleanSheets: 0
        }
      });
      teams.push(team);
      console.log(`✅ Created Team: ${team.name}`);
    }

    // Update league with teams
    league.teams = teams.map(t => t._id);
    await league.save();

    // Create Sample Players for each team
    const positions = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];
    const playerNames = [
      'John Smith', 'Mike Johnson', 'David Williams', 'James Brown',
      'Robert Jones', 'Michael Davis', 'William Miller', 'Richard Wilson',
      'Joseph Moore', 'Thomas Taylor', 'Charles Anderson'
    ];
    
    for (const team of teams) {
      const teamPlayers = [];
      
      for (let i = 1; i <= 11; i++) {
        const player = await Player.create({
          name: playerNames[i - 1] || `Player ${i}`,
          jerseyNumber: i,
          position: i === 1 ? 'Goalkeeper' : positions[Math.floor(Math.random() * 3) + 1],
          dateOfBirth: new Date(1995 + Math.floor(Math.random() * 10), 
                               Math.floor(Math.random() * 12), 
                               Math.floor(Math.random() * 28) + 1),
          nationality: ['USA', 'UK', 'Brazil', 'Spain', 'Germany'][Math.floor(Math.random() * 5)],
          height: 170 + Math.floor(Math.random() * 20),
          weight: 65 + Math.floor(Math.random() * 20),
          preferredFoot: ['Left', 'Right', 'Both'][Math.floor(Math.random() * 3)],
          team: team._id,
          statistics: {
            matchesPlayed: 0,
            goals: 0,
            assists: 0,
            yellowCards: 0,
            redCards: 0,
            cleanSheets: 0,
            saves: 0
          }
        });
        teamPlayers.push(player._id);
      }
      
      // Update team with players
      team.players = teamPlayers;
      await team.save();
      console.log(`✅ Created 11 players for ${team.name}`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ DATABASE SEEDED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log('\n📧 Login credentials:');
    console.log('Email: admin@footballleague.com');
    console.log('Password: admin123');
    console.log('\n💡 You can now start the development server:');
    console.log('npm run dev');
    console.log('='.repeat(50));

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();
