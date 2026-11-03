'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import type { OrderDetail } from '@/features/orders/types/order.types';
import { OrderDetailsDrawer } from '@/features/orders/components/OrderDetailsDrawer';

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'delivered'>('all');
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);

  // Gaza Middle Governorate orders with authentic operational data
  const orders: OrderDetail[] = [
    {
      id: '25431',
      date: 'اليوم، 02:40 م',
      status: 'active',
      statusText: 'المندوب استلم الطرد الموحد وباتجاه عنوانك',
      itemsCount: 3,
      vendorNames: ['زاد الزيتون (دير البلح)', 'عطور يافا (النصيرات)'],
      subtotal: 210,
      deliveryFee: 8,
      total: 218,
      paymentMethod: 'الدفع نقداً عند الاستلام (كاش)',
      destination: {
        town: 'دير البلح',
        area: 'شارع السلام',
        detailedAddress: 'منطقة النخيل، بجوار صيدلية القدس',
        landmark: 'بالقرب من ملعب الدرة ومسجد النور',
        recipientName: 'محمد صباح',
        phone: '0592236240',
      },
      courier: {
        name: 'أبو أحمد النجار',
        phone: '0599123456',
        vehicle: 'دراجة شحن كهربائية سَدِيم',
      },
      items: [
        {
          id: 'item-1',
          title: 'زيت زيتون بكر ممتاز بلدي (سيرالي معتق)',
          storeName: 'زاد الزيتون',
          storeCity: 'دير البلح',
          price: 65,
          quantity: 1,
          variant: 'عبوة 1 لتر زجاج',
          image: '/canaan_olive_amphora_1788773956733.jpg',
        },
        {
          id: 'item-2',
          title: 'زعتر ديري بلدي بالسمسم المحمص والبهارات العتيقة',
          storeName: 'زاد الزيتون',
          storeCity: 'دير البلح',
          price: 35,
          quantity: 1,
          variant: 'كيس 1 كجم معبأ بتفريغ الهواء',
          image: '/canaan_zaatar_heritage_1788788500386.jpg',
        },
        {
          id: 'item-3',
          title: 'عطر مسك الغزال السديمي (شفق يافا)',
          storeName: 'عطور يافا',
          storeCity: 'مخيم النصيرات',
          price: 110,
          quantity: 1,
          variant: 'قارورة 50 مل',
          image: '/canaan_brand_wax_seal.png',
        },
      ],
      timeline: [
        {
          status: 'placed',
          title: 'تم تأكيد واستلام الطلب',
          description: 'تم تسجيل الطلب وتنسيق استلام الأصناف من المتاجر',
          time: '12:15 م',
          isCompleted: true,
          isCurrent: false,
        },
        {
          status: 'assembled',
          title: 'تجميع الطرد الموحد بمستودع سَدِيم',
          description: 'تم فحص جودة المنتجات وتغليفها معاً في طرد موحد واحد بالوسطى',
          time: '01:50 م',
          isCompleted: true,
          isCurrent: false,
        },
        {
          status: 'out_for_delivery',
          title: 'مع المندوب للتسليم الميداني',
          description: 'استلم الكابتن أبو أحمد النجار الطرد وهو باتجاه عنوانك بدير البلح',
          time: '02:40 م',
          isCompleted: false,
          isCurrent: true,
        },
        {
          status: 'delivered',
          title: 'الفحص والمعاينة عند الباب قبل الدفع',
          description: 'حقك الأصيل في فحص وتجربة مشترياتك والتأكد منها قبل تسليم المبلغ',
          isCompleted: false,
          isCurrent: false,
        },
      ],
    },
    {
      id: '24980',
      date: '24 أكتوبر 2026',
      status: 'delivered',
      statusText: 'تم التسليم والمعاينة بنجاح عند الباب',
      itemsCount: 2,
      vendorNames: ['خيوط كنعان (الزوايدة)'],
      subtotal: 137,
      deliveryFee: 8,
      total: 145,
      paymentMethod: 'محفظة سَدِيم الموحدة',
      destination: {
        town: 'دير البلح',
        area: 'البلد',
        detailedAddress: 'شارع البيئة، عمارة الهدى',
        landmark: 'مقابل مدرسة بنات دير البلح',
        recipientName: 'محمد صباح',
        phone: '0592236240',
      },
      courier: {
        name: 'محمود أبو عريبان',
        phone: '0599765432',
      },
      items: [
        {
          id: 'item-201',
          title: 'هودي شتوي فاخر صوف معالج (طين دافئ)',
          storeName: 'خيوط كنعان',
          storeCity: 'الزوايدة',
          price: 115,
          quantity: 1,
          variant: 'مقاس XL',
          image: '/canaan_product_hoodie_clay.jpg',
        },
        {
          id: 'item-202',
          title: 'شال كشميري دافئ مطرز أطرافه يدوياً',
          storeName: 'خيوط كنعان',
          storeCity: 'الزوايدة',
          price: 22,
          quantity: 1,
          variant: 'لون زيتي كنعاني',
          image: '/canaan_product_hoodie_olive.jpg',
        },
      ],
      timeline: [
        {
          status: 'placed',
          title: 'تم تأكيد الطلب',
          description: 'خصم من رصيد محفظة سَدِيم',
          time: '24 أكتوبر - 09:30 ص',
          isCompleted: true,
          isCurrent: false,
        },
        {
          status: 'assembled',
          title: 'تجهيز الطرد وتغليفه',
          description: 'تم التجهيز بمستودع سَدِيم المركزي',
          time: '24 أكتوبر - 11:20 ص',
          isCompleted: true,
          isCurrent: false,
        },
        {
          status: 'out_for_delivery',
          title: 'تسليم للكابتن الميداني',
          description: 'انطلق المندوب لتسليم الطلب',
          time: '24 أكتوبر - 01:10 م',
          isCompleted: true,
          isCurrent: false,
        },
        {
          status: 'delivered',
          title: 'تم التسليم والمعاينة بنجاح',
          description: 'تمت معاينة الأصناف واستلام الطرد عند باب البيت',
          time: '24 أكتوبر - 02:25 م',
          isCompleted: true,
          isCurrent: false,
        },
      ],
    },
    {
      id: '24102',
      date: '18 أكتوبر 2026',
      status: 'delivered',
      statusText: 'تم التسليم والمعاينة بنجاح عند الباب',
      itemsCount: 4,
      vendorNames: ['بهارات غزة العتيقة', 'أواني الفخار الأصيل'],
      subtotal: 302,
      deliveryFee: 8,
      total: 310,
      paymentMethod: 'الدفع عند الاستلام (كاش)',
      destination: {
        town: 'النصيرات',
        area: 'المخيم 2',
        detailedAddress: 'بالقرب من محطة راضي للبترول',
        landmark: 'بجوار صيدلية مخيم 2',
        recipientName: 'محمد صباح',
        phone: '0592236240',
      },
      courier: {
        name: 'أحمد التلباني',
        phone: '0599881122',
      },
      items: [
        {
          id: 'item-301',
          title: 'طقم بهارات سبعة فلسطينية فاخرة',
          storeName: 'بهارات غزة العتيقة',
          storeCity: 'دير البلح',
          price: 55,
          quantity: 1,
          image: '/canaan_zaatar_heritage_1788788500386.jpg',
        },
        {
          id: 'item-302',
          title: 'سماق بلدي أحمر نخب أول',
          storeName: 'بهارات غزة العتيقة',
          storeCity: 'دير البلح',
          price: 27,
          quantity: 1,
          image: '/canaan_zaatar_heritage_1788788500386.jpg',
        },
        {
          id: 'item-303',
          title: 'إبريق فخار مسامي معتق مبرد طبيعي',
          storeName: 'أواني الفخار الأصيل',
          storeCity: 'الزوايدة',
          price: 120,
          quantity: 1,
          image: '/canaan_store_pottery_1788865183231.jpg',
        },
        {
          id: 'item-304',
          title: 'صحن فخار تقديم ضيافة تراثي مسنن',
          storeName: 'أواني الفخار الأصيل',
          storeCity: 'الزوايدة',
          price: 100,
          quantity: 1,
          image: '/canaan_store_pottery_1788865183231.jpg',
        },
      ],
      timeline: [
        {
          status: 'delivered',
          title: 'مكتملة ومسلمة',
          description: 'تم تسليم الطرد الموحد وفحصه بالكامل',
          time: '18 أكتوبر 2026',
          isCompleted: true,
          isCurrent: false,
        },
      ],
    },
  ];

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'active') return order.status === 'active';
    if (activeTab === 'delivered') return order.status === 'delivered';
    return true;
  });

  const activeCount = orders.filter((o) => o.status === 'active').length;
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;

  return (
    <main className="w-full max-w-[1240px] mx-auto px-4 py-5 sm:py-7 pb-24 text-right font-almarai space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between pb-3.5 border-b border-brand-border/80">
        <div className="space-y-0.5">
          <span className="text-[11px] font-bold text-brand-primary block">
            حسابي
          </span>
          <h1 className="text-lg sm:text-xl font-black text-brand-dark tracking-tight m-0">
            سجل الطلبات
          </h1>
        </div>

        <Link
          href="/account"
          className="text-xs font-bold text-brand-muted hover:text-brand-dark py-2 px-3.5 rounded-[8px] border border-brand-border bg-brand-card shadow-2xs transition-colors no-underline flex items-center gap-1.5 active:scale-95"
        >
          <span>←</span>
          <span>العودة لحسابي</span>
        </Link>
      </div>

      {/* Guest Notice if not logged in */}
      {!isAuthenticated && (
        <div className="p-3.5 rounded-[12px] bg-amber-500/10 border border-amber-500/20 text-amber-900 text-xs flex items-center justify-between flex-wrap gap-2">
          <span className="font-medium">
            يرجى تسجيل الدخول لمزامنة طلباتك ومتابعة شحناتك الحية تلقائياً.
          </span>
          <Link
            href="/auth/login?redirect=/orders"
            className="px-3.5 py-1.5 rounded-[8px] bg-brand-primary text-white font-black text-xs no-underline active:scale-95 shadow-2xs"
          >
            تسجيل الدخول
          </Link>
        </div>
      )}

      {/* Segmented Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-[10px] bg-brand-surface border border-brand-border w-fit select-none">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-[7px] text-xs font-black transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-brand-card text-brand-dark shadow-2xs border border-brand-border/60'
              : 'text-brand-muted hover:text-brand-dark'
          }`}
        >
          الكل ({orders.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={`px-3.5 py-1.5 rounded-[7px] text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'active'
              ? 'bg-brand-card text-brand-primary shadow-2xs border border-brand-border/60'
              : 'text-brand-muted hover:text-brand-dark'
          }`}
        >
          <span>قيد التوصيل</span>
          {activeCount > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('delivered')}
          className={`px-3.5 py-1.5 rounded-[7px] text-xs font-black transition-all cursor-pointer ${
            activeTab === 'delivered'
              ? 'bg-brand-card text-brand-trust shadow-2xs border border-brand-border/60'
              : 'text-brand-muted hover:text-brand-dark'
          }`}
        >
          المكتملة ({deliveredCount})
        </button>
      </div>

      {/* 2-Column Responsive Grid (Matches /account Desktop Proportions) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {filteredOrders.length === 0 ? (
          <div className="lg:col-span-2 p-8 sm:p-12 rounded-[14px] bg-brand-card border border-brand-border text-center space-y-3.5 shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center mx-auto text-brand-muted">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <h3 className="text-sm font-black text-brand-dark m-0">لا توجد طلبيات في هذا التبويب</h3>
            <p className="text-xs text-brand-muted m-0 max-w-sm mx-auto">
              تصفح متاجر المحافظة الوسطى وابدأ تسوقك الآن بطرد موحد مع حق المعاينة عند الباب.
            </p>
            <div className="pt-1">
              <Link
                href="/explore"
                className="inline-flex items-center justify-center px-4 py-2 rounded-[8px] bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-black no-underline active:scale-95 shadow-xs"
              >
                <span>استكشف دليل المتاجر</span>
                <span className="mr-1.5">←</span>
              </Link>
            </div>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isActive = order.status === 'active';
            const extraItemsCount = order.items.length > 3 ? order.items.length - 3 : 0;
            const visibleThumbnails = order.items.slice(0, 3);

            return (
              <div
                key={order.id}
                className={`p-4 sm:p-5 rounded-[14px] bg-brand-card border transition-all ${
                  isActive
                    ? 'border-brand-primary/40 shadow-xs ring-1 ring-brand-primary/20'
                    : 'border-brand-border shadow-2xs hover:border-brand-border-strong'
                } space-y-3.5`}
              >
                {/* Order Top Bar */}
                <div className="flex items-center justify-between pb-3 border-b border-brand-border/60 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-black text-brand-dark font-mono">
                      طلب #{order.id}
                    </span>
                    <span className="text-[11px] text-brand-muted">• {order.date}</span>
                  </div>

                  <span
                    className={`text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                      isActive
                        ? 'text-brand-primary bg-[var(--brand-primary-soft)] border-[var(--brand-primary-border)]'
                        : 'text-brand-trust bg-[var(--brand-trust-soft)] border-[var(--brand-trust-border)]'
                    }`}
                  >
                    {isActive ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                        <span>قيد التوصيل</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3 text-brand-trust" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>تم التسليم</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Thumbnails Row & Destination info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {visibleThumbnails.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedOrder(order)}
                        className="relative w-12 h-12 rounded-[8px] border border-brand-border overflow-hidden bg-brand-surface shrink-0 cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-2xs group"
                        title={item.title}
                      >
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    ))}

                    {extraItemsCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="w-12 h-12 rounded-[8px] border border-dashed border-brand-border bg-brand-surface flex items-center justify-center text-xs font-black text-brand-dark hover:border-brand-primary transition-all cursor-pointer shadow-2xs active:scale-95"
                        title="عرض باقي المنتجات"
                      >
                        +{extraItemsCount}
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-brand-muted m-0 truncate">
                    <span>{order.destination.town}</span>
                    <span className="mx-1">•</span>
                    <span className="text-brand-dark font-medium">{order.vendorNames.join('، ')}</span>
                    <span className="mx-1">({order.itemsCount} منتجات)</span>
                  </p>
                </div>

                {/* Footer Bar: Total Price + Clean Action Buttons */}
                <div className="pt-3 border-t border-brand-border/60 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-base sm:text-lg font-black text-brand-dark font-mono block leading-none">
                      {order.total.toFixed(2)} ₪
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {order.courier && isActive && (
                      <a
                        href={`tel:${order.courier.phone}`}
                        className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-[8px] bg-brand-surface border border-brand-border hover:border-brand-trust hover:text-brand-trust text-brand-dark text-xs font-bold transition-all active:scale-95 shadow-2xs inline-flex items-center gap-1.5 no-underline"
                        title="اتصال بالمندوب"
                      >
                        <svg className="w-3.5 h-3.5 text-brand-trust" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        <span>اتصال</span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="h-8 sm:h-9 px-3 sm:px-3.5 rounded-[8px] bg-brand-surface border border-brand-border text-brand-dark hover:text-brand-primary hover:border-brand-primary text-xs font-bold transition-all active:scale-95 shadow-2xs cursor-pointer"
                    >
                      تفاصيل الفاتورة
                    </button>

                    {isActive && (
                      <Link
                        href={`/tracking?orderId=${order.id}`}
                        className="h-8 sm:h-9 px-3 sm:px-3.5 rounded-[8px] bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-black no-underline shadow-2xs transition-all active:scale-95 inline-flex items-center gap-1"
                      >
                        <span>تتبع الشحنة</span>
                        <span>←</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Interactive Order Details Drawer */}
      {selectedOrder && (
        <OrderDetailsDrawer
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </main>
  );
}
