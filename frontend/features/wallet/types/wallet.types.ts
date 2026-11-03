export type WalletTransactionType = 'deposit' | 'withdrawal' | 'purchase' | 'refund';

export type WalletTransactionStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type BalanceType = 'withdrawable' | 'storeCredit';

export interface PayoutDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
  notes?: string;
}

export interface WalletTransactionItem {
  _id: string;
  walletId: string;
  userId: string;
  type: WalletTransactionType;
  status: WalletTransactionStatus;
  amount: number;
  requestedAmount?: number;
  balanceType: BalanceType;
  proofImage?: string;
  rejectReason?: string;
  referenceId?: string;
  payoutDetails?: PayoutDetails;
  reviewedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserWalletData {
  _id: string;
  userId: string;
  balance: number;
  withdrawableBalance: number;
  storeCreditBalance?: number;
  isFrozen: boolean;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}
