'use strict';

const { createHash, randomBytes } = require('node:crypto');

class SiteError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const opaqueToken = /^[A-Za-z0-9_-]{43}$/;
const token = () => randomBytes(32).toString('base64url');
const digest = value => createHash('sha256').update(value).digest('hex');
const digest64 = value => createHash('sha256').update(value).digest('base64url');
const roleAllowed = value => value === 'customer' || value === 'provider';

function cleanText(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function accountEmail(value) {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return email.length <= 254 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) ? email : null;
}

function sameSitePath(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\r\n]/.test(value)) return '/';
  const parsed = new URL(value, 'https://sandbox.invalid');
  if (parsed.origin !== 'https://sandbox.invalid' || !/^(?:\/$|\/s$|\/l\/|\/u\/|\/listings$|\/profile-settings$)/.test(parsed.pathname)) return '/';
  return parsed.pathname + parsed.search;
}

async function transaction(database, fn) {
  const client = await database.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

async function readBody(req, limit) {
  if (Number(req.headers['content-length']) > limit) {
    req.resume();
    throw new SiteError(413, 'The upload is too large.');
  }
  let size = 0;
  const pieces = [];
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > limit) {
      req.resume();
      throw new SiteError(413, 'The upload is too large.');
    }
    pieces.push(chunk);
  }
  return Buffer.concat(pieces);
}

async function readJson(req) {
  if (req.headers['content-type']?.split(';')[0].trim() !== 'application/json') {
    throw new SiteError(415, 'Send this request as JSON.');
  }
  const raw = await readBody(req, 32 * 1024);
  try {
    const body = JSON.parse(raw.toString('utf8'));
    if (body && typeof body === 'object' && !Array.isArray(body)) return body;
  } catch {}
  throw new SiteError(400, 'The request data is invalid.');
}

function json(res, status, value) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }).end(JSON.stringify(value));
}

function redirect(res, path) {
  res.writeHead(303, { Location: path }).end();
}

module.exports = { SiteError, uuid, opaqueToken, token, digest, digest64, roleAllowed, cleanText,
  accountEmail, sameSitePath, transaction, readBody, readJson, json, redirect };
