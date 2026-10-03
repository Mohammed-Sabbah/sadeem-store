'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { BottomSheet } from '@/components/ui/BottomSheet';

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, totalItems, subtotal, deliveryFee, grandTotal } = useCart();
  const { isAuthenticated } = useAuth();
  const checkoutHref = isAuthenticated ? '/checkout' : '/auth/login?redirect=/checkout';
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [toastText, setToastText] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [isDockedHidden, setIsDockedHidden] = useState(false);

  const summaryBtnRef = useRef<HTMLAnchorElement | null>(null);

  // Sticky bar auto-hide when summary button is in view
  useEffect(() => {
    if (!summaryBtnRef.current) return;
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsDockedHidden(entry.isIntersecting);
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(summaryBtnRef.current);
    return () => observer.disconnect();
  }, [items.length]);

  const showToast = (msg: string) => {
    setToastText(msg);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 2600);
  };

  const applyCoupon = (codeOverride?: string) => {
    const code = (codeOverride || couponCode).trim().toUpperCase();
    if (!code) {
      showToast('يرجى إدخال رمز الخصم أولاً');
      return;
    }
    if (code === 'SADEEM10' || code === 'SADEEM' || code === 'GAZA' || code === 'CANAAN10') {
      setDiscount(15);
      setCouponCode(code);
      showToast('تم تفعيل قسيمة سَدِيم وتطبيق خصم 15 ₪');
      setTimeout(() => setCouponOpen(false), 350);
    } else {
      showToast('عذراً، رمز الخصم غير صالح أو منتهي الصلاحية');
    }
  };

  const removeCoupon = () => {
    setDiscount(0);
    setCouponCode('');
    showToast('تمت إزالة قسيمة الخصم');
  };

  const handleWishlist = (title: string) => {
    showToast(`تم حفظ "${title}" في قائمة المفضلة بنجاح`);
  };

  const handleRemove = (id: string, title: string) => {
    removeFromCart(id);
    showToast(`تمت إزالة "${title}" من السلة`);
  };

  const finalTotal = Math.max(0, grandTotal - discount);

  return (
    <>
      <main className="max-w-[1240px] mx-auto px-4 py-4 sm:py-6 pb-32 text-right font-almarai">
        {/* Zone 1: Checkout Stepper */}
        {items.length > 0 && (
          <nav className="flex items-center justify-center gap-3 sm:gap-4 mb-5 select-none" aria-label="مراحل إتمام الطلب">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-brand-primary">
              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-brand-primary text-white flex items-center justify-center text-[11px] sm:text-xs font-bold">1</span>
              <span>سلة المشتريات</span>
            </div>
            <div className="w-8 sm:w-12 h-[1.5px] bg-brand-border"></div>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-brand-muted">
              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-brand-surface border border-brand-border text-brand-muted flex items-center justify-center text-[11px] sm:text-xs font-bold">2</span>
              <span>الشحن والدفع</span>
            </div>
          </nav>
        )}

        {/* Zone 2: Serene Unified Parcel Banner */}
        {items.length > 0 && (
          <div className="p-3 sm:px-4 rounded-xl bg-white border border-brand-border-subtle flex items-center gap-2.5 mb-5 shadow-xs" aria-label="ميثاق طرد سَدِيم الموحد">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-trust-soft text-brand-trust border border-brand-trust/20 text-xs font-bold whitespace-nowrap flex-shrink-0">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <span>طرد موحد 8 ₪</span>
            </span>
            <span className="text-xs text-brand-muted font-medium leading-relaxed">
              تُجمع طلبياتك من مختلف متاجر الوسطى في شحنة واحدة، مع حق المعاينة والفحص عند الباب قبل الدفع.
            </span>
          </div>
        )}

        {/* Zone 3: Main Cart Layout */}
        {items.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Right / Top Column: Unified Items List (8 cols) */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-brand-border">
                <h1 className="text-base sm:text-lg font-extrabold text-brand-dark m-0">المنتجات في السلة</h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-surface border border-brand-border text-brand-muted">
                  {totalItems} {totalItems === 1 ? 'منتج موثق' : 'منتجات موثقة'}
                </span>
              </div>

              {/* Items Linear Container */}
              <div className="space-y-3">
                {items.map(({ product, quantity, selectedColor, selectedSize }, idx) => (
                  <article
                    key={product.id}
                    className="p-3.5 sm:p-4 rounded-xl bg-white border border-brand-border-subtle flex gap-3 sm:gap-4 items-start shadow-xs transition-colors hover:border-brand-primary/20"
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-lg bg-brand-surface border border-brand-border/60 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Details Box */}
                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-[11px] text-brand-muted font-medium truncate">
                          <span className="text-brand-primary">●</span>
                          <span className="font-bold text-brand-dark">{product.vendor.name}</span>
                          <span>({product.vendor.city} · موثق)</span>
                        </div>
                        <div className="text-left flex-shrink-0">
                          <div className="text-sm sm:text-base font-extrabold text-brand-primary">
                            {product.price * quantity} <span className="text-xs font-bold">₪</span>
                          </div>
                          {quantity > 1 && (
                            <span className="text-[10px] text-brand-subtle block">({product.price} ₪ للقطعة)</span>
                          )}
                        </div>
                      </div>

                      <h2 className="text-xs sm:text-sm font-bold text-brand-dark line-clamp-1 hover:text-brand-primary transition-colors m-0">
                        <Link href={`/product/${product.id}`} className="no-underline text-inherit">
                          {product.title}
                        </Link>
                      </h2>

                      <div className="text-[11px] text-brand-muted flex items-center gap-1.5">
                        <span>المقاس: <strong className="text-brand-dark">{selectedSize || 'L'}</strong></span>
                        <span>·</span>
                        <span>اللون: <strong className="text-brand-dark">{selectedColor || 'أخضر زيتي'}</strong></span>
                      </div>

                      {/* Action Controls: Stepper on Right, Links on Left */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-brand-border-subtle/50">
                        <div className="flex items-center border border-brand-border rounded-lg bg-brand-surface overflow-hidden h-7 sm:h-8">
                          <button
                            type="button"
                            className="w-7 sm:w-8 h-full flex items-center justify-center text-sm font-bold text-brand-dark hover:bg-brand-border/40 transition active:scale-95 disabled:opacity-30 cursor-pointer border-0 bg-transparent"
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                            disabled={quantity <= 1}
                            title="إنقاص الكمية"
                          >
                            −
                          </button>
                          <span className="w-7 sm:w-8 text-center text-xs font-extrabold text-brand-dark select-none">{quantity}</span>
                          <button
                            type="button"
                            className="w-7 sm:w-8 h-full flex items-center justify-center text-sm font-bold text-brand-dark hover:bg-brand-border/40 transition active:scale-95 cursor-pointer border-0 bg-transparent"
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            title="زيادة الكمية"
                          >
                            +
                          </button>
                        </div>

                        <div className="flex items-center gap-3 text-xs font-medium">
                          <button
                            type="button"
                            className="text-brand-muted hover:text-brand-primary flex items-center gap-1 cursor-pointer transition-colors border-0 bg-transparent p-0"
                            onClick={() => handleWishlist(product.title)}
                            title="حفظ في المفضلة"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            <span>حفظ</span>
                          </button>

                          <button
                            type="button"
                            className="text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer transition-colors border-0 bg-transparent p-0"
                            onClick={() => handleRemove(product.id, product.title)}
                            title="إزالة من السلة"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                            <span>إزالة</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* Left Column: Financial Order Summary & Checkout (4 cols) */}
            <aside className="lg:col-span-5 xl:col-span-4 sticky top-20" aria-label="ملخص الحساب المالي">
              <div className="p-5 rounded-2xl bg-white border border-brand-border shadow-xs flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-brand-border">
                  <h2 className="text-base font-extrabold text-brand-dark m-0">ملخص الحساب</h2>
                  <span className="text-xs font-bold text-brand-muted">
                    {totalItems} {totalItems === 1 ? 'منتج' : 'منتجات'}
                  </span>
                </div>

                {/* Detailed Cost Stack */}
                <div className="space-y-2.5 text-xs sm:text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-brand-muted">مجموع المشتريات:</span>
                    <span className="font-bold text-brand-dark">{subtotal} ₪</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-brand-muted block">توصيل طرد سَدِيم الموحد:</span>
                      <span className="text-[11px] text-brand-subtle">شحنة واحدة للمحافظة الوسطى</span>
                    </div>
                    <span className="font-bold text-brand-dark">{deliveryFee} ₪</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex items-center justify-between text-brand-primary">
                      <span>خصم قسيمة سَدِيم:</span>
                      <span className="font-extrabold">-{discount} ₪</span>
                    </div>
                  )}
                </div>

                {/* Coupon Trigger Button */}
                <div>
                  <button
                    type="button"
                    onClick={() => setCouponOpen(true)}
                    className={`w-full p-2.5 rounded-lg border border-dashed text-xs sm:text-sm font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      discount > 0
                        ? 'bg-brand-primary-soft border-brand-primary text-brand-primary'
                        : 'bg-brand-surface border-brand-border text-brand-dark hover:border-brand-primary'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                        <line x1="7" y1="7" x2="7.01" y2="7"></line>
                      </svg>
                      {discount > 0 ? `قسيمة سَدِيم مفعّلة (وفرت ${discount} ₪)` : 'هل لديك قسيمة خصم أو كود هدية؟'}
                    </span>
                    <span className="text-xs">
                      {discount > 0 ? 'تعديل' : 'إدخال ‹'}
                    </span>
                  </button>
                </div>

                <div className="border-t border-brand-border"></div>

                {/* Grand Total Row */}
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-sm font-extrabold text-brand-dark block">الإجمالي المستحق</span>
                    <span className="text-[11px] text-brand-muted">شامل التوصيل الموحد والمعاينة</span>
                  </div>
                  <div className="text-2xl font-black text-brand-primary">
                    {finalTotal} <span className="text-base font-bold">₪</span>
                  </div>
                </div>

                {/* Primary Action Button: Inline Checkout CTA */}
                <Link
                  ref={summaryBtnRef}
                  href={checkoutHref}
                  className="w-full py-3 px-4 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-sm sm:text-base font-extrabold shadow-md hover:shadow-lg transition-all active:scale-98 flex items-center justify-between no-underline cursor-pointer border-0"
                >
                  <span>متابعة الشحن والسداد</span>
                  <span className="flex items-center gap-1.5">
                    <span>{finalTotal} ₪</span>
                    <span>←</span>
                  </span>
                </Link>

                {/* Serene Trust Assurance */}
                <div className="pt-3 border-t border-brand-border-subtle space-y-1.5 text-[11px] text-brand-muted font-medium">
                  <div className="flex items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-brand-trust">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>حق الفحص والتجربة عند الباب مكفول قبل السداد</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-brand-trust">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>الدفع نقداً عند الاستلام أو بمحفظة جوال باي</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        ) : (
          /* Empty Cart State */
          <section
            className="py-16 px-6 text-center bg-white border border-brand-border rounded-2xl max-w-lg mx-auto my-8 shadow-xs"
            aria-label="السلة فارغة"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-surface flex items-center justify-center text-brand-primary">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-brand-dark mb-2 m-0">سلتك في انتظار ما يُبهجك</h2>
            <p className="text-xs sm:text-sm text-brand-muted max-w-md mx-auto mb-6 leading-relaxed">
              لم تختر أي منتجات بعد. كل ما تطلبه من تجار ومتاجر المحافظة الوسطى نجمعه لك في طرد واحد عند باب بيتك، مع حق الفحص والمعاينة قبل دفع أي شيكل.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-xs sm:text-sm font-bold shadow-sm transition-colors no-underline"
              >
                <span>تصفح كافة الأقسام والمتاجر</span>
                <span className="text-sm">←</span>
              </Link>
              <Link
                href="/wishlist"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-brand-surface hover:bg-brand-border/40 border border-brand-border text-brand-dark text-xs sm:text-sm font-bold transition-colors no-underline"
              >
                <span>قائمة المفضلة</span>
              </Link>
            </div>
          </section>
        )}
      </main>

      {/* Mobile Sticky Floating Checkout Bar */}
      {items.length > 0 && (
        <aside
          className={`lg:hidden fixed bottom-16 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-brand-border px-4 py-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] flex items-center justify-between transition-all duration-300 ${
            isDockedHidden ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
          }`}
          aria-label="شريط متابعة الطلب السريع للجوال"
        >
          <div>
            <span className="text-[10px] text-brand-muted block">المجموع المستحق:</span>
            <div className="text-base font-black text-brand-primary">
              {finalTotal} <span className="text-xs font-bold">₪</span>
            </div>
          </div>
          <Link
            href={checkoutHref}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-95 no-underline"
          >
            <span>متابعة الشحن والسداد</span>
            <span>←</span>
          </Link>
        </aside>
      )}

      {/* Adaptive Coupon Drawer / Modal */}
      <BottomSheet
        isOpen={couponOpen}
        onClose={() => setCouponOpen(false)}
        title="قسيمة الخصم وكوبون الهدايا"
      >
        <div className="flex flex-col gap-4 text-right font-almarai">
          <p className="m-0 text-xs sm:text-sm text-brand-muted leading-relaxed">
            أدخل رمز قسيمة سَدِيم الترويجية أو كوبون الهدايا للحصول على خصم فوري على إجمالي طلبيتك بالمحافظة الوسطى.
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="مثال: SADEEM10"
              className="flex-1 px-3 py-2 text-xs sm:text-sm rounded-lg border border-brand-border bg-white text-brand-dark uppercase focus:outline-none focus:border-brand-primary"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  applyCoupon();
                }
              }}
            />
            <button
              type="button"
              onClick={() => applyCoupon()}
              className="px-5 py-2 rounded-lg bg-brand-primary text-white text-xs sm:text-sm font-bold hover:bg-brand-primary-hover transition-colors cursor-pointer border-0"
            >
              تطبيق
            </button>
          </div>

          {/* Quick presets */}
          <div>
            <span className="text-[11px] text-brand-subtle block mb-2 font-medium">
              كوبونات سَدِيم النشطة للمحافظة الوسطى:
            </span>
            <div className="flex gap-2 flex-wrap">
              {['SADEEM10', 'GAZA'].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => applyCoupon(code)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    couponCode === code && discount > 0
                      ? 'bg-brand-primary-soft border-brand-primary text-brand-primary'
                      : 'bg-brand-surface border-brand-border text-brand-dark hover:border-brand-primary'
                  }`}
                >
                  <span>{code}</span>
                  <span className="text-[10px] text-brand-muted">(خصم 15 ₪)</span>
                </button>
              ))}
            </div>
          </div>

          {discount > 0 && (
            <div className="p-3 rounded-lg bg-brand-trust-soft border border-brand-trust/20 text-brand-trust text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>تم تفعيل القسيمة: وفرت {discount} ₪ بنجاح</span>
              </div>
              <button
                type="button"
                onClick={removeCoupon}
                className="text-xs text-brand-muted hover:text-brand-dark underline cursor-pointer bg-transparent border-0 p-0"
              >
                إلغاء الخصم
              </button>
            </div>
          )}
        </div>
      </BottomSheet>

      {/* Floating Toast Notification */}
      {toastVisible && (
        <div className="fixed bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-brand-dark text-white px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span>{toastText}</span>
        </div>
      )}
    </>
  );
}
