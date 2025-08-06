// src/contexts/AuthContext.tsx - Fixed version
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService, User } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (userData: {
    username: string;
    password: string;
    confirm_password: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Always verify with server on app load - don't rely on localStorage cache
      console.log('Checking auth status with server...');
      
      const response = await apiService.getAdminStats();
      if (response.success) {
        // Server confirms we're authenticated
        const userData = {
          id: '1',
          username: localStorage.getItem('username') || 'user',
          is_admin: localStorage.getItem('isAdmin') === 'true',
        };
        setUser(userData);
        
        console.log('Auth verified - user is authenticated');
      } else {
        // Server says we're not authenticated
        console.log('Auth check failed - clearing session');
        clearAuthData();
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // On network error, don't immediately log out - could be temporary
      // Only clear auth if we get a definitive 401 response
      if (error instanceof Error && error.message.includes('401')) {
        clearAuthData();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuthData = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('isAdmin');
    setUser(null);
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      console.log('Attempting login for user:', username);
      
      const response = await apiService.login(username, password);
      if (response.success && response.data) {
        setUser(response.data);
        
        // Store user data in localStorage for persistence
        localStorage.setItem('username', response.data.username);
        localStorage.setItem('isAdmin', response.data.is_admin.toString());
        
        console.log('Login successful');
        return true;
      }
      
      console.log('Login failed - invalid credentials');
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    username: string;
    password: string;
    confirm_password: string;
  }): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await apiService.register(userData);
      return response.success;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await apiService.logout();
      clearAuthData();
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local data even if server request fails
      clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};