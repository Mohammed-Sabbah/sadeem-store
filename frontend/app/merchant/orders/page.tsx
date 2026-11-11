'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { orderService } from '@/features/orders/services/order.service';
import type { BackendOrder, BackendOrderItem } from '@/features/orders/types/order.types';

const formatPrice = (val: number) => {
  return Number.isInteger(val) ? `${val} ₪` : `${val.toFixed(2)} ₪`;
};

export default function MerchantOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'delivered' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Order for Modal Drilldown
  const [selectedOrder, setSelectedOrder] = useState<BackendOrder | null>(null);

  // Item cancellation modal state
  const [cancelTarget, setCancelTarget] = useState<{
    orderId: string;
    item: BackendOrderItem;
  } | null>(null);
  const [isCancellingItem, setIsCancellingItem] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const fetchStoreOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await orderService.getStoreOrders({ limit: 100 });
      if (res.success && res.data) {
        setOrders(Array.isArray(res.data.orders) ? res.data.orders : []);
      } else {
        setOrders([]);
      }
    } catch {
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStoreOrders();
  }, [fetchStoreOrders]);

  // Metrics
  const metrics = useMemo(() => {
    const list = Array.isArray(orders) ? orders : [];
    const total = list.length;
    const pending = list.filter((o) => o.status === 'pending').length;
    const delivered = list.filter((o) => o.status === 'delivered').length;
    const cancelled = list.filter((o) => o.status === 'cancelled').length;
    const totalRevenue = list
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.subtotal, 0);

    return { total, pending, delivered, cancelled, totalRevenue };
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    const list = Array.isArray(orders) ? orders : [];
    return list.filter((o) => {
      // Tab filter
      if (activeTab !== 'all' && o.status !== activeTab) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = o._id.toLowerCase().includes(q);
        const matchesUser = o.userId?.name?.toLowerCase().includes(q) || false;
        const matchesPhone = o.deliveryPhone?.includes(q) || false;
        const matchesAddress = o.deliveryAddress?.toLowerCase().includes(q) || false;
        const matchesItem = o.items.some((it) => it.productTitle.toLowerCase().includes(q));

        return matchesId || matchesUser || matchesPhone || matchesAddress || matchesItem;
      }
      return true;
    });
  }, [orders, activeTab, searchQuery]);

  // Handle seller item cancellation
  const handleConfirmItemCancel = async () => {
    if (!cancelTarget) return;
    setIsCancellingItem(true);
    setActionFeedback(null);

    try {
      const res = await orderService.cancelOrderItem(
        cancelTarget.orderId,
        cancelTarget.item.variantId
      );

      if (res.success) {
        // Optimistically update local order and item
        setOrders((prev) =>
          (Array.isArray(prev) ? prev : []).map((ord) => {
            if (ord._id !== cancelTarget.orderId) return ord;

            const updatedItems = ord.items.map((it) =>
              it.variantId === cancelTarget.item.variantId
                ? { ...it, status: 'inActive' as const }
                : it
            );

            const allInactive = updatedItems.every((it) => it.status === 'inActive');
            const newSubtotal = updatedItems
              .filter((it) => it.status === 'active')
              .reduce((sum, it) => sum + it.subtotal, 0);

            return {
              ...ord,
              items: updatedItems,
              subtotal: newSubtotal,
              status: allInactive ? ('cancelled' as const) : ord.status,
            };
          })
        );

        // Also update selectedOrder modal view
        if (selectedOrder && selectedOrder._id === cancelTarget.orderId) {
          setSelectedOrder((prev) => {
            if (!prev) return null;
            const updatedItems = prev.items.map((it) =>
              it.variantId === cancelTarget.item.variantId
                ? { ...it, status: 'inActive' as const }
                : it
            );
            const allInactive = updatedItems.every((it) => it.status === 'inActive');
            const newSubtotal = updatedItems
              .filter((it) => it.status === 'active')
              .reduce((sum, it) => sum + it.subtotal, 0);

            return {
              ...prev,
              items: updatedItems,
              subtotal: newSubtotal,
              status: allInactive ? 'cancelled' : prev.status,
            };
          });
        }

        setActionFeedback({
          type: 'success',
          message: `تم الاعتذار عن صنف "${cancelTarget.item.productTitle}" بنجاح، وأُعيد ثمنه (${formatPrice(cancelTarget.item.subtotal)}) لمحفظة الزبون.`,
        });
        setCancelTarget(null);
      } else {
        setActionFeedback({
          type: 'error',
          message: res.message || 'تعذر إلغاء الصنف، يرجى المحاولة لاحقاً',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء إلغاء الصنف';
      setActionFeedback({ type: 'error', message: msg });
    } finally {
      setIsCancellingItem(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Toast Feedback */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs sm:text-sm font-bold animate-in fade-in slide-in-from-top-2 duration-200 ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{actionFeedback.type === 'success' ? '✓' : '⚠️'}</span>
            <span>{actionFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-stone-400 hover:text-stone-700 text-sm font-black cursor-pointer bg-transparent border-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-brand-border/60 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-brand-dark tracking-tight m-0">
            طلبيات المتجر والشحنات
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted mt-1 m-0">
            استعراض طلبات الزبائن الواردة لمتجرك وتجهيز الأصناف للتسليم لمندوب سَدِيم
          </p>
        </div>

        <button
          type="button"
          onClick={fetchStoreOrders}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-brand-border text-xs font-bold text-brand-dark hover:border-brand-primary transition-all cursor-pointer shadow-2xs self-start sm:self-auto"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>تحديث الطلبات</span>
        </button>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white border border-brand-border/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-brand-muted block">إجمالي الطلبات</span>
          <div className="text-2xl font-black text-brand-dark font-mono">{metrics.total}</div>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-amber-800 block">قيد التجهيز والتسليم</span>
          <div className="text-2xl font-black text-amber-900 font-mono">{metrics.pending}</div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-emerald-800 block">مكتملة ومستلمة</span>
          <div className="text-2xl font-black text-emerald-900 font-mono">{metrics.delivered}</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-brand-border/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-brand-muted block">صافي مبيعات المتجر</span>
          <div className="text-2xl font-black text-brand-primary font-mono">{formatPrice(metrics.totalRevenue)}</div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-brand-border/80 shadow-2xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              activeTab === 'all'
                ? 'bg-brand-dark text-white border-brand-dark'
                : 'bg-brand-surface text-brand-muted border-brand-border hover:border-brand-primary/40'
            }`}
          >
            الكل ({metrics.total})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              activeTab === 'pending'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-brand-surface text-brand-muted border-brand-border hover:border-brand-primary/40'
            }`}
          >
            قيد التجهيز ({metrics.pending})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('delivered')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              activeTab === 'delivered'
                ? 'bg-brand-trust text-white border-brand-trust'
                : 'bg-brand-surface text-brand-muted border-brand-border hover:border-brand-primary/40'
            }`}
          >
            المكتملة ({metrics.delivered})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cancelled')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              activeTab === 'cancelled'
                ? 'bg-stone-700 text-white border-stone-700'
                : 'bg-brand-surface text-brand-muted border-brand-border hover:border-brand-primary/40'
            }`}
          >
            الملغاة ({metrics.cancelled})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برقم الطلب، الزبون، أو الصنف..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-brand-border bg-brand-surface text-brand-dark placeholder:text-brand-muted focus:outline-none focus:border-brand-primary transition-all"
          />
          <svg
            className="w-3.5 h-3.5 text-brand-muted absolute left-2.5 top-1/2 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Orders List / Table */}
      {isLoading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-brand-muted">جاري تحميل طلبيات المتجر...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-16 px-4 text-center rounded-2xl bg-white border border-brand-border/60 flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center text-brand-muted">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h3 className="text-sm font-black text-brand-dark m-0">لا توجد طلبيات تطابق الفلترة الحالية</h3>
          <p className="text-xs text-brand-muted m-0">
            ستظهر هنا أي طلبيات جديدة يطلبها زبائن سَدِيم من متجرك مباشرة.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((ord) => {
            const isPending = ord.status === 'pending';
            const isDelivered = ord.status === 'delivered';
            const isCancelled = ord.status === 'cancelled';
            const activeItemsCount = ord.items.filter((it) => it.status === 'active').length;

            const dateObj = new Date(ord.createdAt);
            const dateStr = !isNaN(dateObj.getTime())
              ? dateObj.toLocaleDateString('ar-EG', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'طلب جديد';

            return (
              <article
                key={ord._id}
                className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white border border-brand-border/80 shadow-2xs hover:border-brand-primary/40 transition-all flex flex-col gap-3.5"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-brand-surface border border-brand-border text-brand-primary">
                      #{ord._id.substring(ord._id.length - 8).toUpperCase()}
                    </span>
                    <span className="text-xs text-brand-muted font-bold">{dateStr}</span>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isPending && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                        </span>
                        <span>قيد التجهيز</span>
                      </span>
                    )}
                    {isDelivered && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-200">
                        <span>✓ تم التسليم</span>
                      </span>
                    )}
                    {isCancelled && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-600 border border-stone-200">
                        <span>ملغي</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Customer & Address Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-brand-muted bg-brand-surface/40 p-3 rounded-xl border border-brand-border/40">
                  <div>
                    <span className="text-brand-dark font-bold block">الزبون:</span>
                    <span>{ord.userId?.name || 'مشتري معتمد'} • <a href={`tel:${ord.deliveryPhone}`} className="text-brand-primary font-mono no-underline hover:underline" dir="ltr">{ord.deliveryPhone}</a></span>
                  </div>
                  <div>
                    <span className="text-brand-dark font-bold block">عنوان الاستلام بالمحافظة الوسطى:</span>
                    <span className="truncate block">{ord.deliveryAddress}</span>
                  </div>
                </div>

                {/* Items preview */}
                <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                  {ord.items.map((it, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 p-1.5 pr-2.5 rounded-lg border text-xs shrink-0 ${
                        it.status === 'inActive'
                          ? 'bg-stone-50 border-stone-200 opacity-60 line-through'
                          : 'bg-white border-brand-border'
                      }`}
                    >
                      <img
                        src={it.image || '/placeholder_product.svg'}
                        alt={it.productTitle}
                        className="w-8 h-8 rounded object-cover border border-brand-border"
                      />
                      <div>
                        <div className="font-bold text-brand-dark max-w-[140px] truncate">{it.productTitle}</div>
                        <div className="text-[10px] text-brand-muted font-mono">{it.quantity} × {formatPrice(it.unitPrice)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Footer */}
                <div className="pt-2 border-t border-brand-border/60 flex items-center justify-between gap-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs text-brand-muted">المجموع لمتجرك:</span>
                    <span className="text-base font-black text-brand-primary font-mono">
                      {formatPrice(ord.subtotal)}
                    </span>
                    <span className="text-[10px] text-brand-muted">({activeItemsCount} أصناف نشطة)</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedOrder(ord)}
                    className="px-3.5 py-1.5 rounded-lg bg-brand-dark hover:bg-black text-white text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                  >
                    <span>معاينة وتجهيز الأصناف</span>
                    <span>←</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Order Inspection & Item Cancellation Modal */}
      {selectedOrder && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 font-almarai text-right select-none"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl border border-brand-border shadow-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-brand-border/60 bg-brand-surface/40 flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-black text-brand-dark">
                    تفاصيل شحنة المتجر
                  </span>
                  <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-brand-card border border-brand-border text-brand-primary">
                    #{selectedOrder._id.substring(selectedOrder._id.length - 8).toUpperCase()}
                  </span>
                </div>
                <span className="text-xs text-brand-muted block mt-0.5">
                  الزبون: {selectedOrder.userId?.name || 'مشتري معتمد'} • {selectedOrder.items.length} أصناف
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-lg border border-brand-border bg-brand-surface text-brand-muted hover:text-brand-dark flex items-center justify-center transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* Recipient Details */}
              <div className="p-3.5 rounded-xl bg-brand-surface border border-brand-border/70 space-y-1.5 text-xs">
                <div className="font-bold text-brand-dark">بيانات التسليم بالمحافظة الوسطى:</div>
                <div className="text-brand-muted">
                  <strong>العنوان:</strong> {selectedOrder.deliveryAddress}
                </div>
                <div className="text-brand-muted">
                  <strong>هاتف التواصل:</strong>{' '}
                  <a
                    href={`tel:${selectedOrder.deliveryPhone}`}
                    className="text-brand-primary font-mono font-bold no-underline hover:underline"
                    dir="ltr"
                  >
                    {selectedOrder.deliveryPhone}
                  </a>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <span className="text-xs font-black text-brand-dark block">
                  الأصناف المطلوبة من متجرك ({selectedOrder.items.length}):
                </span>

                <div className="divide-y divide-brand-border/60 border-y border-brand-border/60">
                  {selectedOrder.items.map((item, idx) => {
                    const isInactive = item.status === 'inActive';
                    const canCancelItem = selectedOrder.status === 'pending' && !isInactive;

                    return (
                      <div key={idx} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={item.image || '/placeholder_product.svg'}
                            alt={item.productTitle}
                            className={`w-12 h-12 rounded-lg object-cover border border-brand-border shrink-0 ${
                              isInactive ? 'opacity-50 grayscale' : ''
                            }`}
                          />
                          <div className="min-w-0 space-y-0.5">
                            <h4 className={`text-xs font-bold truncate m-0 ${isInactive ? 'line-through text-stone-400' : 'text-brand-dark'}`}>
                              {item.productTitle}
                            </h4>
                            {item.variantDetails && (
                              <span className="text-[10px] text-brand-muted block">
                                {item.variantDetails}
                              </span>
                            )}
                            <span className="text-[10px] text-brand-muted block font-mono">
                              الكمية: {item.quantity} × {formatPrice(item.unitPrice)} = {formatPrice(item.subtotal)}
                            </span>
                            {isInactive && (
                              <span className="inline-block text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                                تم الاعتذار عن التوفير • رُد المبلغ للمحفظة
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action: Cancel Item if pending and active */}
                        {canCancelItem && (
                          <button
                            type="button"
                            onClick={() =>
                              setCancelTarget({
                                orderId: selectedOrder._id,
                                item,
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-[11px] font-bold transition-all cursor-pointer shrink-0 active:scale-95"
                            title="الاعتذار عن الصنف لعدم توفره بالمخزون"
                          >
                            غير متوفر ✕
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Subtotal */}
              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="font-bold text-brand-dark">صافي مستحقات هذا الطلب:</span>
                <span className="text-base font-black text-brand-primary font-mono">
                  {formatPrice(selectedOrder.subtotal)}
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-brand-border/60 bg-brand-surface/40 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-lg bg-brand-dark text-white text-xs font-bold hover:bg-black transition-all cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Item Cancellation */}
      {cancelTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 font-almarai text-right select-none"
          onClick={() => setCancelTarget(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl border border-brand-border p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-black text-brand-dark m-0">الاعتذار عن توفير الصنف</h3>
                <p className="text-xs text-brand-muted m-0 mt-0.5">خصم الصنف واسترداد فوري</p>
              </div>
            </div>

            <p className="text-xs text-brand-dark leading-relaxed m-0">
              هل أنت متأكد من الاعتذار عن توفير صنف <strong>"{cancelTarget.item.productTitle}"</strong>؟
              سيتم خصم قيمته (<strong className="text-brand-primary">{formatPrice(cancelTarget.item.subtotal)}</strong>) من إجمالي الطلب وإرجاع المبلغ فوراً لمحفظة الزبون في سَدِيم.
            </p>

            <div className="flex items-center gap-2 pt-2 border-t border-brand-border/60">
              <button
                type="button"
                onClick={handleConfirmItemCancel}
                disabled={isCancellingItem}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                {isCancellingItem ? 'جاري الخصم والاسترداد...' : 'تأكيد الاعتذار والرد للمحفظة'}
              </button>
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                disabled={isCancellingItem}
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
