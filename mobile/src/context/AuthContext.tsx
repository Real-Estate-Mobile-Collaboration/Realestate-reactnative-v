import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { User, LoginForm, RegisterForm, ProfileForm } from '../types';
import { authService, socketService } from '../services';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginForm) => Promise<{ success: boolean; message?: string }>;
  register: (data: RegisterForm) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: ProfileForm) => Promise<{ success: boolean; message?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
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
    checkAuth();
  }, []);

  // Connect to socket when user is authenticated
  useEffect(() => {
    if (user?.id) {
      socketService.connect(user.id);
    } else {
      socketService.disconnect();
    }

    return () => {
      socketService.disconnect();
    };
  }, [user?.id]);

  const checkAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        const response = await authService.getMe();
        if (response.success) {
          setUser(response.user);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      await SecureStore.deleteItemAsync('authToken');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (data: LoginForm): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await authService.login(data);
      if (response.success) {
        setUser(response.user);
        return { success: true };
      }
      return { success: false, message: response.message || 'Login failed' };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      return { success: false, message };
    }
  };

  const register = async (data: RegisterForm): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await authService.register(data);
      if (response.success) {
        setUser(response.user);
        return { success: true };
      }
      return { success: false, message: response.message || 'Registration failed' };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      return { success: false, message };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateProfile = async (data: ProfileForm): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await authService.updateProfile(data);
      if (response.success) {
        setUser(response.user);
        return { success: true };
      }
      return { success: false, message: 'Failed to update profile' };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update profile';
      return { success: false, message };
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const response = await authService.getMe();
      if (response.success) {
        setUser(response.user);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
