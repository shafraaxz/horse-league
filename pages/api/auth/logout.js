// api/auth/logout.js - Logout
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

      try {
        if (refreshToken) {
          // Remove refresh token from database
          await req.db.collection('refresh_tokens')
            .deleteOne({ token: refreshToken });
        }

        res.status(200).json(formatResponse(null, 'Logged out successfully'));
      } catch (error) {
        console.error('Logout Error:', error);
        res.status(500).json(formatError('Logout failed'));
      }
    }
  )
);
