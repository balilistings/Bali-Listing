const { getSdk, isLoginAsSession } = require('../api-util/sdk');
const DAY = 86400000;
const validDate = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const fail = (res, error) => res.status([401, 403, 404].includes(error.status) ? error.status : 500).json({ error: 'Unable to save. Please sign in and try again.' });
const prepare = (req, res) => {
  res.set('Cache-Control', 'private, no-store');
  if (req.get('Sec-Fetch-Site') === 'cross-site') {
    res.status(403).json({ error: 'Cross-site requests are not allowed.' });
    return false;
  }
  if (isLoginAsSession(req)) {
    res.status(403).json({ error: 'Operator impersonation does not count as provider activity or availability confirmation.' });
    return false;
  }
  return true;
};
exports.recordActivity = async (req, res) => {
  if (!prepare(req, res)) return;
  try {
    const sdk = getSdk(req, res);
    const user = (await sdk.currentUser.show()).data.data;
    const previous = user.attributes.profile.privateData?.blLastActiveAt;
    const now = Date.now();
    if (validDate(previous) && Date.parse(previous) <= now && now - Date.parse(previous) < DAY) {
      return res.json({ lastActiveAt: previous });
    }
    const lastActiveAt = new Date(now).toISOString();
    await sdk.currentUser.updateProfile({ privateData: { blLastActiveAt: lastActiveAt } });
    return res.json({ lastActiveAt });
  } catch (error) { return fail(res, error); }
};
exports.confirmAvailability = async (req, res) => {
  if (!prepare(req, res)) return;
  const { listingId } = req.body || {};
  if (typeof listingId !== 'string' || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(listingId)) {
    return res.status(400).json({ error: 'A valid listing is required.' });
  }
  try {
    const sdk = getSdk(req, res);
    // ownListings enforces ownership using this request's authenticated session.
    const listing = (await sdk.ownListings.show({ id: listingId })).data.data;
    if (listing.attributes.state !== 'published') {
      return res.status(409).json({ error: 'Only published listings can be confirmed available.' });
    }
    const confirmedAvailableAt = new Date().toISOString();
    await sdk.ownListings.update({ id: listingId, privateData: { blAvailabilityConfirmedAt: confirmedAvailableAt } });
    return res.json({ confirmedAvailableAt });
  } catch (error) { return fail(res, error); }
};
