'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { authService } from '@/features/auth/services/auth.service';

export type UserRole = 'customer' | 'merchant' | 'seller' | 'courier' | 'admin';

export interface UserAddress {
  _id?: string;
  label?: string;
  governorate?: string;
  city?: string;
  detailedAddress: string;
  phone?: string;
  landmark?: string;
  notes?: string;
  isDefault?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  address?: string;
  addresses?: UserAddress[];
  role: UserRole;
  status: 'active' | 'pending_approval' | 'suspended';
  walletBalance: number;
  ordersCount: number;
  merchantId?: string | null;
}

export interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setSessionUser: (user: Record<string, unknown>) => void;
  logout: () => Promise<void>;
  updateUser: (fields: Partial<UserProfile>) => void;
  checkSession: () => Promise<void>;
}

function normalizeRole(role?: string): UserRole {
  if (role === 'admin') return 'admin';
  if (role === 'merchant' || role === 'seller') return 'merchant';
  if (role === 'courier') return 'courier';
  return 'customer';
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
          addresses: u.addresses || [],
          role: normalizeRole(u.role),
          status: u.status || 'active',
          walletBalance: u.walletBalance || 0,
          ordersCount: u.ordersCount || 0,
          merchantId: u.merchantId,
        };

        if (profile.status === 'active') {
          setUser(profile);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check session on mount and listen to session expiration
  useEffect(() => {
    void checkSession();

    const handleSessionExpired = () => {
      setUser(null);
      try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } catch {}
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('auth:session_expired', handleSessionExpired);
      return () => {
        window.removeEventListener('auth:session_expired', handleSessionExpired);
      };
    }
  }, [checkSession]);

  const setSessionUser = useCallback((rawUser: Record<string, unknown>) => {
    const profile: UserProfile = {
      id: ((rawUser.id || rawUser._id || '') as string),
      name: ((rawUser.name || '') as string),
      phone: ((rawUser.phone || '') as string),
      email: ((rawUser.email || undefined) as string | undefined),
      city: ((rawUser.city || 'دير البلح') as string),
      address: ((rawUser.address || undefined) as string | undefined),
      addresses: ((rawUser.addresses || []) as UserProfile['addresses']),
      role: normalizeRole(rawUser.role as string | undefined),
      status: ((rawUser.status as UserProfile['status']) || 'active'),
      walletBalance: Number(rawUser.walletBalance || 0),
      ordersCount: Number(rawUser.ordersCount || 0),
      merchantId: (rawUser.merchantId as string | undefined) || null,
    };

    if (profile.status === 'active') {
      setUser(profile);
    } else {
      setUser(null);
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
        localStorage.removeItem('sadeem_cart');
        localStorage.removeItem('sadeem_last_order');
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const updateUser = useCallback((fields: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      return { ...prev, ...fields };
    });
  }, []);

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: !!user && user.status === 'active',
      isLoading,
      setSessionUser,
      logout,
      updateUser,
      checkSession,
    }),
    [user, isLoading, setSessionUser, logout, updateUser, checkSession]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
