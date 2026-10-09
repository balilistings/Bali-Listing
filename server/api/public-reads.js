const { getReadSdk, serialize, handleError, getPublicReadCacheStats } = require('../api-util/sdk');
let lastReport = 0;
const read = resource => async (req, res) => {
  const params = req.body?.params;
  if (!params || typeof params !== 'object' || Array.isArray(params)) return res.status(400).json({ error: 'Invalid query' });
  try {
    // The caller's Marketplace permissions are preserved, including private-marketplace restrictions.
    const response = await getReadSdk(req, res)[resource].query(resource === 'reviews' ? { ...params, state: 'public' } : params);
    res.set('Cache-Control', 'private, no-store');
    res.set('X-Public-Read-Cache', response.data.meta?.publicReadCache || 'bypass');
    if (Date.now() - lastReport > 60000) {
      lastReport = Date.now();
      console.info(JSON.stringify({ event: 'sharetribe_read_cache', counts: getPublicReadCacheStats() }));
    }
    return res.type('application/transit+json').send(serialize(response.data));
  } catch (error) { return handleError(res, error); }
};
exports.listings = read('listings');
exports.reviews = read('reviews');
