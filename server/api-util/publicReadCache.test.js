const publicReadCache = require('./publicReadCache');

test('releases expired responses without revisiting their keys', async () => {
  jest.useFakeTimers();
  try {
    const cache = publicReadCache({ ttlMs: 1000 });
    await cache('abandoned', () => ({ data: 'x'.repeat(10000) }));
    expect(cache.usage().estimatedBytes).toBeGreaterThan(10000);
    jest.advanceTimersByTime(1001);
    expect(cache.usage()).toMatchObject({ entries: 0, estimatedBytes: 0, pending: 0 });
  } finally { jest.useRealTimers(); }
});

test('bounds large payload retention and evicts least recently used entries', async () => {
  const cache = publicReadCache({ maxBytes: 11000, maxEntryBytes: 11000 });
  const load = jest.fn(() => ({ data: 'x'.repeat(1000) }));
  await cache('a', load); await cache('b', load); await cache('a', load);
  await cache('c', load); await cache('a', load);
  expect(load).toHaveBeenCalledTimes(3);
  await cache('b', load);
  expect(load).toHaveBeenCalledTimes(4);
  for (let i = 0; i < 1000; i++) await cache(String(i), load);
  expect(cache.usage().estimatedBytes).toBeLessThanOrEqual(11000);
  expect(cache.usage().entries).toBeLessThanOrEqual(2);
});

test('returns oversized and unserializable values without retaining them', async () => {
  const cache = publicReadCache({ maxEntryBytes: 1000 });
  const big = { data: 'x'.repeat(1000) };
  expect(await cache('large', () => big)).toBe(big);
  const unusual = { fn: () => {} };
  expect(await cache('unusual', () => unusual)).toBe(unusual);
  expect(cache.usage().entries).toBe(0);
});

test('bounds outstanding loads while preserving duplicate coalescing and recovery', async () => {
  const cache = publicReadCache({ maxPending: 1 });
  let finish;
  const first = cache('a', () => new Promise(resolve => { finish = resolve; }));
  const duplicate = cache('a', () => { throw new Error('must coalesce'); });
  const blocked = jest.fn();
  await expect(cache('b', blocked)).rejects.toMatchObject({ status: 503 });
  expect(blocked).not.toHaveBeenCalled();
  finish('done');
  expect(await duplicate).toBe(await first);
  expect(await cache('b', () => 'recovered')).toBe('recovered');
});

test('does not retain responses completing after their freshness window', async () => {
  jest.useFakeTimers();
  try {
    const cache = publicReadCache({ ttlMs: 1000 });
    let finish;
    const pending = cache('slow', () => new Promise(resolve => { finish = resolve; }));
    await Promise.resolve();
    jest.advanceTimersByTime(1001); finish('ok');
    expect(await pending).toBe('ok');
    expect(cache.usage().entries).toBe(0);
  } finally { jest.useRealTimers(); }
});

test('coalesces concurrent reads, reuses results and expires them', async () => {
  jest.useFakeTimers();
  const cache = publicReadCache({ ttlMs: 1000 });
  const load = jest.fn().mockResolvedValue({ result: 'public' });
  const [a, b] = await Promise.all([cache('listing:1', load), cache('listing:1', load)]);
  expect(a).toBe(b);
  expect(load).toHaveBeenCalledTimes(1);
  await cache('listing:1', load);
  expect(load).toHaveBeenCalledTimes(1);
  expect(cache.stats()).toEqual({ miss: 1, coalesced: 1, hit: 1 });
  jest.advanceTimersByTime(1001);
  await cache('listing:1', load);
  expect(load).toHaveBeenCalledTimes(2);
  jest.useRealTimers();
});

test('does not cache errors and evicts old entries at its size limit', async () => {
  const cache = publicReadCache({ maxEntries: 1 });
  await expect(cache('a', () => Promise.reject(new Error('offline')))).rejects.toThrow('offline');
  const load = jest.fn().mockResolvedValue('ok');
  await cache('a', load);
  await cache('b', load);
  await cache('a', load);
  expect(load).toHaveBeenCalledTimes(3);
});
