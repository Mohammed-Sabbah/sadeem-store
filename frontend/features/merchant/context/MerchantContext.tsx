'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { merchantService } from '../services/merchant.service';
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
  const [store, setStore] = useState<StoreProfile | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [storeRes, productsRes] = await Promise.all([
        merchantService.getStoreProfile(),
        merchantService.getMyProducts(),
      ]);

      if (storeRes.data) {
        setStore(storeRes.data);
      }
      if (productsRes.data) {
        setProducts(productsRes.data);
      }
    } catch (err) {
      console.error('Failed loading merchant context data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Auto clear feedback message
  useEffect(() => {
    if (!feedbackMessage) return;
    const timer = setTimeout(() => setFeedbackMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [feedbackMessage]);

  // Dynamic live metrics computation
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
      const res = await merchantService.createProduct(formData);
      if (res.success && res.data) {
        setProducts((prev) => [res.data, ...prev]);
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
    setProducts((prev) =>
      prev.map((p) => (p._id === productId ? { ...p, isActive: !currentActive } : p))
    );

    try {
      await merchantService.toggleProduct(productId, currentActive);
      setFeedbackMessage({
        type: 'success',
        text: !currentActive ? 'تم تفعيل ظهور المنتج للزبائن' : 'تم إخفاء المنتج مؤقتاً',
      });
    } catch {
      setProducts((prev) =>
        prev.map((p) => (p._id === productId ? { ...p, isActive: currentActive } : p))
      );
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setProducts((prev) => prev.filter((p) => p._id !== productId));

    try {
      await merchantService.deleteProduct(productId);
      setFeedbackMessage({
        type: 'success',
        text: 'تم حذف المنتج من الكتالوج بنجاح',
      });
    } catch {
      void loadData();
    }
  };

  const handleQuickStockUpdate = async (productId: string, newStock: number, variantId?: string) => {
    const clampedStock = Math.max(0, newStock);

    setProducts((prev) =>
      prev.map((p) => {
        if (p._id !== productId) return p;

        if (variantId && p.variants && p.variants.length > 0) {
          const updatedVariants = p.variants.map((v) =>
            v._id === variantId || v.sku === variantId ? { ...v, stock: clampedStock } : v
          );
          const newTotalStock = updatedVariants.reduce((sum, v) => sum + (v.stock ?? 0), 0);
          return {
            ...p,
            variants: updatedVariants,
            totalStock: newTotalStock,
            inStock: newTotalStock > 0,
          };
        }

        return {
          ...p,
          totalStock: clampedStock,
          inStock: clampedStock > 0,
        };
      })
    );

    try {
      await merchantService.quickUpdateStock(productId, clampedStock, variantId);
    } catch {
      void loadData();
    }
  };

  const handleToggleStoreStatus = async () => {
    if (!store) return;
    const nextStatus = store.status === 'active' ? 'inActive' : 'active';

    setStore((prev) => (prev ? { ...prev, status: nextStatus } : prev));

    try {
      await merchantService.toggleStoreStatus(nextStatus);
      setFeedbackMessage({
        type: 'success',
        text: nextStatus === 'active' ? 'تم فتح المتجر واستقبال الطلبيات' : 'تم إغلاق المتجر مؤقتاً',
      });
    } catch {
      setStore((prev) => (prev ? { ...prev, status: store.status } : prev));
    }
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
    refreshData: loadData,
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
