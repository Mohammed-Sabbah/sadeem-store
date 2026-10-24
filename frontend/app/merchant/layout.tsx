'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { MerchantProvider } from '@/features/merchant/context/MerchantContext';
import MerchantSidebar from '@/features/merchant/components/MerchantSidebar';
import MerchantMobileHeader from '@/features/merchant/components/MerchantMobileHeader';
import MerchantMobileBottomNav from '@/features/merchant/components/MerchantMobileBottomNav';
import MerchantMobileDrawer from '@/features/merchant/components/MerchantMobileDrawer';

function MerchantLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isIsolatedPage = pathname === '/merchant/pending-approval' || pathname === '/merchant/join';

  // If merchant is pending approval or joining, keep isolated minimal shell
  if (isIsolatedPage) {
    return (
      <div className="min-h-screen bg-brand-bg text-brand-dark font-almarai antialiased flex flex-col">
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-dark font-almarai antialiased flex flex-col selection:bg-brand-primary-soft selection:text-brand-primary">
      {/* 1. Desktop Fixed Sidebar (Firmly anchored to Right-hand in RTL, never scrolls with page) */}
      <div className="hidden lg:block fixed top-0 right-0 bottom-0 w-68 z-30">
        <MerchantSidebar />
      </div>

      {/* 2. Mobile Top Navigation Bar (Ergonomic App Bar) */}
      <MerchantMobileHeader />

      {/* 3. Mobile Slide-Over Drawer */}
      <MerchantMobileDrawer />

      {/* 4. Main Dynamic Workspace (Offset by 272px on desktop to perfectly respect the fixed sidebar) */}
      <div className="flex-1 min-w-0 flex flex-col justify-between lg:mr-68">
        <main className="w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 flex-1 pb-28 lg:pb-24">
          {children}
        </main>

        {/* Minimal Quiet System Footer (Desktop & Tablet) */}
        <footer className="hidden lg:flex w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-4 border-t border-brand-border/60 items-center justify-between gap-3 text-[11px] text-brand-muted">
          <div className="flex items-center gap-2">
            <span className="font-bold text-brand-dark">سَدِيم للشركاء</span>
            <span>•</span>
            <span>نظام التشغيل الميداني للمحافظة الوسطى — دير البلح والنصيرات</span>
          </div>
          <div className="flex items-center gap-3">
            <span>طرد موحد 8 ₪</span>
            <span>•</span>
            <span>المعاينة قبل الدفع إلزامية</span>
          </div>
        </footer>
      </div>

      {/* 5. Mobile Fixed Bottom Navigation Bar (Thumb Zone) */}
      <MerchantMobileBottomNav />
    </div>
  );
}

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  return (
    <MerchantProvider>
      <MerchantLayoutContent>{children}</MerchantLayoutContent>
    </MerchantProvider>
  );
}
