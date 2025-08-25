import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'blue', 
  text = '', 
  fullScreen = false,
  overlay = false 
}) => {
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10',
    '2xl': 'w-12 h-12'
  };

  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    purple: 'text-purple-600',
    pink: 'text-pink-600',
    gray: 'text-gray-600',
    white: 'text-white'
  };

  const spinnerElement = (
    <div className="flex flex-col items-center justify-center space-y-2">
      <Loader2 
        className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`} 
      />
      {text && (
        <p className={`text-sm ${colorClasses[color]} font-medium`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        {spinnerElement}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
        {spinnerElement}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8">
      {spinnerElement}
    </div>
  );
};

// Simple inline spinner for buttons
export const ButtonSpinner = ({ size = 'sm', color = 'white' }) => (
  <Loader2 className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`} />
);

// Dot loading animation
export const DotLoader = ({ color = 'blue' }) => {
  const dotColor = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600',
    purple: 'bg-purple-600',
    pink: 'bg-pink-600',
    gray: 'bg-gray-600'
  };

  return (
    <div className="flex space-x-1">
      <div className={`w-2 h-2 ${dotColor[color]} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
      <div className={`w-2 h-2 ${dotColor[color]} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
      <div className={`w-2 h-2 ${dotColor[color]} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
    </div>
  );
};

// Pulse loader
export const PulseLoader = ({ color = 'blue', size = 'md' }) => {
  const pulseColor = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600',
    purple: 'bg-purple-600',
    pink: 'bg-pink-600',
    gray: 'bg-gray-600'
  };

  const pulseSize = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={`${pulseSize[size]} ${pulseColor[color]} rounded-full animate-pulse opacity-75`}></div>
  );
};

// Skeleton loader
export const SkeletonLoader = ({ 
  type = 'text', 
  lines = 3, 
  className = '' 
}) => {
  if (type === 'text') {
    return (
      <div className={`space-y-3 ${className}`}>
        {[...Array(lines)].map((_, index) => (
          <div
            key={index}
            className={`h-4 bg-gray-200 rounded animate-pulse ${
              index === lines - 1 ? 'w-3/4' : 'w-full'
            }`}
          ></div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className={`border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className={`space-y-3 ${className}`}>
        {[...Array(5)].map((_, index) => (
          <div key={index} className="flex space-x-4">
            <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex-1 h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  }

  return <LoadingSpinner />;
};

export default LoadingSpinner;