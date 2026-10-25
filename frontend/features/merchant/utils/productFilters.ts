import type { ProductItem } from '../types/merchant.types';

export type FilterTab = 'all' | 'in_stock' | 'out_of_stock' | 'inactive';

export interface ProductFilterState {
  query: string;
  tab: FilterTab;
}

export interface ProductFilterMetrics {
  total: number;
  inStock: number;
  outOfStock: number;
  inactive: number;
}

export function isValidFilterTab(value: unknown): value is FilterTab {
  return value === 'all' || value === 'in_stock' || value === 'out_of_stock' || value === 'inactive';
}

export function computeFilterMetrics(products: ProductItem[]): ProductFilterMetrics {
  let inStock = 0;
  let outOfStock = 0;
  let inactive = 0;

  for (const product of products) {
    const isAvailable = product.inStock && (product.totalStock ?? 0) > 0;
    if (isAvailable) {
      inStock += 1;
    } else {
      outOfStock += 1;
    }

    if (!product.isActive) {
      inactive += 1;
    }
  }

  return {
    total: products.length,
    inStock,
    outOfStock,
    inactive,
  };
}

export function filterProducts(products: ProductItem[], filter: ProductFilterState): ProductItem[] {
  const normalizedQuery = filter.query.trim().toLowerCase();
  const hasQuery = normalizedQuery.length > 0;

  return products.filter((product) => {
    if (hasQuery) {
      const nameMatch = product.name.toLowerCase().includes(normalizedQuery);
      const descMatch = Boolean(product.description && product.description.toLowerCase().includes(normalizedQuery));
      if (!nameMatch && !descMatch) {
        return false;
      }
    }

    switch (filter.tab) {
      case 'in_stock':
        return product.inStock && (product.totalStock ?? 0) > 0;
      case 'out_of_stock':
        return !product.inStock || (product.totalStock ?? 0) === 0;
      case 'inactive':
        return !product.isActive;
      case 'all':
      default:
        return true;
    }
  });
}
