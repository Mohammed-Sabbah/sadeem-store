'use client';

import React from 'react';
import type { ApiCategory } from '@/features/catalog/catalog.service';

interface CategoryStripProps {
  categories: ApiCategory[];
  selectedCategoryId: string | null;
  onSelect: (categoryId: string | null) => void;
}

export function CategoryStrip({
  categories,
  selectedCategoryId,
  onSelect,
}: CategoryStripProps) {
  return (
    <section className="max-w-[1240px] mx-auto px-4 pt-4 pb-2 w-full font-almarai" aria-labelledby="cat-head">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base md:text-lg font-extrabold text-brand-dark flex items-center gap-2" id="cat-head">
          <span className="w-1 h-4 rounded-full bg-brand-primary" />
          <span>التصنيفات المعتمدة</span>
        </h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-none">
        {[{ _id: null, title: 'الكل' }, ...categories].map((category) => {
          const selected = category._id === selectedCategoryId;
          return (
            <button
              key={category._id || 'all'}
              type="button"
              onClick={() => onSelect(category._id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border bg-brand-surface shadow-xs transition-all shrink-0 group ${
                selected ? 'border-brand-primary' : 'border-brand-border hover:border-brand-primary/50'
              }`}
              title={`قسم ${category.title}`}
              aria-pressed={selected}
            >
              <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[var(--brand-bg)] text-brand-dark group-hover:text-brand-primary group-hover:bg-[var(--brand-primary-soft)]">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 5h16v14H4zM8 9h8M8 13h5" />
                </svg>
              </span>
              <span className="text-xs font-extrabold text-brand-dark group-hover:text-brand-primary transition-colors whitespace-nowrap">
                {category.title}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
