import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const transpile = (url) => ts.transpileModule(readFileSync(url, 'utf8'), { compilerOptions: { module: 1, jsx: 2 } }).outputText;
const storageCode = transpile(new URL('./cart.storage.ts', import.meta.url));
const providerCode = transpile(new URL('../../context/CartContext.tsx', import.meta.url));
const cartTypes = {};
vm.runInNewContext(transpile(new URL('./cart.types.ts', import.meta.url)), { exports: cartTypes });
const product = { id: 'p', title: 'Honey', price: 5, inStock: true, variantId: '222222222222222222222222', vendor: {} };

function harness(options = {}) {
  const state = [], refs = [], previous = [], cleanups = [];
  let cursor = 0, changed = false, value, effects = [], auth = { user: null, isLoading: false };
  const data = new Map();
  const storage = options.storage || { getItem: key => data.get(key) ?? null, setItem: (key, raw) => data.set(key, raw), removeItem: key => data.delete(key) };
  const storageExports = {};
  vm.runInNewContext(storageCode, { exports: storageExports });
  let lockTail = Promise.resolve();
  const locks = options.locks || { request: (_name, run) => { const result = lockTail.then(run); lockTail = result.catch(() => {}); return result; } };
  const cart = { ownerId: 'A', revision: 0, items: [] };
  const service = {
    get: async () => ({ success: true, data: { cart: structuredClone(cart) } }),
    import: async () => ({ success: true, data: { cart } }),
    mutate: async () => ({ success: true, data: { cart } }),
  };
  const hooks = {
    createContext: () => ({ Provider: 'provider' }),
    useState: initial => { const i = cursor++; if (!(i in state)) state[i] = typeof initial === 'function' ? initial() : initial; return [state[i], next => { state[i] = typeof next === 'function' ? next(state[i]) : next; changed = true; }]; },
    useRef: initial => { const i = cursor++; return refs[i] ||= { current: initial }; },
    useCallback: callback => { cursor++; return callback; },
    useEffect: (effect, deps) => { const i = cursor++; if (!previous[i] || deps.some((dep, index) => dep !== previous[i][index])) { effects.push(() => { cleanups[i]?.(); cleanups[i] = effect(); }); previous[i] = deps; } },
    createElement: (_type, props) => { value = props.value; return null; },
  };
  // React preserves useCallback identity when its dependencies do not change.
  hooks.useCallback = (callback, deps) => { const i = cursor++; if (!refs[i]) refs[i] = { deps, callback }; return refs[i].callback; };
  hooks.default = hooks;
  const exports = {};
  vm.runInNewContext(providerCode, { exports, crypto: webcrypto, navigator: { locks: options.noLocks ? undefined : locks }, localStorage: storage, window: { addEventListener() {}, removeEventListener() {} }, document: { addEventListener() {}, removeEventListener() {}, hidden: false }, require: path => {
    if (path === 'react') return hooks;
    if (path.includes('AuthContext')) return { useAuth: () => auth };
    if (path.endsWith('cart.service')) return { cartService: service };
    if (path.endsWith('cart.storage')) return storageExports;
    if (path.endsWith('cart.types')) return cartTypes;
    throw new Error(path);
  } });
  const render = () => { cursor = 0; changed = false; exports.CartProvider({ children: null }); const queue = effects; effects = []; queue.forEach(effect => effect()); };
  return { storage, locks, cart, service, setAuth: next => { auth = next; }, render, value: () => value, async flush() { for (let i = 0; i < 30; i++) { if (changed || i === 0) render(); await new Promise(resolve => setImmediate(resolve)); } } };
}

test('account loading must succeed before guest selections can be removed', async () => {
 const h=harness();const raw=JSON.stringify([{product,quantity:2}]);h.storage.setItem('sadeem_cart_guest',raw);
 h.service.get=async()=>({success:false,message:'offline'});let imports=0;h.service.import=async()=>{imports++;return {success:true};};
 h.setAuth({user:{id:'A'},isLoading:false});await h.flush();
 assert.equal(h.storage.getItem('sadeem_cart_guest'),raw);assert.equal(imports,0);assert.equal(h.value().status,'error');
});
test('guest source is removed before dispatch and the original account revision is submitted', async () => {
 const h=harness();h.cart.revision=7;h.storage.setItem('sadeem_cart_guest',JSON.stringify([{product,quantity:2}]));let imports=0;
 h.service.import=async(owner,revision,items)=>{imports++;assert.equal(owner,'A');assert.equal(revision,7);assert.equal(h.storage.getItem('sadeem_cart_guest'),null);h.cart.revision=8;h.cart.items=[{variantId:product.variantId,product,quantity:items[0].quantity}];return {success:true,data:{cart:structuredClone(h.cart)}};};
 h.setAuth({user:{id:'A'},isLoading:false});await h.flush();assert.equal(imports,1);assert.equal(h.value().items[0].quantity,2);
 assert.equal(h.storage.getItem('sadeem_cart_transfers'),null);
});
test('local removal failure sends nothing and leaves account cart usable', async () => {
 const h=harness();const raw=JSON.stringify([{product,quantity:2}]);h.storage.setItem('sadeem_cart_guest',raw);h.storage.removeItem=()=>{throw Error('blocked');};let imports=0;
 h.service.import=async()=>{imports++;return {success:true};};h.setAuth({user:{id:'A'},isLoading:false});await h.flush();
 assert.equal(imports,0);assert.equal(h.storage.getItem('sadeem_cart_guest'),raw);assert.equal(h.value().status,'ready');assert.ok(h.value().error);
});
test('lost response after committed import refreshes account without resubmitting', async () => {
 const h=harness();h.storage.setItem('sadeem_cart_guest',JSON.stringify([{product,quantity:2}]));let imports=0;
 h.service.import=async()=>{imports++;h.cart.revision++;h.cart.items=[{variantId:product.variantId,product,quantity:2}];return {success:false,statusCode:408};};
 h.setAuth({user:{id:'A'},isLoading:false});await h.flush();assert.equal(h.value().items[0].quantity,2);assert.ok(h.value().error);
 await h.value().refreshCart();await h.flush();assert.equal(imports,1);assert.equal(h.storage.getItem('sadeem_cart_guest'),null);
});
test('failed guest import may lose guest selections but cannot mutate the account or replay', async () => {
 const h=harness();h.cart.items=[{variantId:product.variantId,product,quantity:4}];h.storage.setItem('sadeem_cart_guest',JSON.stringify([{product,quantity:2}]));let imports=0;
 h.service.import=async()=>{imports++;return {success:false,statusCode:503};};h.setAuth({user:{id:'A'},isLoading:false});await h.flush();
 assert.equal(h.storage.getItem('sadeem_cart_guest'),null);assert.equal(h.value().items[0].quantity,4);assert.ok(h.value().error);
 await h.value().refreshCart();await h.flush();assert.equal(imports,1);
});
test('two tabs can claim the same guest source only once', async () => {
 const first=harness(),second=harness({storage:first.storage,locks:first.locks});first.storage.setItem('sadeem_cart_guest',JSON.stringify([{product,quantity:2}]));let imports=0;
 const receive=async(_owner,revision)=>{imports++;assert.equal(revision,0);await new Promise(resolve=>setImmediate(resolve));return {success:true,data:{cart:{ownerId:'A',revision:1,items:[]}}};};
 first.service.import=receive;second.service.import=receive;first.setAuth({user:{id:'A'},isLoading:false});second.setAuth({user:{id:'A'},isLoading:false});
 await Promise.all([first.flush(),second.flush()]);assert.equal(imports,1);
});
test('old pending sources stay dormant even when they reference the current guest key', async () => {
 const h=harness(),raw=JSON.stringify([{product,quantity:2}]);h.storage.setItem('sadeem_cart_guest',raw);
 const metadata=JSON.stringify([{owner:'A',sources:[{key:'sadeem_cart_guest',raw}]}]);h.storage.setItem('sadeem_cart_transfers',metadata);let imports=0;
 h.service.import=async()=>{imports++;return {success:true};};h.setAuth({user:{id:'A'},isLoading:false});await h.flush();
 assert.equal(imports,0);assert.equal(h.storage.getItem('sadeem_cart_guest'),raw);assert.equal(h.storage.getItem('sadeem_cart_transfers'),metadata);assert.equal(h.value().status,'ready');
});
test('missing Web Locks preserves source and does not block account cart', async () => {
 const h=harness({noLocks:true}),raw=JSON.stringify([{product,quantity:2}]);h.storage.setItem('sadeem_cart_guest',raw);
 h.setAuth({user:{id:'A'},isLoading:false});await h.flush();assert.equal(h.value().status,'ready');assert.ok(h.value().error);assert.equal(h.storage.getItem('sadeem_cart_guest'),raw);
});
test('corrupt local metadata preserves every source and leaves server cart usable', async () => {
 const h=harness(),raw=JSON.stringify([{product,quantity:2}]);h.storage.setItem('sadeem_cart_guest',raw);h.storage.setItem('sadeem_cart_transfers','{broken');
 h.setAuth({user:{id:'A'},isLoading:false});await h.flush();assert.equal(h.value().status,'ready');assert.ok(h.value().error);assert.equal(h.storage.getItem('sadeem_cart_guest'),raw);
});
test('queued claim cannot consume a source after the intended account changes', async () => {
 const h=harness();const raw=JSON.stringify([{product,quantity:2}]);h.storage.setItem('sadeem_cart_guest',raw);let release;
 const normal=h.locks.request;h.locks.request=(_name,run)=>new Promise(resolve=>{release=()=>resolve(run());});
 h.setAuth({user:{id:'A'},isLoading:false});await h.flush();h.locks.request=normal;h.setAuth({user:null,isLoading:false});await h.flush();release();await h.flush();
 assert.equal(h.storage.getItem('sadeem_cart_guest'),raw);assert.equal(h.value().items[0].quantity,2);
});
test('late old-account read does not expose cart after logout', async () => {
 const h=harness();let resolve;h.service.get=()=>new Promise(done=>{resolve=done;});h.setAuth({user:{id:'A'},isLoading:false});await h.flush();
 h.setAuth({user:null,isLoading:false});await h.flush();resolve({success:true,data:{cart:{ownerId:'A',revision:1,items:[{product,quantity:2,variantId:product.variantId}]}}});await h.flush();assert.equal(h.value().items.length,0);
});
test('lost ordinary mutation blocks further writes until authoritative refresh', async () => {
 const h=harness();h.setAuth({user:{id:'A'},isLoading:false});await h.flush();let writes=0;
 h.service.mutate=async()=>{writes++;h.cart.items=[{variantId:product.variantId,product,quantity:1}];h.cart.revision++;return {success:false,statusCode:408};};
 assert.equal((await h.value().addToCart(product)).success,false);assert.equal((await h.value().addToCart(product)).success,false);assert.equal(writes,1);
 await h.value().refreshCart();await h.flush();assert.equal(h.value().items[0].quantity,1);
});
test('sequential awaited account edits use confirmed revision without receipt identifiers', async () => {
 const h=harness();h.setAuth({user:{id:'A'},isLoading:false});await h.flush();h.service.mutate=async mutation=>{assert.equal(mutation.revision,h.cart.revision);assert.equal(mutation.operationId,undefined);h.cart.revision++;h.cart.items=[{variantId:product.variantId,product,quantity:h.cart.revision}];return {success:true,data:{cart:structuredClone(h.cart)}};};
 assert.equal((await h.value().addToCart(product)).success,true);assert.equal((await h.value().addToCart(product)).success,true);await h.flush();assert.equal(h.value().items[0].quantity,2);
});
test('sequential guest additions retain selections and persist no account cart', async () => {
 const h=harness();await h.flush();await h.value().addToCart(product);await h.value().addToCart({...product,id:'other',variantId:'333333333333333333333333'});await h.flush();assert.equal(h.value().items.length,2);assert.equal(h.storage.getItem('sadeem_cart_A'),null);
});

test('a stale guest tab adds only new intent after another tab consumes its source', async () => {
  const first = harness();
  const second = harness({ storage: first.storage, locks: first.locks });
  first.storage.setItem('sadeem_cart_guest', JSON.stringify([{ product, quantity: 2 }]));
  const server = { ownerId: 'A', revision: 0, items: [] };
  for (const tab of [first, second]) {
    tab.service.get = async () => ({ success: true, data: { cart: structuredClone(server) } });
    tab.service.import = async (_owner, revision, items) => {
      assert.equal(revision, server.revision);
      const quantity = (server.items[0]?.quantity || 0) + items[0].quantity;
      server.items = [{ product, variantId: product.variantId, quantity }];
      server.revision++;
      return { success: true, data: { cart: structuredClone(server) } };
    };
  }
  await Promise.all([first.flush(), second.flush()]);
  assert.equal(second.value().items[0].quantity, 2);
  first.setAuth({ user: { id: 'A' }, isLoading: false });
  await first.flush();
  assert.equal(server.items[0].quantity, 2);
  assert.equal((await second.value().addToCart(product)).success, true);
  assert.equal(JSON.parse(first.storage.getItem('sadeem_cart_guest'))[0].quantity, 1);
  second.setAuth({ user: { id: 'A' }, isLoading: false });
  await second.flush();
  assert.equal(server.items[0].quantity, 3);
});

test('guest edits remain persistent when Web Locks are unavailable', async () => {
  const h = harness({ noLocks: true });
  await h.flush();
  assert.equal((await h.value().addToCart(product)).success, true);
  assert.equal(JSON.parse(h.storage.getItem('sadeem_cart_guest'))[0].quantity, 1);
});

test('a stale absolute quantity change refreshes rather than recreating consumed units', async () => {
  const h = harness();
  h.storage.setItem('sadeem_cart_guest', JSON.stringify([{ product, quantity: 2 }]));
  await h.flush();
  h.storage.removeItem('sadeem_cart_guest');
  const result = await h.value().updateQuantity(product.id, 3, product.variantId);
  assert.equal(result.success, false);
  await h.flush();
  assert.equal(h.value().items.length, 0);
  assert.ok(h.value().error);
  assert.equal(h.storage.getItem('sadeem_cart_guest'), null);
});

test('guest additions in two tabs share the claim lock and retain both new selections', async () => {
  const first = harness();
  const second = harness({ storage: first.storage, locks: first.locks });
  await Promise.all([first.flush(), second.flush()]);
  const results = await Promise.all([first.value().addToCart(product), second.value().addToCart(product)]);
  assert.ok(results.every(result => result.success));
  assert.equal(JSON.parse(first.storage.getItem('sadeem_cart_guest'))[0].quantity, 2);
});

test('failed guest writes report memory-only selections without persisting a stale source', async () => {
  const h = harness();
  await h.flush();
  h.storage.setItem = () => { throw new Error('quota'); };
  assert.equal((await h.value().addToCart(product)).success, false);
  await h.flush();
  assert.equal(h.value().items[0].quantity, 1);
  assert.ok(h.value().error);
  assert.equal(h.storage.getItem('sadeem_cart_guest'), null);
});
