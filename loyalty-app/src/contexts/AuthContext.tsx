'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthenticatedUser } from '@/lib/auth';

interface AuthContextType {
  user: AuthenticatedUser | null;
  loading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (
    userData: RegisterData
  ) => Promise<{ success: boolean; error?: string; redirectTo?: string }>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string | undefined;
  marketingConsent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const response = await fetch(`${basePath}/api/auth/me`);      if (response.ok) {
        const data = await response.json();
        console.log('AuthContext - Setting user from /api/auth/me:', data.user);
        setUser(data.user);
        
        // Store user in localStorage for shop page
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
          console.log('AuthContext - ✅ Stored user in localStorage');
        }
      } else {
        console.log('AuthContext - No user found, setting to null');
        setUser(null);
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const response = await fetch(`${basePath}/api/auth/login`, {
          method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('AuthContext - Setting user from login:', data.user);
        setUser(data.user);
        
        // Store user in localStorage for shop page
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
          console.log('AuthContext - ✅ Stored user in localStorage after login');
        }
        
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      setUser(null);
      localStorage.removeItem('user');
      console.log('AuthContext - ✅ Cleared user from localStorage on logout');
      // Let ConditionalLayout handle the routing
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear user state even if API call fails
      setUser(null);
      localStorage.removeItem('user');
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        
        // Store user in localStorage for shop page
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
          console.log('AuthContext - ✅ Stored user in localStorage after registration');
        }
        
        return { success: true };
      } else {
        // Handle user already exists case with redirect
        if (data.redirectTo) {
          return {
            success: false,
            error: data.message || data.error || 'Registration failed',
            redirectTo: data.redirectTo,
          };
        }
        return { success: false, error: data.error || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    register,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
