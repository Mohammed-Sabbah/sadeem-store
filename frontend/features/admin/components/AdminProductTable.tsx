'use client';

import React from 'react';
import Link from 'next/link';
import { getProductTotalStock } from '../utils/productAdminFilters';

interface AdminProductTableProps {
  products: any[];
  onOpenRejectModal: (product: any) => void;
  onActivateProduct: (productId: string) => void;
  isBusy?: boolean;
}

function getProductPrice(p: any): string {
  const variants = p.variants || [];
  if (variants.length > 0) {
    const prices = variants
      .map((v: any) => Number(v.price) || 0)
      .filter((pr: number) => pr > 0);
    if (prices.length > 0) {
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return min === max ? `${min} ₪` : `${min} – ${max} ₪`;
    }
  }
  const minPrice = Number(p.minPrice ?? p.price ?? 0);
  const maxPrice = Number(p.maxPrice ?? p.price ?? 0);
  return minPrice === maxPrice ? `${minPrice} ₪` : `${minPrice} – ${maxPrice} ₪`;
}

export const AdminProductTable: React.FC<AdminProductTableProps> = ({
  products,
  onOpenRejectModal,
  onActivateProduct,
  isBusy = false,
}) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-20 px-4 bg-brand-surface/30">
        <div className="w-14 h-14 rounded-2xl bg-brand-card border border-brand-border text-brand-muted flex items-center justify-center mx-auto mb-3.5 shadow-2xs">
          <svg className="w-6 h-6 stroke-[1.75]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h3 className="text-sm font-black text-brand-dark mb-1">لا توجد أصناف مطابقة</h3>
        <p className="text-xs text-brand-muted max-w-sm mx-auto leading-relaxed">
          لم يتم العثور على أي منتج يتطابق مع معايير البحث والتصفية المحددة.
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
              <th className="py-3 px-5 w-20">الصورة</th>
              <th className="py-3 px-4 min-w-[280px]">اسم الصنف / المتجر</th>
              <th className="py-3 px-4 w-40">القسم</th>
              <th className="py-3 px-4 w-36">السعر (₪)</th>
              <th className="py-3 px-4 w-32">المخزون</th>
              <th className="py-3 px-4 w-44">حالة الرقابة</th>
              <th className="py-3 px-4 w-36 text-center">إجراءات الرقابة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/40">
            {products.map((p) => {
              const storeName = typeof p.storeId === 'object' ? p.storeId?.name || 'متجر غير معروف' : 'متجر سَدِيم';
              const categoryTitle = typeof p.categoryId === 'object' ? p.categoryId?.title || 'صنف عام' : 'صنف عام';
              const priceLabel = getProductPrice(p);
              const isRejected = p.approveStatus === 'rejected';
              const totalStock = getProductTotalStock(p);
              const hasStock = p.inStock !== false && totalStock > 0;

              return (
                <tr key={p._id} className="hover:bg-brand-surface/60 transition-colors group">
                  {/* Image */}
                  <td className="py-3.5 px-5">
                    <div className="w-12 h-12 rounded-xl bg-brand-surface overflow-hidden border border-brand-border shrink-0 flex items-center justify-center font-bold text-[10px] text-brand-muted shadow-2xs">
                      {p.images && p.images[0] ? (
                        <img
                          src={p.images[0]}
                          alt={p.title || p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                        />
                      ) : (
                        'سَدِيم'
                      )}
                    </div>
                  </td>

                  {/* Title & Store */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-brand-surface text-brand-primary border border-brand-border">
                        {storeName}
                      </span>
                    </div>
                    <Link
                      href={`/admin/products/${p._id}`}
                      className="text-sm font-black text-brand-dark hover:text-brand-primary block tracking-tight transition-colors cursor-pointer"
                    >
                      {p.title || p.name}
                    </Link>
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-4">
                    <span className="text-xs font-bold text-brand-dark">
                      {categoryTitle}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="py-3.5 px-4">
                    <span className="text-xs font-black text-brand-dark bg-brand-surface px-2.5 py-1 rounded-lg border border-brand-border inline-block">
                      {priceLabel}
                    </span>
                  </td>

                  {/* Stock */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                        hasStock
                          ? 'bg-brand-surface text-brand-dark border border-brand-border'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${hasStock ? 'bg-brand-trust' : 'bg-red-500'}`} />
                      <span>{totalStock} ق</span>
                    </span>
                  </td>

                  {/* Governance Status */}
                  <td className="py-3.5 px-4">
                    {isRejected ? (
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-red-50 text-red-700 border border-red-200 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                          <span>موقوف إدارياً</span>
                        </span>
                        {p.rejectReason && (
                          <p className="text-[10px] text-red-600 truncate max-w-[150px]" title={p.rejectReason}>
                            السبب: {p.rejectReason}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-brand-trust-soft text-brand-trust border border-brand-trust/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-trust" />
                        <span>معتمد ومقبول</span>
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {isRejected ? (
                        <button
                          type="button"
                          onClick={() => onActivateProduct(p._id)}
                          disabled={isBusy}
                          className="px-3 py-1.5 rounded-lg bg-brand-trust text-white text-[11px] font-black hover:bg-brand-trust/90 transition-colors cursor-pointer active:scale-95 disabled:opacity-40 shadow-2xs"
                        >
                          فك التجميد
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onOpenRejectModal(p)}
                          disabled={isBusy}
                          className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-[11px] font-bold transition-colors cursor-pointer active:scale-95 disabled:opacity-40"
                        >
                          إيقاف الصنف
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 2. Mobile Responsive View */}
      <div className="block lg:hidden divide-y divide-brand-border/40">
        {products.map((p) => {
          const storeName = typeof p.storeId === 'object' ? p.storeId?.name || 'متجر غير معروف' : 'متجر سَدِيم';
          const categoryTitle = typeof p.categoryId === 'object' ? p.categoryId?.title || 'صنف عام' : 'صنف عام';
          const priceLabel = getProductPrice(p);
          const isRejected = p.approveStatus === 'rejected';
          const totalStock = getProductTotalStock(p);
          const hasStock = p.inStock !== false && totalStock > 0;

          return (
            <div key={p._id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-14 h-14 rounded-xl bg-brand-surface overflow-hidden border border-brand-border shrink-0 flex items-center justify-center font-bold text-xs text-brand-muted">
                    {p.images && p.images[0] ? (
                      <img
                        src={p.images[0]}
                        alt={p.title || p.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      'سَدِيم'
                    )}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <span className="text-[10px] font-bold text-brand-primary block">
                      {storeName} &bull; {categoryTitle}
                    </span>
                    <Link href={`/admin/products/${p._id}`} className="block">
                      <h4 className="text-sm font-black text-brand-dark truncate block hover:text-brand-primary transition-colors">
                        {p.title || p.name}
                      </h4>
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-brand-dark">
                        {priceLabel}
                      </span>
                      <span className="text-[10px] font-bold text-brand-muted">
                        ({totalStock} ق)
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  {isRejected ? (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                      موقوف
                    </span>
                  ) : (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-brand-trust-soft text-brand-trust border border-brand-trust/30">
                      معتمد
                    </span>
                  )}
                </div>
              </div>

              {/* Mobile Actions */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-brand-border/40">
                {isRejected && p.rejectReason ? (
                  <span className="text-[10px] text-red-600 truncate max-w-[180px]">
                    السبب: {p.rejectReason}
                  </span>
                ) : (
                  <span className="text-[10px] text-brand-muted">
                    حالة المخزون: {hasStock ? 'متوفر' : 'نافد'}
                  </span>
                )}

                <div>
                  {isRejected ? (
                    <button
                      type="button"
                      onClick={() => onActivateProduct(p._id)}
                      disabled={isBusy}
                      className="px-3 py-1.5 rounded-lg bg-brand-trust text-white text-xs font-black active:scale-95 disabled:opacity-40"
                    >
                      فك التجميد
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenRejectModal(p)}
                      disabled={isBusy}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 text-xs font-bold active:scale-95 disabled:opacity-40"
                    >
                      إيقاف الصنف
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
