'use client';

import React from 'react';
import type { AdminProductTab, AdminProductMetrics } from '../utils/productAdminFilters';
import type { AdminStoreItem } from '../types/admin.types';

interface AdminProductFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTab: AdminProductTab;
  onTabChange: (tab: AdminProductTab) => void;
  selectedStoreId: string;
  onStoreChange: (storeId: string) => void;
  selectedCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
  stores: AdminStoreItem[];
  categories: any[];
  metrics: AdminProductMetrics;
  filteredCount: number;
}

export const AdminProductFilterBar: React.FC<AdminProductFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  selectedStoreId,
  onStoreChange,
  selectedCategoryId,
  onCategoryChange,
  stores,
  categories,
  metrics,
  filteredCount,
}) => {
  return (
    <div className="p-4 sm:p-5 border-b border-brand-border/70 bg-brand-surface/40 select-none space-y-3">
      {/* 1. Search + Store + Category Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 group">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="بحث باسم الصنف، المتجر، أو القسم..."
            className="w-full h-10 pr-9 pl-8 text-xs font-medium rounded-xl border border-brand-border bg-brand-card text-brand-dark placeholder:text-brand-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
          />
          <svg
            className="w-4 h-4 text-brand-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-brand-primary transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-brand-surface text-brand-muted hover:bg-brand-border text-xs flex items-center justify-center cursor-pointer transition-colors"
              aria-label="مسح البحث"
            >
              ×
            </button>
          )}
        </div>

        {/* Store Selector */}
        <div className="w-full md:w-48 shrink-0">
          <select
            value={selectedStoreId}
            onChange={(e) => onStoreChange(e.target.value)}
            className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-border bg-brand-card text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary cursor-pointer transition-all"
          >
            <option value="all">كافة المتاجر</option>
            {stores.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category Selector */}
        <div className="w-full md:w-44 shrink-0">
          <select
            value={selectedCategoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-border bg-brand-card text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary cursor-pointer transition-all"
          >
            <option value="all">كافة الأقسام</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        {/* Count Tag */}
        <div className="text-[11px] font-bold text-brand-muted self-center md:self-auto shrink-0">
          <span>عرض {filteredCount} من أصل {metrics.total}</span>
        </div>
      </div>

      {/* 2. Apple-Style Segmented Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-brand-border/60 scrollbar-none text-xs">
        <button
          type="button"
          onClick={() => onTabChange('all')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all duration-150 shrink-0 cursor-pointer active:scale-95 ${
            activeTab === 'all'
              ? 'bg-brand-dark text-white shadow-xs'
              : 'bg-brand-surface text-brand-muted hover:text-brand-dark hover:bg-brand-border/60'
          }`}
        >
          كافة الأصناف ({metrics.total})
        </button>

        <button
          type="button"
          onClick={() => onTabChange('approved')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all duration-150 shrink-0 cursor-pointer active:scale-95 ${
            activeTab === 'approved'
              ? 'bg-brand-dark text-white shadow-xs'
              : 'bg-brand-surface text-brand-muted hover:text-brand-dark hover:bg-brand-border/60'
          }`}
        >
          معروض بالمتجر ({metrics.approved})
        </button>

        <button
          type="button"
          onClick={() => onTabChange('rejected')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all duration-150 shrink-0 cursor-pointer active:scale-95 ${
            activeTab === 'rejected'
              ? 'bg-red-700 text-white shadow-xs'
              : 'bg-brand-surface text-brand-muted hover:text-brand-dark hover:bg-brand-border/60'
          }`}
        >
          موقوف إدارياً ({metrics.rejected})
        </button>

        <button
          type="button"
          onClick={() => onTabChange('out_of_stock')}
          className={`px-3.5 py-1.5 rounded-lg font-bold transition-all duration-150 shrink-0 cursor-pointer active:scale-95 ${
            activeTab === 'out_of_stock'
              ? 'bg-brand-primary text-white shadow-xs'
              : 'bg-brand-surface text-brand-muted hover:text-brand-dark hover:bg-brand-border/60'
          }`}
        >
          نواقص المخزون ({metrics.outOfStock})
        </button>
      </div>
    </div>
  );
};
