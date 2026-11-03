import test from 'node:test';
import assert from 'node:assert/strict';
import { PAYMENT_RAILS, PAYMENT_RAILS_LIST } from './paymentRails.ts';

test('PAYMENT_RAILS contains all 4 authorized Palestinian payment rails', () => {
  const keys = Object.keys(PAYMENT_RAILS);
  assert.equal(keys.length, 4);
  assert.ok(keys.includes('JAWWAL_PAY'));
  assert.ok(keys.includes('PAL_PAY'));
  assert.ok(keys.includes('BANK_OF_PALESTINE'));
  assert.ok(keys.includes('PALESTINE_ISLAMIC_BANK'));
});

test('Each payment rail defines distinguished brand theme colors and monogram', () => {
  PAYMENT_RAILS_LIST.forEach((rail) => {
    assert.ok(rail.theme, `Missing theme for ${rail.id}`);
    assert.match(rail.theme.primary, /^#[0-9A-Fa-f]{6}$/, `Invalid primary hex color for ${rail.id}`);
    assert.match(rail.theme.bgSoft, /^#[0-9A-Fa-f]{6}$/, `Invalid bgSoft hex color for ${rail.id}`);
    assert.match(rail.theme.borderActive, /^#[0-9A-Fa-f]{6}$/, `Invalid borderActive for ${rail.id}`);
    assert.ok(rail.theme.monogram.length >= 2, `Monogram too short for ${rail.id}`);
    assert.ok(rail.theme.appHint.length > 0, `App hint missing for ${rail.id}`);
  });
});

test('Brand theme colors match official Palestinian banking identities', () => {
  // Jawwal Pay is vibrant lime green #58B947
  assert.equal(PAYMENT_RAILS.JAWWAL_PAY.theme.primary, '#58B947');
  assert.equal(PAYMENT_RAILS.JAWWAL_PAY.theme.monogram, 'JP');

  // Bank of Palestine is official berry magenta #A61955
  assert.equal(PAYMENT_RAILS.BANK_OF_PALESTINE.theme.primary, '#A61955');
  assert.equal(PAYMENT_RAILS.BANK_OF_PALESTINE.theme.monogram, 'BOP');

  // PalPay is electric purple/violet #702082 from its Mahfazati Visa card
  assert.equal(PAYMENT_RAILS.PAL_PAY.theme.primary, '#702082');
  assert.equal(PAYMENT_RAILS.PAL_PAY.theme.monogram, 'PP');

  // Palestine Islamic Bank is golden amber #F59E0B with navy #173059
  assert.equal(PAYMENT_RAILS.PALESTINE_ISLAMIC_BANK.theme.primary, '#F59E0B');
  assert.equal(PAYMENT_RAILS.PALESTINE_ISLAMIC_BANK.theme.monogram, 'PIB');
});

test('Banks have valid Palestinian IBAN starting with PS', () => {
  assert.match(PAYMENT_RAILS.BANK_OF_PALESTINE.depositIban || '', /^PS\d{2}PALS/);
  assert.match(PAYMENT_RAILS.PALESTINE_ISLAMIC_BANK.depositIban || '', /^PS\d{2}ISBK/);
});
