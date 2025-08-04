// src/contexts/AuthContext.tsx
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
      // First check cached status
      const cachedAuth = localStorage.getItem('isAuthenticated');
      const authTime = localStorage.getItem('authCheckTime');
      
      if (cachedAuth === 'true' && authTime) {
        const TWO_DAYS = 2 * 24 * 60 * 60 * 1000;
        const isExpired = Date.now() - parseInt(authTime) > TWO_DAYS;
        
        if (!isExpired) {
          // Use cached auth status
          setUser({
            id: '1',
            username: localStorage.getItem('username') || 'user',
            is_admin: localStorage.getItem('isAdmin') === 'true',
          });
          setIsLoading(false);
          return;
        }
      }

      // Verify with server if cache is expired or missing
      const response = await apiService.getAdminStats();
      if (response.success) {
        const userData = {
          id: '1',
          username: localStorage.getItem('username') || 'admin',
          is_admin: true,
        };
        setUser(userData);
        
        // Update cache
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('authCheckTime', Date.now().toString());
        localStorage.setItem('username', userData.username);
        localStorage.setItem('isAdmin', 'true');
      } else {
        // Clear invalid cache
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('authCheckTime');
        localStorage.removeItem('username');
        localStorage.removeItem('isAdmin');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear cache on error
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('authCheckTime');
      localStorage.removeItem('username');
      localStorage.removeItem('isAdmin');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await apiService.login(username, password);
      if (response.success && response.data) {
        setUser(response.data);
        
        // Store user data in localStorage
        localStorage.setItem('username', response.data.username);
        localStorage.setItem('isAdmin', response.data.is_admin.toString());
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
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
      setUser(null);
      
      // Clear all localStorage data
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('authCheckTime');
      localStorage.removeItem('username');
      localStorage.removeItem('isAdmin');
    } catch (error) {
      console.error('Logout failed:', error);
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