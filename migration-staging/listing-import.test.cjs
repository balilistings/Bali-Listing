'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const { PGlite } = require('@electric-sql/pglite');
const { runListingImport } = require('./listing-import.cjs');

const id = '43ef3066-02af-4af3-a584-136484a3f2df';
const owner = '4cbb0094-84a9-4aae-bfe9-48ca2cf0b67d';
const imageIds = ['a264d07d-e0b8-4f30-816f-83ce5a1fa4ee', 'af2f6989-420f-438f-9000-37d54a08cd8f'];
const urls = imageIds.map(image => 'https://sharetribe.imgix.net/' + image);
const document = {
  data: {
    id, type: 'listing',
    attributes: {
      title: 'Sample listing', description: 'A villa with two photographs', state: 'published',
      createdAt: '2026-11-21T03:00:00Z', price: { amount: 21000000000, currency: 'IDR' },
      geolocation: { lat: -8.68, lng: 115.16 },
      publicData: {
        categoryLevel1: 'rentalvillas', bedrooms: '2', location: { address: 'Kerobokan, Bali' },
        yearprice: 210000000, referenceCode: '2KR-TEST', phonenumber: '+628123456789',
      },
      privateData: { blAvailabilityConfirmedAt: '2026-11-22T00:00:00Z', unrelated: 'retain at source only' },
    },
    relationships: { author: { data: { id: owner, type: 'user' } },
      images: { data: imageIds.map(id => ({ type: 'image', id })) } },
  },
  included: imageIds.map((id, index) => ({ type: 'image', id,
    attributes: { variants: { default: { url: urls[index] } } } })),
};

test('listing pilot dry-runs, verifies ordered photos, and reruns without duplicates or overwriting owner changes', async t => {
  const pg = new PGlite();
  t.after(() => pg.close());
  await pg.exec(readFileSync(join(__dirname, 'schema.sql'), 'utf8'));
  await pg.exec(readFileSync(join(__dirname, 'site', 'schema.sql'), 'utf8'));
  const connection = {
    async query(sql, args = []) {
      const result = await pg.query(sql, args);
      return { rows: result.rows, rowCount: /^\s*SELECT/i.test(sql) ? result.rows.length : result.affectedRows };
    },
  };
  const database = { ...connection, async connect() { return { ...connection, release() {} }; } };
  await database.query("INSERT INTO accounts (id, display_name, role, status, created_at) VALUES ($1,'Provider','provider','active',now())", [owner]);
  const up = new Map();
  let writes = 0;
  const storage = {
    contentType() { return 'image/png'; },
    async put(key, bytes) { up.set(key, bytes); writes += 1; },
    async get(key) { return { bytes: up.get(key) }; },
  };
  const fetchImpl = async (url, options) => {
    if (url === 'https://flex-api.sharetribe.com/v1/auth/token') {
      assert.equal(options.method, 'POST');
      return Response.json({ access_token: 'fixture', scope: 'integ' });
    }
    if (urls.includes(url)) return new Response(Buffer.alloc(30, urls.indexOf(url) + 1));
    assert.equal(new URL(url).searchParams.get('id'), id);
    return Response.json(document);
  };
  const env = {
    RENDER_SERVICE_NAME: 'balilistings-migration-staging', LISTING_IMPORT_IDS: id,
    SHARETRIBE_INTEGRATION_CLIENT_ID: 'fixture', SHARETRIBE_INTEGRATION_CLIENT_SECRET: 'fixture',
  };
  const run = mode => runListingImport(database, { ...env, LISTING_IMPORT_MODE: mode }, { storage, fetchImpl });
  assert.equal((await run('dry-run')).listings[0].result, 'ready');
  assert.equal(writes, 0);
  const { listings: [record] } = await run('pilot');
  assert.equal(record.result, 'inserted');
  assert.equal(record.rerun, 'unchanged');
  assert.equal(record.hasContact, true);
  assert.equal(record.hasCoordinates, true);
  assert.equal(record.hasLegacyReference, true);
  assert.equal(writes, 2);
  const { rows: [saved] } = await database.query('SELECT * FROM listings WHERE id=$1', [id]);
  assert.equal(saved.owner_id, owner);
  assert.equal(saved.legacy_reference, '2KR-TEST');
  assert.equal(saved.contact_phone, '628123456789');
  assert.equal(saved.public_data.phonenumber, undefined);
  assert.equal(saved.latitude, -8.68);
  assert.equal(Number(saved.source_price_minor), 21000000000);
  const { rows: gallery } = await database.query(
    'SELECT object_key FROM marketplace_listing_photos WHERE listing_id=$1 ORDER BY position', [id],
  );
  assert.deepEqual(gallery.map(photo => up.get(photo.object_key)[0]), [1, 2]);
  await database.query("UPDATE listings SET title='Owner edit', updated_at=sharetribe_synced_at + interval '1 second' WHERE id=$1", [id]);
  assert.equal((await run('apply')).listings[0].reason, 'local listing or local edits require review');
  assert.equal(writes, 2);
});

