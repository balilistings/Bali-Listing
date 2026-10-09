// One bounded cache per browser SDK. Never retain responses across server requests or accounts.
const caches = new WeakMap();
export const canReusePublicRead = (state, config) => config?.accessControl?.marketplace?.private === false &&
  !state.auth?.isAuthenticated && !state.user?.currentUser;
export const publicReadKey = (kind, params, state) => JSON.stringify([kind, state.hostedAssets?.version, params]);

export const responseFromEntities = (state, ids, meta, fetchedAt, single = false) => {
  if (!ids || !fetchedAt) return null;
  const entities = state.marketplaceData?.entities || {};
  const primary = ids.map(id => entities.listing?.[id.uuid]);
  if (primary.some(entity => !entity)) return null;
  const included = new Map();
  const visit = resource => Object.values(resource.relationships || {}).forEach(relationship => {
    const refs = Array.isArray(relationship.data) ? relationship.data : [relationship.data];
    refs.filter(Boolean).forEach(ref => {
      const key = `${ref.type}:${ref.id.uuid}`;
      const entity = entities[ref.type]?.[ref.id.uuid];
      if (entity && !included.has(key) && !primary.includes(entity)) { included.set(key, entity); visit(entity); }
    });
  });
  primary.forEach(visit);
  return { data: { data: single ? primary[0] : primary,
    included: [...included.values()], meta: { ...meta, publicReadFetchedAt: fetchedAt } } };
};

export const reusePublicRead = (sdk, key, ttl, allowed, seed, load) => {
  const isBrowser = typeof window !== 'undefined';
  const stamp = (response, start) => ({ ...response, data: { ...response.data,
    meta: { ...response.data.meta, publicReadFetchedAt: response.data.meta?.publicReadFetchedAt || start } } });
  if (!allowed || !isBrowser) {
    if (isBrowser) caches.delete(sdk);
    const start = Date.now();
    return Promise.resolve().then(load).then(response => stamp(response, start));
  }
  let cache = caches.get(sdk);
  if (!cache) { cache = new Map(); caches.set(sdk, cache); }
  const save = (key, value) => {
    cache.delete(key);
    while (cache.size >= 20) cache.delete(cache.keys().next().value);
    cache.set(key, value);
  };
  const fresh = response => response?.data?.meta?.publicReadFetchedAt > Date.now() - ttl;
  const existing = cache.get(key);
  if (existing?.pending) return existing.pending;
  if (fresh(existing?.response)) return Promise.resolve(existing.response);
  if (fresh(seed)) { save(key, { response: seed }); return Promise.resolve(seed); }
  cache.delete(key);
  while (cache.size >= 20) cache.delete(cache.keys().next().value);
  const start = Date.now();
  const pending = Promise.resolve().then(load).then(response => {
    const result = stamp(response, start);
    save(key, { response: result });
    return result;
  }, error => { cache.delete(key); throw error; });
  cache.set(key, { pending });
  return pending;
};
