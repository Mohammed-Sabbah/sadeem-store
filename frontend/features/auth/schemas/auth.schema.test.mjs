import test from 'node:test';
import assert from 'node:assert/strict';

const palestinianPhoneRegex = /^(\+?970|0)?5[96]\d{7}$/;

test('palestinianPhoneRegex accepts Jawwal numbers starting with 059', () => {
  assert.equal(palestinianPhoneRegex.test('0599123456'), true);
  assert.equal(palestinianPhoneRegex.test('0591234567'), true);
  assert.equal(palestinianPhoneRegex.test('0598765432'), true);
});

test('palestinianPhoneRegex accepts Ooredoo numbers starting with 056', () => {
  assert.equal(palestinianPhoneRegex.test('0569123456'), true);
  assert.equal(palestinianPhoneRegex.test('0568765432'), true);
});

test('palestinianPhoneRegex accepts numbers with +970 or 970 country code', () => {
  assert.equal(palestinianPhoneRegex.test('+970599123456'), true);
  assert.equal(palestinianPhoneRegex.test('970568765432'), true);
});

test('palestinianPhoneRegex rejects invalid numbers and non-Palestinian formats', () => {
  assert.equal(palestinianPhoneRegex.test(''), false);
  assert.equal(palestinianPhoneRegex.test('12345678'), false);
  assert.equal(palestinianPhoneRegex.test('0541234567'), false); // Israeli prefix
  assert.equal(palestinianPhoneRegex.test('059912345'), false); // Too short
  assert.equal(palestinianPhoneRegex.test('05991234567'), false); // Too long
});
