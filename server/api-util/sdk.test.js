jest.mock('sharetribe-flex-sdk', () => ({
  types: { BigDecimal: class {} },
  tokenStore: {
    expressCookieStore: ({ req, res = {} }) => ({ getToken: () => req.token, setToken: token => { res.token = token; } }),
    memoryStore: () => { let token; return { getToken: () => token, setToken: value => { token = value; } }; },
  },
  createInstance: jest.fn(({ tokenStore }) => {
    const show = jest.fn().mockResolvedValue('listing');
    const reviews = jest.fn().mockResolvedValue('reviews');
    const alias = jest.fn().mockResolvedValue('assets');
    const version = jest.fn().mockResolvedValue('version');
    return {
    originalShow: show, originalReviews: reviews, originalAlias: alias, originalVersion: version,
    authInfo: () => Promise.resolve({ isAnonymous: !tokenStore.getToken()?.access_token }),
    loginAs: jest.fn(() => { tokenStore.setToken({ access_token: 'authenticated-user' }); return Promise.resolve(); }),
    listings: { query: jest.fn().mockResolvedValue('public listings'), show },
    reviews: { query: reviews },
    assetsByAlias: alias, assetsByVersion: version,
  }; }),
}));
jest.mock('sharetribe-flex-integration-sdk', () => ({ createInstance: jest.fn(() => ({})) }));
jest.mock('@aws-sdk/client-s3', () => ({ S3Client: jest.fn() }));
jest.mock('../log', () => ({ error: jest.fn() }));
const { getSdk, getReadSdk, getIntegrationSdk } = require('./sdk');

test('reuses anonymous SDK reads but isolates every user session', async () => {
  const publicSdk = getReadSdk({ headers: {} }, {});
  expect(getReadSdk({ headers: {} }, {})).toBe(publicSdk);
  const query = { id: 'listing1' };
  expect(await publicSdk.listings.show(query)).toBe('listing');
  await publicSdk.listings.show(query);
  const sdkModule = require('sharetribe-flex-sdk');
  const anonymousOriginal = sdkModule.createInstance.mock.results[0].value;
  // Calls returned through the wrapper are cached; user sessions get untouched methods.
  const user1 = getReadSdk({ token: { access_token: 'user1' } }, {});
  const user2 = getReadSdk({ token: { access_token: 'user2' } }, {});
  expect(user1).not.toBe(user2);
  expect(user1.listings).not.toBe(anonymousOriginal.listings);
  await user1.listings.show(query);
  await user1.listings.show(query);
  expect(user1.listings.show).toHaveBeenCalledTimes(2);
  expect(user2.listings.show).not.toHaveBeenCalled();
});

test('a login-as callback without a cookie cannot authenticate the shared anonymous SDK', async () => {
  const publicSdk = getReadSdk({ headers: {} }, {});
  const response = {};
  const loginSdk = getSdk({ headers: {} }, response);
  expect(loginSdk).not.toBe(publicSdk);
  await loginSdk.loginAs({ code: 'test-only' });
  expect(response.token).toEqual({ access_token: 'authenticated-user' });
  expect(await publicSdk.authInfo()).toEqual({ isAnonymous: true });
  expect(getSdk({ headers: {} }, {})).not.toBe(loginSdk);
});

test('cached public reads preserve all arguments including the response options', async () => {
  const sdk = getReadSdk({ headers: {} }, {});
  const module = require('sharetribe-flex-sdk');
  const original = module.createInstance.mock.results[0].value;
  // Public cache is keyed by the complete argument list, so differing options cannot collide.
  const query = { id: 'options-listing' };
  const instanceCount = module.createInstance.mock.calls.length;
  original.originalShow.mockClear();
  await sdk.listings.show(query, { expand: true });
  await sdk.listings.show(query, { expand: true });
  await sdk.listings.show(query, { expand: false });
  expect(module.createInstance).toHaveBeenCalledTimes(instanceCount);
  expect(original.originalShow.mock.calls).toEqual([[query, { expand: true }], [query, { expand: false }]]);
});

test('integration SDK retains its server-only token store between calls', () => {
  expect(getIntegrationSdk()).toBe(getIntegrationSdk());
  expect(require('sharetribe-flex-integration-sdk').createInstance).toHaveBeenCalledTimes(1);
});

test('public cache lifetimes keep mutable data short and immutable versions longer', async () => {
  const sdk = getReadSdk({}, {});
  let now = 1000000;
  const clock = jest.spyOn(Date, 'now').mockImplementation(() => now);
  const read = () => Promise.all([sdk.listings.show({ id: 'ttl' }), sdk.reviews.query({ listing_id: 'ttl' }), sdk.assetsByAlias({ paths: ['design/branding.json'], alias: 'ttl' }), sdk.assetsByAlias({ paths: ['general/access-control.json'], alias: 'ttl' }), sdk.assetsByVersion({ paths: ['design/branding.json'], version: 'ttl' })]);
  const originals = [sdk.originalShow, sdk.originalReviews, sdk.originalAlias, sdk.originalVersion];
  originals.forEach(mock => mock.mockClear());
  try {
    await read(); now += 61000; await read();
    expect(originals.map(m => m.mock.calls.length)).toEqual([2, 1, 3, 1]);
    now += 300000; await read();
    expect(originals.map(m => m.mock.calls.length)).toEqual([3, 2, 5, 1]);
    now += 86400000; await read();
    expect(originals.map(m => m.mock.calls.length)).toEqual([4, 3, 7, 2]);
  } finally { clock.mockRestore(); }
});
