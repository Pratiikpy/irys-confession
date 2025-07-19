import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    // Check if user is logged in on app start
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          const userData = await authAPI.getProfile();
          setUser(userData);
          setIsAuthenticated(true);
          setToken(savedToken);
        } catch (error) {
          console.error('Failed to validate token:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { access_token, user: userData } = response;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { access_token, user: newUser } = response;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      setUser(newUser);
      setIsAuthenticated(true);
      
      return { success: true, user: newUser };
    } catch (error) {
      console.error('Registration failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Registration failed' 
      };
    }
  };

  // New method for wallet authentication
  const walletAuth = async (authData) => {
    try {
      // authData contains: { address, token, user }
      if (authData.token) {
        localStorage.setItem('token', authData.token);
        setToken(authData.token);
        setUser(authData.user);
        setIsAuthenticated(true);
        
        // Force a re-render of the entire app
        window.dispatchEvent(new Event('auth-state-changed'));
        
        return authData;
      }
    } catch (error) {
      console.error('Wallet auth failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    
    // Force a re-render
    window.dispatchEvent(new Event('auth-state-changed'));
  };

  const updatePreferences = async (preferences) => {
    try {
      await authAPI.updatePreferences(preferences);
      setUser(prev => ({
        ...prev,
        preferences: { ...prev.preferences, ...preferences }
      }));
      return { success: true };
    } catch (error) {
      console.error('Failed to update preferences:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to update preferences' 
      };
    }
  };

  const refreshUser = async () => {
    if (!token) return;
    
    try {
      const userData = await authAPI.getProfile();
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  // New method for wallet authentication
  const walletAuth = async (authData) => {
    try {
      // authData contains: { address, token, user }
      if (authData.token) {
        localStorage.setItem('token', authData.token);
        setToken(authData.token);
        setUser(authData.user);
        setIsAuthenticated(true);
        
        // Force a re-render of the entire app
        window.dispatchEvent(new Event('auth-state-changed'));
        
        return authData;
      }
    } catch (error) {
      console.error('Wallet auth failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    
    // Force a re-render
    window.dispatchEvent(new Event('auth-state-changed'));
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    token,
    login,
    register,
    walletAuth, // Add this new method
    logout,
    updatePreferences,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};