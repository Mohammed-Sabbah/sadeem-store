'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/toast';
import { adminService } from '../services/admin.service';
import type { AdminOverviewMetrics, AdminStoreItem } from '../types/admin.types';

export const ADMIN_QUERY_KEYS = {
  stores: ['admin', 'stores'] as const,
  products: ['admin', 'products'] as const,
  categories: ['admin', 'categories'] as const,
};

export function useAdminStoresQuery() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.stores,
    queryFn: async () => {
      const res = await adminService.getStores();
      return res.data;
    },
    staleTime: 1000 * 30,
  });
}

export function useAdminProductsQuery() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.products,
    queryFn: async () => {
      const res = await adminService.getProducts();
      return res.data;
    },
    staleTime: 1000 * 30,
  });
}

export function useAdminCategoriesQuery() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.categories,
    queryFn: async () => {
      const res = await adminService.getCategories();
      return res.data;
    },
    staleTime: 1000 * 60,
  });
}

export function useAdminOverviewQuery() {
  const storesQuery = useAdminStoresQuery();
  const productsQuery = useAdminProductsQuery();
  const categoriesQuery = useAdminCategoriesQuery();

  const isLoading = storesQuery.isLoading || productsQuery.isLoading || categoriesQuery.isLoading;

  const stores = storesQuery.data || [];
  const products = productsQuery.data || [];
  const categories = categoriesQuery.data || [];

  const metrics: AdminOverviewMetrics = {
    totalStores: stores.length,
    pendingStores: stores.filter((s: AdminStoreItem) => s.approveStatus === 'pending').length,
    activeStores: stores.filter((s: AdminStoreItem) => s.approveStatus === 'approved' && s.status === 'active').length,
    totalProducts: products.length,
    rejectedProducts: products.filter((p: any) => p.approveStatus === 'rejected').length,
    totalCategories: categories.length,
    activeCategories: categories.filter((c: any) => c.isActive !== false).length,
  };

  const pendingStoresList = stores.filter((s: AdminStoreItem) => s.approveStatus === 'pending');

  return {
    metrics,
    pendingStoresList,
    isLoading,
    refetch: () => {
      storesQuery.refetch();
      productsQuery.refetch();
      categoriesQuery.refetch();
    },
  };
}

export function useAdminStoreMutations() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const approveMutation = useMutation({
    mutationFn: (storeId: string) => adminService.approveStore(storeId),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('تم اعتماد المتجر وتفعيله بنجاح');
        queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.stores });
      } else {
        toast.error(res.message || 'تعذر اعتماد المتجر');
      }
    },
    onError: () => {
      toast.error('حدث خطأ أثناء اعتماد المتجر');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (storeId: string) => adminService.rejectStore(storeId),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('تم رفض طلب انضمام المتجر');
        queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.stores });
      } else {
        toast.error(res.message || 'تعذر رفض المتجر');
      }
    },
    onError: () => {
      toast.error('حدث خطأ أثناء رفض المتجر');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (storeId: string) => adminService.toggleStoreStatus(storeId),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('تم تحديث حالة نشاط المتجر');
        queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.stores });
      } else {
        toast.error(res.message || 'تعذر تغيير حالة المتجر');
      }
    },
    onError: () => {
      toast.error('حدث خطأ أثناء تعديل حالة المتجر');
    },
  });

  return {
    approveStore: approveMutation.mutate,
    isApproving: approveMutation.isPending,
    rejectStore: rejectMutation.mutate,
    isRejecting: rejectMutation.isPending,
    toggleStoreStatus: toggleStatusMutation.mutate,
    isToggling: toggleStatusMutation.isPending,
  };
}

export function useAdminProductMutations() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const approvalMutation = useMutation({
    mutationFn: ({
      productId,
      approveStatus,
      rejectReason,
    }: {
      productId: string;
      approveStatus: 'approved' | 'rejected';
      rejectReason?: string;
    }) => adminService.updateProductApproval(productId, approveStatus, rejectReason),
    onSuccess: (res, vars) => {
      if (res.success) {
        toast.success(
          vars.approveStatus === 'approved'
            ? 'تم تنشيط وفك تجميد الصنف بنجاح'
            : 'تم إيقاف الصنف إدارياً'
        );
        queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.products });
      } else {
        toast.error(res.message || 'تعذر تحديث حالة الصنف');
      }
    },
    onError: () => {
      toast.error('حدث خطأ أثناء تحديث حالة الصنف');
    },
  });

  return {
    updateApproval: approvalMutation.mutate,
    isUpdating: approvalMutation.isPending,
  };
}

export function useAdminCategoryMutations() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const createMutation = useMutation({
    mutationFn: (data: {
      title: string;
      variantAttributes?: Array<{ name: string; key: string; type: string; values?: string[] }>;
    }) => adminService.createCategory(data),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('تمت إضافة الفئة بنجاح');
        queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.categories });
      } else {
        toast.error(res.message || 'تعذر إضافة الفئة');
      }
    },
    onError: () => {
      toast.error('حدث خطأ أثناء إضافة الفئة');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        title?: string;
        variantAttributes?: Array<{ name: string; key: string; type: string; values?: string[] }>;
        isActive?: boolean;
      };
    }) => adminService.updateCategory(id, data),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('تم تحديث الفئة بنجاح');
        queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.categories });
      } else {
        toast.error(res.message || 'تعذر تحديث الفئة');
      }
    },
    onError: () => {
      toast.error('حدث خطأ أثناء تحديث الفئة');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteCategory(id),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('تم حذف الفئة بنجاح');
        queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.categories });
      } else {
        toast.error(res.message || 'تعذر حذف الفئة');
      }
    },
    onError: () => {
      toast.error('حدث خطأ أثناء حذف الفئة');
    },
  });

  return {
    createCategory: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateCategory: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteCategory: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}


