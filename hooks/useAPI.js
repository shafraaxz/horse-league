// src/hooks/useAPI.js - COMPLETE DATABASE INTEGRATION
import { useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
export const useAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiCall = async (endpoint, method = 'GET', data = null, params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      // Build URL with query parameters
      const url = new URL(`${API_BASE_URL}/${endpoint}`);
      
      // Add query parameters (including season)
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, value);
        }
      });

      // Get auth token
      const token = localStorage.getItem('adminToken');
      
      const config = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
      };

      // Add body for POST/PUT requests
      if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
        config.body = JSON.stringify(data);
      }

      console.log('🔗 API Call:', { method, url: url.toString(), data });

      const response = await fetch(url.toString(), config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setLoading(false);
      
      // Handle your server response format { success: true, data: [...], message: "..." }
      return result.data || result;
      
    } catch (err) {
      console.error('❌ API Call Failed:', err);
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  // Specialized methods
  const get = (endpoint, params = {}) => apiCall(endpoint, 'GET', null, params);
  const post = (endpoint, data, params = {}) => apiCall(endpoint, 'POST', data, params);
  const put = (endpoint, data, params = {}) => apiCall(endpoint, 'PUT', data, params);
  const del = (endpoint, params = {}) => apiCall(endpoint, 'DELETE', null, params);

  // Authentication methods
  const login = async (email, password) => {
    const response = await apiCall('auth/admin-login', 'POST', { email, password });
    
    if (response.token) {
      localStorage.setItem('adminToken', response.token);
      localStorage.setItem('adminData', JSON.stringify(response.admin));
    }
    
    return response;
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
  };

  const isAuthenticated = () => {
    return !!localStorage.getItem('adminToken');
  };

  // File upload method (for Cloudinary) - FIXED
  const uploadFile = async (file, folder = 'logos') => {
    // Check if Cloudinary is configured
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary configuration missing. Please check your environment variables.');
    }

    // Validate file
    if (!file) {
      throw new Error('No file provided for upload');
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size too large. Maximum size is 10MB.');
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Invalid file type. Only images are allowed.');
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', folder);

      console.log('🔄 Uploading file to Cloudinary...', {
        fileName: file.name,
        fileSize: file.size,
        cloudName,
        uploadPreset,
        folder
      });

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Cloudinary upload failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });

        // Handle specific Cloudinary errors
        if (response.status === 401) {
          throw new Error('Cloudinary authentication failed. Check your upload preset configuration.');
        } else if (response.status === 400) {
          throw new Error('Invalid upload parameters. Check your Cloudinary settings.');
        } else {
          throw new Error(`Upload failed: ${response.statusText}`);
        }
      }

      const result = await response.json();
      
      console.log('✅ File uploaded successfully:', {
        url: result.secure_url,
        publicId: result.public_id
      });

      return result;

    } catch (error) {
      console.error('❌ Upload error:', error);
      throw new Error(`File upload failed: ${error.message}`);
    }
  };

  const clearError = () => setError(null);

  return { 
    apiCall, 
    get, 
    post, 
    put, 
    del, 
    login,
    logout,
    isAuthenticated,
    uploadFile,
    loading, 
    error, 
    clearError 
  };
};