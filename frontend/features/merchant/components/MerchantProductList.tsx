'use client';

import React, { useState, useMemo } from 'react';
import type { ProductItem } from '../types/merchant.types';
import {
  type FilterTab,
  computeFilterMetrics,
  filterProducts,
} from '../utils/productFilters';
import { useMerchantProductFilters } from '../hooks/useMerchantProductFilters';
import { MerchantProductFilterBar } from './MerchantProductFilterBar';
import { MerchantProductTable } from './MerchantProductTable';
import { MerchantProductMobileList } from './MerchantProductMobileList';
import { MerchantProductDeleteModal } from './MerchantProductDeleteModal';

export type { FilterTab };

interface MerchantProductListProps {
  products: ProductItem[];
  onToggleActive: (productId: string, currentActive: boolean) => void;
  onDeleteProduct: (productId: string) => void;
  onOpenAddModal: () => void;
  onQuickStockChange?: (productId: string, newStock: number, variantId?: string) => void;
  activeFilterTab?: FilterTab;
  onTabChange?: (tab: FilterTab) => void;
}

export default function MerchantProductList({
  products,
  onToggleActive,
  onDeleteProduct,
  onOpenAddModal,
  onQuickStockChange,
  activeFilterTab,
  onTabChange,
}: MerchantProductListProps) {
  const [expandedVariantsId, setExpandedVariantsId] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);

  const {
    activeTab,
    setTab,
    searchQuery,
    setSearchQuery,
    filterState,
  } = useMerchantProductFilters({
    controlledTab: activeFilterTab,
    onTabChange,
  });

  const filterMetrics = useMemo(() => computeFilterMetrics(products), [products]);
  const filteredProducts = useMemo(() => filterProducts(products, filterState), [products, filterState]);

  const confirmDelete = (productId: string, name: string) => {
    setProductToDelete({ id: productId, name });
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      onDeleteProduct(productToDelete.id);
      setProductToDelete(null);
    }
  };

  const toggleVariantsExpand = (productId: string) => {
    setExpandedVariantsId((prev) => (prev === productId ? null : productId));
  };

  return (
    <div className="bg-brand-card rounded-xl border border-brand-border shadow-2xs font-almarai text-right overflow-hidden transition-all">
      {/* 1. Universal Search & Segmented Filter Bar */}
      <MerchantProductFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTab={activeTab}
        onTabChange={setTab}
        metrics={filterMetrics}
        filteredCount={filteredProducts.length}
      />

      {/* 2. Empty State */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 px-4 bg-brand-surface/30">
          <div className="w-14 h-14 rounded-2xl bg-brand-card border border-brand-border text-brand-muted flex items-center justify-center mx-auto mb-3.5 shadow-2xs">
            <svg className="w-6 h-6 stroke-[1.75]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-sm font-black text-brand-dark mb-1">لا توجد أصناف مطابقة</h3>
          <p className="text-xs text-brand-muted mb-5 max-w-sm mx-auto leading-relaxed">
            {searchQuery
              ? 'لم يتم العثور على أي منتج يتطابق مع كلمة البحث.'
              : 'لم تقم بإضافة أي أصناف ضمن هذا التصنيف حتى الآن.'}
          </p>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-black hover:bg-brand-primary-hover transition-all duration-150 active:scale-95 shadow-sm cursor-pointer"
          >
            <span>+ إضافة صنف جديد</span>
          </button>
        </div>
      ) : (
        <div>
          {/* 3. Desktop View: High-Density World-Class Table */}
          <MerchantProductTable
            products={filteredProducts}
            expandedVariantsId={expandedVariantsId}
            onToggleExpand={toggleVariantsExpand}
            onToggleActive={onToggleActive}
            onDeleteProduct={confirmDelete}
            onQuickStockChange={onQuickStockChange}
          />

          {/* 4. Mobile & Tablet Card View: Ergonomic Thumb Navigation */}
          <MerchantProductMobileList
            products={filteredProducts}
            expandedVariantsId={expandedVariantsId}
            onToggleExpand={toggleVariantsExpand}
            onToggleActive={onToggleActive}
            onDeleteProduct={confirmDelete}
            onQuickStockChange={onQuickStockChange}
          />
        </div>
      )}

      {/* 5. Elegant Delete Confirmation Modal */}
      <MerchantProductDeleteModal
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleConfirmDelete}
        productName={productToDelete?.name || ''}
      />
    </div>
  );
}
