import { getRequest, postRequest, patchRequest, deleteRequest } from '@/shared/lib/coreApi';
import type { AdminStoreItem, AdminWalletTransactionItem } from '../types/admin.types';

export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'idemp_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
}

export const adminService = {
  /**
   * جلب كافة المتاجر في النظام للإدارة
   */
  async getStores(): Promise<{ success: boolean; data: AdminStoreItem[]; count: number }> {
    try {
      const res = await getRequest<{ stores: AdminStoreItem[]; count: number }>('/api/stores/admin');
      if (res.success && res.data?.stores) {
        return { success: true, data: res.data.stores, count: res.data.count || res.data.stores.length };
      }
      return { success: false, data: [], count: 0 };
    } catch {
      return { success: false, data: [], count: 0 };
    }
  },

  /**
   * اعتماد وقبول طلب انضمام المتجر
   */
  async approveStore(storeId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await patchRequest(`/api/stores/${storeId}/approve`, {});
      return { success: res.success, message: res.message };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر اعتماد المتجر' };
    }
  },

  /**
   * رفض طلب انضمام المتجر
   */
  async rejectStore(storeId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await patchRequest(`/api/stores/${storeId}/reject`, {});
      return { success: res.success, message: res.message };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر رفض المتجر' };
    }
  },

  /**
   * تجميد أو تنشيط المتجر
   */
  async toggleStoreStatus(storeId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await patchRequest(`/api/stores/${storeId}/toggle-status`, {});
      return { success: res.success, message: res.message };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر تعديل حالة المتجر' };
    }
  },

  /**
   * جلب تفاصيل صنف مفرد للإدارة
   */
  async getProductById(id: string): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const res = await getRequest<{ product: any }>(`/api/products/admin/${id}`);
      if (res.success && res.data?.product) {
        return { success: true, data: res.data.product };
      }
      return { success: false, message: 'تعذر جلب بيانات الصنف' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر جلب بيانات الصنف' };
    }
  },

  /**
   * جلب كافة المنتجات للإدارة
   */
  async getProducts(): Promise<{ success: boolean; data: any[]; count: number }> {
    try {
      const res = await getRequest<{ products: any[]; count: number }>('/api/products/admin');
      if (res.success && res.data?.products) {
        return { success: true, data: res.data.products, count: res.data.count || res.data.products.length };
      }
      return { success: false, data: [], count: 0 };
    } catch {
      return { success: false, data: [], count: 0 };
    }
  },

  /**
   * تحديث حالة اعتماد المنتج أو إيقافه
   */
  async updateProductApproval(
    productId: string,
    approveStatus: 'approved' | 'rejected',
    rejectReason?: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await patchRequest(`/api/products/${productId}/approval`, {
        approveStatus,
        reason: rejectReason || '',
        rejectReason: rejectReason || '',
      });
      return { success: res.success, message: res.message };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر تحديث حالة الصنف' };
    }
  },

  /**
   * جلب كافة الفئات من النظام
   */
  async getCategories(): Promise<{ success: boolean; data: any[]; count: number }> {
    try {
      const res = await getRequest<{ categories: any[] }>('/api/categories');
      if (res.success && res.data?.categories) {
        return { success: true, data: res.data.categories, count: res.data.categories.length };
      }
      return { success: false, data: [], count: 0 };
    } catch {
      return { success: false, data: [], count: 0 };
    }
  },

  /**
   * إضافة فئة جديدة للنظام
   */
  async createCategory(data: {
    title: string;
    variantAttributes?: Array<{ name: string; key: string; type: string; values?: string[] }>;
  }): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      const res = await postRequest<{ category: any }>('/api/categories', data);
      return { success: res.success, message: res.message, data: res.data?.category };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر إضافة الفئة' };
    }
  },

  /**
   * تعديل فئة موجودة
   */
  async updateCategory(
    id: string,
    data: {
      title?: string;
      variantAttributes?: Array<{ name: string; key: string; type: string; values?: string[] }>;
      isActive?: boolean;
    }
  ): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      const res = await patchRequest<{ category: any }>(`/api/categories/${id}`, data);
      return { success: res.success, message: res.message, data: res.data?.category };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر تحديث الفئة' };
    }
  },

  /**
   * حذف فئة
   */
  async deleteCategory(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await deleteRequest(`/api/categories/${id}`);
      return { success: res.success, message: res.message };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر حذف الفئة' };
    }
  },

  /**
   * جلب حركات المحفظة للإدارة مع الفلاتر والترقيم
   */
  async getWalletTransactions(params?: {
    status?: string;
    type?: string;
    offset?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: AdminWalletTransactionItem[]; total: number; message?: string }> {
    try {
      const query = new URLSearchParams();
      if (params?.status && params.status !== 'all') query.set('status', params.status);
      if (params?.type && params.type !== 'all') query.set('type', params.type);
      if (params?.offset !== undefined) query.set('offset', String(params.offset));
      if (params?.limit !== undefined) query.set('limit', String(params.limit));

      const qs = query.toString() ? `?${query.toString()}` : '';
      const res = await getRequest<{ transactions: AdminWalletTransactionItem[]; total: number }>(
        `/api/wallet/transactions${qs}`
      );
      if (res.success && res.data) {
        return {
          success: true,
          data: res.data.transactions || [],
          total: res.data.total || (res.data.transactions ? res.data.transactions.length : 0),
        };
      }
      return { success: false, data: [], total: 0, message: res.message };
    } catch (err: any) {
      return { success: false, data: [], total: 0, message: err?.message || 'تعذر جلب معاملات المحفظة' };
    }
  },

  /**
   * اعتماد طلب إيداع وشحن رصيد
   */
  async approveDeposit(
    transactionId: string,
    data: { amount?: number },
    idempotencyKey: string = generateIdempotencyKey()
  ): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      const res = await patchRequest(
        `/api/wallet/deposits/${transactionId}/approve`,
        { proofReviewed: true, ...(data.amount !== undefined ? { amount: data.amount } : {}) },
        { headers: { 'Idempotency-Key': idempotencyKey } }
      );
      return { success: res.success, message: res.message, data: res.data };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر اعتماد الإيداع' };
    }
  },

  /**
   * رفض طلب إيداع
   */
  async rejectDeposit(
    transactionId: string,
    rejectReason: string,
    idempotencyKey: string = generateIdempotencyKey()
  ): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      const res = await patchRequest(
        `/api/wallet/deposits/${transactionId}/reject`,
        { rejectReason },
        { headers: { 'Idempotency-Key': idempotencyKey } }
      );
      return { success: res.success, message: res.message, data: res.data };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر رفض الإيداع' };
    }
  },

  /**
   * اعتماد طلب سحب رصيد
   */
  async approveWithdrawal(
    transactionId: string,
    payoutReference?: string,
    idempotencyKey: string = generateIdempotencyKey()
  ): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      const res = await patchRequest(
        `/api/wallet/withdrawals/${transactionId}/approve`,
        { payoutReference: payoutReference || '' },
        { headers: { 'Idempotency-Key': idempotencyKey } }
      );
      return { success: res.success, message: res.message, data: res.data };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر اعتماد السحب' };
    }
  },

  /**
   * رفض طلب سحب رصيد
   */
  async rejectWithdrawal(
    transactionId: string,
    rejectReason: string,
    idempotencyKey: string = generateIdempotencyKey()
  ): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      const res = await patchRequest(
        `/api/wallet/withdrawals/${transactionId}/reject`,
        { rejectReason },
        { headers: { 'Idempotency-Key': idempotencyKey } }
      );
      return { success: res.success, message: res.message, data: res.data };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر رفض السحب' };
    }
  },
};
