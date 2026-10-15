'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ProductCard } from '@/components/ui/ProductCard';
import { catalogService, type CatalogProduct, type CatalogStore } from '@/features/catalog/catalog.service';

export default function StoreDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const [store, setStore] = useState<CatalogStore | null>(null);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setIsLoading(true);
    Promise.all([catalogService.getStore(id), catalogService.getProducts({ storeId: id })])
      .then(([storeResult, productResults]) => {
        if (!active) return;
        setStore(storeResult);
        setProducts(productResults);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setStore(null);
        setProducts([]);
        setErrorMessage(error instanceof Error ? error.message : 'تعذر تحميل بيانات المتجر');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category).filter(Boolean))),
    [products]
  );
  const visibleProducts = activeCategory === 'all'
    ? products
    : products.filter((product) => product.category === activeCategory);

  if (isLoading) {
    return <main className="max-w-[1240px] mx-auto px-4 py-16 text-center font-almarai">جارٍ تحميل المتجر...</main>;
  }
  if (!store) {
    return (
      <main className="max-w-[1240px] mx-auto px-4 py-16 text-center font-almarai">
        <p role="alert" className="text-brand-muted">{errorMessage || 'المتجر غير متاح'}</p>
        <Link href="/" className="inline-block mt-4 text-brand-primary font-bold">العودة للرئيسية</Link>
      </main>
    );
  }

  return (
    <main className="max-w-[1240px] mx-auto px-4 pt-4 pb-24 md:pb-16 font-almarai">
      <div className="flex items-center justify-between gap-4 pb-4 mb-4 border-b border-brand-border">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs md:text-sm font-bold text-brand-muted hover:text-brand-primary py-1.5 px-3 rounded-lg border border-brand-border bg-brand-surface"
        >
          <span>←</span><span>الرئيسية</span>
        </Link>
        <button
          type="button"
          onClick={() => navigator.share?.({ title: store.name, url: window.location.href })}
          className="text-xs md:text-sm font-bold text-brand-muted hover:text-brand-primary py-1.5 px-3 rounded-lg border border-brand-border bg-brand-surface"
        >
          مشاركة المتجر
        </button>
      </div>

      <section className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden shadow-xs mb-5">
        <div className="relative w-full h-44 sm:h-56 md:h-64 overflow-hidden bg-brand-card">
          {store.image && <img src={store.image} alt={store.name} className="w-full h-full object-cover" />}
        </div>
        <div className="p-4 sm:p-6">
          <div className="flex items-start gap-4 mb-4">
            {store.image && (
              <img src={store.image} alt="" className="w-16 h-16 rounded-xl object-cover border border-brand-border bg-white" />
            )}
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-brand-dark">{store.name}</h1>
              {(store.city || store.address) && (
                <p className="text-xs text-brand-muted mt-2">
                  {[store.city, store.address].filter(Boolean).join(' · ')}
                </p>
              )}
              {store.description && (
                <p className="text-xs md:text-sm text-brand-muted leading-relaxed mt-3">{store.description}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="store-products-title">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 id="store-products-title" className="text-base md:text-lg font-extrabold text-brand-dark">
            منتجات المتجر ({visibleProducts.length})
          </h2>
          <select
            aria-label="تصفية المنتجات حسب التصنيف"
            value={activeCategory}
            onChange={(event) => setActiveCategory(event.target.value)}
            className="max-w-[50%] px-3 py-2 rounded-lg border border-brand-border bg-brand-surface text-xs font-bold"
          >
            <option value="all">كافة التصنيفات</option>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </div>

        {errorMessage && <p role="alert" className="text-xs text-red-700 mb-3">{errorMessage}</p>}
        {visibleProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} showWishlist={false} />
            ))}
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-brand-muted border border-dashed border-brand-border rounded-xl">
            لا توجد منتجات متاحة لهذا المتجر حالياً.
          </p>
        )}
      </section>
    </main>
  );
}
