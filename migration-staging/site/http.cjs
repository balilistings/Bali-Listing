'use strict';

const { readFile } = require('node:fs/promises');
const { randomUUID } = require('node:crypto');
const { join } = require('node:path');
const { createAuth } = require('./auth.cjs');
const { createListings } = require('./listings.cjs');
const { photoStorage, maxPhotoBytes } = require('./media.cjs');
const { SiteError, readJson, readBody, json, redirect, cleanText, uuid } = require('./common.cjs');

const pages = new Set(['/', '/s', '/login', '/signup', '/account/setup', '/account/recovery',
  '/listings', '/profile-settings', '/moderation']);
const sitePath = /^\/(?:l\/(?:new|[a-f0-9-]{36}(?:\/edit)?|[^/]+\/[a-f0-9-]{36})|u\/[a-f0-9-]{36}|signup\/(?:customer|provider))$/i;
const marketplacePaths = /^\/api\/(?:marketplace|auth|media)(?:\/|$)/;

function createMarketplace(database, env, { storage = photoStorage(), fetchImpl = fetch, googleKeySet } = {}) {
  const configured = env.MARKETPLACE_ORIGIN || env.RENDER_EXTERNAL_URL;
  if (!configured) return async () => false;
  const { origin, protocol, hostname } = new URL(configured);
  if (protocol !== 'https:' && !(protocol === 'http:' && ['localhost', '127.0.0.1'].includes(hostname))) {
    throw new Error('Marketplace requires an HTTPS origin');
  }
  const auth = createAuth(database, env, origin, fetchImpl, googleKeySet);
  const listings = createListings(database, storage, origin, env);
  const assets = {
    '/marketplace.css': ['text/css; charset=utf-8', 'marketplace.css'],
    '/marketplace.js': ['text/javascript; charset=utf-8', 'marketplace.js'],
    '/marketplace-icon.svg': ['image/svg+xml', '../../../src/assets/balilistings-logo-icon.svg'],
  };
  const files = new Map();
  async function localFile(name) {
    if (!files.has(name)) files.set(name, await readFile(join(__dirname, 'public', name)));
    return files.get(name);
  }

  async function accountRoute(req, res, url, parts) {
    const path = parts.join('/');
    if (req.method === 'GET') {
      if (path === 'session') return json(res, 200, { account: await auth.viewer(req),
        emailEnabled: auth.mailReady, googleEnabled: auth.googleReady });
      if (path === 'google/callback') {
        try {
          return redirect(res, await auth.googleCallback(url.searchParams, req, res));
        } catch (error) {
          if (!(error instanceof SiteError)) console.error('Marketplace Google exchange failed');
          const message = error instanceof SiteError ? error.message : 'Google sign-in could not be completed.';
          return redirect(res, '/login?' + new URLSearchParams({ error: message }));
        }
      }
    }
    if (req.method !== 'POST') throw new SiteError(404, 'This page was not found.');
    auth.rate('network:' + req.socket.remoteAddress, 160);
    if (path === 'logout') return json(res, 200, await auth.logout(req, res));
    const body = await readJson(req);
    if (path === 'signup' || path === 'recovery') return json(res, 200, await auth.emailLink(path, body));
    if (path === 'password') return json(res, 200, await auth.finishPassword(body, req, res));
    if (path === 'change-password') return json(res, 200, await auth.changePassword(body, req, res));
    if (path === 'change-email') return json(res, 200, await auth.changeEmail(body, req));
    if (path === 'resend-email-change') return json(res, 200, await auth.changeEmail(body, req, true));
    if (path === 'confirm-email-change') return json(res, 200, await auth.confirmEmail(body, req));
    if (path === 'login') return json(res, 200, await auth.login(body, req, res));
    if (path === 'google') return json(res, 200, { url: await auth.googleStart(body, res) });
    throw new SiteError(404, 'This page was not found.');
  }

  async function profilePhoto(id, actor) {
    if (!uuid.test(id || '')) throw new SiteError(404, 'Photo not found.');
    const { rows: [photo] } = await database.query(
      `SELECT p.object_key, p.content_type FROM marketplace_profile_photos p JOIN accounts a ON a.id=p.account_id
       WHERE p.id=$1 AND a.status='active' AND (a.id=$2 OR (a.role='provider' AND a.profile_photo_id=p.id))`,
      [id, actor?.id || null],
    );
    if (!photo) throw new SiteError(404, 'Photo not found.');
    return storage.get(photo.object_key, photo.content_type);
  }

  async function marketplaceRoute(req, res, url, parts) {
    const [resource, id, action, extra] = parts;
    if (extra) throw new SiteError(404, 'This page was not found.');
    if (req.method === 'GET' && resource === 'listings' && !id) {
      return json(res, 200, await listings.search(url.searchParams, url.searchParams.get('owner')));
    }
    if (req.method === 'GET' && resource === 'profiles' && id && !action) return json(res, 200, await listings.profile(id));
    const actor = await auth.viewer(req);
    if (req.method === 'GET' && resource === 'mine' && !id) return json(res, 200, await listings.ownListings(actor));
    if (req.method === 'GET' && resource === 'moderation' && !id) return json(res, 200, await listings.moderation(actor));
    if (req.method === 'POST' && resource === 'profile' && id === 'photo' && !action) {
      if (!actor) throw new SiteError(401, 'Sign in to upload a profile photo.');
      auth.rate('profile-photo:' + actor.id, 8);
      const bytes = await readBody(req, maxPhotoBytes);
      const type = storage.contentType(bytes);
      const photoId = randomUUID();
      const objectKey = 'marketplace/profiles/' + actor.id + '/' + photoId;
      await storage.put(objectKey, bytes, type);
      await database.query(
        'INSERT INTO marketplace_profile_photos (id, account_id, object_key, content_type) VALUES ($1,$2,$3,$4)',
        [photoId, actor.id, objectKey, type],
      );
      return json(res, 201, { id: photoId, url: '/api/media/profile/' + photoId });
    }
    if (req.method === 'PATCH' && resource === 'profile' && !id) {
      if (!actor) throw new SiteError(401, 'Sign in to edit your profile.');
      const body = await readJson(req);
      const name = cleanText(body.name, 100);
      if (!name) throw new SiteError(400, 'Enter a display name.');
      const profile = {};
      if (typeof body.bio === 'string') profile.bio = cleanText(body.bio, 2000);
      if (typeof body.firstName === 'string') profile.firstName = cleanText(body.firstName, 100);
      if (typeof body.lastName === 'string') profile.lastName = cleanText(body.lastName, 100);
      if (['en', 'id', 'ru'].includes(body.locale)) profile.locale = body.locale;
      if (typeof body.phoneNumber === 'string') {
        const phoneNumber = cleanText(body.phoneNumber, 40);
        if (phoneNumber && !/^\+?[\d\s().-]{7,24}$/.test(phoneNumber)) {
          throw new SiteError(400, 'Enter a valid phone number.');
        }
        profile.phoneNumber = phoneNumber;
      }
      const changePhoto = Object.hasOwn(body, 'profilePhotoId');
      if (changePhoto && body.profilePhotoId !== null && !uuid.test(body.profilePhotoId || '')) {
        throw new SiteError(400, 'Choose a valid profile photo.');
      }
      const { rowCount } = await database.query(
        `UPDATE accounts SET display_name = $2, sharetribe_profile = coalesce(sharetribe_profile,'{}'::jsonb) || $3::jsonb,
         profile_photo_id=CASE WHEN $4 THEN $5 ELSE profile_photo_id END
         WHERE id=$1 AND status='active' AND
         (NOT $4 OR $5::uuid IS NULL OR EXISTS (SELECT 1 FROM marketplace_profile_photos WHERE id=$5 AND account_id=$1))`,
        [actor.id, name, profile, changePhoto, body.profilePhotoId ?? null],
      );
      if (!rowCount) throw new SiteError(403, 'This photo does not belong to your profile.');
      return json(res, 200, { saved: true });
    }
    if (resource !== 'listings') throw new SiteError(404, 'This page was not found.');
    if (req.method === 'GET' && action === 'contact') return json(res, 200, await listings.contact(id, actor));
    if (req.method === 'GET' && id && !action) return json(res, 200, await listings.detail(id, actor));
    if (req.method === 'POST' && !id) return json(res, 201, await listings.createDraft(actor, await readJson(req)));
    if (req.method === 'PATCH' && !action) return json(res, 200, await listings.edit(actor, id, await readJson(req)));
    if (req.method === 'POST' && action === 'photos') {
      if (!actor) throw new SiteError(401, 'Sign in to upload photos.');
      return json(res, 201, await listings.addPhoto(actor, id, await readBody(req, maxPhotoBytes)));
    }
    if (req.method === 'PUT' && action === 'photos') return json(res, 200, await listings.orderPhotos(actor, id, await readJson(req)));
    if (req.method === 'POST' && action) return json(res, 200, await listings.changeState(actor, id, action));
    throw new SiteError(404, 'This page was not found.');
  }

  return async (req, res) => {
    const url = new URL(req.url, origin);
    const path = url.pathname;
    const api = marketplacePaths.test(path);
    if (!(api || Object.hasOwn(assets, path) || pages.has(path) || sitePath.test(path))) return false;
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy',
      "default-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data:");
    try {
      if (api) {
        if (!['GET', 'HEAD'].includes(req.method) && req.headers.origin !== origin) {
          throw new SiteError(403, 'This request must come from Bali Listings.');
        }
        const [, , area, ...parts] = path.split('/');
        if (area === 'auth') await accountRoute(req, res, url, parts);
        else if (area === 'marketplace') await marketplaceRoute(req, res, url, parts);
        else if (['GET', 'HEAD'].includes(req.method) &&
            (parts.length === 1 || (parts[0] === 'profile' && parts.length === 2))) {
          const actor = await auth.viewer(req);
          const image = parts.length === 2 ? await profilePhoto(parts[1], actor) : await listings.photo(parts[0], actor);
          res.writeHead(200, { 'Content-Type': image.contentType, 'Content-Length': image.bytes.length,
            'Cache-Control': 'private, no-store' }).end(req.method === 'HEAD' ? undefined : image.bytes);
        } else throw new SiteError(404, 'Photo not found.');
      } else {
        if (!['GET', 'HEAD'].includes(req.method)) throw new SiteError(405, 'This page does not accept that request.');
        const [type, file] = assets[path] || ['text/html; charset=utf-8', 'index.html'];
        res.writeHead(200, { 'Content-Type': type }).end(req.method === 'HEAD' ? undefined : await localFile(file));
      }
    } catch (error) {
      if (!(error instanceof SiteError)) console.error('Marketplace request failed', error.code || error.name);
      if (!res.headersSent) json(res, error instanceof SiteError ? error.status : 503,
        { error: error instanceof SiteError ? error.message : 'Bali Listings is temporarily unavailable.' });
      else res.end();
    }
    return true;
  };
}

module.exports = { createMarketplace };
