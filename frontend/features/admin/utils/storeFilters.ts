import type { AdminStoreItem } from '../types/admin.types';

export type AdminStoreTab = 'approved' | 'pending' | 'rejected' | 'all';

export interface AdminStoreFilterState {
  query: string;
  tab: AdminStoreTab;
  city?: string;
}

export interface AdminStoreMetrics {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  active: number;
  frozen: number;
}

export function computeAdminStoreMetrics(stores: AdminStoreItem[]): AdminStoreMetrics {
  let approved = 0;
  let pending = 0;
  let rejected = 0;
  let active = 0;
  let frozen = 0;

  for (const s of stores) {
    if (s.approveStatus === 'approved') {
      approved += 1;
      if (s.status === 'active') active += 1;
      else frozen += 1;
    } else if (s.approveStatus === 'pending') {
      pending += 1;
    } else if (s.approveStatus === 'rejected') {
      rejected += 1;
    }
  }

  return {
    total: stores.length,
    approved,
    pending,
    rejected,
    active,
    frozen,
  };
}

export function filterAdminStores(
  stores: AdminStoreItem[],
  filters: AdminStoreFilterState
): AdminStoreItem[] {
  const query = (filters.query || '').trim().toLowerCase();
  const tab = filters.tab || 'approved';
  const city = (filters.city || '').trim();

  return stores.filter((s) => {
    // 1. Tab filter
    if (tab === 'approved' && s.approveStatus !== 'approved') return false;
    if (tab === 'pending' && s.approveStatus !== 'pending') return false;
    if (tab === 'rejected' && s.approveStatus !== 'rejected') return false;

    // 2. City filter
    if (city && city !== 'all') {
      const storeCity = s.address?.city || '';
      if (!storeCity.includes(city)) return false;
    }

    // 3. Search query filter
    if (query) {
      const matchName = s.name.toLowerCase().includes(query);
      const matchOwner = Boolean(s.ownerId?.name?.toLowerCase().includes(query));
      const matchPhone = Boolean(s.ownerId?.phoneNumber?.includes(query));
      const matchCity = Boolean(s.address?.city?.toLowerCase().includes(query));

      if (!matchName && !matchOwner && !matchPhone && !matchCity) {
        return false;
      }
    }

    return true;
  });
}
