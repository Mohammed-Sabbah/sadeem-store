'use client';

import React from 'react';
import type { VariantRowState } from '../../types/product-studio.types';
import { getAttributeDisplayName } from '@/shared/lib/attributeUtils';

interface ProductVariantTableProps {
  variantsRows: VariantRowState[];
  bulkPrice: string;
  setBulkPrice: (val: string) => void;
  bulkStock: string;
  setBulkStock: (val: string) => void;
  onApplyBulkPrice: () => void;
  onApplyBulkStock: () => void;
  onToggleVariantStatus: (idx: number) => void;
  onRemoveVariantRow: (idx: number) => void;
  onUpdateRowField: (idx: number, field: keyof VariantRowState, val: any) => void;
  onOpenGalleryPicker: (idx: number) => void;
  onOpenAddSingleModal: () => void;
}

export function ProductVariantTable({
  variantsRows,
  bulkPrice,
  setBulkPrice,
  bulkStock,
  setBulkStock,
  onApplyBulkPrice,
  onApplyBulkStock,
  onToggleVariantStatus,
  onRemoveVariantRow,
  onUpdateRowField,
  onOpenGalleryPicker,
  onOpenAddSingleModal,
}: ProductVariantTableProps) {
  if (variantsRows.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-brand-border/60 p-6 shadow-sm text-center space-y-3">
        <div className="w-10 h-10 rounded-full bg-brand-canvas flex items-center justify-center mx-auto text-lg text-brand-muted">
          ⚖️
        </div>
        <div>
          <h3 className="text-xs font-black text-brand-dark mb-1">لا توجد توليفات أصناف بعد</h3>
          <p className="text-[11px] text-brand-muted max-w-sm mx-auto">
            اختر المقاسات والألوان أعلاه واضغط على «تجهيز جدول الأصناف تلقائياً»، أو أضف توليفة يدوياً.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAddSingleModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-brand-border/80 bg-white hover:border-brand-primary text-brand-dark hover:text-brand-primary text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <span>+ إضافة صنف / توليفة مفردة يدوياً</span>
        </button>
      </div>
    );
  }

  const enabledCount = variantsRows.filter(
    (r) => (r.status ? r.status === 'active' : r.isEnabled !== false)
  ).length;

  return (
    <div className="bg-white rounded-2xl border border-brand-border/60 p-5 sm:p-6 shadow-sm space-y-4">
      {/* Table Header & Bulk Application Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brand-border/40">
        <div>
          <h3 className="text-xs font-black text-brand-dark flex items-center gap-2">
            <span>📋</span> جدول الأصناف ({enabledCount} من {variantsRows.length} مفعل)
          </h3>
          <p className="text-[11px] text-brand-muted mt-0.5">
            حدد سعر وكمية وصورة كل توليفة جاهزة للبيع
          </p>
        </div>

        {/* Cohesive Bulk Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Bulk Price */}
          <div className="inline-flex items-center h-8 rounded-lg border border-brand-border/80 bg-white shadow-2xs overflow-hidden divide-x divide-x-reverse divide-brand-border/60">
            <span className="px-2.5 text-[11px] font-bold text-brand-muted bg-brand-canvas/60 h-full flex items-center select-none">
              سعر موحد
            </span>
            <div className="relative flex items-center h-full">
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
                className="w-16 h-full px-2 text-xs font-bold text-brand-dark focus:outline-none"
              />
              <span className="text-[10px] text-brand-muted pl-1.5 pointer-events-none">₪</span>
            </div>
            <button
              type="button"
              onClick={onApplyBulkPrice}
              disabled={!bulkPrice}
              className={`h-full px-2.5 text-[11px] font-black transition-all cursor-pointer ${
                bulkPrice
                  ? 'bg-brand-primary text-white hover:bg-brand-primary-hover shadow-2xs'
                  : 'bg-brand-canvas/50 text-brand-muted/40 cursor-not-allowed'
              }`}
            >
              تطبيق
            </button>
          </div>

          {/* Bulk Stock */}
          <div className="inline-flex items-center h-8 rounded-lg border border-brand-border/80 bg-white shadow-2xs overflow-hidden divide-x divide-x-reverse divide-brand-border/60">
            <span className="px-2.5 text-[11px] font-bold text-brand-muted bg-brand-canvas/60 h-full flex items-center select-none">
              كمية موحدة
            </span>
            <input
              type="number"
              min="0"
              step="1"
              placeholder="10"
              value={bulkStock}
              onChange={(e) => setBulkStock(e.target.value)}
              className="w-14 h-full px-2 text-xs font-bold text-brand-dark focus:outline-none"
            />
            <button
              type="button"
              onClick={onApplyBulkStock}
              disabled={!bulkStock}
              className={`h-full px-2.5 text-[11px] font-black transition-all cursor-pointer ${
                bulkStock
                  ? 'bg-brand-primary text-white hover:bg-brand-primary-hover shadow-2xs'
                  : 'bg-brand-canvas/50 text-brand-muted/40 cursor-not-allowed'
              }`}
            >
              تطبيق
            </button>
          </div>
        </div>
      </div>

      {/* Rows List */}
      <div className="divide-y divide-brand-border/60 border border-brand-border/70 rounded-xl overflow-hidden bg-white shadow-2xs">
        {variantsRows.map((row, idx) => {
          const isActive = row.status ? row.status === 'active' : row.isEnabled !== false;
          const label = Object.entries(row.attributes)
            .map(([k, v]) => `${getAttributeDisplayName(k)}: ${v}`)
            .join(' • ');

          return (
            <div
              key={row.id || idx}
              className={`p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                !isActive ? 'bg-zinc-50/70 opacity-60' : 'hover:bg-brand-canvas/30'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Active switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={isActive}
                  onClick={() => onToggleVariantStatus(idx)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer relative shrink-0 ${
                    isActive ? 'bg-brand-primary' : 'bg-brand-border'
                  }`}
                  title={isActive ? 'تعطيل هذا الصنف مؤقتاً' : 'تفعيل هذا الصنف للبيع'}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform transform ${
                      isActive ? '-translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>

                {/* Variant Image Picker */}
                <div className="relative shrink-0">
                  {row.image ? (
                    <div
                      onClick={() => onOpenGalleryPicker(idx)}
                      title="تغيير صورة هذا الصنف من المعرض"
                      className="relative group w-9 h-9 rounded-lg overflow-hidden border border-brand-border/80 shadow-2xs cursor-pointer"
                    >
                      <img src={row.image} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[9px] font-bold">
                        تغيير
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenGalleryPicker(idx)}
                      title="ربط صورة خاصة بهذا الصنف من المعرض"
                      className="w-9 h-9 rounded-lg border border-dashed border-brand-border hover:border-brand-primary bg-brand-canvas/40 hover:bg-brand-primary/5 text-brand-muted hover:text-brand-primary flex flex-col items-center justify-center cursor-pointer transition-all"
                    >
                      <span className="text-[10px]">📷</span>
                    </button>
                  )}
                </div>

                {/* Attributes Label */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-black text-brand-dark">{label}</span>
                </div>
              </div>

              {/* Price, Stock, Delete */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] font-bold text-brand-muted">السعر:</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={row.price}
                      onChange={(e) =>
                        onUpdateRowField(
                          idx,
                          'price',
                          e.target.value === '' ? '' : parseFloat(e.target.value)
                        )
                      }
                      className="w-20 h-8 px-2 text-xs font-bold rounded-lg border border-brand-border/80 bg-white text-brand-dark focus:outline-none focus:border-brand-primary"
                    />
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-brand-muted">
                      ₪
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] font-bold text-brand-muted">المخزون:</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={row.stock}
                    onChange={(e) =>
                      onUpdateRowField(
                        idx,
                        'stock',
                        e.target.value === '' ? '' : parseInt(e.target.value, 10)
                      )
                    }
                    className="w-16 h-8 px-2 text-xs font-bold rounded-lg border border-brand-border/80 bg-white text-brand-dark focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveVariantRow(idx)}
                  title="حذف هذا الصنف"
                  className="w-8 h-8 rounded-lg border border-red-200/70 bg-red-50/50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Single Variant Button */}
      <div className="pt-1">
        <button
          type="button"
          onClick={onOpenAddSingleModal}
          className="text-xs font-bold text-brand-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          <span>+ إضافة صنف / توليفة مفردة إضافية يدوياً</span>
        </button>
      </div>
    </div>
  );
}
