// api/auth/login.js - Admin Login
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { 
  compose, 
  cors, 
  rateLimit 
} from '../_lib/middleware.js';
import { 
  formatResponse, 
  formatError 
} from '../_lib/utils.js';
import { withDatabase } from '../_lib/mongodb.js';

export default withDatabase(
  compose(
    cors,
    rateLimit(60000, 5), // 5 attempts per minute
    async (req, res) => {
      if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json(formatError('Method not allowed'));
      }

      const { email, password, rememberMe = false } = req.body;

      if (!email || !password) {
        return res.status(400).json(formatError('Email and password are required'));
      }

      try {
        // Find admin by email
        const admin = await req.db.collection('admins')
          .findOne({ email: email.toLowerCase() });

        if (!admin) {
          return res.status(401).json(formatError('Invalid credentials'));
        }

        // Check if account is locked
        if (admin.lockedUntil && admin.lockedUntil > new Date()) {
          const timeLeft = Math.ceil((admin.lockedUntil - new Date()) / 60000);
          return res.status(423).json(formatError(`Account is locked. Try again in ${timeLeft} minutes.`));
        }

        // Check if account is active
        if (admin.status !== 'active') {
          return res.status(403).json(formatError('Account is inactive. Contact administrator.'));
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, admin.passwordHash);

        if (!isValidPassword) {
          // Increment login attempts
          const loginAttempts = (admin.loginAttempts || 0) + 1;
          const updateData = { loginAttempts };

          // Lock account after 5 failed attempts
          if (loginAttempts >= 5) {
            updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
          }

          await req.db.collection('admins')
            .updateOne(
              { _id: admin._id },
              { $set: updateData }
            );

          return res.status(401).json(formatError(`Invalid credentials. ${5 - loginAttempts} attempts remaining.`));
        }

        // Reset login attempts and update last login
        await req.db.collection('admins')
          .updateOne(
            { _id: admin._id },
            { 
              $set: { 
                lastLogin: new Date(),
                loginAttempts: 0,
                lastLoginIP: req.headers['x-forwarded-for'] || req.connection.remoteAddress
              },
              $unset: { lockedUntil: '' }
            }
          );

        // Generate JWT tokens
        const tokenPayload = {
          adminId: admin._id.toString(),
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions,
          name: admin.name
        };

        const accessToken = jwt.sign(
          tokenPayload,
          process.env.JWT_SECRET,
          { expiresIn: rememberMe ? '7d' : '24h' }
        );

        const refreshToken = jwt.sign(
          { adminId: admin._id.toString() },
          process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
          { expiresIn: '30d' }
        );

        // Store refresh token in database
        await req.db.collection('refresh_tokens')
          .insertOne({
            token: refreshToken,
            adminId: admin._id,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            createdAt: new Date()
          });

        // Return success response
        const response = {
          admin: {
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            permissions: admin.permissions,
            lastLogin: new Date(),
            avatar: admin.avatar || null
          },
          accessToken,
          refreshToken,
          expiresIn: rememberMe ? '7d' : '24h'
        };

        res.status(200).json(formatResponse(response, 'Login successful'));
      } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json(formatError('Login failed. Please try again.'));
      }
    }
  )
);
