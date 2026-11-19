// Keep one public cover for discovery. Full galleries use authenticated reads.
// This reduces URLs exposed by our site; it does not revoke existing CDN URLs.
const restrictListingImages = (response, authenticated = false) => {
  if (!response?.data || typeof response.data !== 'object') return response;
  const data = response.data;
  const roots = Array.isArray(data.data) ? data.data : [data.data];
  const listings = [...roots, ...(data.included || [])].filter(r =>
    r && (r.type === 'listing' || r.relationships?.images)
  );
  const allowed = new Set();
  const restricted = new Set();
  const closed = new Set();
  const updated = new Map();
  listings.forEach(listing => {
    const images = listing.relationships?.images?.data || [];
    const isClosed = listing.attributes?.state === 'closed';
    images.forEach((image, index) => {
      const id = image.id?.uuid;
      if (isClosed) closed.add(id);
      else if (authenticated || index === 0) allowed.add(id);
      else restricted.add(id);
    });
    updated.set(listing, {
      ...listing,
      attributes: { ...listing.attributes, galleryAccess: isClosed ? 'closed' : authenticated ? 'full' : 'preview' },
      ...(isClosed ? { relationships: { ...listing.relationships, images: { data: [] } } } : {}),
    });
  });
  const sanitize = resource => {
    if (updated.has(resource)) return updated.get(resource);
    const id = resource?.id?.uuid;
    if (resource?.type !== 'image' || allowed.has(id)) return resource;
    if (closed.has(id)) return null;
    if (restricted.has(id)) return {
      id: resource.id, type: 'image',
      attributes: { variants: {}, deferred: true, loginRequired: true },
    };
    return resource;
  };
  return { ...response, data: {
    ...data,
    data: Array.isArray(data.data) ? data.data.map(sanitize) : sanitize(data.data),
    ...(data.included ? { included: data.included.map(sanitize).filter(Boolean) } : {}),
  } };
};
const withListingImageAccess = (sdk, authenticated) => ({
  ...sdk,
  listings: {
    ...sdk.listings,
    ...Object.fromEntries(['show', 'query'].filter(method => sdk.listings?.[method]).map(method => [
      method,
      (...args) => {
        const [params = {}, ...options] = args;
        const fields = params['fields.listing'];
        const query = fields ? { ...params, 'fields.listing': [...new Set([
          ...(Array.isArray(fields) ? fields : String(fields).split(',')), 'state',
        ])] } : params;
        return Promise.resolve(sdk.listings[method](query, ...options))
          .then(async response => restrictListingImages(response,
            typeof authenticated === 'function' ? await authenticated() : authenticated));
      },
    ])),
  },
});
module.exports = { restrictListingImages, withListingImageAccess };
