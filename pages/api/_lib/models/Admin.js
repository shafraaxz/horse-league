// api/_lib/models/Admin.js
export const AdminModel = {
  collection: 'admins',
  
  schema: {
    _id: 'ObjectId',
    name: 'String',
    email: 'String',
    phone: 'String',
    role: 'String', // super-admin, admin, moderator
    permissions: ['String'],
    status: 'String', // active, inactive
    passwordHash: 'String',
    lastLogin: 'Date',
    loginAttempts: 'Number',
    lockedUntil: 'Date',
    createdAt: 'Date',
    updatedAt: 'Date'
  },

  validate(data) {
    const errors = [];
    
    if (!data.name || data.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    }
    
    if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) {
      errors.push('Valid email is required');
    }
    
    if (!['super-admin', 'admin', 'moderator'].includes(data.role)) {
      errors.push('Invalid role');
    }
    
    return errors;
  }
};