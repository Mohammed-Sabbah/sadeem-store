'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useMerchantProfileQuery,
  useMerchantProductsQuery,
  useToggleProductActiveMutation,
  useDeleteProductMutation,
  useQuickStockMutation,
  useCreateProductMutation,
} from '../queries/useMerchantQueries';
import { merchantKeys } from '../queries/merchant.keys';
import type {
  StoreProfile,
  ProductItem,
  ProductFormData,
  MerchantMetrics,
} from '../types/merchant.types';

interface MerchantContextValue {
  store: StoreProfile | null;
  products: ProductItem[];
  metrics: MerchantMetrics;
  isLoading: boolean;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  feedbackMessage: { type: 'success' | 'error'; text: string } | null;
  handleCreateProduct: (formData: ProductFormData) => Promise<boolean>;
  handleToggleActive: (productId: string, currentActive: boolean) => Promise<void>;
  handleDeleteProduct: (productId: string) => Promise<void>;
  handleQuickStockUpdate: (productId: string, newStock: number, variantId?: string) => Promise<void>;
  handleToggleStoreStatus: () => Promise<void>;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  refreshData: () => Promise<void>;
}

const MerchantContext = createContext<MerchantContextValue | null>(null);

export function MerchantProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const profileQuery = useMerchantProfileQuery();
  const productsQuery = useMerchantProductsQuery();

  const toggleActiveMutation = useToggleProductActiveMutation();
  const deleteMutation = useDeleteProductMutation();
  const quickStockMutation = useQuickStockMutation();
  const createProductMutation = useCreateProductMutation();

  const store = profileQuery.data || null;
  const products = productsQuery.data || [];
  const isLoading = profileQuery.isLoading || productsQuery.isLoading;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auto clear feedback message
  useEffect(() => {
    if (!feedbackMessage) return;
    const timer = setTimeout(() => setFeedbackMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [feedbackMessage]);

  // Dynamic live metrics computation based on cached query data
  const metrics: MerchantMetrics = useMemo(() => {
    const total = products.length;
    const inStock = products.filter((p) => p.inStock && (p.totalStock ?? 0) > 0).length;
    const outOfStock = products.filter((p) => !p.inStock || (p.totalStock ?? 0) === 0).length;
    const active = products.filter((p) => p.isActive).length;
    const units = products.reduce((sum, p) => sum + (p.totalStock ?? 0), 0);

    return {
      totalProducts: total,
      inStockProducts: inStock,
      outOfStockProducts: outOfStock,
      totalInventoryUnits: units,
      activeProducts: active,
    };
  }, [products]);

  const handleCreateProduct = async (formData: ProductFormData): Promise<boolean> => {
    try {
      const res = await createProductMutation.mutateAsync(formData);
      if (res.success && res.data) {
        setFeedbackMessage({
          type: 'success',
          text: `تم حفظ وإضافة «${res.data.name}» بنجاح في الكتالوج`,
        });
        return true;
      }
      return false;
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'تعذر إضافة المنتج، يرجى المحاولة لاحقاً',
      });
      return false;
    }
  };

  const handleToggleActive = async (productId: string, currentActive: boolean) => {
    try {
      await toggleActiveMutation.mutateAsync({ productId, currentActive });
      setFeedbackMessage({
        type: 'success',
        text: !currentActive ? 'تم تفعيل ظهور المنتج للزبائن' : 'تم إخفاء المنتج مؤقتاً',
      });
    } catch {
      setFeedbackMessage({
        type: 'error',
        text: 'تعذر تعديل حالة المنتج، يرجى المحاولة لاحقاً',
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteMutation.mutateAsync(productId);
      setFeedbackMessage({
        type: 'success',
        text: 'تم حذف المنتج من الكتالوج بنجاح',
      });
    } catch {
      setFeedbackMessage({
        type: 'error',
        text: 'تعذر حذف المنتج، يرجى المحاولة لاحقاً',
      });
    }
  };

  const handleQuickStockUpdate = async (productId: string, newStock: number, variantId?: string) => {
    try {
      await quickStockMutation.mutateAsync({ productId, newStock, variantId });
      setFeedbackMessage({
        type: 'success',
        text: 'تم تحديث الكمية المتوفرة فورياً',
      });
    } catch {
      setFeedbackMessage({
        type: 'error',
        text: 'تعذر تحديث المخزون',
      });
    }
  };

  const handleToggleStoreStatus = async () => {
    // Permanent active 24/7 store
  };

  const refreshData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: merchantKeys.profile() }),
      queryClient.invalidateQueries({ queryKey: merchantKeys.products() }),
    ]);
  };

  const value: MerchantContextValue = {
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
    handleToggleStoreStatus,
    isDrawerOpen,
    setIsDrawerOpen,
    refreshData,
  };

  return <MerchantContext.Provider value={value}>{children}</MerchantContext.Provider>;
}

export function useMerchantContext() {
  const ctx = useContext(MerchantContext);
  if (!ctx) {
    throw new Error('useMerchantContext must be used within a MerchantProvider');
  }
  return ctx;
}
