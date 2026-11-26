'use strict';

const { AccountPilotError, requireStaging, sharetribeGet, uuid, permissionNames } = require('./account-pilot.cjs');

const pageSize = 100;
const userFields = 'banned,deleted,state,createdAt,email,emailVerified,identityProviders,profile.publicData,profile.displayName';

async function runAccountAudit(env, fetchImpl = fetch) {
  if (env.ACCOUNT_AUDIT_ENABLED !== 'true') return undefined;
  requireStaging(env);
  const get = await sharetribeGet(env, fetchImpl);
  // Keep signups that arrive while paging outside this inventory.
  const createdAtEnd = new Date().toISOString();
  const ids = new Set();
  const emailOwners = new Map();
  const identityOwners = new Map();
  const duplicateEmails = new Set();
  const duplicateIdentities = new Set();
  const stats = {
    total: 0, customers: 0, providers: 0, unknownRole: 0,
    active: 0, pending: 0, banned: 0, deleted: 0, unknownState: 0,
    emailVerified: 0, googleLinked: 0, facebookLinked: 0, otherLinked: 0, facebookWithoutGoogle: 0,
    identityDataUnavailable: 0, invalidIdentity: 0, missingCoreDetails: 0, missingPermissions: 0,
  };
  let expected;
  let lastPage;
  for (let page = 1; page <= (lastPage ?? 1); page += 1) {
    const doc = await get('users/query', {
      page, perPage: pageSize, createdAtEnd, include: 'effectivePermissionSet',
      'fields.user': userFields,
    });
    const { totalItems, totalPages, perPage } = doc.meta ?? {};
    if (!Array.isArray(doc.data) || doc.meta?.page !== page ||
        !Number.isSafeInteger(totalItems) || totalItems < 0 ||
        perPage !== pageSize || ![Math.ceil(totalItems / pageSize), Math.max(1, Math.ceil(totalItems / pageSize))].includes(totalPages) ||
        (expected !== undefined && totalItems !== expected) ||
        doc.data.length !== Math.min(pageSize, totalItems - (page - 1) * pageSize)) {
      throw new AccountPilotError('Sharetribe account pagination changed or was incomplete');
    }
    expected = totalItems;
    lastPage = totalPages;
    const permissions = new Map((doc.included ?? [])
      .filter(entry => entry.type === 'permissionSet').map(entry => [entry.id, entry.attributes]));
    for (const user of doc.data) {
      if (user.type !== 'user' || !uuid.test(user.id ?? '') || !user.attributes || ids.has(user.id)) {
        throw new AccountPilotError('Sharetribe returned invalid or repeated accounts');
      }
      ids.add(user.id);
      const a = user.attributes;
      if (a.deleted) {
        stats.deleted += 1;
        continue;
      }
      const role = a.profile?.publicData?.userType;
      if (role === 'customer') stats.customers += 1;
      else if (role === 'provider') stats.providers += 1;
      else stats.unknownRole += 1;
      if (a.state === 'banned' || a.banned) stats.banned += 1;
      else if (a.state === 'pendingApproval') stats.pending += 1;
      else if (a.state === 'active') stats.active += 1;
      else stats.unknownState += 1;

      const email = typeof a.email === 'string' ? a.email.trim().toLowerCase() : '';
      if (!email || typeof a.emailVerified !== 'boolean' || !Number.isFinite(Date.parse(a.createdAt)) ||
          typeof a.profile?.displayName !== 'string' || !a.profile.displayName.trim()) {
        stats.missingCoreDetails += 1;
      }
      if (email) {
        if (emailOwners.has(email)) duplicateEmails.add(email);
        else emailOwners.set(email, user.id);
      }
      if (a.emailVerified === true) stats.emailVerified += 1;
      const effective = permissions.get(user.relationships?.effectivePermissionSet?.data?.id);
      if (!effective || !permissionNames.every(name => ['permission/allow', 'permission/deny'].includes(effective[name]))) {
        stats.missingPermissions += 1;
      }

      if (!Array.isArray(a.identityProviders)) {
        stats.identityDataUnavailable += 1;
        continue;
      }
      const providers = new Set();
      let invalidIdentity = false;
      for (const identity of a.identityProviders) {
        const { idpId, userId } = identity ?? {};
        if (typeof idpId !== 'string' || !idpId.trim() || typeof userId !== 'string' || !userId.trim()) {
          invalidIdentity = true;
          continue;
        }
        providers.add(idpId);
        const identityKey = JSON.stringify([idpId, userId]);
        const owner = identityOwners.get(identityKey);
        if (owner && owner !== user.id) duplicateIdentities.add(identityKey);
        else identityOwners.set(identityKey, user.id);
      }
      if (invalidIdentity) stats.invalidIdentity += 1;
      if (providers.has('google')) stats.googleLinked += 1;
      if (providers.has('facebook')) stats.facebookLinked += 1;
      if (providers.has('facebook') && !providers.has('google')) stats.facebookWithoutGoogle += 1;
      if ([...providers].some(provider => provider !== 'facebook' && provider !== 'google')) stats.otherLinked += 1;
    }
  }
  if (ids.size !== expected) throw new AccountPilotError('Sharetribe account total did not reconcile');
  return { ...stats, total: ids.size, pages: lastPage, duplicateEmails: duplicateEmails.size,
    duplicateIdentities: duplicateIdentities.size };
}

module.exports = { runAccountAudit };
