const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { buildAssets, getAsset, prepareLocaleState } = require('./localeAssets');
const { staticCacheControl, pageCacheControl } = require('./cachePolicy');

test('locale assets reconstruct exact hydration state for every language and hosted overrides', () => {
  buildAssets();
  for (const locale of ['en', 'id', 'ru', 'de', 'es', 'fr']) {
    const asset = getAsset(locale);
    const messages = { ...asset.messages, custom: '</script><script>alert(1)</script>\u2028', empty: '' };
    const firstKey = Object.keys(asset.messages)[0];
    delete messages[firstKey];
    const state = { locale: { locale, messages }, listing: { id: '123', price: { _sdkType: 'Money', amount: 12345, currency: 'USD' } } };
    const original = JSON.stringify(state);
    const prepared = prepareLocaleState(state);
    const sandbox = { window: { __PRELOADED_STATE__: JSON.stringify(prepared.state) } };
    assert.ok(!asset.script.includes('</script>'));
    vm.runInNewContext(asset.script, sandbox);
    vm.runInNewContext(prepared.restore, sandbox);
    assert.deepEqual(JSON.parse(sandbox.window.__PRELOADED_STATE__), state);
    assert.deepEqual(JSON.parse(sandbox.window.__TRANSLATIONS__), messages);
    assert.equal(JSON.stringify(state), original, 'never mutate SSR state');
    assert.match(prepared.url, /^\/static\/locales\/[a-z]+\.[a-f0-9]{64}\.js$/);
  }
  assert.equal(getAsset('../../secrets'), null);
  assert.equal(prepareLocaleState({ locale: { locale: 'unknown', messages: {} } }), null);
});

test('missing build assets retain inline fallback', () => {
  const asset = getAsset('en');
  const file = path.join(__dirname, '../../build/static/locales', asset.filename);
  fs.renameSync(file, `${file}.test-backup`);
  try {
    assert.equal(prepareLocaleState({ locale: { locale: 'en', messages: asset.messages } }), null);
  } finally {
    fs.renameSync(`${file}.test-backup`, file);
  }
});

test('only content-versioned assets receive immutable cache policy', () => {
  for (const file of ['main.1234abcd.js', 'main.1234abcd.chunk.css', getAsset('en').filename]) {
    assert.match(staticCacheControl(file, true), /max-age=31536000, immutable/);
    assert.doesNotMatch(staticCacheControl(file, false), /immutable/);
  }
  for (const file of ['main.js', 'logo.png', 'service-worker.js']) {
    assert.equal(staticCacheControl(file, true), 'public, max-age=0, must-revalidate');
  }
});

test('private and nonce-bearing pages cannot enter shared caches', () => {
  const res = { getHeader: () => undefined };
  const req = { headers: {} };
  assert.equal(pageCacheControl(req, res, true, 600, false), 'public, max-age=600');
  for (const privateReq of [
    { headers: { cookie: 'session=anything' } },
    { headers: { authorization: 'Bearer example' } },
    { headers: {}, locals: { currentUser: { id: '1' } } },
  ]) assert.equal(pageCacheControl(privateReq, res, true, 600, false), 'private, no-store');
  assert.equal(pageCacheControl(req, { getHeader: () => ['session=x'] }, true, 600, false), 'private, no-store');
  assert.equal(pageCacheControl(req, res, true, 600, true), 'private, no-store');
  assert.equal(pageCacheControl(req, res, false, 600, false), 'private, no-store');
  assert.equal(pageCacheControl(req, res, true, NaN, false), 'private, no-store');
});

test('externalizing the dictionary substantially reduces compressed inline state', () => {
  const state = { locale: { locale: 'en', messages: getAsset('en').messages } };
  const prepared = prepareLocaleState(state);
  const before = zlib.brotliCompressSync(Buffer.from(JSON.stringify(state))).length;
  const after = zlib.brotliCompressSync(Buffer.from(JSON.stringify(prepared.state) + prepared.restore + prepared.url)).length;
  assert.ok(after < before / 4, `${before} -> ${after}`);
  console.log(`English locale inline payload (Brotli): ${before} -> ${after} bytes; shared asset downloaded once and cached.`);
});
