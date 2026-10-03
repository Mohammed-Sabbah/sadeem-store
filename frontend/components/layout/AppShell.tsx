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
  const isTransactional = pathname === '/checkout' || pathname === '/order-success' || pathname === '/tracking';
  const showBottomNav = !isTransactional && !isAuthPage;
  const showHeaderFooter = !isAuthPage;

  return (
    <div
      id="root-wrapper"
      className={`min-h-screen flex flex-col bg-brand-bg text-brand-dark font-almarai antialiased selection:bg-brand-primary-soft selection:text-brand-primary ${
        showBottomNav ? 'pb-16 md:pb-0' : ''
      }`}
    >
      {/* Universal Sadeem header (hidden on auth pages for distraction-free login/register) */}
      {showHeaderFooter && <Header />}

      {/* Main page content */}
      <div className="flex-1 w-full flex flex-col">
        {children}
      </div>

      {/* Sadeem footer (hidden on auth pages) */}
      {showHeaderFooter && <Footer />}

      {/* 5-tab PWA bottom navigation on mobile (hidden on auth, checkout & order confirmation) */}
      {showBottomNav && <BottomNav />}

      {/* Candidate Palette Switcher */}
      {!isTransactional && !isAuthPage && <PaletteSwitcher />}
    </div>
  );
}
