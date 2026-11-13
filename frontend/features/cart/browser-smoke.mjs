import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const executable = process.env.CART_CHROME_PATH;
if (!executable) throw new Error('Set CART_CHROME_PATH to a Chromium executable');
const base = process.env.CART_TEST_URL || 'http://127.0.0.1:3100';
const profile = await mkdtemp(path.join(tmpdir(), 'sadeem-cart-browser-'));
const port = 19322;
const timeoutMs = Number(process.env.CART_TEST_TIMEOUT_MS) || 60000;
const chrome = spawn(executable, ['--headless=new', '--no-sandbox', '--disable-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let socket;
let debugState = async () => ({});
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(check, message) {
  for (let i = 0; i < Math.ceil(timeoutMs / 500); i++) {
    try { const value = await check(); if (value) return value; } catch {}
    await sleep(500);
  }
  let state;
  try { state = await debugState(); } catch (error) { state = { diagnosticError: error.message }; }
  throw new Error(`${message}: ${JSON.stringify(state)}`);
}
try {
  const target = await until(async () => {
    const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    return targets.find(target => target.type === 'page');
  }, 'Chromium did not start');
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let serial = 0;
  const pending = new Map();
  const exceptions = [];
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') {
      const details = message.params.exceptionDetails;
      exceptions.push(details.exception?.description || details.text);
    }
    const callback = pending.get(message.id);
    if (callback) {
      pending.delete(message.id);
      if (message.error) callback.reject(message.error);
      else callback.resolve(message.result);
    }
  });
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++serial; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async function evaluate(expression) {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  }
  debugState = () => evaluate(`({ body: document.body.innerText.slice(0, 900), cart: localStorage.getItem('smoke-cart'), guest: localStorage.getItem('sadeem_cart_guest'), transfers: localStorage.getItem('sadeem_cart_transfers') })`);
  await send('Page.enable');
  await send('Runtime.enable');
  const initSource = `
    (() => {
      const owner = '111111111111111111111111';
      const variant = '222222222222222222222222';
      const product = { id: '333333333333333333333333', title: 'Cart browser fixture', price: 5, currency: '₪', image: '/placeholder_product.svg', category: '', inStock: true, variantId: variant, variantAttributes: { size: 'XL', color: 'Blue' }, vendor: { id: '444444444444444444444444', name: 'Test store', city: 'Test city', verified: true } };
      window.cartFixture = { product, quantity: 2, selectedVariantId: variant };
      if (!sessionStorage.getItem('smoke-seeded')) {
        localStorage.clear();
        localStorage.setItem('sadeem_cart_guest', JSON.stringify([window.cartFixture]));
        localStorage.setItem('sadeem_cart', JSON.stringify([{ ...window.cartFixture, quantity: 9 }]));
        sessionStorage.setItem('smoke-seeded', 'true');
      }
      const original = window.fetch.bind(window);
      window.fetch = async (input, options = {}) => {
        const url = String(input);
        const response = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
        const authenticated = sessionStorage.getItem('smoke-auth') === 'yes';
        if (url.includes('/api/auth/me')) return authenticated ? response({ success: true, data: { user: { id: owner, name: 'Browser fixture', phone: '0591234567', role: 'customer', status: 'active' } } }) : response({ message: 'Guest' }, 401);
        if (url.includes('/api/auth/refresh')) return response({ success: authenticated }, authenticated ? 200 : 401);
        if (url.startsWith('/api/cart')) {
          return navigator.locks.request('smoke-api-server', () => {
          const cart = JSON.parse(localStorage.getItem('smoke-cart') || JSON.stringify({ ownerId: owner, revision: 0, items: [] }));
          if (url.includes('/import')) {
            const body = JSON.parse(options.body);
            localStorage.setItem('smoke-import-count', String(Number(localStorage.getItem('smoke-import-count') || 0) + 1));
            localStorage.setItem('smoke-last-import', JSON.stringify(body));
            if (body.ownerId !== owner || body.revision !== cart.revision) return response({ message: 'Cart changed' }, 409);
            if (localStorage.getItem('sadeem_cart_guest') !== null) throw new Error('Guest source must be removed before dispatch');
            const mode = localStorage.getItem('smoke-import-mode');
            localStorage.removeItem('smoke-import-mode');
            if (mode === 'fail-before') return response({ message: 'Service unavailable' }, 503);
            for (const item of body.items) {
              const existing = cart.items.find(line => line.variantId === item.variantId);
              if (existing) existing.quantity += item.quantity;
              else cart.items.push({ variantId: item.variantId, quantity: item.quantity, product });
            }
            cart.revision++;
            localStorage.setItem('smoke-cart', JSON.stringify(cart));
            if (mode === 'commit-lost') throw new TypeError('Simulated lost response');
          }
          localStorage.setItem('smoke-cart', JSON.stringify(cart));
          return response({ success: true, data: { cart } });
          });
        }
        if (url.startsWith('/api/')) return response({ success: true, data: { categories: [], products: [] } });
        return original(input, options);
      };
    })();`;
  await send('Page.addScriptToEvaluateOnNewDocument', { source: initSource });
  await send('Page.navigate', { url: `${base}/cart` });
  await until(() => evaluate(`document.body.innerText.includes('Cart browser fixture')`), 'Guest cart did not survive hydration');
  assert.equal(await evaluate(`JSON.parse(localStorage.getItem('sadeem_cart_guest'))[0].quantity`), 2);
  await evaluate(`sessionStorage.setItem('smoke-auth', 'yes'); location.reload()`);
  await until(() => evaluate(`JSON.parse(localStorage.getItem('smoke-cart') || '{}').items?.[0]?.quantity === 2 && document.body.innerText.includes('Cart browser fixture')`), 'Guest cart was not imported');
  await send('Page.reload');
  await until(() => evaluate(`document.body.innerText.includes('Cart browser fixture')`), 'Account cart did not reload');
  assert.equal(await evaluate(`JSON.parse(localStorage.getItem('smoke-cart')).items[0].quantity`), 2);
  assert.equal(await evaluate(`document.body.innerText.includes('XL') && document.body.innerText.includes('Blue')`), true);
  assert.equal(await evaluate(`localStorage.getItem('sadeem_cart_guest')`), null);
  assert.equal(await evaluate(`JSON.parse(localStorage.getItem('sadeem_cart'))[0].quantity`), 9);
  assert.equal(await evaluate(`fetch('/api/cart/import', { method: 'POST', body: localStorage.getItem('smoke-last-import') }).then(response => response.status)`), 409);
  assert.equal(await evaluate(`JSON.parse(localStorage.getItem('smoke-cart')).items[0].quantity`), 2);
  await evaluate(`sessionStorage.removeItem('smoke-auth'); window.dispatchEvent(new Event('auth:session_expired'))`);
  await until(() => evaluate(`!document.body.innerText.includes('Cart browser fixture')`), 'Logout exposed account cart');
  await evaluate(`localStorage.setItem('sadeem_cart_guest', JSON.stringify([window.cartFixture])); location.reload()`);
  await until(() => evaluate(`document.body.innerText.includes('Cart browser fixture')`), 'Identical new guest selection was hidden');
  await evaluate(`sessionStorage.setItem('smoke-auth', 'yes'); location.reload()`);
  await until(() => evaluate(`JSON.parse(localStorage.getItem('smoke-cart') || '{}').items?.[0]?.quantity === 4`), 'New guest selection was not imported exactly once');
  assert.equal(await evaluate(`localStorage.getItem('sadeem_cart_111111111111111111111111')`), null);
  async function companion(authenticated) {
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(target => target.id === targetId);
    const tabSocket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(resolve => tabSocket.addEventListener('open', resolve, { once: true }));
    let serial = 0;
    const requests = new Map();
    tabSocket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      const callback = requests.get(message.id);
      if (callback) {
        requests.delete(message.id);
        if (message.error) callback.reject(message.error);
        else callback.resolve(message.result);
      }
    });
    const tabSend = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++serial; requests.set(id, { resolve, reject }); tabSocket.send(JSON.stringify({ id, method, params }));
    });
    await tabSend('Page.enable');
    await tabSend('Runtime.enable');
    await tabSend('Page.addScriptToEvaluateOnNewDocument', { source: `if (!sessionStorage.getItem('smoke-seeded')) { sessionStorage.setItem('smoke-seeded','true'); sessionStorage.setItem('smoke-auth','${authenticated ? 'yes' : 'no'}'); } ${initSource}` });
    return {
      send: tabSend,
      evaluate: async expression => {
        const result = await tabSend('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
        if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
        return result.result.value;
      },
      close: async () => { tabSocket.close(); await send('Target.closeTarget', { targetId }); },
    };
  }
  const second = await companion(true);
  await evaluate(`localStorage.setItem('sadeem_cart_guest', JSON.stringify([window.cartFixture]))`);
  await Promise.all([send('Page.reload'), second.send('Page.navigate', { url: `${base}/cart` })]);
  await until(() => evaluate(`JSON.parse(localStorage.getItem('smoke-cart') || '{}').items?.[0]?.quantity === 6`), 'Two tabs did not import shared guest cart');
  await sleep(1500);
  assert.equal(await evaluate(`JSON.parse(localStorage.getItem('smoke-cart')).items[0].quantity`), 6);
  await second.close();
  await evaluate(`localStorage.setItem('sadeem_cart_guest', JSON.stringify([window.cartFixture])); localStorage.setItem('smoke-import-mode', 'fail-before')`);
  await send('Page.reload');
  await until(() => evaluate(`localStorage.getItem('sadeem_cart_guest') === null && !localStorage.getItem('smoke-import-mode') && document.body.innerText.includes('Cart browser fixture')`), 'Failed transfer did not consume guest source');
  assert.equal(await evaluate(`JSON.parse(localStorage.getItem('smoke-cart')).items[0].quantity`), 6);
  const failedCount = await evaluate(`Number(localStorage.getItem('smoke-import-count'))`);
  await send('Page.reload');
  await until(() => evaluate(`document.body.innerText.includes('Cart browser fixture')`), 'Cart did not recover after failed transfer');
  assert.equal(await evaluate(`Number(localStorage.getItem('smoke-import-count'))`), failedCount);
  await evaluate(`localStorage.setItem('sadeem_cart_guest', JSON.stringify([window.cartFixture])); localStorage.setItem('smoke-import-mode', 'commit-lost')`);
  await send('Page.reload');
  await until(() => evaluate(`JSON.parse(localStorage.getItem('smoke-cart')).items[0].quantity === 8 && document.body.innerText.includes('Cart browser fixture')`), 'Committed transfer with lost response did not refresh');
  const lostCount = await evaluate(`Number(localStorage.getItem('smoke-import-count'))`);
  await send('Page.reload');
  await until(() => evaluate(`document.body.innerText.includes('Cart browser fixture')`), 'Cart did not reload after lost response');
  assert.equal(await evaluate(`Number(localStorage.getItem('smoke-import-count'))`), lostCount);
  assert.equal(await evaluate(`JSON.parse(localStorage.getItem('smoke-cart')).items[0].quantity`), 8);
  assert.equal(await evaluate(`localStorage.getItem('sadeem_cart_transfers')`), null);
  assert.equal(await evaluate(`JSON.parse(localStorage.getItem('sadeem_cart'))[0].quantity`), 9);
  await evaluate(`localStorage.setItem('sadeem_cart_guest', JSON.stringify([window.cartFixture]))`);
  const staleGuest = await companion(false);
  await staleGuest.send('Page.navigate', { url: `${base}/cart` });
  await until(() => staleGuest.evaluate(`document.body.innerText.includes('Cart browser fixture')`), 'Second guest tab did not load its initial selection');
  await send('Page.reload');
  await until(() => evaluate(`JSON.parse(localStorage.getItem('smoke-cart')).items[0].quantity === 10 && localStorage.getItem('sadeem_cart_guest') === null`), 'Account tab did not consume shared guest selection');
  await staleGuest.evaluate(`document.querySelector('button[title="زيادة الكمية"]').click()`);
  await sleep(750);
  const recreated = await evaluate(`JSON.parse(localStorage.getItem('sadeem_cart_guest') || '[]').reduce((sum, item) => sum + item.quantity, 0)`);
  assert.ok(recreated <= 1, `Stale tab resurrected ${recreated} old units`);
  await staleGuest.evaluate(`sessionStorage.setItem('smoke-auth','yes')`);
  await staleGuest.send('Page.reload');
  debugState = () => staleGuest.evaluate(`({ url: location.href, auth: sessionStorage.getItem('smoke-auth'), body: document.body.innerText.slice(0, 900) })`);
  await until(() => staleGuest.evaluate(`document.body.innerText.includes('Cart browser fixture')`), 'Stale guest could not load its account');
  const finalQuantity = await evaluate(`JSON.parse(localStorage.getItem('smoke-cart')).items[0].quantity`);
  assert.equal(finalQuantity, 10 + recreated);
  await staleGuest.close();
  assert.deepEqual(exceptions, []);
  console.log('PASS browser guest deletion before dispatch, revision conflicts, two-tab claim, stale-guest edits, loss without retry, lost-response refresh, option labels, legacy preservation, logout isolation');
} finally {
  socket?.close(); chrome.kill();
  await new Promise(resolve => chrome.exitCode !== null ? resolve() : chrome.once('exit', resolve));
  assert.equal(path.dirname(path.resolve(profile)), path.resolve(tmpdir()));
  assert.ok(path.basename(profile).startsWith('sadeem-cart-browser-'));
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
