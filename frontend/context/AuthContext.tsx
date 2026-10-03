'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '@/features/auth/services/auth.service';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  address?: string;
  role: 'customer' | 'merchant' | 'courier' | 'admin';
  status: 'active' | 'pending_approval' | 'suspended';
  walletBalance: number;
  ordersCount?: number;
  merchantId?: any;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setSessionUser: (user: any) => void;
  logout: () => Promise<void>;
  updateUser: (fields: Partial<UserProfile>) => void;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'sadeem_user_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await authService.getMe();
      if (res.success && res.data?.user) {
        const u = res.data.user;
        const profile: UserProfile = {
          id: (u.id || u._id || '') as string,
          name: u.name,
          phone: u.phone,
          email: u.email,
          city: u.city || 'دير البلح',
          address: u.address,
          role: u.role || 'customer',
          status: u.status || 'active',
          walletBalance: u.walletBalance || 0,
          ordersCount: u.ordersCount || 0,
          merchantId: u.merchantId,
        };
        setUser(profile);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
      } else {
        // Fallback to local storage for network interruption resilience
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          setUser(JSON.parse(stored));
        } else {
          setUser(null);
        }
      }
    } catch {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check session on mount and listen to session expiration
  useEffect(() => {
    void checkSession();

    const handleSessionExpired = () => {
      setUser(null);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('auth:session_expired', handleSessionExpired);
      return () => {
        window.removeEventListener('auth:session_expired', handleSessionExpired);
      };
    }
  }, [checkSession]);

  const setSessionUser = useCallback((rawUser: any) => {
    const profile: UserProfile = {
      id: rawUser.id || rawUser._id,
      name: rawUser.name,
      phone: rawUser.phone,
      email: rawUser.email,
      city: rawUser.city || 'دير البلح',
      address: rawUser.address,
      role: rawUser.role || 'customer',
      status: rawUser.status || 'active',
      walletBalance: rawUser.walletBalance || 0,
      ordersCount: rawUser.ordersCount || 0,
      merchantId: rawUser.merchantId,
    };
    setUser(profile);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setUser(null);
      try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const updateUser = useCallback((fields: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...fields };
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && user.status === 'active',
        isLoading,
        setSessionUser,
        logout,
        updateUser,
        checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
