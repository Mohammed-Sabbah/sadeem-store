'use client';

import React from 'react';
import Link from 'next/link';
import type { ApiCategory } from '@/features/catalog/catalog.service';

interface CategoryStripProps {
  categories?: ApiCategory[];
  selectedCategoryId?: string | null;
  onSelect?: (categoryId: string | null) => void;
}

function getCategoryIcon(title: string, slug?: string) {
  const text = `${title} ${slug || ''}`.toLowerCase();

  if (text.includes('طاقة') || text.includes('شمس') || text.includes('بطار') || text.includes('solar') || text.includes('energy')) {
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    );
  }

  if (text.includes('مؤونة') || text.includes('زيت') || text.includes('غذاء') || text.includes('طعام') || text.includes('بلدي') || text.includes('food')) {
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3h6M10 3v2c-2 1-3 3-3 6 0 5 3 8 5 8s5-3 5-8c0-3-1-5-3-6V3" />
        <path d="M7 8c-2 0-3 1.5-3 3.5S5.5 15 7 15" />
        <path d="M17 8c2 0 3 1.5 3 3.5S18.5 15 17 15" />
      </svg>
    );
  }

  if (text.includes('راوتر') || text.includes('شبك') || text.includes('نت') || text.includes('انترنت') || text.includes('network') || text.includes('wifi')) {
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.55a11 11 0 0 1 14.08 0" />
        <path d="M1.42 9a16 16 0 0 1 21.16 0" />
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
        <line x1="12" y1="20" x2="12.01" y2="20" />
      </svg>
    );
  }

  if (text.includes('منزل') || text.includes('تجهيز') || text.includes('بيت') || text.includes('home')) {
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <polyline points="9 21 9 12 15 12 15 21" />
      </svg>
    );
  }

  if (text.includes('عناية') || text.includes('نظافة') || text.includes('تجميل') || text.includes('عطر') || text.includes('care') || text.includes('beauty')) {
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    );
  }

  if (text.includes('حرف') || text.includes('فخار') || text.includes('يدوي') || text.includes('craft')) {
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3h8M9 3v3c0 2-2 3.5-2 6 0 4 2.5 7 5 7s5-3 5-7c0-2.5-2-4-2-6V3" />
        <line x1="10" y1="22" x2="14" y2="22" />
      </svg>
    );
  }

  if (text.includes('أزياء') || text.includes('ملابس') || text.includes('قماش') || text.includes('fashion') || text.includes('clothes')) {
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
      </svg>
    );
  }

  if (text.includes('حذاء') || text.includes('أحذية') || text.includes('shoes')) {
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 18h20v-3a4 4 0 0 0-4-4h-5l-3-4H4a2 2 0 0 0-2 2v9z" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
      </svg>
    );
  }

  // Fallback: Cosmic Diamond
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 12l10 10 10-10L12 2z" />
    </svg>
  );
}

const DEFAULT_CATEGORIES = [
  { _id: 'cat_energy', title: 'طاقة وبدائل', slug: 'energy' },
  { _id: 'cat_food', title: 'مؤونة بلدية', slug: 'food' },
  { _id: 'cat_network', title: 'راوترات وشبكات', slug: 'network' },
  { _id: 'cat_home', title: 'تجهيز منزلي', slug: 'home' },
  { _id: 'cat_care', title: 'عناية ونظافة', slug: 'care' },
  { _id: 'cat_crafts', title: 'حرف وفخار', slug: 'crafts' },
  { _id: 'cat_fashion', title: 'أزياء ومستلزمات', slug: 'fashion' },
];

export function CategoryStrip({
  categories = [],
  selectedCategoryId = null,
  onSelect,
}: CategoryStripProps) {
  const displayCategories = categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  return (
    <section className="max-w-[1240px] mx-auto px-4 pt-4 pb-2 w-full font-almarai" aria-labelledby="cat-head">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base md:text-lg font-extrabold text-brand-dark flex items-center gap-2" id="cat-head">
          <span className="w-1 h-4 rounded-full bg-brand-primary" />
          <span>التصنيفات المعتمدة</span>
        </h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-none">
        {onSelect && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border shadow-xs transition-all shrink-0 font-almarai ${
              selectedCategoryId === null
                ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                : 'bg-brand-surface text-brand-dark border-brand-border hover:border-brand-primary/50'
            }`}
            aria-pressed={selectedCategoryId === null}
          >
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              selectedCategoryId === null ? 'bg-white/20 text-white' : 'bg-[var(--brand-bg)] text-brand-dark'
            }`}>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </span>
            <span className="text-xs font-extrabold whitespace-nowrap">الكل</span>
          </button>
        )}

        {displayCategories.map((cat) => {
          const isSelected = selectedCategoryId === cat._id;
          const content = (
            <>
              <span
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-[var(--brand-bg)] text-brand-dark group-hover:text-brand-primary group-hover:bg-[var(--brand-primary-soft)]'
                }`}
              >
                {getCategoryIcon(cat.title, cat.slug)}
              </span>
              <span className={`text-xs font-extrabold whitespace-nowrap transition-colors ${
                isSelected ? 'text-white' : 'text-brand-dark group-hover:text-brand-primary'
              }`}>
                {cat.title}
              </span>
            </>
          );

          if (onSelect) {
            return (
              <button
                key={cat._id}
                type="button"
                onClick={() => onSelect(isSelected ? null : cat._id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border shadow-xs transition-all shrink-0 group font-almarai ${
                  isSelected
                    ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                    : 'bg-brand-surface text-brand-dark border-brand-border hover:border-brand-primary/50'
                }`}
                aria-pressed={isSelected}
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={cat._id}
              href="/explore"
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-brand-border bg-brand-surface hover:border-brand-primary/50 shadow-xs transition-all shrink-0 group font-almarai"
              title={`قسم ${cat.title}`}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
