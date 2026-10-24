import type { ProductItem, MerchantMetrics } from '../types/merchant.types';

/**
 * دالة حسابية نقية (Pure Domain Function)
 * تحسب مؤشرات وإحصائيات متجر التاجر اللحظية من كاش المنتجات
 */
export function computeMerchantMetrics(products: ProductItem[]): MerchantMetrics {
  const total = products.length;
  const inStock = products.filter((p) => p.inStock && (p.totalStock ?? 0) > 0).length;
  const outOfStock = products.filter((p) => !p.inStock || (p.totalStock ?? 0) === 0).length;
  const active = products.filter((p) => p.isActive).length;
  const units = products.reduce((sum, p) => sum + (p.totalStock ?? 0), 0);

  return {
    totalProducts: total,
    inStockProducts: inStock,
    outOfStockProducts: outOfStock,
    totalInventoryUnits: units,
    activeProducts: active,
  };
}
