const test = require('node:test');
const assert = require('node:assert/strict');
const block = require('./blockAmazonbot');
const fs = require('node:fs');
const path = require('node:path');

function request(userAgent, route = '/l/example') {
  const result = { headers: {}, next: false };
  const res = {
    set(key, value) { result.headers[key] = value; return this; },
    vary(value) { result.headers.Vary = value; return this; },
    status(value) { result.status = value; return this; },
    type(value) { result.type = value; return this; },
    send(value) { result.body = value; return this; },
  };
  block({ headers: { 'user-agent': userAgent }, path: route }, res, () => { result.next = true; });
  return result;
}

test('approved crawlers get small private rejections and can read robots.txt', () => {
  const robots = fs.readFileSync(path.join(__dirname, '../resources/robots.txt'), 'utf8');
  for (const token of ['CCBot', 'AhrefsBot', 'MJ12bot', 'DotBot', 'Amzn-SearchBot']) {
    for (const ua of [token.toLowerCase(), `Mozilla/5.0 (compatible; ${token}/2.0)`]) {
      const r = request(ua);
      assert.equal(r.next, false);
      assert.equal(r.status, 403);
      assert.equal(Buffer.byteLength(r.body), 10);
      assert.equal(r.headers['Cache-Control'], 'private, no-store');
      assert.equal(r.headers.Vary, 'User-Agent');
      assert.equal(request(ua, '/robots.txt').next, true);
    }
    assert.ok(robots.includes(`User-agent: ${token}`));
    assert.equal(request(`Not${token}`).next, true);
  }
});

test('discovery, user fetches and social previews remain available', () => {
  for (const ua of ['meta-webindexer/1.1', 'facebookexternalhit/1.1', 'Facebot',
    'meta-externalfetcher/1.1', 'Amzn-User/1.0', 'AhrefsSiteAudit/6.1', 'Googlebot/2.1',
    'bingbot/2.0', 'Applebot/0.1', 'OAI-SearchBot/1.4', 'ChatGPT-User/1.0',
    'PerplexityBot/1.0', 'Mozilla/5.0', '']) {
    assert.equal(request(ua).next, true, ua);
  }
});
