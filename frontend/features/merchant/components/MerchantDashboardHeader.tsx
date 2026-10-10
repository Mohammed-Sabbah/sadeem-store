'use client';

import React from 'react';
import type { StoreProfile } from '../types/merchant.types';

interface MerchantDashboardHeaderProps {
  store: StoreProfile;
  onOpenAddModal: () => void;
  onToggleStoreStatus?: () => void;
}

export default function MerchantDashboardHeader({
  store,
  onOpenAddModal,
}: MerchantDashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-brand-border/60 font-almarai text-right select-none">
      {/* Page Title & Context */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-lg sm:text-xl font-black text-brand-dark tracking-tight m-0">
            كتالوج المنتجات والمخزون
          </h1>
          <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-brand-surface text-brand-muted border border-brand-border">
            {store.name}
          </span>
        </div>
        <p className="text-xs text-brand-muted m-0">
          إدارة مباشرة للأصناف، المقاسات والألوان، وتحديثات الجرد اللحظية
        </p>
      </div>

      {/* Primary Action Button: Add Product */}
      <button
        type="button"
        onClick={onOpenAddModal}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs sm:text-sm font-black transition-all duration-150 shadow-sm active:scale-95 cursor-pointer"
      >
        <span className="text-base font-bold leading-none">+</span>
        <span>إضافة صنف جديد</span>
      </button>
    </div>
  );
}
