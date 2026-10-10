const { serialize } = require('v8');

// Count-only limits can retain hundreds of MB of expired listing/image data.
module.exports = function publicReadCache({ ttlMs = 60000, maxEntries = 256,
  maxBytes = 8 * 1024 * 1024, maxEntryBytes = 2 * 1024 * 1024, maxPending = 64 } = {}) {
  const entries = new Map();
  const pending = new Map();
  const counts = { hit: 0, miss: 0, coalesced: 0 };
  let estimatedBytes = 0;
  let sweepTimer;
  const remove = key => {
    const entry = entries.get(key);
    if (entry) { estimatedBytes -= entry.bytes; entries.delete(key); }
  };
  const prune = () => {
    const now = Date.now();
    for (const [key, entry] of entries) if (entry.expiresAt <= now) remove(key);
    if (!entries.size && sweepTimer) { clearInterval(sweepTimer); sweepTimer = undefined; }
  };
  const startSweep = () => {
    if (!sweepTimer) {
      sweepTimer = setInterval(prune, Math.max(1, Math.min(ttlMs, 10000)));
      if (sweepTimer.unref) sweepTimer.unref();
    }
  };
  const read = (key, load, observe = () => {}) => {
    const record = status => { counts[status] += 1; observe(status); };
    prune();
    const entry = entries.get(key);
    if (entry) {
      entries.delete(key); entries.set(key, entry);
      record('hit'); return Promise.resolve(entry.value);
    }
    if (pending.has(key)) { record('coalesced'); return pending.get(key); }
    if (pending.size >= maxPending) return Promise.reject(Object.assign(new Error('Public reads temporarily busy'), {
      status: 503, statusText: 'Service Unavailable', data: { error: 'Please retry shortly' },
    }));
    record('miss');
    const fetchedAt = Date.now();
    const promise = Promise.resolve().then(load).then(value => {
      prune();
      // Allow for JS object/string overhead; this is not a process heap limit.
      // Keep the original value to preserve SDK UUID/Money/Decimal prototypes.
      let bytes;
      try { bytes = 4 * (serialize(value).byteLength + Buffer.byteLength(key)) + 256; }
      catch (_) { return value; }
      if (fetchedAt + ttlMs <= Date.now() || bytes > maxEntryBytes || bytes > maxBytes || maxEntries < 1) return value;
      while (entries.size && (entries.size >= maxEntries || estimatedBytes + bytes > maxBytes)) remove(entries.keys().next().value);
      entries.set(key, { value, bytes, expiresAt: fetchedAt + ttlMs });
      estimatedBytes += bytes;
      startSweep();
      return value;
    }).finally(() => pending.delete(key));
    pending.set(key, promise);
    return promise;
  };
  read.stats = () => ({ ...counts });
  read.usage = () => ({ entries: entries.size, pending: pending.size, estimatedBytes, maxBytes });
  return read;
};
