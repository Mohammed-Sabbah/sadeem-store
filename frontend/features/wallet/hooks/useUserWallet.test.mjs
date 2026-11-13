import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const { QueryClient } = require('@tanstack/react-query');
const source = ts.transpileModule(readFileSync(new URL('./useUserWallet.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;

async function fetchWallet(result) {
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    require: name => {
      if (name === '@tanstack/react-query') return { useQuery: options => options };
      if (name.includes('/toast')) return {};
      if (name.endsWith('/wallet.service')) return { walletService: { getWallet: async () => result } };
      throw new Error(`Unexpected dependency ${name}`);
    },
  });
  const client = new QueryClient();
  const errors = [];
  const original = console.error;
  console.error = (...args) => errors.push(args.join(' '));
  try {
    return await client.fetchQuery({ ...exports.useUserWalletQuery(), retry: false });
  } finally {
    console.error = original;
    client.clear();
    assert.equal(errors.some(message => message.includes('Query data cannot be undefined')), false);
  }
}

test('wallet service failure reaches the query error state without undefined data', async () => {
  await assert.rejects(fetchWallet({ success: false, message: 'Wallet not found' }), /Wallet not found/);
});

test('successful response missing a wallet is treated as a request error', async () => {
  await assert.rejects(fetchWallet({ success: true }), /تعذر استرجاع المحفظة/);
});

test('successful wallet data is returned unchanged, including zero balance', async () => {
  const wallet = { _id: 'wallet', balance: 0, withdrawableBalance: 0 };
  assert.equal(await fetchWallet({ success: true, data: wallet }), wallet);
});
