'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMerchantContext } from '../context/MerchantContext';

export default function MerchantMobileBottomNav() {
  const pathname = usePathname();
  const { metrics, setIsDrawerOpen } = useMerchantContext();

  const isProductsActive = pathname === '/merchant/dashboard';

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-brand-card/95 backdrop-blur-xl border-t border-brand-border font-almarai select-none shadow-[0_-2px_10px_rgba(0,0,0,0.03)]"
      style={{ paddingBottom: 'calc(0.4rem + env(safe-area-inset-bottom, 0px))' }}
      aria-label="شريط التنقل السريع للتاجر"
    >
      <div className="grid grid-cols-4 items-center h-14 px-2">
        {/* 1. Products (Active) */}
        <Link
          href="/merchant/dashboard"
          className={`flex flex-col items-center justify-center gap-1 h-full rounded-xl transition-all active:scale-95 no-underline ${
            isProductsActive
              ? 'text-brand-primary font-black'
              : 'text-brand-muted hover:text-brand-dark font-bold'
          }`}
        >
          <div className="relative">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isProductsActive ? 2.2 : 1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            {metrics.totalProducts > 0 && (
              <span className="absolute -top-1 -right-2 px-1 text-[9px] font-black rounded-full bg-brand-dark text-white min-w-3.5 text-center leading-3.5">
                {metrics.totalProducts}
              </span>
            )}
          </div>
          <span className="text-[11px] leading-none">المنتجات</span>
        </Link>

        {/* 2. Orders */}
        <div
          className="flex flex-col items-center justify-center gap-1 h-full rounded-xl text-brand-muted/50 cursor-not-allowed select-none"
          title="مسار الطلبيات والطرود الموحدة 8 ₪ (قريباً)"
        >
          <div className="relative">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="absolute -top-1 -right-2 px-1 text-[8px] font-black rounded-full bg-brand-surface text-brand-muted border border-brand-border leading-3">
              قريباً
            </span>
          </div>
          <span className="text-[11px] font-bold leading-none">الطلبيات</span>
        </div>

        {/* 3. Wallet */}
        <div
          className="flex flex-col items-center justify-center gap-1 h-full rounded-xl text-brand-muted/50 cursor-not-allowed select-none"
          title="المحفظة والمستحقات والتسويات النقدية (قريباً)"
        >
          <div className="relative">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span className="absolute -top-1 -right-2 px-1 text-[8px] font-black rounded-full bg-brand-surface text-brand-muted border border-brand-border leading-3">
              قريباً
            </span>
          </div>
          <span className="text-[11px] font-bold leading-none">المحفظة</span>
        </div>

        {/* 4. Menu / More Drawer */}
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="flex flex-col items-center justify-center gap-1 h-full rounded-xl text-brand-muted hover:text-brand-dark font-bold active:scale-95 cursor-pointer"
          aria-label="فتح القائمة الكاملة وإعدادات المتجر"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="text-[11px] leading-none">القائمة</span>
        </button>
      </div>
    </nav>
  );
}
