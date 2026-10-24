export type AdminNavSectionId =
  | 'overview'
  | 'stores'
  | 'products'
  | 'categories'
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

export interface AdminOverviewMetrics {
  totalStores: number;
  pendingStores: number;
  totalProducts: number;
  rejectedProducts: number;
  totalCategories: number;
  activeCategories: number;
}
