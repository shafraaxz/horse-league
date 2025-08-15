// components/ImageUpload.js - Direct file upload components
import { useState } from 'react';
import { Upload, Camera, X, RefreshCw, Check, AlertCircle } from 'lucide-react';

// Main image upload component with drag & drop
export const ImageUpload = ({ 
  value, 
  onChange, 
  type = 'general', 
  placeholder = 'Upload Image',
  className = '',
  disabled = false,
  accept = 'image/*'
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = async (file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPEG, PNG, and WebP files are allowed');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', type);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      onChange(data.imageUrl);
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled || isUploading) return;

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const clearImage = () => {
    onChange('');
    setError('');
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
          dragActive 
            ? 'border-blue-500 bg-blue-500/10' 
            : value 
              ? 'border-green-500 bg-green-500/10' 
              : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled || isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {value ? (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-600 rounded-lg flex items-center justify-center overflow-hidden">
              <img src={value} alt="Uploaded" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-green-400 mb-1">
                <Check className="w-4 h-4" />
                <span className="font-medium">Image uploaded successfully</span>
              </div>
              <p className="text-slate-400 text-sm">Click to replace or drag a new image</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearImage();
              }}
              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              disabled={disabled || isUploading}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : isUploading ? (
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-blue-500 mx-auto mb-2 animate-spin" />
            <p className="text-white font-medium">Uploading image...</p>
            <p className="text-slate-400 text-sm">Please wait</p>
          </div>
        ) : (
          <div className="text-center">
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-white font-medium">{placeholder}</p>
            <p className="text-slate-400 text-sm">
              Drag & drop or click to browse • JPEG, PNG, WebP • Max 5MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

// Circular image upload for profile photos
export const CircularImageUpload = ({ 
  value, 
  onChange, 
  type = 'player',
  size = 'w-24 h-24',
  disabled = false 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = async (file) => {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPEG, PNG, and WebP files are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', type);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      onChange(data.imageUrl);
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div className="space-y-2">
      <div className={`${size} relative`}>
        <div 
          className={`${size} rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center overflow-hidden cursor-pointer hover:border-slate-500 transition-colors ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            disabled={disabled || isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          {value ? (
            <img src={value} alt="Profile" className="w-full h-full object-cover" />
          ) : isUploading ? (
            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
          ) : (
            <Camera className="w-6 h-6 text-slate-400" />
          )}
        </div>

        {value && !isUploading && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
            disabled={disabled}
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1 text-red-400 text-xs">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

// Quick setup info component
export const ImageUploadSetup = () => {
  return (
    <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
      <div className="flex items-start gap-3">
        <Camera className="w-5 h-5 text-blue-400 mt-0.5" />
        <div>
          <h5 className="text-blue-400 font-medium mb-1">Direct Image Upload</h5>
          <p className="text-slate-300 text-sm mb-2">
            Upload images directly to Cloudinary. Supported formats: JPEG, PNG, WebP (max 5MB)
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded">📁 Drag & Drop</span>
            <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded">☁️ Cloud Storage</span>
            <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded">⚡ Auto Optimization</span>
          </div>
        </div>
      </div>
    </div>
  );
};