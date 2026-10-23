'use client';

import React from 'react';

interface ProductPricingStockSectionProps {
  basePrice: number | '';
  onBasePriceChange: (val: number | '') => void;
  baseCompareAtPrice: number | '';
  onBaseCompareAtPriceChange: (val: number | '') => void;
  baseStock: number | '';
  onBaseStockChange: (val: number | '') => void;
  hasVariants: boolean;
}

export function ProductPricingStockSection({
  basePrice,
  onBasePriceChange,
  baseCompareAtPrice,
  onBaseCompareAtPriceChange,
  baseStock,
  onBaseStockChange,
  hasVariants,
}: ProductPricingStockSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-brand-border/60 p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-brand-border/40 pb-3">
        <h2 className="text-sm font-black text-brand-dark flex items-center gap-2">
          <span>🏷️</span> التسعير والمخزون الأساسي
        </h2>
        {hasVariants && (
          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 rounded-full">
            تُورث للأصناف أدناه
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Base Selling Price */}
        <div>
          <label className="block text-xs font-bold text-brand-dark mb-1.5">
            سعر البيع للزبون (₪) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="any"
              value={basePrice}
              onChange={(e) => onBasePriceChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
              placeholder="0.00"
              className="w-full h-11 pl-8 pr-3.5 bg-brand-canvas/50 border border-brand-border/70 rounded-xl text-xs font-bold text-brand-dark placeholder:text-brand-subtle focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all text-left"
              dir="ltr"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-muted pointer-events-none">
              ₪
            </span>
          </div>
        </div>

        {/* Base Compare At Price (Discount original price) */}
        <div>
          <label className="block text-xs font-bold text-brand-dark mb-1.5">
            السعر قبل الخصم (اختياري)
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="any"
              value={baseCompareAtPrice}
              onChange={(e) => onBaseCompareAtPriceChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
              placeholder="0.00"
              className="w-full h-11 pl-8 pr-3.5 bg-brand-canvas/50 border border-brand-border/70 rounded-xl text-xs font-bold text-brand-dark placeholder:text-brand-subtle focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all text-left"
              dir="ltr"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-muted pointer-events-none">
              ₪
            </span>
          </div>
        </div>

        {/* Base Stock Units */}
        <div>
          <label className="block text-xs font-bold text-brand-dark mb-1.5">
            الكمية الجاهزة للتسليم <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={baseStock}
            onChange={(e) => onBaseStockChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
            placeholder="10"
            className="w-full h-11 px-3.5 bg-brand-canvas/50 border border-brand-border/70 rounded-xl text-xs font-bold text-brand-dark placeholder:text-brand-subtle focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all text-left"
            dir="ltr"
          />
        </div>
      </div>
    </div>
  );
}
