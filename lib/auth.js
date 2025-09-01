import bcrypt from 'bcryptjs';

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

export const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Simple admin verification without JWT for NextAuth compatibility
export const verifyAdmin = async (req) => {
  // This will be handled by NextAuth session verification
  // Individual API routes will check session.user.role === 'admin'
  return true;
};
