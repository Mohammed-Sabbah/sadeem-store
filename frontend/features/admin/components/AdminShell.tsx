'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

export interface AdminShellProps {
  children: React.ReactNode;
}

export const AdminShell: React.FC<AdminShellProps> = ({ children }) => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Strict role check: redirect guests to login
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login?redirect=/admin');
    }
  }, [isLoading, isAuthenticated, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-bg text-center font-almarai">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-brand-muted">جارٍ التحقق من صلاحيات إدارة سَدِيم...</p>
      </div>
    );
  }

  // Unauthorized access (not admin)
  if (user && user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg p-4 font-almarai">
        <div className="max-w-md w-full bg-brand-card rounded-2xl border border-brand-border p-6 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center mx-auto shadow-2xs">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-black text-brand-dark">غير مصرح بالدخول</h2>
            <p className="text-xs text-brand-muted leading-relaxed">
              هذه المحطة مخصصة لمسؤولي إدارة منصة سَدِيم فقط.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.replace('/')}
            className="w-full h-10 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-black transition-colors cursor-pointer shadow-xs"
          >
            العودة للصفحة الرئيسية
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-brand-bg text-brand-dark font-almarai antialiased">
      {/* 1. Desktop Persistent Sidebar */}
      <div className="hidden lg:block shrink-0 h-screen sticky top-0 z-30">
        <AdminSidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        />
      </div>

      {/* 2. Mobile Backdrop & Slide-over Drawer */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative w-64 max-w-[80vw] h-full bg-brand-card z-10 shadow-2xl animate-in slide-in-from-right">
            <AdminSidebar
              isCollapsed={false}
              onToggleCollapse={() => {}}
              onCloseMobile={() => setIsMobileOpen(false)}
            />
          </div>
        </div>
      )}

      {/* 3. Main Operational Content Flow */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <AdminHeader onOpenMobile={() => setIsMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
