import test from 'node:test';
import assert from 'node:assert/strict';

function computeMerchantMetrics(products) {
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

function formatProductPriceRange(product) {
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

test('formatProductPriceRange handles single price', () => {
  const product = { minPrice: 50, maxPrice: 50, variants: [] };
  assert.equal(formatProductPriceRange(product), '50 ₪');
});

test('formatProductPriceRange handles variant price range', () => {
  const product = {
    minPrice: 50,
    maxPrice: 80,
    variants: [
      { price: 50, isActive: true },
      { price: 65, isActive: true },
      { price: 80, isActive: true },
    ]
  };
  assert.equal(formatProductPriceRange(product), '50 – 80 ₪');
});

test('formatProductPriceRange ignores inactive variants when active exist', () => {
  const product = {
    minPrice: 20,
    maxPrice: 100,
    variants: [
      { price: 20, isActive: false },
      { price: 50, isActive: true },
      { price: 70, isActive: true },
      { price: 100, isActive: false },
    ]
  };
  assert.equal(formatProductPriceRange(product), '50 – 70 ₪');
});
