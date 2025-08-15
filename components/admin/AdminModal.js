// components/admin/AdminModal.js
import React, { useState, useEffect } from 'react';
import { X, Shield, User, Mail, Eye, EyeOff } from 'lucide-react';

const AdminModal = ({ isOpen, onClose, admin, onSave }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    role: 'admin',
    isActive: true,
    permissions: []
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const roles = [
    { value: 'super_admin', label: 'Super Admin', description: 'Full system access' },
    { value: 'admin', label: 'Admin', description: 'League management access' },
    { value: 'moderator', label: 'Moderator', description: 'Limited management access' },
    { value: 'scorer', label: 'Scorer', description: 'Live match scoring only' }
  ];

  const availablePermissions = [
    'manage_leagues',
    'manage_teams', 
    'manage_players',
    'manage_matches',
    'live_scoring',
    'view_reports',
    'manage_admins'
  ];

  useEffect(() => {
    if (admin) {
      setFormData({
        username: admin.username || '',
        password: '',
        confirmPassword: '',
        email: admin.email || '',
        role: admin.role || 'admin',
        isActive: admin.isActive !== undefined ? admin.isActive : true,
        permissions: admin.permissions || [],
        _id: admin._id
      });
    } else {
      setFormData({
        username: '',
        password: '',
        confirmPassword: '',
        email: '',
        role: 'admin',
        isActive: true,
        permissions: ['manage_teams', 'manage_players', 'manage_matches']
      });
    }
    setPasswordError('');
  }, [admin, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    
    // Password validation for new users
    if (!admin && !formData.password.trim()) {
      setPasswordError('Password is required for new admin users');
      return;
    }
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    if (formData.password && formData.password.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    
    try {
      const submitData = { ...formData };
      if (!formData.password) {
        delete submitData.password;
      }
      delete submitData.confirmPassword;
      
      await onSave(submitData);
    } catch (error) {
      console.error('Error saving admin:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (name === 'password' || name === 'confirmPassword') {
      setPasswordError('');
    }
  };

  const handlePermissionChange = (permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const getRoleInfo = (roleValue) => {
    return roles.find(r => r.value === roleValue) || roles[1];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-white">
                  {admin ? 'Edit Admin User' : 'Add New Admin'}
                </h3>
                <p className="text-slate-400 text-sm">Configure administrator account</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Account Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Username *</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter username"
                  required
                  disabled={admin} // Don't allow username changes for existing users
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password {!admin && '*'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 pr-12"
                    placeholder={admin ? "Leave blank to keep current" : "Enter password"}
                    required={!admin}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm Password {!admin && '*'}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 pr-12"
                    placeholder="Confirm password"
                    required={!admin || formData.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {passwordError && (
              <div className="text-red-400 text-sm">{passwordError}</div>
            )}
          </div>

          {/* Role & Status */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Role & Access</h4>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {roles.map(role => (
                  <label key={role.value} className="relative cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={formData.role === role.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className={`p-4 rounded-lg border-2 transition-all ${
                      formData.role === role.value
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                    }`}>
                      <div className="font-medium text-white">{role.label}</div>
                      <div className="text-slate-400 text-sm">{role.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="isActive"
                id="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-4 h-4 text-orange-500 bg-slate-700 border-slate-600 rounded focus:ring-orange-500"
              />
              <label htmlFor="isActive" className="text-slate-300">
                Account is active
              </label>
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Permissions</h4>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availablePermissions.map(permission => (
                <label key={permission} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(permission)}
                    onChange={() => handlePermissionChange(permission)}
                    className="w-4 h-4 text-orange-500 bg-slate-700 border-slate-600 rounded focus:ring-orange-500"
                  />
                  <span className="text-slate-300 text-sm">
                    {permission.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Current Role Info */}
          {formData.role && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
              <h5 className="text-orange-400 font-medium mb-2">Selected Role: {getRoleInfo(formData.role).label}</h5>
              <p className="text-slate-300 text-sm">{getRoleInfo(formData.role).description}</p>
              <div className="mt-2 text-slate-400 text-xs">
                Permissions: {formData.permissions.length} selected
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-6 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.username.trim() || (!admin && !formData.password.trim())}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </div>
              ) : (
                admin ? 'Update Admin' : 'Create Admin'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminModal;