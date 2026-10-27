export type AdminNavSectionId =
  | 'overview'
  | 'stores'
  | 'products'
  | 'categories'
  | 'wallet'
  | 'orders'
  | 'couriers'
  | 'customers'
  | 'finances';

export interface AdminNavItem {
  id: AdminNavSectionId;
  label: string;
  href: string;
  status: 'active' | 'deferred';
  badge?: string;
  description?: string;
}

export interface AdminStoreOwner {
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string;
}

export interface AdminStoreItem {
  _id: string;
  name: string;
  logo?: string;
  description?: string;
  address?: {
    governorate?: string;
    city?: string;
    detailedAddress?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  balance?: number;
  status: 'active' | 'inActive';
  approveStatus: 'pending' | 'approved' | 'rejected';
  ownerId?: AdminStoreOwner;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminCityDistribution {
  city: string;
  count: number;
}

export interface AdminOverviewMetrics {
  totalStores: number;
  pendingStores: number;
  activeStores: number;
  totalProducts: number;
  rejectedProducts: number;
  outOfStockProducts: number;
  totalCategories: number;
  activeCategories: number;
  totalPayableBalance: number;
  storesByCity: AdminCityDistribution[];
  pendingWalletRequestsCount: number;
  pendingWalletAmount: number;
}

export interface AdminWalletTransactionItem {
  _id: string;
  walletId: string;
  userId?: {
    _id: string;
    name: string;
    phoneNumber?: string;
    email?: string;
  };
  type: 'deposit' | 'withdrawal' | 'purchase' | 'refund';
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  amount: number;
  requestedAmount?: number;
  balanceType: 'withdrawable' | 'storeCredit';
  proofImage?: string;
  proofReviewed?: boolean;
  rejectReason?: string;
  referenceId?: string;
  payoutDetails?: {
    method?: string;
    accountNumber?: string;
    accountName?: string;
    notes?: string;
  };
  createdAt: string;
  updatedAt: string;
}
