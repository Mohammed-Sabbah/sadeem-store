'use client';

import React from 'react';
import Link from 'next/link';

export function CategoryStrip() {
  const categories = [
    {
      title: 'طاقة وبدائل',
      count: '28 موثق',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ),
      highlight: false,
    },
    {
      title: 'مؤونة بلدية',
      count: '35 بلدي',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 3h6M10 3v2c-2 1-3 3-3 6 0 5 3 8 5 8s5-3 5-8c0-3-1-5-3-6V3" />
          <path d="M7 8c-2 0-3 1.5-3 3.5S5.5 15 7 15" />
          <path d="M17 8c2 0 3 1.5 3 3.5S18.5 15 17 15" />
        </svg>
      ),
      highlight: true,
    },
    {
      title: 'راوترات وشبكات',
      count: '19 جهاز',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.55a11 11 0 0 1 14.08 0" />
          <path d="M1.42 9a16 16 0 0 1 21.16 0" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      ),
      highlight: false,
    },
    {
      title: 'تجهيز منزلي',
      count: '42 أداة',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
          <polyline points="9 21 9 12 15 12 15 21" />
        </svg>
      ),
      highlight: false,
    },
    {
      title: 'عناية ونظافة',
      count: '14 منتج',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </svg>
      ),
      highlight: false,
    },
    {
      title: 'حرف وفخار',
      count: '12 صانع',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3h8M9 3v3c0 2-2 3.5-2 6 0 4 2.5 7 5 7s5-3 5-7c0-2.5-2-4-2-6V3" />
          <line x1="10" y1="22" x2="14" y2="22" />
        </svg>
      ),
      highlight: false,
    },
    {
      title: 'أزياء ومستلزمات',
      count: '23 متجر',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
        </svg>
      ),
      highlight: false,
    },
    {
      title: 'دليل المتاجر',
      count: '18 متجر',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      ),
      highlight: false,
    },
  ];

  return (
    <section className="max-w-[1240px] mx-auto px-4 pt-4 pb-2 w-full font-almarai" aria-labelledby="cat-head">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base md:text-lg font-extrabold text-brand-dark flex items-center gap-2" id="cat-head">
          <span className="w-1 h-4 rounded-full bg-brand-primary" />
          <span>التصنيفات المعتمدة</span>
        </h2>
        <Link href="/explore" className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1">
          <span>عرض كافة الأقسام</span>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat, idx) => (
          <Link
            key={idx}
            href="/explore"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-brand-border bg-brand-surface hover:border-brand-primary/50 shadow-xs transition-all shrink-0 group"
            title={`قسم ${cat.title}`}
          >
            <span
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                cat.highlight
                  ? 'bg-[var(--brand-trust-soft)] text-brand-trust'
                  : 'bg-[var(--brand-bg)] text-brand-dark group-hover:text-brand-primary group-hover:bg-[var(--brand-primary-soft)]'
              }`}
            >
              {cat.icon}
            </span>
            <div className="text-right">
              <span className="text-xs font-extrabold text-brand-dark group-hover:text-brand-primary transition-colors block whitespace-nowrap">
                {cat.title}
              </span>
              <span className="text-[10px] text-brand-muted block whitespace-nowrap">
                {cat.count}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
