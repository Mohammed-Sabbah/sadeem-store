'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ADMIN_NAV_ITEMS } from '../utils/adminNavigation';

interface AdminHeaderProps {
  onOpenMobile: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onOpenMobile }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const currentItem = ADMIN_NAV_ITEMS.find((item) => {
    if (item.href === '/admin') return pathname === '/admin';
    return pathname?.startsWith(item.href);
  }) || { label: 'لوحة الإدارة' };

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  return (
    <header className="h-16 bg-brand-card border-b border-brand-border/80 px-4 sm:px-6 flex items-center justify-between shrink-0 select-none">
      {/* 1. Left side (in RTL: Right side) Title & Mobile Trigger */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobile}
          className="lg:hidden w-9 h-9 rounded-xl border border-brand-border bg-brand-surface text-brand-dark flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
          aria-label="فتح القائمة الجانبية"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <h1 className="text-sm sm:text-base font-black text-brand-dark tracking-tight">
            {currentItem.label}
          </h1>
          <span className="hidden sm:inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-brand-primary-soft text-brand-primary border border-brand-primary-border">
            محطة القيادة
          </span>
        </div>
      </div>

      {/* 2. User Info & Session Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl bg-brand-surface border border-brand-border">
          <div className="w-7 h-7 rounded-lg bg-brand-primary text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
            {user?.name ? user.name.charAt(0) : 'م'}
          </div>
          <div className="hidden sm:flex flex-col text-right leading-none">
            <span className="text-xs font-black text-brand-dark truncate max-w-[120px]">
              {user?.name || 'مسؤول النظام'}
            </span>
            <span className="text-[10px] font-bold text-brand-muted mt-0.5">
              إدارة سَدِيم
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-9 h-9 rounded-xl border border-brand-border hover:border-red-200 bg-brand-card hover:bg-red-50 text-brand-muted hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer active:scale-95 shadow-2xs"
          title="تسجيل الخروج"
          aria-label="تسجيل الخروج"
        >
          <svg className="w-4 h-4 stroke-[1.75]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  );
};
