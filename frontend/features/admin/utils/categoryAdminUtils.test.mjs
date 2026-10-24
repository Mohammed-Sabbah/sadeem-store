import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanAttributeKey, validateCategoryDraft } from './categoryAdminUtils.ts';

test('cleanAttributeKey cleans raw strings into valid keys', () => {
  assert.equal(cleanAttributeKey('Color Size'), 'color_size');
  assert.equal(cleanAttributeKey('Weight-kg'), 'weight_kg');
  assert.equal(cleanAttributeKey('  volume__ml  '), 'volume_ml');
});

test('validateCategoryDraft validates title length', () => {
  assert.equal(validateCategoryDraft('', []).isValid, false);
  assert.equal(validateCategoryDraft('a', []).isValid, false);
  assert.equal(validateCategoryDraft('تمور ومؤونة', []).isValid, true);
});

test('validateCategoryDraft prevents duplicate or invalid attribute keys', () => {
  const invalidDuplicate = [
    { name: 'حجم العبوة', key: 'size', type: 'String' },
    { name: 'المقاس', key: 'size', type: 'String' },
  ];
  const result = validateCategoryDraft('ألبان وأجبان', invalidDuplicate);
  assert.equal(result.isValid, false);
  assert.match(result.error, /مكرر/);

  const validAttributes = [
    { name: 'حجم العبوة', key: 'volume', type: 'String' },
    { name: 'الوزن', key: 'weight', type: 'Number' },
  ];
  assert.equal(validateCategoryDraft('ألبان وأجبان', validAttributes).isValid, true);
});
