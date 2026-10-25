'use client';

import React from 'react';
import type { ProductItem } from '../types/merchant.types';
import { MerchantQuickStockStepper } from './MerchantQuickStockStepper';

export interface MerchantVariantExpandRowProps {
  product: ProductItem;
  colSpan?: number;
  onQuickStockChange?: (productId: string, newStock: number, variantId?: string) => void;
}

export const MerchantVariantExpandRow: React.FC<MerchantVariantExpandRowProps> = ({
  product,
  colSpan = 6,
  onQuickStockChange,
}) => {
  const variants = product.variants || [];

  return (
    <tr className="bg-brand-surface/90 border-b border-brand-border">
      <td colSpan={colSpan} className="py-4 px-6">
        <div className="max-w-4xl mx-auto space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-brand-muted mb-2">
            <span>متغيرات الصنف والمخزون التفصيلي:</span>
            <span>يتم تحديث إجمالي المخزون آلياً فور تعديل أي متغير</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {variants.map((v, vIdx) => {
              const attrText = v.attributes
                ? Object.values(v.attributes).join(' / ')
                : 'افتراضي';

              return (
                <div
                  key={v._id || vIdx}
                  className="bg-brand-card rounded-xl p-3 border border-brand-border flex items-center justify-between text-xs shadow-2xs"
                >
                  <div className="min-w-0 flex-1 pl-2">
                    <strong className="text-brand-dark block text-xs font-black truncate">
                      {attrText}
                    </strong>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-black text-brand-dark">
                        {v.price} ₪
                      </span>
                    </div>
                  </div>

                  {/* Variant Stepper */}
                  <MerchantQuickStockStepper
                    stock={v.stock ?? 0}
                    onChange={(newStock) => onQuickStockChange?.(product._id, newStock, v._id)}
                    size="sm"
                    showUnit={false}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </td>
    </tr>
  );
};
