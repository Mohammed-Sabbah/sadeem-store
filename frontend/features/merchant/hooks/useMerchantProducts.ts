'use client';

import { useState, useEffect, useCallback } from 'react';
import { merchantService } from '../services/merchant.service';
import type { StoreProfile, ProductItem, ProductFormData, MerchantMetrics } from '../types/merchant.types';

export function useMerchantProducts() {
  const [store, setStore] = useState<StoreProfile | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load store and products
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
      console.error('Failed loading merchant data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Clear feedback after 4 seconds
  useEffect(() => {
    if (!feedbackMessage) return;
    const timer = setTimeout(() => setFeedbackMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [feedbackMessage]);

  // Handlers
  const handleCreateProduct = async (formData: ProductFormData): Promise<boolean> => {
    try {
      const res = await merchantService.createProduct(formData);
      if (res.success && res.data) {
        setProducts((prev) => [res.data, ...prev]);
        setFeedbackMessage({
          type: 'success',
          text: `تم حفظ وإضافة منتج «${res.data.name}» بنجاح!`,
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
    // Optimistic update
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
      // Revert on error
      setProducts((prev) =>
        prev.map((p) => (p._id === productId ? { ...p, isActive: currentActive } : p))
      );
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    // Optimistic delete
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
    const cleanStock = Math.max(0, newStock);

    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => {
        if (p._id !== productId) return p;

        if (variantId && p.variants) {
          const updatedVars = p.variants.map((v) =>
            v._id === variantId || v.sku === variantId ? { ...v, stock: cleanStock } : v
          );
          const total = updatedVars.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
          return {
            ...p,
            variants: updatedVars,
            totalStock: total,
            inStock: total > 0,
          };
        }

        const updatedVars = (p.variants || []).map((v) => ({ ...v, stock: cleanStock }));
        return {
          ...p,
          totalStock: cleanStock,
          inStock: cleanStock > 0,
          variants: updatedVars.length > 0 ? updatedVars : p.variants,
        };
      })
    );

    try {
      await merchantService.quickUpdateStock(productId, cleanStock, variantId);
      setFeedbackMessage({
        type: 'success',
        text: cleanStock === 0 ? 'تم تحديد المنتج كنافد من المخزون' : `تم تحديث المخزون (${cleanStock} قطعة)`,
      });
    } catch {
      void loadData();
    }
  };

  const handleToggleStoreStatus = () => {
    if (!store) return;
    const nextStatus: 'active' | 'inActive' = store.status === 'active' ? 'inActive' : 'active';
    const updated: StoreProfile = { ...store, status: nextStatus };
    setStore(updated);
    setFeedbackMessage({
      type: 'success',
      text: nextStatus === 'active' ? 'المتجر الآن نشط ويستقبل الطلبات' : 'المتجر مغلق مؤقتاً',
    });
  };

  const handleSimulateApproval = () => {
    if (!store) return;
    const nextStatus = store.approveStatus === 'approved' ? 'pending' : 'approved';
    const updated = merchantService.updateLocalStoreApproval(nextStatus);
    setStore(updated);
    setFeedbackMessage({
      type: 'success',
      text: nextStatus === 'approved' ? 'تم اعتماد المتجر تجريبياً بنجاح!' : 'تم تحويل المتجر إلى قيد المراجعة',
    });
  };

  const metrics: MerchantMetrics = merchantService.calculateMetrics(products);

  return {
    store,
    products,
    metrics,
    isLoading,
    isModalOpen,
    setIsModalOpen,
    feedbackMessage,
    loadData,
    handleCreateProduct,
    handleToggleActive,
    handleDeleteProduct,
    handleQuickStockUpdate,
    handleToggleStoreStatus,
    handleSimulateApproval,
  };
}
