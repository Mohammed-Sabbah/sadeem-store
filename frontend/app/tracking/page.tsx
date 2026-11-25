'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { orderService } from '@/features/orders/services/order.service';

interface TrackingItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
  storeName: string;
  storeCity: string;
}

interface TrackingData {
  orderId: string;
  status: 'pending' | 'delivered' | 'cancelled';
  createdAt: string;
  customerName: string;
  phone: string;
  address: string;
  paymentMethod: string;
  items: TrackingItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}

function TrackingContent() {
  const searchParams = useSearchParams();
  const paramOrderId = searchParams.get('orderId');
  const { user } = useAuth();

  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // Fetch authoritative data strictly for the current authenticated user from backend
    orderService
      .getCustomerOrders({ limit: 100 })
      .then((res) => {
        if (!active) return;
        if (res.success && res.data && Array.isArray(res.data.orders)) {
          const ordersList = res.data.orders;
          let matchedOrders = ordersList;

          if (paramOrderId) {
            matchedOrders = ordersList.filter(
              (o) => o.orderGroupId === paramOrderId || o._id === paramOrderId
            );
          }

          if (matchedOrders.length > 0) {
            const first = matchedOrders[0];
            const gid = first.orderGroupId || first._id;
            const groupOrders = ordersList.filter((o) => (o.orderGroupId || o._id) === gid);

            const groupItems: TrackingItem[] = [];
            for (const ord of groupOrders) {
              const sName = typeof ord.storeId === 'object' ? ord.storeId.name : 'متجر معتمد';
              for (const it of ord.items) {
                groupItems.push({
                  id: it._id || it.variantId,
                  title: it.productTitle,
                  price: it.unitPrice,
                  quantity: it.quantity,
                  image: it.image || '/placeholder_product.svg',
                  storeName: sName,
                  storeCity: 'المحافظة الوسطى',
                });
              }
            }

            const subtotal = groupOrders.reduce((sum, o) => sum + o.subtotal, 0);
            const allDelivered = groupOrders.every((o) => o.status === 'delivered');
            const allCancelled = groupOrders.every((o) => o.status === 'cancelled');
            const status = allCancelled ? 'cancelled' : allDelivered ? 'delivered' : 'pending';

            setTracking({
              orderId: gid,
              status,
              createdAt: first.createdAt,
              customerName: user?.name || 'الزبون الكريم',
              phone: first.deliveryPhone || user?.phone || '',
              address: first.deliveryAddress || 'المحافظة الوسطى',
              paymentMethod: 'wallet',
              items: groupItems,
              subtotal,
              deliveryFee: 10,
              total: subtotal + 10,
            });
          } else {
            // Strictly reset to null if user has 0 orders or no matching order
            setTracking(null);
          }
        } else {
          setTracking(null);
        }
      })
      .catch(() => {
        if (active && !paramOrderId) setTracking(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [paramOrderId, user]);

  if (isLoading) {
    return (
      <main className="max-w-[1240px] mx-auto px-4 py-20 text-center font-almarai">
        <div className="w-10 h-10 rounded-full border-2 border-brand-primary border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-xs sm:text-sm text-brand-muted">جاري تحميل تفاصيل تتبع الشحنة الموحدة...</p>
      </main>
    );
  }

  if (!tracking) {
    return (
      <main className="max-w-[800px] mx-auto px-4 py-16 text-center font-almarai space-y-4">
        <div className="w-12 h-12 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center mx-auto text-brand-muted">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h1 className="text-lg sm:text-xl font-extrabold text-brand-dark m-0">لم يتم العثور على شحنة</h1>
        <p className="text-xs sm:text-sm text-brand-muted max-w-md mx-auto">
          لم نعثر على تفاصيل شحنة مسجلة برقم المعرف الحالي. يمكنك استعراض سجل طلباتك المسجلة لمتابعتها.
        </p>
        <div className="pt-2">
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-dark text-white text-xs font-bold no-underline hover:bg-black transition-colors"
          >
            <span>انتقل إلى قائمة طلباتي</span>
            <span>←</span>
          </Link>
        </div>
      </main>
    );
  }

  const cleanDisplayId = tracking.orderId.length > 8
    ? tracking.orderId.slice(-8).toUpperCase()
    : tracking.orderId;

  const isPending = tracking.status === 'pending';
  const isDelivered = tracking.status === 'delivered';
  const isCancelled = tracking.status === 'cancelled';

  return (
    <main className="max-w-[1240px] mx-auto px-4 py-4 sm:py-6 pb-28 text-right font-almarai space-y-4">
      {/* 1. COMPACT PAGE HEADER STRIP */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-brand-border">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-brand-dark m-0">تتبع الشحنة الموحدة</h1>
          <p className="text-xs text-brand-muted m-0 mt-0.5">
            رقم الطلب: <strong className="text-brand-dark font-mono">#{cleanDisplayId}</strong> · وجهة التسليم: {tracking.address}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-brand-surface border border-brand-border text-xs font-bold text-brand-dark hover:text-brand-primary hover:border-brand-primary transition-colors no-underline active:scale-95"
          >
            <span>←</span>
            <span>العودة للطلبات</span>
          </Link>
        </div>
      </div>

      {/* 2. UNIFIED THREE-STEP STEPPER */}
      <nav className="flex items-center justify-center gap-2 sm:gap-3 mb-4 select-none text-xs font-bold" aria-label="مراحل إتمام الطلب">
        <Link href="/cart" className="inline-flex items-center gap-1.5 text-brand-trust no-underline">
          <span className="w-5 h-5 rounded-full bg-brand-trust-soft text-brand-trust border border-brand-trust flex items-center justify-center text-[10px]">
            ✓
          </span>
          <span>السلة</span>
        </Link>

        <div className="w-6 sm:w-8 h-[1px] bg-brand-border" />

        <Link href="/checkout" className="inline-flex items-center gap-1.5 text-brand-trust no-underline">
          <span className="w-5 h-5 rounded-full bg-brand-trust-soft text-brand-trust border border-brand-trust flex items-center justify-center text-[10px]">
            ✓
          </span>
          <span>الشحن والسداد</span>
        </Link>

        <div className="w-6 sm:w-8 h-[1px] bg-brand-border" />

        <div className="inline-flex items-center gap-1.5 text-brand-primary font-extrabold">
          <span className="w-5 h-5 rounded-full bg-brand-primary text-white flex items-center justify-center text-[10px]">
            3
          </span>
          <span>التتبع والاستلام</span>
        </div>
      </nav>

      {/* 3. UNIFIED PARCEL TRUST BANNER */}
      <div className="p-3 sm:px-4 rounded-xl bg-white border border-brand-border-subtle flex items-center gap-2.5 mb-5 shadow-xs" aria-label="ميثاق طرد سَدِيم الموحد">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-trust-soft text-brand-trust border border-brand-trust/20 text-xs font-bold whitespace-nowrap flex-shrink-0">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>طرد موحد 10 ₪</span>
        </span>
        <span className="text-xs text-brand-muted font-medium leading-relaxed">
          تُجمع طلبياتك من مختلف متاجر المحافظة الوسطى في شحنة واحدة بمندوب معتمد مع حق الفحص والمعاينة عند الباب قبل الاستلام.
        </span>
      </div>

      {/* 4. RESPONSIVE TRACKING GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* MAIN COLUMN (RIGHT): STEPPER HERO & COURIER CARD (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-5">
          {/* ZONE 1: 4-STAGE OPERATIONAL TIMELINE HERO */}
          <section className="p-4 sm:p-5 rounded-2xl bg-white border border-brand-border shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-brand-border">
              <div className="flex items-center gap-2 text-xs font-extrabold text-brand-dark">
                <span>طلب #{cleanDisplayId}</span>
                <span>·</span>
                <span className="px-2 py-0.5 rounded-full bg-brand-surface text-brand-dark border border-brand-border text-[11px]">
                  سداد محفظة معتمد ✓
                </span>
              </div>
              <span className="text-[11px] font-bold text-brand-trust bg-brand-trust-soft px-2 py-0.5 rounded border border-brand-trust/20">
                توصيل 10 ₪ موحد
              </span>
            </div>

            {isCancelled ? (
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-stone-700 space-y-1">
                <strong className="text-sm font-bold block text-stone-900">هذا الطلب ملغي ومسترد</strong>
                <p className="text-xs text-stone-600 m-0">
                  تم إلغاء الشحنة الموحدة وأعيد كامل المبلغ تلقائياً إلى رصيد محفظتك الرقمية في سَدِيم.
                </p>
              </div>
            ) : isDelivered ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-1">
                <strong className="text-sm font-bold block text-emerald-950">تم تسليم الشحنة بنجاح ✓</strong>
                <p className="text-xs text-emerald-700 m-0">
                  سُلم الطرد الموحد بالكامل للمستلم وجرى فحص محتويات المتاجر بنجاح.
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-brand-dark m-0">طردك قيد التجهيز بالمستودع المركزي</h2>
                <p className="text-xs text-brand-muted mt-1 m-0">
                  يجري فرز المنتجات من المتاجر المحلية تمهيداً للتسليم الميداني المباشر.
                </p>
              </div>
            )}

            {/* 4-Stage Connected Progress Stepper */}
            {!isCancelled && (
              <div className="relative py-4">
                {/* Rail background */}
                <div className="absolute top-1/2 -translate-y-1/2 left-6 right-6 h-1 bg-brand-border rounded-full z-0" />
                {/* Rail progress */}
                <div
                  className={`absolute top-1/2 -translate-y-1/2 right-6 h-1 bg-brand-primary rounded-full z-0 transition-all ${
                    isDelivered ? 'w-[calc(100%-3rem)]' : 'w-1/3'
                  }`}
                />

                <div className="relative z-10 grid grid-cols-4 text-center">
                  {/* Node 1 */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center text-xs font-bold shadow-sm ring-4 ring-white">
                      ✓
                    </div>
                    <span className="text-[10px] sm:text-xs font-extrabold text-brand-dark">تم التأكيد</span>
                  </div>

                  {/* Node 2 */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center text-xs font-bold shadow-sm ring-4 ring-white">
                      ✓
                    </div>
                    <span className="text-[10px] sm:text-xs font-extrabold text-brand-dark">المستودع</span>
                  </div>

                  {/* Node 3 */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ring-4 ${
                      isDelivered ? 'bg-brand-primary text-white ring-white' : 'bg-brand-surface border border-brand-border text-brand-muted ring-white'
                    }`}>
                      {isDelivered ? '✓' : '3'}
                    </div>
                    <span className={`text-[10px] sm:text-xs ${isDelivered ? 'font-extrabold text-brand-dark' : 'font-medium text-brand-muted'}`}>
                      في الطريق
                    </span>
                  </div>

                  {/* Node 4 */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ring-4 ${
                      isDelivered ? 'bg-brand-primary text-white ring-white' : 'bg-brand-surface border border-brand-border text-brand-muted ring-white'
                    }`}>
                      {isDelivered ? '✓' : '4'}
                    </div>
                    <span className={`text-[10px] sm:text-xs ${isDelivered ? 'font-extrabold text-brand-dark' : 'font-medium text-brand-muted'}`}>
                      الاستلام
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ZONE 2: COURIER & DELIVERY DESTINATION CARD */}
          <section className="p-4 sm:p-5 rounded-2xl bg-white border border-brand-border shadow-xs flex flex-col gap-3.5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center text-brand-primary">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-trust text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white">✓</span>
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-extrabold text-brand-dark block">مندوب سَدِيم المعتمد</span>
                  <div className="text-[11px] text-brand-muted flex items-center gap-1.5 mt-0.5">
                    <span>التوصيل الميداني للمحافظة الوسطى</span>
                    <span>·</span>
                    <span className="text-amber-700 font-bold flex items-center gap-1">
                      <svg className="w-3 h-3 text-amber-500 fill-amber-500" viewBox="0 0 24 24">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      <span>5.0</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://wa.me/970599123456?text=${encodeURIComponent(`مرحباً سَدِيم، بخصوص طرد رقم #${cleanDisplayId}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] text-white text-xs font-bold hover:opacity-90 transition-opacity shadow-xs no-underline"
                  title="مراسلة عبر واتساب"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                  <span>واتساب التنسيق</span>
                </a>
              </div>
            </div>

            <div className="border-t border-brand-border-subtle pt-2.5 flex items-center gap-2.5 text-xs">
              <div className="w-7 h-7 rounded-lg bg-brand-surface text-brand-primary flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="text-brand-dark">
                <span className="font-extrabold">عنوان التسليم:</span>
                <span className="text-brand-muted"> {tracking.address}</span>
              </div>
            </div>
          </section>
        </div>

        {/* SIDEBAR COLUMN (LEFT): INVOICE & PARCEL CONTENTS (4 cols) */}
        <aside className="lg:col-span-5 xl:col-span-4 space-y-4" aria-label="تفاصيل الطلب والضمان">
          {/* Reassurance Shield */}
          <div className="p-3.5 rounded-xl bg-brand-trust-soft border border-brand-trust/20 flex items-start gap-2.5 text-xs text-brand-dark leading-relaxed">
            <span className="text-brand-trust flex-shrink-0 mt-0.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </span>
            <span>
              حق المعاينة والفحص عند الباب مكفول بالكامل، مع إمكانية استبدال فوري أو استرداد للمحفظة.
            </span>
          </div>

          {/* Accordion / Sticky Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-brand-border shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-brand-border">
              <span className="text-xs sm:text-sm font-extrabold text-brand-dark">
                محتويات الطرد ({tracking.items.length} أصناف)
              </span>
              <span className="text-xs font-bold text-brand-primary font-mono">{tracking.total} ₪</span>
            </div>

            <div className="space-y-2.5">
              {tracking.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2.5 p-2 rounded-lg bg-brand-surface border border-brand-border-subtle">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={item.image || '/placeholder_product.svg'}
                      alt={item.title}
                      className="w-9 h-9 rounded-md object-contain bg-white border border-brand-border/60 p-0.5 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-brand-dark block truncate" title={item.title}>
                        {item.title}
                      </span>
                      <span className="text-[10px] text-brand-muted block">
                        {item.storeName} · الكمية: {item.quantity}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-brand-dark whitespace-nowrap font-mono">
                    {item.price * item.quantity} ₪
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-brand-border pt-2 space-y-1.5 text-xs">
              <div className="flex justify-between text-brand-muted">
                <span>مجموع المنتجات:</span>
                <span className="font-mono">{tracking.subtotal} ₪</span>
              </div>
              <div className="flex justify-between text-brand-muted">
                <span>أجر طرد سَدِيم الموحد:</span>
                <span className="font-mono">{tracking.deliveryFee} ₪</span>
              </div>
              <div className="flex justify-between font-extrabold text-brand-dark pt-1 border-t border-brand-border-subtle">
                <span>المبلغ الإجمالي:</span>
                <span className="text-brand-primary font-mono">{tracking.total} ₪ (سداد محفظة ✓)</span>
              </div>
            </div>

            <div className="pt-2 text-center">
              <Link
                href="/orders"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-dark hover:text-brand-primary transition-colors no-underline"
              >
                <span>الاطلاع على جميع طلباتي المسجلة</span>
                <span>←</span>
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default function TrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-16 text-xs text-brand-muted font-almarai">
          جاري تحميل تفاصيل الشحنة الموحدة...
        </div>
      }
    >
      <TrackingContent />
    </Suspense>
  );
}
