'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { HeroSlider } from '@/components/home/HeroSlider';
import { CategoryStrip } from '@/components/home/CategoryStrip';
import { ProductCard } from '@/components/ui/ProductCard';
import { ThreePillarsBanner } from '@/components/home/ThreePillarsBanner';
import { CuratedStores } from '@/components/home/CuratedStores';
import { catalogService, type ApiCategory, type CatalogProduct } from '@/features/catalog/catalog.service';
import { products as fallbackProducts } from '@/data/products';
import type { Product } from '@/types';

export default function HomePage() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    catalogService.getCategories()
      .then((items) => {
        if (active && items.length > 0) setCategories(items);
      })
      .catch(() => {
        // Fallback gracefully to predefined categories
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    catalogService.getProducts({ categoryId: selectedCategoryId || undefined })
      .then((items) => {
        if (active) setProducts(items);
      })
      .catch(() => {
        // Fallback gracefully
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedCategoryId]);

  // If backend returns products use them, otherwise use fallback curated products
  const displayProducts: (CatalogProduct | Product)[] = products.length > 0
    ? products
    : (selectedCategoryId ? [] : fallbackProducts);

  const selectedCategoryTitle = categories.find((c) => c._id === selectedCategoryId)?.title;

  return (
    <main className="pb-16 md:pb-8 font-almarai">
      {/* HERO INTERACTIVE PRODUCT SLIDER */}
      <HeroSlider />

      {/* CLEAN DIVIDER */}
      <div className="max-w-[1240px] mx-auto px-4 my-2" aria-hidden="true">
        <div className="h-px bg-brand-border/60" />
      </div>

      {/* QUICK CATEGORIES WITH REAL BACKEND DATA & SADEEM ICONS */}
      <CategoryStrip
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelect={setSelectedCategoryId}
      />

      {/* CURATED PRODUCTS GRID: MOST POPULAR IN CENTRAL GAZA */}
      <section className="max-w-[1240px] mx-auto px-4 py-4 w-full" aria-labelledby="curated-head">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base md:text-lg font-extrabold text-brand-dark flex items-center gap-2" id="curated-head">
            <span className="w-1 h-4 rounded-full bg-brand-primary" />
            <span>{selectedCategoryTitle ? `منتجات قسم: ${selectedCategoryTitle}` : 'المنتجات الأكثر طلباً'}</span>
          </h2>
          <Link href="/explore" className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1">
            <span>عرض الكل ({displayProducts.length})</span>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>

        {isLoading && products.length === 0 ? (
          <div className="py-12 text-center text-xs text-brand-muted">
            جارٍ تحميل المنتجات...
          </div>
        ) : displayProducts.length === 0 ? (
          <div className="py-12 text-center text-xs text-brand-muted bg-brand-surface rounded-2xl border border-brand-border">
            لا توجد منتجات متوفرة حالياً في هذا القسم.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {displayProducts.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 3-PILLAR UNIFIED DELIVERY BANNER */}
      <ThreePillarsBanner />

      {/* CURATED VERIFIED LOCAL STORES */}
      <CuratedStores />
    </main>
  );
}
