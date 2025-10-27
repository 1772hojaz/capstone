import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiService from '../services/api';
import type { User, LoginCredentials } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user on mount if token exists
    if (apiService.isAuthenticated()) {
      refreshUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = async () => {
    try {
      setIsLoading(true);
      const userData = await apiService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to load user:', error);
      setUser(null);
      // Don't clear token here - let the API service handle 401s
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    await apiService.login(credentials);
    await refreshUser();
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
