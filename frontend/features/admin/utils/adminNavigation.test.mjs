import test from 'node:test';
import assert from 'node:assert/strict';
import { ADMIN_NAV_ITEMS } from './adminNavigation.ts';

test('ADMIN_NAV_ITEMS includes active wallet financial governance section', () => {
  const walletItem = ADMIN_NAV_ITEMS.find((item) => item.id === 'wallet');
  assert.ok(walletItem, 'Wallet item must be defined');
  assert.equal(walletItem.label, 'المحفظة والمالية');
  assert.equal(walletItem.href, '/admin/wallet');
  assert.equal(walletItem.status, 'active');
});

test('ADMIN_NAV_ITEMS has valid hrefs and unique IDs', () => {
  const ids = ADMIN_NAV_ITEMS.map((item) => item.id);
  const uniqueIds = new Set(ids);
  assert.equal(ids.length, uniqueIds.size, 'Nav item IDs must be unique');

  for (const item of ADMIN_NAV_ITEMS) {
    assert.ok(item.href.startsWith('/admin'), `Href ${item.href} must start with /admin`);
    assert.ok(item.label.length > 0, `Nav label must not be empty`);
  }
});
