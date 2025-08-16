// components/admin/AdminUserModal.js
import React, { useState, useEffect } from 'react';
import { 
  Shield, Plus, Edit, Trash2, Eye, EyeOff, Crown, Settings, User, 
  AlertCircle, CheckCircle, X, Key, Lock, UserPlus, Users, Save
} from 'lucide-react';

const AdminUserModal = ({ isOpen, onClose, admin, onSave, currentUser }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    role: 'moderator',
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Role definitions with permissions
  const roles = [
    { 
      value: 'admin', 
      label: 'Administrator', 
      description: 'Full system access - can manage everything',
      icon: Crown,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10 border-red-500/30',
      permissions: [
        'Manage all leagues, teams, players',
        'Create/edit/delete admin users',
        'Generate schedules',
        'Live match management',
        'System settings access',
        'Full data export/import'
      ]
    },
    { 
      value: 'moderator', 
      label: 'Moderator', 
      description: 'Content management with limited admin access',
      icon: Settings,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/30',
      permissions: [
        'Manage leagues, teams, players',
        'Generate schedules',
        'Live match management',
        'View statistics',
        'Limited admin functions'
      ]
    },
    { 
      value: 'scorer', 
      label: 'Match Scorer', 
      description: 'Live match scoring and basic match management',
      icon: User,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10 border-green-500/30',
      permissions: [
        'Live match scoring only',
        'Update match events',
        'View match schedules',
        'Basic player stats',
        'Read-only access to leagues'
      ]
    }
  ];

  useEffect(() => {
    if (admin) {
      setFormData({
        username: admin.username || '',
        password: '',
        confirmPassword: '',
        email: admin.email || '',
        role: admin.role || 'moderator',
        isActive: admin.isActive !== undefined ? admin.isActive : true,
        _id: admin._id
      });
    } else {
      setFormData({
        username: '',
        password: '',
        confirmPassword: '',
        email: '',
        role: 'moderator',
        isActive: true
      });
    }
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [admin, isOpen]);

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
    
    // Password validation (only for new users or if password is provided)
    if (!admin && !formData.password.trim()) {
      newErrors.password = 'Password is required for new admin users';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    // Password confirmation
    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Email validation (optional but must be valid if provided)
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }

    // Permission check - only admins can create other admins
    if (formData.role === 'admin' && currentUser?.role !== 'admin') {
      newErrors.role = 'Only administrators can create admin users';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const submitData = { ...formData };
      
      // Don't send password if it's empty (for updates)
      if (!formData.password) {
        delete submitData.password;
      }
      delete submitData.confirmPassword;
      
      await onSave(submitData);
    } catch (error) {
      setErrors({ submit: error.message });
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
    
    // Clear specific error when user starts fixing it
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const selectedRole = roles.find(r => r.value === formData.role);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-700 shadow-2xl">
        
        {/* Header */}
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
                <p className="text-slate-400 text-sm">Configure administrator account and permissions</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg"
              disabled={loading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Account Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Account Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.username ? 'border-red-500' : 'border-slate-600'
                  }`}
                  placeholder="Enter username"
                  disabled={loading || (admin && admin.username === 'admin')}
                  autoComplete="username"
                />
                {errors.username && <p className="text-red-400 text-sm mt-1">{errors.username}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.email ? 'border-red-500' : 'border-slate-600'
                  }`}
                  placeholder="admin@example.com"
                  disabled={loading}
                  autoComplete="email"
                />
                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
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
                    className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 pr-12 ${
                      errors.password ? 'border-red-500' : 'border-slate-600'
                    }`}
                    placeholder={admin ? "Leave blank to keep current" : "Enter password"}
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
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
                    className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 pr-12 ${
                      errors.confirmPassword ? 'border-red-500' : 'border-slate-600'
                    }`}
                    placeholder={admin ? "Leave blank to keep current" : "Confirm password"}
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>
          </div>

          {/* Role & Permissions */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Role & Permissions</h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {roles.map(role => {
                const Icon = role.icon;
                const isSelected = formData.role === role.value;
                const isDisabled = role.value === 'admin' && currentUser?.role !== 'admin';
                
                return (
                  <div
                    key={role.value}
                    className={`relative border-2 rounded-xl p-4 transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-orange-500 bg-orange-500/10' 
                        : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                    } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => !isDisabled && handleChange({ target: { name: 'role', value: role.value } })}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${role.bgColor}`}>
                        <Icon className={`w-5 h-5 ${role.color}`} />
                      </div>
                      <div>
                        <h5 className="font-semibold text-white">{role.label}</h5>
                        <p className="text-xs text-slate-400">{role.description}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      {role.permissions.slice(0, 3).map((permission, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-400" />
                          <span className="text-xs text-slate-300">{permission}</span>
                        </div>
                      ))}
                      {role.permissions.length > 3 && (
                        <div className="text-xs text-slate-400">
                          +{role.permissions.length - 3} more permissions
                        </div>
                      )}
                    </div>
                    
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="w-5 h-5 text-orange-500" />
                      </div>
                    )}
                    
                    {isDisabled && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80 rounded-xl">
                        <div className="text-center">
                          <Lock className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                          <p className="text-xs text-slate-400">Admin Only</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {errors.role && <p className="text-red-400 text-sm">{errors.role}</p>}

            {/* Selected Role Details */}
            {selectedRole && (
              <div className={`p-4 rounded-lg border ${selectedRole.bgColor}`}>
                <div className="flex items-center gap-2 mb-2">
                  <selectedRole.icon className={`w-5 h-5 ${selectedRole.color}`} />
                  <h5 className="font-semibold text-white">{selectedRole.label} Permissions</h5>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedRole.permissions.map((permission, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-slate-300">{permission}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-5 h-5 text-orange-500 bg-slate-700 border-slate-600 rounded focus:ring-orange-500 focus:ring-2"
                disabled={loading}
              />
              <label htmlFor="isActive" className="text-sm font-medium text-slate-300">
                Account is active and can log in
              </label>
            </div>
          </div>

          {/* Error Display */}
          {errors.submit && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-400 font-medium">Error</p>
              </div>
              <p className="text-red-300 text-sm mt-1">{errors.submit}</p>
            </div>
          )}

          {/* Action Buttons */}
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
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {admin ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Save className="w-5 h-5" />
                  {admin ? 'Update Admin' : 'Create Admin'}
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminUserModal;