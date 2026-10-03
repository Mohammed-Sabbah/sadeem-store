'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const paramOrderId = searchParams.get('orderId');

  const [orderId, setOrderId] = useState<string>(paramOrderId || 'SD-25431');
  const [customerName, setCustomerName] = useState<string>('أحمد سلامة');
  const [town, setTown] = useState<string>('دير البلح');
  const [detailedAddress, setDetailedAddress] = useState<string>('شارع النخيل، بجوار مسجد الفرقان');
  const [phone, setPhone] = useState<string>('0599123456');
  const [paymentMethod, setPaymentMethod] = useState<string>('cod');
  const [total, setTotal] = useState<number>(188);
  const [items, setItems] = useState<any[]>([
    {
      product: {
        title: 'كنزة سَدِيم الصوفية بغطاء رأس من القطن الممشط الفاخر (L)',
        price: 135,
        image: '/canaan_product_hoodie_olive.jpg',
        vendor: { name: 'خيوط سَدِيم للأزياء', city: 'دير البلح' },
      },
      quantity: 1,
    },
    {
      product: {
        title: 'خابية زيت زيتون بكر رومي ممتاز معصورة على البارد (1 لتر)',
        price: 45,
        image: '/canaan_olive_amphora_1788773956733.jpg',
        vendor: { name: 'معاصر النصيرات الحديثة', city: 'مخيم النصيرات' },
      },
      quantity: 1,
    },
  ]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sadeem_last_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.orderId) setOrderId(parsed.orderId);
        if (parsed.customer?.fullName) setCustomerName(parsed.customer.fullName);
        if (parsed.customer?.town) setTown(parsed.customer.town);
        if (parsed.customer?.detailedAddress) setDetailedAddress(parsed.customer.detailedAddress);
        if (parsed.customer?.phone) setPhone(parsed.customer.phone);
        if (parsed.paymentMethod) setPaymentMethod(parsed.paymentMethod);
        if (parsed.grandTotal) setTotal(parsed.grandTotal);
        if (parsed.items && parsed.items.length > 0) setItems(parsed.items);
      }
    } catch {}
  }, []);

  const cleanOrderId = orderId.replace('SD-', '');

  return (
    <main className="max-w-[860px] mx-auto px-4 py-8 sm:py-12 pb-24 text-right font-almarai space-y-6">
      {/* 1. TOP CELEBRATORY HERO CARD */}
      <section className="p-6 sm:p-8 rounded-2xl bg-white border border-brand-border text-center shadow-xs flex flex-col items-center gap-3">
        {/* Animated Trust Aura Badge */}
        <div className="w-14 h-14 rounded-full bg-brand-trust-soft text-brand-trust flex items-center justify-center mb-1">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>

        <div className="px-3 py-1 rounded-full bg-brand-surface border border-brand-border text-xs font-bold text-brand-trust">
          <span>تم تأكيد واعتماد طلبك بنجاح</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold text-brand-dark m-0">
          شكراً لتسوقك من سَدِيم، {customerName}!
        </h1>

        <p className="text-xs sm:text-sm text-brand-muted max-w-md leading-relaxed m-0">
          طلبك مسجل برقم <strong className="text-brand-dark">#{cleanOrderId}</strong>. يجري الآن جمع طلبياتك من مختلف متاجر المحافظة الوسطى داخل طرد سَدِيم الموحد.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 flex-wrap mt-2">
          <Link
            href={`/tracking?orderId=${orderId}`}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-xs sm:text-sm font-bold shadow-sm transition-colors no-underline"
          >
            <span>تتبع خط سير المندوب والشحنة</span>
            <span>←</span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-brand-surface hover:bg-brand-border/40 border border-brand-border text-brand-dark text-xs sm:text-sm font-bold transition-colors no-underline"
          >
            <span>العودة للمتجر الرئيسي</span>
          </Link>
        </div>
      </section>

      {/* 2. COMPACT THREE PILLARS STRIP */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-white border border-brand-border shadow-xs text-right">
        <div className="flex items-center gap-3 p-2">
          <div className="w-9 h-9 rounded-lg bg-brand-surface text-brand-primary flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
          <div>
            <strong className="text-xs font-extrabold text-brand-dark block">طرد سَدِيم الموحد</strong>
            <span className="text-[11px] text-brand-muted">تصلك مشترياتك في شحنة واحدة</span>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2 sm:border-r sm:border-brand-border-subtle">
          <div className="w-9 h-9 rounded-lg bg-brand-surface text-brand-primary flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="3" width="15" height="13"></rect>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
              <circle cx="5.5" cy="18.5" r="2.5"></circle>
              <circle cx="18.5" cy="18.5" r="2.5"></circle>
            </svg>
          </div>
          <div>
            <strong className="text-xs font-extrabold text-brand-dark block">توصيل 8 ₪ ثابت فقط</strong>
            <span className="text-[11px] text-brand-muted">تسليم مباشر إلى {town} بمندوب معتمد</span>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2 sm:border-r sm:border-brand-border-subtle">
          <div className="w-9 h-9 rounded-lg bg-brand-trust-soft text-brand-trust flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>
          <div>
            <strong className="text-xs font-extrabold text-brand-dark block">المعاينة قبل الدفع</strong>
            <span className="text-[11px] text-brand-muted">حق فحص وتشغيل البضائع عند الباب</span>
          </div>
        </div>
      </section>

      {/* 3. ORDER SUMMARY & DETAILS STACK */}
      <div className="space-y-4">
        {/* PARCEL ITEMS */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-brand-border shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-brand-border">
            <h2 className="text-sm sm:text-base font-extrabold text-brand-dark m-0">
              محتويات الطرد الموحد ({items.length} أصناف)
            </h2>
            <span className="text-base font-extrabold text-brand-primary">
              {total} ₪
            </span>
          </div>

          <div className="space-y-2.5">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-brand-surface border border-brand-border-subtle">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={item.product?.image || '/canaan_product_hoodie_olive.jpg'}
                    alt={item.product?.title}
                    className="w-10 h-10 rounded-md object-contain bg-white border border-brand-border/60 p-0.5 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-brand-dark block truncate" title={item.product?.title}>
                      {item.product?.title}
                    </span>
                    <span className="text-[10px] text-brand-muted block">
                      {item.product?.vendor?.name || 'متجر معتمد'} · {item.product?.vendor?.city || 'المحافظة الوسطى'}
                    </span>
                  </div>
                </div>

                <span className="text-xs font-extrabold text-brand-dark whitespace-nowrap">
                  {(item.product?.price || 0) * (item.quantity || 1)} ₪
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* DESTINATION & CONCIERGE */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-brand-border shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-brand-border">
            <h2 className="text-sm sm:text-base font-extrabold text-brand-dark m-0">
              بيانات وجهة التسليم
            </h2>
            <span className="text-[11px] font-bold text-brand-primary bg-brand-primary-soft px-2 py-0.5 rounded-full border border-brand-primary/20">
              المحافظة الوسطى
            </span>
          </div>

          <div className="text-xs leading-relaxed space-y-1">
            <div className="font-bold text-brand-dark">
              <strong>{town}</strong> — {detailedAddress}
            </div>
            <div className="text-brand-muted">
              المستلم: {customerName} · هاتف: <span dir="ltr">{phone}</span> · طريقة السداد: {paymentMethod === 'cod' ? 'الدفع عند الاستلام مع المعاينة' : 'سداد رقمي مكتمل'}
            </div>
          </div>

          {/* WhatsApp Direct Concierge Integration */}
          <div className="pt-3 border-t border-brand-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-brand-surface p-3 rounded-lg">
            <div className="text-xs leading-relaxed">
              <strong className="text-brand-dark block">تنسيق التوصيل الميداني:</strong>
              <span className="text-brand-muted">يمكنك مراسلة فريق سَدِيم عبر واتساب لتحديد نقطة تسليم مفضلة أو تعديل رقم الهاتف.</span>
            </div>

            <a
              href={`https://wa.me/970590000000?text=${encodeURIComponent(`مرحباً سَدِيم، بخصوص طلبي #${cleanOrderId}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-dark hover:bg-brand-primary text-white text-xs font-bold transition-colors whitespace-nowrap shadow-sm no-underline"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
              <span>واتساب المتابعة الفورية</span>
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-16 text-xs text-brand-muted">
          جاري إعداد تأكيد الطلب...
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
