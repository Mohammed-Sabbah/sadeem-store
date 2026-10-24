'use client';

import React, { useEffect } from 'react';
import type { AdminStoreItem } from '../types/admin.types';

interface AdminStoreDetailsModalProps {
  store: AdminStoreItem | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (storeId: string) => void;
  onReject?: (storeId: string) => void;
  onToggleStatus?: (storeId: string) => void;
  isBusy?: boolean;
}

export const AdminStoreDetailsModal: React.FC<AdminStoreDetailsModalProps> = ({
  store,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onToggleStatus,
  isBusy = false,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !store) return null;

  const isPending = store.approveStatus === 'pending';
  const isApproved = store.approveStatus === 'approved';
  const isActive = store.status === 'active';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in select-none font-almarai"
      onClick={onClose}
    >
      <div
        className="bg-brand-card rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-brand-border text-right relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-brand-border/60 pb-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-brand-surface border border-brand-border overflow-hidden flex items-center justify-center font-black text-base text-brand-dark shadow-2xs shrink-0">
              {store.logo ? (
                <img
                  src={store.logo}
                  alt={store.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                store.name.charAt(0)
              )}
            </div>
            <div className="space-y-0.5 min-w-0">
              <h3 className="text-base font-black text-brand-dark truncate">
                {store.name}
              </h3>
              <div className="flex items-center gap-2">
                {isPending ? (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-brand-primary-soft text-brand-primary border border-brand-primary-border">
                    طلب انضمام معلق
                  </span>
                ) : isActive ? (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-brand-trust-soft text-brand-trust border border-brand-trust/30">
                    متجر معتمد ونشط
                  </span>
                ) : (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    متجر مجمد مؤقتاً
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-brand-border bg-brand-surface text-brand-muted hover:text-brand-dark flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Store Info Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-brand-surface/60 rounded-xl p-3 border border-brand-border/60 space-y-1">
            <span className="text-[10px] font-bold text-brand-muted block">بيانات المالك</span>
            <span className="font-black text-brand-dark block">{store.ownerId?.name || 'غير محدد'}</span>
            <span className="text-[11px] font-medium text-brand-muted block">{store.ownerId?.email || 'بدون بريد'}</span>
            <span className="text-[11px] font-medium text-brand-muted dir-ltr block text-right">{store.ownerId?.phoneNumber || 'بدون هاتف'}</span>
          </div>

          <div className="bg-brand-surface/60 rounded-xl p-3 border border-brand-border/60 space-y-1">
            <span className="text-[10px] font-bold text-brand-muted block">الموقع الجغرافي</span>
            <span className="font-black text-brand-trust block">{store.address?.city || 'المحافظة الوسطى'}</span>
            <span className="text-[11px] text-brand-muted block">{store.address?.detailedAddress || 'العنوان التفصيلي غير مدخل'}</span>
          </div>

          <div className="bg-brand-surface/60 rounded-xl p-3 border border-brand-border/60 space-y-1">
            <span className="text-[10px] font-bold text-brand-muted block">المستحقات المالية الحالية</span>
            <span className="text-base font-black text-brand-dark block">{store.balance ?? 0} ₪</span>
          </div>

          <div className="bg-brand-surface/60 rounded-xl p-3 border border-brand-border/60 space-y-1">
            <span className="text-[10px] font-bold text-brand-muted block">تاريخ التسجيل</span>
            <span className="font-bold text-brand-dark block">
              {store.createdAt ? new Date(store.createdAt).toLocaleDateString('ar-EG') : 'غير محدد'}
            </span>
          </div>
        </div>

        {/* Description if any */}
        {store.description && (
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-brand-muted block">نبذة عن المتجر:</span>
            <p className="text-xs text-brand-dark bg-brand-surface/40 p-3 rounded-xl border border-brand-border/60 leading-relaxed">
              {store.description}
            </p>
          </div>
        )}

        {/* Actions Footer */}
        <div className="flex items-center gap-2 pt-2 border-t border-brand-border/60">
          {isPending ? (
            <>
              <button
                type="button"
                onClick={() => {
                  onReject?.(store._id);
                  onClose();
                }}
                disabled={isBusy}
                className="flex-1 h-9 rounded-xl border border-brand-border text-xs font-bold text-brand-muted hover:text-red-600 hover:bg-red-50 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                رفض الطلب
              </button>
              <button
                type="button"
                onClick={() => {
                  onApprove?.(store._id);
                  onClose();
                }}
                disabled={isBusy}
                className="flex-1 h-9 rounded-xl bg-brand-trust text-white text-xs font-black hover:bg-brand-trust/90 active:scale-95 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                اعتماد وتفعيل المتجر
              </button>
            </>
          ) : isApproved ? (
            <button
              type="button"
              onClick={() => {
                onToggleStatus?.(store._id);
                onClose();
              }}
              disabled={isBusy}
              className={`w-full h-9 rounded-xl text-xs font-black active:scale-95 transition-all cursor-pointer shadow-xs ${
                isActive
                  ? 'border border-amber-200 text-amber-700 hover:bg-amber-50'
                  : 'bg-brand-dark text-white hover:bg-brand-dark/90'
              }`}
            >
              {isActive ? 'تجميد هذا المتجر مؤقتاً' : 'إلغاء التجميد وتنشيط المتجر'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
