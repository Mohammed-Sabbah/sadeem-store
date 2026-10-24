'use client';

import React from 'react';
import type { AdminStoreItem } from '../types/admin.types';

interface AdminStoreTableProps {
  stores: AdminStoreItem[];
  onApprove: (storeId: string) => void;
  onReject: (storeId: string) => void;
  onToggleStatus: (storeId: string) => void;
  onViewDetails: (store: AdminStoreItem) => void;
  isBusy?: boolean;
}

export const AdminStoreTable: React.FC<AdminStoreTableProps> = ({
  stores,
  onApprove,
  onReject,
  onToggleStatus,
  onViewDetails,
  isBusy = false,
}) => {
  if (stores.length === 0) {
    return (
      <div className="text-center py-20 px-4 bg-brand-surface/30">
        <div className="w-14 h-14 rounded-2xl bg-brand-card border border-brand-border text-brand-muted flex items-center justify-center mx-auto mb-3.5 shadow-2xs">
          <svg className="w-6 h-6 stroke-[1.75]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 className="text-sm font-black text-brand-dark mb-1">لا توجد متاجر مطابقة</h3>
        <p className="text-xs text-brand-muted max-w-sm mx-auto leading-relaxed">
          لم يتم العثور على أي متجر يتطابق مع معايير البحث والتصفية المحددة.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* 1. Desktop High-Density Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead className="bg-brand-surface/80 border-b border-brand-border text-brand-muted font-bold select-none">
            <tr>
              <th className="py-3 px-5 w-20">الشعار</th>
              <th className="py-3 px-4 min-w-[240px]">اسم المتجر</th>
              <th className="py-3 px-4 w-44">المالك ورقم التواصل</th>
              <th className="py-3 px-4 w-36">المدينة</th>
              <th className="py-3 px-4 w-28">المستحقات</th>
              <th className="py-3 px-4 w-32">حالة المتجر</th>
              <th className="py-3 px-4 w-40 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/40">
            {stores.map((store) => {
              const city = store.address?.city || 'المحافظة الوسطى';
              const ownerName = store.ownerId?.name || 'غير محدد';
              const ownerPhone = store.ownerId?.phoneNumber || 'غير محدد';
              const isPending = store.approveStatus === 'pending';
              const isApproved = store.approveStatus === 'approved';
              const isActive = store.status === 'active';

              return (
                <tr key={store._id} className="hover:bg-brand-surface/60 transition-colors group">
                  {/* Logo */}
                  <td className="py-3.5 px-5">
                    <div className="w-11 h-11 rounded-xl bg-brand-surface overflow-hidden border border-brand-border shrink-0 flex items-center justify-center font-black text-xs text-brand-dark shadow-2xs">
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
                  </td>

                  {/* Store Name & Description */}
                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => onViewDetails(store)}
                      className="text-sm font-black text-brand-dark hover:text-brand-primary block text-right tracking-tight cursor-pointer transition-colors"
                    >
                      {store.name}
                    </button>
                    {store.description && (
                      <p className="text-[11px] text-brand-muted truncate max-w-xs mt-0.5">
                        {store.description}
                      </p>
                    )}
                  </td>

                  {/* Owner */}
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-brand-dark block text-xs">
                      {ownerName}
                    </span>
                    <span className="text-[11px] font-medium text-brand-muted dir-ltr block text-right">
                      {ownerPhone}
                    </span>
                  </td>

                  {/* City */}
                  <td className="py-3.5 px-4">
                    <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-brand-surface text-brand-dark border border-brand-border">
                      {city}
                    </span>
                  </td>

                  {/* Balance */}
                  <td className="py-3.5 px-4">
                    <span className="text-xs font-black text-brand-dark">
                      {store.balance ?? 0} ₪
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4">
                    {isPending ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-brand-primary-soft text-brand-primary border border-brand-primary-border">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                        طلب معلق
                      </span>
                    ) : store.approveStatus === 'rejected' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                        مرفوض
                      </span>
                    ) : isActive ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-brand-trust-soft text-brand-trust border border-brand-trust/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-trust" />
                        معتمد ونشط
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        مجمد مؤقتاً
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {isPending ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onApprove(store._id)}
                            disabled={isBusy}
                            className="px-2.5 py-1 rounded-lg bg-brand-trust text-white text-[11px] font-black hover:bg-brand-trust/90 transition-colors cursor-pointer active:scale-95 disabled:opacity-40"
                          >
                            اعتماد
                          </button>
                          <button
                            type="button"
                            onClick={() => onReject(store._id)}
                            disabled={isBusy}
                            className="px-2.5 py-1 rounded-lg border border-brand-border text-brand-muted hover:text-red-600 hover:bg-red-50 text-[11px] font-bold transition-colors cursor-pointer active:scale-95 disabled:opacity-40"
                          >
                            رفض
                          </button>
                        </>
                      ) : isApproved ? (
                        <button
                          type="button"
                          onClick={() => onToggleStatus(store._id)}
                          disabled={isBusy}
                          className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer active:scale-95 ${
                            isActive
                              ? 'border border-amber-200 text-amber-700 hover:bg-amber-50'
                              : 'bg-brand-dark text-white hover:bg-brand-dark/90'
                          }`}
                        >
                          {isActive ? 'تجميد المتجر' : 'فك التجميد'}
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => onViewDetails(store)}
                        className="p-1.5 rounded-lg text-brand-muted hover:text-brand-dark hover:bg-brand-surface transition-colors cursor-pointer"
                        title="تفاصيل المتجر"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 2. Mobile Card List */}
      <div className="block lg:hidden divide-y divide-brand-border/40">
        {stores.map((store) => {
          const city = store.address?.city || 'المحافظة الوسطى';
          const ownerName = store.ownerId?.name || 'غير محدد';
          const ownerPhone = store.ownerId?.phoneNumber || 'غير محدد';
          const isPending = store.approveStatus === 'pending';
          const isApproved = store.approveStatus === 'approved';
          const isActive = store.status === 'active';

          return (
            <div key={store._id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-brand-surface overflow-hidden border border-brand-border shrink-0 flex items-center justify-center font-black text-xs text-brand-dark shadow-2xs">
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
                    <button
                      type="button"
                      onClick={() => onViewDetails(store)}
                      className="text-sm font-black text-brand-dark block truncate text-right hover:text-brand-primary transition-colors cursor-pointer"
                    >
                      {store.name}
                    </button>
                    <div className="flex items-center gap-2 text-[11px] text-brand-muted">
                      <span>{ownerName}</span>
                      <span>&bull;</span>
                      <span className="text-brand-trust font-bold">{city}</span>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  {isPending ? (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-brand-primary-soft text-brand-primary border border-brand-primary-border">
                      معلق
                    </span>
                  ) : isActive ? (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-brand-trust-soft text-brand-trust border border-brand-trust/30">
                      نشط
                    </span>
                  ) : (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      مجمد
                    </span>
                  )}
                </div>
              </div>

              {/* Mobile Actions Strip */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-brand-border/40">
                <span className="text-xs font-bold text-brand-muted">
                  المستحقات: <strong className="text-brand-dark">{store.balance ?? 0} ₪</strong>
                </span>

                <div className="flex items-center gap-2">
                  {isPending ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onApprove(store._id)}
                        disabled={isBusy}
                        className="px-3 py-1.5 rounded-lg bg-brand-trust text-white text-xs font-black active:scale-95 disabled:opacity-40"
                      >
                        اعتماد
                      </button>
                      <button
                        type="button"
                        onClick={() => onReject(store._id)}
                        disabled={isBusy}
                        className="px-3 py-1.5 rounded-lg border border-brand-border text-brand-muted text-xs font-bold active:scale-95 disabled:opacity-40"
                      >
                        رفض
                      </button>
                    </>
                  ) : isApproved ? (
                    <button
                      type="button"
                      onClick={() => onToggleStatus(store._id)}
                      disabled={isBusy}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold active:scale-95 ${
                        isActive
                          ? 'border border-amber-200 text-amber-700'
                          : 'bg-brand-dark text-white'
                      }`}
                    >
                      {isActive ? 'تجميد' : 'فك التجميد'}
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => onViewDetails(store)}
                    className="p-1.5 rounded-lg border border-brand-border text-brand-muted hover:text-brand-dark"
                  >
                    تفاصيل
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
