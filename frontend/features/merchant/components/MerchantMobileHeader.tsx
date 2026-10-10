'use client';

import React from 'react';
import Link from 'next/link';
import { useMerchantContext } from '../context/MerchantContext';

export default function MerchantMobileHeader() {
  const { store, setIsDrawerOpen } = useMerchantContext();
  const isStoreActive = store?.status === 'active';

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-brand-card/95 backdrop-blur-xl border-b border-brand-border px-4 h-14 flex items-center justify-between font-almarai text-right select-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      {/* Right side: Menu / Drawer toggle button */}
      <button
        type="button"
        onClick={() => setIsDrawerOpen(true)}
        className="w-10 h-10 rounded-xl bg-brand-surface hover:bg-brand-border text-brand-dark flex items-center justify-center transition-colors active:scale-95 cursor-pointer border border-brand-border/60"
        aria-label="فتح القائمة الرئيسية"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Center: Brand & Store Title with live status dot */}
      <div className="flex items-center gap-2 min-w-0 max-w-[200px]">
        <div className="w-7 h-7 rounded-lg bg-brand-primary text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
          س
        </div>
        <div className="min-w-0 text-center">
          <div className="flex items-center justify-center gap-1.5 leading-none">
            <span className="text-xs font-black text-brand-dark truncate">
              {store?.name || 'سَدِيم للشركاء'}
            </span>
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isStoreActive ? 'bg-brand-trust shadow-2xs' : 'bg-brand-muted/40'
              }`}
              title={isStoreActive ? 'المتجر نشط ويستقبل الطلبات' : 'المتجر مغلق'}
            />
          </div>
          <span className="text-[10px] text-brand-muted font-medium block truncate mt-0.5">
            لوحة التاجر
          </span>
        </div>
      </div>

      {/* Left side: Guest Storefront preview */}
      <Link
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-dark bg-brand-surface hover:bg-brand-border/60 border border-brand-border px-2.5 py-1.5 rounded-lg transition-all active:scale-95 no-underline shadow-2xs"
        title="معاينة كمتسوق"
      >
        <span>معاينة</span>
        <span className="text-brand-muted text-[10px]">↗</span>
      </Link>
    </header>
  );
}
