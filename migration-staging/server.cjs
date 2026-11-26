'use strict';

const { readFile } = require('node:fs/promises');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Pool } = require('pg');
const { loadPilotImage } = require('./r2-pilot.cjs');
const { importRecentListing, serveRecentListing } = require('./recent-listing.cjs');
const { runAccountPilot, AccountPilotError } = require('./account-pilot.cjs');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required for the staging service');
}

const database = new Pool({
  connectionString,
  max: 2,
  connectionTimeoutMillis: 3000,
  query_timeout: 3000,
  statement_timeout: 3000,
  idleTimeoutMillis: 10_000,
});

const fixtureId = '53ebcfc5-dc23-466b-b6c7-ce37a57f9fe2';

let databaseReady = false;
let checkingDatabase = false;
let pilotImage;
let recentListing;

async function checkDatabase() {
  if (checkingDatabase) return;
  checkingDatabase = true;
  try {
    await database.query('SELECT 1 FROM listings LIMIT 1');
    databaseReady = true;
  } catch {
    databaseReady = false;
  } finally {
    checkingDatabase = false;
  }
}

database.on('error', () => {
  databaseReady = false;
});

async function pilotListing(response) {
  const { rows } = await database.query(
    `SELECT l.id, l.slug, l.title, l.description, l.price_amount, l.currency
     FROM listings AS l
     JOIN accounts AS a ON a.id = l.owner_id
     WHERE l.id = $1 AND l.is_pilot_fixture AND l.state = 'published'
       AND a.status = 'active'`,
    [fixtureId]
  );

  if (!rows.length) {
    response.writeHead(404).end();
    return;
  }

  response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify({ fixture: true, listing: rows[0] }));
}

const server = createServer(async (request, response) => {
  response.setHeader('Content-Type', 'text/plain; charset=utf-8');
  response.setHeader('X-Robots-Tag', 'noindex, nofollow');
  response.setHeader('Cache-Control', 'no-store');

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
  } else if (request.url === '/healthz') {
    response.writeHead(200).end('ok\n');
  } else if (request.url === '/readyz') {
    response.writeHead(databaseReady ? 200 : 503).end(databaseReady ? 'ready\n' : 'not ready\n');
  } else if (request.url === '/api/pilot/image') {
    if (!pilotImage) {
      response.writeHead(503).end('not ready\n');
      return;
    }
    response.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': pilotImage.length,
      'X-Content-Type-Options': 'nosniff',
    }).end(pilotImage);
  } else if (serveRecentListing(request, response, recentListing)) {
    return;
  } else if (request.url === '/api/pilot/listing') {
    try {
      await pilotListing(response);
    } catch {
      response.writeHead(503).end('not ready\n');
    }
  } else {
    response.writeHead(404).end();
  }
});

async function start() {
  await database.query(await readFile(join(__dirname, 'schema.sql'), 'utf8'));
  await checkDatabase();
  server.listen(Number(process.env.PORT) || 10000, '0.0.0.0');
  setInterval(checkDatabase, 15_000).unref();
  void loadPilotImage().then(image => {
    pilotImage = image;
  }).catch(() => {
    console.error('R2 staging image check failed');
  });
  void importRecentListing(database, process.env.PILOT_LISTING_JSON).then(snapshot => {
    recentListing = snapshot;
    if (snapshot) {
      void runAccountPilot(database, process.env).then(report => {
        if (!report) return;
        console.info(report.providerVerified
          ? 'Account pilot preflight verified Sharetribe access, the published listing and its provider'
          : `Account pilot imported customers=${report.customers} providers=${report.providers} linkedListings=${report.linkedListings}`);
      }).catch(error => {
        const reason = error instanceof AccountPilotError ? error.message : 'upstream or database error';
        console.error('Account pilot failed:', reason);
      });
    }
  }).catch(error => {
    console.error('Recent listing pilot failed:', error.pilotStep || 'unexpected error');
  });
}

start().catch(async () => {
  console.error('Staging database setup failed');
  await database.end();
  process.exitCode = 1;
});
