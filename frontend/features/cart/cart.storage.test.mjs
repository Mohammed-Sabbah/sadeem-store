import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('./cart.storage.ts', import.meta.url), 'utf8'), { compilerOptions: { module: 1 } }).outputText, { exports });
const { GUEST_KEY, readGuest, claimGuest, sanitizeItems, saveGuest, sameItem } = exports;
const fixture = () => ({ product: { id: 'p', title: 'Honey', price: 5, inStock: true, variantAttributes: { weight: '500g' }, vendor: { verified: false } }, quantity: 2, selectedVariantId: '222222222222222222222222' });
function storage() {
 const values = new Map();
 return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}
test('claim removes the guest source before returning selections without recovery metadata', () => {
 const store=storage();store.setItem(GUEST_KEY,JSON.stringify([fixture()]));
 assert.equal(claimGuest(store)[0].quantity,2);
 assert.equal(store.getItem(GUEST_KEY),null);
 assert.equal(store.getItem('sadeem_cart_transfers'),null);
 assert.equal(claimGuest(store).length,0);
});
test('failed local removal preserves source and aborts claiming', () => {
 const store=storage();store.setItem(GUEST_KEY,JSON.stringify([fixture()]));
 store.removeItem=()=>{throw new Error('blocked');};
 assert.throws(()=>claimGuest(store),/blocked/);
 assert.equal(JSON.parse(store.getItem(GUEST_KEY)).length,1);
});
test('legacy generic account and pending sources are neither replayed nor deleted', () => {
 const store=storage(),raw=JSON.stringify([fixture()]);
 store.setItem('sadeem_cart',raw);store.setItem('sadeem_cart_A',raw);
 const transfers=JSON.stringify([{owner:'A',sources:[{key:GUEST_KEY,raw}]}]);
 store.setItem('sadeem_cart_transfers',transfers);store.setItem(GUEST_KEY,raw);
 assert.equal(readGuest(store).length,0);assert.equal(claimGuest(store).length,0);
 assert.equal(store.getItem(GUEST_KEY),raw);assert.equal(store.getItem('sadeem_cart_transfers'),transfers);
 assert.equal(store.getItem('sadeem_cart_A'),raw);assert.equal(store.getItem('sadeem_cart'),raw);
});
test('guest reload preserves actual option attributes', () => {
 const store=storage();saveGuest(store,[fixture()]);
 assert.equal(readGuest(store)[0].product.variantAttributes.weight,'500g');
});
test('new choices cannot silently overwrite an unresolved historical guest source', () => {
 const store=storage(),raw=JSON.stringify([fixture()]);
 store.setItem(GUEST_KEY,raw);
 const metadata=JSON.stringify([{owner:'A',sources:[{key:GUEST_KEY,raw}]}]);
 store.setItem('sadeem_cart_transfers',metadata);
 assert.throws(()=>saveGuest(store,[fixture()]));
 assert.equal(store.getItem(GUEST_KEY),raw);
 assert.equal(store.getItem('sadeem_cart_transfers'),metadata);
});
test('incomplete source cannot silently lose a row during reading saving or claiming', () => {
 const store=storage(),raw=JSON.stringify([fixture(),{...fixture(),product:{...fixture().product,price:null}}]);
 store.setItem(GUEST_KEY,raw);
 assert.throws(()=>readGuest(store));assert.throws(()=>claimGuest(store));assert.throws(()=>saveGuest(store,[fixture()]));
 assert.equal(store.getItem(GUEST_KEY),raw);
});
test('missing variant and corrupt historical metadata preserve source', () => {
 const store=storage(),raw=JSON.stringify([{...fixture(),selectedVariantId:undefined}]);store.setItem(GUEST_KEY,raw);
 assert.throws(()=>claimGuest(store));store.setItem('sadeem_cart_transfers','{broken');assert.throws(()=>claimGuest(store));
 assert.equal(store.getItem(GUEST_KEY),raw);
});
test('invalid numbers cannot acquire a free price or valid quantity', () => {
 for(const price of [null,'',' ',false,true,0,Infinity])assert.equal(sanitizeItems([{...fixture(),product:{...fixture().product,price}}]).length,0);
 for(const quantity of [null,'',' ',false,true,Infinity,1.5,0])assert.equal(sanitizeItems([{...fixture(),quantity}]).length,0);
 assert.equal(sameItem({...fixture(),selectedVariantId:'ABCDEFABCDEFABCDEFABCDEF'},'p','abcdefabcdefabcdefabcdef'),true);
});
