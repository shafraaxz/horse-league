// components/admin/AdminUserModal.js
import { useState, useEffect } from 'react';
import { X, User, Shield, Eye, EyeOff } from 'lucide-react';

const AdminUserModal = ({ isOpen, onClose, admin, onSave, currentUser }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'moderator',
    isActive: true,
    email: '',
    fullName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Reset form when modal opens/closes or admin changes
  useEffect(() => {
    if (isOpen) {
      if (admin) {
        // Editing existing admin
        setFormData({
          _id: admin._id,
          username: admin.username || '',
          password: '', // Don't pre-fill password for security
          confirmPassword: '',
          role: admin.role || 'moderator',
          isActive: admin.isActive !== undefined ? admin.isActive : true,
          email: admin.email || '',
          fullName: admin.fullName || ''
        });
      } else {
        // Creating new admin
        setFormData({
          username: '',
          password: '',
          confirmPassword: '',
          role: 'moderator',
          isActive: true,
          email: '',
          fullName: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, admin]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Password validation (only for new users or when password is provided)
    if (!admin || formData.password) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    // Email validation (optional but if provided, must be valid)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Role validation
    if (!['admin', 'moderator'].includes(formData.role)) {
      newErrors.role = 'Please select a valid role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const submitData = {
        username: formData.username.trim(),
        role: formData.role,
        isActive: formData.isActive,
        email: formData.email.trim(),
        fullName: formData.fullName.trim()
      };

      // Add password only if it's provided (new user or password change)
      if (formData.password) {
        submitData.password = formData.password;
      }

      // Add ID for updates
      if (admin?._id) {
        submitData._id = admin._id;
      }

      await onSave(submitData);
    } catch (error) {
      console.error('Failed to save admin:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl max-w-md w-full border border-slate-700">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              {admin ? 'Edit Admin User' : 'Create Admin User'}
            </h3>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Username *
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                errors.username 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-slate-600 focus:ring-blue-500'
              }`}
              placeholder="Enter username"
              disabled={admin && admin.username === 'admin'} // Prevent editing default admin username
            />
            {errors.username && (
              <p className="text-red-400 text-sm mt-1">{errors.username}</p>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              placeholder="Enter full name"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                errors.email 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-slate-600 focus:ring-blue-500'
              }`}
              placeholder="Enter email address"
            />
            {errors.email && (
              <p className="text-red-400 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Role *
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              disabled={admin && admin.username === 'admin'} // Prevent changing default admin role
            >
              <option value="moderator">Moderator</option>
              <option value="admin">Administrator</option>
            </select>
            <p className="text-slate-400 text-sm mt-1">
              {formData.role === 'admin' 
                ? 'Full system access including user management' 
                : 'Can manage leagues, teams, and matches'
              }
            </p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Password {!admin && '*'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 pr-12 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                  errors.password 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-slate-600 focus:ring-blue-500'
                }`}
                placeholder={admin ? "Leave empty to keep current password" : "Enter password"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-400 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          {(!admin || formData.password) && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 pr-12 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                    errors.confirmPassword 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-slate-600 focus:ring-blue-500'
                  }`}
                  placeholder="Confirm password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>
          )}

          {/* Active Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="isActive"
              id="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="w-4 h-4 text-blue-500 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
              disabled={admin && admin.username === currentUser?.username} // Prevent deactivating own account
            />
            <label htmlFor="isActive" className="text-sm font-medium text-slate-300">
              Active Account
            </label>
          </div>
          {admin && admin.username === currentUser?.username && (
            <p className="text-slate-400 text-sm">You cannot deactivate your own account</p>
          )}
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : admin ? 'Update Admin' : 'Create Admin'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminUserModal;