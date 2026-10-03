'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { Product } from '@/types';
import { products } from '@/data/products';
import { ProductCard } from '@/components/ui/ProductCard';

const INITIAL_WISHLIST: Product[] = [
  products.find((p) => p.id === 'canaan-wool-hoodie') || products[4],
  products.find((p) => p.id === 'power-station-1200w') || products[2],
  products.find((p) => p.id === 'olive-oil-amphora') || products[1],
  products.find((p) => p.id === 'router-4g-cat6') || products[0],
];

export default function WishlistPage() {
  const { addToCart } = useCart();
  const [items, setItems] = useState<Product[]>(INITIAL_WISHLIST);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2600);
  };

  const handleRemove = (productId: string) => {
    const item = items.find((p) => p.id === productId);
    setItems((prev) => prev.filter((p) => p.id !== productId));
    showToast(`تمت إزالة "${item ? item.title.substring(0, 22) : ''}..." من المفضلة`);
  };

  const handleAddAllToCart = () => {
    if (items.length === 0) return;
    items.forEach((item) => {
      addToCart(item, 1);
    });
    showToast(`✓ تم نقل جميع المنتجات (${items.length}) إلى سلتك الموحدة بنجاح`);
  };

  return (
    <>
      <main className="max-w-[1240px] mx-auto px-4 py-4 sm:py-6 pb-24 text-right font-almarai">
        {/* 1. Page Header Strip */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-brand-border gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-brand-dark tracking-tight m-0">قائمة المفضلة</h1>
              <span className="inline-flex items-center justify-center text-[11px] sm:text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-brand-surface border border-brand-border text-brand-primary whitespace-nowrap flex-shrink-0">
                {items.length} {items.length === 1 ? 'مقتنى' : 'مقتنيات'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-brand-muted font-medium m-0 leading-snug">
              المقتنيات المحفوظة لتسوقها لاحقاً بطرد سَدِيم الموحد (8 ₪) وفحص عند الباب
            </p>
          </div>

          <Link
            href="/"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-surface border border-brand-border text-xs font-bold text-brand-dark hover:text-brand-primary hover:border-brand-primary transition-colors no-underline flex-shrink-0"
          >
            <span>←</span>
            <span>الرئيسية</span>
          </Link>
        </div>

        {items.length > 0 ? (
          <div>
            {/* 2. Integrated Reassurance & Transfer Action Strip */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-3 sm:px-4 rounded-xl bg-white border border-brand-border-subtle gap-3 mb-5 shadow-xs">
              <div className="flex items-center gap-2 min-w-0 justify-center sm:justify-start">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-trust-soft text-brand-trust border border-brand-trust/20 text-xs font-bold whitespace-nowrap flex-shrink-0">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  <span>طرد موحد 8 ₪</span>
                </span>
                <span className="text-xs text-brand-muted font-medium">
                  تُجمع المقتنيات في شحنة واحدة بتوصيل 8 ₪ ثابت مع حق المعاينة عند الباب قبل الدفع.
                </span>
              </div>

              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-98 whitespace-nowrap cursor-pointer border-0"
                onClick={handleAddAllToCart}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                <span>نقل الكل إلى السلة الموحدة ({items.length})</span>
              </button>
            </div>

            {/* 3. Products Grid: Canonical 2 cols mobile, 4 cols desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
              {items.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isWishlistPage={true}
                  onRemoveFromWishlist={handleRemove}
                />
              ))}
            </div>
          </div>
        ) : (
          /* 4. Serene Empty Wishlist State */
          <section
            className="py-16 px-6 text-center bg-white border border-brand-border rounded-2xl max-w-lg mx-auto my-8 shadow-xs"
            aria-label="قائمة المفضلة فارغة"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-surface flex items-center justify-center text-brand-primary">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </div>

            <h2 className="text-base sm:text-lg font-extrabold text-brand-dark mb-2 m-0">
              قائمتك في انتظار مقتنياتك المفضلة
            </h2>

            <p className="text-xs sm:text-sm text-brand-muted max-w-md mx-auto mb-6 leading-relaxed">
              احفظ المنتجات التي تثير إعجابك أثناء تصفحك لتسوقها لاحقاً. نجمع كل طلباتك من متاجر الوسطى في طرد واحد عند باب بيتك مع حق الفحص قبل الدفع.
            </p>

            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-xs sm:text-sm font-bold shadow-sm transition-colors no-underline"
              >
                <span>تصفح الأكثر طلباً</span>
                <span className="text-sm">←</span>
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-brand-surface hover:bg-brand-border/40 border border-brand-border text-brand-dark text-xs sm:text-sm font-bold transition-colors no-underline"
              >
                <span>دليل المتاجر المعتمدة</span>
              </Link>
            </div>
          </section>
        )}
      </main>

      {/* Floating In-app Toast */}
      {toastVisible && (
        <div className="fixed bottom-20 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-brand-dark text-white px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span>{toastMsg}</span>
        </div>
      )}
    </>
  );
}
