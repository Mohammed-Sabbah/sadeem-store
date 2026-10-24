'use client';

import React from 'react';
import type { AdminStoreTab, AdminStoreMetrics } from '../utils/storeFilters';

interface AdminStoreFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTab: AdminStoreTab;
  onTabChange: (tab: AdminStoreTab) => void;
  selectedCity: string;
  onCityChange: (city: string) => void;
  metrics: AdminStoreMetrics;
  filteredCount: number;
}

const MIDDLE_CITIES = [
  { id: 'all', label: 'كافة مناطق الوسطى' },
  { id: 'دير البلح', label: 'دير البلح' },
  { id: 'مخيم النصيرات', label: 'مخيم النصيرات' },
  { id: 'الزوايدة', label: 'الزوايدة' },
  { id: 'مخيم البريج', label: 'مخيم البريج' },
  { id: 'مخيم المغازي', label: 'مخيم المغازي' },
];

export const AdminStoreFilterBar: React.FC<AdminStoreFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  selectedCity,
  onCityChange,
  metrics,
  filteredCount,
}) => {
  return (
    <div className="p-4 sm:p-5 border-b border-brand-border/70 bg-brand-surface/40 select-none">
      {/* 1. Search + City Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 group">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="بحث باسم المتجر، المالك، أو رقم الهاتف..."
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

        {/* City Filter Select */}
        <div className="sm:w-48 shrink-0">
          <select
            value={selectedCity}
            onChange={(e) => onCityChange(e.target.value)}
            className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-border bg-brand-card text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary cursor-pointer transition-all"
          >
            {MIDDLE_CITIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Count Tag */}
        <div className="text-[11px] font-bold text-brand-muted self-center sm:self-auto shrink-0">
          <span>عرض {filteredCount} من أصل {metrics.total}</span>
        </div>
      </div>

      {/* 2. Apple-Style Segmented Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pt-3 mt-3 border-t border-brand-border/60 scrollbar-none text-xs">
        <button
          type="button"
          onClick={() => onTabChange('approved')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all duration-150 shrink-0 cursor-pointer active:scale-95 ${
            activeTab === 'approved'
              ? 'bg-brand-dark text-white shadow-xs'
              : 'bg-brand-surface text-brand-muted hover:text-brand-dark hover:bg-brand-border/60'
          }`}
        >
          المتاجر المعتمدة ({metrics.approved})
        </button>

        <button
          type="button"
          onClick={() => onTabChange('pending')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all duration-150 shrink-0 cursor-pointer active:scale-95 ${
            activeTab === 'pending'
              ? 'bg-brand-primary text-white shadow-xs'
              : 'bg-brand-surface text-brand-muted hover:text-brand-dark hover:bg-brand-border/60'
          }`}
        >
          طلبات الانضمام ({metrics.pending})
        </button>

        <button
          type="button"
          onClick={() => onTabChange('all')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all duration-150 shrink-0 cursor-pointer active:scale-95 ${
            activeTab === 'all'
              ? 'bg-brand-dark text-white shadow-xs'
              : 'bg-brand-surface text-brand-muted hover:text-brand-dark hover:bg-brand-border/60'
          }`}
        >
          كافة المتاجر ({metrics.total})
        </button>
      </div>
    </div>
  );
};
