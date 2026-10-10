'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useMerchantContext } from '../context/MerchantContext';

interface MerchantSidebarProps {
  onCloseDrawer?: () => void;
  isMobileDrawer?: boolean;
}

export default function MerchantSidebar({
  onCloseDrawer,
  isMobileDrawer = false,
}: MerchantSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { store, metrics, handleToggleStoreStatus } = useMerchantContext();

  const isStoreActive = store?.status === 'active';

  const navItems = [
    {
      title: 'المنتجات والمخزون',
      href: '/merchant/dashboard',
      count: metrics.totalProducts,
      isActive: pathname === '/merchant/dashboard',
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      title: 'الطلبيات والطرود',
      href: '/merchant/orders',
      badge: 'قريباً',
      isActive: pathname === '/merchant/orders',
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    {
      title: 'المحفظة والمستحقات',
      href: '/merchant/wallet',
      badge: 'قريباً',
      isActive: pathname === '/merchant/wallet',
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      title: 'إعدادات المتجر',
      href: '/merchant/settings',
      badge: 'قريباً',
      isActive: pathname === '/merchant/settings',
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <aside
      className={`h-full flex flex-col justify-between font-almarai text-right select-none ${
        isMobileDrawer
          ? 'w-full p-5 bg-brand-card'
          : 'w-68 border-l border-brand-border bg-brand-card p-5 sticky top-0 h-screen shrink-0'
      }`}
    >
      {/* 1. Header & Store Capsule */}
      <div className="space-y-5">
        {/* Brand Bar */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-brand-border/60">
          <Link
            href="/merchant/dashboard"
            onClick={onCloseDrawer}
            className="flex items-center gap-2.5 no-underline group"
          >
            <div className="w-8 h-8 rounded-xl bg-brand-primary text-white flex items-center justify-center font-black text-sm shadow-xs group-hover:scale-105 transition-transform">
              س
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-almarai font-black text-sm text-brand-dark tracking-tight">
                  سَدِيم
                </span>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-brand-surface text-brand-muted border border-brand-border">
                  الشركاء
                </span>
              </div>
              <span className="text-[10px] font-medium text-brand-muted mt-0.5">
                لوحة التاجر والمخزون
              </span>
            </div>
          </Link>

          {isMobileDrawer && onCloseDrawer && (
            <button
              type="button"
              onClick={onCloseDrawer}
              className="p-1.5 rounded-lg text-brand-muted hover:text-brand-dark hover:bg-brand-surface text-sm cursor-pointer transition-colors"
              aria-label="إغلاق القائمة"
            >
              ✕
            </button>
          )}
        </div>

        {/* Store Profile Card & Status Switch */}
        {store && (
          <div className="rounded-xl bg-brand-surface border border-brand-border p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-black text-brand-dark truncate m-0">
                  {store.name}
                </h3>
                <span className="text-[10px] font-medium text-brand-muted block truncate">
                  📍 {store.address?.city === 'deir_albalah' ? 'دير البلح' : store.address?.city || 'المحافظة الوسطى'}
                </span>
              </div>
              <div className="w-7 h-7 rounded-lg bg-brand-card border border-brand-border text-brand-primary flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                {store.name.slice(0, 1)}
              </div>
            </div>

            {/* Quick Readiness Toggle Button */}
            <button
              type="button"
              onClick={handleToggleStoreStatus}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all duration-150 active:scale-97 cursor-pointer ${
                isStoreActive
                  ? 'bg-brand-trust-soft text-brand-trust border-brand-trust/30 hover:bg-brand-trust-soft/80'
                  : 'bg-brand-card text-brand-muted border-brand-border hover:bg-brand-surface'
              }`}
              title="تغيير جاهزية المتجر لاستقبال طلبات الزبائن وتوجيه المندوب"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isStoreActive ? 'bg-brand-trust shadow-xs' : 'bg-brand-muted'
                  }`}
                />
                <span>{isStoreActive ? 'يستقبل الطلبيات' : 'مغلق مؤقتاً'}</span>
              </div>
              <span className="text-[10px] text-brand-muted">تبديل ▾</span>
            </button>
          </div>
        )}

        {/* 2. Main Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isClickable = !item.badge;

            if (!isClickable) {
              return (
                <div
                  key={item.title}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-brand-muted/60 cursor-not-allowed select-none transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.title}</span>
                  </div>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-brand-surface text-brand-muted border border-brand-border">
                    {item.badge}
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={item.title}
                href={item.href}
                onClick={onCloseDrawer}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 no-underline ${
                  item.isActive
                    ? 'bg-brand-dark text-white shadow-xs'
                    : 'text-brand-muted hover:text-brand-dark hover:bg-brand-surface active:scale-98'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.title}</span>
                </div>

                {item.count !== undefined && (
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-md ${
                      item.isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-brand-surface text-brand-muted'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* 3. Bottom Utility & Operational Assurance */}
      <div className="space-y-3 pt-4 border-t border-brand-border/60">
        {/* Central Gaza Logistics Pillar Badge */}
        <div className="rounded-xl bg-brand-primary-soft border border-brand-primary-border p-2.5 space-y-1 text-right">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-brand-dark">طرد موحد 8 ₪</span>
            <span className="text-[9px] font-bold text-brand-primary bg-brand-card px-1.5 py-0.2 rounded border border-brand-primary-border/60">
              الوسطى
            </span>
          </div>
          <p className="text-[10px] text-brand-muted m-0 leading-tight">
            فحص وتشغيل السلعة إلزامي عند باب الزبون قبل استلام المبلغ
          </p>
        </div>

        {/* Storefront Guest Preview */}
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 text-xs font-bold text-brand-dark bg-brand-card hover:bg-brand-surface border border-brand-border px-3 py-2 rounded-xl transition-all duration-150 no-underline shadow-2xs active:scale-98"
          title="تصفح متجر سَدِيم كما يراه الزبون العادي في المتجر"
        >
          <span>معاينة كمتسوق (ضيف)</span>
          <span className="text-[10px] text-brand-muted">↗</span>
        </Link>

        {/* User details and logout */}
        <div className="flex items-center justify-between pt-1 px-1 text-xs">
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-brand-muted truncate block">
              {user?.name || user?.email || 'التاجر'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              onCloseDrawer?.();
              logout();
            }}
            className="text-[11px] font-bold text-brand-muted hover:text-red-600 transition-colors cursor-pointer select-none"
          >
            خروج
          </button>
        </div>
      </div>
    </aside>
  );
}
