import { getRequest, postRequest, patchRequest } from '@/shared/lib/coreApi';

export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'idemp_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
}

export interface UserWalletData {
  _id: string;
  userId: string;
  balance: number;
  withdrawableBalance: number;
  isFrozen: boolean;
  status: string;
}

export interface UserWalletTransaction {
  _id: string;
  walletId: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'purchase' | 'refund';
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  amount: number;
  requestedAmount?: number;
  balanceType: 'withdrawable' | 'storeCredit';
  proofImage?: string;
  rejectReason?: string;
  referenceId?: string;
  createdAt: string;
}

export const walletService = {
  /**
   * جلب بيانات محفظة المستخدم ورصيده
   */
  async getWallet(): Promise<{ success: boolean; data?: UserWalletData; message?: string }> {
    try {
      const res = await getRequest<{ wallet: UserWalletData }>('/api/wallet');
      if (res.success && res.data?.wallet) {
        return { success: true, data: res.data.wallet };
      }
      return { success: false, message: res.message || 'تعذر استرجاع المحفظة' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر استرجاع المحفظة' };
    }
  },

  /**
   * جلب سجل حركات المحفظة للمستخدم
   */
  async getUserTransactions(params?: {
    offset?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: UserWalletTransaction[]; total: number; message?: string }> {
    try {
      const query = new URLSearchParams();
      if (params?.offset !== undefined) query.set('offset', String(params.offset));
      if (params?.limit !== undefined) query.set('limit', String(params.limit));
      const qs = query.toString() ? `?${query.toString()}` : '';

      const res = await getRequest<{ transactions: UserWalletTransaction[]; total: number }>(
        `/api/wallet/user/transactions${qs}`
      );
      if (res.success && res.data) {
        return {
          success: true,
          data: res.data.transactions || [],
          total: res.data.total || 0,
        };
      }
      return { success: false, data: [], total: 0, message: res.message };
    } catch (err: any) {
      return { success: false, data: [], total: 0, message: err?.message || 'تعذر جلب الحركات' };
    }
  },

  /**
   * تقديم طلب شحن رصيد وإرفاق إشعار التحويل
   */
  async submitDeposit(
    data: { amount: number; proofImage: File | string },
    idempotencyKey: string = generateIdempotencyKey()
  ): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      let body: any;
      if (data.proofImage instanceof File) {
        const formData = new FormData();
        formData.append('amount', String(data.amount));
        formData.append('proofImage', data.proofImage);
        body = formData;
      } else {
        body = {
          amount: data.amount,
          proofImage: data.proofImage,
        };
      }

      const res = await postRequest('/api/deposits', body, {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      });
      return { success: res.success, message: res.message, data: res.data };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر إرسال طلب الشحن' };
    }
  },

  /**
   * تقديم طلب سحب رصيد
   */
  async submitWithdrawal(
    data: {
      amount: number;
      payoutDetails: { bankName: string; accountNumber: string; accountName: string; notes?: string };
    },
    idempotencyKey: string = generateIdempotencyKey()
  ): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      const res = await postRequest('/api/withdrawals', data, {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      });
      return { success: res.success, message: res.message, data: res.data };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر إرسال طلب السحب' };
    }
  },

  /**
   * إلغاء معاملة معلقة بواسطة صاحب المحفظة
   */
  async cancelTransaction(
    transactionId: string,
    idempotencyKey: string = generateIdempotencyKey()
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await patchRequest(
        `/api/wallet/transactions/${transactionId}/cancel`,
        {},
        {
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
        }
      );
      return { success: res.success, message: res.message };
    } catch (err: any) {
      return { success: false, message: err?.message || 'تعذر إلغاء المعاملة' };
    }
  },
};
