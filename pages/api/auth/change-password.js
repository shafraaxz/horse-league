// api/auth/change-password.js - Change Password
export default withDatabase(
  compose(
    cors,
    rateLimit(),
    authenticate,
    async (req, res) => {
      if (req.method !== 'PUT') {
        res.setHeader('Allow', ['PUT']);
        return res.status(405).json(formatError('Method not allowed'));
      }

      const { currentPassword, newPassword, confirmPassword } = req.body;

      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json(formatError('All password fields are required'));
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json(formatError('New passwords do not match'));
      }

      if (newPassword.length < 8) {
        return res.status(400).json(formatError('New password must be at least 8 characters long'));
      }

      try {
        // Get current admin with password hash
        const admin = await req.db.collection('admins')
          .findOne({ _id: req.admin._id });

        if (!admin) {
          return res.status(404).json(formatError('Admin not found'));
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, admin.passwordHash);

        if (!isValidPassword) {
          return res.status(401).json(formatError('Current password is incorrect'));
        }

        // Hash new password
        const saltRounds = 12;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await req.db.collection('admins')
          .updateOne(
            { _id: admin._id },
            { 
              $set: { 
                passwordHash: newPasswordHash,
                updatedAt: new Date(),
                loginAttempts: 0
              },
              $unset: { lockedUntil: '' }
            }
          );

        // Invalidate all refresh tokens for this admin
        await req.db.collection('refresh_tokens')
          .deleteMany({ adminId: admin._id });

        res.status(200).json(formatResponse(null, 'Password changed successfully'));
      } catch (error) {
        console.error('Change Password Error:', error);
        res.status(500).json(formatError('Failed to change password'));
      }
    }
  )
);
