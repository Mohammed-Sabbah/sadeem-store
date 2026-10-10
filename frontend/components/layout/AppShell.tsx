'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';
import { PaletteSwitcher } from '@/components/layout/PaletteSwitcher';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isAuthPage = pathname?.startsWith('/auth');
  const isMerchantPortal = pathname?.startsWith('/merchant');
  const isTransactional = pathname === '/checkout' || pathname === '/order-success' || pathname === '/tracking';

  // Strictly isolate merchant portal from customer storefront chrome (while keeping palette switcher available)
  const showBottomNav = !isTransactional && !isAuthPage && !isMerchantPortal;
  const showHeaderFooter = !isAuthPage && !isMerchantPortal;
  const showPaletteSwitcher = !isTransactional && !isAuthPage;

  return (
    <div
      id="root-wrapper"
      className={`min-h-screen flex flex-col bg-brand-bg text-brand-dark font-almarai antialiased selection:bg-brand-primary-soft selection:text-brand-primary ${
        showBottomNav ? 'pb-16 md:pb-0' : ''
      }`}
    >
      {/* Universal Sadeem consumer header (hidden on auth & merchant portal) */}
      {showHeaderFooter && <Header />}

      {/* Main page content */}
      <div className="flex-1 w-full flex flex-col">
        {children}
      </div>

      {/* Sadeem consumer footer (hidden on auth & merchant portal) */}
      {showHeaderFooter && <Footer />}

      {/* 5-tab PWA bottom navigation on mobile (hidden on auth, checkout & merchant portal) */}
      {showBottomNav && <BottomNav />}

      {/* Candidate Palette Switcher (hidden on checkout & merchant portal) */}
      {showPaletteSwitcher && <PaletteSwitcher />}
    </div>
  );
}
