import test from 'node:test';
import assert from 'node:assert/strict';
import { computeAdminProductMetrics, filterAdminProducts } from './productAdminFilters.ts';

const mockProducts = [
  {
    _id: 'p1',
    title: 'عسل سدر جبلي فاخر',
    approveStatus: 'approved',
    variants: [{ stock: 10 }, { stock: 5 }],
    inStock: true,
    storeId: { _id: 'store1', name: 'مناحل العسل' },
    categoryId: { _id: 'cat1', title: 'عسل وزيوت' },
  },
  {
    _id: 'p2',
    title: 'تمر برحي طازج',
    approveStatus: 'rejected',
    rejectReason: 'مخالف لمعايير التغليف',
    totalStock: 0,
    inStock: false,
    storeId: { _id: 'store2', name: 'مزارع النخيل' },
    categoryId: { _id: 'cat2', title: 'تمور ومؤونة' },
  },
  {
    _id: 'p3',
    title: 'زيت زيتون بكر ممتاز',
    approveStatus: 'approved',
    totalStock: 0,
    inStock: false,
    storeId: { _id: 'store1', name: 'مناحل العسل' },
    categoryId: { _id: 'cat1', title: 'عسل وزيوت' },
  },
];

test('computeAdminProductMetrics counts approved, rejected, and out-of-stock products', () => {
  const metrics = computeAdminProductMetrics(mockProducts);
  assert.equal(metrics.total, 3);
  assert.equal(metrics.approved, 2);
  assert.equal(metrics.rejected, 1);
  assert.equal(metrics.outOfStock, 2);
});

test('filterAdminProducts filters by tab correctly', () => {
  const approved = filterAdminProducts(mockProducts, { query: '', tab: 'approved' });
  assert.equal(approved.length, 2);

  const rejected = filterAdminProducts(mockProducts, { query: '', tab: 'rejected' });
  assert.equal(rejected.length, 1);
  assert.equal(rejected[0]._id, 'p2');

  const outOfStock = filterAdminProducts(mockProducts, { query: '', tab: 'out_of_stock' });
  assert.equal(outOfStock.length, 2);
});

test('filterAdminProducts filters by storeId and categoryId', () => {
  const store1 = filterAdminProducts(mockProducts, { query: '', tab: 'all', storeId: 'store1' });
  assert.equal(store1.length, 2);

  const cat2 = filterAdminProducts(mockProducts, { query: '', tab: 'all', categoryId: 'cat2' });
  assert.equal(cat2.length, 1);
  assert.equal(cat2[0]._id, 'p2');
});

test('filterAdminProducts filters by search query on title, store name, and category title', () => {
  const byTitle = filterAdminProducts(mockProducts, { query: 'برحي', tab: 'all' });
  assert.equal(byTitle.length, 1);
  assert.equal(byTitle[0]._id, 'p2');

  const byStore = filterAdminProducts(mockProducts, { query: 'مناحل', tab: 'all' });
  assert.equal(byStore.length, 2);
});
