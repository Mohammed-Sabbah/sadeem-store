'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import type { OrderDetail } from '../types/order.types';

interface OrderDetailsDrawerProps {
  order: OrderDetail | null;
  onClose: () => void;
}

const formatPrice = (val: number) => {
  return Number.isInteger(val) ? `${val} ₪` : `${val.toFixed(2)} ₪`;
};

export const OrderDetailsDrawer: React.FC<OrderDetailsDrawerProps> = ({ order, onClose }) => {
  useEffect(() => {
    if (!order) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [order, onClose]);

  if (!order) return null;

  const isActive = order.status === 'active';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[105] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 font-almarai text-right select-none"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-brand-card rounded-t-[20px] sm:rounded-[16px] border border-brand-border shadow-2xl max-h-[88vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator */}
        <div className="w-10 h-1 bg-brand-border rounded-full mx-auto my-2 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-border/60 px-4 sm:px-5 py-3 shrink-0 bg-brand-surface/40">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-black text-brand-dark">
                تفاصيل الطلب
              </span>
              <span className="font-mono text-xs font-black px-2 py-0.5 rounded-[6px] bg-brand-card border border-brand-border text-brand-primary">
                #{order.id}
              </span>
            </div>
            <span className="text-[11px] text-brand-muted block">
              {order.date} • {order.itemsCount} منتجات
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-[8px] border border-brand-border bg-brand-surface text-brand-muted hover:text-brand-dark flex items-center justify-center transition-all cursor-pointer active:scale-90"
            title="إغلاق"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-3.5 space-y-3.5">
          {/* Active Courier Strip */}
          {isActive ? (
            <div className="p-3 rounded-[10px] bg-brand-surface border border-brand-border/80 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-trust" />
                </span>
                <span className="text-xs font-bold text-brand-dark truncate">
                  {order.courier ? `مع الكابتن ${order.courier.name} باتجاه عنوانك` : order.statusText}
                </span>
              </div>

              {order.courier && (
                <a
                  href={`tel:${order.courier.phone}`}
                  className="h-7 px-2.5 rounded-[6px] bg-brand-trust text-white text-xs font-bold inline-flex items-center gap-1 active:scale-95 no-underline shrink-0 shadow-2xs"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span>اتصال</span>
                </a>
              )}
            </div>
          ) : (
            <div className="p-2.5 rounded-[8px] bg-brand-surface border border-brand-border/60 flex items-center gap-2 text-xs font-bold text-brand-trust">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>تم التسليم والمعاينة بنجاح</span>
            </div>
          )}

          {/* Itemized Products */}
          <div className="space-y-1.5">
            <span className="text-xs font-black text-brand-dark block">
              المنتجات ({order.items.length})
            </span>

            <div className="divide-y divide-brand-border/60 border-y border-brand-border/60">
              {order.items.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-11 h-11 rounded-[8px] object-cover border border-brand-border bg-stone-100 shrink-0"
                    />
                    <div className="min-w-0 space-y-0.5">
                      <h4 className="text-xs font-bold text-brand-dark truncate m-0">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[10px] text-brand-muted">
                        <span>{item.storeName}</span>
                        {item.variant && (
                          <>
                            <span>•</span>
                            <span className="text-brand-dark">{item.variant}</span>
                          </>
                        )}
                      </div>
                      <span className="text-[10px] text-brand-muted block font-mono">
                        {item.quantity > 1 ? `${item.quantity} × ${formatPrice(item.price)}` : `الكمية: 1`}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs sm:text-sm font-black font-mono text-brand-dark shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="space-y-1 text-xs">
            <span className="text-xs font-black text-brand-dark block">
              عنوان الاستلام
            </span>
            <p className="text-brand-dark m-0">
              {order.destination.town}، {order.destination.detailedAddress}
              {order.destination.landmark && (
                <span className="text-brand-muted"> ({order.destination.landmark})</span>
              )}
            </p>
            <p className="text-[11px] text-brand-muted m-0 font-mono">
              {order.destination.recipientName} • <span dir="ltr">{order.destination.phone}</span>
            </p>
          </div>

          {/* Financial Summary */}
          <div className="pt-2 border-t border-brand-border/60 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-brand-muted">
              <span>المنتجات:</span>
              <span className="font-mono font-bold text-brand-dark">{formatPrice(order.subtotal)}</span>
            </div>

            <div className="flex items-center justify-between text-brand-muted">
              <span>التوصيل:</span>
              <span className="font-mono font-bold text-brand-trust">{formatPrice(order.deliveryFee)}</span>
            </div>

            <div className="flex items-center justify-between text-brand-muted">
              <span>الدفع:</span>
              <span className="text-brand-dark font-medium">{order.paymentMethod}</span>
            </div>

            <div className="pt-2 border-t border-brand-border/60 flex items-center justify-between">
              <span className="text-sm font-black text-brand-dark">الإجمالي:</span>
              <span className="text-base sm:text-lg font-black font-mono text-brand-primary">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="p-3 border-t border-brand-border/60 bg-brand-card/98 backdrop-blur-md shrink-0 flex items-center gap-2">
          {isActive ? (
            <Link
              href={`/tracking?orderId=${order.id}`}
              className="w-full h-10 rounded-[8px] bg-brand-primary text-white text-xs sm:text-sm font-black shadow-md hover:bg-brand-primary-hover active:scale-95 transition-all inline-flex items-center justify-center gap-1.5 no-underline"
            >
              <span>تتبع مسار الشحنة</span>
              <span>←</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full h-10 rounded-[8px] bg-brand-surface border border-brand-border text-brand-dark text-xs font-bold hover:bg-brand-card active:scale-95 transition-all cursor-pointer"
            >
              إغلاق
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
