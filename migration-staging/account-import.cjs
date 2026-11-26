'use strict';

const { AccountPilotError } = require('./account-pilot.cjs');
const { scanAccounts } = require('./account-audit.cjs');

const blockers = [
  'unknownState', 'missingCoreDetails', 'missingPermissions', 'identityDataUnavailable',
  'invalidIdentity', 'duplicateEmails', 'duplicateIdentities', 'otherLinked',
];

async function writeAccounts(database, accounts, identities) {
  const client = await database.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(961032071)');
    const ids = accounts.map(account => account.id);
    const alreadyImported = await client.query(
      'SELECT count(*)::int AS count FROM accounts WHERE sharetribe_state IS NOT NULL AND NOT (id = ANY($1::uuid[]))',
      [ids],
    );
    if (alreadyImported.rows[0].count !== 0) {
      throw new AccountPilotError('Source snapshot omits previously imported accounts; reconcile before rerunning');
    }
    const accountWrite = await client.query(
      `INSERT INTO accounts (
        id, display_name, role, status, email, email_verified, created_at,
        sharetribe_state, sharetribe_permissions, sharetribe_profile
      )
      SELECT id, display_name, role, status, email, email_verified, created_at, source_state, permissions, profile
      FROM jsonb_to_recordset($1::jsonb) AS incoming(
        id uuid, display_name text, role text, status text, email text, email_verified boolean,
        created_at timestamptz, source_state text, permissions jsonb, profile jsonb
      )
      ON CONFLICT (id) DO UPDATE SET
        display_name = EXCLUDED.display_name, role = EXCLUDED.role, status = EXCLUDED.status,
        email = EXCLUDED.email, email_verified = EXCLUDED.email_verified, created_at = EXCLUDED.created_at,
        sharetribe_state = EXCLUDED.sharetribe_state, sharetribe_permissions = EXCLUDED.sharetribe_permissions,
        sharetribe_profile = EXCLUDED.sharetribe_profile
      WHERE accounts.sharetribe_state IS NOT NULL`,
      [JSON.stringify(accounts)],
    );
    if (accountWrite.rowCount !== accounts.length) {
      throw new AccountPilotError('Sharetribe account IDs conflict with local accounts');
    }
    await client.query(
      "DELETE FROM account_identities WHERE account_id = ANY($1::uuid[]) AND provider IN ('google', 'facebook')",
      [ids],
    );
    const identityWrite = await client.query(
      `INSERT INTO account_identities (provider, subject, account_id)
       SELECT provider, subject, account_id
       FROM jsonb_to_recordset($1::jsonb) AS incoming(provider text, subject text, account_id uuid)`,
      [JSON.stringify(identities)],
    );
    if (identityWrite.rowCount !== identities.length) {
      throw new AccountPilotError('Written Sharetribe identity count did not reconcile');
    }
    const verification = await client.query(
      `SELECT count(*)::int AS total,
         count(*) FILTER (WHERE role IS NULL AND status = 'restricted')::int AS "roleReview",
         count(*) FILTER (WHERE status = 'restricted')::int AS restricted
       FROM accounts WHERE id = ANY($1::uuid[]) AND sharetribe_state IS NOT NULL`,
      [ids],
    );
    const { total, roleReview, restricted } = verification.rows[0];
    if (total !== accounts.length || roleReview !== accounts.filter(account => account.role === null).length ||
        restricted !== accounts.filter(account => account.status === 'restricted').length) {
      throw new AccountPilotError('Staging account records did not reconcile');
    }
    await client.query('COMMIT');
    return { total, roleReview, restricted, linkedIdentities: identityWrite.rowCount };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function runAccountImport(database, env, fetchImpl = fetch) {
  if (env.ACCOUNT_BULK_IMPORT_ENABLED !== 'true') return undefined;
  if (['true', 'preflight'].includes(env.ACCOUNT_PILOT_ENABLED) || env.ACCOUNT_AUDIT_ENABLED === 'true') {
    throw new AccountPilotError('Bulk import requires the audit and pilot switches to be off');
  }
  const accounts = [];
  const identities = [];
  const report = await scanAccounts(env, fetchImpl, ({ identities: sourceIdentities, ...account }) => {
    accounts.push(account);
    const seen = new Set();
    for (const identity of sourceIdentities) {
      if (typeof identity?.idpId !== 'string' || typeof identity.userId !== 'string') continue;
      const key = JSON.stringify([identity.idpId, identity.userId]);
      if (seen.has(key)) continue;
      seen.add(key);
      identities.push({ provider: identity.idpId, subject: identity.userId, account_id: account.id });
    }
  });
  if (!accounts.length || accounts.length !== report.total - report.deleted || blockers.some(key => report[key])) {
    throw new AccountPilotError('Source account conflicts or incomplete metadata prevented the bulk import');
  }
  const written = await writeAccounts(database, accounts, identities);
  return { ...written, customers: report.customers, providers: report.providers,
    banned: report.banned, deletedExcluded: report.deleted };
}

module.exports = { runAccountImport };
