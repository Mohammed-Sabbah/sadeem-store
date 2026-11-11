import { getRequest, postRequest, patchRequest } from '@/shared/lib/coreApi';
import type {
  BackendOrder,
  BackendOrderGroup,
  OrderPagination,
} from '../types/order.types';

export interface CreateOrderPayload {
  items: Array<{
    variantId: string;
    quantity: number;
  }>;
  deliveryAddress: string;
  deliveryPhone: string;
  paymentMethod: 'wallet' | 'jawwalpay';
}

export interface ListOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  storeId?: string;
}

export interface ListOrdersResponse {
  orders: BackendOrder[];
  pagination: OrderPagination;
}

/**
 * دالة تطبيع دفاعية لاستخراج قائمة الطلبات وبيانات الترقيم مهما كان هيكل استجابة الباك إند
 * (سواء كانت مصفوفة مباشرة، أو { orders: [...] } أو مغلفة { orders: { orders: [...] } })
 */
function normalizeOrdersResponse(raw: any): ListOrdersResponse {
  if (!raw) {
    return {
      orders: [],
      pagination: {
        page: 1,
        limit: 10,
        totalOrders: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }

  // الحالة 1: استجابة مصفوفة مباشرة [...]
  if (Array.isArray(raw)) {
    return {
      orders: raw,
      pagination: {
        page: 1,
        limit: raw.length,
        totalOrders: raw.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }

  // الحالة 2: غلاف الباك إند المزدوج { orders: { orders: [...], pagination } }
  if (raw.orders && typeof raw.orders === 'object' && Array.isArray(raw.orders.orders)) {
    return {
      orders: raw.orders.orders,
      pagination: raw.orders.pagination || {
        page: 1,
        limit: raw.orders.orders.length,
        totalOrders: raw.orders.orders.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }

  // الحالة 3: الهيكل المعياري { orders: [...], pagination: {...} }
  if (Array.isArray(raw.orders)) {
    return {
      orders: raw.orders,
      pagination: raw.pagination || {
        page: 1,
        limit: raw.orders.length,
        totalOrders: raw.orders.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }

  // الحالة 4: استجابة مغلفة في data
  if (raw.data) {
    return normalizeOrdersResponse(raw.data);
  }

  return {
    orders: [],
    pagination: {
      page: 1,
      limit: 10,
      totalOrders: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
}

export const orderService = {
  /**
   * إنشاء طلب موحد جديد وخصم قيمته من المحفظة
   */
  async placeOrder(payload: CreateOrderPayload): Promise<{
    success: boolean;
    data?: {
      order: {
        createdOrderGroup: BackendOrderGroup;
        createdOrders: BackendOrder[];
      };
    };
    message?: string;
  }> {
    try {
      const res = await postRequest<{
        order: {
          createdOrderGroup: BackendOrderGroup;
          createdOrders: BackendOrder[];
        };
      }>('/api/orders', payload);

      if (res.success && res.data) {
        return { success: true, data: res.data };
      }
      return { success: false, message: res.message || 'تعذر تأكيد الطلب' };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'تعذر تأكيد الطلب';
      return { success: false, message: errorMsg };
    }
  },

  /**
   * جلب قائمة طلبات الزبون الحالي
   */
  async getCustomerOrders(params?: ListOrdersParams): Promise<{
    success: boolean;
    data?: ListOrdersResponse;
    message?: string;
  }> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.status) query.set('status', params.status);
      if (params?.search) query.set('search', params.search);

      const qs = query.toString() ? `?${query.toString()}` : '';
      const res = await getRequest<any>(`/api/orders${qs}`);

      if (res.success && res.data) {
        return { success: true, data: normalizeOrdersResponse(res.data) };
      }
      return { success: false, message: res.message || 'تعذر جلب الطلبات' };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'تعذر جلب الطلبات';
      return { success: false, message: errorMsg };
    }
  },

  /**
   * جلب قائمة طلبات المتجر الخاصة بالتاجر
   */
  async getStoreOrders(params?: ListOrdersParams): Promise<{
    success: boolean;
    data?: ListOrdersResponse;
    message?: string;
  }> {
    try {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.status) query.set('status', params.status);
      if (params?.search) query.set('search', params.search);

      const qs = query.toString() ? `?${query.toString()}` : '';
      const res = await getRequest<any>(`/api/orders/store${qs}`);

      if (res.success && res.data) {
        return { success: true, data: normalizeOrdersResponse(res.data) };
      }
      return { success: false, message: res.message || 'تعذر جلب طلبات المتجر' };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'تعذر جلب طلبات المتجر';
      return { success: false, message: errorMsg };
    }
  },

  /**
   * جلب تفاصيل طلب محدد بالمعرف
   */
  async getOrderById(id: string): Promise<{
    success: boolean;
    data?: BackendOrder;
    message?: string;
  }> {
    try {
      const res = await getRequest<{ order: BackendOrder }>(`/api/orders/${id}`);
      if (res.success && res.data?.order) {
        return { success: true, data: res.data.order };
      }
      return { success: false, message: res.message || 'الطلب غير موجود' };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'الطلب غير موجود';
      return { success: false, message: errorMsg };
    }
  },

  /**
   * إلغاء الطلب بالكامل للزبون واسترجاع المبلغ للمحفظة
   */
  async cancelOrder(orderIdOrGroupId: string): Promise<{
    success: boolean;
    data?: BackendOrderGroup;
    message?: string;
  }> {
    try {
      const res = await patchRequest<{ order: BackendOrderGroup }>(
        `/api/orders/${orderIdOrGroupId}/cancel`,
        {}
      );
      if (res.success) {
        return { success: true, data: res.data?.order };
      }
      return { success: false, message: res.message || 'تعذر إلغاء الطلب' };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'تعذر إلغاء الطلب';
      return { success: false, message: errorMsg };
    }
  },

  /**
   * تمكين التاجر من إلغاء صنف غير متوفر من الطلب مع رد ثمنه للمشتري
   */
  async cancelOrderItem(
    orderId: string,
    variantId: string
  ): Promise<{
    success: boolean;
    data?: unknown;
    message?: string;
  }> {
    try {
      const res = await patchRequest(
        `/api/orders/${orderId}/items/${variantId}/cancel`,
        {}
      );
      if (res.success) {
        return { success: true, data: res.data };
      }
      return { success: false, message: res.message || 'تعذر إلغاء الصنف' };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'تعذر إلغاء الصنف';
      return { success: false, message: errorMsg };
    }
  },
};
