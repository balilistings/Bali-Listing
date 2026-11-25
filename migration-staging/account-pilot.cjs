'use strict';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const permissionNames = ['postListings', 'initiateTransactions', 'read'];

async function requestJson(fetchImpl, url, options, label) {
  const response = await fetchImpl(url, {
    ...options, redirect: 'error', signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`${label} returned HTTP ${response.status}`);
  return response.json();
}

function normalizeUser(document, id, role) {
  const user = document.data;
  const attributes = user?.attributes;
  if (user?.id !== id || user.type !== 'user' || !attributes) {
    throw new Error('Sharetribe returned the wrong account');
  }
  if (attributes.deleted || attributes.profile?.publicData?.userType !== role) {
    throw new Error('Sharetribe account is deleted or has a different role');
  }
  if (!['active', 'banned', 'pendingApproval'].includes(attributes.state) ||
      !attributes.createdAt || !Number.isFinite(Date.parse(attributes.createdAt)) ||
      typeof attributes.profile.displayName !== 'string' ||
      typeof attributes.email !== 'string' || !attributes.email ||
      typeof attributes.emailVerified !== 'boolean') {
    throw new Error('Sharetribe account metadata is incomplete');
  }

  const permissionRef = user.relationships?.effectivePermissionSet?.data;
  const permissions = document.included?.find(
    entry => entry.id === permissionRef?.id && entry.type === permissionRef?.type
  )?.attributes;
  if (!permissions || permissionNames.some(
    name => !['permission/allow', 'permission/deny'].includes(permissions[name])
  )) {
    throw new Error('Sharetribe effective account permissions are unavailable');
  }

  const googleSubjects = (attributes.identityProviders ?? [])
    .filter(identity => identity.idpId === 'google')
    .map(identity => identity.userId);
  if (googleSubjects.some(subject => typeof subject !== 'string' || !subject.trim())) {
    throw new Error('Sharetribe returned an invalid Google identity');
  }

  return {
    id,
    role,
    state: attributes.state,
    status: attributes.banned || attributes.state !== 'active' ? 'restricted' : 'active',
    name: attributes.profile.displayName,
    email: attributes.email,
    emailVerified: attributes.emailVerified,
    createdAt: attributes.createdAt,
    permissions: Object.fromEntries(permissionNames.map(name => [name, permissions[name]])),
    googleSubjects: [...new Set(googleSubjects)],
  };
}

async function savePilot(database, listingId, customer, provider) {
  const client = await database.connect();
  try {
    await client.query('BEGIN');
    for (const account of [customer, provider]) {
      const { rowCount } = await client.query(
        `INSERT INTO accounts (
          id, display_name, role, status, email, email_verified, created_at,
          sharetribe_state, sharetribe_permissions
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (id) DO UPDATE SET
          display_name = EXCLUDED.display_name, role = EXCLUDED.role,
          status = EXCLUDED.status, email = EXCLUDED.email,
          email_verified = EXCLUDED.email_verified, created_at = EXCLUDED.created_at,
          sharetribe_state = EXCLUDED.sharetribe_state, sharetribe_permissions = EXCLUDED.sharetribe_permissions
        WHERE accounts.sharetribe_state IS NOT NULL AND accounts.role = EXCLUDED.role`,
        [account.id, account.name, account.role, account.status, account.email,
          account.emailVerified, account.createdAt, account.state, account.permissions]
      );
      if (rowCount !== 1) throw new Error('Imported account conflicts with an existing staging account');

      await client.query("DELETE FROM account_identities WHERE account_id = $1 AND provider = 'google'", [account.id]);
      for (const subject of account.googleSubjects) {
        await client.query(
          "INSERT INTO account_identities (provider, subject, account_id) VALUES ('google', $1, $2)",
          [subject, account.id]
        );
      }
    }

    const { rowCount } = await client.query(
      `UPDATE pilot_listing_snapshots SET owner_id = $2
       WHERE id = $1 AND (owner_id IS NULL OR owner_id = $2)`,
      [listingId, provider.id]
    );
    if (rowCount !== 1) throw new Error('Pilot listing snapshot is missing or has a different owner');
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function runAccountPilot(database, env, fetchImpl = fetch) {
  if (env.ACCOUNT_PILOT_ENABLED !== 'true') return undefined;
  if (env.RENDER_SERVICE_NAME !== 'balilistings-migration-staging') {
    throw new Error('Account pilot requires the Bali Listings staging service');
  }
  const { ACCOUNT_PILOT_LISTING_ID: listingId, ACCOUNT_PILOT_CUSTOMER_ID: customerId,
    SHARETRIBE_INTEGRATION_CLIENT_ID: clientId, SHARETRIBE_INTEGRATION_CLIENT_SECRET: clientSecret } = env;
  if (!uuid.test(listingId ?? '') || !uuid.test(customerId ?? '') || !clientId || !clientSecret) {
    throw new Error('Account pilot configuration is incomplete');
  }

  const auth = await requestJson(fetchImpl, 'https://flex-api.sharetribe.com/v1/auth/token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials', scope: 'integ', client_id: clientId, client_secret: clientSecret,
    }),
  }, 'Sharetribe authentication');
  if (typeof auth.access_token !== 'string' || !auth.scope?.split(' ').includes('integ')) {
    throw new Error('Sharetribe did not return an integration token');
  }

  const show = (resource, id, include) => requestJson(
    fetchImpl, `https://flex-integ-api.sharetribe.com/v1/integration_api/${resource}/show?` +
      new URLSearchParams({ id, include }),
    { headers: { Accept: 'application/json', Authorization: `Bearer ${auth.access_token}` } },
    `Sharetribe ${resource} lookup`
  );
  const { data: listing } = await show('listings', listingId, 'author');
  const providerId = listing?.relationships?.author?.data?.id;
  if (listing?.id !== listingId || listing.type !== 'listing' ||
      listing.attributes?.state !== 'published' || listing.attributes?.deleted ||
      !uuid.test(providerId ?? '') || providerId.toLowerCase() === customerId.toLowerCase()) {
    throw new Error('Sharetribe pilot listing or its author could not be verified');
  }

  const customer = normalizeUser(await show('users', customerId, 'effectivePermissionSet'), customerId, 'customer');
  const provider = normalizeUser(await show('users', providerId, 'effectivePermissionSet'), providerId, 'provider');
  await savePilot(database, listingId, customer, provider);
  return { customers: 1, providers: 1, linkedListings: 1 };
}

module.exports = { runAccountPilot };
