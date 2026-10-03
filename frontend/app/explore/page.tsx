'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { stores } from '@/data/stores';
import { products } from '@/data/products';
import { ProductCard } from '@/components/ui/ProductCard';

const CATEGORIES: Array<{
  id: string;
  name: string;
  icon: React.ReactNode;
  count: string;
  filterKey: string;
  highlight?: boolean;
}> = [
  {
    id: 'energy',
    name: 'طاقة وبطاريات وبدائل',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    count: '28 منتج',
    filterKey: 'طاقة وبدائل',
  },
  {
    id: 'pantry',
    name: 'مؤونة وزيت زيتون بلدي',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    ),
    count: '35 منتج',
    filterKey: 'مؤونة وزيت زيتون',
    highlight: true,
  },
  {
    id: 'networks',
    name: 'راوترات ومعدات شبكات',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 12.55a11 11 0 0 1 14.08 0" />
        <path d="M1.42 9a16 16 0 0 1 21.16 0" />
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
        <line x1="12" y1="20" x2="12.01" y2="20" />
      </svg>
    ),
    count: '19 منتج',
    filterKey: 'شبكات واتصالات',
  },
  {
    id: 'home',
    name: 'أدوات وتجهيز منزل',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    count: '42 منتج',
    filterKey: 'منزل',
  },
  {
    id: 'crafts',
    name: 'خزفيات وفخار وحرف',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    count: '16 صانع',
    filterKey: 'فخار',
  },
  {
    id: 'apparel',
    name: 'أزياء وكنزات صوفية',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
      </svg>
    ),
    count: '24 متجر',
    filterKey: 'ملابس وأزياء',
  },
  {
    id: 'care',
    name: 'عناية شخصية ونظافة',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    count: '18 منتج',
    filterKey: 'عناية',
  },
];

const CITIES = [
  'الكل',
  'دير البلح',
  'مخيم النصيرات',
  'الزوايدة',
  'مخيم المغازي',
  'مخيم البريج',
];

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState<'stores' | 'categories'>('stores');
  const [selectedCity, setSelectedCity] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter stores by city & search
  const filteredStores = stores.filter((store) => {
    const matchesCity = selectedCity === 'الكل' || store.city.includes(selectedCity);
    const matchesSearch =
      !searchQuery.trim() ||
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCity && matchesSearch;
  });

  // Filter products by selected category or city
  const filteredProducts = products.filter((p) => {
    if (selectedCategory) {
      return p.category.includes(selectedCategory);
    }
    if (selectedCity !== 'الكل') {
      return p.vendor.city.includes(selectedCity);
    }
    return true;
  });

  return (
    <main className="max-w-[1240px] mx-auto px-4 pt-4 pb-24 md:pb-16 font-almarai">
      {/* 1. UNIFIED PAGE HEADER STRIP */}
      <div className="flex items-center justify-between gap-4 pb-4 mb-4 border-b border-brand-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-extrabold text-brand-dark">دليل سوق سَدِيم</h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--brand-primary-soft)] text-brand-primary border border-[var(--brand-primary-border)]">
              المحافظة الوسطى
            </span>
          </div>
          <span className="text-xs md:text-sm text-brand-muted mt-1 block">
            استكشف المتاجر المعتمدة والأقسام في دير البلح، النصيرات، الزوايدة، المغازي، والبريج
          </span>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs md:text-sm font-bold text-brand-muted hover:text-brand-primary transition-colors py-1.5 px-3 rounded-lg border border-brand-border bg-brand-surface shrink-0"
        >
          <span>←</span>
          <span>الرئيسية</span>
        </Link>
      </div>

      {/* 2. UNIFIED PARCEL TRUST BANNER */}
      <section
        className="bg-brand-surface border border-brand-border rounded-xl p-3.5 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
        aria-label="الشحن الموحد"
      >
        <div className="flex items-start sm:items-center gap-2.5 text-xs md:text-sm text-brand-muted">
          <span className="w-2 h-2 rounded-full bg-brand-trust shrink-0 mt-1 sm:mt-0" />
          <div>
            <strong className="font-extrabold text-brand-dark ms-1">طرد موحد لكافة المتاجر:</strong>
            <span>
              تجمع مشترياتك من مختلف المتاجر والتصنيفات في طرد واحد ومندوب واحد بأجر توصيل 8 ₪ ثابت مع حق الفحص عند الباب.
            </span>
          </div>
        </div>
        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--brand-trust-soft)] text-brand-trust text-xs font-bold shrink-0 self-start sm:self-auto border border-[var(--brand-trust-border)]">
          <span>توصيل 8 ₪ موحد</span>
        </div>
      </section>

      {/* 3. SEGMENTED TAB SELECTOR (STORES VS CATEGORIES) */}
      <div className="flex items-center justify-center mb-5">
        <div className="inline-flex p-1 bg-brand-surface border border-brand-border rounded-xl shadow-xs gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('stores')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs md:text-sm font-extrabold transition-all cursor-pointer ${
              activeTab === 'stores'
                ? 'bg-brand-dark text-white shadow-xs'
                : 'text-brand-muted hover:text-brand-dark hover:bg-black/5'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>المتاجر المعتمدة</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === 'stores' ? 'bg-white/20 text-white' : 'bg-[var(--brand-bg)] text-brand-muted'
              }`}
            >
              {stores.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs md:text-sm font-extrabold transition-all cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-brand-dark text-white shadow-xs'
                : 'text-brand-muted hover:text-brand-dark hover:bg-black/5'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>الأقسام والتصنيفات</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === 'categories' ? 'bg-white/20 text-white' : 'bg-[var(--brand-bg)] text-brand-muted'
              }`}
            >
              {CATEGORIES.length}
            </span>
          </button>
        </div>
      </div>

      {/* 4. CITY FILTER RAIL (CENTRAL GOVERNORATE HONESTY) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-5 scrollbar-none">
        <span className="text-xs font-extrabold text-brand-muted shrink-0">المنطقة:</span>
        {CITIES.map((city) => {
          const isSelected = selectedCity === city;
          return (
            <button
              key={city}
              type="button"
              onClick={() => setSelectedCity(city)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-brand-primary text-white border border-brand-primary shadow-xs'
                  : 'bg-brand-surface text-brand-dark border border-brand-border hover:border-brand-primary/50'
              }`}
            >
              {city}
            </button>
          );
        })}
      </div>

      {/* TAB A: STORES DIRECTORY */}
      {activeTab === 'stores' && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base md:text-lg font-extrabold text-brand-dark flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-brand-primary" />
              <span>
                {selectedCity === 'الكل'
                  ? 'كافة المتاجر المعتمدة في الوسطى'
                  : `متاجر ${selectedCity}`}
              </span>
            </h2>
            <span className="text-xs text-brand-muted">{filteredStores.length} متجر معتمد</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredStores.map((store) => (
              <article
                key={store.id}
                className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
              >
                {/* Store Cover Image */}
                <Link
                  href={`/store/${store.id}`}
                  className="relative w-full h-44 overflow-hidden bg-stone-900 block"
                >
                  <img
                    src={store.image}
                    alt={store.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                  {/* Delivery Badge on Cover */}
                  <span className="absolute bottom-2.5 start-3 bg-white/95 backdrop-blur-xs text-brand-dark text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-xs">
                    طرد موحد 8 ₪
                  </span>
                </Link>

                {/* Store Details Body */}
                <div className="p-4 flex-1 flex flex-col">
                  {/* City & Verification Row */}
                  <div className="flex items-center gap-1.5 text-xs text-brand-trust font-bold mb-1.5">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>معتمد</span>
                    <span className="opacity-40 text-brand-muted">•</span>
                    <span className="text-brand-muted font-medium">{store.city}</span>
                  </div>

                  {/* Store Title */}
                  <h3 className="text-base font-extrabold text-brand-dark mb-1.5">
                    <Link
                      href={`/store/${store.id}`}
                      className="hover:text-brand-primary transition-colors"
                    >
                      {store.name}
                    </Link>
                  </h3>

                  {/* Store Bio */}
                  <p className="text-xs text-brand-muted leading-relaxed mb-4 flex-1 line-clamp-2">
                    {store.description}
                  </p>

                  {/* Footer Meta & Action */}
                  <div className="flex items-center justify-between pt-3 border-t border-brand-border/60">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-[var(--brand-glow,#B08D57)] fill-current" viewBox="0 0 24 24">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      <span className="text-xs font-extrabold text-brand-dark">{store.rating}</span>
                      <span className="text-[11px] text-brand-muted">({store.ordersCount} طلب)</span>
                    </div>

                    <Link
                      href={`/store/${store.id}`}
                      className="inline-flex items-center gap-1.5 bg-[var(--brand-primary-soft)] text-brand-primary hover:bg-brand-primary hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    >
                      <span>زيارة المتجر</span>
                      <span>←</span>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* TAB B: CATEGORIES DIRECTORY & PRODUCTS */}
      {activeTab === 'categories' && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base md:text-lg font-extrabold text-brand-dark flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-brand-primary" />
              <span>أقسام المتجر المعتمدة</span>
            </h2>
            {selectedCategory && (
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="text-xs font-bold text-brand-primary hover:underline cursor-pointer"
              >
                ✕ إلغاء الفلتر
              </button>
            )}
          </div>

          {/* Categories Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 mb-8">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.filterKey;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(isSelected ? null : cat.filterKey)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-right transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--brand-primary-soft)] border-brand-primary ring-1 ring-brand-primary'
                      : 'bg-brand-surface border-brand-border hover:border-brand-primary/40 shadow-xs'
                  }`}
                >
                  <span
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      cat.highlight ? 'bg-[var(--brand-trust-soft)] text-brand-trust' : 'bg-[var(--brand-bg)] text-brand-dark'
                    }`}
                  >
                    {cat.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs md:text-sm font-extrabold text-brand-dark truncate">{cat.name}</div>
                    <div className="text-[11px] text-brand-muted mt-0.5">{cat.count}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Filtered Products Sub-section */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-extrabold text-brand-dark flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-brand-primary" />
              <span>
                {selectedCategory
                  ? `منتجات قسم: ${selectedCategory}`
                  : 'أبرز منتجات الأقسام المختارة'}
              </span>
            </h3>
            <span className="text-xs text-brand-muted">{filteredProducts.length} منتج متوفر</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {filteredProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
