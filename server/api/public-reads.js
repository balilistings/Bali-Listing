const { getReadSdk, serialize, handleError, getPublicReadCacheStats } = require('../api-util/sdk');
const { types: { LatLng, LatLngBounds } } = require('sharetribe-flex-sdk');
let lastReport = 0;
const read = resource => async (req, res) => {
  const params = req.body?.params;
  if (!params || typeof params !== 'object' || Array.isArray(params)) return res.status(400).json({ error: 'Invalid query' });
  try {
    // Transit preserves the corner coordinates but not the LatLngBounds prototype.
    // Restore it before the SDK serializes the browser's location search.
    const bounds = params.bounds;
    let queryParams = params;
    if (bounds && typeof bounds === 'object' && !(bounds instanceof LatLngBounds)) {
      const validCorner = p => p && Number.isFinite(p.lat) && Number.isFinite(p.lng)
        && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180;
      if (bounds._sdkType !== 'LatLngBounds' || !validCorner(bounds.ne) || !validCorner(bounds.sw)) {
        return res.status(400).json({ error: 'Invalid location bounds' });
      }
      queryParams = { ...params, bounds: new LatLngBounds(
        new LatLng(bounds.ne.lat, bounds.ne.lng), new LatLng(bounds.sw.lat, bounds.sw.lng)
      ) };
    }
    // The caller's Marketplace permissions are preserved, including private-marketplace restrictions.
    const response = await getReadSdk(req, res)[resource].query(resource === 'reviews' ? { ...queryParams, state: 'public' } : queryParams);
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
