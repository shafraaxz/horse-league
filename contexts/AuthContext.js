// contexts/AuthContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useRouter } from 'next/router';

const AuthContext = createContext();

// Auth actions
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  VERIFY_START: 'VERIFY_START',
  VERIFY_SUCCESS: 'VERIFY_SUCCESS',
  VERIFY_FAILURE: 'VERIFY_FAILURE',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Initial state
const initialState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  error: null
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.VERIFY_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.VERIFY_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.VERIFY_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        isLoading: false
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const router = useRouter();

  // Storage keys
  const TOKEN_KEY = 'league_manager_token';
  const USER_KEY = 'league_manager_user';

  // Get stored token and user on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if we're in browser environment
        if (typeof window === 'undefined') {
          dispatch({ type: AUTH_ACTIONS.VERIFY_FAILURE, payload: 'Server side' });
          return;
        }

        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);

        if (storedToken && storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            // Verify token is still valid
            await verifyToken(storedToken, userData);
          } catch (error) {
            console.error('Stored user data invalid:', error);
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            dispatch({ type: AUTH_ACTIONS.VERIFY_FAILURE, payload: 'Invalid stored data' });
          }
        } else {
          dispatch({ type: AUTH_ACTIONS.VERIFY_FAILURE, payload: 'No stored credentials' });
        }
      } catch (error) {
        console.error('Auth init error:', error);
        dispatch({ type: AUTH_ACTIONS.VERIFY_FAILURE, payload: 'Authentication failed' });
      }
    };

    initAuth();
  }, []);

  // Verify token with server
  const verifyToken = async (token, userData = null) => {
    try {
      dispatch({ type: AUTH_ACTIONS.VERIFY_START });

      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update stored user data
        if (typeof window !== 'undefined') {
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          localStorage.setItem(TOKEN_KEY, token);
        }
        
        dispatch({
          type: AUTH_ACTIONS.VERIFY_SUCCESS,
          payload: { user: data.user }
        });
        
        return data.user;
      } else {
        throw new Error(data.message || 'Token verification failed');
      }
    } catch (error) {
      console.error('Token verification error:', error);
      
      // Clear invalid credentials
      if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
      
      dispatch({
        type: AUTH_ACTIONS.VERIFY_FAILURE,
        payload: error.message
      });
      
      throw error;
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store credentials
        if (typeof window !== 'undefined') {
          localStorage.setItem(TOKEN_KEY, data.token);
          localStorage.setItem(USER_KEY, JSON.stringify(data.admin));
        }

        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: data.admin,
            token: data.token
          }
        });

        return data;
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: error.message
      });
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem(TOKEN_KEY);
        
        if (token) {
          // Call logout API
          try {
            await fetch('/api/auth/logout', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
          } catch (error) {
            console.error('Logout API error:', error);
            // Continue with logout even if API call fails
          }
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if there's an error
    } finally {
      // Clear storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }

      dispatch({ type: AUTH_ACTIONS.LOGOUT });

      // Redirect to login
      router.push('/login');
    }
  };

  // Get auth headers for API calls
  const getAuthHeaders = () => {
    if (typeof window === 'undefined') {
      return { 'Content-Type': 'application/json' };
    }

    const token = localStorage.getItem(TOKEN_KEY);
    return token ? {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    } : {
      'Content-Type': 'application/json'
    };
  };

  // Make authenticated API call
  const apiCall = async (url, options = {}) => {
    const headers = getAuthHeaders();
    
    const config = {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      
      // Handle authentication errors
      if (response.status === 401) {
        await logout();
        throw new Error('Authentication expired. Please login again.');
      }

      return response;
    } catch (error) {
      if (error.message.includes('Authentication expired')) {
        throw error;
      }
      console.error('API call error:', error);
      throw error;
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Check permissions
  const hasPermission = (permission) => {
    if (!state.user) return false;
    if (state.user.role === 'super_admin') return true;
    return state.user.permissions?.[permission] || false;
  };

  // Check role
  const hasRole = (roles) => {
    if (!state.user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(state.user.role);
  };

  const value = {
    // State
    user: state.user,
    token: state.token,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    error: state.error,

    // Actions
    login,
    logout,
    verifyToken,
    clearError,
    apiCall,
    getAuthHeaders,

    // Helpers
    hasPermission,
    hasRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;