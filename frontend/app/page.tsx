import React from 'react';
import Link from 'next/link';
import { HeroSlider } from '@/components/home/HeroSlider';
import { CategoryStrip } from '@/components/home/CategoryStrip';
import { ProductCard } from '@/components/ui/ProductCard';
import { ThreePillarsBanner } from '@/components/home/ThreePillarsBanner';
import { CuratedStores } from '@/components/home/CuratedStores';
import { products } from '@/data/products';

export default function HomePage() {
  return (
    <main className="pb-16 md:pb-8 font-almarai">
      {/* HERO INTERACTIVE PRODUCT SLIDER */}
      <HeroSlider />

      {/* CLEAN DIVIDER */}
      <div className="max-w-[1240px] mx-auto px-4 my-2" aria-hidden="true">
        <div className="h-px bg-brand-border/60" />
      </div>

      {/* QUICK CATEGORIES */}
      <CategoryStrip />

      {/* CURATED PRODUCTS GRID: MOST POPULAR IN CENTRAL GAZA */}
      <section className="max-w-[1240px] mx-auto px-4 py-4 w-full" aria-labelledby="curated-head">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base md:text-lg font-extrabold text-brand-dark flex items-center gap-2" id="curated-head">
            <span className="w-1 h-4 rounded-full bg-brand-primary" />
            <span>المنتجات الأكثر طلباً</span>
          </h2>
          <Link href="/explore" className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1">
            <span>عرض الكل ({products.length})</span>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 3-PILLAR UNIFIED DELIVERY BANNER */}
      <ThreePillarsBanner />

      {/* CURATED VERIFIED LOCAL STORES */}
      <CuratedStores />
    </main>
  );
}
