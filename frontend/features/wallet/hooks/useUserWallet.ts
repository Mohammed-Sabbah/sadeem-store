'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/toast';
import { walletService } from '../services/wallet.service';

export const USER_WALLET_KEYS = {
  wallet: ['user', 'wallet'] as const,
  transactions: (params?: any) => ['user', 'wallet', 'transactions', params] as const,
};

export function useUserWalletQuery(options?: {
  enabled?: boolean;
  refetchInterval?: number | false | ((query: any) => number | false);
}) {
  return useQuery({
    queryKey: USER_WALLET_KEYS.wallet,
    queryFn: async () => {
      const res = await walletService.getWallet();
      return res.data;
    },
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 3,
    refetchInterval: options?.refetchInterval ?? false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}

export function useUserTransactionsQuery(params?: {
  offset?: number;
  limit?: number;
  refetchInterval?: number | false | ((query: any) => number | false);
}) {
  return useQuery({
    queryKey: USER_WALLET_KEYS.transactions(params),
    queryFn: async () => {
      const res = await walletService.getUserTransactions(params);
      return res;
    },
    staleTime: 1000 * 3,
    refetchInterval:
      params?.refetchInterval ??
      ((query: any) => {
        const items = query.state.data?.data;
        if (Array.isArray(items) && items.some((t: any) => t.status === 'pending')) {
          return 3000;
        }
        return false;
      }),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}

export function useUserWalletOperations() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const depositMutation = useMutation({
    mutationFn: (data: { amount: number; proofImage: File | string; referenceId?: string }) =>
      walletService.submitDeposit(data),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('تم إرسال طلب الشحن بنجاح وهو قيد التدقيق لدى الإدارة');
        queryClient.invalidateQueries({
          queryKey: ['user', 'wallet'],
          refetchType: 'all',
        });
      } else {
        toast.error(res.message || 'تعذر إرسال طلب الشحن');
      }
    },
    onError: () => {
      toast.error('حدث خطأ أثناء إرسال طلب الشحن');
    },
  });

  const withdrawalMutation = useMutation({
    mutationFn: (data: {
      amount: number;
      payoutDetails: { bankName: string; accountNumber: string; accountName: string; notes?: string };
    }) => walletService.submitWithdrawal(data),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('تم تقديم طلب سحب الرصيد بنجاح');
        queryClient.invalidateQueries({
          queryKey: ['user', 'wallet'],
          refetchType: 'all',
        });
      } else {
        toast.error(res.message || 'تعذر تقديم طلب السحب');
      }
    },
    onError: () => {
      toast.error('حدث خطأ أثناء تقديم طلب السحب');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (transactionId: string) => walletService.cancelTransaction(transactionId),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('تم إلغاء المعاملة المعلقة بنجاح');
        queryClient.invalidateQueries({
          queryKey: ['user', 'wallet'],
          refetchType: 'all',
        });
      } else {
        toast.error(res.message || 'تعذر إلغاء المعاملة');
      }
    },
    onError: () => {
      toast.error('حدث خطأ أثناء إلغاء المعاملة');
    },
  });

  return {
    submitDeposit: depositMutation.mutate,
    isSubmittingDeposit: depositMutation.isPending,
    submitWithdrawal: withdrawalMutation.mutate,
    isSubmittingWithdrawal: withdrawalMutation.isPending,
    cancelTransaction: cancelMutation.mutate,
    isCancelling: cancelMutation.isPending,
  };
}
