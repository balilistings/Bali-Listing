'use strict';

const { setTimeout: delay } = require('node:timers/promises');
const { AccountPilotError, sharetribeGet } = require('./account-pilot.cjs');
const { digest, transaction, uuid } = require('./site/common.cjs');
const { listingFields, normalizePhone } = require('./site/listings.cjs');
const { maxPhotoBytes, photoStorage } = require('./site/media.cjs');

const categories = { rentalvillas: 'rental', villaforsale: 'sale', landforsale: 'land' };
const rentFields = { monthly: 'monthprice', yearly: 'yearprice', weekly: 'weekprice' };
const states = new Set(['draft', 'pendingApproval', 'published', 'closed']);
const sourceFields = {
  include: 'author,images',
  'fields.user': 'profile.displayName',
  'fields.image': 'variants.scaled-xlarge,variants.default',
};
const positive = value => Number.isSafeInteger(value) && value > 0;

class ListingImportError extends Error {}

function timestamp(value) {
  return Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;
}

function photoUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'sharetribe.imgix.net' &&
      !url.username && !url.password && !url.port ? url.href : null;
  } catch { return null; }
}

function photoId(listingId, imageId) {
  const hash = digest(listingId + '/' + imageId);
  return [hash.slice(0, 8), hash.slice(8, 12), '5' + hash.slice(13, 16),
    '8' + hash.slice(17, 20), hash.slice(20, 32)].join('-');
}

function normalizeListing(doc, id) {
  const listing = doc.data;
  const attributes = listing?.attributes;
  const owner = listing?.relationships?.author?.data?.id;
  if (listing?.id !== id || listing.type !== 'listing' || !attributes || attributes.deleted || !states.has(attributes.state)) {
    throw new ListingImportError('source listing unavailable');
  }
  if (!uuid.test(owner || '')) throw new ListingImportError('source author missing');
  const data = attributes.publicData || {};
  const category = categories[data.categoryLevel1];
  const createdAt = timestamp(attributes.createdAt);
  if (!category || !createdAt || !attributes.title?.trim() || typeof attributes.description !== 'string') {
    throw new ListingImportError('unsupported category or incomplete listing');
  }
  const sourcePrice = attributes.price;
  if (sourcePrice && (sourcePrice.currency !== 'IDR' ||
      !Number.isSafeInteger(sourcePrice.amount) || sourcePrice.amount < 0)) {
    throw new ListingImportError('non-IDR or invalid source price');
  }
  const prices = {};
  if (category === 'rental') {
    for (const [period, field] of Object.entries(rentFields)) {
      const amount = Number(data[field]);
      if (positive(amount) && amount <= Math.floor(Number.MAX_SAFE_INTEGER / 100)) prices[period] = amount;
    }
  } else if (sourcePrice?.amount > 0) {
    prices.total = sourcePrice.amount / 100;
  }
  const pricePeriod = Object.keys(prices)[0] || null;
  const rawPhone = data.phonenumber || data.contactPhone || attributes.privateData?.phonenumber;
  const normalized = normalizePhone(rawPhone);
  const phone = /^[1-9]\d{7,14}$/.test(normalized) ? normalized : null;
  const rawReference = data.referenceCode || data.propertyCode || data.listingCode ||
    attributes.privateData?.referenceCode || attributes.metadata?.referenceCode;
  const reference = typeof rawReference === 'string' && /^[a-z0-9][a-z0-9_-]{0,39}$/i.test(rawReference.trim())
    ? rawReference.trim() : null;
  const point = attributes.geolocation;
  const coordinates = Number.isFinite(point?.lat) && Math.abs(point.lat) <= 90 &&
    Number.isFinite(point.lng) && Math.abs(point.lng) <= 180 ? point : null;
  const area = typeof data.location?.address === 'string' ? data.location.address : typeof data.area === 'string' ? data.area : '';
  const images = new Map((doc.included || []).filter(item => item.type === 'image').map(item => [item.id, item]));
  const links = listing.relationships?.images?.data || [];
  if (!Array.isArray(links) || links.length > 100 || new Set(links.map(link => link.id)).size !== links.length) {
    throw new ListingImportError('invalid or duplicate gallery entries');
  }
  const photos = links.map(link => {
    const variants = images.get(link.id)?.attributes?.variants || {};
    const urls = [...new Set(['scaled-xlarge', 'default'].map(name => photoUrl(variants[name]?.url)).filter(Boolean))];
    if (link.type !== 'image' || !uuid.test(link.id || '') || !urls.length) throw new ListingImportError('image variant missing');
    return { id: photoId(id, link.id), urls };
  });
  if (attributes.state === 'published' && (!photos.length || !pricePeriod)) {
    throw new ListingImportError('published listing missing photos or supported price');
  }
  const bedroomNumber = parseInt(data.bedrooms, 10);
  const item = {
    id, owner, category, area, createdAt, title: attributes.title, description: attributes.description,
    state: attributes.state, publicData: listingFields(data), prices, pricePeriod, phone, reference, coordinates, photos,
    bedrooms: Number.isInteger(bedroomNumber) && bedroomNumber >= 0 && bedroomNumber <= 99 && category !== 'land' ? bedroomNumber : null,
    confirmedAt: timestamp(attributes.privateData?.blAvailabilityConfirmedAt),
    sourcePrice,
  };
  item.hash = digest(JSON.stringify(item));
  return item;
}

async function retry(operation) {
  for (let attempt = 0; ; attempt += 1) {
    try { return await operation(); }
    catch (error) {
      if (attempt >= 2 || (error instanceof AccountPilotError && !/HTTP (429|5\d\d)$/.test(error.message)) ||
          error instanceof ListingImportError) throw error;
      await delay(600 * 2 ** attempt);
    }
  }
}

async function copyPhoto(storage, fetchImpl, listingId, photo) {
  for (const [index, url] of photo.urls.entries()) {
    try {
      const response = await retry(() => fetchImpl(url, {
        redirect: 'error', signal: AbortSignal.timeout(15_000),
        headers: { Accept: 'image/webp,image/jpeg,image/png' },
      }));
      if (!response.ok || !response.body || Number(response.headers.get('content-length')) > maxPhotoBytes) {
        await response.body?.cancel();
        continue;
      }
      let size = 0;
      const pieces = [];
      for await (const chunk of response.body) {
        size += chunk.length;
        if (size > maxPhotoBytes) break;
        pieces.push(chunk);
      }
      if (size > maxPhotoBytes) continue;
      const bytes = Buffer.concat(pieces);
      const mime = storage.contentType(bytes);
      const hash = digest(bytes);
      const key = 'migration/listings/' + listingId + '/' + photo.id + '/' + hash;
      await retry(() => storage.put(key, bytes, mime));
      const stored = await retry(() => storage.get(key, mime));
      if (digest(stored.bytes) !== hash) throw new ListingImportError('R2 image checksum mismatch');
      return { ...photo, key, mime, urlHash: digest(photo.urls.join('\n')) };
    } catch (error) {
      if (index + 1 === photo.urls.length) throw new ListingImportError('image copy or verification failed');
    }
  }
  throw new ListingImportError('no usable photo variant');
}

async function checkTarget(client, item, lock = false) {
  const { rows: [owner] } = await client.query(
    'SELECT role, status FROM accounts WHERE id=$1', [item.owner],
  );
  if (!owner || (item.state === 'published' && (owner.role !== 'provider' || owner.status !== 'active'))) {
    throw new ListingImportError('missing or restricted owner');
  }
  const { rows: [row] } = await client.query(
    'SELECT owner_id, sharetribe_source_hash, updated_at IS DISTINCT FROM sharetribe_synced_at AS edited, ' +
    'EXISTS (SELECT 1 FROM pilot_listing_snapshots p WHERE p.id=l.id AND p.owner_id=l.owner_id) AS pilot ' +
    'FROM listings l WHERE id=$1' + (lock ? ' FOR UPDATE' : ''), [item.id],
  );
  if (!row) return null;
  if ((!row.sharetribe_source_hash && (!row.pilot || row.owner_id !== item.owner)) ||
      (row.sharetribe_source_hash && row.edited)) {
    throw new ListingImportError('local listing or local edits require review');
  }
  return row;
}

async function writeListing(database, storage, fetchImpl, item) {
  const existing = await checkTarget(database, item);
  if (existing?.sharetribe_source_hash === item.hash) return 'unchanged';
  const { rows: previous } = await database.query(
    'SELECT id, object_key, content_type, source_url_hash FROM marketplace_listing_photos WHERE listing_id=$1',
    [item.id],
  );
  const copies = [];
  for (const photo of item.photos) {
    const saved = previous.find(row => row.id === photo.id && row.source_url_hash === digest(photo.urls.join('\n')));
    copies.push(saved ? { id: photo.id, key: saved.object_key, mime: saved.content_type, urlHash: saved.source_url_hash }
      : await copyPhoto(storage, fetchImpl, item.id, photo));
  }
  return transaction(database, async client => {
    await client.query('SELECT pg_advisory_xact_lock(961032072)');
    const current = await checkTarget(client, item, true);
    if (current?.sharetribe_source_hash === item.hash) return 'unchanged';
    if (current?.sharetribe_source_hash !== existing?.sharetribe_source_hash) {
      throw new ListingImportError('source import changed concurrently; retry the listing');
    }
    if (item.reference) {
      const code = item.reference.toUpperCase();
      const { rowCount } = await client.query(
        'SELECT 1 FROM listings WHERE id<>$1 AND (upper(legacy_reference)=$2 OR upper(reference_code)=$2)',
        [item.id, code],
      );
      if (rowCount) throw new ListingImportError('reference collision');
      const reserved = await client.query(
        'INSERT INTO marketplace_reference_registry (code) VALUES ($1) ON CONFLICT DO NOTHING', [code],
      );
      if (!reserved.rowCount) {
        const { rowCount: known } = await client.query(
          'SELECT 1 FROM listings WHERE id=$1 AND (upper(legacy_reference)=$2 OR upper(reference_code)=$2)', [item.id, code],
        );
        if (!known) throw new ListingImportError('reference already reserved');
      }
    }
    await client.query(
      'INSERT INTO listings (id, owner_id, slug, title, description, state, created_at, category, area, bedrooms, ' +
      'latitude, longitude, price_amount, currency, prices, price_period, contact_phone, legacy_reference, ' +
      'availability_confirmed_at, public_data, source_price_minor, source_price_currency, sharetribe_source_hash, ' +
      'updated_at, sharetribe_synced_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,now(),now()) ' +
      'ON CONFLICT (id) DO UPDATE SET owner_id=excluded.owner_id, title=excluded.title, description=excluded.description, ' +
      'state=excluded.state, created_at=excluded.created_at, category=excluded.category, area=excluded.area, bedrooms=excluded.bedrooms, ' +
      'latitude=excluded.latitude, longitude=excluded.longitude, price_amount=excluded.price_amount, currency=excluded.currency, ' +
      'prices=excluded.prices, price_period=excluded.price_period, contact_phone=excluded.contact_phone, legacy_reference=excluded.legacy_reference, ' +
      'availability_confirmed_at=excluded.availability_confirmed_at, public_data=excluded.public_data, source_price_minor=excluded.source_price_minor, ' +
      'source_price_currency=excluded.source_price_currency, sharetribe_source_hash=excluded.sharetribe_source_hash, updated_at=now(), sharetribe_synced_at=now()',
      [item.id, item.owner, item.id, item.title, item.description, item.state, item.createdAt, item.category, item.area,
        item.bedrooms, item.coordinates?.lat, item.coordinates?.lng, item.pricePeriod ? Math.trunc(item.prices[item.pricePeriod]) : null,
        item.pricePeriod ? 'IDR' : null, item.prices, item.pricePeriod, item.phone, item.reference, item.confirmedAt,
        item.publicData, item.sourcePrice?.amount, item.sourcePrice?.currency, item.hash],
    );
    await client.query('DELETE FROM marketplace_listing_photos WHERE listing_id=$1', [item.id]);
    for (const [position, photo] of copies.entries()) {
      await client.query(
        'INSERT INTO marketplace_listing_photos (id, listing_id, object_key, content_type, position, source_url_hash) VALUES ($1,$2,$3,$4,$5,$6)',
        [photo.id, item.id, photo.key, photo.mime, position, photo.urlHash],
      );
    }
    return current ? 'updated' : 'inserted';
  });
}

async function pilotIds(database, read) {
  const runName = 'recent-category-pilot-v2';
  const { rows: [known] } = await database.query(
    'SELECT listing_ids FROM listing_import_pilot WHERE run_name=$1', [runName],
  );
  if (known) return known.listing_ids;
  const ids = [];
  const now = Date.now();
  const createdAtStart = new Date(now - 180 * 86400000).toISOString();
  const createdAtEnd = new Date(now).toISOString();
  for (const category of Object.keys(categories)) {
    const { data } = await read('listings/query', {
      states: 'published', sort: 'createdAt', pub_categoryLevel1: category, perPage: 3,
      createdAtStart, createdAtEnd,
    });
    if (!Array.isArray(data)) throw new ListingImportError('incomplete pilot inventory');
    ids.push(...data.filter(row => !row.attributes?.deleted).map(row => row.id));
  }
  const distinct = [...new Set(ids)];
  if (!distinct.length || distinct.length > 9 || distinct.some(id => !uuid.test(id))) {
    throw new ListingImportError('invalid pilot inventory');
  }
  const { rows: [saved] } = await database.query(
    'INSERT INTO listing_import_pilot (run_name, listing_ids) VALUES ($1,$2) ON CONFLICT (run_name) ' +
    'DO UPDATE SET run_name=EXCLUDED.run_name RETURNING listing_ids', [runName, distinct],
  );
  return saved.listing_ids;
}

async function runListingImport(database, env, { fetchImpl = fetch, storage = photoStorage() } = {}) {
  const mode = env.LISTING_IMPORT_MODE;
  if (!mode) return;
  if (env.RENDER_SERVICE_NAME !== 'balilistings-migration-staging' || !['pilot', 'dry-run', 'apply'].includes(mode)) {
    throw new ListingImportError('listing import is restricted to migration staging');
  }
  const get = await retry(() => sharetribeGet(env, fetchImpl));
  const read = (path, params) => retry(() => get(path, params));
  const ids = env.LISTING_IMPORT_IDS?.split(',').map(id => id.trim()) || (mode === 'pilot' ? await pilotIds(database, read) : []);
  if (!ids.length || ids.length > (mode === 'pilot' ? 9 : 5000) ||
      new Set(ids).size !== ids.length || ids.some(id => !uuid.test(id))) {
    throw new ListingImportError('use a valid unique list of approved listing UUIDs');
  }
  const report = { mode, selected: ids.length, listings: [] };
  for (const id of ids) {
    try {
      const item = normalizeListing(await read('listings/show', { id, ...sourceFields }), id);
      const result = mode === 'dry-run' ? (await checkTarget(database, item), 'ready') :
        await writeListing(database, storage, fetchImpl, item);
      const rerun = mode === 'pilot' ? await writeListing(database, storage, fetchImpl, item) : undefined;
      report.listings.push({ id, result, rerun, category: item.category, photos: item.photos.length,
        hasContact: Boolean(item.phone), hasCoordinates: Boolean(item.coordinates), hasLegacyReference: Boolean(item.reference) });
    } catch (error) {
      report.listings.push({ id, result: 'review', reason: error instanceof ListingImportError || error instanceof AccountPilotError
        ? error.message : 'database or source error' });
    }
  }
  return report;
}

module.exports = { runListingImport, normalizeListing, writeListing, ListingImportError };

