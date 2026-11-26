'use strict';

const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { createServer } = require('node:http');
const { randomUUID, webcrypto } = require('node:crypto');
const test = require('node:test');
const assert = require('node:assert/strict');
const { PGlite } = require('@electric-sql/pglite');
const { SignJWT, generateKeyPair, exportJWK, createLocalJWKSet } = require('jose');
const { createMarketplace } = require('./http.cjs');
const { SiteError } = require('./common.cjs');

const appPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNQzgoHAAGYAOW+8C66AAAAAElFTkSuQmCC', 'base64',
);
const originalOwner = '0fa4fe5d-a8bb-4ce8-b676-d5bb4577de50';
const restrictedOwner = '232dad42-6b09-4a18-8f35-bddec8003752';
const pilotListing = '857f5b47-27ce-4a71-9d1b-51a293ebec45';

test('staging marketplace serves and authorizes the complete account and listing lifecycle', async t => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(readFileSync(join(__dirname, '..', 'schema.sql'), 'utf8'));
  await db.query(
    `INSERT INTO accounts (id, display_name, role, status, email, email_verified, created_at, sharetribe_state)
     VALUES ($1, 'Imported owner', 'provider', 'active', 'owner@example.test', true, now(), 'active'),
            ($2, 'Restricted owner', 'provider', 'restricted', 'restricted@example.test', true, now(), 'banned')`,
    [originalOwner, restrictedOwner],
  );
  await db.query(
    `INSERT INTO pilot_listing_snapshots (id, created_on, title, description, yearly_rent_idr, bedrooms, area,
      source_url, cover_source_hash, cover_key, cover_content_type, cover_sha256, owner_id)
      VALUES ($1, '2026-11-21', 'Kerobokan villa', 'Pool villa', 210000000, 2, 'Kerobokan',
      'https://example.test', 'hash', 'original-cover', 'image/png', 'checksum', $2)`, [pilotListing, originalOwner],
  );
  await db.exec(readFileSync(join(__dirname, 'schema.sql'), 'utf8'));
  await db.exec(readFileSync(join(__dirname, 'schema.sql'), 'utf8'));
  await db.query("INSERT INTO account_identities (provider, subject, account_id) VALUES ('google', 'synthetic-google', $1)", [originalOwner]);
  const connection = {
    async query(sql, args = []) {
      const result = await db.query(sql, args);
      return { rows: result.rows, rowCount: /^\s*(?:SELECT|WITH)/i.test(sql) ? result.rows.length : result.affectedRows };
    },
  };
  const database = { ...connection, async connect() { return { ...connection, release() {} }; } };
  const savedPhotos = new Map([['original-cover', appPng]]);
  const storage = {
    contentType() { return 'image/png'; },
    async put(key, bytes) { savedPhotos.set(key, bytes); },
    async get(key, type) {
      if (!savedPhotos.has(key)) throw new SiteError(404, 'Photo not found.');
      return { bytes: savedPhotos.get(key), contentType: type };
    },
    async remove(key) { savedPhotos.delete(key); },
  };
  const mails = new Map();
  const pair = await generateKeyPair('RS256');
  const googleKeySet = createLocalJWKSet({ keys: [{ ...await exportJWK(pair.publicKey), kid: 'test' }] });
  let googleNonce;
  let googleSubject = 'synthetic-google';
  const fetchMail = async (url, init) => {
    if (url === 'https://oauth2.googleapis.com/token') {
      assert.ok(init.body.get('code_verifier'));
      const idToken = await new SignJWT({ email: 'owner@example.test', email_verified: true, nonce: googleNonce })
        .setProtectedHeader({ alg: 'RS256', kid: 'test' }).setIssuer('https://accounts.google.com')
        .setAudience('test-client').setSubject(googleSubject).setIssuedAt().setExpirationTime('5m').sign(pair.privateKey);
      return Response.json({ id_token: idToken });
    }
    const body = JSON.parse(init.body);
    if (url.startsWith('https://api.cloudflare.com/')) {
      assert.equal(url, 'https://api.cloudflare.com/client/v4/accounts/' + 'a'.repeat(32) + '/email/sending/send');
      assert.equal(init.headers.Authorization, 'Bearer synthetic');
      mails.set(body.to, body.text.match(/#([A-Za-z0-9_-]{43})/)[1]);
      return Response.json({ success: true, result: { queued: [body.to] } });
    }
    assert.equal(url, 'https://api.resend.com/emails');
    mails.set(body.to[0], body.text.match(/#([A-Za-z0-9_-]{43})/)[1]);
    return new Response('accepted', { status: 200 });
  };
  let marketplace;
  const server = createServer(async (req, res) => {
    if (!(await marketplace(req, res))) res.writeHead(404).end();
  });
  server.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const origin = 'http://127.0.0.1:' + server.address().port;
  marketplace = createMarketplace(database, {
    MARKETPLACE_ORIGIN: origin, MARKETPLACE_EMAIL_FROM: 'test@example.test',
    MARKETPLACE_EMAIL_PROVIDER: 'cloudflare', MARKETPLACE_CLOUDFLARE_ACCOUNT_ID: 'a'.repeat(32),
    MARKETPLACE_CLOUDFLARE_EMAIL_TOKEN: 'synthetic',
    MARKETPLACE_GOOGLE_CLIENT_ID: 'test-client', MARKETPLACE_GOOGLE_CLIENT_SECRET: 'synthetic',
    MARKETPLACE_STAFF_IDS: originalOwner, MARKETPLACE_LISTING_APPROVAL: 'true',
  }, { storage, fetchImpl: fetchMail, googleKeySet });
  const password = 'test password phrase 42';

  async function call(path, method = 'GET', body, cookie, expected = 200, requestOrigin = origin) {
    const headers = { origin: requestOrigin };
    if (cookie) headers.cookie = cookie;
    if (body && !Buffer.isBuffer(body)) {
      headers['content-type'] = 'application/json';
      body = JSON.stringify(body);
    }
    const response = await fetch(origin + path, { method, body, headers, redirect: 'manual' });
    const type = response.headers.get('content-type');
    const reply = type?.includes('json') ? await response.json() : await response.text();
    assert.equal(response.status, expected, JSON.stringify(reply));
    return { ...reply, cookie: response.headers.getSetCookie()[0]?.split(';')[0], reply, headers: response.headers };
  }

  const initialHome = await call('/');
  assert.match(initialHome.reply, /Bali Listings/);
  const showroom = await call('/api/marketplace/listings?category=rental&area=kerobokan&period=yearly&min=200000000');
  assert.equal(showroom.listings[0].id, pilotListing);
  assert.equal((await call('/api/marketplace/listings/' + pilotListing)).owner.id, originalOwner);
  await call('/api/media/' + pilotListing);
  await call('/api/marketplace/listings?min=bad', 'GET', undefined, undefined, 400);
  await call('/api/auth/signup', 'POST', { email: 'bad@example.test' }, undefined, 403, 'https://another.example.test');
  const oidc = await call('/api/auth/google', 'POST', { next: '//another.example.test' });
  const googleParams = new URL(oidc.url).searchParams;
  assert.equal(googleParams.get('code_challenge_method'), 'S256');
  assert.match(oidc.cookie, /^bali_oauth=/);
  await call('/api/auth/google/callback?state=unknown&code=sample', 'GET', undefined, oidc.cookie, 303);
  googleNonce = googleParams.get('nonce');
  const linked = await call('/api/auth/google/callback?state=' + googleParams.get('state') + '&code=sample',
    'GET', undefined, oidc.cookie, 303);
  const googleCookie = linked.headers.getSetCookie().find(value => value.startsWith('bali_session=')).split(';')[0];
  assert.equal(linked.headers.get('location'), '/');
  assert.equal((await call('/api/auth/session', 'GET', undefined, googleCookie)).account.id, originalOwner);
  googleSubject = 'unlinked-google';
  const unlinked = await call('/api/auth/google', 'POST', { role: 'customer', accepted: true });
  const unlinkedParams = new URL(unlinked.url).searchParams;
  googleNonce = unlinkedParams.get('nonce');
  const refused = await call('/api/auth/google/callback?state=' + unlinkedParams.get('state') + '&code=sample',
    'GET', undefined, unlinked.cookie, 303);
  assert.match(refused.headers.get('location'), /recover/i);
  assert.ok(!refused.headers.getSetCookie().some(value => value.startsWith('bali_session=')));

  await call('/api/auth/recovery', 'POST', { email: 'restricted@example.test' });
  assert.equal(mails.has('restricted@example.test'), false);
  await call('/api/auth/recovery', 'POST', { email: 'owner@example.test' });
  const recovery = await call('/api/auth/password', 'POST', { token: mails.get('owner@example.test'), password });
  const staff = recovery.cookie;
  assert.equal((await call('/api/auth/session', 'GET', undefined, staff)).account.id, originalOwner);
  await call('/api/auth/password', 'POST', { token: mails.get('owner@example.test'), password }, undefined, 400);

  async function signUp(email, role) {
    await call('/api/auth/signup', 'POST', { email, role, name: role + ' test', accepted: true });
    const saved = await call('/api/auth/password', 'POST', { token: mails.get(email), password });
    const first = await call('/api/auth/session', 'GET', undefined, saved.cookie);
    const signedIn = await call('/api/auth/login', 'POST', { email, password });
    const second = await call('/api/auth/session', 'GET', undefined, signedIn.cookie);
    assert.equal(first.account.id, second.account.id);
    assert.equal(second.account.role, role);
    return [signedIn.cookie, second.account.id];
  }
  const [customer] = await signUp('visitor@example.test', 'customer');
  const [owner, ownerId] = await signUp('provider@example.test', 'provider');
  const [otherOwner] = await signUp('other@example.test', 'provider');
  const adapterSource = readFileSync(join(__dirname, '..', '..', 'src', 'util', 'nativeMarketplace.js'));
  const { createNativeMarketplaceSdk } = await import('data:text/javascript;base64,' + adapterSource.toString('base64'));
  const previousWindow = global.window;
  global.window = { crypto: webcrypto };
  t.after(() => { global.window = previousWindow; });
  class UUID { constructor(value) { this.uuid = value; } }
  class Money { constructor(amount, currency) { Object.assign(this, { amount, currency }); } }
  class LatLng { constructor(lat, lng) { Object.assign(this, { lat, lng }); } }
  const sdk = createNativeMarketplaceSdk({}, { UUID, Money, LatLng }, (url, options = {}) =>
    call(url, options.method, options.body, owner,
      options.method === 'POST' && (url.endsWith('/listings') || url.endsWith('/photos')) ? 201 : 200)
      .then(response => response.reply));
  const wizard = await sdk.ownListings.createDraft({
    title: 'Original editor draft', description: 'Created with the original listing wizard',
    publicData: { categoryLevel1: 'rentalvillas', bedrooms: '2', phonenumber: '+62812345678' },
  });
  const wizardId = wizard.data.data.id;
  await sdk.ownListings.update({ id: wizardId, geolocation: new LatLng(-8.68, 115.17),
    publicData: { location: { address: 'Umalas, Bali' } } });
  await sdk.ownListings.update({ id: wizardId,
    price: new Money(3200000000, 'IDR'), publicData: { pricee: ['monthly'], monthprice: 32000000 } });
  const photo = await sdk.images.upload({ image: appPng, listingId: wizardId });
  await sdk.ownListings.update({ id: wizardId, images: [photo.data.data.id] });
  const submitted = (await sdk.ownListings.publishDraft({ id: wizardId })).data.data;
  assert.equal(submitted.attributes.state, 'pendingApproval');
  assert.equal(submitted.attributes.geolocation.lat, -8.68);
  assert.equal(submitted.attributes.publicData.phonenumber, '+62812345678');
  assert.equal(submitted.attributes.publicData.monthprice, 32000000);
  assert.equal(submitted.relationships.images.data[0].id.uuid, photo.data.data.id.uuid);
  await call('/api/marketplace/profile', 'PATCH', { name: 'Bali test owner', bio: 'About the test owner' }, owner);
  assert.equal((await call('/api/marketplace/profiles/' + ownerId)).name, 'Bali test owner');
  const listing = {
    requestKey: randomUUID(), title: 'Test villa with pool', description: 'A test property',
    area: 'Bingin', category: 'rental', bedrooms: 2, phone: '+62 123 456 789', prices: { monthly: 25000000 },
  };
  await call('/api/marketplace/listings', 'POST', listing, customer, 403);
  const { id } = await call('/api/marketplace/listings', 'POST', listing, owner, 201);
  assert.equal((await call('/api/marketplace/listings', 'POST', listing, owner, 201)).id, id);
  const item = '/api/marketplace/listings/' + id;
  await call(item, 'GET', undefined, otherOwner, 404);
  await call(item, 'PATCH', listing, otherOwner, 404);
  assert.equal((await call(item, 'GET', undefined, owner)).owner.id, ownerId);
  await call(item + '/publish', 'POST', undefined, owner, 400);
  const cover = await call(item + '/photos', 'POST', appPng, owner, 201);
  const privatePhoto = await call(item + '/photos', 'POST', appPng, owner, 201);
  assert.equal((await call(item + '/publish', 'POST', undefined, owner)).state, 'pendingApproval');
  await call(item, 'GET', undefined, undefined, 404);
  assert.equal((await call('/api/marketplace/moderation', 'GET', undefined, staff)).listings[0].id, id);
  const published = await call(item + '/approve', 'POST', undefined, staff);
  assert.equal(published.state, 'published');
  assert.match(published.reference, /^BL-\d{6}$/);
  assert.equal((await call(item + '/approve', 'POST', undefined, staff)).reference, published.reference);

  assert.equal((await call(item)).photos.length, 1);
  assert.equal((await call(item, 'GET', undefined, customer)).photos.length, 2);
  await call(privatePhoto.url, 'GET', undefined, undefined, 404);
  await call(privatePhoto.url, 'GET', undefined, customer);
  await call(item + '/contact', 'GET', undefined, undefined, 401);
  const wa = new URL((await call(item + '/contact', 'GET', undefined, customer)).url);
  assert.equal(wa.pathname, '/62123456789');
  assert.match(wa.searchParams.get('text'), new RegExp(id));
  assert.match(wa.searchParams.get('text'), new RegExp(published.reference));

  await call(item + '/photos', 'PUT', { ids: [privatePhoto.id], previousIds: [privatePhoto.id] }, owner, 409);
  await call(item + '/photos', 'PUT', { ids: [privatePhoto.id, cover.id], previousIds: [cover.id, privatePhoto.id] }, owner);
  assert.equal((await call(item)).photos[0].id, privatePhoto.id);
  await call(item, 'PATCH', { ...listing, area: 'Uluwatu' }, owner);
  await call(item + '/availability', 'POST', undefined, owner);
  const filtered = await call('/api/marketplace/listings?available=1&area=uluwatu&bedrooms=2&min=20000000&period=monthly&q=' + published.reference);
  assert.equal(filtered.listings[0].id, id);
  await call(item + '/close', 'POST', undefined, owner);
  await call(item, 'GET', undefined, customer, 404);
  await call(privatePhoto.url, 'GET', undefined, customer, 404);
  assert.equal((await call(item + '/approve', 'POST', undefined, staff)).reference, published.reference);
  await call('/api/auth/logout', 'POST', undefined, customer);
  assert.equal((await call('/api/auth/session', 'GET', undefined, customer)).account, null);
  await call('/api/marketplace/listings', 'POST', listing, undefined, 401);
});
