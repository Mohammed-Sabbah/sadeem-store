'use client';

import React from 'react';
import Link from 'next/link';
import type { AdminStoreItem } from '../types/admin.types';

interface AdminRecentApplicationsProps {
  pendingStores: AdminStoreItem[];
  onApprove: (storeId: string) => void;
  onReject: (storeId: string) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
}

export const AdminRecentApplications: React.FC<AdminRecentApplicationsProps> = ({
  pendingStores,
  onApprove,
  onReject,
  isApproving = false,
  isRejecting = false,
}) => {
  const isBusy = isApproving || isRejecting;

  return (
    <div className="bg-brand-card rounded-2xl border border-brand-border shadow-2xs overflow-hidden font-almarai text-right">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-brand-border/70 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
          <h3 className="text-sm font-black text-brand-dark">
            طلبات انضمام المتاجر الجديدة
          </h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-surface text-brand-muted border border-brand-border">
            {pendingStores.length} معلق
          </span>
        </div>

        <Link
          href="/admin/stores"
          className="text-xs font-bold text-brand-primary hover:text-brand-primary-hover transition-colors"
        >
          عرض شبكة المتاجر كاملة &larr;
        </Link>
      </div>

      {/* Content */}
      {pendingStores.length === 0 ? (
        <div className="p-8 text-center space-y-2 bg-brand-surface/20">
          <div className="w-10 h-10 rounded-xl bg-brand-card border border-brand-border text-brand-trust flex items-center justify-center mx-auto shadow-2xs">
            <svg className="w-5 h-5 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-xs font-bold text-brand-dark">لا توجد طلبات انضمام معلقة حالياً</p>
          <p className="text-[11px] text-brand-muted">كافة طلبات المتاجر في المحافظة الوسطى تمت مراجعتها والبت فيها.</p>
        </div>
      ) : (
        <div className="divide-y divide-brand-border/40">
          {pendingStores.map((store) => {
            const city = store.address?.city || 'المحافظة الوسطى';
            const ownerPhone = store.ownerId?.phoneNumber || 'غير محدد';
            const ownerName = store.ownerId?.name || 'تاجر جديد';

            return (
              <div
                key={store._id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-brand-surface/40 transition-colors"
              >
                {/* Store Profile Info */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-brand-surface border border-brand-border overflow-hidden shrink-0 flex items-center justify-center text-xs font-black text-brand-dark shadow-2xs">
                    {store.logo ? (
                      <img
                        src={store.logo}
                        alt={store.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      store.name.charAt(0)
                    )}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-brand-dark truncate">
                        {store.name}
                      </span>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-brand-primary-soft text-brand-primary border border-brand-primary-border">
                        طلب جديد
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-brand-muted font-medium flex-wrap">
                      <span>المالك: <strong className="text-brand-dark">{ownerName}</strong></span>
                      <span>&bull;</span>
                      <span>الهاتف: <span dir="ltr">{ownerPhone}</span></span>
                      <span>&bull;</span>
                      <span className="text-brand-trust font-bold">{city}</span>
                    </div>
                  </div>
                </div>

                {/* Direct Approval Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => onReject(store._id)}
                    disabled={isBusy}
                    className="px-3.5 py-2 rounded-xl border border-brand-border text-xs font-bold text-brand-muted hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer active:scale-95 disabled:opacity-40"
                  >
                    رفض الطلب
                  </button>

                  <button
                    type="button"
                    onClick={() => onApprove(store._id)}
                    disabled={isBusy}
                    className="px-4 py-2 rounded-xl bg-brand-trust hover:bg-brand-trust/90 text-white text-xs font-black transition-colors cursor-pointer active:scale-95 shadow-xs disabled:opacity-40"
                  >
                    اعتماد وتفعيل المتجر
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
