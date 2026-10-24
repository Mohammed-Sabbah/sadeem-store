'use client';

import React, { useState, useMemo } from 'react';
import {
  useAdminProductsQuery,
  useAdminStoresQuery,
  useAdminCategoriesQuery,
  useAdminProductMutations,
} from '@/features/admin/queries/useAdminQueries';
import {
  type AdminProductTab,
  computeAdminProductMetrics,
  filterAdminProducts,
} from '@/features/admin/utils/productAdminFilters';
import { AdminProductFilterBar } from '@/features/admin/components/AdminProductFilterBar';
import { AdminProductTable } from '@/features/admin/components/AdminProductTable';
import { AdminProductRejectModal } from '@/features/admin/components/AdminProductRejectModal';

export default function AdminProductsPage() {
  const { data: products = [], isLoading: isLoadingProducts } = useAdminProductsQuery();
  const { data: stores = [] } = useAdminStoresQuery();
  const { data: categories = [] } = useAdminCategoriesQuery();
  const { updateApproval, isUpdating } = useAdminProductMutations();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<AdminProductTab>('all');
  const [selectedStoreId, setSelectedStoreId] = useState('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [productToReject, setProductToReject] = useState<any | null>(null);

  const metrics = useMemo(() => computeAdminProductMetrics(products), [products]);

  const filteredProducts = useMemo(() => {
    return filterAdminProducts(products, {
      query: searchQuery,
      tab: activeTab,
      storeId: selectedStoreId,
      categoryId: selectedCategoryId,
    });
  }, [products, searchQuery, activeTab, selectedStoreId, selectedCategoryId]);

  const handleConfirmReject = (reason: string) => {
    if (productToReject) {
      updateApproval(
        {
          productId: productToReject._id,
          approveStatus: 'rejected',
          rejectReason: reason,
        },
        {
          onSettled: () => setProductToReject(null),
        }
      );
    }
  };

  const handleActivateProduct = (productId: string) => {
    updateApproval({
      productId,
      approveStatus: 'approved',
    });
  };

  return (
    <div className="space-y-6 font-almarai text-right">
      {/* 1. Header Mission & Status */}
      <div className="bg-brand-card rounded-2xl border border-brand-border p-6 sm:p-7 shadow-2xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-black text-brand-dark tracking-tight">
              رقابة الكتالوج والأصناف
            </h2>
            <p className="text-xs text-brand-muted max-w-xl leading-relaxed">
              رقابة مركزية لكافة الأصناف المعروضة في شبكة سَدِيم عبر مختلف متاجر المحافظة الوسطى، مع إمكانية التجميد الفوري.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-brand-muted">
              إجمالي الأصناف: <strong className="text-brand-dark">{metrics.total}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Products Table Card */}
      <div className="bg-brand-card rounded-2xl border border-brand-border shadow-2xs overflow-hidden">
        <AdminProductFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          selectedStoreId={selectedStoreId}
          onStoreChange={setSelectedStoreId}
          selectedCategoryId={selectedCategoryId}
          onCategoryChange={setSelectedCategoryId}
          stores={stores}
          categories={categories}
          metrics={metrics}
          filteredCount={filteredProducts.length}
        />

        {isLoadingProducts ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-brand-muted">جارٍ فحص كتالوج المنتجات...</p>
          </div>
        ) : (
          <AdminProductTable
            products={filteredProducts}
            onOpenRejectModal={(product) => setProductToReject(product)}
            onActivateProduct={handleActivateProduct}
            isBusy={isUpdating}
          />
        )}
      </div>

      {/* 3. Rejection / Freeze Reason Modal */}
      <AdminProductRejectModal
        isOpen={Boolean(productToReject)}
        onClose={() => setProductToReject(null)}
        onConfirm={handleConfirmReject}
        productTitle={productToReject?.title || productToReject?.name || ''}
        isSubmitting={isUpdating}
      />
    </div>
  );
}
