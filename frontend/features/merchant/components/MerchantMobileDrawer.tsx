'use client';

import React, { useEffect } from 'react';
import { useMerchantContext } from '../context/MerchantContext';
import MerchantSidebar from './MerchantSidebar';

export default function MerchantMobileDrawer() {
  const { isDrawerOpen, setIsDrawerOpen } = useMerchantContext();

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  if (!isDrawerOpen) return null;

  return (
    <div
      className="lg:hidden fixed inset-0 z-50 font-almarai"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200 cursor-pointer"
        onClick={() => setIsDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-over panel firmly anchored to RIGHT */}
      <div
        className="fixed top-0 right-0 bottom-0 w-[85%] max-w-xs bg-brand-card h-full z-10 flex flex-col border-l border-brand-border animate-drawer-right shadow-2xl"
      >
        <MerchantSidebar onCloseDrawer={() => setIsDrawerOpen(false)} isMobileDrawer={true} />
      </div>
    </div>
  );
}
