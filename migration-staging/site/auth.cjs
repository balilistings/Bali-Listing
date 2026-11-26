'use strict';

const { randomBytes, randomUUID, scrypt, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');
const { SiteError, uuid, token, opaqueToken, digest, digest64, roleAllowed, cleanText, accountEmail,
  sameSitePath, transaction } = require('./common.cjs');

const derive = promisify(scrypt);
const sessionKey = 'bali_session';
const oauthKey = 'bali_oauth';
const dummyPassword = 's1:47ec147117fa08c01c2642e68b0f2311:' + '0'.repeat(128);
const sessionSeconds = 7 * 24 * 60 * 60;
const genericLinkMessage = 'If the address can receive this link, check your inbox.';

function passwordAllowed(password) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) {
    throw new SiteError(400, 'Use a password between 12 and 128 characters.');
  }
}

async function passwordHash(password, salt = randomBytes(16).toString('hex')) {
  const key = await derive(password, salt, 64, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 });
  return `s1:${salt}:${key.toString('hex')}`;
}

async function passwordMatches(password, saved = dummyPassword) {
  if (!/^s1:[a-f0-9]{32}:[a-f0-9]{128}$/.test(saved)) return false;
  const [, salt, expected] = saved.split(':');
  const actual = (await passwordHash(password, salt)).split(':')[2];
  return timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
}

function active(account) {
  return account?.status === 'active' && roleAllowed(account.role);
}

function viewAccount(account, staff) {
  return {
    id: account.id, name: account.display_name, email: account.email, role: account.role,
    firstName: account.profile?.firstName,
    lastName: account.profile?.lastName,
    abbreviatedName: account.profile?.abbreviatedName,
    bio: account.profile?.bio,
    locale: account.profile?.locale,
    emailVerified: account.email_verified, staff: staff.has(account.id),
    canRead: account.sharetribe_permissions?.read !== 'permission/deny',
    canPost: account.role === 'provider' && account.sharetribe_permissions?.postListings !== 'permission/deny',
  };
}

function cookie(req, key) {
  const match = (req.headers.cookie || '').split(';').map(part => part.trim())
    .find(part => part.startsWith(key + '='));
  const value = match?.slice(key.length + 1);
  return opaqueToken.test(value || '') ? value : null;
}

function createAuth(database, env, origin, fetchImpl = fetch, googleKeySet) {
  const secure = origin.startsWith('https:');
  const staff = new Set((env.MARKETPLACE_STAFF_IDS || '').split(',').map(id => id.trim()).filter(id => uuid.test(id)));
  const mailProvider = env.MARKETPLACE_EMAIL_PROVIDER || 'resend';
  const useCloudflare = mailProvider === 'cloudflare';
  const mailToken = useCloudflare ? env.MARKETPLACE_CLOUDFLARE_EMAIL_TOKEN : env.MARKETPLACE_RESEND_API_KEY;
  const cloudflareAccount = env.MARKETPLACE_CLOUDFLARE_ACCOUNT_ID;
  const mailReady = Boolean(mailToken && env.MARKETPLACE_EMAIL_FROM &&
    (mailProvider === 'resend' || (useCloudflare && /^[a-f0-9]{32}$/i.test(cloudflareAccount || ''))));
  const mailUrl = useCloudflare
    ? 'https://api.cloudflare.com/client/v4/accounts/' + cloudflareAccount + '/email/sending/send'
    : 'https://api.resend.com/emails';
  const googleReady = Boolean(env.MARKETPLACE_GOOGLE_CLIENT_ID && env.MARKETPLACE_GOOGLE_CLIENT_SECRET);
  const oauthCallback = origin + '/api/auth/google/callback';
  const attempts = new Map();
  let lastSweep = 0;
  let activeVerifications = 0;

  function rate(key, max) {
    const now = Date.now();
    if (now - lastSweep > 600_000) {
      for (const [id, entry] of attempts) if (entry.until <= now) attempts.delete(id);
      lastSweep = now;
    }
    let current = attempts.get(key);
    if (current?.until <= now) current = null;
    if (!current) {
      if (attempts.size >= 5000) throw new SiteError(429, 'Try again in a few minutes.');
      current = { count: 0, until: now + 600_000 };
      attempts.set(key, current);
    }
    if (++current.count > max) throw new SiteError(429, 'Try again in a few minutes.');
  }

  async function slowPassword(operation) {
    if (activeVerifications >= 4) throw new SiteError(429, 'Try again in a few minutes.');
    activeVerifications += 1;
    try { return await operation(); } finally { activeVerifications -= 1; }
  }

  function setCookie(res, key, value, maxAge) {
    const previous = res.getHeader('Set-Cookie') || [];
    res.setHeader('Set-Cookie', [...previous,
      `${key}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`]);
  }

  async function startSession(accountId, req, res) {
    const value = token();
    const previous = cookie(req, sessionKey);
    if (previous) await database.query('DELETE FROM account_sessions WHERE token_hash = $1', [digest(previous)]);
    await database.query(
      'INSERT INTO account_sessions (token_hash, account_id, expires_at) VALUES ($1,$2,now() + interval \'7 days\')',
      [digest(value), accountId],
    );
    setCookie(res, sessionKey, value, sessionSeconds);
  }

  async function viewer(req) {
    const value = cookie(req, sessionKey);
    if (!value) return null;
    const { rows: [account] } = await database.query(
      `SELECT a.id, a.display_name, a.email, a.email_verified, a.role, a.status, a.sharetribe_permissions,
              a.sharetribe_profile AS profile
       FROM account_sessions s JOIN accounts a ON a.id = s.account_id
       WHERE s.token_hash = $1 AND s.expires_at > now()`, [digest(value)],
    );
    return active(account) && account.email_verified ? viewAccount(account, staff) : null;
  }

  async function emailLink(action, body) {
    if (!mailReady) throw new SiteError(503, 'Email sign-in is not configured on this preview yet.');
    const email = accountEmail(body.email);
    if (!email) throw new SiteError(400, 'Enter a valid email address.');
    const name = cleanText(body.name, 100);
    if (action === 'signup' && (!name || !roleAllowed(body.role) || body.accepted !== true)) {
      throw new SiteError(400, 'Enter your name, choose an account type, and accept the terms.');
    }
    rate('email:' + digest(email), 4);
    const value = token();
    const send = await transaction(database, async client => {
      if (action === 'signup') {
        await client.query(
          `INSERT INTO accounts (id, display_name, role, status, email, created_at)
           VALUES ($1,$2,$3,'active',$4,now()) ON CONFLICT DO NOTHING`,
          [randomUUID(), name, body.role, email],
        );
      }
      const { rows: [account] } = await client.query(
        `SELECT a.*, EXISTS(SELECT 1 FROM account_passwords p WHERE p.account_id = a.id) AS has_password
         FROM accounts a WHERE lower(btrim(a.email)) = $1 FOR UPDATE OF a`, [email],
      );
      if (!active(account)) return false;
      // Imported accounts have their own recovery path. Signup never changes an existing account's role.
      if (action === 'signup' && (account.sharetribe_state || account.email_verified || account.has_password)) return false;
      const { rowCount } = await client.query(
        `INSERT INTO account_email_tokens (token_hash, account_id, email, purpose, expires_at)
         SELECT $1,$2,$3,$4,now() + interval '30 minutes' WHERE NOT EXISTS (
           SELECT 1 FROM account_email_tokens WHERE account_id = $2 AND purpose = $4
             AND expires_at > now() + interval '29 minutes'
         )`, [digest(value), account.id, email, action],
      );
      return rowCount === 1;
    });
    if (send) {
      const path = env.MARKETPLACE_RENDER_ORIGINAL_FRONTEND === 'true' ? '/reset-password#' : '/account/setup#';
      const link = origin + path + value;
      const result = await fetchImpl(mailUrl, {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(8000),
        headers: { Authorization: 'Bearer ' + mailToken, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: env.MARKETPLACE_EMAIL_FROM, to: useCloudflare ? email : [email],
          subject: action === 'signup' ? 'Set up your Bali Listings account' : 'Your Bali Listings sign-in link',
          text: 'Set your Bali Listings password using this one-time link. It expires in 30 minutes.\n\n' + link
            + '\n\nIf you did not request it, you can ignore this email.',
        }),
      }).catch(() => null);
      const sent = result?.ok && (!useCloudflare || await result.json().then(data =>
        data.success === true && [data.result?.delivered, data.result?.queued]
          .some(entries => entries?.includes(email))).catch(() => false));
      if (!sent) {
        await database.query('DELETE FROM account_email_tokens WHERE token_hash = $1', [digest(value)]);
        console.error('Marketplace transactional email could not be sent');
      }
    }
    return { message: genericLinkMessage };
  }

  async function finishPassword(body, req, res) {
    if (!opaqueToken.test(body.token || '')) throw new SiteError(400, 'Request a fresh email link.');
    passwordAllowed(body.password);
    const tokenHash = digest(body.token);
    const { rows: [candidate] } = await database.query(
      'SELECT account_id FROM account_email_tokens WHERE token_hash = $1 AND expires_at > now()', [tokenHash],
    );
    if (!candidate) throw new SiteError(400, 'This link has expired or has already been used.');
    const password = await slowPassword(() => passwordHash(body.password));
    const accountId = await transaction(database, async client => {
      const { rows: [account] } = await client.query('SELECT * FROM accounts WHERE id = $1 FOR UPDATE', [candidate.account_id]);
      const { rows: [emailToken] } = await client.query(
        `DELETE FROM account_email_tokens WHERE token_hash = $1 AND account_id = $2
         AND expires_at > now() RETURNING email, purpose`, [tokenHash, candidate.account_id],
      );
      if (!emailToken || !active(account) || accountEmail(account.email) !== emailToken.email ||
          (emailToken.purpose === 'signup' && (account.sharetribe_state || account.email_verified))) {
        throw new SiteError(400, 'This link has expired or has already been used.');
      }
      if (emailToken.purpose === 'recovery' && !account.email_verified && !account.sharetribe_state) {
        throw new SiteError(400, 'Finish email signup before recovering this account.');
      }
      await client.query(
        `INSERT INTO account_passwords (account_id, password_hash) VALUES ($1,$2)
         ON CONFLICT (account_id) DO UPDATE SET password_hash = EXCLUDED.password_hash`, [account.id, password],
      );
      await client.query('UPDATE accounts SET email_verified = true WHERE id = $1', [account.id]);
      await client.query('DELETE FROM account_email_tokens WHERE account_id = $1', [account.id]);
      await client.query('DELETE FROM account_sessions WHERE account_id = $1', [account.id]);
      return account.id;
    });
    await startSession(accountId, req, res);
    return { message: 'Password saved.' };
  }

  async function login(body, req, res) {
    const email = accountEmail(body.email);
    if (!email || typeof body.password !== 'string' || body.password.length > 128) {
      throw new SiteError(401, 'The email or password is incorrect.');
    }
    rate('login:' + digest(email), 12);
    const { rows: [account] } = await database.query(
      `SELECT a.id, a.role, a.status, a.email_verified, p.password_hash FROM accounts a
       LEFT JOIN account_passwords p ON p.account_id = a.id WHERE lower(btrim(a.email)) = $1`, [email],
    );
    const matches = await slowPassword(() => passwordMatches(body.password, account?.password_hash || undefined));
    if (!(matches && active(account) && account.email_verified && account.password_hash)) {
      throw new SiteError(401, 'The email or password is incorrect.');
    }
    await startSession(account.id, req, res);
    return { message: 'Signed in.' };
  }

  async function logout(req, res) {
    const value = cookie(req, sessionKey);
    if (value) await database.query('DELETE FROM account_sessions WHERE token_hash = $1', [digest(value)]);
    setCookie(res, sessionKey, '', 0);
    return { message: 'Signed out.' };
  }

  async function googleStart(body, res) {
    if (!googleReady) throw new SiteError(503, 'Google sign-in is not configured on this preview yet.');
    const role = body.role || null;
    if (role && (!roleAllowed(role) || body.accepted !== true)) {
      throw new SiteError(400, 'Choose an account type and accept the terms.');
    }
    const state = token();
    const browser = token();
    const verifier = token();
    const nonce = token();
    await database.query('DELETE FROM marketplace_oauth_states WHERE expires_at <= now()');
    await database.query(
      `INSERT INTO marketplace_oauth_states (state_hash, browser_hash, verifier, nonce, new_role, next_path, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,now() + interval '10 minutes')`,
      [digest(state), digest(browser), verifier, nonce, role, sameSitePath(body.next)],
    );
    setCookie(res, oauthKey, browser, 600);
    const params = new URLSearchParams({
      client_id: env.MARKETPLACE_GOOGLE_CLIENT_ID, redirect_uri: oauthCallback, response_type: 'code',
      scope: 'openid email profile', state, nonce, code_challenge: digest64(verifier), code_challenge_method: 'S256',
    });
    return 'https://accounts.google.com/o/oauth2/v2/auth?' + params.toString();
  }

  let googleKeys = googleKeySet;
  async function googleCallback(params, req, res) {
    const state = params.get('state');
    const code = params.get('code');
    const browser = cookie(req, oauthKey);
    if (!googleReady || !opaqueToken.test(state || '') || !browser || !code || code.length > 4096) {
      throw new SiteError(400, 'Google sign-in could not be completed.');
    }
    const { rows: [saved] } = await database.query(
      `DELETE FROM marketplace_oauth_states WHERE state_hash = $1 AND browser_hash = $2
       AND expires_at > now() RETURNING verifier, nonce, new_role, next_path`, [digest(state), digest(browser)],
    );
    setCookie(res, oauthKey, '', 0);
    if (!saved) throw new SiteError(400, 'Google sign-in expired. Please try again.');
    const response = await fetchImpl('https://oauth2.googleapis.com/token', {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(8000),
      body: new URLSearchParams({
        code, client_id: env.MARKETPLACE_GOOGLE_CLIENT_ID, client_secret: env.MARKETPLACE_GOOGLE_CLIENT_SECRET,
        redirect_uri: oauthCallback, grant_type: 'authorization_code', code_verifier: saved.verifier,
      }),
    });
    if (!response.ok) throw new SiteError(400, 'Google sign-in could not be completed.');
    const { id_token: idToken } = await response.json();
    const { createRemoteJWKSet, jwtVerify } = require('jose');
    googleKeys ??= createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
    let identity;
    try {
      ({ payload: identity } = await jwtVerify(idToken, googleKeys, {
        issuer: ['https://accounts.google.com', 'accounts.google.com'], audience: env.MARKETPLACE_GOOGLE_CLIENT_ID,
        algorithms: ['RS256'], requiredClaims: ['exp', 'iat', 'sub'],
      }));
    } catch {
      throw new SiteError(400, 'Google sign-in could not be verified.');
    }
    const email = accountEmail(identity.email);
    if (identity.nonce !== saved.nonce || identity.email_verified !== true || !email || typeof identity.sub !== 'string') {
      throw new SiteError(400, 'Google sign-in could not be verified.');
    }
    const accountId = await transaction(database, async client => {
      const { rows: [linked] } = await client.query(
        `SELECT a.* FROM account_identities i JOIN accounts a ON a.id = i.account_id
         WHERE i.provider = 'google' AND i.subject = $1 FOR UPDATE OF a`, [identity.sub],
      );
      if (linked) {
        if (!active(linked) || !linked.email_verified) throw new SiteError(403, 'This account needs staff review.');
        return linked.id;
      }
      if (!saved.new_role) throw new SiteError(409, 'Use signup, or recover your existing account by email.');
      const { rows: [created] } = await client.query(
        `INSERT INTO accounts (id, display_name, role, status, email, email_verified, created_at)
         VALUES ($1,$2,$3,'active',$4,true,now()) ON CONFLICT DO NOTHING RETURNING id`,
        [randomUUID(), cleanText(identity.name, 100) || email.split('@')[0], saved.new_role, email],
      );
      if (!created) throw new SiteError(409, 'Use email recovery for the existing account.');
      await client.query('INSERT INTO account_identities (provider, subject, account_id) VALUES ($1,$2,$3)',
        ['google', identity.sub, created.id]);
      return created.id;
    });
    await startSession(accountId, req, res);
    return saved.next_path;
  }

  return { viewer, emailLink, finishPassword, login, logout, googleStart, googleCallback, mailReady, googleReady, rate };
}

module.exports = { createAuth, passwordHash, passwordMatches };
