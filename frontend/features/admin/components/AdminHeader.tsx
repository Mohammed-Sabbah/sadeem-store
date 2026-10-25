'use client';

import React from 'react';
import Link from 'next/link';
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
    if (confirm('هل أنت متأكد من تسجيل الخروج من لوحة الإدارة؟')) {
      await logout();
      router.replace('/auth/login');
    }
  };

  return (
    <header className="h-16 bg-brand-card border-b border-brand-border/80 px-4 sm:px-6 flex items-center justify-between shrink-0 select-none font-almarai">
      {/* 1. Right side (RTL): Mobile Trigger & Route Title */}
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

        <div className="flex items-center gap-2.5">
          <h1 className="text-sm sm:text-base font-black text-brand-dark tracking-tight truncate max-w-[150px] sm:max-w-none">
            {currentItem.label}
          </h1>

          <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-brand-primary-soft text-brand-primary border border-brand-primary-border shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
            <span>محطة القيادة</span>
          </span>

          <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-trust" />
            <span>المحافظة الوسطى نشطة</span>
          </span>
        </div>
      </div>

      {/* 2. Left side (RTL): Actions, User & Session */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Link to Consumer Storefront */}
        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-border bg-brand-surface hover:bg-brand-card text-xs font-bold text-brand-dark transition-all active:scale-95 shadow-2xs group"
          title="معاينة متجر سَدِيم العام في تبويب مستقل"
        >
          <span className="hidden sm:inline">معاينة المتجر</span>
          <span className="text-[10px] text-brand-muted group-hover:text-brand-primary transition-colors">↗</span>
        </Link>

        {/* User Badge */}
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

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-9 h-9 rounded-xl border border-brand-border hover:border-red-200 bg-brand-card hover:bg-red-50 text-brand-muted hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer active:scale-95 shadow-2xs"
          title="تسجيل الخروج من المنصة"
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
