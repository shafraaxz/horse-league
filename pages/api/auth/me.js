// api/auth/me.js - Get Current Admin Profile
import { 
  compose, 
  cors, 
  rateLimit, 
  authenticate 
} from '../_lib/middleware.js';

export default withDatabase(
  compose(
    cors,
    rateLimit(),
    authenticate,
    async (req, res) => {
      if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json(formatError('Method not allowed'));
      }

      try {
        const admin = await req.db.collection('admins')
          .findOne(
            { _id: req.admin._id },
            { projection: { passwordHash: 0 } }
          );

        if (!admin) {
          return res.status(404).json(formatError('Admin not found'));
        }

        res.status(200).json(formatResponse(admin, 'Profile retrieved successfully'));
      } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json(formatError('Failed to get profile'));
      }
    }
  )
);
