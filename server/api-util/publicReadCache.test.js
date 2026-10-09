const publicReadCache = require('./publicReadCache');

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
