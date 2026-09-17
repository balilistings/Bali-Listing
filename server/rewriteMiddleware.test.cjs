const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const seo = require('../src/util/seoUrls');
const source = fs.readFileSync(require.resolve('./rewriteMiddleware'), 'utf8');
const setup = result => {
  const calls = [];
  const query = { select: value => { calls.push(value); return query; }, eq: () => query, maybeSingle: async () => result };
  const module = { exports: {} };
  vm.runInNewContext(source, { module, console, require: name => name.includes('supabase')
    ? { from: table => { calls.push(table); return query; } }
    : name.includes('translation') ? { getSupportedLocales: () => ['en','ru','id'] } : seo });
  const res = { status(code) { this.code = code; return this; }, set() { return this; }, send(body) { this.body = body; return this; }, redirect(code, url) { this.code = code; this.url = url; } };
  return { middleware: module.exports, calls, res };
};
test('SSR resolves localized profile slugs using the same table as the API', async () => {
  const { middleware, calls, res } = setup({ data: { user_id: 'user-id' } });
  const req = { path: '/ru/user/vira', url: '/ru/user/vira?utm_source=test' };
  let next = false;
  await middleware(req, res, () => { next = true; });
  assert.equal(req.url, '/ru/u/user-id?utm_source=test');
  assert.deepEqual(calls, ['sharetribe_users', 'user_id']);
  assert.equal(next, true);
});
test('missing profiles are real 404s; database failure is not disguised as an empty 200', async () => {
  for (const [result, status] of [[{ data: null }, 404], [{ error: new Error('unavailable') }, 503]]) {
    const { middleware, res } = setup(result);
    await middleware({ path:'/user/missing', url:'/user/missing' }, res, () => assert.fail('must not render'));
    assert.equal(res.code, status);
  }
});
test('unrelated listing routes never query user slugs', async () => {
  const { middleware, calls, res } = setup({});
  await middleware({ path:'/l/villa/uuid', url:'/l/villa/uuid' }, res, () => {});
  assert.deepEqual(calls, []);
});
test('known legacy blog URLs permanently redirect; other CMS pages stay intact', async () => {
  const { middleware, res } = setup({});
  await middleware({ path:'/p/a-guide-to-booking-your-dream-villa-in-bali', url:'/p/a-guide-to-booking-your-dream-villa-in-bali?utm_source=test' }, res, () => assert.fail());
  assert.equal(res.code, 301);
  assert.equal(res.url, '/blog/a-guide-to-booking-your-dream-villa-in-bali?utm_source=test');
  assert.equal(seo.seoPagePath('landing-page-ru'), 'p/landing-page-ru');
});
test('SEO host uses the real destination and preserves development hosts', () => {
  assert.equal(seo.seoRootURL('http://www.balilistings.com'), 'https://balilistings.com');
  assert.equal(seo.seoRootURL('https://www.balilistings.com/'), 'https://balilistings.com');
  assert.equal(seo.seoRootURL('http://localhost:3000'), 'http://localhost:3000');
});
