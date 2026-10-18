'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMerchantContext } from '@/features/merchant/context/MerchantContext';
import MerchantDashboardHeader from '@/features/merchant/components/MerchantDashboardHeader';
import MerchantMetricsBar from '@/features/merchant/components/MerchantMetricsBar';
import MerchantProductList, { type FilterTab } from '@/features/merchant/components/MerchantProductList';
import AddProductModal from '@/features/merchant/components/AddProductModal';

export default function MerchantDashboardPage() {
  const router = useRouter();
  const [activeFilterTab, setActiveFilterTab] = useState<FilterTab>('all');

  const {
    store,
    products,
    metrics,
    isLoading,
    isModalOpen,
    setIsModalOpen,
    feedbackMessage,
    handleCreateProduct,
    handleToggleActive,
    handleDeleteProduct,
    handleQuickStockUpdate,
  } = useMerchantContext();

  // Strict Gatekeeper Rule: If store is not approved, route immediately to pending screen
  useEffect(() => {
    if (!isLoading && store && store.approveStatus !== 'approved') {
      router.replace('/merchant/pending-approval');
    }
  }, [store, isLoading, router]);

  if (isLoading && !store) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center font-almarai">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-brand-muted">جارٍ تهيئة محطة التاجر...</p>
      </div>
    );
  }

  if (store && store.approveStatus !== 'approved') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center font-almarai">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-brand-muted">جارٍ توجيهك إلى شاشة متابعة طلب الاعتماد...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="max-w-md mx-auto py-16 text-center font-almarai">
        <h2 className="text-lg font-black text-brand-dark mb-2">لم يتم العثور على متجر مسجل</h2>
        <p className="text-xs text-brand-muted mb-6 leading-relaxed">
          سجل متجرك الآن في المحافظة الوسطى للانضمام لشبكة سَدِيم المعتمدة.
        </p>
        <button
          type="button"
          onClick={() => router.push('/merchant/join')}
          className="inline-flex px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold transition-colors shadow-sm"
        >
          طلب انضمام متجر جديد
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 sm:space-y-5 animate-fadeIn font-almarai">
      {/* Floating Apple-Grade Capsule HUD (Instant Feedback) */}
      {feedbackMessage && (
        <div className="fixed top-18 lg:top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-fadeIn transition-all">
          <div
            className={`px-4 py-2 rounded-full text-xs font-black shadow-xl flex items-center gap-2 border backdrop-blur-xl ${
              feedbackMessage.type === 'success'
                ? 'bg-brand-dark/95 text-white border-brand-border/40'
                : 'bg-red-950/95 text-white border-red-700/60'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                feedbackMessage.type === 'success' ? 'bg-brand-trust' : 'bg-red-400'
              }`}
            />
            <span>{feedbackMessage.text}</span>
          </div>
        </div>
      )}

      {/* 1. Serene Page Action Bar (Title + Primary Action Button) */}
      <MerchantDashboardHeader
        store={store}
        onOpenAddModal={() => setIsModalOpen(true)}
      />

      {/* 2. Operations Pulse Strip (Quiet, zero box fatigue) */}
      <MerchantMetricsBar
        metrics={metrics}
        onFilterLowStock={() => setActiveFilterTab('out_of_stock')}
      />

      {/* 3. High-Density Product Catalog & Inventory Matrix */}
      <MerchantProductList
        products={products}
        onToggleActive={handleToggleActive}
        onDeleteProduct={handleDeleteProduct}
        onQuickStockChange={handleQuickStockUpdate}
        onOpenAddModal={() => setIsModalOpen(true)}
        activeFilterTab={activeFilterTab}
        onTabChange={setActiveFilterTab}
      />

      {/* 4. Slide-Over Add Product Terminal */}
      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateProduct}
      />
    </div>
  );
}
