const test = require('node:test');
const assert = require('node:assert/strict');
const { mergeItems, applyOperation, consumeItems } = require('../services/cart.service');
const variantId = '111111111111111111111111';
test('guest import sums identical variants while preserving other choices', () => {
 assert.deepEqual(mergeItems([{ variantId, quantity: 2 }], [{ variantId, quantity: 3 }]), [{ variantId, quantity: 5 }]);
});
test('invalid and nonfinite quantities are rejected rather than converted to a free item', () => {
 for (const quantity of [0, -1, NaN, Infinity, 1.5, '2']) assert.throws(() => mergeItems([], [{ variantId, quantity }]));
});
test('checkout removes only purchased quantities', () => {
 assert.deepEqual(consumeItems([{variantId,quantity:5}], [{variantId,quantity:2}]), [{variantId,quantity:3}]);
});
test('cannot consume an absent item or more than the saved amount', () => {
 assert.throws(() => consumeItems([], [{variantId,quantity:1}]));
 assert.throws(() => consumeItems([{variantId,quantity:1}], [{variantId,quantity:2}]));
});
test('set replaces quantity and remove preserves unrelated lines', () => {
 const other = '222222222222222222222222';
 const items = [{variantId,quantity:2},{variantId:other,quantity:3}];
 assert.equal(applyOperation(items,{action:'set',variantId,quantity:4})[0].quantity,4);
 assert.deepEqual(applyOperation(items,{action:'remove',variantId}),[{variantId:other,quantity:3}]);
});
test('ObjectId letter casing cannot split a single choice into duplicate lines', () => {
 const lower='abcdefabcdefabcdefabcdef';
 const upper=lower.toUpperCase();
 const merged=mergeItems([{variantId:lower,quantity:2}],[{variantId:upper,quantity:3}]);
 assert.deepEqual(merged,[{variantId:lower,quantity:5}]);
 assert.deepEqual(applyOperation(merged,{action:'remove',variantId:upper}),[]);
 assert.equal(applyOperation(merged,{action:'set',variantId:upper,quantity:2})[0].quantity,2);
});
