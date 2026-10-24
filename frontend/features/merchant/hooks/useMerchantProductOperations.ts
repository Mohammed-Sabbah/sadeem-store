'use client';

import { useMemo, useCallback } from 'react';
import { useToast } from '@/components/ui/toast';
import {
  useMerchantProductsQuery,
  useToggleProductActiveMutation,
  useDeleteProductMutation,
  useQuickStockMutation,
} from '../queries/useMerchantQueries';
import { computeMerchantMetrics } from '../utils/merchantMetrics';
import type { ProductItem, MerchantMetrics } from '../types/merchant.types';

/**
 * Domain Hook: useMerchantProductOperations
 * يغلف استعلام المنتجات وكافة طفرات التعديل والحذف وتعديل المخزون
 * مع إشعارات سَدِيم الهادئة (Apple-grade toasts) والتراجع التلقائي عند الخطأ
 */
export function useMerchantProductOperations() {
  const toast = useToast();

  const productsQuery = useMerchantProductsQuery();
  const toggleActiveMutation = useToggleProductActiveMutation();
  const deleteMutation = useDeleteProductMutation();
  const quickStockMutation = useQuickStockMutation();

  const products = useMemo(() => productsQuery.data || [], [productsQuery.data]);
  const metrics: MerchantMetrics = useMemo(() => computeMerchantMetrics(products), [products]);

  const handleToggleActive = useCallback(
    async (productId: string, currentActive: boolean): Promise<boolean> => {
      try {
        await toggleActiveMutation.mutateAsync({ productId, currentActive });
        toast.trust(
          !currentActive ? 'تم التفعيل' : 'تم الإيقاف',
          !currentActive ? 'تم تفعيل ظهور الصنف للزبائن بنجاح' : 'تم إخفاء الصنف مؤقتاً من المتجر'
        );
        return true;
      } catch (err: any) {
        toast.error('تعذر تغيير الحالة', err?.message || 'حدث خطأ أثناء تحديث حالة الصنف');
        return false;
      }
    },
    [toggleActiveMutation, toast]
  );

  const handleDeleteProduct = useCallback(
    async (productId: string): Promise<boolean> => {
      try {
        await deleteMutation.mutateAsync(productId);
        toast.trust('تم الحذف بنجاح', 'تمت إزالة الصنف وكافة توليفاته من متجرك');
        return true;
      } catch (err: any) {
        toast.error('فشل الحذف', err?.message || 'تعذر حذف الصنف، يرجى المحاولة لاحقاً');
        return false;
      }
    },
    [deleteMutation, toast]
  );

  const handleQuickStockUpdate = useCallback(
    async (productId: string, newStock: number, variantId?: string): Promise<boolean> => {
      try {
        await quickStockMutation.mutateAsync({ productId, newStock, variantId });
        return true;
      } catch (err: any) {
        toast.error('تعذر تحديث المخزون', 'فشل الاتصال بالخادم، وتم استرجاع الكمية السابقة تلقائياً');
        return false;
      }
    },
    [quickStockMutation, toast]
  );

  return {
    products,
    metrics,
    isLoading: productsQuery.isLoading,
    isRefetching: productsQuery.isRefetching,
    error: productsQuery.error,
    refetch: productsQuery.refetch,
    handleToggleActive,
    handleDeleteProduct,
    handleQuickStockUpdate,
    isTogglingActive: toggleActiveMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUpdatingStock: quickStockMutation.isPending,
  };
}
