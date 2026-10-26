'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { AdminStoreItem } from '../types/admin.types';
import { AdminStoreDetailsModal } from './AdminStoreDetailsModal';

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
  const [selectedStore, setSelectedStore] = useState<AdminStoreItem | null>(null);

  // When zero pending stores exist, return null to eliminate empty boxes completely
  if (pendingStores.length === 0) {
    return null;
  }

  return (
    <div className="bg-brand-card rounded-2xl border border-brand-primary-border shadow-xs overflow-hidden font-almarai text-right animate-in fade-in">
      {/* Alert Header */}
      <div className="p-4 sm:p-5 bg-brand-primary-soft/40 border-b border-brand-primary-border/60 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-primary animate-pulse" />
          <h3 className="text-sm font-black text-brand-dark">
            طلبات انضمام معلقة تنتظر المراجعة والاعتماد
          </h3>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-brand-primary text-white shadow-2xs">
            {pendingStores.length} طلب جديد
          </span>
        </div>

        <Link
          href="/admin/stores"
          className="text-xs font-bold text-brand-primary hover:text-brand-primary-hover transition-colors inline-flex items-center gap-1"
        >
          <span>إدارة شبكة المتاجر كاملة</span>
          <span className="text-[10px]">&larr;</span>
        </Link>
      </div>

      {/* Pending Items List */}
      <div className="divide-y divide-brand-border/40">
        {pendingStores.map((store) => {
          const city = store.address?.city || 'المحافظة الوسطى';
          const ownerPhone = store.ownerId?.phoneNumber || 'غير محدد';
          const ownerName = store.ownerId?.name || 'تاجر جديد';

          return (
            <div
              key={store._id}
              className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-brand-surface/40 transition-colors"
            >
              {/* Store Profile Info */}
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="w-12 h-12 rounded-2xl bg-brand-surface border border-brand-border overflow-hidden shrink-0 flex items-center justify-center text-xs font-black text-brand-dark shadow-2xs">
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

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black text-brand-dark truncate">
                      {store.name}
                    </span>
                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-brand-primary-soft text-brand-primary border border-brand-primary-border">
                      طلب جديد
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                      {city}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-brand-muted font-medium flex-wrap">
                    <span>المالك: <strong className="text-brand-dark">{ownerName}</strong></span>
                    <span className="text-brand-border">&bull;</span>
                    <span>الهاتف: <span dir="ltr" className="font-mono text-brand-dark">{ownerPhone}</span></span>
                  </div>
                </div>
              </div>

              {/* Actions: In-Place Modal Inspection */}
              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedStore(store)}
                  className="px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-black hover:bg-brand-primary-hover transition-all cursor-pointer active:scale-95 shadow-xs"
                >
                  معاينة وفحص الطلب
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Store Inspection Modal */}
      <AdminStoreDetailsModal
        store={selectedStore}
        isOpen={Boolean(selectedStore)}
        onClose={() => setSelectedStore(null)}
        onApprove={(id) => {
          setSelectedStore(null);
          onApprove(id);
        }}
        onReject={(id) => {
          setSelectedStore(null);
          onReject(id);
        }}
        isBusy={isBusy}
      />
    </div>
  );
};
