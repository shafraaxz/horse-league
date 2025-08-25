// api/auth/refresh.js - Refresh Token
export default withDatabase(
  compose(
    cors,
    rateLimit(),
    async (req, res) => {
      if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json(formatError('Method not allowed'));
      }

      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json(formatError('Refresh token is required'));
      }

      try {
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);

        // Check if refresh token exists in database
        const storedToken = await req.db.collection('refresh_tokens')
          .findOne({ token: refreshToken, adminId: new ObjectId(decoded.adminId) });

        if (!storedToken || storedToken.expiresAt < new Date()) {
          return res.status(401).json(formatError('Invalid or expired refresh token'));
        }

        // Get admin details
        const admin = await req.db.collection('admins')
          .findOne({ _id: new ObjectId(decoded.adminId), status: 'active' });

        if (!admin) {
          return res.status(401).json(formatError('Admin not found or inactive'));
        }

        // Generate new access token
        const newAccessToken = jwt.sign(
          {
            adminId: admin._id.toString(),
            email: admin.email,
            role: admin.role,
            permissions: admin.permissions,
            name: admin.name
          },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        const response = {
          accessToken: newAccessToken,
          expiresIn: '24h'
        };

        res.status(200).json(formatResponse(response, 'Token refreshed successfully'));
      } catch (error) {
        console.error('Refresh Token Error:', error);
        res.status(401).json(formatError('Invalid refresh token'));
      }
    }
  )
);
