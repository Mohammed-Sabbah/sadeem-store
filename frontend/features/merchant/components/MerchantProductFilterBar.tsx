'use client';

import React from 'react';
import type { FilterTab, ProductFilterMetrics } from '../utils/productFilters';

export interface MerchantProductFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
  metrics: ProductFilterMetrics;
  filteredCount: number;
}

export const MerchantProductFilterBar: React.FC<MerchantProductFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  metrics,
  filteredCount,
}) => {
  return (
    <div className="p-4 sm:p-5 border-b border-brand-border/70 bg-brand-surface/40">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Spotlight Search Input */}
        <div className="relative flex-1 group">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="بحث باسم الصنف أو القسم..."
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

        {/* Result Count Tag */}
        <div className="text-[11px] font-bold text-brand-muted self-center sm:self-auto">
          <span>عرض {filteredCount} من أصل {metrics.total}</span>
        </div>
      </div>

      {/* 2. Apple-Style Segmented Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pt-3 mt-3 border-t border-brand-border/60 scrollbar-none text-xs select-none">
        <button
          type="button"
          onClick={() => onTabChange('all')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all duration-150 shrink-0 cursor-pointer active:scale-95 ${
            activeTab === 'all'
              ? 'bg-brand-dark text-white shadow-xs'
              : 'bg-brand-surface text-brand-muted hover:text-brand-dark hover:bg-brand-border/60'
          }`}
        >
          الكل ({metrics.total})
        </button>

        <button
          type="button"
          onClick={() => onTabChange('in_stock')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all duration-150 shrink-0 cursor-pointer active:scale-95 ${
            activeTab === 'in_stock'
              ? 'bg-brand-dark text-white shadow-xs'
              : 'bg-brand-surface text-brand-muted hover:text-brand-dark hover:bg-brand-border/60'
          }`}
        >
          متوفر للطلب ({metrics.inStock})
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

        <button
          type="button"
          onClick={() => onTabChange('inactive')}
          className={`px-3.5 py-1.5 rounded-lg font-bold transition-all duration-150 shrink-0 cursor-pointer active:scale-95 ${
            activeTab === 'inactive'
              ? 'bg-brand-dark text-white shadow-xs'
              : 'bg-brand-surface text-brand-muted hover:text-brand-dark hover:bg-brand-border/60'
          }`}
        >
          معطل مؤقتاً ({metrics.inactive})
        </button>
      </div>
    </div>
  );
};
