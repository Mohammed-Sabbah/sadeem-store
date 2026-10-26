'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { AdminNavItem, AdminNavSectionId } from '../types/admin.types';
import { ADMIN_NAV_ITEMS } from '../utils/adminNavigation';

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onCloseMobile?: () => void;
}

function getNavIcon(id: AdminNavSectionId, isActive: boolean) {
  const strokeClass = isActive ? 'text-brand-primary' : 'text-brand-muted';

  switch (id) {
    case 'overview':
      return (
        <svg className={`w-5 h-5 shrink-0 ${strokeClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      );
    case 'stores':
      return (
        <svg className={`w-5 h-5 shrink-0 ${strokeClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    case 'products':
      return (
        <svg className={`w-5 h-5 shrink-0 ${strokeClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
    case 'categories':
      return (
        <svg className={`w-5 h-5 shrink-0 ${strokeClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      );
    case 'orders':
      return (
        <svg className={`w-5 h-5 shrink-0 ${strokeClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      );
    case 'couriers':
      return (
        <svg className={`w-5 h-5 shrink-0 ${strokeClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case 'customers':
      return (
        <svg className={`w-5 h-5 shrink-0 ${strokeClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    case 'finances':
      return (
        <svg className={`w-5 h-5 shrink-0 ${strokeClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return null;
  }
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  onCloseMobile,
}) => {
  const pathname = usePathname();

  const isRouteActive = (item: AdminNavItem) => {
    if (item.href === '/admin') {
      return pathname === '/admin';
    }
    return pathname?.startsWith(item.href);
  };

  return (
    <aside
      className={`h-full flex flex-col bg-brand-card border-l border-brand-border select-none transition-all duration-200 font-almarai relative ${
        isCollapsed ? 'w-20 overflow-visible' : 'w-64 overflow-hidden'
      }`}
    >
      {/* 1. Brand & Header Block */}
      <div
        className={`h-16 flex items-center border-b border-brand-border/70 shrink-0 ${
          isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
        }`}
      >
        <Link
          href="/admin"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 min-w-0 group"
          title={isCollapsed ? 'سَدِيم — محطة القيادة' : undefined}
        >
          <div className="w-9 h-9 rounded-xl bg-brand-primary text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs group-hover:bg-brand-primary-hover transition-colors">
            س
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-black text-brand-dark tracking-tight leading-tight">
                سَدِيم
              </span>
              <span className="text-[10px] font-bold text-brand-primary">
                محطة القيادة
              </span>
            </div>
          )}
        </Link>

        {/* Mobile Close Button */}
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="w-8 h-8 rounded-lg text-brand-muted hover:text-brand-dark hover:bg-brand-surface flex items-center justify-center transition-colors cursor-pointer text-sm"
            aria-label="إغلاق القائمة"
          >
            ✕
          </button>
        )}

        {/* Desktop Collapse Trigger: when expanded, sits cleanly on the side */}
        {!onCloseMobile && !isCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-7 h-7 rounded-lg border border-brand-border/80 bg-brand-surface text-brand-muted hover:text-brand-dark hover:bg-brand-card flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
            title="طي القائمة الجانبية"
            aria-label="طي القائمة الجانبية"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Floating Toggle Pill when collapsed: sits gracefully with full breathing room */}
      {!onCloseMobile && isCollapsed && (
        <button
          type="button"
          onClick={onToggleCollapse}
          className="absolute -left-3.5 top-5 w-7 h-7 rounded-full border border-brand-border bg-brand-card hover:bg-brand-surface text-brand-muted hover:text-brand-primary flex items-center justify-center shadow-md transition-all cursor-pointer active:scale-95 z-50 group"
          title="توسيع القائمة الجانبية"
          aria-label="توسيع القائمة الجانبية"
        >
          <svg
            className="w-3.5 h-3.5 rotate-180 group-hover:scale-110 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* 2. Navigation Items List: overflow-visible when collapsed to never clip tooltips */}
      <nav
        className={`flex-1 p-3 space-y-1.5 scrollbar-none ${
          isCollapsed ? 'overflow-visible' : 'overflow-y-auto'
        }`}
      >
        {ADMIN_NAV_ITEMS.map((item) => {
          const active = isRouteActive(item);
          const isDeferred = item.status === 'deferred';

          if (isDeferred) {
            return (
              <div key={item.id} className="relative group">
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-brand-muted/50 cursor-not-allowed select-none ${
                    isCollapsed ? 'justify-center' : 'justify-between'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="opacity-40">{getNavIcon(item.id, false)}</span>
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!isCollapsed && item.badge && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200 shrink-0">
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Instant Floating Tooltip in Collapsed Mode */}
                {isCollapsed && (
                  <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-stone-900 text-white text-[11px] font-bold rounded-lg shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap">
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="mr-1.5 text-[9px] text-stone-300 font-normal">
                        ({item.badge})
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          }

          return (
            <div key={item.id} className="relative group">
              <Link
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer active:scale-98 relative ${
                  isCollapsed ? 'justify-center' : 'justify-between'
                } ${
                  active
                    ? 'bg-brand-primary-soft text-brand-primary shadow-2xs font-black'
                    : 'text-brand-dark hover:bg-brand-surface hover:text-brand-primary'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {getNavIcon(item.id, active)}
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>
                {!isCollapsed && active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0" />
                )}
              </Link>

              {/* Instant Floating Tooltip in Collapsed Mode */}
              {isCollapsed && (
                <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-stone-900 text-white text-[11px] font-bold rounded-lg shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* 3. System Scope Footer Badge */}
      {!isCollapsed && (
        <div className="p-3 border-t border-brand-border/70 shrink-0">
          <div className="bg-brand-surface rounded-xl p-2.5 border border-brand-border text-center space-y-0.5 shadow-2xs">
            <span className="text-[10px] font-black text-brand-dark block">
              نطاق المرحلة الأولى
            </span>
            <span className="text-[10px] font-bold text-brand-trust block">
              المحافظة الوسطى — 8 ₪ موحد
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};
