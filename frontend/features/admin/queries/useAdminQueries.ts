'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/toast';
import { adminService } from '../services/admin.service';
import { getProductTotalStock } from '../utils/productAdminFilters';
import type { AdminOverviewMetrics, AdminStoreItem, AdminWalletTransactionItem } from '../types/admin.types';

export const ADMIN_QUERY_KEYS = {
  stores: ['admin', 'stores'] as const,
  products: ['admin', 'products'] as const,
  product: (id: string) => ['admin', 'product', id] as const,
  categories: ['admin', 'categories'] as const,
  walletTransactions: (params?: any) => ['admin', 'wallet', 'transactions', params] as const,
  walletPending: ['admin', 'wallet', 'pending'] as const,
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

export function useAdminProductQuery(productId: string) {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.product(productId),
    queryFn: async () => {
      const res = await adminService.getProductById(productId);
      if (!res.success || !res.data) {
        throw new Error(res.message || 'تعذر جلب تفاصيل الصنف');
      }
      return res.data;
    },
    enabled: Boolean(productId),
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

export function useAdminWalletTransactionsQuery(params?: {
  status?: string;
  type?: string;
  offset?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.walletTransactions(params),
    queryFn: async () => {
      const res = await adminService.getWalletTransactions(params);
      return res;
    },
    staleTime: 1000 * 20,
  });
}

export function useAdminWalletPendingCountQuery() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.walletPending,
    queryFn: async () => {
      const res = await adminService.getWalletTransactions({ status: 'pending', limit: 100 });
      const items: AdminWalletTransactionItem[] = res.data || [];
      const pendingDeposits = items.filter((t) => t.type === 'deposit');
      const pendingWithdrawals = items.filter((t) => t.type === 'withdrawal');
      const totalPendingAmount = items.reduce(
        (sum, t) => sum + (Number(t.amount) || Number(t.requestedAmount) || 0),
        0
      );
      return {
        totalPendingCount: items.length,
        pendingDepositsCount: pendingDeposits.length,
        pendingWithdrawalsCount: pendingWithdrawals.length,
        totalPendingAmount,
        pendingItems: items,
      };
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
}

export function useAdminOverviewQuery() {
  const storesQuery = useAdminStoresQuery();
  const productsQuery = useAdminProductsQuery();
  const categoriesQuery = useAdminCategoriesQuery();
  const walletPendingQuery = useAdminWalletPendingCountQuery();

  const isLoading =
    storesQuery.isLoading ||
    productsQuery.isLoading ||
    categoriesQuery.isLoading ||
    walletPendingQuery.isLoading;

  const stores = storesQuery.data || [];
  const products = productsQuery.data || [];
  const categories = categoriesQuery.data || [];
  const walletStats = walletPendingQuery.data;

  const MIDDLE_CITIES = ['دير البلح', 'مخيم النصيرات', 'الزوايدة', 'مخيم البريج', 'مخيم المغازي'];
  const storesByCity = MIDDLE_CITIES.map((city) => ({
    city,
    count: stores.filter((s: AdminStoreItem) => s.address?.city === city || s.address?.city?.includes(city)).length,
  }));

  const metrics: AdminOverviewMetrics = {
    totalStores: stores.length,
    pendingStores: stores.filter((s: AdminStoreItem) => s.approveStatus === 'pending').length,
    activeStores: stores.filter((s: AdminStoreItem) => s.approveStatus === 'approved' && s.status === 'active').length,
    totalProducts: products.length,
    rejectedProducts: products.filter((p: any) => p.approveStatus === 'rejected').length,
    outOfStockProducts: products.filter((p: any) => getProductTotalStock(p) === 0).length,
    totalCategories: categories.length,
    activeCategories: categories.filter((c: any) => c.isActive !== false).length,
    totalPayableBalance: stores.reduce((sum: number, s: AdminStoreItem) => sum + (Number(s.balance) || 0), 0),
    storesByCity,
    pendingWalletRequestsCount: walletStats?.totalPendingCount || 0,
    pendingWalletAmount: walletStats?.totalPendingAmount || 0,
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
      walletPendingQuery.refetch();
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
        toast.success('تم تحديث حالة المتجر بنجاح');
        queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.stores });
      } else {
        toast.error(res.message || 'تعذر تعديل حالة المتجر');
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

export function useAdminProductApprovalMutation() {
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
        toast.success(vars.approveStatus === 'approved' ? 'تم اعتماد الصنف بنجاح' : 'تم إيقاف الصنف وتوثيق السبب');
        queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.products });
        queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.product(vars.productId) });
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

export const useAdminProductMutations = useAdminProductApprovalMutation;

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

export function useAdminWalletMutations() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const approveDepositMutation = useMutation({
    mutationFn: ({
      transactionId,
      amount,
    }: {
      transactionId: string;
      amount?: number;
    }) => adminService.approveDeposit(transactionId, { amount }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('تم اعتماد شحن الرصيد وإيداعه بنجاح');
        queryClient.invalidateQueries({ queryKey: ['admin', 'wallet'] });
      } else {
        toast.error(res.message || 'تعذر اعتماد الشحن');
      }
    },
    onError: () => {
      toast.error('حدث خطأ أثناء اعتماد الإيداع');
    },
  });

  const rejectDepositMutation = useMutation({
    mutationFn: ({
      transactionId,
      rejectReason,
    }: {
      transactionId: string;
      rejectReason: string;
    }) => adminService.rejectDeposit(transactionId, rejectReason),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('تم رفض طلب الشحن وتوثيق السبب');
        queryClient.invalidateQueries({ queryKey: ['admin', 'wallet'] });
      } else {
        toast.error(res.message || 'تعذر رفض الشحن');
      }
    },
    onError: () => {
      toast.error('حدث خطأ أثناء رفض الإيداع');
    },
  });

  const approveWithdrawalMutation = useMutation({
    mutationFn: ({
      transactionId,
      payoutReference,
    }: {
      transactionId: string;
      payoutReference?: string;
    }) => adminService.approveWithdrawal(transactionId, payoutReference),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('تم اعتماد السحب وتوثيق مرجع الحوالة');
        queryClient.invalidateQueries({ queryKey: ['admin', 'wallet'] });
      } else {
        toast.error(res.message || 'تعذر اعتماد السحب');
      }
    },
    onError: () => {
      toast.error('حدث خطأ أثناء اعتماد السحب');
    },
  });

  const rejectWithdrawalMutation = useMutation({
    mutationFn: ({
      transactionId,
      rejectReason,
    }: {
      transactionId: string;
      rejectReason: string;
    }) => adminService.rejectWithdrawal(transactionId, rejectReason),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('تم رفض طلب السحب واسترداد الرصيد للمستخدم');
        queryClient.invalidateQueries({ queryKey: ['admin', 'wallet'] });
      } else {
        toast.error(res.message || 'تعذر رفض السحب');
      }
    },
    onError: () => {
      toast.error('حدث خطأ أثناء رفض السحب');
    },
  });

  return {
    approveDeposit: approveDepositMutation.mutate,
    isApprovingDeposit: approveDepositMutation.isPending,
    rejectDeposit: rejectDepositMutation.mutate,
    isRejectingDeposit: rejectDepositMutation.isPending,
    approveWithdrawal: approveWithdrawalMutation.mutate,
    isApprovingWithdrawal: approveWithdrawalMutation.isPending,
    rejectWithdrawal: rejectWithdrawalMutation.mutate,
    isRejectingWithdrawal: rejectWithdrawalMutation.isPending,
  };
}
