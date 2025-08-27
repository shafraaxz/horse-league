// pages/_error.js - Custom error page
import React from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

function Error({ statusCode, hasGetInitialPropsRun, err }) {
  if (!hasGetInitialPropsRun && err) {
    console.error('Error page error:', err);
  }

  const getErrorMessage = () => {
    switch (statusCode) {
      case 404:
        return {
          title: 'Page Not Found',
          message: 'The page you are looking for does not exist.',
          icon: '🔍'
        };
      case 401:
        return {
          title: 'Unauthorized',
          message: 'You need to be logged in to access this page.',
          icon: '🔒'
        };
      case 403:
        return {
          title: 'Forbidden',
          message: 'You do not have permission to access this resource.',
          icon: '⛔'
        };
      case 500:
        return {
          title: 'Server Error',
          message: 'Something went wrong on our end. Please try again later.',
          icon: '⚠️'
        };
      default:
        return {
          title: `Error ${statusCode}`,
          message: 'An unexpected error occurred.',
          icon: '❌'
        };
    }
  };

  const { title, message, icon } = getErrorMessage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">{icon}</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{title}</h1>
          <p className="text-gray-600 mb-8">{message}</p>
          
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/'}
              className="w-full btn-primary flex items-center justify-center space-x-2"
            >
              <Home className="h-5 w-5" />
              <span>Go Home</span>
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full btn-secondary flex items-center justify-center space-x-2"
            >
              <RefreshCw className="h-5 w-5" />
              <span>Try Again</span>
            </button>
          </div>
          
          {process.env.NODE_ENV === 'development' && err && (
            <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
              <p className="text-sm font-semibold text-red-800 mb-2">Debug Info:</p>
              <pre className="text-xs text-red-600 overflow-auto">
                {err.message}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode, hasGetInitialPropsRun: true };
};

export default Error;
