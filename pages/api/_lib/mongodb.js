import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'horse-futsal-league';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  await client.connect();

  const db = client.db(MONGODB_DB);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

// Helper function for API routes
export async function withDatabase(handler) {
  return async (req, res) => {
    try {
      const { db } = await connectToDatabase();
      req.db = db;
      return await handler(req, res);
    } catch (error) {
      console.error('Database connection error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Database connection failed' 
      });
    }
  };
}

// Collections helper
export const collections = {
  players: 'players',
  teams: 'teams',
  matches: 'matches',
  transfers: 'transfers',
  seasons: 'seasons',
  gallery: 'gallery',
  admins: 'admins'
};