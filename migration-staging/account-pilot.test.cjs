'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { runAccountPilot } = require('./account-pilot.cjs');

const listingId = '6b0196bd-4c60-4a6f-9c5d-f1a98464f168';
const customerId = '3d231acf-3428-4aae-bad2-8d8971f632d8';
const providerId = '0a027e64-50cb-4eb8-8d5a-3919c52c6b04';
const permissionId = '1bbcd22c-7e5f-416d-ade0-d4871a8508b8';
const env = {
  ACCOUNT_PILOT_ENABLED: 'true',
  RENDER_SERVICE_NAME: 'balilistings-migration-staging',
  ACCOUNT_PILOT_LISTING_ID: listingId,
  ACCOUNT_PILOT_CUSTOMER_ID: customerId,
  SHARETRIBE_INTEGRATION_CLIENT_ID: 'mock-client',
  SHARETRIBE_INTEGRATION_CLIENT_SECRET: 'mock-secret',
};

function fixtures({ listed = true, customerRole = 'customer', omitPermissions = false, failInsert = false } = {}) {
  const queries = [];
  const apiCalls = [];
  const database = {
    async connect() {
      return {
        async query(sql, values) {
          queries.push({ sql, values });
          if (failInsert && sql.includes('INSERT INTO account_identities')) throw new Error('Conflict');
          return { rowCount: 1 };
        },
        release() { queries.push({ sql: 'release' }); },
      };
    },
  };
  const fetch = async (url, options) => {
    const target = new URL(url);
    apiCalls.push(target.pathname);
    if (target.pathname.endsWith('/auth/token')) {
      assert.equal(options.body.get('scope'), 'integ');
      return Response.json({ access_token: 'mock-token', scope: 'integ' });
    }
    assert.equal(options.headers.Authorization, 'Bearer mock-token');
    const id = target.searchParams.get('id');
    if (target.pathname.endsWith('/listings/show')) {
      assert.equal(id, listingId);
      return Response.json({
        data: { id, type: 'listing', attributes: { state: listed ? 'published' : 'closed' },
          relationships: { author: { data: { id: providerId } } } },
      });
    }
    assert.ok(target.pathname.endsWith('/users/show'));
    assert.equal(target.searchParams.get('include'), 'effectivePermissionSet');
    const isProvider = id === providerId;
    assert.ok(isProvider || id === customerId);
    const permissions = {
      postListings: 'permission/deny', initiateTransactions: 'permission/allow', read: 'permission/allow',
    };
    return Response.json({
      data: {
        id, type: 'user',
        attributes: {
          state: isProvider ? 'pendingApproval' : 'active',
          createdAt: '2026-10-12T08:00:00Z',
          email: isProvider ? 'provider@example.test' : 'customer@example.test',
          emailVerified: isProvider,
          profile: {
            displayName: 'Synthetic test account',
            publicData: { userType: isProvider ? 'provider' : customerRole },
          },
          identityProviders: isProvider ? [{ idpId: 'google', userId: 'synthetic-google-subject' }] : [],
        },
        relationships: { effectivePermissionSet: { data: { id: permissionId, type: 'permissionSet' } } },
      },
      included: omitPermissions ? [] : [{ id: permissionId, type: 'permissionSet', attributes: permissions }],
    });
  };
  return { database, fetch, queries, apiCalls };
}

test('imports one of each role and keeps source identities, restrictions and listing ownership', async () => {
  const { database, fetch, queries } = fixtures();
  const report = await runAccountPilot(database, env, fetch);
  assert.deepEqual(report, { customers: 1, providers: 1, linkedListings: 1 });
  const users = queries.filter(q => q.sql.includes('INSERT INTO accounts')).map(q => q.values);
  assert.deepEqual(users.map(q => [q[0], q[2], q[3], q[5]]), [
    [customerId, 'customer', 'active', false],
    [providerId, 'provider', 'restricted', true],
  ]);
  assert.equal(users[1][8].postListings, 'permission/deny');
  assert.deepEqual(queries.find(q => q.sql.includes('INSERT INTO account_identities')).values,
    ['synthetic-google-subject', providerId]);
  assert.deepEqual(queries.find(q => q.sql.includes('UPDATE pilot_listing_snapshots')).values,
    [listingId, providerId]);
  assert.equal(queries.at(-2).sql, 'COMMIT');
});

test('checks scope, listing state, account role and effective permissions before database writes', async () => {
  for (const [setting, error] of [
    [{ listed: false }, /listing or its author/],
    [{ customerRole: 'provider' }, /different role/],
    [{ omitPermissions: true }, /permissions are unavailable/],
  ]) {
    const { database, fetch, queries } = fixtures(setting);
    await assert.rejects(runAccountPilot(database, env, fetch), error);
    assert.equal(queries.length, 0);
  }

  const { database, fetch, apiCalls } = fixtures();
  await assert.rejects(runAccountPilot(database, { ...env, RENDER_SERVICE_NAME: 'production' }, fetch),
    /requires the Bali Listings staging service/);
  assert.equal(await runAccountPilot(database, { ...env, ACCOUNT_PILOT_ENABLED: 'false' }, fetch), undefined);
  assert.equal(apiCalls.length, 0);
});

test('rolls back both accounts and their links when an identity conflicts', async () => {
  const { database, fetch, queries } = fixtures({ failInsert: true });
  await assert.rejects(runAccountPilot(database, env, fetch), /Conflict/);
  assert.equal(queries.at(-2).sql, 'ROLLBACK');
  assert.equal(queries.at(-1).sql, 'release');
  assert.ok(!queries.some(q => q.sql === 'COMMIT'));
});

test('preflight verifies the listing and provider without a customer or database writes', async () => {
  const { database, fetch, queries, apiCalls } = fixtures();
  const preflightEnv = { ...env, ACCOUNT_PILOT_ENABLED: 'preflight', ACCOUNT_PILOT_CUSTOMER_ID: '' };
  assert.deepEqual(await runAccountPilot(database, preflightEnv, fetch), { providerVerified: true });
  assert.deepEqual(apiCalls, [
    '/v1/auth/token', '/v1/integration_api/listings/show', '/v1/integration_api/users/show',
  ]);
  assert.deepEqual(queries, []);
});
