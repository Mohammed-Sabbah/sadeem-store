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

/**
 * دالة حسابية نقية لإنشاء نص السعر أو نطاق الأسعار للمنتج ومتغيراته
 */
export function formatProductPriceRange(product: ProductItem): string {
  const activeVariants = (product.variants || []).filter((v) => v.isActive !== false);
  const effectiveVariants = activeVariants.length > 0 ? activeVariants : (product.variants || []);
  const variantPrices = effectiveVariants
    .map((v) => Number(v.price) || 0)
    .filter((pr) => pr > 0);

  const effectiveMin = variantPrices.length > 0 ? Math.min(...variantPrices) : (Number(product.minPrice) || 0);
  const effectiveMax = variantPrices.length > 0 ? Math.max(...variantPrices) : (Number(product.maxPrice) || 0);

  return effectiveMin === effectiveMax
    ? `${effectiveMin} ₪`
    : `${effectiveMin} – ${effectiveMax} ₪`;
}
