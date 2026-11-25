'use strict';

const { createServer } = require('node:http');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required for the staging readiness service');
}

const database = new Pool({
  connectionString,
  max: 1,
  connectionTimeoutMillis: 3000,
  query_timeout: 3000,
  statement_timeout: 3000,
  idleTimeoutMillis: 10_000,
});

let databaseReady = false;
let checkingDatabase = false;

async function checkDatabase() {
  if (checkingDatabase) return;
  checkingDatabase = true;
  try {
    await database.query('SELECT 1');
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

const server = createServer((request, response) => {
  response.setHeader('Content-Type', 'text/plain; charset=utf-8');
  response.setHeader('X-Robots-Tag', 'noindex, nofollow');
  response.setHeader('Cache-Control', 'no-store');

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end();
  } else if (request.url === '/healthz') {
    response.writeHead(200);
    response.end('ok\n');
  } else if (request.url === '/readyz') {
    response.writeHead(databaseReady ? 200 : 503);
    response.end(databaseReady ? 'ready\n' : 'not ready\n');
  } else {
    response.writeHead(404);
    response.end();
  }
});

server.listen(Number(process.env.PORT) || 10000, '0.0.0.0', () => {
  void checkDatabase();
  setInterval(checkDatabase, 15_000).unref();
});
