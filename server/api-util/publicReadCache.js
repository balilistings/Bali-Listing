// Cache only reads made through the anonymous SDK. Never use this for a user session.
module.exports = function publicReadCache({ ttlMs = 60000, maxEntries = 2000 } = {}) {
  const entries = new Map();
  const pending = new Map();
  const counts = { hit: 0, miss: 0, coalesced: 0 };
  const read = (key, load, observe = () => {}) => {
    const record = status => { counts[status] += 1; observe(status); };
    const entry = entries.get(key);
    if (entry && entry.expiresAt > Date.now()) { record('hit'); return Promise.resolve(entry.value); }
    entries.delete(key);
    if (pending.has(key)) { record('coalesced'); return pending.get(key); }
    record('miss');
    const fetchedAt = Date.now();
    const promise = Promise.resolve().then(load).then(value => {
      if (entries.size >= maxEntries) entries.delete(entries.keys().next().value);
      entries.set(key, { value, expiresAt: fetchedAt + ttlMs });
      return value;
    }).finally(() => pending.delete(key));
    pending.set(key, promise);
    return promise;
  };
  read.stats = () => ({ ...counts });
  return read;
};
