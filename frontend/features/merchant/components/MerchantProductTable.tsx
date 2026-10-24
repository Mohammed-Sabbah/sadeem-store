'use client';

import React from 'react';
import type { ProductItem } from '../types/merchant.types';
import { MerchantProductTableRow } from './MerchantProductTableRow';

export interface MerchantProductTableProps {
  products: ProductItem[];
  expandedVariantsId: string | null;
  onToggleExpand: (productId: string) => void;
  onToggleActive: (productId: string, currentActive: boolean) => void;
  onDeleteProduct: (productId: string, name: string) => void;
  onQuickStockChange?: (productId: string, newStock: number, variantId?: string) => void;
}

export const MerchantProductTable: React.FC<MerchantProductTableProps> = ({
  products,
  expandedVariantsId,
  onToggleExpand,
  onToggleActive,
  onDeleteProduct,
  onQuickStockChange,
}) => {
  return (
    <div className="hidden lg:block overflow-x-auto">
      <table className="w-full text-right text-xs">
        <thead className="bg-brand-surface/80 border-b border-brand-border text-brand-muted font-bold select-none">
          <tr>
            <th className="py-3 px-5 w-20">الصورة</th>
            <th className="py-3 px-4 min-w-[280px]">اسم الصنف / القسم</th>
            <th className="py-3 px-4 w-36">السعر بالـ (₪)</th>
            <th className="py-3 px-6 w-52">المخزون المتوفر</th>
            <th className="py-3 px-4 w-32">حالة العرض</th>
            <th className="py-3 px-4 w-20 text-center">حذف</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-border/40">
          {products.map((p) => (
            <MerchantProductTableRow
              key={p._id}
              product={p}
              isExpanded={expandedVariantsId === p._id}
              onToggleExpand={() => onToggleExpand(p._id)}
              onToggleActive={onToggleActive}
              onDeleteProduct={onDeleteProduct}
              onQuickStockChange={onQuickStockChange}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
