'use client';

import React from 'react';
import Link from 'next/link';

export default function AdminPage() {
  return (
    <div className="space-y-6 font-almarai text-right">
      {/* Welcome Banner */}
      <div className="bg-brand-card rounded-2xl border border-brand-border p-6 sm:p-8 shadow-2xs space-y-3 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-trust animate-pulse" />
              <span className="text-xs font-bold text-brand-trust">نظام سَدِيم المركزي يعمل بنشاط</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-brand-dark">
              مرحباً بك في محطة القيادة والرقابة
            </h2>
            <p className="text-xs text-brand-muted max-w-xl leading-relaxed">
              إدارة العمليات المركزية لمنصة سَدِيم في المحافظة الوسطى، تشمل شبكة المتاجر، الكتالوج، والفئات المعتمدة.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/admin/stores"
              className="px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-black hover:bg-brand-primary-hover transition-colors shadow-xs"
            >
              متابعة المتاجر
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
