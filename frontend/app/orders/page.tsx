'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { orderService } from '@/features/orders/services/order.service';
import type { BackendOrder, OrderDetail, OrderItem } from '@/features/orders/types/order.types';
import { OrderDetailsDrawer } from '@/features/orders/components/OrderDetailsDrawer';

interface UnifiedStoreGroup {
  storeId: string;
  storeName: string;
  storeLogo?: string | null;
  items: Array<{
    id: string;
    variantId: string;
    title: string;
    image: string;
    price: number;
    quantity: number;
    status: 'active' | 'inActive';
    variantDetails?: string;
  }>;
}

interface UnifiedParcel {
  orderGroupId: string;
  date: string;
  status: 'pending' | 'delivered' | 'cancelled';
  statusText: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryAddress: string;
  deliveryPhone: string;
  stores: UnifiedStoreGroup[];
  allThumbnails: string[];
  totalItemsCount: number;
  subOrders: BackendOrder[];
}

const formatPrice = (val: number) => {
  return Number.isInteger(val) ? `${val} ₪` : `${val.toFixed(2)} ₪`;
};

export default function OrdersPage() {
  const { user, isAuthenticated, isLoading: authLoading, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'delivered' | 'cancelled'>('all');
  const [backendOrders, setBackendOrders] = useState<BackendOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);

  // Cancellation state
  const [confirmCancelGroupId, setConfirmCancelGroupId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoadingOrders(false);
      return;
    }
    setIsLoadingOrders(true);
    try {
      const res = await orderService.getCustomerOrders({ limit: 100 });
      if (res.success && res.data) {
        setBackendOrders(Array.isArray(res.data.orders) ? res.data.orders : []);
      } else {
        setBackendOrders([]);
      }
    } catch {
      setBackendOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authLoading) {
      fetchOrders();
    }
  }, [authLoading, fetchOrders]);

  // Group sub-orders by orderGroupId
  const parcels = useMemo<UnifiedParcel[]>(() => {
    const safeOrders = Array.isArray(backendOrders) ? backendOrders : [];
    const map = new Map<string, {
      orderGroupId: string;
      createdAt: string;
      subtotal: number;
      deliveryAddress: string;
      deliveryPhone: string;
      storesMap: Map<string, UnifiedStoreGroup>;
      subOrders: BackendOrder[];
    }>();

    for (const order of safeOrders) {
      const groupId = order.orderGroupId || order._id;
      if (!map.has(groupId)) {
        map.set(groupId, {
          orderGroupId: groupId,
          createdAt: order.createdAt,
          subtotal: 0,
          deliveryAddress: order.deliveryAddress,
          deliveryPhone: order.deliveryPhone,
          storesMap: new Map(),
          subOrders: [],
        });
      }

      const parcelEntry = map.get(groupId)!;
      parcelEntry.subOrders.push(order);
      parcelEntry.subtotal += order.subtotal;

      const storeId = typeof order.storeId === 'object' ? order.storeId._id : String(order.storeId);
      const storeName = typeof order.storeId === 'object' ? order.storeId.name : 'متجر معتمد';
      const storeLogo = typeof order.storeId === 'object' ? order.storeId.logo : null;

      if (!parcelEntry.storesMap.has(storeId)) {
        parcelEntry.storesMap.set(storeId, {
          storeId,
          storeName,
          storeLogo,
          items: [],
        });
      }

      const storeGroup = parcelEntry.storesMap.get(storeId)!;
      for (const item of order.items) {
        storeGroup.items.push({
          id: String(item.variantId || item.productId),
          variantId: String(item.variantId),
          title: item.productTitle,
          image: item.image || '/placeholder_product.svg',
          price: item.unitPrice,
          quantity: item.quantity,
          status: item.status,
          variantDetails: item.variantDetails,
        });
      }
    }

    const list: UnifiedParcel[] = [];
    for (const entry of map.values()) {
      // Determine overall parcel status:
      // If any sub-order is pending -> parcel is pending
      // If all sub-orders are cancelled -> cancelled
      // If all delivered -> delivered
      const allCancelled = entry.subOrders.every((o) => o.status === 'cancelled');
      const anyPending = entry.subOrders.some((o) => o.status === 'pending');
      const allDelivered = entry.subOrders.every((o) => o.status === 'delivered');

      let status: 'pending' | 'delivered' | 'cancelled' = 'pending';
      let statusText = 'قيد التجهيز والتجميع بمستودع سَدِيم الموحد';

      if (allCancelled) {
        status = 'cancelled';
        statusText = 'ملغي · تم استرداد المبلغ بالكامل إلى المحفظة';
      } else if (allDelivered) {
        status = 'delivered';
        statusText = 'تم التسليم والمعاينة بنجاح عند الباب';
      } else if (anyPending) {
        status = 'pending';
        statusText = 'قيد المعالجة والتجهيز بمستودع سَدِيم';
      }

      const stores = Array.from(entry.storesMap.values());
      const allThumbnails: string[] = [];
      let totalItemsCount = 0;

      for (const store of stores) {
        for (const item of store.items) {
          totalItemsCount += item.quantity;
          if (item.image && !allThumbnails.includes(item.image)) {
            allThumbnails.push(item.image);
          }
        }
      }

      const deliveryFee = entry.subtotal > 0 ? 10 : 0;
      const total = entry.subtotal + deliveryFee;

      const dateObj = new Date(entry.createdAt);
      const dateStr = !isNaN(dateObj.getTime())
        ? dateObj.toLocaleDateString('ar-EG', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'طلب حديث';

      list.push({
        orderGroupId: entry.orderGroupId,
        date: dateStr,
        status,
        statusText,
        subtotal: entry.subtotal,
        deliveryFee,
        total,
        deliveryAddress: entry.deliveryAddress,
        deliveryPhone: entry.deliveryPhone,
        stores,
        allThumbnails,
        totalItemsCount,
        subOrders: entry.subOrders,
      });
    }

    return list;
  }, [backendOrders]);

  // Filtered parcels based on tab
  const filteredParcels = useMemo(() => {
    if (activeTab === 'all') return parcels;
    return parcels.filter((p) => p.status === activeTab);
  }, [parcels, activeTab]);

  // Convert UnifiedParcel to OrderDetail for the existing drawer
  const openDrawerForParcel = (parcel: UnifiedParcel) => {
    const flatItems: OrderItem[] = [];
    for (const store of parcel.stores) {
      for (const it of store.items) {
        flatItems.push({
          id: it.id,
          title: it.title,
          storeName: store.storeName,
          price: it.price,
          quantity: it.quantity,
          image: it.image,
          variant: it.variantDetails,
          variantId: it.variantId,
          status: it.status,
        });
      }
    }

    const detail: OrderDetail = {
      id: parcel.orderGroupId,
      orderGroupId: parcel.orderGroupId,
      date: parcel.date,
      status: parcel.status,
      statusText: parcel.statusText,
      itemsCount: parcel.totalItemsCount,
      vendorNames: parcel.stores.map((s) => s.storeName),
      subtotal: parcel.subtotal,
      deliveryFee: parcel.deliveryFee,
      total: parcel.total,
      paymentMethod: 'محفظة سَدِيم الرقمية',
      destination: {
        town: 'المحافظة الوسطى',
        area: 'المحافظة الوسطى',
        detailedAddress: parcel.deliveryAddress,
        recipientName: user?.name || 'الزبون الكريم',
        phone: parcel.deliveryPhone,
      },
      items: flatItems,
      timeline: [
        {
          status: 'placed',
          title: 'تم تأكيد وحجز الطلب',
          description: 'خصم من رصيد محفظة سَدِيم بمعاملة ذرية',
          isCompleted: true,
          isCurrent: parcel.status === 'pending',
        },
        {
          status: 'assembled',
          title: 'تجميع الطرد الموحد',
          description: 'فحص الجودة وتغليف شحنة المتاجر بمستودع سَدِيم المركزي',
          isCompleted: parcel.status === 'delivered',
          isCurrent: false,
        },
        {
          status: 'out_for_delivery',
          title: 'مع المندوب الميداني',
          description: 'انطلاق مندوب سَدِيم إلى العنوان المحدد',
          isCompleted: parcel.status === 'delivered',
          isCurrent: false,
        },
        {
          status: 'delivered',
          title: 'المعاينة عند الباب قبل السداد',
          description: 'حق الزبون الأصيل في فحص وتجربة المنتجات',
          isCompleted: parcel.status === 'delivered',
          isCurrent: parcel.status === 'delivered',
        },
      ],
      subOrders: parcel.subOrders,
    };

    setSelectedOrder(detail);
  };

  const handleConfirmCancel = async () => {
    if (!confirmCancelGroupId) return;
    setIsCancelling(true);
    setCancelFeedback(null);

    const parcelToCancel = parcels.find((p) => p.orderGroupId === confirmCancelGroupId);

    try {
      const res = await orderService.cancelOrder(confirmCancelGroupId);
      if (res.success) {
        // Optimistically update local orders
        setBackendOrders((prev) =>
          (Array.isArray(prev) ? prev : []).map((o) =>
            o.orderGroupId === confirmCancelGroupId || o._id === confirmCancelGroupId
              ? { ...o, status: 'cancelled' }
              : o
          )
        );

        if (user && parcelToCancel) {
          updateUser({
            walletBalance: (user.walletBalance || 0) + parcelToCancel.total,
          });
        }

        setCancelFeedback({
          type: 'success',
          message: `تم إلغاء الطلب الموحد بنجاح. أُعيد مبلغ (${formatPrice(parcelToCancel?.total || 0)}) كاملاً إلى محفظتك.`,
        });
        setConfirmCancelGroupId(null);
      } else {
        setCancelFeedback({
          type: 'error',
          message: res.message || 'تعذر إلغاء الطلب، يرجى المحاولة لاحقاً',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء إلغاء الطلب';
      setCancelFeedback({ type: 'error', message: msg });
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-dark font-almarai selection:bg-brand-primary-soft selection:text-brand-primary">
      <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6">
        
        {/* Feedback Alert Toast */}
        {cancelFeedback && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-xs sm:text-sm font-bold animate-in fade-in slide-in-from-top-2 duration-200 ${
              cancelFeedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{cancelFeedback.type === 'success' ? '✓' : '⚠️'}</span>
              <span>{cancelFeedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setCancelFeedback(null)}
              className="text-stone-400 hover:text-stone-700 text-sm font-black cursor-pointer bg-transparent border-0"
            >
              ✕
            </button>
          </div>
        )}

        {/* Page Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-brand-border/60 pb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-brand-dark tracking-tight m-0">
              طلباتي وشحناتي الموحدة
            </h1>
            <p className="text-xs sm:text-sm text-brand-muted mt-1 m-0">
              متابعة الطرود المجمعة من متاجر المحافظة الوسطى ومسار المندوب الميداني
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/account/wallet"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-brand-border text-xs font-bold text-brand-dark hover:border-brand-primary transition-all no-underline shadow-2xs"
            >
              <svg className="w-4 h-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span>المحفظة: {user?.walletBalance ?? 0} ₪</span>
            </Link>
          </div>
        </header>

        {/* Status Filter Tabs */}
        <nav className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" aria-label="فلاتر حالات الطلبات">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              activeTab === 'all'
                ? 'bg-brand-dark text-white border-brand-dark'
                : 'bg-white text-brand-muted border-brand-border hover:border-brand-primary/40'
            }`}
          >
            كافة الطلبات ({parcels.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              activeTab === 'pending'
                ? 'bg-brand-primary text-white border-brand-primary'
                : 'bg-white text-brand-muted border-brand-border hover:border-brand-primary/40'
            }`}
          >
            قيد التجهيز ({parcels.filter((p) => p.status === 'pending').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('delivered')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              activeTab === 'delivered'
                ? 'bg-brand-trust text-white border-brand-trust'
                : 'bg-white text-brand-muted border-brand-border hover:border-brand-primary/40'
            }`}
          >
            المكتملة ({parcels.filter((p) => p.status === 'delivered').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cancelled')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              activeTab === 'cancelled'
                ? 'bg-stone-700 text-white border-stone-700'
                : 'bg-white text-brand-muted border-brand-border hover:border-brand-primary/40'
            }`}
          >
            الملغاة ({parcels.filter((p) => p.status === 'cancelled').length})
          </button>
        </nav>

        {/* Content Body */}
        {!isAuthenticated && !authLoading ? (
          <div className="py-16 px-4 text-center rounded-2xl bg-white border border-brand-border/60 flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center text-brand-muted">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-base font-black text-brand-dark m-0">سجّل دخولك لمتابعة شحناتك</h3>
            <p className="text-xs text-brand-muted max-w-sm m-0 leading-relaxed">
              يرجى تسجيل الدخول إلى حسابك في سَدِيم لتتمكن من استعراض طلباتك ومتابعة مسار المندوب الميداني.
            </p>
            <div className="pt-2">
              <Link
                href="/auth/login?redirect=/orders"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover transition-all no-underline shadow-xs"
              >
                <span>تسجيل الدخول إلى حسابي</span>
                <span>←</span>
              </Link>
            </div>
          </div>
        ) : isLoadingOrders ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold text-brand-muted">جاري تحميل طلباتك الموحدة...</span>
          </div>
        ) : filteredParcels.length === 0 ? (
          /* Empty State */
          <div className="py-16 px-4 text-center rounded-2xl bg-white border border-brand-border/60 flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center text-brand-muted">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-base font-black text-brand-dark m-0">لا توجد طلبات في هذا القسم</h3>
            <p className="text-xs text-brand-muted max-w-sm m-0 leading-relaxed">
              تصفح متاجر المحافظة الوسطى وأضف مشترياتك في سلة واحدة ليصلك طرد موحد برسم توصيل 10 ₪ ثابت.
            </p>
            <div className="pt-2">
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover transition-all no-underline shadow-xs"
              >
                <span>استكشف المنتجات والمتاجر</span>
                <span>←</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Orders List */
          <div className="space-y-4">
            {filteredParcels.map((parcel) => {
              const isPending = parcel.status === 'pending';
              const isDelivered = parcel.status === 'delivered';
              const isCancelled = parcel.status === 'cancelled';

              return (
                <article
                  key={parcel.orderGroupId}
                  className="rounded-xl sm:rounded-2xl bg-white border border-brand-border/80 shadow-2xs hover:border-brand-primary/40 transition-all overflow-hidden flex flex-col"
                >
                  {/* Top Bar: Parcel Header */}
                  <div className="p-4 sm:p-5 bg-brand-surface/40 border-b border-brand-border/60 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-black text-brand-dark">
                            طرد سَدِيم الموحد
                          </span>
                          <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-brand-card border border-brand-border text-brand-muted">
                            #{parcel.orderGroupId.substring(parcel.orderGroupId.length - 8).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-[11px] text-brand-muted block mt-0.5">
                          {parcel.date} • {parcel.stores.length} متاجر • {parcel.totalItemsCount} أصناف
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      {isPending && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200/80">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                          </span>
                          <span>قيد التجهيز</span>
                        </span>
                      )}
                      {isDelivered && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-200/80">
                          <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>تم التسليم بنجاح</span>
                        </span>
                      )}
                      {isCancelled && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-600 border border-stone-200">
                          <span>ملغي ومسترد</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stores & Items Breakdown */}
                  <div className="p-4 sm:p-5 space-y-4">
                    {/* Stores List */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-brand-muted font-bold">المتاجر المجمعة:</span>
                      {parcel.stores.map((s) => (
                        <span
                          key={s.storeId}
                          className="px-2.5 py-1 rounded-md bg-brand-surface border border-brand-border/70 text-brand-dark font-bold text-[11px]"
                        >
                          {s.storeName}
                        </span>
                      ))}
                    </div>

                    {/* Thumbnail Strip */}
                    <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                      {parcel.allThumbnails.slice(0, 5).map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt="صورة المنتج"
                          className="w-12 h-12 rounded-lg object-cover border border-brand-border bg-stone-100 shrink-0"
                        />
                      ))}
                      {parcel.allThumbnails.length > 5 && (
                        <div className="w-12 h-12 rounded-lg bg-brand-surface border border-brand-border flex items-center justify-center text-[10px] font-bold text-brand-muted shrink-0">
                          +{parcel.allThumbnails.length - 5}
                        </div>
                      )}
                    </div>

                    {/* Address & Operational Info */}
                    <div className="text-xs text-brand-muted space-y-0.5 border-t border-brand-border/40 pt-3">
                      <div>
                        <strong className="text-brand-dark">عنوان التسليم:</strong> {parcel.deliveryAddress}
                      </div>
                      <div>
                        <strong className="text-brand-dark">هاتف المستلم:</strong> <span dir="ltr">{parcel.deliveryPhone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Footer: Price & Actions */}
                  <div className="p-4 sm:p-5 bg-brand-surface/30 border-t border-brand-border/60 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-brand-muted">إجمالي الفاتورة الموحدة:</span>
                      <span className="text-base sm:text-lg font-black text-brand-primary font-mono">
                        {formatPrice(parcel.total)}
                      </span>
                      <span className="text-[10px] text-brand-muted font-bold">(شامل توصيل 10 ₪)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Cancel Button (Pending Only) */}
                      {isPending && (
                        <button
                          type="button"
                          onClick={() => setConfirmCancelGroupId(parcel.orderGroupId)}
                          className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-all cursor-pointer active:scale-95"
                        >
                          إلغاء الطلب الموحد
                        </button>
                      )}

                      {/* Track Parcel Link */}
                      <Link
                        href={`/tracking?orderId=${parcel.orderGroupId}`}
                        className="px-3 py-1.5 rounded-lg bg-brand-surface hover:bg-brand-border/40 border border-brand-border text-brand-dark text-xs font-bold transition-all flex items-center gap-1.5 no-underline active:scale-95"
                      >
                        <svg className="w-3.5 h-3.5 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>تتبع الشحنة</span>
                      </Link>

                      {/* View Details Button */}
                      <button
                        type="button"
                        onClick={() => openDrawerForParcel(parcel)}
                        className="px-4 py-1.5 rounded-lg bg-brand-dark hover:bg-black text-white text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                      >
                        <span>تفاصيل الفاتورة</span>
                        <span>←</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Reassurance Footer Strip */}
        <footer className="mt-8 p-4 rounded-xl bg-white border border-brand-border/60 flex flex-wrap items-center justify-around gap-4 text-xs text-brand-muted font-bold text-center">
          <div className="flex items-center gap-1.5 text-brand-dark">
            <svg className="w-4 h-4 text-brand-trust" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>طرد موحد لكافة المتاجر برسم 10 ₪</span>
          </div>
          <div className="flex items-center gap-1.5 text-brand-dark">
            <svg className="w-4 h-4 text-brand-trust" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>حق الفحص والتجربة عند الباب قبل السداد</span>
          </div>
          <div className="flex items-center gap-1.5 text-brand-dark">
            <svg className="w-4 h-4 text-brand-trust" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>استرداد فوري للمحفظة عند الإلغاء</span>
          </div>
        </footer>

      </div>

      {/* Order Details Drawer */}
      <OrderDetailsDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />

      {/* Confirm Cancellation Modal */}
      {confirmCancelGroupId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 select-none font-almarai text-right"
          onClick={() => setConfirmCancelGroupId(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl border border-brand-border p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-black text-brand-dark m-0">تأكيد إلغاء الطلب الموحد</h3>
                <p className="text-xs text-brand-muted m-0 mt-0.5">عملية فورية ومحمية</p>
              </div>
            </div>

            <p className="text-xs text-brand-dark leading-relaxed m-0">
              هل أنت متأكد من رغبتك في إلغاء هذا الطلب الموحد؟ سيتم إرجاع كامل المبلغ المدفوع فوراً إلى رصيد محفظتك الرقمية في سَدِيم، وإعادة كميات الأصناف لمخزون المتاجر.
            </p>

            <div className="flex items-center gap-2 pt-2 border-t border-brand-border/60">
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                {isCancelling ? 'جاري الإلغاء والاسترداد...' : 'تأكيد الإلغاء واسترداد المبلغ'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmCancelGroupId(null)}
                disabled={isCancelling}
                className="px-3.5 py-2 rounded-lg bg-brand-surface border border-brand-border text-brand-dark text-xs font-bold hover:bg-brand-card transition-all cursor-pointer"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
