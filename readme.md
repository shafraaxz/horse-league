# Football League Manager

A comprehensive football league management system built with Next.js, MongoDB, and modern web technologies. Manage leagues, teams, players, matches, and live scores with an intuitive admin panel.

## Features

### 🏆 League Management
- Create and manage multiple leagues
- Upload league logos and branding
- Real-time live match tracking
- Comprehensive league statistics

### 👥 Team & Player Management
- Add teams with logos and player rosters
- Player statistics tracking (goals, cards)
- Jersey number validation
- Player photo uploads

### 📅 Match Scheduling
- Flexible schedule generation (single/double round robin)
- Custom round configuration
- Multiple time slots and venues
- Automated fixture generation

### ⚽ Live Match Management
- Real-time score updates
- Live player statistics
- Yellow/red card tracking
- Goal scoring records

### 📊 Statistics & Analytics
- League tables with automatic calculations
- Top scorers and disciplinary records
- Match history and results
- Exportable reports

### 🔐 Admin System
- Role-based access control (Admin, Moderator, Scorer)
- Secure authentication with JWT
- Multi-user support

## Tech Stack

- **Frontend**: Next.js 14, React 18
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with bcryptjs
- **File Upload**: Cloudinary integration
- **Styling**: CSS-in-JS with modern design
- **Deployment**: Vercel-ready

## Quick Deploy to Vercel

### Prerequisites
1. **MongoDB Atlas Account**: Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. **Cloudinary Account**: Create a free account at [Cloudinary](https://cloudinary.com/)
3. **Vercel Account**: Create a free account at [Vercel](https://vercel.com/)

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/football-manager)

### Manual Deployment Steps

1. **Fork/Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/football-manager.git
   cd football-manager
   ```

2. **Set Up Environment Variables**
   
   Create accounts and get your credentials:
   
   **MongoDB Atlas:**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a new cluster (free tier available)
   - Get your connection string
   
   **Cloudinary:**
   - Go to [Cloudinary](https://cloudinary.com/)
   - Sign up for free account
   - Get your cloud name, API key, and API secret from dashboard

3. **Deploy to Vercel**
   
   **Option A: Using Vercel CLI**
   ```bash
   npm i -g vercel
   vercel
   ```
   
   **Option B: Using Vercel Dashboard**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Add environment variables (see below)
   - Deploy!

4. **Environment Variables in Vercel**
   
   Add these in Vercel Dashboard → Project Settings → Environment Variables:
   
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/football-manager?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
   CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret
   ```

5. **First Time Setup**
   - Visit your deployed app
   - The database will auto-initialize with default admin account
   - Login with: username: `admin`, password: `admin123`
   - Change the default password immediately!

## Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Access Application**
   - Open [http://localhost:3000](http://localhost:3000)
   - Default login: admin/admin123

## File Structure

```
football-manager/
├── pages/
│   ├── api/
│   │   ├── auth/
│   │   │   └── login.js          # Authentication
│   │   ├── leagues/
│   │   │   ├── index.js          # League CRUD
│   │   │   └── [id]/
│   │   │       └── data.js       # League data with stats
│   │   ├── teams/
│   │   │   └── index.js          # Team management
│   │   ├── players/
│   │   │   └── index.js          # Player management
│   │   ├── matches/
│   │   │   └── index.js          # Match management
│   │   ├── admin/
│   │   │   └── index.js          # Admin management
│   │   └── init.js               # Database initialization
│   └── index.js                  # Main application page
├── lib/
│   ├── mongodb.js                # Database connection
│   ├── models.js                 # Mongoose schemas
│   ├── auth.js                   # Authentication helpers
│   └── cloudinary.js             # File upload handling
├── package.json
├── next.config.js
├── vercel.json
└── README.md
```

## API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/init` - Initialize database

### Leagues
- `GET /api/leagues` - Get all leagues
- `POST /api/leagues` - Create league
- `DELETE /api/leagues?id={id}` - Delete league
- `GET /api/leagues/{id}/data` - Get league with full data

### Teams
- `POST /api/teams` - Create team
- `PUT /api/teams` - Update team
- `DELETE /api/teams?id={id}` - Delete team

### Players
- `POST /api/players` - Create player
- `PUT /api/players` - Update player stats
- `DELETE /api/players?id={id}` - Delete player

### Matches
- `POST /api/matches` - Generate schedule
- `PUT /api/matches` - Update match
- `DELETE /api/matches?id={id}` - Delete match

## Default Admin Account

**Username:** `admin`  
**Password:** `admin123`  
**Role:** `admin`

⚠️ **Important**: Change the default password immediately after first login!

## Features Walkthrough

### 1. League Creation
- Go to Admin panel
- Create new league with name and logo
- System automatically generates league structure

### 2. Team Management
- Add teams to selected league
- Upload team logos
- Add player rosters with photos

### 3. Schedule Generation
- Choose between single/double round robin
- Set match dates and time slots
- Generate automated fixtures

### 4. Live Match Management
- Start live matches from admin panel
- Update scores in real-time
- Track player statistics during matches

### 5. Statistics & Reports
- Automatic league table calculations
- Top scorer and disciplinary statistics
- Exportable match schedules

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation above
- Review the API endpoints

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Ready to deploy?** Click the Vercel button above or follow the manual deployment steps!