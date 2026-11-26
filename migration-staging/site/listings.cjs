'use strict';

const { randomUUID } = require('node:crypto');
const { SiteError, cleanText, transaction, uuid } = require('./common.cjs');

const categories = ['rental', 'sale', 'land'];
const rentPeriods = ['weekly', 'monthly', 'yearly'];
const salePeriods = ['total'];
const maxPrice = 999_999_999_999_999;
const maxPhotos = 10;

function listingInput(body) {
  const title = cleanText(body.title, 160);
  const description = cleanText(body.description, 10000);
  const area = cleanText(body.area, 100);
  const phone = cleanText(body.phone, 40);
  const bedrooms = Number(body.bedrooms);
  const hasBedrooms = body.bedrooms !== '' && body.bedrooms != null;
  const category = body.category;
  if (!categories.includes(category) || !title || !description || !area ||
      (category !== 'land' && (!hasBedrooms || !Number.isInteger(bedrooms) || bedrooms < 0 || bedrooms > 99))) {
    throw new SiteError(400, 'Enter a title, description, area and valid property details.');
  }
  const prices = {};
  for (const period of category === 'rental' ? rentPeriods : salePeriods) {
    const amount = Number(body.prices?.[period]);
    if (body.prices?.[period] === '' || body.prices?.[period] == null) continue;
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > maxPrice) {
      throw new SiteError(400, 'Enter positive prices in whole rupiah.');
    }
    prices[period] = amount;
  }
  const [pricePeriod] = Object.keys(prices);
  const normalizedPhone = phone.replace(/[\s().-]/g, '').replace(/^\+/, '');
  if (phone && !/^[1-9]\d{7,14}$/.test(normalizedPhone)) {
    throw new SiteError(400, 'Enter a WhatsApp number with its country code.');
  }
  return { title, description, area, category, bedrooms: category === 'land' ? null : bedrooms, prices, pricePeriod,
    priceAmount: prices[pricePeriod] ?? null, currency: pricePeriod ? 'IDR' : null, phone: normalizedPhone || null };
}

function numericFilter(value, maximum) {
  if (value === null || value === '') return null;
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0 || number > maximum) {
    throw new SiteError(400, 'Some search filters are invalid.');
  }
  return number;
}

function publicListing(row, privateView = false) {
  const { contactPhone, email, phonenumber, ...publicData } = row.public_data || {};
  return {
    id: row.id, title: row.title, area: row.area, category: row.category, description: row.description,
    bedrooms: row.bedrooms, prices: row.prices, reference: row.legacy_reference || row.reference_code,
    confirmedAt: row.availability_confirmed_at, pricePeriod: row.price_period,
    cover: row.cover_id ? '/api/media/' + row.cover_id : null,
    createdAt: row.created_at,
    publicData,
    coordinates: row.latitude == null || row.longitude == null ? null :
      { lat: row.latitude, lng: row.longitude },
    ...(row.owner_name ? { owner: { id: row.owner_id, name: row.owner_name } } : {}),
    ...(privateView ? { state: row.state, phone: row.contact_phone } : {}),
  };
}

const canManage = (actor, row) => Boolean(actor && (actor.id === row.owner_id || actor.staff));
const canReadPrivate = (actor, row) => Boolean(actor && (canManage(actor, row) || actor.canRead));

function createListings(database, storage, origin, env) {
  async function getListing(id, client = database, lock = false) {
    if (!uuid.test(id || '')) throw new SiteError(404, 'Listing not found.');
    const { rows: [row] } = await client.query(
      `SELECT l.*, a.status AS owner_status, a.role AS owner_role, a.display_name AS owner_name,
              (SELECT id FROM marketplace_listing_photos WHERE listing_id = l.id AND position = 0) AS cover_id
       FROM listings l JOIN accounts a ON a.id = l.owner_id WHERE l.id = $1 AND NOT l.is_pilot_fixture
       ${lock ? 'FOR UPDATE OF l' : ''}`, [id],
    );
    if (!row) throw new SiteError(404, 'Listing not found.');
    return row;
  }

  const isPublic = row => row.state === 'published' && row.owner_status === 'active' && row.owner_role === 'provider';

  async function search(params, ownerId = null) {
    if (ownerId && !uuid.test(ownerId)) throw new SiteError(404, 'Profile not found.');
    const category = cleanText(params.get('category'), 16);
    const period = cleanText(params.get('period'), 16);
    const sort = params.get('sort');
    const low = numericFilter(params.get('min'), maxPrice);
    const high = numericFilter(params.get('max'), maxPrice);
    if (low !== null && high !== null && low > high) throw new SiteError(400, 'The minimum exceeds the maximum.');
    const offset = numericFilter(params.get('offset'), 100000) ?? 0;
    const limit = Math.max(1, numericFilter(params.get('limit'), 100) ?? 24);
    const bedroomValues = params.get('bedrooms');
    const bedrooms = bedroomValues ? bedroomValues.split(',').map(value => numericFilter(value, 99)) : null;
    const rawIds = params.get('ids');
    const ids = rawIds ? rawIds.split(',') : null;
    if (ids && (ids.length > 100 || ids.some(value => !uuid.test(value)))) {
      throw new SiteError(400, 'Some listing IDs are invalid.');
    }
    const priceSort = sort === 'price' || sort === 'price-desc' ? sort : null;
    const { rows } = await database.query(
      `SELECT l.*, a.display_name AS owner_name, count(*) OVER () AS listing_total,
          (SELECT id FROM marketplace_listing_photos WHERE listing_id = l.id AND position = 0) AS cover_id
       FROM listings l JOIN accounts a ON a.id = l.owner_id
       WHERE l.state = 'published' AND NOT l.is_pilot_fixture AND a.status = 'active' AND a.role = 'provider'
         AND ($1::text IS NULL OR l.category = $1) AND ($2::text IS NULL OR strpos(lower(l.area), lower($2)) > 0)
         AND ($3::int[] IS NULL OR l.bedrooms = ANY($3))
         AND ($4::text IS NULL OR strpos(lower(l.title || ' ' || l.description || ' ' || l.area || ' ' ||
              coalesce(l.reference_code, '') || ' ' || coalesce(l.legacy_reference, '')), lower($4)) > 0)
         AND ($5::numeric IS NULL OR coalesce((l.prices->>$6)::numeric, CASE WHEN $6::text IS NULL THEN l.price_amount END) >= $5)
         AND ($7::numeric IS NULL OR coalesce((l.prices->>$6)::numeric, CASE WHEN $6::text IS NULL THEN l.price_amount END) <= $7)
         AND (NOT $8::boolean OR l.availability_confirmed_at >= now() - interval '30 days')
         AND ($9::uuid IS NULL OR l.owner_id = $9)
         AND ($12::uuid[] IS NULL OR l.id = ANY($12))
       ORDER BY CASE WHEN $10::text = 'price' THEN coalesce((l.prices->>$6)::numeric, l.price_amount) END ASC NULLS LAST,
         CASE WHEN $10::text = 'price-desc' THEN coalesce((l.prices->>$6)::numeric, l.price_amount) END DESC NULLS LAST,
         l.created_at DESC, l.id
       LIMIT $13 OFFSET $11`,
      [categories.includes(category) ? category : null, cleanText(params.get('area'), 100) || null,
        bedrooms, cleanText(params.get('q'), 100) || null, low,
        [...rentPeriods, ...salePeriods].includes(period) ? period : null, high,
        params.get('available') === '1', ownerId, priceSort, offset, ids, limit + 1],
    );
    return { listings: rows.slice(0, limit).map(row => publicListing(row)),
      total: rows.length ? Number(rows[0].listing_total) : 0,
      nextOffset: rows.length > limit ? offset + limit : null };
  }

  async function detail(id, actor) {
    const row = await getListing(id);
    const own = canManage(actor, row);
    if (!own && !isPublic(row)) throw new SiteError(404, 'Listing not found.');
    const { rows } = await database.query(
      `SELECT id FROM marketplace_listing_photos WHERE listing_id = $1 AND ($2::boolean OR position = 0)
       ORDER BY position`, [id, canReadPrivate(actor, row)],
    );
    return { ...publicListing(row, own), owner: { id: row.owner_id, name: row.owner_name },
      photos: rows.map(photo => ({ id: photo.id, url: '/api/media/' + photo.id })),
      canManage: own, hasContact: Boolean(row.contact_phone) };
  }

  async function profile(id) {
    if (!uuid.test(id || '')) throw new SiteError(404, 'Profile not found.');
    const { rows: [row] } = await database.query(
      `SELECT id, display_name, sharetribe_profile->>'bio' AS bio
       FROM accounts WHERE id = $1 AND status = 'active' AND role = 'provider'`, [id],
    );
    if (!row) throw new SiteError(404, 'Profile not found.');
    return { id, name: row.display_name, bio: row.bio, ...await search(new URLSearchParams(), id) };
  }

  async function ownListings(actor) {
    if (!actor) throw new SiteError(401, 'Sign in to manage listings.');
    const { rows } = await database.query(
      `SELECT l.*, (SELECT id FROM marketplace_listing_photos WHERE listing_id = l.id AND position = 0) AS cover_id
       FROM listings l WHERE owner_id = $1 AND NOT is_pilot_fixture ORDER BY updated_at DESC, id`, [actor.id],
    );
    return { listings: rows.map(row => publicListing(row, true)) };
  }

  async function createDraft(actor, body) {
    if (!actor) throw new SiteError(401, 'Sign in to create a listing.');
    if (!actor.canPost) throw new SiteError(403, 'This account cannot create listings.');
    if (!uuid.test(body.requestKey || '')) throw new SiteError(400, 'Start a new draft and retry.');
    const input = listingInput(body);
    const { rows: [row] } = await database.query(
      `INSERT INTO listings (id, owner_id, request_key, slug, title, description, state, price_amount, currency,
          category, area, bedrooms, price_period, prices, contact_phone, created_at)
       VALUES ($1::uuid,$2,$3,($1::uuid)::text,$4,$5,'draft',$6,$7,$8,$9,$10,$11,$12,$13,now())
       ON CONFLICT (owner_id, request_key) DO UPDATE SET request_key = EXCLUDED.request_key RETURNING id`,
      [randomUUID(), actor.id, body.requestKey, input.title, input.description, input.priceAmount, input.currency,
        input.category, input.area, input.bedrooms, input.pricePeriod, input.prices, input.phone],
    );
    return { id: row.id };
  }

  async function owned(actor, id, fn) {
    if (!actor) throw new SiteError(401, 'Sign in to manage this listing.');
    return transaction(database, async client => {
      const row = await getListing(id, client, true);
      if (!canManage(actor, row)) throw new SiteError(404, 'Listing not found.');
      return fn(client, row);
    });
  }

  async function edit(actor, id, body) {
    const input = listingInput(body);
    return owned(actor, id, async (client, row) => {
      if (row.state === 'published' && (!input.priceAmount || !input.phone)) {
        throw new SiteError(400, 'Published listings need a price and a WhatsApp number.');
      }
      await client.query(
        `UPDATE listings SET title=$2, description=$3, price_amount=$4, currency=$5, category=$6,
         area=$7, bedrooms=$8, price_period=$9, prices=$10, contact_phone=$11, updated_at=now() WHERE id=$1`,
        [id, input.title, input.description, input.priceAmount, input.currency, input.category, input.area,
          input.bedrooms, input.pricePeriod, input.prices, input.phone],
      );
      return { id };
    });
  }

  async function reserveReference(client) {
    // The BL series gives new staging listings their own namespace while source codes are reconciled.
    for (;;) {
      const { rows: [{ number }] } = await client.query("SELECT nextval('marketplace_reference_number') AS number");
      const code = 'BL-' + String(number).padStart(6, '0');
      const { rowCount } = await client.query(
        'INSERT INTO marketplace_reference_registry (code) VALUES ($1) ON CONFLICT DO NOTHING', [code],
      );
      if (rowCount === 1) return code;
    }
  }

  async function changeState(actor, id, action) {
    return owned(actor, id, async (client, row) => {
      if (action === 'availability') {
        if (row.state !== 'published') throw new SiteError(409, 'Publish this listing before confirming availability.');
        await client.query('UPDATE listings SET availability_confirmed_at = now(), updated_at = now() WHERE id = $1', [id]);
        return { state: row.state, reference: row.legacy_reference || row.reference_code };
      }
      if (action === 'close') {
        if (!['published', 'pendingApproval', 'closed'].includes(row.state)) throw new SiteError(409, 'This is still a draft.');
        await client.query("UPDATE listings SET state = 'closed', updated_at = now() WHERE id = $1", [id]);
        return { state: 'closed', reference: row.legacy_reference || row.reference_code };
      }
      if (action !== 'publish' && action !== 'approve') throw new SiteError(400, 'Unknown listing action.');
      if (!(actor.canPost || actor.staff) || (action === 'approve' && !actor.staff)) {
        throw new SiteError(403, 'This account cannot publish the listing.');
      }
      if (row.state === 'published') return { state: row.state, reference: row.legacy_reference || row.reference_code };
      if (!row.price_amount || !row.contact_phone || !row.cover_id) {
        throw new SiteError(400, 'Add a price, a WhatsApp contact number and a photo before publishing.');
      }
      const state = env.MARKETPLACE_LISTING_APPROVAL === 'true' && action !== 'approve' ? 'pendingApproval' : 'published';
      const reference = row.reference_code || (!row.legacy_reference && state === 'published' ? await reserveReference(client) : null);
      await client.query('UPDATE listings SET state = $2, reference_code = $3, updated_at = now() WHERE id = $1',
        [id, state, reference]);
      return { state, reference: row.legacy_reference || reference };
    });
  }

  async function moderation(actor) {
    if (!actor?.staff) throw new SiteError(403, 'Staff access is required.');
    const { rows } = await database.query(
      `SELECT id, title, area, state, owner_id FROM listings WHERE state = 'pendingApproval'
       AND NOT is_pilot_fixture ORDER BY updated_at DESC LIMIT 100`,
    );
    return { listings: rows };
  }

  async function contact(id, actor) {
    if (!actor) throw new SiteError(401, 'Sign in to contact the owner.');
    if (!actor.canRead) throw new SiteError(403, 'This account cannot contact the owner.');
    const row = await getListing(id);
    if (!isPublic(row) || !/^[1-9]\d{7,14}$/.test(row.contact_phone || '')) {
      throw new SiteError(404, 'WhatsApp is unavailable for this listing.');
    }
    const reference = row.legacy_reference || row.reference_code;
    const message = `Hi, I'm interested in this listing on Bali Listings${reference ? ' (' + reference + ')' : ''}: ${origin}/l/${id}. Is it available?`;
    return { url: 'https://wa.me/' + row.contact_phone + '?' + new URLSearchParams({ text: message }) };
  }

  async function addPhoto(actor, id, bytes) {
    const contentType = storage.contentType(bytes);
    const photo = randomUUID();
    const key = 'marketplace/listings/' + id + '/' + photo;
    let uploaded = false;
    try {
      return await owned(actor, id, async client => {
        const { rows: [{ count }] } = await client.query(
          'SELECT count(*)::int AS count FROM marketplace_listing_photos WHERE listing_id = $1', [id],
        );
        if (count >= maxPhotos) throw new SiteError(409, 'A listing can have up to 10 photos.');
        await storage.put(key, bytes, contentType);
        uploaded = true;
        await client.query(
          'INSERT INTO marketplace_listing_photos (id, listing_id, object_key, content_type, position) VALUES ($1,$2,$3,$4,$5)',
          [photo, id, key, contentType, count],
        );
        return { id: photo, url: '/api/media/' + photo };
      });
    } catch (error) {
      if (uploaded) {
        // A connection error after COMMIT can leave its outcome unknown. Check for the reference before deleting.
        const saved = await database.query('SELECT 1 FROM marketplace_listing_photos WHERE id = $1', [photo]).catch(() => null);
        if (saved?.rowCount === 0) await storage.remove(key).catch(() => {});
      }
      throw error;
    }
  }

  async function orderPhotos(actor, id, body) {
    const validIds = ids => Array.isArray(ids) && ids.length <= maxPhotos && new Set(ids).size === ids.length &&
      ids.every(value => typeof value === 'string' && uuid.test(value));
    if (!validIds(body.ids) || !validIds(body.previousIds)) {
      throw new SiteError(400, 'The photo order is invalid.');
    }
    const unused = await owned(actor, id, async (client, row) => {
      const { rows } = await client.query(
        'SELECT id, object_key, content_type FROM marketplace_listing_photos WHERE listing_id = $1 ORDER BY position', [id],
      );
      if (rows.length !== body.previousIds.length || rows.some((photo, index) => photo.id !== body.previousIds[index])) {
        throw new SiteError(409, 'The gallery changed. Refresh before editing the photo order.');
      }
      const byId = new Map(rows.map(photo => [photo.id, photo]));
      if (body.ids.some(photo => !byId.has(photo)) || (row.state === 'published' && body.ids.length === 0)) {
        throw new SiteError(409, 'Published listings need a cover photo. Refresh and try again.');
      }
      if (body.ids.length < rows.length && body.ids.length + 1 !== rows.length) {
        throw new SiteError(409, 'Remove photos one at a time.');
      }
      await client.query('DELETE FROM marketplace_listing_photos WHERE listing_id = $1', [id]);
      for (const [position, photoId] of body.ids.entries()) {
        const photo = byId.get(photoId);
        await client.query(
          'INSERT INTO marketplace_listing_photos (id, listing_id, object_key, content_type, position) VALUES ($1,$2,$3,$4,$5)',
          [photoId, id, photo.object_key, photo.content_type, position],
        );
        byId.delete(photoId);
      }
      return [...byId.values()];
    });
    for (const photo of unused) {
      // The original pilot cover belongs to its own snapshot as well.
      if (photo.object_key.startsWith('marketplace/listings/')) await storage.remove(photo.object_key).catch(() => {});
    }
    return { saved: true };
  }

  async function photo(photoId, actor) {
    if (!uuid.test(photoId || '')) throw new SiteError(404, 'Photo not found.');
    const { rows: [row] } = await database.query(
      `SELECT p.*, l.owner_id, l.state, a.status AS owner_status, a.role AS owner_role
       FROM marketplace_listing_photos p JOIN listings l ON l.id = p.listing_id
       JOIN accounts a ON a.id = l.owner_id WHERE p.id = $1 AND NOT l.is_pilot_fixture`, [photoId],
    );
    if (!row || (!canManage(actor, row) && (!isPublic(row) || (row.position !== 0 && !canReadPrivate(actor, row))))) {
      throw new SiteError(404, 'Photo not found.');
    }
    return storage.get(row.object_key, row.content_type);
  }

  return { search, detail, profile, ownListings, createDraft, edit, changeState, moderation, contact, addPhoto, orderPhotos, photo };
}

module.exports = { createListings, listingInput };
