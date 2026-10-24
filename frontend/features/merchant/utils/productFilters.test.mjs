import test from 'node:test';
import assert from 'node:assert/strict';

function isValidFilterTab(value) {
  return value === 'all' || value === 'in_stock' || value === 'out_of_stock' || value === 'inactive';
}

function computeFilterMetrics(products) {
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

function filterProducts(products, filter) {
  const normalizedQuery = (filter.query || '').trim().toLowerCase();
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

const sampleProducts = [
  { _id: '1', name: 'قميص كتان', description: 'فاخر ومريح', inStock: true, totalStock: 12, isActive: true },
  { _id: '2', name: 'حذاء جلدي', description: 'أسود رسمي', inStock: false, totalStock: 0, isActive: true },
  { _id: '3', name: 'بطارية ليثيوم', description: '100 أمبير', inStock: true, totalStock: 4, isActive: false },
  { _id: '4', name: 'زيت زيتون', description: 'بلدي عصرة أولى', inStock: false, totalStock: 0, isActive: false },
];

test('computeFilterMetrics calculates exact counts', () => {
  const metrics = computeFilterMetrics(sampleProducts);
  assert.equal(metrics.total, 4);
  assert.equal(metrics.inStock, 2);
  assert.equal(metrics.outOfStock, 2);
  assert.equal(metrics.inactive, 2);
});

test('filterProducts filters by tab correctly', () => {
  const all = filterProducts(sampleProducts, { query: '', tab: 'all' });
  assert.equal(all.length, 4);

  const inStock = filterProducts(sampleProducts, { query: '', tab: 'in_stock' });
  assert.equal(inStock.length, 2);
  assert.deepEqual(inStock.map(p => p._id), ['1', '3']);

  const outOfStock = filterProducts(sampleProducts, { query: '', tab: 'out_of_stock' });
  assert.equal(outOfStock.length, 2);
  assert.deepEqual(outOfStock.map(p => p._id), ['2', '4']);

  const inactive = filterProducts(sampleProducts, { query: '', tab: 'inactive' });
  assert.equal(inactive.length, 2);
  assert.deepEqual(inactive.map(p => p._id), ['3', '4']);
});

test('filterProducts filters by search query on name and description', () => {
  const byName = filterProducts(sampleProducts, { query: 'قميص', tab: 'all' });
  assert.equal(byName.length, 1);
  assert.equal(byName[0]._id, '1');

  const byDesc = filterProducts(sampleProducts, { query: 'عصرة', tab: 'all' });
  assert.equal(byDesc.length, 1);
  assert.equal(byDesc[0]._id, '4');

  const combined = filterProducts(sampleProducts, { query: 'كتان', tab: 'in_stock' });
  assert.equal(combined.length, 1);

  const combinedMiss = filterProducts(sampleProducts, { query: 'كتان', tab: 'out_of_stock' });
  assert.equal(combinedMiss.length, 0);
});

test('isValidFilterTab validates correctly', () => {
  assert.equal(isValidFilterTab('all'), true);
  assert.equal(isValidFilterTab('in_stock'), true);
  assert.equal(isValidFilterTab('out_of_stock'), true);
  assert.equal(isValidFilterTab('inactive'), true);
  assert.equal(isValidFilterTab('unknown'), false);
  assert.equal(isValidFilterTab(null), false);
});
