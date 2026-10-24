import test from 'node:test';
import assert from 'node:assert/strict';
import { computeAdminStoreMetrics, filterAdminStores } from './storeFilters.ts';

const mockStores = [
  {
    _id: 's1',
    name: 'متجر العسل الملكي',
    status: 'active',
    approveStatus: 'approved',
    address: { city: 'دير البلح' },
    ownerId: { name: 'أحمد محمود', phoneNumber: '0599111222' },
  },
  {
    _id: 's2',
    name: 'مخبز البركة',
    status: 'inActive',
    approveStatus: 'approved',
    address: { city: 'مخيم النصيرات' },
    ownerId: { name: 'خالد إبراهيم', phoneNumber: '0599333444' },
  },
  {
    _id: 's3',
    name: 'ألبان الزوايدة',
    status: 'inActive',
    approveStatus: 'pending',
    address: { city: 'الزوايدة' },
    ownerId: { name: 'عمر ياسين', phoneNumber: '0599555666' },
  },
  {
    _id: 's4',
    name: 'محل التمور',
    status: 'inActive',
    approveStatus: 'rejected',
    address: { city: 'مخيم المغازي' },
    ownerId: { name: 'سامي كمال', phoneNumber: '0599777888' },
  },
];

test('computeAdminStoreMetrics calculates exact counts for each status', () => {
  const metrics = computeAdminStoreMetrics(mockStores);
  assert.equal(metrics.total, 4);
  assert.equal(metrics.approved, 2);
  assert.equal(metrics.active, 1);
  assert.equal(metrics.frozen, 1);
  assert.equal(metrics.pending, 1);
  assert.equal(metrics.rejected, 1);
});

test('filterAdminStores filters by tab correctly', () => {
  const approved = filterAdminStores(mockStores, { query: '', tab: 'approved' });
  assert.equal(approved.length, 2);

  const pending = filterAdminStores(mockStores, { query: '', tab: 'pending' });
  assert.equal(pending.length, 1);
  assert.equal(pending[0]._id, 's3');

  const all = filterAdminStores(mockStores, { query: '', tab: 'all' });
  assert.equal(all.length, 4);
});

test('filterAdminStores filters by search query on store name, owner, and phone', () => {
  const byName = filterAdminStores(mockStores, { query: 'العسل', tab: 'all' });
  assert.equal(byName.length, 1);
  assert.equal(byName[0]._id, 's1');

  const byOwner = filterAdminStores(mockStores, { query: 'خالد', tab: 'all' });
  assert.equal(byOwner.length, 1);
  assert.equal(byOwner[0]._id, 's2');

  const byPhone = filterAdminStores(mockStores, { query: '0599555666', tab: 'all' });
  assert.equal(byPhone.length, 1);
  assert.equal(byPhone[0]._id, 's3');
});

test('filterAdminStores filters by city in Middle Governorate', () => {
  const deir = filterAdminStores(mockStores, { query: '', tab: 'all', city: 'دير البلح' });
  assert.equal(deir.length, 1);
  assert.equal(deir[0]._id, 's1');

  const nuseirat = filterAdminStores(mockStores, { query: '', tab: 'all', city: 'مخيم النصيرات' });
  assert.equal(nuseirat.length, 1);
  assert.equal(nuseirat[0]._id, 's2');
});
