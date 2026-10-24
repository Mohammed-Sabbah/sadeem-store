import { getRequest, patchRequest } from '@/shared/lib/coreApi';
import type { AdminStoreItem, AdminOverviewMetrics } from '../types/admin.types';

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
};
