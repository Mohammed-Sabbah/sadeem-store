'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { orderService } from '@/features/orders/services/order.service';

interface OrderItemDisplay {
  title: string;
  price: number;
  quantity: number;
  image: string;
  storeName: string;
  storeCity: string;
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const paramOrderId = searchParams.get('orderId');
  const { user } = useAuth();

  const [orderId, setOrderId] = useState<string>(paramOrderId || '');
  const [customerName, setCustomerName] = useState<string>(user?.name || 'الزبون الكريم');
  const [town, setTown] = useState<string>('المحافظة الوسطى');
  const [detailedAddress, setDetailedAddress] = useState<string>('دير البلح');
  const [phone, setPhone] = useState<string>(user?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState<string>('wallet');
  const [total, setTotal] = useState<number>(0);
  const [deliveryFee, setDeliveryFee] = useState<number>(10);
  const [items, setItems] = useState<OrderItemDisplay[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch authoritative data from backend strictly for the authenticated user
    orderService
      .getCustomerOrders({ limit: 50 })
      .then((res) => {
        if (res.success && res.data && Array.isArray(res.data.orders) && res.data.orders.length > 0) {
          const orders = res.data.orders;
          let matchingOrders = orders;

          if (paramOrderId) {
            matchingOrders = orders.filter(
              (o) => o.orderGroupId === paramOrderId || o._id === paramOrderId
            );
          }

          if (matchingOrders.length > 0) {
            const first = matchingOrders[0];
            const targetGroupId = first.orderGroupId || first._id;
            const groupOrders = orders.filter((o) => (o.orderGroupId || o._id) === targetGroupId);

            setOrderId(targetGroupId);
            if (user?.name) setCustomerName(user.name);
            if (first.deliveryAddress) setDetailedAddress(first.deliveryAddress);
            if (first.deliveryPhone) setPhone(first.deliveryPhone);
            setPaymentMethod('wallet');

            const orderSubtotal = groupOrders.reduce((sum, o) => sum + o.subtotal, 0);
            setDeliveryFee(10);
            setTotal(orderSubtotal + 10);

            const fetchedItems: OrderItemDisplay[] = [];
            for (const ord of groupOrders) {
              const sName = typeof ord.storeId === 'object' ? ord.storeId.name : 'متجر معتمد';
              for (const it of ord.items) {
                fetchedItems.push({
                  title: it.productTitle,
                  price: it.unitPrice,
                  quantity: it.quantity,
                  image: it.image || '/placeholder_product.svg',
                  storeName: sName,
                  storeCity: 'المحافظة الوسطى',
                });
              }
            }
            if (fetchedItems.length > 0) {
              setItems(fetchedItems);
            }
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsLoading(false);
      });
  }, [paramOrderId, user]);

  const cleanDisplayId = orderId
    ? (orderId.startsWith('SD-') ? orderId.replace('SD-', '') : orderId.slice(-8).toUpperCase())
    : '---';

  return (
    <main className="max-w-[860px] mx-auto px-4 py-8 sm:py-12 pb-24 text-right font-almarai space-y-6">
      {/* 1. TOP CELEBRATORY HERO CARD */}
      <section className="p-6 sm:p-8 rounded-2xl bg-white border border-brand-border text-center shadow-xs flex flex-col items-center gap-3">
        {/* Trust Aura Icon */}
        <div className="w-14 h-14 rounded-full bg-brand-trust-soft text-brand-trust flex items-center justify-center mb-1">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>

        <div className="px-3 py-1 rounded-full bg-brand-surface border border-brand-border text-xs font-bold text-brand-trust">
          <span>تم تأكيد واعتماد طلبك بنجاح في قاعدة البيانات</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold text-brand-dark m-0">
          شكراً لتسوقك من سَدِيم، {customerName}!
        </h1>

        <p className="text-xs sm:text-sm text-brand-muted max-w-md leading-relaxed m-0">
          طلبك مسجل برقم <strong className="text-brand-dark font-mono">#{cleanDisplayId}</strong>. يجري الآن جمع مشترياتك من مختلف متاجر المحافظة الوسطى داخل طرد سَدِيم الموحد.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 flex-wrap mt-3">
          {orderId && (
            <Link
              href={`/tracking?orderId=${orderId}`}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white text-xs sm:text-sm font-bold shadow-sm transition-colors no-underline"
            >
              <span>تتبع خط سير المندوب والشحنة</span>
              <span>←</span>
            </Link>
          )}

          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-brand-surface hover:bg-brand-border/40 border border-brand-border text-brand-dark text-xs sm:text-sm font-bold transition-colors no-underline"
          >
            <span>استعراض كافة طلباتي</span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-transparent hover:bg-brand-surface text-brand-muted hover:text-brand-dark text-xs sm:text-sm font-bold transition-colors no-underline"
          >
            <span>العودة للرئيسية</span>
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
            <span className="text-[11px] text-brand-muted">شحنة واحدة تضم كافة مشترياتك</span>
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
            <strong className="text-xs font-extrabold text-brand-dark block">توصيل {deliveryFee} ₪ موحد</strong>
            <span className="text-[11px] text-brand-muted">تسليم مباشر بالمحافظة الوسطى</span>
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
            <span className="text-base font-extrabold text-brand-primary font-mono">
              {total > 0 ? `${total} ₪` : '---'}
            </span>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-6 text-xs text-brand-muted">
              {isLoading ? 'جاري تحميل محتويات الشحنة...' : 'لا توجد أصناف مسجلة لهذا الطلب'}
            </div>
          ) : (
            <div className="space-y-2.5">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-brand-surface border border-brand-border-subtle">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.image || '/placeholder_product.svg'}
                      alt={item.title}
                      className="w-10 h-10 rounded-md object-contain bg-white border border-brand-border/60 p-0.5 flex-shrink-0"
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
          )}
        </div>

        {/* DESTINATION & PAYMENT */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-brand-border shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-brand-border">
            <h2 className="text-sm sm:text-base font-extrabold text-brand-dark m-0">
              بيانات وجهة التسليم والسداد
            </h2>
            <span className="text-[11px] font-bold text-brand-primary bg-brand-primary-soft px-2 py-0.5 rounded-full border border-brand-primary/20">
              المحافظة الوسطى
            </span>
          </div>

          <div className="text-xs leading-relaxed space-y-1">
            <div className="font-bold text-brand-dark">
              العنوان: <strong>{detailedAddress}</strong>
            </div>
            <div className="text-brand-muted">
              المستلم: {customerName} {phone && `· هاتف: ${phone}`} · طريقة السداد:{' '}
              <span className="font-bold text-brand-trust">
                {paymentMethod === 'wallet' ? 'سداد مكتمل عبر محفظة سَدِيم الرقمية ✓' : 'محفظة رقمية'}
              </span>
            </div>
          </div>

          {/* WhatsApp Concierge Strip */}
          <div className="pt-3 border-t border-brand-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-brand-surface p-3 rounded-lg">
            <div className="text-xs leading-relaxed">
              <strong className="text-brand-dark block">تنسيق التوصيل الميداني:</strong>
              <span className="text-brand-muted">يمكنك مراسلة فريق سَدِيم عبر واتساب لتحديد نقطة تسليم مفضلة أو تحديث بيانات التواصل.</span>
            </div>

            <a
              href={`https://wa.me/970599123456?text=${encodeURIComponent(`مرحباً سَدِيم، بخصوص طلبي #${cleanDisplayId}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-dark hover:bg-brand-primary text-white text-xs font-bold transition-colors whitespace-nowrap shadow-sm no-underline"
            >
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
        <div className="text-center py-16 text-xs text-brand-muted font-almarai">
          جاري إعداد تأكيد الطلب...
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
