export type AdminProductTab = 'all' | 'approved' | 'rejected' | 'out_of_stock';

export interface AdminProductFilterState {
  query: string;
  tab: AdminProductTab;
  storeId?: string;
  categoryId?: string;
}

export interface AdminProductMetrics {
  total: number;
  approved: number;
  rejected: number;
  outOfStock: number;
}

export function computeAdminProductMetrics(products: any[]): AdminProductMetrics {
  let approved = 0;
  let rejected = 0;
  let outOfStock = 0;

  for (const p of products) {
    if (p.approveStatus === 'rejected') {
      rejected += 1;
    } else {
      approved += 1;
    }

    const stock = Number(p.totalStock ?? p.stock ?? 0);
    const inStock = p.inStock !== false && stock > 0;
    if (!inStock) {
      outOfStock += 1;
    }
  }

  return {
    total: products.length,
    approved,
    rejected,
    outOfStock,
  };
}

export function filterAdminProducts(
  products: any[],
  filters: AdminProductFilterState
): any[] {
  const query = (filters.query || '').trim().toLowerCase();
  const tab = filters.tab || 'all';
  const storeId = filters.storeId || 'all';
  const categoryId = filters.categoryId || 'all';

  return products.filter((p) => {
    // 1. Tab filter
    if (tab === 'approved' && p.approveStatus === 'rejected') return false;
    if (tab === 'rejected' && p.approveStatus !== 'rejected') return false;
    if (tab === 'out_of_stock') {
      const stock = Number(p.totalStock ?? p.stock ?? 0);
      const inStock = p.inStock !== false && stock > 0;
      if (inStock) return false;
    }

    // 2. Store filter
    if (storeId && storeId !== 'all') {
      const pStoreId = typeof p.storeId === 'object' ? p.storeId?._id : p.storeId;
      if (String(pStoreId) !== String(storeId)) return false;
    }

    // 3. Category filter
    if (categoryId && categoryId !== 'all') {
      const pCatId = typeof p.categoryId === 'object' ? p.categoryId?._id : p.categoryId;
      if (String(pCatId) !== String(categoryId)) return false;
    }

    // 4. Search query
    if (query) {
      const name = (p.title || p.name || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const storeName = (typeof p.storeId === 'object' ? p.storeId?.name || '' : '').toLowerCase();
      const catName = (typeof p.categoryId === 'object' ? p.categoryId?.title || '' : '').toLowerCase();

      const match =
        name.includes(query) ||
        desc.includes(query) ||
        storeName.includes(query) ||
        catName.includes(query);

      if (!match) return false;
    }

    return true;
  });
}
