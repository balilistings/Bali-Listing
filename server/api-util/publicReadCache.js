// Cache only reads made through the anonymous SDK. Never use this for a user session.
module.exports = function publicReadCache({ ttlMs = 60000, maxEntries = 2000 } = {}) {
  const entries = new Map();
  const pending = new Map();
  return (key, load) => {
    const entry = entries.get(key);
    if (entry && entry.expiresAt > Date.now()) return Promise.resolve(entry.value);
    entries.delete(key);
    if (pending.has(key)) return pending.get(key);
    const promise = Promise.resolve().then(load).then(value => {
      if (entries.size >= maxEntries) entries.delete(entries.keys().next().value);
      entries.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    }).finally(() => pending.delete(key));
    pending.set(key, promise);
    return promise;
  };
};
