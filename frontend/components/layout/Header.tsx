'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export function Header() {
  const { totalItems } = useCart();
  const { user, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const isCheckout = pathname === '/checkout';
  const isOrderSuccess = pathname === '/order-success';
  const isTracking = pathname === '/tracking';

  // Dedicated Distraction-Free Header for Checkout & Order Confirmation & Tracking
  if (isCheckout || isOrderSuccess || isTracking) {
    return (
      <header className="w-full bg-white/95 backdrop-blur-md border-b border-brand-border sticky top-0 z-40">
        <div className="max-w-[1240px] mx-auto px-4 h-16 flex items-center justify-between">
          {/* Brand Logo: Approved Sadeem Wordmark & Starlight Accent */}
          <Link href="/" className="inline-flex items-center gap-1.5 no-underline" aria-label="سَدِيم — سوق محلي موثوق">
            <span className="font-almarai font-extrabold text-2xl tracking-tight text-brand-dark">سَدِيم</span>
            <span className="w-2 h-2 rotate-45 bg-brand-primary inline-block rounded-[1px] shadow-[0_0_8px_rgba(184,98,27,0.5)]"></span>
          </Link>

          {/* Secure Trust Indicator & Navigation Link */}
          <div className="flex items-center gap-3">
            {isCheckout && (
              <>
                <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-trust-soft text-brand-trust border border-brand-trust/20 text-xs font-bold">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  <span>دفع آمن ومعاينة مكفولة</span>
                </div>
                <Link
                  href="/cart"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-surface border border-brand-border text-brand-dark hover:text-brand-primary hover:border-brand-primary text-xs font-bold transition-colors no-underline"
                >
                  <span>←</span>
                  <span>العودة للسلة</span>
                </Link>
              </>
            )}

            {isOrderSuccess && (
              <>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-trust-soft text-brand-trust border border-brand-trust/20 text-xs font-bold">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>طلب معتمد وموثق</span>
                </div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-surface border border-brand-border text-brand-dark hover:text-brand-primary hover:border-brand-primary text-xs font-bold transition-colors no-underline"
                >
                  <span>←</span>
                  <span>الرئيسية</span>
                </Link>
              </>
            )}

            {isTracking && (
              <>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary-soft text-brand-primary border border-brand-primary/20 text-xs font-bold">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                  <span>تتبع ميداني مباشر</span>
                </div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-surface border border-brand-border text-brand-dark hover:text-brand-primary hover:border-brand-primary text-xs font-bold transition-colors no-underline"
                >
                  <span>←</span>
                  <span>الرئيسية</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-brand-border sticky top-0 z-40">
      <div className="max-w-[1240px] mx-auto px-4 h-16 flex items-center justify-between gap-3 sm:gap-6">
        {/* Brand Logo: Approved Sadeem Wordmark & Starlight Accent */}
        <Link href="/" className="inline-flex items-center gap-1.5 no-underline flex-shrink-0" aria-label="سَدِيم — سوق محلي موثوق">
          <span className="font-almarai font-extrabold text-2xl tracking-tight text-brand-dark">سَدِيم</span>
          <span className="w-2 h-2 rotate-45 bg-brand-primary inline-block rounded-[1px] shadow-[0_0_8px_rgba(184,98,27,0.5)]"></span>
        </Link>

        {/* Fixed Universal Search */}
        <div className="flex-1 max-w-xl relative">
          <input
            type="text"
            className="w-full h-10 pr-10 pl-4 text-xs sm:text-sm font-medium text-brand-dark placeholder:text-brand-subtle bg-brand-surface border border-brand-border rounded-full focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-colors"
            placeholder="ابحث عن منتج، متجر، أو تصنيف..."
          />
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
          {/* Desktop-Only Wallet Badge (Hidden on mobile per GEMINI.md) */}
          <Link
            href={isAuthenticated ? "/account" : "/auth/login?redirect=/account"}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-surface border border-brand-border text-xs font-bold text-brand-dark hover:border-brand-primary cursor-pointer transition-colors no-underline"
            title="رصيد محفظة سديم"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-brand-glow"
            >
              <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
              <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
              <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
            </svg>
            <span className="text-brand-muted">المحفظة:</span>
            <span className="font-extrabold text-brand-primary">
              {isAuthenticated ? `${user?.walletBalance ?? 0} ₪` : 'شحن المحفظة'}
            </span>
            <span className="w-4 h-4 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-xs leading-none">+</span>
          </Link>


          <Link
            href="/wishlist"
            className="p-2 rounded-full text-brand-muted hover:text-brand-primary hover:bg-brand-surface transition-colors"
            title="المفضلة"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </Link>

          <Link
            href="/cart"
            className="p-2 rounded-full text-brand-muted hover:text-brand-primary hover:bg-brand-surface transition-colors relative"
            title="سلة المشتريات"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-primary text-white text-[10px] font-extrabold flex items-center justify-center shadow-sm">
                {totalItems}
              </span>
            )}
          </Link>

          <Link
            href={isAuthenticated ? "/account" : "/auth/login?redirect=/account"}
            className="hidden sm:inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full bg-brand-dark text-white hover:bg-brand-primary text-xs font-bold transition-colors shadow-sm no-underline"
          >
            {isAuthenticated ? (
              <span>أهلاً، {user?.name?.split(' ')[0] || 'حسابي'}</span>
            ) : (
              <span>دخول / حسابي</span>
            )}
          </Link>
        </div>
      </div>

      {/* DESKTOP NAVBAR (VISIBLE ON WIDE SCREENS) */}
      <nav className="hidden md:block bg-brand-surface border-t border-brand-border-subtle" aria-label="التنقل الرئيسي">
        <div className="max-w-[1240px] mx-auto px-4 h-10 flex items-center gap-6 text-xs font-bold text-brand-muted">
          <Link href="/" className={`transition-colors hover:text-brand-primary ${pathname === '/' ? 'text-brand-primary font-extrabold' : ''}`}>
            الرئيسية
          </Link>
          <Link href="/explore" className={`transition-colors hover:text-brand-primary ${pathname === '/explore' ? 'text-brand-primary font-extrabold' : ''}`}>
            المتاجر المعتمدة
          </Link>
          <Link href="/explore" className="transition-colors hover:text-brand-primary">
            التصنيفات
          </Link>
          <Link href="/#curated-head" className="transition-colors hover:text-brand-primary">
            الأكثر طلباً
          </Link>
          <Link href="/#curated-head" className="transition-colors text-brand-primary hover:text-brand-primary-hover">
            وصل حديثاً
          </Link>
        </div>
      </nav>
    </header>
  );
}
