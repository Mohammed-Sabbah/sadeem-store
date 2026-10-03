'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface SavedOrder {
  orderId: string;
  createdAt: string;
  customer: {
    fullName: string;
    phone: string;
    town: string;
    detailedAddress: string;
  };
  paymentMethod: string;
  items: Array<{
    product: {
      id: string;
      title: string;
      price: number;
      image: string;
      vendor: { name: string; city: string };
    };
    quantity: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  grandTotal: number;
}

function TrackingContent() {
  const searchParams = useSearchParams();
  const paramOrderId = searchParams.get('orderId');

  const [order, setOrder] = useState<SavedOrder | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sadeem_last_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!paramOrderId || parsed.orderId === paramOrderId) {
          setOrder(parsed);
          return;
        }
      }
    } catch {}

    // Default authentic Central Gaza mock order if none saved
    setOrder({
      orderId: paramOrderId || '25431',
      createdAt: new Date().toISOString(),
      customer: {
        fullName: 'أحمد سلامة',
        phone: '0599123456',
        town: 'دير البلح',
        detailedAddress: 'شارع النخيل، بجوار مسجد الفرقان',
      },
      paymentMethod: 'cod',
      items: [
        {
          product: {
            id: 'canaan-wool-hoodie',
            title: 'كنزة سَدِيم الصوفية بغطاء رأس من القطن الممشط الفاخر (L)',
            price: 135,
            image: '/canaan_product_hoodie_olive.jpg',
            vendor: { name: 'خيوط سَدِيم للأزياء', city: 'دير البلح' },
          },
          quantity: 1,
        },
        {
          product: {
            id: 'olive-oil-amphora',
            title: 'خابية زيت زيتون بكر رومي ممتاز معصورة على البارد (1 لتر)',
            price: 45,
            image: '/canaan_olive_amphora_1788773956733.jpg',
            vendor: { name: 'معاصر النصيرات الحديثة', city: 'مخيم النصيرات' },
          },
          quantity: 1,
        },
      ],
      subtotal: 180,
      deliveryFee: 8,
      grandTotal: 188,
    });
  }, [paramOrderId]);

  if (!order) {
    return (
      <div className="text-center py-16 text-xs text-brand-muted font-almarai">
        جاري تحميل تفاصيل الشحنة الموحدة...
      </div>
    );
  }

  const cleanOrderId = order.orderId.replace('SD-', '');

  return (
    <main className="max-w-[1240px] mx-auto px-4 py-4 sm:py-6 pb-28 text-right font-almarai space-y-4">
      {/* 1. COMPACT PAGE HEADER STRIP */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-brand-border">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-brand-dark m-0">تتبع الشحنة الموحدة</h1>
          <p className="text-xs text-brand-muted m-0 mt-0.5">رقم الطلب: #{cleanOrderId} · وجهة التسليم: {order.customer.town} (المحافظة الوسطى)</p>
        </div>

        <Link
          href="/"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-surface border border-brand-border text-xs font-bold text-brand-dark hover:text-brand-primary hover:border-brand-primary transition-colors no-underline"
        >
          <span>←</span>
          <span>الرئيسية</span>
        </Link>
      </div>

      {/* 2. UNIFIED THREE-STEP STEPPER (STEP 3 ACTIVE) */}
      <nav className="flex items-center justify-center gap-2 sm:gap-3 mb-4 select-none text-xs font-bold" aria-label="مراحل إتمام الطلب">
        <Link href="/cart" className="inline-flex items-center gap-1.5 text-brand-trust no-underline">
          <span className="w-5 h-5 rounded-full bg-brand-trust-soft text-brand-trust border border-brand-trust flex items-center justify-center text-[10px]">
            ✓
          </span>
          <span>السلة</span>
        </Link>

        <div className="w-6 sm:w-8 h-[1px] bg-brand-border"></div>

        <Link href="/checkout" className="inline-flex items-center gap-1.5 text-brand-trust no-underline">
          <span className="w-5 h-5 rounded-full bg-brand-trust-soft text-brand-trust border border-brand-trust flex items-center justify-center text-[10px]">
            ✓
          </span>
          <span>الشحن والسداد</span>
        </Link>

        <div className="w-6 sm:w-8 h-[1px] bg-brand-border"></div>

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
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <span>طرد موحد 8 ₪</span>
        </span>
        <span className="text-xs text-brand-muted font-medium leading-relaxed">
          تُجمع طلبياتك من مختلف متاجر الوسطى في شحنة واحدة بمندوب معتمد مع حق المعاينة والفحص عند الباب.
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
                <span>طلب #{cleanOrderId}</span>
                <span>·</span>
                <span className="px-2 py-0.5 rounded-full bg-brand-surface text-brand-dark border border-brand-border text-[11px]">
                  {order.paymentMethod === 'cod' ? 'الدفع عند الاستلام مع المعاينة' : 'مدفوع بالكامل ✓'}
                </span>
              </div>
              <span className="text-[11px] font-bold text-brand-trust bg-brand-trust-soft px-2 py-0.5 rounded border border-brand-trust/20">
                توصيل 8 ₪ موحد
              </span>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-brand-dark m-0">طردك في الطريق إليك الآن</h2>
              <p className="text-xs text-brand-muted mt-1 m-0">
                الوصول المتوقع اليوم بين <strong className="text-brand-dark">4:15</strong> و <strong className="text-brand-dark">4:45</strong> مساءً
              </p>
            </div>

            {/* 4-Stage Connected Progress Stepper */}
            <div className="relative py-4">
              {/* Rail background */}
              <div className="absolute top-1/2 -translate-y-1/2 left-6 right-6 h-1 bg-brand-border rounded-full z-0"></div>
              {/* Rail progress (66%) */}
              <div className="absolute top-1/2 -translate-y-1/2 right-6 h-1 bg-brand-primary rounded-full z-0 w-2/3"></div>

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

                {/* Node 3 (Active) */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center text-xs font-bold shadow-md ring-4 ring-brand-primary-soft">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="5.5" cy="17.5" r="2.5"></circle>
                      <circle cx="18.5" cy="17.5" r="2.5"></circle>
                      <path d="M15 6h4l2 5v6h-2.5"></path>
                      <path d="M9 17.5h6"></path>
                      <path d="M5.5 15H3v-4l4-5h8v4"></path>
                    </svg>
                  </div>
                  <span className="text-[10px] sm:text-xs font-black text-brand-primary">في الطريق</span>
                </div>

                {/* Node 4 (Pending) */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-8 h-8 rounded-full bg-brand-surface border border-brand-border text-brand-muted flex items-center justify-center text-xs font-bold ring-4 ring-white">
                    4
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium text-brand-muted">الاستلام</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-brand-muted bg-brand-surface p-2.5 rounded-lg border border-brand-border-subtle">
              طرد موحد يجمع مشترياتك من متاجر الوسطى ({order.items.map(i => i.product.vendor.city).filter((v, i, a) => a.indexOf(v) === i).join(' · ')})
            </div>
          </section>

          {/* ZONE 2: COURIER & DELIVERY DESTINATION CARD */}
          <section className="p-4 sm:p-5 rounded-2xl bg-white border border-brand-border shadow-xs flex flex-col gap-3.5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center text-brand-primary">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-trust text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white">✓</span>
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-extrabold text-brand-dark block">يوسف العطار</span>
                  <div className="text-[11px] text-brand-muted flex items-center gap-1.5 mt-0.5">
                    <span>مندوب سَدِيم الميداني</span>
                    <span>·</span>
                    <span className="text-amber-600 font-bold">★ 4.95</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://wa.me/970590000000?text=${encodeURIComponent(`مرحباً يوسف، بخصوص طرد سَدِيم رقم #${cleanOrderId}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] text-white text-xs font-bold hover:opacity-90 transition-opacity shadow-xs no-underline"
                  title="مراسلة عبر واتساب"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                  </svg>
                  <span>واتساب</span>
                </a>

                <a
                  href="tel:0599000000"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-surface border border-brand-border text-brand-dark text-xs font-bold hover:text-brand-primary hover:border-brand-primary transition-colors shadow-xs no-underline"
                  title="اتصال هاتفي بالمندوب"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  <span>اتصال</span>
                </a>
              </div>
            </div>

            <div className="border-t border-brand-border-subtle pt-2.5 flex items-center gap-2.5 text-xs">
              <div className="w-7 h-7 rounded-lg bg-brand-surface text-brand-primary flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <div className="text-brand-dark">
                <span className="font-extrabold">{order.customer.town}</span>
                <span className="text-brand-muted"> — {order.customer.detailedAddress}</span>
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
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </span>
            <span>
              حق المعاينة والفحص عند الباب مكفول قبل السداد، مع استبدال فوري أو استرداد للمحفظة.
            </span>
          </div>

          {/* Accordion / Sticky Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-brand-border shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-brand-border">
              <span className="text-xs sm:text-sm font-extrabold text-brand-dark">محتويات الطرد ({order.items.length} أصناف)</span>
              <span className="text-xs font-bold text-brand-primary">{order.grandTotal} ₪</span>
            </div>

            <div className="space-y-2.5">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2.5 p-2 rounded-lg bg-brand-surface border border-brand-border-subtle">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={item.product.image}
                      alt={item.product.title}
                      className="w-9 h-9 rounded-md object-contain bg-white border border-brand-border/60 p-0.5 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-brand-dark block truncate" title={item.product.title}>
                        {item.product.title}
                      </span>
                      <span className="text-[10px] text-brand-muted block">
                        {item.product.vendor.name} · {item.product.vendor.city}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-brand-dark whitespace-nowrap">
                    {item.product.price * item.quantity} ₪
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-brand-border pt-2 space-y-1.5 text-xs">
              <div className="flex justify-between text-brand-muted">
                <span>مجموع المنتجات:</span>
                <span>{order.subtotal} ₪</span>
              </div>
              <div className="flex justify-between text-brand-muted">
                <span>أجر طرد سَدِيم الموحد:</span>
                <span>{order.deliveryFee} ₪</span>
              </div>
              <div className="flex justify-between font-extrabold text-brand-dark pt-1 border-t border-brand-border-subtle">
                <span>المبلغ المطلوب:</span>
                <span className="text-brand-primary">{order.grandTotal} ₪ ({order.paymentMethod === 'cod' ? 'عند الاستلام' : 'سداد رقمي ✓'})</span>
              </div>
            </div>

            <div className="pt-2 text-center">
              <a
                href={`https://wa.me/970590000000?text=${encodeURIComponent(`مرحباً سَدِيم، بخصوص متابعة الشحنة رقم #${cleanOrderId}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:underline no-underline"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                <span>تواصل مع مشرف المتابعة عبر واتساب</span>
              </a>
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
        <div className="text-center py-16 text-xs text-brand-muted">
          جاري تحميل تفاصيل الشحنة الموحدة...
        </div>
      }
    >
      <TrackingContent />
    </Suspense>
  );
}
