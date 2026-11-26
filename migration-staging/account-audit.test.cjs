'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { runAccountAudit } = require('./account-audit.cjs');
const { runAccountImport } = require('./account-import.cjs');

const env = {
  ACCOUNT_AUDIT_ENABLED: 'true',
  RENDER_SERVICE_NAME: 'balilistings-migration-staging',
  SHARETRIBE_INTEGRATION_CLIENT_ID: 'mock-client',
  SHARETRIBE_INTEGRATION_CLIENT_SECRET: 'mock-secret',
};
const permissionId = 'e91dcd46-58db-4d37-96a5-effdc9778011';
const included = [{
  type: 'permissionSet',
  id: permissionId,
  attributes: { postListings: 'permission/deny', initiateTransactions: 'permission/allow', read: 'permission/allow' },
}];

function user(number, attributes = {}) {
  return {
    id: `1813de7e-2f8e-4ac3-a5fd-${String(number).padStart(12, '0')}`,
    type: 'user',
    attributes: {
      state: 'active', createdAt: '2026-01-01T00:00:00Z',
      email: `example${number}@example.test`, emailVerified: true,
      identityProviders: [],
      profile: { displayName: 'Test', publicData: { userType: 'customer' } },
      ...attributes,
    },
    relationships: { effectivePermissionSet: { data: { type: 'permissionSet', id: permissionId } } },
  };
}

function mockedSource(users, { changeTotal = false } = {}) {
  const requests = [];
  return {
    requests,
    fetch: async (url, options) => {
      const target = new URL(url);
      if (target.pathname.endsWith('/auth/token')) {
        return Response.json({ access_token: 'mock-token', scope: 'integ' });
      }
      assert.equal(target.pathname, '/v1/integration_api/users/query');
      assert.equal(options.method, undefined);
      const page = Number(target.searchParams.get('page'));
      const perPage = Number(target.searchParams.get('perPage'));
      assert.equal(target.searchParams.get('include'), 'effectivePermissionSet');
      requests.push(target.searchParams.get('createdAtEnd'));
      return Response.json({
        data: users.slice((page - 1) * perPage, page * perPage),
        included,
        meta: { page, perPage, totalItems: users.length + (changeTotal && page > 1 ? 1 : 0),
          totalPages: Math.ceil(users.length / perPage) },
      });
    },
  };
}

test('audits all pages and reports collisions, missing roles and linked sign-in methods without personal data', async () => {
  const google = { idpId: 'google', userId: 'fake-subject-1' };
  const facebook = { idpId: 'facebook', userId: 'fake-subject-2' };
  const users = [
    user(1, { identityProviders: [google] }),
    user(2, { identityProviders: [google], email: ' EXAMPLE1@EXAMPLE.TEST ',
      profile: { displayName: 'Test provider', publicData: { userType: 'provider' } } }),
    user(3, { state: 'banned', identityProviders: [facebook], profile: { displayName: 'Old profile' } }),
    user(4, { deleted: true, profile: null, email: null }),
    ...Array.from({ length: 97 }, (_, index) => user(index + 5)),
  ];
  delete users[4].relationships;
  const { fetch, requests } = mockedSource(users);
  const report = await runAccountAudit(env, fetch);
  assert.equal(requests.length, 2);
  assert.equal(requests[0], requests[1]);
  assert.deepEqual([report.total, report.customers, report.providers, report.unknownRole], [101, 98, 1, 1]);
  assert.deepEqual([report.googleLinked, report.facebookWithoutGoogle, report.banned, report.deleted], [2, 1, 1, 1]);
  assert.deepEqual([report.duplicateEmails, report.duplicateIdentities, report.missingPermissions], [1, 1, 1]);
  assert.ok(Object.values(report).every(value => typeof value === 'number'));
});

test('rejects changing pagination and duplicate IDs instead of reporting a partial inventory', async () => {
  const users = Array.from({ length: 101 }, (_, index) => user(index + 1));
  await assert.rejects(runAccountAudit(env, mockedSource(users, { changeTotal: true }).fetch), /pagination/);
  users[100] = users[0];
  await assert.rejects(runAccountAudit(env, mockedSource(users).fetch), /repeated accounts/);
});

test('does not read Sharetribe when disabled or used outside staging', async () => {
  const fetch = () => assert.fail('The source must not be queried');
  assert.equal(await runAccountAudit({ ...env, ACCOUNT_AUDIT_ENABLED: 'false' }, fetch), undefined);
  await assert.rejects(runAccountAudit({ ...env, RENDER_SERVICE_NAME: 'production' }, fetch), /staging service/);
});

const importEnv = { ...env, ACCOUNT_AUDIT_ENABLED: 'false', ACCOUNT_BULK_IMPORT_ENABLED: 'true' };

function importDatabase({ identityCollision = false } = {}) {
  const calls = [];
  let incoming;
  return {
    calls,
    async connect() {
      return {
        release() { calls.push(['release']); },
        async query(sql, params) {
          calls.push([sql, params]);
          if (sql.includes('NOT (id = ANY')) return { rows: [{ count: 0 }] };
          if (sql.includes('INSERT INTO accounts')) {
            incoming = JSON.parse(params[0]);
            return { rowCount: incoming.length };
          }
          if (sql.includes('INSERT INTO account_identities')) {
            if (identityCollision) throw new Error('Synthetic duplicate identity');
            return { rowCount: JSON.parse(params[0]).length };
          }
          if (sql.includes('AS "roleReview"')) {
            return { rows: [{ total: incoming.length, roleReview: incoming.filter(a => a.role === null).length,
              restricted: incoming.filter(a => a.status === 'restricted').length }] };
          }
          return {};
        },
      };
    },
  };
}

test('commits source UUIDs, permissions and identity links while keeping unknown roles and bans restricted', async () => {
  const google = { idpId: 'google', userId: 'test-google' };
  const facebook = { idpId: 'facebook', userId: 'test-facebook' };
  const users = [
    user(1, { identityProviders: [google, google] }),
    user(2, { state: 'banned', identityProviders: [facebook], profile: { displayName: 'Old provider' } }),
    user(3, { deleted: true }),
  ];
  const database = importDatabase();
  const report = await runAccountImport(database, importEnv, mockedSource(users).fetch);
  assert.deepEqual(report, { total: 2, roleReview: 1, restricted: 1, linkedIdentities: 2,
    customers: 1, providers: 0, banned: 1, deletedExcluded: 1 });
  const accountParams = database.calls.find(([sql]) => sql.includes('INSERT INTO accounts'))[1];
  const rows = JSON.parse(accountParams[0]);
  assert.deepEqual(rows.map(row => [row.id, row.role, row.status]), [
    [users[0].id, 'customer', 'active'], [users[1].id, null, 'restricted'],
  ]);
  assert.equal(rows[1].permissions.postListings, 'permission/deny');
  assert.deepEqual(database.calls.at(-2), ['COMMIT', undefined]);
});

test('refuses unsafe overlap and rolls back writes on a destination identity conflict', async () => {
  const userWithIdentity = user(1, { identityProviders: [{ idpId: 'google', userId: 'test-google' }] });
  const database = importDatabase({ identityCollision: true });
  const source = mockedSource([userWithIdentity]);
  await assert.rejects(runAccountImport(database, { ...importEnv, ACCOUNT_AUDIT_ENABLED: 'true' }, source.fetch),
    /switches to be off/);
  assert.deepEqual(source.requests, []);
  assert.deepEqual(database.calls, []);
  await assert.rejects(runAccountImport(database, importEnv, source.fetch), /Synthetic duplicate identity/);
  assert.deepEqual(database.calls.at(-2), ['ROLLBACK', undefined]);
});
