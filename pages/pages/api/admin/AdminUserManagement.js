// components/admin/AdminUserManagement.js - Complete Admin Management
import React, { useState, useEffect } from 'react';
import { 
  Shield, Plus, Edit, Trash2, Eye, EyeOff, Crown, Settings, User, 
  AlertCircle, CheckCircle, X, Key, Lock, UserPlus, Users
} from 'lucide-react';

// Change Password Modal
const ChangePasswordModal = ({ isOpen, onClose, currentUser, onSuccess }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'New password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          username: currentUser.username,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to change password');
      }

      onSuccess('Password changed successfully! 🔒');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      onClose();
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl max-w-md w-full border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Key className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Change Password</h3>
                <p className="text-slate-400 text-sm">Update your account password</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Current Password *
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? "text" : "password"}
                value={formData.currentPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.currentPassword ? 'border-red-500' : 'border-slate-600'
                }`}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.currentPassword && <p className="text-red-400 text-sm mt-1">{errors.currentPassword}</p>}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              New Password *
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.newPassword ? 'border-red-500' : 'border-slate-600'
                }`}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.newPassword && <p className="text-red-400 text-sm mt-1">{errors.newPassword}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Confirm New Password *
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.confirmPassword ? 'border-red-500' : 'border-slate-600'
                }`}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
          </div>

          {errors.submit && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{errors.submit}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-colors"
            >
              {isSubmitting ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Admin Management Section Component
const AdminUserManagement = ({ data, onSave, onDelete, currentUser, showToast }) => {
  const [changePasswordModal, setChangePasswordModal] = useState(false);

  const roles = [
    { 
      value: 'admin', 
      label: 'Administrator', 
      icon: Crown,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10 border-red-500/30'
    },
    { 
      value: 'moderator', 
      label: 'Moderator', 
      icon: Settings,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/30'
    },
    { 
      value: 'scorer', 
      label: 'Scorer', 
      icon: User,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10 border-green-500/30'
    }
  ];

  const getRoleInfo = (role) => {
    return roles.find(r => r.value === role) || roles[2];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-white">Admin User Management</h2>
          <p className="text-slate-400 mt-1">Manage administrative users and permissions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setChangePasswordModal(true)}
            className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Key className="w-4 h-4" />
            <span>Change Password</span>
          </button>
          <button
            onClick={() => onSave()}
            className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Admin</span>
          </button>
        </div>
      </div>

      {/* Current User Info */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" />
          Current Session
        </h3>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-lg">{currentUser.username}</div>
            <div className="flex items-center gap-2">
              {(() => {
                const roleInfo = getRoleInfo(currentUser.role);
                const Icon = roleInfo.icon;
                return (
                  <>
                    <Icon className={`w-4 h-4 ${roleInfo.color}`} />
                    <span className={roleInfo.color}>{roleInfo.label}</span>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Users List */}
      {data && data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map(admin => {
            const roleInfo = getRoleInfo(admin.role);
            const Icon = roleInfo.icon;
            const isCurrentUser = admin.username === currentUser.username;
            
            return (
              <div key={admin._id} className={`bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border transition-all duration-200 ${
                isCurrentUser ? 'border-blue-500/50 ring-2 ring-blue-500/20' : 'border-slate-700/50 hover:border-slate-600/50'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl flex items-center justify-center">
                    <Icon className={`w-6 h-6 ${roleInfo.color}`} />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onSave(admin)}
                      className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
                      title="Edit admin"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {!isCurrentUser && admin.username !== 'admin' && (
                      <button
                        onClick={() => onDelete('admin', admin.username)}
                        className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
                        title="Delete admin"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      {admin.username}
                      {isCurrentUser && <span className="text-blue-400 text-xs bg-blue-500/20 px-2 py-1 rounded">YOU</span>}
                      {admin.username === 'admin' && <Crown className="w-4 h-4 text-yellow-400" />}
                    </h3>
                    {admin.fullName && (
                      <p className="text-slate-400 text-sm">{admin.fullName}</p>
                    )}
                  </div>
                  
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium ${roleInfo.bgColor}`}>
                    <Icon className={`w-4 h-4 ${roleInfo.color}`} />
                    <span className={roleInfo.color}>{roleInfo.label}</span>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    {admin.email && (
                      <p className="text-slate-400">📧 {admin.email}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Status:</span>
                      <span className={admin.isActive ? 'text-green-400' : 'text-red-400'}>
                        {admin.isActive ? '✅ Active' : '🚫 Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 border border-slate-700/50 text-center">
          <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Admin Users Found</h3>
          <p className="text-slate-400 mb-4">Add administrative users to manage the system.</p>
          <button
            onClick={() => onSave()}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
          >
            Add First Admin
          </button>
        </div>
      )}

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={changePasswordModal}
        onClose={() => setChangePasswordModal(false)}
        currentUser={currentUser}
        onSuccess={showToast}
      />
    </div>
  );
};

export default AdminUserManagement;