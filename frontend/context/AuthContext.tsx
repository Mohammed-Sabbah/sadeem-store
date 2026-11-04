'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authService } from '@/features/auth/services/auth.service';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  backupPhone?: string;
  email?: string;
  city?: string;
  address?: string;
  addresses?: Array<{
    _id?: string;
    label?: string;
    governorate?: string;
    city?: string;
    detailedAddress: string;
    phone?: string;
    isDefault?: boolean;
    landmark?: string;
    notes?: string;
  }>;
  jawwalPayNumber?: string;
  notificationChannel?: 'whatsapp' | 'sms';
  role: 'customer' | 'merchant' | 'seller' | 'courier' | 'admin';
  status: 'active' | 'pending_approval' | 'suspended';
  walletBalance: number;
  ordersCount?: number;
  merchantId?: string | null;
}

/**
 * دالة موحدة لمواءمة وتوحيد مسميات الأدوار بين الباك إند (user, seller) والفرونت إند (customer, merchant)
 */
export function normalizeRole(role?: string): 'customer' | 'merchant' | 'courier' | 'admin' {
  if (!role) return 'customer';
  const r = role.toLowerCase().trim();
  if (r === 'seller' || r === 'merchant') return 'merchant';
  if (r === 'user' || r === 'customer') return 'customer';
  if (r === 'admin') return 'admin';
  if (r === 'courier') return 'courier';
  return 'customer';
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setSessionUser: (user: Record<string, unknown>) => void;
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
          addresses: u.addresses || [],
          role: normalizeRole(u.role),
          status: u.status || 'active',
          walletBalance: u.walletBalance || 0,
          ordersCount: u.ordersCount || 0,
          merchantId: u.merchantId,
        };

        // إذا كان الحساب موقوفاً أو معلقاً في قاعدة البيانات، يجب تنظيف الكاش فوراً
        if (profile.status !== 'active') {
          setUser(null);
          try {
            localStorage.removeItem(AUTH_STORAGE_KEY);
          } catch {}
        } else {
          setUser(profile);
          try {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
          } catch {}
        }
      } else {
        // إذا رجع السيرفر خطأ صريح 401 أو 403 (انتهت الجلسة أو الحساب معطل)، نمسح الجلسة المخزنة
        if (res.statusCode === 401 || res.statusCode === 403) {
          setUser(null);
          try {
            localStorage.removeItem(AUTH_STORAGE_KEY);
          } catch {}
        } else {
          // استرجاع الكاش فقط في حالات انقطاع الشبكة الفعلي (PWA Offline Resilience)
          try {
            const stored = localStorage.getItem(AUTH_STORAGE_KEY);
            if (stored) {
              const parsed = JSON.parse(stored);
              if (parsed && parsed.status === 'active') {
                setUser(parsed);
              } else {
                setUser(null);
                localStorage.removeItem(AUTH_STORAGE_KEY);
              }
            } else {
              setUser(null);
            }
          } catch {
            setUser(null);
          }
        }
      }
    } catch {
      try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.status === 'active') {
            setUser(parsed);
          } else {
            setUser(null);
            localStorage.removeItem(AUTH_STORAGE_KEY);
          }
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
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

    if (profile.status !== 'active') {
      setUser(null);
      try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } catch {}
      return;
    }

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
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
