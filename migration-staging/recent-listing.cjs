'use strict';

const { createHash } = require('node:crypto');
const { GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { pilotBucket, createPilotStorage } = require('./r2-pilot.cjs');

const coverPath = '/api/pilot/recent/cover';
const listingPath = '/api/pilot/recent';
const pagePath = '/pilot/recent';
const maxImageBytes = 5 * 1024 * 1024;
const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const hash = value => createHash('sha256').update(value).digest('hex');

function sourceUrl(value, host) {
  const url = new URL(value);
  if (url.origin !== `https://${host}` || url.username || url.password || url.hash) {
    throw new Error('Unrecognized pilot source');
  }
  return url;
}

function parseInput(input) {
  const { id, createdOn, title, description, yearlyRentIdr, bedrooms, area, sourceUrl: listingUrl, coverUrl } = JSON.parse(input);
  const listing = sourceUrl(listingUrl, 'balilistings.com');
  const cover = sourceUrl(coverUrl, 'sharetribe.imgix.net');
  if (!uuidPattern.test(id) || listing.pathname !== `/l/${id}` || listing.search ||
      !/^\d{4}-\d{2}-\d{2}$/.test(createdOn) ||
      [title, description, area].some(value => typeof value !== 'string' || !value.trim() || value.length > 3000) ||
      !Number.isSafeInteger(yearlyRentIdr) || yearlyRentIdr < 1 ||
      !Number.isInteger(bedrooms) || bedrooms < 1 || bedrooms > 100) {
    throw new Error('Invalid pilot listing');
  }
  return { id, createdOn, title, description, yearlyRentIdr, bedrooms, area, listingUrl: listing.href, coverUrl: cover.href };
}

async function boundedImage(stream) {
  const pieces = [];
  let size = 0;
  for await (const piece of stream) {
    size += piece.byteLength;
    if (size > maxImageBytes) throw new Error('Cover photo exceeds the pilot limit');
    pieces.push(Buffer.from(piece));
  }
  if (size === 0) throw new Error('Empty cover photo');
  return Buffer.concat(pieces);
}

function imageType(bytes) {
  if (bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return 'image/jpeg';
  if (bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) return 'image/png';
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  throw new Error('Unsupported cover photo format');
}

async function readCover(storage, key, digest, contentType) {
  const item = await storage.send(new GetObjectCommand({ Bucket: pilotBucket, Key: key }), {
    abortSignal: AbortSignal.timeout(8000),
  });
  if (item.ContentLength > maxImageBytes || item.ContentType !== contentType) {
    item.Body?.destroy?.();
    throw new Error('Unexpected stored cover photo metadata');
  }
  const bytes = await boundedImage(item.Body);
  if (hash(bytes) !== digest) throw new Error('Stored cover photo failed verification');
  return { bytes, contentType };
}

async function storeCover(storage, input) {
  const response = await fetch(input.coverUrl, {
    redirect: 'error',
    headers: { Accept: 'image/jpeg,image/png,image/webp' },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok || !response.body || Number(response.headers.get('content-length')) > maxImageBytes) {
    await response.body?.cancel();
    throw new Error('Could not download the public cover photo');
  }

  const bytes = await boundedImage(response.body);
  const contentType = imageType(bytes);
  const digest = hash(bytes);
  const key = `migration-pilot/recent/${input.id}/${digest}.${contentType.split('/')[1]}`;
  await storage.send(new PutObjectCommand({
    Bucket: pilotBucket, Key: key, Body: bytes, ContentType: contentType,
  }), { abortSignal: AbortSignal.timeout(8000) });
  return { key, digest, ...await readCover(storage, key, digest, contentType) };
}

async function importRecentListing(database, config) {
  if (!config) return undefined;
  let step = 'invalid listing configuration';
  let storage;
  try {
    const input = parseInput(config);
    const sourceHash = hash(input.coverUrl);
    step = 'R2 credentials unavailable';
    storage = createPilotStorage();
    if (!storage) throw new Error('Missing R2 configuration');

    step = 'could not read listing snapshot from PostgreSQL';
    const { rows: [previous] } = await database.query(
      'SELECT cover_source_hash, cover_key, cover_sha256, cover_content_type FROM pilot_listing_snapshots WHERE id = $1',
      [input.id]
    );
    let cover;
    if (previous?.cover_source_hash === sourceHash) {
      step = 'could not verify existing R2 cover';
      try {
        cover = {
          key: previous.cover_key,
          digest: previous.cover_sha256,
          ...await readCover(storage, previous.cover_key, previous.cover_sha256, previous.cover_content_type),
        };
      } catch (error) {
        if (error.$metadata?.httpStatusCode !== 404) throw error;
      }
    }
    if (!cover) {
      step = 'cover download, R2 upload, or readback failed';
      cover = await storeCover(storage, input);
    }

    step = 'could not save listing snapshot in PostgreSQL';
    const { rows: [listing] } = await database.query(
      `INSERT INTO pilot_listing_snapshots (
         id, created_on, title, description, yearly_rent_idr, bedrooms, area,
         source_url, cover_source_hash, cover_key, cover_content_type, cover_sha256
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (id) DO UPDATE SET
         created_on = EXCLUDED.created_on, title = EXCLUDED.title, description = EXCLUDED.description,
         yearly_rent_idr = EXCLUDED.yearly_rent_idr, bedrooms = EXCLUDED.bedrooms,
         area = EXCLUDED.area, source_url = EXCLUDED.source_url, cover_source_hash = EXCLUDED.cover_source_hash,
         cover_key = EXCLUDED.cover_key, cover_content_type = EXCLUDED.cover_content_type,
         cover_sha256 = EXCLUDED.cover_sha256
       RETURNING id, created_on::text AS created_on, title, description, yearly_rent_idr, bedrooms, area, source_url`,
      [input.id, input.createdOn, input.title, input.description, input.yearlyRentIdr, input.bedrooms, input.area,
        input.listingUrl, sourceHash, cover.key, cover.contentType, cover.digest]
    );
    return { listing, cover };
  } catch {
    throw Object.assign(new Error('Recent listing import failed'), { pilotStep: step });
  } finally {
    storage?.destroy();
  }
}

function escapeHtml(value) {
  const escapes = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(value).replace(/[&<>"']/g, character => escapes[character]);
}

function preview(listing) {
  const rent = new Intl.NumberFormat('en-US').format(Number(listing.yearly_rent_idr));
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(listing.title)} | Bali Listings staging</title>
<style>
body{margin:0;background:#f5f3ed;color:#172d28;font:16px/1.55 system-ui,sans-serif}
main{max-width:52rem;margin:auto;padding:2.5rem 1.25rem 4rem}
h1{font-size:clamp(1.8rem,5vw,3rem);line-height:1.15;margin:.35rem 0 .5rem}
img{display:block;width:100%;max-height:32rem;object-fit:cover;border-radius:.5rem;margin:1.5rem 0}
small{font-weight:650;color:#465d52} a{color:#155f53}
</style>
<main><small>Bali Listings staging</small><h1>${escapeHtml(listing.title)}</h1>
<p><strong>IDR ${rent} / year</strong> · ${escapeHtml(listing.area)} · ${escapeHtml(listing.bedrooms)} bedrooms</p>
<img src="${coverPath}" alt="Cover photo of the rental"><p>${escapeHtml(listing.description)}</p>
<a href="${escapeHtml(listing.source_url)}">View original listing</a></main></html>`;
}

function serveRecentListing(request, response, snapshot) {
  const path = request.url;
  if (![coverPath, listingPath, pagePath].includes(path)) return false;
  if (!snapshot) {
    response.writeHead(503).end('not ready\n');
    return true;
  }

  const { listing, cover } = snapshot;
  if (path === coverPath) {
    response.writeHead(200, {
      'Content-Type': cover.contentType,
      'Content-Length': cover.bytes.length,
      'X-Content-Type-Options': 'nosniff',
    }).end(cover.bytes);
  } else if (path === listingPath) {
    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
      .end(JSON.stringify({ listing, cover: coverPath }));
  } else {
    response.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
    }).end(preview(listing));
  }
  return true;
}

module.exports = { importRecentListing, serveRecentListing };
