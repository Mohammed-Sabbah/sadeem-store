'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ProductCard } from '@/components/ui/ProductCard';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { catalogService, type CatalogStore, type CatalogProduct } from '@/features/catalog/catalog.service';
import type { Store, Product } from '@/types';
import { stores } from '@/data/stores';
import { products } from '@/data/products';

export default function StoreDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [store, setStore] = useState<CatalogStore | Store | null>(null);
  const [storeProducts, setStoreProducts] = useState<(CatalogProduct | Product)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [storeDrawerOpen, setStoreDrawerOpen] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  // Helper to determine if a product is an anonymous direct Sadeem supply
  const isAnonymous = (p: any) => Boolean(p.isAnonymousVendor);

  // Fetch real store from backend
  useEffect(() => {
    let active = true;
    setIsLoading(true);

    catalogService.getStore(id)
      .then((liveStore) => {
        if (!active) return;
        setStore(liveStore);
      })
      .catch(() => {
        if (!active) return;
        // Graceful fallback to static demo store
        const fallbackStore = stores.find((s) => s.id === id) || stores[0];
        setStore(fallbackStore);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  // Fetch products for this store
  useEffect(() => {
    let active = true;

    catalogService.getProducts({ storeId: id })
      .then((items) => {
        if (!active) return;
        const visibleItems = items.filter((item) => !item.isAnonymousVendor);
        if (visibleItems.length > 0) {
          setStoreProducts(visibleItems);
        } else {
          // Fallback to local products matching vendor
          const currentStore = store || stores.find((s) => s.id === id) || stores[0];
          const localItems = products.filter(
            (p) => (p.vendor.id === currentStore.id || p.vendor.name === currentStore.name || p.vendor.city.includes(currentStore.city)) && !isAnonymous(p)
          );
          setStoreProducts(localItems.length > 0 ? localItems : products.filter((p) => !isAnonymous(p)).slice(0, 4));
        }
      })
      .catch(() => {
        if (!active) return;
        const currentStore = store || stores.find((s) => s.id === id) || stores[0];
        const localItems = products.filter(
          (p) => (p.vendor.id === currentStore.id || p.vendor.name === currentStore.name || p.vendor.city.includes(currentStore.city)) && !isAnonymous(p)
        );
        setStoreProducts(localItems.length > 0 ? localItems : products.filter((p) => !isAnonymous(p)).slice(0, 4));
      });

    return () => {
      active = false;
    };
  }, [id, store]);

  const currentStore = store || stores.find((s) => s.id === id) || stores[0];

  const categories = ['all', ...Array.from(new Set(storeProducts.map((p) => p.category)))];

  const filteredProducts =
    activeCategory === 'all'
      ? storeProducts
      : storeProducts.filter((p) => p.category === activeCategory);

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: currentStore.name, url: window.location.href }).catch(() => {});
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2400);
    }
  };

  if (isLoading && !store) {
    return (
      <main className="max-w-[1240px] mx-auto px-4 py-20 text-center font-almarai">
        <div className="w-10 h-10 border-3 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs font-bold text-brand-muted">جارٍ جلب تفاصيل المتجر المعتمد...</p>
      </main>
    );
  }

  return (
    <>
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
            onClick={() => navigator.share?.({ title: currentStore.name, url: window.location.href })}
            className="text-xs md:text-sm font-bold text-brand-muted hover:text-brand-primary py-1.5 px-3 rounded-lg border border-brand-border bg-brand-surface"
          >
            مشاركة المتجر
          </button>
        </div>

        {/* 2. CANONICAL STORE HERO CARD */}
        <section className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden shadow-xs mb-5" aria-label={`بيانات متجر ${currentStore.name}`}>
          {/* Invariant Media Cover Stage */}
          <div className="relative w-full h-44 sm:h-56 md:h-64 overflow-hidden bg-stone-900">
            <img
              src={currentStore.image || '/canaan_store_fashion_cover.jpg'}
              alt={currentStore.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Overlay Badge: Unified Parcel Guarantee */}
            <div className="absolute bottom-3 start-4 inline-flex items-center gap-2 bg-white/95 backdrop-blur-xs text-brand-dark text-xs font-extrabold px-3 py-1 rounded-full shadow-xs">
              <span className="w-2 h-2 rounded-full bg-brand-primary" />
              <span>طرد سَدِيم الموحد (توصيل 8 ₪)</span>
            </div>
          </div>

          {/* Store Profile Body */}
          <div className="p-4 sm:p-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-16 mb-4">
              {/* Store Avatar Squircle */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-4 border-brand-surface bg-brand-surface shadow-md shrink-0 relative z-10 flex items-center justify-center font-black text-brand-primary text-xl bg-white">
                {Boolean(currentStore.image && currentStore.image.trim()) ? (
                  <img
                    src={currentStore.image.trim()}
                    alt={currentStore.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  currentStore.name.slice(0, 2)
                )}
              </div>

              {/* Action Cluster (Elevated / Adaptive) */}
              <div className="flex flex-wrap items-center gap-2.5">
                <a
                  href={`https://wa.me/970590000000?text=${encodeURIComponent(`مرحباً ${currentStore.name}، استفسار عبر منصة سَدِيم`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366] hover:text-white px-3.5 py-2 rounded-lg text-xs md:text-sm font-extrabold transition-all border border-[#25D366]/30"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                  <span>محادثة واتساب</span>
                </a>

                <button
                  type="button"
                  onClick={() => setStoreDrawerOpen(true)}
                  className="inline-flex items-center gap-2 bg-brand-surface text-brand-dark hover:border-brand-primary px-3.5 py-2 rounded-lg text-xs md:text-sm font-extrabold transition-all border border-brand-border cursor-pointer"
                >
                  <svg className="w-4 h-4 text-brand-trust" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                  <span>ميثاق المتجر والتفاصيل</span>
                  <span className="text-sm">‹</span>
                </button>
              </div>
            </div>

            {/* Store Information Block */}
            <div className="mb-5">
              <h1 className="text-xl md:text-2xl font-extrabold text-brand-dark flex flex-wrap items-center gap-2.5 mb-1.5">
                <span>{currentStore.name}</span>
                {currentStore.verified && (
                  <span className="inline-flex items-center gap-1 bg-[var(--brand-trust-soft)] text-brand-trust text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-[var(--brand-trust-border)]">
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>معتمد في سَدِيم</span>
                  </span>
                )}
              </h1>

              <div className="flex items-center gap-1.5 text-xs text-brand-muted mb-3 font-medium">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>المحافظة الوسطى · {currentStore.city} {currentStore.address ? `— ${currentStore.address}` : ''}</span>
              </div>

              <p className="text-xs md:text-sm text-brand-muted leading-relaxed max-w-3xl">
                {currentStore.description || 'متجر معتمد وموثق في المحافظة الوسطى، يقدم منتجات عالية الجودة ضمن منظومة الشحن الموحد لسَدِيم.'}
              </p>
            </div>

            {/* Desktop Operational Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-brand-border/60">
              {/* Metric 1: Rating */}
              <div className="p-3 rounded-xl bg-brand-card flex items-center gap-3 border border-brand-border/40">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-[var(--brand-glow,#B08D57)]/15 text-[var(--brand-glow,#B08D57)]">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs md:text-sm font-extrabold text-brand-dark">{currentStore.rating || '4.9'} من 5.0</div>
                  <div className="text-[11px] text-brand-muted mt-0.5">{currentStore.ordersCount || 48} طلباً موثقاً</div>
                </div>
              </div>

              {/* Metric 2: Unified Parcel */}
              <div className="p-3 rounded-xl bg-brand-card flex items-center gap-3 border border-brand-border/40">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-[var(--brand-primary-soft)] text-brand-primary">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs md:text-sm font-extrabold text-brand-dark">طرد موحد 8 ₪</div>
                  <div className="text-[11px] text-brand-muted mt-0.5">شحنة واحدة لكل مشترياتك</div>
                </div>
              </div>

              {/* Metric 3: Door Inspection */}
              <div className="p-3 rounded-xl bg-brand-card flex items-center gap-3 border border-brand-border/40">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-[var(--brand-trust-soft)] text-brand-trust">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs md:text-sm font-extrabold text-brand-dark">المعاينة عند الباب</div>
                  <div className="text-[11px] text-brand-muted mt-0.5">افحص طلبك قبل الدفع</div>
                </div>
              </div>

              {/* Metric 4: Prep Time */}
              <div className="p-3 rounded-xl bg-brand-card flex items-center gap-3 border border-brand-border/40">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-[var(--brand-primary-soft)] text-brand-primary">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs md:text-sm font-extrabold text-brand-dark">تجهيز سريع</div>
                  <div className="text-[11px] text-brand-muted mt-0.5">جاهز للمندوب خلال ساعتين</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. SERENE UNIFIED PARCEL STRIP */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-3.5 mb-5 flex flex-col sm:flex-row sm:items-center gap-3 shadow-xs" aria-label="الشحن الموحد">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--brand-trust-soft)] text-brand-trust text-xs font-bold shrink-0 border border-[var(--brand-trust-border)]">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>طرد موحد 8 ₪</span>
          </span>
          <span className="text-xs md:text-sm text-brand-muted">
            تُضم طلباتك من {currentStore.name} تلقائياً مع باقي مشترياتك من متاجر الوسطى في شحنة واحدة بتوصيل ثابت.
          </span>
        </div>

        {/* 4. PRODUCTS CATALOG HEADER & HORIZONTAL CATEGORY BAR */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base md:text-lg font-extrabold text-brand-dark flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-brand-primary" />
                <span>معروضات المتجر</span>
              </h2>
              <span className="bg-[var(--brand-primary-soft)] text-brand-primary text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-[var(--brand-primary-border)]">
                {filteredProducts.length} منتجات
              </span>
            </div>
          </div>

          {/* Clean Horizontal Filter Bar */}
          {categories.length > 2 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-brand-dark text-white shadow-xs'
                      : 'bg-brand-surface text-brand-dark border border-brand-border hover:border-brand-dark/40'
                  }`}
                >
                  {cat === 'all' ? 'جميع المنتجات' : cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 5. PRODUCTS GRID */}
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-xs text-brand-muted bg-brand-surface rounded-2xl border border-brand-border">
            لا توجد منتجات مسجلة لهذا المتجر حالياً.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* 6. BOTTOM EXPLORE PROMPT */}
        <div className="mt-10 p-6 md:p-8 bg-brand-surface border border-brand-border rounded-2xl text-center shadow-xs">
          <h3 className="text-base md:text-lg font-extrabold text-brand-dark mb-2">
            هل تود استكشاف المزيد من تجار ومتاجر المحافظة الوسطى؟
          </h3>
          <p className="text-xs md:text-sm text-brand-muted mb-5 max-w-lg mx-auto leading-relaxed">
            اطلب من مختلف المتاجر المعتمدة في دير البلح والنصيرات والمغازي والبريج والزوايدة معاً، وتصلك جميعها في طرد سَدِيم الموحد بأجر توصيل ثابت (8 ₪).
          </p>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 bg-brand-primary text-white hover:brightness-110 px-5 py-2.5 rounded-lg text-xs md:text-sm font-extrabold shadow-sm transition-all"
          >
            <span>تصفح دليل كافة المتاجر المعتمدة</span>
            <span className="text-base">←</span>
          </Link>
        </div>
      </main>

      {/* ADAPTIVE STORE CHARTER & POLICIES */}
      <BottomSheet
        isOpen={storeDrawerOpen}
        onClose={() => setStoreDrawerOpen(false)}
        title={`ميثاق متجر ${currentStore.name}`}
      >
        <div className="flex flex-col gap-5">
          {/* Store Identification Card */}
          <div className="flex items-center gap-3.5 p-3 bg-brand-card border border-brand-border/60 rounded-xl">
            <div className="w-13 h-13 rounded-xl overflow-hidden shrink-0 border border-brand-border flex items-center justify-center font-bold bg-white text-brand-primary">
              {Boolean(currentStore.image && currentStore.image.trim()) ? (
                <img src={currentStore.image.trim()} alt={currentStore.name} className="w-full h-full object-cover" />
              ) : (
                currentStore.name.slice(0, 2)
              )}
            </div>
            <div>
              <div className="text-sm md:text-base font-extrabold text-brand-dark">{currentStore.name}</div>
              <div className="text-xs text-brand-muted mt-0.5">
                المحافظة الوسطى · {currentStore.city} {currentStore.address ? `— ${currentStore.address}` : ''}
              </div>
            </div>
          </div>

          {/* Editorial Bio */}
          <div>
            <span className="text-xs font-extrabold text-brand-muted block mb-1.5">
              نبذة عن المتجر والحرفة:
            </span>
            <p className="text-xs md:text-sm text-brand-dark leading-relaxed">
              {currentStore.description || 'متجر معتمد وموثق في سَدِيم للمحافظة الوسطى.'}
            </p>
          </div>

          {/* 4 Pillars Operational Reassurance in Central Gaza */}
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-extrabold text-brand-muted">
              التزامات المتجر ضمن ميثاق سَدِيم:
            </span>

            <div className="flex items-start gap-2.5 p-2.5 bg-brand-surface border border-brand-border/60 rounded-xl">
              <div className="w-7 h-7 rounded-full bg-[var(--brand-primary-soft)] text-brand-primary flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-extrabold text-brand-dark">طرد سَدِيم الموحد (8 ₪ ثابت)</div>
                <div className="text-[11px] text-brand-muted mt-0.5">
                  مشترياتك من هذا المتجر تُجمع مع باقي طلبياتك من الوسطى في شحنة واحدة وأجر توصيل 8 ₪ فقط.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 bg-brand-surface border border-brand-border/60 rounded-xl">
              <div className="w-7 h-7 rounded-full bg-[var(--brand-trust-soft)] text-brand-trust flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-extrabold text-brand-dark">المعاينة والفحص عند الباب</div>
                <div className="text-[11px] text-brand-muted mt-0.5">
                  حق فحص ومطابقة المنتج عند باب بيتك قبل دفع أي شيكل نقداً أو عبر جوال باي.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 bg-brand-surface border border-brand-border/60 rounded-xl">
              <div className="w-7 h-7 rounded-full bg-brand-card text-brand-primary flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-extrabold text-brand-dark">تجهيز سريع خلال ساعتين</div>
                <div className="text-[11px] text-brand-muted mt-0.5">
                  يتم تغليف وتسليم طلبيتك لمستودع سَدِيم المركزي فوراً لضمان وصولها في اليوم نفسه.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 bg-brand-surface border border-brand-border/60 rounded-xl">
              <div className="w-7 h-7 rounded-full bg-[var(--brand-trust-soft)] text-brand-trust flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-extrabold text-brand-dark">استبدال فوري أو استرداد للمحفظة</div>
                <div className="text-[11px] text-brand-muted mt-0.5">
                  إمكانية استبدال المقاس أو المنتج مجاناً خلال 3 أيام مع استرداد فوري إلى محفظتك.
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2">
            <a
              href={`https://wa.me/970590000000?text=${encodeURIComponent(`مرحباً ${currentStore.name}، استفسار عبر منصة سَدِيم بخصوص المنتجات والتجهيز`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-brand-dark text-white hover:bg-black p-3 rounded-lg text-xs md:text-sm font-bold transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span>محادثة إدارة المتجر عبر واتساب</span>
            </a>
          </div>
        </div>
      </BottomSheet>

      {/* Sadeem Toast Component */}
      <div
        className={`fixed bottom-20 md:bottom-6 start-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white text-xs md:text-sm font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all duration-300 pointer-events-none ${
          copiedToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}
      >
        تم نسخ رابط المتجر إلى الحافظة بنجاح
      </div>
    </>
  );
}
