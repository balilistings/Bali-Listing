const DAY = 86400000;
const status = (value, now) => {
  const time = typeof value === 'string' ? Date.parse(value) : NaN;
  if (!Number.isFinite(time) || time > now) return { status: 'Unknown', lastRecordedAt: '', followUpOn: '' };
  return { status: now - time >= 60 * DAY ? 'Follow up' : 'Current', lastRecordedAt: new Date(time).toISOString(), followUpOn: new Date(time + 60 * DAY).toISOString() };
};
const id = value => typeof value === 'string' ? value : value?.uuid;
const buildReport = (users, listings, now = Date.now()) => {
  const byId = new Map(users.map(user => [id(user.id), user]));
  const providers = new Map();
  const rows = listings.filter(l => l.attributes.state === 'published' && !l.attributes.deleted).map(listing => {
    const authorId = id(listing.relationships?.author?.data?.id);
    const user = byId.get(authorId);
    const profile = user?.attributes?.profile || {};
    const name = profile.displayName || [profile.firstName, profile.lastName].filter(Boolean).join(' ') || authorId || 'Unknown provider';
    if (!providers.has(authorId)) providers.set(authorId, {
      providerId: authorId, provider: name, email: user?.attributes?.email || '', publishedListings: 0,
      ...status(profile.privateData?.blLastActiveAt, now), listingsDue: 0, listingsUnknown: 0,
    });
    const provider = providers.get(authorId);
    const row = { listingId: id(listing.id), title: listing.attributes.title, providerId: authorId, provider: name,
      ...status(listing.attributes.privateData?.blAvailabilityConfirmedAt, now) };
    provider.publishedListings++;
    if (row.status === 'Follow up') provider.listingsDue++;
    if (row.status === 'Unknown') provider.listingsUnknown++;
    return row;
  });
  return { generatedAt: new Date(now).toISOString(), thresholdDays: 60, providers: [...providers.values()], listings: rows };
};
const fetchAll = async (query, params) => {
  const rows = [];
  for (let page = 1, totalPages = 1; page <= totalPages; page++) {
    const response = await query({ ...params, page, perPage: 100 });
    const { data, meta } = response.data;
    if (!Array.isArray(data) || !Number.isInteger(meta?.totalPages)) throw new Error('Incomplete report response');
    rows.push(...data);
    totalPages = meta.totalPages;
  }
  return rows;
};
module.exports = { status, buildReport, fetchAll };
