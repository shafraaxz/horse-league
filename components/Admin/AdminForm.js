// src/components/Admin/AdminForm.js - COMPLETE FIX
import React, { useState, useEffect } from 'react';
import { X, Save, Users, Shield, Eye, EyeOff, Key, Mail, Phone, User } from 'lucide-react';
import { useAPI } from '../../hooks/useAPI';

const AdminForm = ({ admin, onSave, onClose, showNotification }) => {
  const { post, put, loading, error } = useAPI();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'moderator',
    phone: '',
    permissions: [],
    status: 'active'
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available roles
  const roles = [
    {
      value: 'super-admin',
      label: 'Super Administrator',
      description: 'Full system access and admin management',
      color: 'text-red-600'
    },
    {
      value: 'admin',
      label: 'Administrator',
      description: 'Manage players, teams, and matches',
      color: 'text-blue-600'
    },
    {
      value: 'moderator',
      label: 'Moderator',
      description: 'View and basic management functions',
      color: 'text-green-600'
    }
  ];

  // Available permissions
  const availablePermissions = [
    { id: 'manage_players', label: 'Manage Players', category: 'Players' },
    { id: 'manage_teams', label: 'Manage Teams', category: 'Teams' },
    { id: 'manage_schedules', label: 'Manage Schedules', category: 'Matches' },
    { id: 'manage_matches', label: 'Manage Matches', category: 'Matches' },
    { id: 'manage_transfers', label: 'Manage Transfers', category: 'Players' },
    { id: 'manage_admins', label: 'Manage Administrators', category: 'System' },
    { id: 'view_statistics', label: 'View Statistics', category: 'Reports' },
    { id: 'export_data', label: 'Export Data', category: 'Reports' },
    { id: 'manage_gallery', label: 'Manage Gallery', category: 'Content' },
    { id: 'manage_seasons', label: 'Manage Seasons', category: 'System' },
    { id: 'system_settings', label: 'System Settings', category: 'System' }
  ];

  // Update form when admin prop changes (for editing)
  useEffect(() => {
    if (admin) {
      setFormData({
        name: admin.name || '',
        email: admin.email || '',
        password: '', // Never pre-fill password
        confirmPassword: '',
        role: admin.role || 'moderator',
        phone: admin.phone || '',
        permissions: admin.permissions || [],
        status: admin.status || 'active'
      });
    } else {
      // Reset form for new admin
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'moderator',
        phone: '',
        permissions: getDefaultPermissions('moderator'),
        status: 'active'
      });
    }
  }, [admin]);

  // Get default permissions for role
  const getDefaultPermissions = (role) => {
    switch (role) {
      case 'super-admin':
        return availablePermissions.map(p => p.id);
      case 'admin':
        return [
          'manage_players',
          'manage_teams', 
          'manage_schedules',
          'manage_matches',
          'manage_transfers',
          'view_statistics',
          'export_data',
          'manage_gallery'
        ];
      case 'moderator':
        return ['manage_players', 'manage_teams', 'view_statistics'];
      default:
        return [];
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleRoleChange = (newRole) => {
    setFormData(prev => ({
      ...prev,
      role: newRole,
      permissions: getDefaultPermissions(newRole)
    }));

    // Clear role error
    if (errors.role) {
      setErrors(prev => ({
        ...prev,
        role: ''
      }));
    }
  };

  const handlePermissionToggle = (permissionId) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // Password validation
    if (!admin) { // For new admins, password is required
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters long';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    } else { // For editing, password is optional but must match if provided
      if (formData.password && formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters long';
      }

      if (formData.password && formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    // Phone validation (optional)
    if (formData.phone && !/^[\+]?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showNotification?.('error', 'Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data for API
      const submitData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        phone: formData.phone.trim(),
        permissions: formData.permissions,
        status: formData.status
      };

      // Only include password if it's provided
      if (formData.password) {
        submitData.password = formData.password;
      }

      console.log('💾 Submitting admin data:', { ...submitData, password: '[HIDDEN]' });

      let result;
      if (admin) {
        // Update existing admin
        result = await put(`admins/${admin._id}`, submitData);
        showNotification?.('success', 'Administrator updated successfully');
      } else {
        // Create new admin
        result = await post('admins', submitData);
        showNotification?.('success', 'Administrator created successfully');
      }

      // Call parent save handler
      onSave(result);

    } catch (error) {
      console.error('❌ Admin save error:', error);
      showNotification?.('error', `Failed to ${admin ? 'update' : 'create'} administrator: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group permissions by category
  const groupedPermissions = availablePermissions.reduce((acc, permission) => {
    const category = permission.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {});

  const selectedRole = roles.find(r => r.value === formData.role);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-6 h-6" />
              {admin ? 'Edit Administrator' : 'Add New Administrator'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Configure admin account and permissions
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Basic Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter full name"
                  required
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="admin@example.com"
                  required
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+960 123-4567"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Security Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Key className="w-5 h-5" />
              Security Information
              {admin && <span className="text-sm font-normal text-gray-500">(Leave blank to keep current password)</span>}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {!admin && '*'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full p-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={admin ? 'Enter new password' : 'Enter secure password'}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-gray-400" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password {!admin && '*'}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full p-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5 text-gray-400" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Role & Permissions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {roles.map((role) => (
                <div
                  key={role.value}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    formData.role === role.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleRoleChange(role.value)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={formData.role === role.value}
                      onChange={() => handleRoleChange(role.value)}
                      className="mt-1"
                    />
                    <div>
                      <h4 className={`font-medium ${role.color}`}>
                        {role.label}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {role.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {errors.role && <p className="text-red-500 text-sm mb-4">{errors.role}</p>}

            {/* Permissions */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Specific Permissions</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(groupedPermissions).map(([category, permissions]) => (
                  <div key={category} className="space-y-2">
                    <h5 className="font-medium text-sm text-gray-700">{category}</h5>
                    {permissions.map((permission) => (
                      <label key={permission.id} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(permission.id)}
                          onChange={() => handlePermissionToggle(permission.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">{permission.label}</span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || loading}
            >
              <Save className="w-5 h-5" />
              {isSubmitting ? 'Saving...' : (admin ? 'Update Administrator' : 'Create Administrator')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminForm;